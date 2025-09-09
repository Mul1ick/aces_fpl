import React, { useState,useEffect } from 'react';
import { TeamResponse } from "@/types";
import { useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { GameweekHeader } from '@/components/gameweek/GameweekHeader';
import { PitchView } from '@/components/gameweek/PitchView';
import { ListView } from '@/components/gameweek/ListView';
import { ManagerInfoCard } from '@/components/gameweek/ManagerInfoCard';
import { Card } from '@/components/ui/card';
import { API } from '@/lib/api';
import { PlayerDetailCard } from '@/components/gameweek/PlayerDetailCard';

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
        const response = await fetch(`${API.BASE_URL.team}/team`, {
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