import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// --- COMPONENT IMPORTS ---
import { TransfersHeroCard } from '@/components/transfers/TransfersHeroCard';
import { TransferPitchView } from '@/components/transfers/TransferPitchView';
import { PlayerSelectionList, PlayerSelectionModal } from '@/components/transfers/PlayerSelection';
import { EnterSquadModal } from '@/components/transfers/EnterSquadModal';
import { Button } from '@/components/ui/button';
import { TeamResponse } from "@/types";

// --- CONFIGURATION ---
const initialSquad = {
  GK: [null, null],
  DEF: [null, null, null],
  MID: [null, null, null],
  FWD: [null, null, null],
};
const serializeSquad = (sq: any) => JSON.stringify({
  GK:  (sq.GK  ?? []).map(p => p ? p.id : null),
  DEF: (sq.DEF ?? []).map(p => p ? p.id : null),
  MID: (sq.MID ?? []).map(p => p ? p.id : null),
  FWD: (sq.FWD ?? []).map(p => p ? p.id : null),
  caps: {
    c: Object.values(sq).flat().find((p: any) => p?.isCaptain || p?.is_captain)?.id ?? null,
    v: Object.values(sq).flat().find((p: any) => p?.isVice || p?.is_vice_captain)?.id ?? null,
  },
  bench: Object.fromEntries(
    Object.entries(sq).map(([k, arr]: any) => [
      k,
      (arr ?? []).map((p: any) => !!(p?.is_benched ?? p?.isBenched)),
    ])
  ),
});

// Ensures: exactly 3 benched (exactly 1 GK), exactly 1 C, exactly 1 VC, C/VC not benched
function buildPlayersPayloadFromSquad(squad: any) {
  const order = ["GK", "DEF", "MID", "FWD"];
  const flat = order.flatMap(pos =>
    (squad[pos] ?? []).filter(Boolean).map((p: any) => ({
      id: p.id,
      position: String(p.pos ?? p.position ?? "").toUpperCase(),
      is_captain: !!(p.is_captain ?? p.isCaptain),
      is_vice_captain: !!(p.is_vice_captain ?? p.isVice),
      is_benched: !!(p.is_benched ?? p.isBenched),
    }))
  );
  if (flat.length !== 11) return flat;

  // 1) Exactly 1 GK benched
  const gks = flat.filter(p => p.position === "GK");
  if (gks.length === 2) {
    // make the first GK in UI the starter, bench the other
    const gkBucket = (squad.GK ?? []).filter(Boolean);
    const starterGKId = gkBucket[0]?.id ?? gks[0].id;
    gks.forEach(gk => (gk.is_benched = gk.id !== starterGKId));
  }

  // 2) Make sure total benched == 3
  const captain = flat.find(p => p.is_captain) || null;
  const vice    = flat.find(p => p.is_vice_captain) || null;
  const protectedIds = new Set([captain?.id, vice?.id].filter(Boolean) as number[]);
  const benchSet = new Set(flat.filter(p => p.is_benched).map(p => p.id));
  const need = 3 - benchSet.size;

  if (need > 0) {
    // bench rightmost outfielders not C/VC
    const candidates = ["FWD","MID","DEF"]
      .flatMap(pos => (squad[pos] ?? []).slice().reverse())
      .filter(Boolean)
      .map((p:any) => flat.find(x => x?.id === p.id))
      .filter((p:any) => p && p.position !== "GK" && !protectedIds.has(p.id) && !benchSet.has(p.id));
    for (let i = 0; i < need && i < candidates.length; i++) {
      candidates[i].is_benched = true;
      benchSet.add(candidates[i].id);
    }
  } else if (need < 0) {
    // unbench extra outfielders first (keep exactly 1 GK benched)
    const extras = flat.filter(p => p.is_benched && p.position !== "GK" && !protectedIds.has(p.id))
                       .slice(0, Math.abs(need));
    extras.forEach(p => (p.is_benched = false));
  }

  // 3) C/VC not benched and distinct
  if (captain && captain.is_benched) captain.is_benched = false;
  if (vice && vice.is_benched) vice.is_benched = false;
  if (captain && vice && captain.id === vice.id) {
    vice.is_vice_captain = false;
    const starter = flat.find(p => !p.is_benched && p.id !== captain.id && p.position !== "GK");
    if (starter) starter.is_vice_captain = true;
  }

  return flat;
}

