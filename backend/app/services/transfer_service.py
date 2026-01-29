import random
from typing import Dict, List
from collections import Counter
from fastapi import HTTPException
from prisma import Prisma
from app import schemas
from app.services.team_service import get_user_team_full, carry_forward_team
from app.utils.team_algo import _normalize_8p3
from app.services.chip_service import is_wildcard_active


def validate_squad_structure(players: list):
    """
    Enforces the specific squad composition:
    Total: 11 Players
    Breakdown: 2 GK, 3 DEF, 3 MID, 3 FWD
    """
    
    # 1. Validate Total Size
    if len(players) != 11:
        raise HTTPException(
            status_code=400, 
            detail=f"Squad size invalid. Expected 11 players, received {len(players)}."
        )

    # 2. Define the Exact Requirements
    required_counts = {
        "GK": 2,
        "DEF": 3,
        "MID": 3,
        "FWD": 3
    }

    # 3. Count Positions in the provided list
    # NOTE: Adjust 'p.position' to 'p['position']' if passing raw dictionaries
    current_counts = Counter(p.position for p in players)

    # 4. Compare and Collect Errors
    errors = []
    for pos, limit in required_counts.items():
        actual = current_counts.get(pos, 0)
        if actual != limit:
            errors.append(f"{pos}: expected {limit}, got {actual}")

    # 5. Raise Error if Mismatch found
    if errors:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid Squad Structure. {'; '.join(errors)}"
        )

    return True



