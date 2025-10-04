// frontend/src/pages/TeamOfTheWeek.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GameweekHeader } from '@/components/gameweek/GameweekHeader';
import { PitchView } from '@/components/gameweek/PitchView';
import { ListView } from '@/components/gameweek/ListView';
import { PlayerDetailCard } from '@/components/gameweek/PlayerDetailCard';
import { API } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
// ✅ 1. IMPORT THE INFO CARD COMPONENT
import { TeamViewInfoCard } from '@/components/team/TeamViewInfoCard';

// Define the structure for a player on this page
type PlayerView = {
  id: number;
  full_name: string;
  position: string;
  team: { name: string };
  points: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  is_benched: boolean;
};

// Define the structure for the API response
type TeamOfTheWeekData = {
  manager_name: string;
  team_name: string;
  points: number;
  starting: PlayerView[];
  bench: PlayerView[];
};

const LoadingSkeleton = () => (
    <div className="w-full min-h-screen bg-white flex flex-col lg:flex-row font-sans">
        {/* Desktop Skeleton */}
        <div className="hidden lg:block lg:w-2/5 p-4">
            <Skeleton className="h-full w-full rounded-lg" />
        </div>
        {/* Main Content Skeleton */}
        <div className="flex flex-col flex-1 lg:w-3/5 p-4 space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-96 w-full rounded-lg" />
        </div>
    </div>
);


const TeamOfTheWeek: React.FC = () => {
  const { gw } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [view, setView] = useState<'pitch' | 'list'>('pitch');
  const [teamData, setTeamData] = useState<TeamOfTheWeekData | null>(null);
  const [detailedPlayer, setDetailedPlayer] = useState<PlayerView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gw) return;
    
    const controller = new AbortController();
    const fetchTotw = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('access_token');
        if (!token) throw new Error('Not authenticated');

        const endpoint = API.endpoints.teamOfTheWeekByGameweek(Number(gw));
        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data?.detail || `Team of the Week for GW${gw} not found.`);

        setTeamData(data);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message);
          toast({ variant: "destructive", title: "Error", description: err.message });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTotw();
    return () => controller.abort();
  }, [gw, toast]);

  const handleNavigation = (direction: 'next' | 'prev') => {
    const currentGw = parseInt(gw || '1', 10);
    const newGw = direction === 'next' ? currentGw + 1 : currentGw - 1;
    if (newGw > 0) {
      navigate(`/team-of-the-week/${newGw}`);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500 font-bold">{error}</div>;
  }

  if (!teamData) return null;

  const playersByPos = {
    GK: teamData.starting.filter(p => p.position === 'GK'),
    DEF: teamData.starting.filter(p => p.position === 'DEF'),
    MID: teamData.starting.filter(p => p.position === 'MID'),
    FWD: teamData.starting.filter(p => p.position === 'FWD'),
  };

  const allPlayers = [...teamData.starting, ...teamData.bench];

  return (
    <>
      {/* ✅ 2. WRAP EVERYTHING IN THE TWO-COLUMN LAYOUT STRUCTURE */}
      <div className="w-full min-h-screen bg-white flex flex-col lg:flex-row font-sans">
        
        {/* Left Column (Manager Info on Desktop) */}
        <div className="hidden lg:block lg:w-2/5 p-4">
          <div className="lg:sticky lg:top-4">
            <TeamViewInfoCard
              isLoading={loading}
              teamName={teamData.team_name}
              managerName={teamData.manager_name}
              stats={{
                // For TOTW, overall points and gameweek points are the same.
                overall_points: teamData.points,
                total_players: allPlayers.length,
                gameweek_points: teamData.points,
              }}
              // Rank is not applicable for TOTW, so we pass undefined.
              overallRank={undefined}
            />
          </div>
        </div>

        {/* Right Column / Main Content */}
        <div className="flex flex-col flex-1 lg:w-3/5">
          <div className="lg:m-4 lg:border-2 lg:border-gray-300 lg:rounded-lg flex flex-col flex-grow">
            <div className="bg-gradient-to-b from-[#37003C] to-[#23003F] p-4 lg:rounded-t-lg">
              <GameweekHeader
                gw={gw}
                view={view}
                setView={setView}
                teamName={teamData.team_name}
                totalPoints={teamData.points}
                onNavigate={handleNavigation}
              />
            </div>

            {view === 'pitch' ? (
              <PitchView
                playersByPos={playersByPos}
                bench={teamData.bench}
                onPlayerClick={setDetailedPlayer}
              />
            ) : (
              <ListView players={allPlayers} />
            )}
          </div>
        </div>

        {/* Manager Info Card (Mobile Only) */}
        <div className="block lg:hidden p-4">
          <TeamViewInfoCard
            isLoading={loading}
            teamName={teamData.team_name}
            managerName={teamData.manager_name}
            stats={{
              overall_points: teamData.points,
              total_players: allPlayers.length,
              gameweek_points: teamData.points,
            }}
            overallRank={undefined}
          />
        </div>
      </div>

      <AnimatePresence>
        {detailedPlayer && (
          <PlayerDetailCard player={detailedPlayer} onClose={() => setDetailedPlayer(null)} />
        )}
      </AnimatePresence>
    </>
  );
};

export default TeamOfTheWeek;