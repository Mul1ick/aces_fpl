import React, { useState, useMemo } from 'react';
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

const mockPlayers = [
    { id: 1, name: 'Haaland', pos: 'FWD', club: 'Titans', price: 14.0, points: 150, tsb: 82.5 },
    { id: 2, name: 'Salah', pos: 'MID', club: 'Satan', price: 13.0, points: 145, tsb: 58.2 },
    { id: 3, name: 'Son', pos: 'MID', club: 'Mumbai Hotspurs', price: 9.5, points: 120, tsb: 45.1 },
    { id: 4, name: 'Trippier', pos: 'DEF', club: 'Southside', price: 7.0, points: 110, tsb: 55.3 },
    { id: 5, name: 'Raya', pos: 'GK', club: 'Satan', price: 5.0, points: 90, tsb: 30.8 },
    { id: 6, name: 'Fernandes', pos: 'MID', club: 'Bandra United', price: 8.5, points: 115, tsb: 35.7 },
    { id: 7, name: 'Watkins', pos: 'FWD', club: 'Titans', price: 8.0, points: 105, tsb: 40.1 },
    { id: 8, name: 'Saka', pos: 'MID', club: 'Satan', price: 9.0, points: 125, tsb: 60.5 },
    { id: 9, name: 'James', pos: 'DEF', club: 'Bandra United', price: 5.5, points: 85, tsb: 25.2 },
    { id: 10, name: 'Maddison', pos: 'MID', club: 'Mumbai Hotspurs', price: 8.0, points: 100, tsb: 38.9 },
    { id: 11, name: 'Pope', pos: 'GK', club: 'Southside', price: 5.5, points: 95, tsb: 28.4 },
    { id: 12, name: 'Saliba', pos: 'DEF', club: 'Satan', price: 5.5, points: 92, tsb: 48.7 },
    { id: 13, name: 'Rashford', pos: 'MID', club: 'Bandra United', price: 9.0, points: 118, tsb: 42.3 },
    { id: 14, name: 'Kane', pos: 'FWD', club: 'Mumbai Hotspurs', price: 12.5, points: 140, tsb: 50.1 },
];

// --- MAIN TRANSFERS PAGE ---
const Transfers: React.FC = () => {
  const [squad, setSquad] = useState(initialSquad);
  const [isPlayerSelectionOpen, setIsPlayerSelectionOpen] = useState(false);
  const [isEnterSquadModalOpen, setIsEnterSquadModalOpen] = useState(false);
  const [positionToFill, setPositionToFill] = useState<{ position: string; index: number } | null>(null);
  const navigate = useNavigate();

  const handleSlotClick = (position: string, index: number) => {
    setPositionToFill({ position, index });
    if (window.innerWidth < 1024) {
        setIsPlayerSelectionOpen(true);
    }
  };

  const handlePlayerSelect = (player: any) => {
    if (positionToFill) {
      const newSquad = { ...squad };
      const newPositionArray = [...newSquad[positionToFill.position]];
      newPositionArray[positionToFill.index] = player;
      newSquad[positionToFill.position] = newPositionArray;
      setSquad(newSquad);
    }
    setIsPlayerSelectionOpen(false);
    setPositionToFill(null);
  };
  
  const handleAutoFill = () => {
    let budget = 102.0;
    const newSquad = JSON.parse(JSON.stringify(squad)); // Deep copy to keep existing players
    let availablePlayers = [...mockPlayers];

    // Account for already selected players
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
                .filter(p => p.pos === pos)
                .sort((a, b) => b.points - a.price); // Prioritize players with high points

            for (let i = 0; i < needed; i++) {
                const emptySlotIndex = newSquad[pos].findIndex(slot => slot === null);
                if (emptySlotIndex !== -1) {
                    // Find the best player that fits the budget and club constraints
                    const affordablePlayer = playersForPos.find(p => {
                        const playersFromSameClub = Object.values(newSquad).flat().filter(sp => sp?.club === p.club).length;
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

  const handleConfirmSquad = (teamName: string, favouriteClub: string) => {
    // Here you would typically make an API call to save the squad
    console.log("Squad Confirmed:", { teamName, favouriteClub, squad });
    setIsEnterSquadModalOpen(false);
    navigate('/team'); // Redirect to the Pick Team page
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
              teamName="Aces United"
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
