from fastapi import HTTPException
from prisma import Prisma

async def _normalize_8p3(db: Prisma, snapshot: list[dict]) -> list[dict]:
    # snapshot rows: {'player_id', 'is_benched', 'is_captain', 'is_vice_captain'}
    if len(snapshot) != 11 or len({r['player_id'] for r in snapshot}) != 11:
        raise HTTPException(400, "Exactly 11 unique players required.")

    ids = [r['player_id'] for r in snapshot]
    meta = await db.player.find_many(where={'id': {'in': ids}})
    pos = {p.id: p.position for p in meta}

    by_id = {r['player_id']: {**r} for r in snapshot}
    gks = [pid for pid in ids if pos[pid] == 'GK']

    if len(gks) != 2:
        raise HTTPException(400, "Squad must have exactly 2 goalkeepers.")

    # captain/vice must exist, be different, and be starters
    cap = next((r for r in by_id.values() if r['is_captain']), None)
    vice = next((r for r in by_id.values() if r['is_vice_captain']), None)
    if not cap or not vice or cap['player_id'] == vice['player_id']:
        raise HTTPException(400, "Exactly one captain and one vice-captain required, and they must differ.")
    cap['is_benched'] = False
    vice['is_benched'] = False

    # exactly one GK benched
    benched_gks = [pid for pid in gks if by_id[pid]['is_benched']]
    if len(benched_gks) < 1:
        by_id[gks[1]]['is_benched'] = True
    elif len(benched_gks) > 1:
        # start the first, bench the second deterministically
        by_id[benched_gks[0]]['is_benched'] = False
        by_id[benched_gks[1]]['is_benched'] = True

    # exactly 3 benched total; prefer benching outfielders, never bench cap/vice
    protected = {cap['player_id'], vice['player_id']}
    benched = [pid for pid, r in by_id.items() if r['is_benched']]
    if len(benched) != 3:
        # unbench extras first
        while len(benched) > 3:
            pid = next(p for p in benched if p not in protected and pos[p] != 'GK')
            by_id[pid]['is_benched'] = False
            benched.remove(pid)
        # add benches if short
        while len(benched) < 3:
            pid = next(p for p, r in by_id.items()
                       if not r['is_benched'] and p not in protected and pos[p] != 'GK')
            by_id[pid]['is_benched'] = True
            benched.append(pid)

    # starting XI: exactly 1 GK starter and at least 2 DEF starters
    starters = [pid for pid, r in by_id.items() if not r['is_benched']]
    if sum(1 for pid in starters if pos[pid] == 'GK') != 1:
        # flip the benched GK/started GK to satisfy
        for pid in gks:
            by_id[pid]['is_benched'] = not by_id[pid]['is_benched']
        starters = [pid for pid, r in by_id.items() if not r['is_benched']]
    if sum(1 for pid in starters if pos[pid] == 'DEF') < 2:
        # force-bench a non-DEF and start a DEF if needed
        need = 2 - sum(1 for pid in starters if pos[pid] == 'DEF')
        for _ in range(need):
            benchable = next(p for p in starters if pos[p] != 'DEF' and p not in protected)
            startable = next(p for p, r in by_id.items() if r['is_benched'] and pos[p] == 'DEF')
            by_id[benchable]['is_benched'] = True
            by_id[startable]['is_benched'] = False

    return [by_id[pid] for pid in sorted(by_id)]