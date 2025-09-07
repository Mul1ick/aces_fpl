import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

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
  GK: (sq.GK ?? []).map(p => p ? p.id : null),
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

  const gks = flat.filter(p => p.position === "GK");
  if (gks.length === 2) {
    const gkBucket = (squad.GK ?? []).filter(Boolean);
    const starterGKId = gkBucket[0]?.id ?? gks[0].id;
    gks.forEach(gk => (gk.is_benched = gk.id !== starterGKId));
  }

  const captain = flat.find(p => p.is_captain) || null;
  const vice = flat.find(p => p.is_vice_captain) || null;
  const protectedIds = new Set([captain?.id, vice?.id].filter(Boolean) as number[]);
  const benchSet = new Set(flat.filter(p => p.is_benched).map(p => p.id));
  const need = 3 - benchSet.size;

  if (need > 0) {
    const candidates = ["FWD", "MID", "DEF"]
      .flatMap(pos => (squad[pos] ?? []).slice().reverse())
      .filter(Boolean)
      .map((p: any) => flat.find(x => x?.id === p.id))
      .filter((p: any) => p && p.position !== "GK" && !protectedIds.has(p.id) && !benchSet.has(p.id));
    for (let i = 0; i < need && i < candidates.length; i++) {
      if (candidates[i]) {
        candidates[i].is_benched = true;
        benchSet.add(candidates[i].id);
      }
    }
  } else if (need < 0) {
    const extras = flat.filter(p => p.is_benched && p.position !== "GK" && !protectedIds.has(p.id))
      .slice(0, Math.abs(need));
    extras.forEach(p => (p.is_benched = false));
  }

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
  const { user, refreshUserStatus, isLoading: isAuthLoading } = useAuth();
  const [squad, setSquad] = useState(initialSquad);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isPlayerSelectionOpen, setIsPlayerSelectionOpen] = useState(false);
  const [isEnterSquadModalOpen, setIsEnterSquadModalOpen] = useState(false);
  const [positionToFill, setPositionToFill] = useState<{ position: string; index: number } | null>(null);
  const [outgoing, setOutgoing] = useState<any | null>(null);
  const [baseline, setBaseline] = useState<string>("");
  const [existingTeamName, setExistingTeamName] = useState<string>('');
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");

  const hasTeam = user?.has_team;

  const transformApiDataToSquad = (players: any[]) => {
    const newSquad = JSON.parse(JSON.stringify(initialSquad));
    players.forEach(raw => {
      const pos = String(raw?.pos ?? raw?.position ?? "").toUpperCase();
      if (newSquad[pos]) {
        const idx = newSquad[pos].findIndex((s: any) => s === null);
        if (idx !== -1) {
          newSquad[pos][idx] = { ...raw, pos };
        }
      }
    });
    return newSquad;
  };

  useEffect(() => {
    const fetchAndSetTeam = async () => {
      setIsLoading(true);
      if (hasTeam === false) {
        setSquad(initialSquad);
        setBaseline(serializeSquad(initialSquad));
        setIsLoading(false);
        return;
      }

      if (hasTeam === true) {
        try {
          const response = await fetch("http://localhost:8000/teams/team", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) throw new Error("No team found for user");
          const data: TeamResponse = await response.json();
          setExistingTeamName(data.team_name || '');
          const allPlayers = [...data.starting, ...data.bench];
          const populatedSquad = transformApiDataToSquad(allPlayers);
          setSquad(populatedSquad);
          setBaseline(serializeSquad(populatedSquad));
        } catch (error) {
          console.error("Failed to fetch team:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (!isAuthLoading) {
        fetchAndSetTeam();
    }
  }, [user, isAuthLoading]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handlePlayerSelect = (player: any) => {
    setIsPlayerSelectionOpen(false);
    const posKey = String(player?.pos ?? player?.position ?? '').toUpperCase();

    if (!squad[posKey]) {
        console.error("Invalid player position:", posKey);
        return;
    }

    if (positionToFill) {
        setSquad((current) => {
            const newSquad = { ...current };
            const positionArray = [...newSquad[positionToFill.position]];
            positionArray[positionToFill.index] = player;
            newSquad[positionToFill.position] = positionArray;
            return newSquad;
        });
        setPositionToFill(null);
        setOutgoing(null);
        return;
    }

    const emptySlotIndex = squad[posKey].findIndex(slot => slot === null);
    if (emptySlotIndex !== -1) {
        setSquad(current => {
            const newSquad = { ...current };
            const positionArray = [...newSquad[posKey]];
            positionArray[emptySlotIndex] = player;
            newSquad[posKey] = positionArray;
            return newSquad;
        });
    } else {
        showNotification(`All ${posKey} slots are full.`, 'error');
    }
  };

  const handleSlotClick = (position: string, index: number) => {
    setPositionToFill({ position, index });
    const playerInSlot = squad[position][index];
    setOutgoing(playerInSlot || null);
    if (window.innerWidth < 1024) setIsPlayerSelectionOpen(true);
  };

  const handleStartTransfer = (player: any, pos: string, index: number) => {
    setPositionToFill({ position: pos, index });
    setOutgoing(player);
    setIsPlayerSelectionOpen(true);
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

  const handleAutoFill = () => showNotification('Autofill feature coming soon!', 'success');

  const handleReset = () => {
    if (hasTeam) {
        fetchAndSetTeam({ resetBaseline: false });
    } else {
        setSquad(initialSquad);
    }
  };

  const submitSquad = async (teamName: string) => {
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
        const error = await response.json();
        throw new Error(error.detail?.[0]?.msg || "Failed to submit team");
      }
      
      await response.json();
      if (!hasTeam) {
        await refreshUserStatus();
      }
      navigate('/dashboard');
    } catch (error) {
      console.error("Error submitting team:", error);
      showNotification(error instanceof Error ? error.message : 'Failed to save team', 'error');
    }
  };

  const handleConfirmSquad = (teamName: string) => submitSquad(teamName);
  const handleSaveExistingTeam = () => submitSquad(existingTeamName || 'My Team');
  
  const { playersSelected, bank } = useMemo(() => {
    const allPlayers = Object.values(squad).flat();
    const selectedCount = allPlayers.filter((p: any) => p !== null).length;
    const totalCost = allPlayers.reduce((acc: number, p: any) => acc + (p?.price || 0), 0);
    const remainingBank = 110.0 - totalCost;
    return { playersSelected: selectedCount, bank: remainingBank };
  }, [squad]);

  const dirty = useMemo(() => serializeSquad(squad) !== baseline, [squad, baseline]);

  if (isLoading || isAuthLoading) {
    return <div className="p-4 text-center">Loading...</div>;
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
              managerName={user?.full_name || "Manager"}
              playersSelected={playersSelected}
              bank={bank}
              notification={notification}
              user={user}
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
                onClick={handleSaveExistingTeam}
                disabled={!dirty || playersSelected !== 11}
                title={playersSelected !== 11 ? 'Select 11 players to save' : dirty ? 'Save changes' : 'No changes to save'}
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
      <PlayerSelectionModal
        isOpen={isPlayerSelectionOpen}
        onClose={() => setIsPlayerSelectionOpen(false)}
        onPlayerSelect={handlePlayerSelect}
        positionFilter={positionToFill?.position}
        squad={squad}
      />
      <EnterSquadModal
        isOpen={isEnterSquadModalOpen}
        onClose={() => setIsEnterSquadModalOpen(false)}
        onConfirm={handleConfirmSquad}
      />
    </div>
  );
};

export default Transfers;