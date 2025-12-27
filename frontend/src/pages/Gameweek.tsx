import React, { useState, useEffect, useMemo } from 'react';
import { TeamResponse } from "../types";
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { GameweekHeader } from '../components/gameweek/GameweekHeader';
import { PitchView } from '../components/gameweek/PitchView';
import { ListView } from '../components/gameweek/ListView';
import { ManagerInfoCard } from '../components/gameweek/ManagerInfoCard';
import { API, getChipStatus, ChipStatus } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { PlayerDetailCard } from '../components/gameweek/PlayerDetailCard';

const Gameweek: React.FC = () => {
  const { gw } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [view, setView] = useState('pitch');
  const [detailedPlayer, setDetailedPlayer] = useState<any>(null);
  const [squad, setSquad] = useState<TeamResponse | null>(null);
  const [gameweekStats, setGameweekStats] = useState<any>(null);
  const [hubStats, setHubStats] = useState<any>({
    overall_points: 0,
    gameweek_points: 0,
    total_players: 0,
    squad_value: 0.0,
    in_the_bank: 0.0,
    gameweek_transfers: 0,
    total_transfers: 0,
  });

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isExtraDataLoading, setIsExtraDataLoading] = useState(true);
  const [currentGameweek, setCurrentGameweek] = useState<number | null>(null);
  const [chipStatus, setChipStatus] = useState<ChipStatus | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token || !gw) {
       return;
    }

    const gameweekNumber = parseInt(gw, 10);

    const fetchAllData = async () => {
       setIsExtraDataLoading(true);
      try {
        const [teamRes, hubRes, leaderboardRes, gwStatsRes, currentGwRes, chipStatusRes] = await Promise.all([
            fetch(API.endpoints.team(gameweekNumber), { headers: { Authorization: `Bearer ${token}` } }),
            fetch(API.endpoints.userStats, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(API.endpoints.leaderboard, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API.endpoints.gameweek}/${gameweekNumber}/stats`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API.BASE_URL}/gameweeks/gameweek/current`, { headers: { Authorization: `Bearer ${token}` } }),
            getChipStatus(token, gameweekNumber)
        ]);

        if (!teamRes.ok) throw new Error("Failed to fetch team data");
        if (!hubRes.ok || !leaderboardRes.ok || !gwStatsRes.ok) console.warn("Failed to fetch manager or gameweek data");

        const teamData: TeamResponse = await teamRes.json();
        setSquad(teamData);

        if (hubRes.ok) setHubStats(await hubRes.json());
        if (leaderboardRes.ok) setLeaderboard(await leaderboardRes.json());
        if (gwStatsRes.ok) setGameweekStats(await gwStatsRes.json());

        if (currentGwRes.ok) {
            const currentGwData = await currentGwRes.json();
            setCurrentGameweek(currentGwData.gw_number);
        }
        
        setChipStatus(chipStatusRes);

      } catch (error) {
        console.error("Error fetching data:", error);
        toast({ variant: "destructive", title: "Could not load page data." });
      } finally {
         setIsExtraDataLoading(false);
      }
    };

    fetchAllData();
  }, [toast, gw, user]);

  // --- NEW LOGIC: Determine Effective Captain for Modal Points ---
  const effectiveCaptainId = useMemo(() => {
    if (!squad) return null;
    const allPlayers = [...squad.starting, ...squad.bench];
    
    // Using property names matching your types.ts
    const captain = allPlayers.find(p => p.is_captain);
    const viceCaptain = allPlayers.find(p => p.is_vice_captain);

    // Using 'as any' to access raw_stats which isn't in the base Player type
    const captainPlayed = (captain as any)?.raw_stats?.played === true;
    
    return captainPlayed ? captain?.id : viceCaptain?.id;
  }, [squad]);

  const userRank = useMemo(() => {
    if (!leaderboard || !user) return undefined;
    const userEntry = leaderboard.find((entry: any) => entry.manager_email === user.email);
    return userEntry?.rank;
  }, [leaderboard, user]);

  const handleNavigation = (direction: 'next' | 'prev') => {
    const currentGw = parseInt(gw || '1', 10);
    const newGw = direction === 'next' ? currentGw + 1 : currentGw - 1;
    if (newGw > 0) {
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
    <div className="w-full min-h-screen bg-white flex flex-col lg:flex-row font-sans">
      <div className="hidden lg:block lg:w-2/5 p-4 text-black">
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
                    currentGameweekNumber={currentGameweek}
                />
            </div>

             {view === 'pitch' ? (
               <PitchView 
                  playersByPos={playersByPos} 
                  bench={squad.bench} 
                  onPlayerClick={setDetailedPlayer} 
                  activeChip={chipStatus?.active}
                />
            ) : (
                <ListView 
                  players={allPlayers} 
                  activeChip={chipStatus?.active}
                />
            )}
        </div>
      </div>

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
        {detailedPlayer && (
          <PlayerDetailCard 
            player={detailedPlayer} 
            onClose={() => setDetailedPlayer(null)} 
            activeChip={chipStatus?.active}
            isEffectiveCaptain={detailedPlayer.id === effectiveCaptainId} // --- ADDED ---
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gameweek;