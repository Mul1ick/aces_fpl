import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// --- COMPONENT IMPORTS ---
import { TransfersHeroCard } from '@/components/transfers/TransfersHeroCard';
import { TransferPitchView } from '@/components/transfers/TransferPitchView';
import { PlayerSelectionList, PlayerSelectionModal } from '@/components/transfers/PlayerSelection';
import { EnterSquadModal } from '@/components/transfers/EnterSquadModal';
import { Button } from '@/components/ui/button';

// --- MOCK DATA & CONFIGURATION ---
const initialSquad = {
  GK: [null, null],
  DEF: [null, null, null],
  MID: [null, null, null],
  FWD: [null, null, null],
};

// --- MAIN TRANSFERS PAGE ---
const Transfers: React.FC = () => {
  const [playerPool, setPlayerPool] = useState([]);
  const [squad, setSquad] = useState(initialSquad);
  const [isPlayerSelectionOpen, setIsPlayerSelectionOpen] = useState(false);
  const [isEnterSquadModalOpen, setIsEnterSquadModalOpen] = useState(false);
  const [positionToFill, setPositionToFill] = useState<{ position: string; index: number } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:8000/players')
      .then(res => res.json())
      .then(data => setPlayerPool(data))
      .catch(err => console.error("Failed to fetch player pool:", err));
  }, []);

  const handleSlotClick = (position: string, index: number) => {
    setPositionToFill({ position, index });
    if (window.innerWidth < 1024) {
        setIsPlayerSelectionOpen(true);
    }
  };

  const handlePlayerSelect = (player: any) => {
  console.log("🧠 [handlePlayerSelect] Player received:", player);
  
  if (positionToFill) {
    const newSquad = { ...squad };
    const newPositionArray = [...newSquad[positionToFill.position]];
    newPositionArray[positionToFill.index] = player;
    newSquad[positionToFill.position] = newPositionArray;
    console.log(`✅ [handlePlayerSelect] Updated squad for position ${positionToFill.position}:`, newPositionArray);
    setSquad(newSquad);
  }

  setIsPlayerSelectionOpen(false);
  setPositionToFill(null);
};

  const handleAutoFill = () => {
    let budget = 102.0;
    const newSquad = JSON.parse(JSON.stringify(squad));
    let availablePlayers = [...playerPool];

    const alreadySelectedIds = Object.values(newSquad).flat().filter(p => p).map(p => p.id);
    availablePlayers = availablePlayers.filter(p => !alreadySelectedIds.includes(p.id));

    Object.values(newSquad).flat().forEach(player => {
        if (player) {
            budget -= player.price;
        }
    });

    const formation = { GK: 2, DEF: 3, MID: 3, FWD: 3 };

    Object.keys(formation).forEach(pos => {
        const needed = formation[pos] - newSquad[pos].filter(p => p !== null).length;
        if (needed > 0) {
            let playersForPos = availablePlayers
                .filter(p => p.position === pos)
                .sort((a, b) => b.points - a.price);

            for (let i = 0; i < needed; i++) {
                const emptySlotIndex = newSquad[pos].findIndex(slot => slot === null);
                if (emptySlotIndex !== -1) {
                    const affordablePlayer = playersForPos.find(p => {
                        const playersFromSameClub = Object.values(newSquad).flat().filter(sp => sp?.team_id === p.team_id).length;
                        return p.price <= budget && playersFromSameClub < 2;
                    });

                    if (affordablePlayer) {
                        newSquad[pos][emptySlotIndex] = affordablePlayer;
                        budget -= affordablePlayer.price;
                        availablePlayers = availablePlayers.filter(p => p.id !== affordablePlayer.id);
                        playersForPos = playersForPos.filter(p => p.id !== affordablePlayer.id);
                    }
                }
            }
        }
    });
    setSquad(newSquad);
  };

  const handleReset = () => {
    setSquad(initialSquad);
  };

const handleConfirmSquad = async (teamName: string) => {
  const token = localStorage.getItem("access_token");

  console.log("📦 [Submit] Current squad state before formatting:", squad);

  const players = Object.entries(squad).flatMap(([position, playerArray]) =>
    playerArray
      .filter(p => p !== null)
      .map(p => {
        console.log(`🔁 [Submit] Mapping player ${p.name} => { id: ${p.id}, position: ${position} }`);
        return { id: p.id, position };
      })
  );

  const payload = {
    team_name: teamName,
    players: players
  };

  console.log("🚀 [Submit] Payload being sent:", JSON.stringify(payload, null, 2));

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
    console.log("✅ [Submit] Team submitted successfully:", data);
    navigate('/team');
  } catch (error) {
    console.error("❌ [Submit] Error submitting team:", error);
  }
};

  const { playersSelected, bank } = useMemo(() => {
    const allPlayers = Object.values(squad).flat();
    const selectedCount = allPlayers.filter(p => p !== null).length;
    const totalCost = allPlayers.reduce((acc, p) => acc + (p?.price || 0), 0);
    const remainingBank = 102.0 - totalCost;
    return { playersSelected: selectedCount, bank: remainingBank };
  }, [squad]);

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
              teamName="silly United"
              managerName="Steven Carter"
              playersSelected={playersSelected}
              bank={bank}
            />
          </div>
          
          <TransferPitchView squad={squad} onSlotClick={handleSlotClick} />

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