const Transfers: React.FC = () => {
  const [squad, setSquad] = useState(initialSquad);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isPlayerSelectionOpen, setIsPlayerSelectionOpen] = useState(false);
  const [isEnterSquadModalOpen, setIsEnterSquadModalOpen] = useState(false);
  const [positionToFill, setPositionToFill] = useState<{ position: string; index: number } | null>(null);
  const [outgoing, setOutgoing] = useState<any | null>(null);
  const [baseline, setBaseline] = useState<string>("");


  const handleStartTransfer = (player: any, pos: string, index: number) => {
  setPositionToFill({ position: pos, index });
  setOutgoing(player);
  setIsPlayerSelectionOpen(true); // open PlayerSelectionModal
};

  // NEW: detect existing team
  const [hasTeam, setHasTeam] = useState(false);
  const [existingTeamName, setExistingTeamName] = useState<string>('');

  const navigate = useNavigate();

  const token = localStorage.getItem("access_token");

  const normalizePos = (p: any) => {
    const key = String(p?.pos ?? p?.position ?? '').toUpperCase();
    return { ...p, pos: key };
  };

  const transformApiDataToSquad = (players: any[]) => {
  const newSquad = JSON.parse(JSON.stringify(initialSquad));
  players.forEach(raw => {
    const pos = String(raw?.pos ?? raw?.position ?? "").toUpperCase();
    if (!newSquad[pos]) return;

    const isBenched = !!(raw.is_benched ?? raw.isBenched);
    const isCaptain = !!(raw.is_captain ?? raw.isCaptain);
    const isVice    = !!(raw.is_vice_captain ?? raw.isVice);

    const idx = newSquad[pos].findIndex((s: any) => s === null);
    if (idx !== -1) {
      newSquad[pos][idx] = {
        ...raw,
        pos,
        // normalize flag aliases so either version works everywhere
        is_benched: isBenched,
        isBenched: isBenched,
        is_captain: isCaptain,
        isCaptain: isCaptain,
        is_vice_captain: isVice,
        isVice: isVice,
      };
    }
  });
  return newSquad;
};

  // change signature
const fetchAndSetTeam = async (opts?: { resetBaseline?: boolean }) => {
  const resetBaseline = opts?.resetBaseline ?? true;

  try {
    const response = await fetch("http://localhost:8000/teams/team", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      setHasTeam(false);
      setExistingTeamName('');
      setIsLoading(false);
      return;
    }

    const data: TeamResponse = await response.json();
    const playerCount =
  (data?.starting?.length ?? 0) + (data?.bench?.length ?? 0);

    setHasTeam(playerCount > 0);
    setExistingTeamName(data.team_name || '');

    const allPlayers = [...data.starting, ...data.bench];
    const populatedSquad = transformApiDataToSquad(allPlayers);
    setSquad(populatedSquad);

    if (resetBaseline) {
      setBaseline(serializeSquad(populatedSquad)); // ← only when asked
    }
  } catch (error) {
    console.error("Failed to fetch team:", error);
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
    fetchAndSetTeam();
  }, []);

  // Notification helper
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSlotClick = (position: string, index: number) => {
    setPositionToFill({ position, index });
    const playerInSlot = squad[position][index];
    setOutgoing(playerInSlot || null);
    if (window.innerWidth < 1024) setIsPlayerSelectionOpen(true);
  };

  const handleSaveTeam = async () => {
  const token = localStorage.getItem("access_token");

  // flatten your pitch state to the payload structure expected by backend
  // const players = Object.entries(squad).flatMap(([pos, arr]) =>
  //   (arr as any[])
  //     .filter(Boolean)
  //     .map(p => ({
  //       id: p.id,
  // position: p.pos ?? p.position,
  // is_captain: !!(p.isCaptain ?? p.is_captain),
  // is_vice_captain: !!(p.isVice ?? p.is_vice_captain),
  // is_benched: !!(p.is_benched ?? p.isBenched),               // you can pass bench flags if you track them
  //     }))
  // );

  
// const players = buildPlayersPayloadFromSquad(squad);
const players = buildPlayersPayloadFromSquad(squad);
const benchCount = players.filter(p => p.is_benched).length;
const gkBench = players.filter(p => p.is_benched && p.position === "GK").length;
const cap = players.find(p => p.is_captain)?.id;
const vc  = players.find(p => p.is_vice_captain)?.id;
console.log({ benchCount, gkBench, cap, vc, players });
  const res = await fetch("http://localhost:8000/teams/save-team", {

    

    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ players }),
  });

  if (!res.ok) {
    const msg = await res.text();
    console.error(msg);
    alert("Failed to save team");
    return;
  }

