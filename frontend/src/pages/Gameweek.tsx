import React, { useState,useEffect } from 'react';
import { TeamResponse } from "@/types";
import { useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { GameweekHeader } from '@/components/gameweek/GameweekHeader';
import { PitchView } from '@/components/gameweek/PitchView';
import { ListView } from '@/components/gameweek/ListView'; 
import { ManagerInfoCard } from '@/components/gameweek/ManagerInfoCard';
import { Card } from '@/components/ui/card';
import { PlayerDetailCard } from '@/components/gameweek/PlayerDetailCard';

// --- MOCK DATA & CONFIGURATION ---
// const mockUserSquad = {
//   teamName: "Eric Ten Hoes",
//   managerName: "Arjun Dangle",
//   totalPoints: 70,
//   averagePoints: 54,
//   highestPoints: 127,
//   gwRank: "958,151",
//   freeTransfers: 0,
//   starting: [
//     { id: 1, name: 'Raya', team: 'Satan', pos: 'GK', fixture: 'MUN(A)', points: 6, isCaptain: false, isVice: false, matchesPlayed: 14, goals: 0, assists: 0, cleansheets: 5, ppg: 4.5 },
//     { id: 2, name: 'Saliba', team: 'Satan', pos: 'DEF', fixture: 'MUN(A)', points: 7, isCaptain: false, isVice: false, matchesPlayed: 14, goals: 1, assists: 0, cleansheets: 5, ppg: 5.1 },
//     { id: 3, name: 'Shaw', team: 'Bandra United', pos: 'DEF', fixture: 'SAT(H)', points: 5, isCaptain: false, isVice: false, matchesPlayed: 13, goals: 0, assists: 2, cleansheets: 4, ppg: 4.8 },
//     { id: 4, name: 'Trippier', team: 'Southside', pos: 'DEF', fixture: 'TIT(H)', points: 8, isCaptain: false, isVice: false, matchesPlayed: 14, goals: 1, assists: 4, cleansheets: 6, ppg: 6.2 },
//     { id: 5, name: 'Fernandes', team: 'Bandra United', pos: 'MID', fixture: 'SAT(H)', points: 12, isCaptain: true, isVice: false, matchesPlayed: 14, goals: 5, assists: 6, cleansheets: 4, ppg: 7.1 },
//     { id: 6, name: 'Son', team: 'Mumbai Hotspurs', pos: 'MID', fixture: 'UMA(A)', points: 9, isCaptain: false, isVice: true, matchesPlayed: 14, goals: 8, assists: 3, cleansheets: 5, ppg: 8.5 },
//     { id: 7, name: 'Joelinton', team: 'Southside', pos: 'MID', fixture: 'TIT(H)', points: 4, isCaptain: false, isVice: false, matchesPlayed: 12, goals: 2, assists: 1, cleansheets: 6, ppg: 3.9 },
//     { id: 8, name: 'Haaland', team: 'Titans', pos: 'FWD', fixture: 'SOU(A)', points: 13, isCaptain: false, isVice: false, matchesPlayed: 14, goals: 18, assists: 3, cleansheets: 7, ppg: 12.1 },
//   ],
//   bench: [
//     { id: 9, name: 'Pope', team: 'Umaag Foundation Trust', pos: 'GK', fixture: 'MHS(H)', points: 1, matchesPlayed: 14, goals: 0, assists: 0, cleansheets: 7, ppg: 5.5 },
//     { id: 10, name: 'Maddison', team: 'Mumbai Hotspurs', pos: 'MID', fixture: 'UMA(A)', points: 5, matchesPlayed: 13, goals: 6, assists: 5, cleansheets: 5, ppg: 6.8 },
//     { id: 11, name: 'Watkins', team: 'Titans', pos: 'FWD', fixture: 'SOU(A)', points: 2, matchesPlayed: 14, goals: 7, assists: 4, cleansheets: 7, ppg: 6.5 },
//   ]
// };

const Gameweek: React.FC = () => {
  const { gw } = useParams();
  const [view, setView] = useState('pitch');
  const [detailedPlayer, setDetailedPlayer] = useState(null);
const [squad, setSquad] = useState<TeamResponse | null>(null);

useEffect(() => {
    const fetchTeam = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        // Handle case where user is not logged in
        return;
      }

      try {
        const response = await fetch("http://localhost:8000/teams/team", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch team data");
        }
        
        const data: TeamResponse = await response.json();
        
        setSquad(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchTeam();
  }, []);

    if (!squad) {
    return <div className="p-4 text-center">Loading your gameweek data...</div>;
  }

  const playersByPos = {
    GK: squad.starting.filter(p => p.position === 'GK'),
    DEF: squad.starting.filter(p => p.position === 'DEF'),
    MID: squad.starting.filter(p => p.position === 'MID'),
    FWD: squad.starting.filter(p => p.position === 'FWD'),
  };

  const allPlayers = [...squad.starting, ...squad.bench];

  return (
    <div className="w-full min-h-screen bg-white flex flex-col lg:h-screen lg:flex-row font-sans">
      {/* Left Column (Desktop Only) */}
      <div className="hidden lg:block lg:w-2/5 p-4 h-screen overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <ManagerInfoCard />
      </div>

      {/* Right Column / Main Mobile View */}
      <div className="flex flex-col flex-1 lg:w-3/5 lg:h-screen">
        <div className="lg:m-4 lg:border-2 lg:border-gray-300 lg:rounded-lg flex flex-col flex-grow">
            <div className="bg-gradient-to-b from-[#37003C] to-[#23003F] p-4 lg:rounded-t-lg">
                <GameweekHeader 
                    gw={gw} 
                    view={view} 
                    setView={setView}
                    teamName={squad.team_name}
                    // managerName={squad.managerName}
                    // totalPoints={squad.totalPoints}
                    // averagePoints={squad.averagePoints}
                    // highestPoints={squad.highestPoints}
                    // gwRank={squad.gwRank}
                    // freeTransfers={squad.freeTransfers}
                />
            </div>
            
            {view === 'pitch' ? (
                <PitchView playersByPos={playersByPos} bench={squad.bench} onPlayerClick={setDetailedPlayer} />
            ) : (
                <ListView players={allPlayers} />
            )}
        </div>
      </div>
      
      {/* Manager Info Card (Mobile Only) */}
      <div className="block lg:hidden p-4">
          <ManagerInfoCard />
      </div>

      <AnimatePresence>
        {detailedPlayer && <PlayerDetailCard player={detailedPlayer} onClose={() => setDetailedPlayer(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default Gameweek;
