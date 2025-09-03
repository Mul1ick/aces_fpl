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

const Transfers: React.FC = () => {
  const [squad, setSquad] = useState(initialSquad);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isPlayerSelectionOpen, setIsPlayerSelectionOpen] = useState(false);
  const [isEnterSquadModalOpen, setIsEnterSquadModalOpen] = useState(false);
  const [positionToFill, setPositionToFill] = useState<{ position: string; index: number } | null>(null);
  const [outgoing, setOutgoing] = useState<any | null>(null);

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
      const p = normalizePos(raw);
      if (!newSquad[p.pos]) return;
      const idx = newSquad[p.pos].findIndex((s: any) => s === null);
      if (idx !== -1) newSquad[p.pos][idx] = p;
    });
    return newSquad;
  };

  const fetchAndSetTeam = async () => {
    try {
      const response = await fetch("http://localhost:8000/teams/team", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        // No team yet
        setHasTeam(false);
        setExistingTeamName('');
        setIsLoading(false);
        return;
      }

      const data: TeamResponse = await response.json();
      setHasTeam(true);
      setExistingTeamName(data.team_name || '');

      const allPlayers = [...data.starting, ...data.bench];
      const populatedSquad = transformApiDataToSquad(allPlayers);
      setSquad(populatedSquad);
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

          await fetchAndSetTeam();
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
    const payload = {
      team_name: teamName,
      players: Object.entries(squad).flatMap(([position, playerArray]) =>
        playerArray
          .filter((p: any) => p !== null)
          .map((p: any) => ({
            id: p.id,
            position: p.pos ?? p.position,      // keep server happy
            is_captain: !!p.is_captain,
            is_vice_captain: !!p.is_vice_captain,
            is_benched: !!p.is_benched,
          }))
      ),
    };

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
          />

          <div className="p-4 grid grid-cols-3 gap-4 border-t">
            <Button variant="outline" onClick={handleAutoFill}>Autofill</Button>
            <Button variant="destructive" onClick={handleReset}>Reset</Button>

            {hasTeam ? (
              <Button
                onClick={handleSaveExistingTeam}
                disabled={playersSelected !== 11}
                title={playersSelected !== 11 ? 'Select 11 players to save' : 'Save Team'}
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