await fetchAndSetTeam();
setNotification({ message: "Team saved!", type: "success" });
};

  const handlePlayerSelect = async (player: any) => {
    setIsPlayerSelectionOpen(false);

    const rawPos =
      player?.pos ??
      player?.position ??
      player?.Pos ??
      player?.POSITION ??
      null;

    const posKey = typeof rawPos === "string" ? rawPos.toUpperCase() : null;
    if (!posKey || !Object.prototype.hasOwnProperty.call(squad, posKey)) {
      console.error("🚫 Unknown player position:", { player, posKey, squad });
      return;
    }

    if (positionToFill) {
      const outPlayer = outgoing;

      if (outPlayer) {
        // You already have a transfer endpoint — keep using it if you want live DB updates
        try {
          const res = await fetch("http://localhost:8000/teams/transfer", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
            body: JSON.stringify({
              out_player_id: outPlayer.id,
              in_player_id: player.id,
            }),
          });

          if (!res.ok) {
            const err = await res.text();
            throw new Error(err);
          }

          await fetchAndSetTeam({ resetBaseline: false });
        } catch (e) {
          console.error("Transfer failed:", e);
        }
      } else {
        // Empty slot → client-side insert
        setSquad((current) => {
          const next = { ...current };
          const arr = [...next[positionToFill.position]];
          arr[positionToFill.index] = player;
          next[positionToFill.position] = arr;
          return next;
        });
      }

      setPositionToFill(null);
      setOutgoing(null);
      return;
    }

    // First empty slot for pos
    const positionArray = squad[posKey];
    if (!Array.isArray(positionArray)) {
      console.error("🚫 Squad bucket is not an array:", posKey, positionArray);
      return;
    }
    const emptySlotIndex = positionArray.findIndex((slot) => slot === null);
    if (emptySlotIndex !== -1) {
      setSquad((current) => {
        const next = { ...current };
        const arr = [...next[posKey]];
        arr[emptySlotIndex] = player;
        next[posKey] = arr;
        return next;
      });
    } else {
      console.warn(`All ${posKey} slots are already full.`);
    }
  };

  const handlePlayerRemove = (position: string, index: number) => {
    setSquad(currentSquad => {
      const newSquad = { ...currentSquad };
      const positionArray = [...newSquad[position]];
      positionArray[index] = null;
      newSquad[position] = positionArray;
      return newSquad;
    });
  };

  const handleAutoFill = () => {
    showNotification('Autofill feature coming soon!', 'success');
  };

  const handleReset = () => {
    setSquad(initialSquad);
  };

  // CREATE/UPDATE submitter. If team exists, we reuse the server-stored name.
  const submitSquad = async (teamName: string) => {
    // const payload = {
    //   team_name: teamName,
    //   players: Object.entries(squad).flatMap(([position, playerArray]) =>
    //     playerArray
    //       .filter((p: any) => p !== null)
    //       .map((p: any) => ({
    //         id: p.id,
    //         position: p.pos ?? p.position,      // keep server happy
    //         is_captain: !!p.is_captain,
    //         is_vice_captain: !!p.is_vice_captain,
    //         is_benched: !!p.is_benched,
    //       }))
    //   ),
    // };
    const players = buildPlayersPayloadFromSquad(squad);
    const payload = { team_name: teamName, players };

    try {
      const response = await fetch("http://localhost:8000/teams/submit-team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      await response.json();
      navigate('/team');
    } catch (error) {
      console.error("Error submitting team:", error);
      showNotification('Failed to save team', 'error');
    }
  };

  // When the user has *no* team yet → we open the modal and pass the chosen name here
  const handleConfirmSquad = async (teamName: string) => {
    await submitSquad(teamName);
  };

  // When the user *already has* a team → no modal; just save with the existing name
  const handleSaveExistingTeam = async () => {
    const nameToUse = existingTeamName || 'My Team';
    await submitSquad(nameToUse);
  };

  const { playersSelected, bank } = useMemo(() => {
    const allPlayers = Object.values(squad).flat();
    const selectedCount = allPlayers.filter((p: any) => p !== null).length;
    const totalCost = allPlayers.reduce((acc: number, p: any) => acc + (p?.price || 0), 0);
    const remainingBank = 102.0 - totalCost;
    return { playersSelected: selectedCount, bank: remainingBank };
  }, [squad]);

  const dirty = useMemo(
  () => serializeSquad(squad) !== baseline,
  [squad, baseline]
);

  if (isLoading) {
    return <div className="p-4 text-center">Loading your squad...</div>;
  }

  return (
    <div className="w-full min-h-screen bg-white font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-10">
        <div className="hidden lg:block lg:col-span-4 h-screen overflow-y-auto p-4 border-r">
          <PlayerSelectionList
            onClose={() => {}}
            onPlayerSelect={handlePlayerSelect}
            positionFilter={positionToFill?.position}
            squad={squad}
          />
        </div>

        <div className="lg:col-span-6 flex flex-col h-screen">
          <div className="p-4 space-y-4">
            <TransfersHeroCard
              teamName={hasTeam ? existingTeamName || 'Your Team' : 'Pick a Team Name'}
              managerName="Steven Carter"
              playersSelected={playersSelected}
              bank={bank}
              notification={notification}
            />
          </div>

          <TransferPitchView
            squad={squad}
            onSlotClick={handleSlotClick}
            onPlayerRemove={handlePlayerRemove}
            onStartTransfer={handleStartTransfer}
          />

          <div className="p-4 grid grid-cols-3 gap-4 border-t">
            <Button variant="outline" onClick={handleAutoFill}>Autofill</Button>
            <Button variant="destructive" onClick={handleReset}>Reset</Button>

{hasTeam ? (
<Button
    onClick={handleSaveTeam}
    disabled={!dirty || playersSelected !== 11}   // <-- add !dirty
    title={
      playersSelected !== 11
        ? 'Select 11 players to save'
        : dirty ? 'Save changes' : 'No changes to save'
    }
  >
    Save Team
  </Button>
) : (
  <Button
    onClick={() => setIsEnterSquadModalOpen(true)}
    disabled={playersSelected !== 11}
    title={playersSelected !== 11 ? 'Select 11 players to continue' : 'Enter Squad'}
  >
    Enter Squad
  </Button>
)}
          </div>
        </div>
      </div>

      {/* Mobile modal */}
      <PlayerSelectionModal
        isOpen={isPlayerSelectionOpen}
        onClose={() => setIsPlayerSelectionOpen(false)}
        onPlayerSelect={handlePlayerSelect}
        positionFilter={positionToFill?.position}
        squad={squad}
      />

      {/* Only shown when no team yet */}
      <EnterSquadModal
        isOpen={isEnterSquadModalOpen}
        onClose={() => setIsEnterSquadModalOpen(false)}
        onConfirm={handleConfirmSquad}
      />
    </div>
  );
};

export default Transfers;