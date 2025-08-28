import React, { useState,useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import PlayerCard from '@/components/layout/PlayerCard'; 
import { ManagerInfoCard } from '@/components/gameweek/ManagerInfoCard';
import { GameweekChips } from '@/components/team/GameweekChips';
import { FixturesCard } from '@/components/team/FixturesCard';
import { EditablePlayerCard } from '@/components/team/EditablePlayerCard';
import { cn } from '@/lib/utils';
import { TeamResponse } from "@/types";

// --- ASSET IMPORTS ---
import pitchBackground from '@/assets/images/pitch.svg';

type PlayerType = {
  id: number;
  name: string;
  team: string;
  pos: string;
  fixture?: string;
  points?: number;
  isCaptain?: boolean;
  isVice?: boolean;
};
// --- MOCK DATA & CONFIGURATION ---
// const initialSquad = {
//   starting: [
//     { id: 1, name: 'Raya', team: 'Satan', pos: 'GK', fixture: 'MUN(A)', points: 6, isCaptain: false, isVice: false },
//     { id: 2, name: 'Saliba', team: 'Satan', pos: 'DEF', fixture: 'MUN(A)', points: 7, isCaptain: false, isVice: false },
//     { id: 3, name: 'Shaw', team: 'Bandra United', pos: 'DEF', fixture: 'SAT(H)', points: 5, isCaptain: false, isVice: false },
//     { id: 4, name: 'Trippier', team: 'Southside', pos: 'DEF', fixture: 'TIT(H)', points: 8, isCaptain: false, isVice: false },
//     { id: 5, name: 'Fernandes', team: 'Bandra United', pos: 'MID', fixture: 'SAT(H)', points: 12, isCaptain: true, isVice: false },
//     { id: 6, name: 'Son', team: 'Mumbai Hotspurs', pos: 'MID', fixture: 'UMA(A)', points: 9, isCaptain: false, isVice: true },
//     { id: 7, name: 'Joelinton', team: 'Southside', pos: 'MID', fixture: 'TIT(H)', points: 4, isCaptain: false, isVice: false },
//     { id: 8, name: 'Haaland', team: 'Titans', pos: 'FWD', fixture: 'SOU(A)', points: 13, isCaptain: false, isVice: false },
//   ],
//   bench: [
//     { id: 9, name: 'Pope', team: 'Umaag Foundation Trust', pos: 'GK', fixture: 'MHS(H)', points: 1 },
//     { id: 10, name: 'Maddison', team: 'Mumbai Hotspurs', pos: 'MID', fixture: 'UMA(A)', points: 5 },
//     { id: 11, name: 'Watkins', team: 'Titans', pos: 'FWD', fixture: 'SOU(A)', points: 2 },
//   ]
// };

const Team: React.FC = () => {
  const [squad, setSquad] = useState({ starting: [], bench: [] });
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [detailedPlayer, setDetailedPlayer] = useState(null);


  useEffect(() => {
  const token = localStorage.getItem("access_token");

  fetch("http://localhost:8000/teams/team", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then(async res => {
      if (!res.ok) {
        throw new Error(`Fetch failed with status ${res.status}`);
      }

      const data = await res.json();

      if (!data.starting || !data.bench) {
        throw new Error("Malformed team data");
      }

      // Combine all players into one array to evaluate is_benched flag
      const allPlayers = [...data.starting, ...data.bench];

      // Transform function
      const transformPlayer = (player) => ({
        id: player.id,
        name: player.full_name,
        team: player.team.short_name,
        pos: player.position,
        fixture: '—',
        points: 0,
        isCaptain: player.is_captain,
        isVice: player.is_vice_captain,
      });

      // Divide players correctly
      const starting = allPlayers
        .filter(player => !player.is_benched)
        .map(transformPlayer);

      const bench = allPlayers
        .filter(player => player.is_benched)
        .map(transformPlayer);

      setSquad({ starting, bench });
    })
    .catch(err => {
      console.error("Failed to fetch team:", err);
      setSquad({ starting: [], bench: [] });
    });
}, []);

  const handlePlayerClick = (playerToSwap, isFromBench) => {
    if (!selectedPlayer) {
      // If no player is selected for a sub, open the detail card
      setDetailedPlayer(playerToSwap);
      return;
    }

    // A player is already selected, so attempt a substitution
    if (selectedPlayer.isFromBench === isFromBench) {
      // Clicked another player in the same area, so just switch selection
      setSelectedPlayer({ ...playerToSwap, isFromBench });
      return;
    }

    // Determine which player is coming from the pitch and which from the bench
    const pitchPlayer = selectedPlayer.isFromBench ? playerToSwap : selectedPlayer;
    const benchPlayer = selectedPlayer.isFromBench ? selectedPlayer : playerToSwap;

    // --- VALIDATION LOGIC ---
    const newStarters = squad.starting.filter(p => p.id !== pitchPlayer.id);
    newStarters.push(benchPlayer);

    const goalkeepers = newStarters.filter(p => p.pos === 'GK').length;
    const defenders = newStarters.filter(p => p.pos === 'DEF').length;

    if (goalkeepers !== 1) {
      alert("Invalid substitution. You must have exactly one goalkeeper.");
      setSelectedPlayer(null);
      return;
    }
    if (defenders < 2) {
      alert("Invalid substitution. You must have at least two defenders.");
      setSelectedPlayer(null);
      return;
    }

    // --- PERFORM SWAP ---
    const updatedStarting = squad.starting.map(p => p.id === pitchPlayer.id ? benchPlayer : p);
    const updatedBench = squad.bench.map(p => p.id === benchPlayer.id ? pitchPlayer : p);

    setSquad({ starting: updatedStarting, bench: updatedBench });
    setSelectedPlayer(null);
  };
  
  const handleSelectForSub = (playerToSub) => {
    const isBenched = squad.bench.some(p => p.id === playerToSub.id);
    setSelectedPlayer({ ...playerToSub, isFromBench: isBenched });
    setDetailedPlayer(null); // Close the detail card to allow the next selection
  };

  if (!Array.isArray(squad.starting) || !Array.isArray(squad.bench)) {
  return <div className="p-4">Loading team...</div>;
}
  const playersByPos = {
    GK: squad.starting.filter(p => p.pos === 'GK'),
    DEF: squad.starting.filter(p => p.pos === 'DEF'),
    MID: squad.starting.filter(p => p.pos === 'MID'),
    FWD: squad.starting.filter(p => p.pos === 'FWD'),
  };

  return (
    <div className="w-full min-h-screen bg-white flex flex-col lg:h-screen lg:flex-row font-sans">
      {/* Left Column (Desktop Only) */}
      <div className="hidden lg:block lg:w-2/5 p-4 h-screen overflow-y-auto">
        <ManagerInfoCard />
      </div>

      {/* Right Column / Main Mobile View */}
      <div className="flex flex-col flex-1 lg:w-3/5 lg:h-screen">
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Pick Team</h1>
                    <p className="text-sm text-gray-500">Gameweek 16 Deadline: Sat 23 Aug 11:00</p>
                </div>
            </div>
            <GameweekChips />
        </div>
        
        <main 
          className="flex-1 relative flex flex-col justify-around py-4"
          style={{ 
            backgroundImage: `url(${pitchBackground})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center top',
          }}
        >
          {/* Formation Rows */}
          {Object.values(playersByPos).map((players, index) => (
            <div key={index} className="flex justify-center items-center gap-x-8 sm:gap-x-12">
              {players.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => handlePlayerClick(p, false)} 
                  className={cn("cursor-pointer rounded-md transition-all", selectedPlayer?.id === p.id && "ring-2 ring-accent-teal ring-offset-2 ring-offset-transparent")}
                >
                  <PlayerCard player={p} />
                </div>
              ))}
            </div>
          ))}
        </main>

        <footer className="flex-shrink-0 p-3 bg-gray-100 border-t">
          <div className="grid grid-cols-3 gap-4 place-items-center">
            {squad.bench.map(player => (
              <div 
                key={player.id} 
                onClick={() => handlePlayerClick(player, true)} 
                className={cn("cursor-pointer rounded-md transition-all", selectedPlayer?.id === player.id && "ring-2 ring-accent-teal ring-offset-2 ring-offset-transparent")}
              >
                <PlayerCard player={player} isBench={true} />
              </div>
            ))}
          </div>
        </footer>

        <div className="p-4">
            <FixturesCard />
        </div>
      </div>
      
      {/* Manager Info Card (Mobile Only) */}
      <div className="block lg:hidden p-4">
          <ManagerInfoCard />
      </div>

      <AnimatePresence>
        {detailedPlayer && <EditablePlayerCard player={detailedPlayer} onClose={() => setDetailedPlayer(null)} onSubstitute={handleSelectForSub} />}
      </AnimatePresence>
    </div>
  );
};

export default Team;
