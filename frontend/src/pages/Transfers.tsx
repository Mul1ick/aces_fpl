import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// --- COMPONENT IMPORTS ---
import { TransfersHeroCard } from '@/components/transfers/TransfersHeroCard';
import { TransferPitchView } from '@/components/transfers/TransferPitchView';
import { PlayerSelectionList, PlayerSelectionModal } from '@/components/transfers/PlayerSelection';
import { EnterSquadModal } from '@/components/transfers/EnterSquadModal';
import { Button } from '@/components/ui/button';
import { TeamResponse, Player } from "@/types";

// --- CONFIGURATION ---
const initialSquad = {
  GK: [null, null],
  DEF: [null, null, null],
  MID: [null, null, null],
  FWD: [null, null, null],
};

// --- MAIN TRANSFERS PAGE ---
const Transfers: React.FC = () => {
  const [squad, setSquad] = useState(initialSquad);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isPlayerSelectionOpen, setIsPlayerSelectionOpen] = useState(false);
  const [isEnterSquadModalOpen, setIsEnterSquadModalOpen] = useState(false);
  const [positionToFill, setPositionToFill] = useState<{ position: string; index: number } | null>(null);
  const navigate = useNavigate();
  const [teamFixtureMap, setTeamFixtureMap] = useState<Record<number, string>>({});

  useEffect(() => {
  const token = localStorage.getItem("access_token");

    

  const fetchAndSetTeam = async () => {
    try {
      const response = await fetch("http://localhost:8000/teams/team", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // If the user has no team, the API will return a 404, which is okay.
      if (!response.ok) {
        setIsLoading(false);
        return; // Keep the initial empty squad
      }

      const data: TeamResponse = await response.json();

      const normalizePos = (p: any) => {
  const key = String(p?.pos ?? p?.position ?? '').toUpperCase();
  return { ...p, pos: key };
};
      // Helper function to transform the API data into the squad object structure
      const transformApiDataToSquad = (players: any[]) => {
  const newSquad = JSON.parse(JSON.stringify(initialSquad));
  players.forEach(raw => {
    const p = normalizePos(raw);
    if (!newSquad[p.pos]) return;                 // skip unknown positions
    const idx = newSquad[p.pos].findIndex((s: any) => s === null);
    if (idx !== -1) newSquad[p.pos][idx] = p;     // place normalized player
  });
  return newSquad;
};

      

      const allPlayers = [...data.starting, ...data.bench];
      const populatedSquad = transformApiDataToSquad(allPlayers);
      setSquad(populatedSquad);

    } catch (error) {
      console.error("Failed to fetch team:", error);
    } finally {
      setIsLoading(false);
    }
  };

  fetchAndSetTeam();
}, []);




  // Show a notification and clear it after a few seconds
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSlotClick = (position: string, index: number) => {
    setPositionToFill({ position, index });
    if (window.innerWidth < 1024) {
        setIsPlayerSelectionOpen(true);
    }
  };

  const handlePlayerSelect = (player: any) => {
  setIsPlayerSelectionOpen(false); // Close mobile modal if open

  // Normalize position key coming from different sources
  const rawPos =
    player?.pos ??
    player?.position ??
    player?.Pos ??
    player?.POSITION ??
    null;

  const posKey = typeof rawPos === "string" ? rawPos.toUpperCase() : null;

  // Validate the target bucket (GK/DEF/MID/FWD) exists in squad
  if (!posKey || !Object.prototype.hasOwnProperty.call(squad, posKey)) {
    console.error("🚫 Unknown player position:", { player, posKey, squad });
    // showNotification("Couldn't determine the player's position.", "error");
    return;
  }

  // If user tapped a specific slot earlier, fill that exact slot
  if (positionToFill) {
    setSquad((current) => {
      const next = { ...current };
      const arr = [...next[positionToFill.position]];
      arr[positionToFill.index] = player;
      next[positionToFill.position] = arr;
      return next;
    });
    setPositionToFill(null);
    return;
  }

  // Otherwise, find the first empty slot for the player's position
  const positionArray = squad[posKey];
  if (!Array.isArray(positionArray)) {
    console.error("🚫 Squad bucket is not an array:", posKey, positionArray);
    // showNotification(`Invalid squad bucket for ${posKey}.`, "error");
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
    // showNotification(`All ${posKey} slots are already full.`, "error");
    console.warn(`All ${posKey} slots are already full.`);
  }
};

  const handlePlayerRemove = (position: string, index: number) => {
    setSquad(currentSquad => {
        const newSquad = { ...currentSquad };
        const positionArray = [...newSquad[position]];
        positionArray[index] = null; // Set the specific player slot back to null
        newSquad[position] = positionArray;
        return newSquad;
    });
  };

  const handleAutoFill = () => {
    // Placeholder for autofill logic
    showNotification('Autofill feature coming soon!', 'success');
  };

  const handleReset = () => {
    setSquad(initialSquad);
  };

  const handleConfirmSquad = async (teamName: string) => {
    const token = localStorage.getItem("access_token");

    const payload = {
      team_name: teamName,
      players: Object.entries(squad).flatMap(([position, playerArray]) =>
        playerArray
          .filter(p => p !== null)
          .map(p => ({ 
            id: p.id, 
            position: p.pos,
            is_captain: false,
            is_vice_captain: false,
            is_benched: false
          }))
      )
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

      const data = await response.json();
      navigate('/team');
    } catch (error) {
      console.error("Error submitting team:", error);
    }
  };

  const { playersSelected, bank } = useMemo(() => {
    const allPlayers = Object.values(squad).flat();
    const selectedCount = allPlayers.filter(p => p !== null).length;
    const totalCost = allPlayers.reduce((acc, p) => acc + (p?.price || 0), 0);
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
              teamName="Silly United"
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
            teamFixtureMap={teamFixtureMap}
          />

          <div className="p-4 grid grid-cols-3 gap-4 border-t">
            <Button variant="outline" onClick={handleAutoFill}>Autofill</Button>
            <Button variant="destructive" onClick={handleReset}>Reset</Button>
            <Button onClick={() => setIsEnterSquadModalOpen(true)}>Enter Squad</Button>
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