async def transfer_player(
    db: Prisma,
    user_id: str,
    gameweek_id: int,
    out_player_id: int,
    in_player_id: int,
):

    await carry_forward_team(db, user_id, gameweek_id)
    user = await db.user.find_unique(where={'id': user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    wildcard = await is_wildcard_active(db, user_id, gameweek_id)

    # 1) Find outgoing row
    out_entry = await db.userteam.find_first(
        where={'user_id': user_id, 'gameweek_id': gameweek_id, 'player_id': out_player_id},
        include={'player': True},
    )
    if not out_entry:
        raise HTTPException(status_code=404, detail="Outgoing player is not in your team for this GW.")

    # 2) Prevent duplicates
    already = await db.userteam.find_first(
        where={'user_id': user_id, 'gameweek_id': gameweek_id, 'player_id': in_player_id}
    )
    if already:
        return await get_user_team_full(db, user_id, gameweek_id)

    # 3) Position check
    in_player = await db.player.find_unique(where={'id': in_player_id})
    if not in_player:
        raise HTTPException(status_code=404, detail="Incoming player not found.")
    if in_player.position != out_entry.player.position:
        raise HTTPException(status_code=400, detail="Position mismatch for transfer.")

    flags = {
        'is_benched': out_entry.is_benched,
        'is_captain': out_entry.is_captain,
        'is_vice_captain': out_entry.is_vice_captain,
    }

    # Decide charge policy before tx for clarity
    charge_transfers = bool(user.played_first_gameweek and not wildcard)

    async with db.tx() as tx:
        # swap
        await tx.userteam.delete_many(
            where={'user_id': user_id, 'gameweek_id': gameweek_id, 'player_id': out_player_id}
        )
        await tx.userteam.create(
            data={'user_id': user_id, 'gameweek_id': gameweek_id, 'player_id': in_player_id, **flags}
        )

        # log the transfer action
        await tx.transfer_log.create(
            data={
                'user_id': user_id,
                'gameweek_id': gameweek_id,
                'out_player': out_player_id,
                'in_player': in_player_id,
            }
        )

        if charge_transfers:
            if user.free_transfers and user.free_transfers > 0:
                # consume one free transfer
                await tx.user.update(
                    where={'id': user_id},
                    data={'free_transfers': {'decrement': 1}}
                )
            else:
                # apply a -4 hit for this transfer
                # upsert GW score row and increment hits by 4
                await tx.usergameweekscore.upsert(
                    where={'user_id_gameweek_id': {'user_id': user_id, 'gameweek_id': gameweek_id}},
                    create={
                        'user_id': user_id,
                        'gameweek_id': gameweek_id,
                        'total_points': 0,
                        'transfer_hits': 4,
                    },
                    update={'transfer_hits': {'increment': 4}},
                )
        # else: no cost during first GW or wildcard

    return await get_user_team_full(db, user_id, gameweek_id)


async def confirm_transfers(
    db: Prisma,
    user_id: str,
    gameweek_id: int,
    transfers: list[schemas.TransferItem],
):
    """
    Validates and commits a list of transfers.

    - Checks for an active WILDCARD chip.
    - If WILDCARD is active, allows unlimited transfers with no point cost.
    - If not, validates against the user's free transfers and calculates a point hit.
    - Performs all operations in a single transaction.
    """
    if not transfers:
        raise HTTPException(status_code=400, detail="No transfers provided.")

    async with db.tx() as tx:
        # Fetch essential user and gameweek data in one go
        user = await tx.user.find_unique(where={"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")

        # --- WILDCARD LOGIC ---
        # 1. Check if a wildcard is active for this user and gameweek
        active_chip = await tx.userchip.find_first(
            where={
                "user_id": user_id,
                "gameweek_id": gameweek_id,
                "chip": {"in": ["WILDCARD", "FREE_HIT"]}
            }
        )
        is_unlimited = active_chip is not None or (not user.played_first_gameweek)
        # ----------------------

        current_team = await tx.userteam.find_many(
            where={"user_id": user_id, "gameweek_id": gameweek_id},
            include={"player": True},
        )

        if not current_team:
            raise HTTPException(status_code=404, detail="User has no team for this gameweek.")
        
        # --- START: REVISED CAPTAIN RE-ASSIGNMENT LOGIC ---
        
        players_out_ids = {t.out_player_id for t in transfers}
        current_captain = next((p for p in current_team if p.is_captain), None)
        current_vice_captain = next((p for p in current_team if p.is_vice_captain), None)

        if current_captain and current_captain.player_id in players_out_ids:
            if current_vice_captain and current_vice_captain.player_id not in players_out_ids:
                # Use the compound unique key to ensure the correct record is updated
                await tx.userteam.update(
                    where={
                        "user_id_gameweek_id_player_id": {
                            "user_id": user_id,
                            "gameweek_id": gameweek_id,
                            "player_id": current_vice_captain.player_id,
                        }
                    },
                    data={
                        "is_captain": True,
                        "is_vice_captain": False
                    }
                )
        # --- END: REVISED CAPTAIN RE-ASSIGNMENT LOGIC ---


        # --- TRANSFER VALIDATION & COST CALCULATION ---
        is_unlimited_transfers = (active_chip is not None) or (not user.played_first_gameweek)

        transfer_hits = 0
        new_free_transfers = user.free_transfers
        num_transfers = len(transfers)

        if not is_unlimited_transfers:
            # This block now ONLY runs for existing players without a wildcard
            if num_transfers > user.free_transfers:
                paid_transfers = num_transfers - user.free_transfers
                transfer_hits = paid_transfers * 4  # 4 points per transfer
            
            # Deduct used transfers, but don't go below zero
            new_free_transfers = max(0, user.free_transfers - num_transfers)


        
        # --- (Your existing budget and squad validation logic would go here) ---
        # For now, we are focusing on the transfer cost logic.

        # --- EXECUTE TRANSFERS ---
        snap = [{
            "player_id": p.player_id,
            "is_benched": bool(p.is_benched),
            "is_captain": bool(p.is_captain),
            "is_vice_captain": bool(p.is_vice_captain),
        } for p in current_team]
        by_id = {r["player_id"]: r for r in snap}

        # apply swaps in-memory
        for t in transfers:
            out_id, in_id = t.out_player_id, t.in_player_id
            out_row = by_id.get(out_id)
            if not out_row:
                raise HTTPException(400, f"Outgoing player {out_id} is not in your team.")
            inherited_bench = out_row["is_benched"]
            was_leader = out_row["is_captain"] or out_row["is_vice_captain"]
            by_id.pop(out_id)
            if in_id in by_id:
                raise HTTPException(400, "Incoming player already in team.")
            by_id[in_id] = {
                "player_id": in_id,
                "is_benched": False if was_leader else inherited_bench,
                "is_captain": False,
                "is_vice_captain": False,
            }
        
        # 1. Get the list of IDs for the final squad
        new_squad_ids = list(by_id.keys())

        # 2. Fetch the full player objects (needed to check 'position')
        new_squad_players = await tx.player.find_many(
            where={"id": {"in": new_squad_ids}}
        )

        # 3. Run the validation (Enforces 2 GK, 3 DEF, 3 MID, 3 FWD)
        validate_squad_structure(new_squad_players)
        # --- VALIDATION BLOCK END ---
        
        has_cap  = any(r["is_captain"] for r in by_id.values())
        has_vice = any(r["is_vice_captain"] for r in by_id.values())

        if not (has_cap and has_vice):
            # clear any partial flags
            for r in by_id.values():
                r["is_captain"] = False
                r["is_vice_captain"] = False

            starters = [pid for pid, r in by_id.items() if not r["is_benched"]]
            pool = starters if len(starters) >= 2 else list(by_id.keys())

            cap_id, vice_id = random.sample(pool, 2)
            by_id[cap_id]["is_captain"] = True
            by_id[vice_id]["is_vice_captain"] = True

        # then normalize and write
        new_snapshot = await _normalize_8p3(tx, list(by_id.values()))

        # --- WRITE + LOG ATOMICALLY ---
        old_ids = {p.player_id for p in current_team}
        new_ids = {r["player_id"] for r in new_snapshot}
        removed_ids = old_ids - new_ids
        added_ids   = new_ids - old_ids

        await tx.userteam.delete_many(where={"user_id": user_id, "gameweek_id": gameweek_id})
        await tx.userteam.create_many(data=[
            {"user_id": user_id, "gameweek_id": gameweek_id, **r} for r in new_snapshot
        ])

        for pid in removed_ids:
            await tx.transfer_log.create(data={"user_id": user_id, "gameweek_id": gameweek_id, "out_player": int(pid), "in_player": None})
        for pid in added_ids:
            await tx.transfer_log.create(data={"user_id": user_id, "gameweek_id": gameweek_id, "out_player": None, "in_player": int(pid)})


        # --- UPDATE USER STATE ---
        if not is_unlimited_transfers:
            await tx.user.update(
                where={"id": user_id},
                data={"free_transfers": new_free_transfers}
            )
            if transfer_hits > 0:
                await tx.usergameweekscore.upsert(
                    where={"user_id_gameweek_id": {"user_id": user_id, "gameweek_id": gameweek_id}},
                    data={
                        "create": {"user_id": user_id, "gameweek_id": gameweek_id, "transfer_hits": transfer_hits},
                        "update": {"transfer_hits": {"increment": transfer_hits}},
                    },
                )


    # Return the updated team view
    return await get_user_team_full(db, user_id, gameweek_id)

