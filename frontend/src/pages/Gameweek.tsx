import React, { useState,useEffect } from 'react';
import { TeamResponse } from "@/types";
import { useParams,useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { GameweekHeader } from '@/components/gameweek/GameweekHeader';
import { PitchView } from '@/components/gameweek/PitchView';
import { ListView } from '@/components/gameweek/ListView';
import { ManagerInfoCard } from '@/components/gameweek/ManagerInfoCard';
import { Card } from '@/components/ui/card';
import { API } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useMemo } from 'react'; // Make sure useMemo is imported
import { PlayerDetailCard } from '@/components/gameweek/PlayerDetailCard';

const Gameweek: React.FC = () => {
  const { gw } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // Add useAuth
  const { toast } = useToast(); // Add useToast
  const [view, setView] = useState('pitch');
  const [detailedPlayer, setDetailedPlayer] = useState(null);
  const [squad, setSquad] = useState<TeamResponse | null>(null);
  const [gameweekStats, setGameweekStats] = useState(null); // Add this
  const [hubStats, setHubStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isExtraDataLoading, setIsExtraDataLoading] = useState(true);


  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token || !gw) {
       return;
    }
    
    const gameweekNumber = parseInt(gw, 10);

    const fetchAllData = async () => {
      setIsExtraDataLoading(true);
      try {
        const [teamRes, hubRes, leaderboardRes, gwStatsRes] = await Promise.all([
            fetch(API.endpoints.team(gameweekNumber), { headers: { Authorization: `Bearer ${token}` } }),
            fetch(API.endpoints.userStats, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(API.endpoints.leaderboard, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API.endpoints.gameweek}/${gameweekNumber}/stats`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (!teamRes.ok) throw new Error("Failed to fetch team data");
        if (!hubRes.ok || !leaderboardRes.ok || !gwStatsRes.ok) console.warn("Failed to fetch manager or gameweek data");
        
        const teamData: TeamResponse = await teamRes.json();
        setSquad(teamData);
        
        if (hubRes.ok) setHubStats(await hubRes.json());
        if (leaderboardRes.ok) setLeaderboard(await leaderboardRes.json());
        if (gwStatsRes.ok) setGameweekStats(await gwStatsRes.json());

      } catch (error) {
        console.error("Error fetching data:", error);
        toast({ variant: "destructive", title: "Could not load page data." });
      } finally {
        setIsExtraDataLoading(false);
      }
    };

    fetchAllData();
  }, [toast, gw]);


  const userRank = useMemo(() => {
    if (!leaderboard || !user) return undefined;
    const userEntry = leaderboard.find(entry => entry.manager_email === user.email);
    return userEntry?.rank;
  }, [leaderboard, user]);

  const handleNavigation = (direction: 'next' | 'prev') => {
    const currentGw = parseInt(gw || '1', 10);
    const newGw = direction === 'next' ? currentGw + 1 : currentGw - 1;
    if (newGw > 0) { // Add any upper bound checks if necessary
      navigate(`/gameweek/${newGw}`);
    }
  };


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
    // --- MODIFIED: Removed lg:h-screen to allow global scroll ---
    <div className="w-full min-h-screen bg-white flex flex-col lg:flex-row font-sans">
       {/* --- MODIFIED: Added classes for sticky positioning --- */}
      <div className="hidden lg:block lg:w-2/5 p-4">
        <div className="lg:sticky lg:top-4">
            <ManagerInfoCard 
  isLoading={isExtraDataLoading}
  teamName={squad.team_name}
  managerName={user?.full_name}
  stats={hubStats}
  leagueStandings={leaderboard.slice(0, 5)}
  overallRank={userRank}
  currentUserEmail={user?.email}
/>
        </div>
      </div>

      {/* Right Column / Main Mobile View */}
      {/* --- MODIFIED: Removed lg:h-screen --- */}
      <div className="flex flex-col flex-1 lg:w-3/5">
        <div className="lg:m-4 lg:border-2 lg:border-gray-300 lg:rounded-lg flex flex-col flex-grow">
           <div className="bg-gradient-to-b from-[#37003C] to-[#23003F] p-4 lg:rounded-t-lg">
                <GameweekHeader 
    gw={gw} 
    view={view} 
    setView={setView}
    teamName={squad.team_name}
    totalPoints={gameweekStats?.user_points}
    averagePoints={gameweekStats?.average_points}
    highestPoints={gameweekStats?.highest_points}
    gwRank={userRank?.toLocaleString()}
    freeTransfers={user?.free_transfers}
    onNavigate={handleNavigation}

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
          <ManagerInfoCard 
  isLoading={isExtraDataLoading}
  teamName={squad.team_name}
  managerName={user?.full_name}
  stats={hubStats}
  leagueStandings={leaderboard.slice(0, 5)}
  overallRank={userRank}
  currentUserEmail={user?.email}
/>
      </div>

      <AnimatePresence>
        {detailedPlayer && <PlayerDetailCard player={detailedPlayer} onClose={() => setDetailedPlayer(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default Gameweek;