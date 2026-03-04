import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { GameweekHeader } from '@/components/gameweek/GameweekHeader';
import { PitchView } from '@/components/gameweek/PitchView';
import { ListView } from '@/components/gameweek/ListView';
import { PlayerDetailCard } from '@/components/gameweek/PlayerDetailCard';
import { TeamViewInfoCard } from '@/components/team/TeamViewInfoCard';
import { API, ChipName } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

// --- TYPESCRIPT FIXES ---
type PlayerView = {
  id: number;
  full_name: string;
  name?: string; 
  position: string;
  pos?: string;  
  team: any;     
  points: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  is_benched: boolean;
  raw_stats?: any;
  breakdown?: any[];
  status?: string;
  news?: string | null;
  chance_of_playing?: number | null;
  return_date?: string | null;
};

type TeamOfTheWeekData = {
  manager_name: string;
  team_name: string;
  points: number;
  starting: PlayerView[];
  bench: PlayerView[];
};

const LoadingSkeleton = () => (
    <div className="w-full min-h-screen bg-white flex flex-col lg:flex-row font-sans">
        <div className="hidden lg:block lg:w-2/5 p-4">
            <Skeleton className="h-full w-full rounded-lg" />
        </div>
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

  const [view, setView] = useState<string>('pitch'); 
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

        // --- FIXED: Explicitly requires isBenched to satisfy your Type ---
        const mapPlayer = (p: any, isBenched: boolean): PlayerView => {
            const statsObj = p.raw_stats || p.stats || p;
            
            return {
                ...p,
                full_name: p.full_name || p.name || '',
                name: p.full_name || p.name || '',
                position: p.position || p.pos || '',
                pos: p.position || p.pos || '',
                team: p.team?.name || p.team_name || p.team || '',
                is_captain: p.is_captain || p.isCaptain || false,
                is_vice_captain: p.is_vice_captain || p.isVice || false,
                is_benched: isBenched, // Satisfies strict type
                status: p.status ?? 'ACTIVE',
                news: p.news ?? null,
                chance_of_playing: p.chance_of_playing ?? null,
                return_date: p.return_date ?? null,
                raw_stats: {
                    ...statsObj,
                    played: statsObj.played === true || statsObj.played === 1 || statsObj.played === "true" || (p.points !== 0)
                },
                points: Number(p.points || 0)
            };
        };

        setTeamData({
            ...data,
            starting: (data.starting || []).map((p: any) => mapPlayer(p, false)),
            bench: (data.bench || []).map((p: any) => mapPlayer(p, true))
        });
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

  // --- FIXED: Safer Captain Fallback Logic ---
 // --- FIXED: Safer Captain Fallback Logic ---
  // --- FIXED: Mathematical Deduction for Effective Captain ---
  const effectiveCaptainId = useMemo(() => {
    if (!teamData) return null;
    // Note: We only sum starting players for the raw total comparison
    const rawTotal = teamData.starting.reduce((sum, p) => sum + Number(p.points || 0), 0);
    const bonusPortion = Number(teamData.points) - rawTotal;

    const allPlayers = [...teamData.starting, ...teamData.bench];
    const captain = allPlayers.find(p => p.is_captain);
    const viceCaptain = allPlayers.find(p => p.is_vice_captain);

    if (!captain) return viceCaptain?.id ?? null;

    // 1. If the bonus portion is 0, it implies the Multiplier was applied to a player with 0 points.
    // Since the Captain has priority, if the backend calculated 0 bonus, the Captain kept the armband.
    if (bonusPortion === 0) {
        return captain.id;
    }

    const capPoints = Number(captain.points || 0);
    const vicePoints = Number(viceCaptain?.points || 0);

    // 2. Did the Captain provide the bonus? (Matches Standard 2x or Triple 3x)
    if (bonusPortion === capPoints || bonusPortion === capPoints * 2) {
        return captain.id;
    }

    // 3. Did the Vice Captain provide the bonus?
    if (viceCaptain && (bonusPortion === vicePoints || bonusPortion === vicePoints * 2)) {
        return viceCaptain.id;
    }

    // 4. Fallback: Stat-based check (Only runs if math above is ambiguous)
    const stats = captain.raw_stats || {};
    const hasStats = 
        (Number(stats.goals_scored) > 0) || 
        (Number(stats.assists) > 0) || 
        (Number(stats.yellow_cards) > 0) || 
        (Number(stats.red_cards) > 0) || 
        (Number(stats.bonus_points) > 0) || 
        (Number(stats.goals_conceded) > 0) || 
        (Number(stats.own_goals) > 0) || 
        (Number(stats.penalties_missed) > 0) || 
        (Number(stats.penalties_saved) > 0) || 
        (stats.clean_sheets === true || stats.clean_sheets === 1 || stats.clean_sheets === "true") ||
        (stats.played === true || stats.played === 1 || stats.played === "true");

    const captainPlayed = (capPoints !== 0) || hasStats;
    
    return (captainPlayed ? captain.id : viceCaptain?.id) ?? null;
  }, [teamData]);

  const derivedActiveChip = useMemo<ChipName | null>(() => {
    if (!teamData || !teamData.starting || !effectiveCaptainId) return null;

    const bonusTarget = teamData.starting.find((p) => p.id === effectiveCaptainId);
    if (!bonusTarget || bonusTarget.points === 0) return null;

    const rawTotal = teamData.starting.reduce((sum, p) => sum + p.points, 0);
    const bonusPointsPart = teamData.points - rawTotal;

    if (Math.abs(bonusPointsPart - (bonusTarget.points * 2)) < 0.1) {
      return 'TRIPLE_CAPTAIN';
    }
    return null;
  }, [teamData, effectiveCaptainId]);

  const handleNavigation = (direction: 'next' | 'prev') => {
    const currentGw = parseInt(gw || '1', 10);
    const newGw = direction === 'next' ? currentGw + 1 : currentGw - 1;
    if (newGw > 0) {
      navigate(`/team-of-the-week/${newGw}`);
    }
  };

  if (loading) return <LoadingSkeleton />;
  if (error) return <div className="p-4 text-center text-red-500 font-bold">{error}</div>;
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
      <div className="w-full min-h-screen bg-white flex flex-col lg:flex-row font-sans">
        
        <div className="hidden lg:block lg:w-2/5 p-4 text-black">
          <div className="lg:sticky lg:top-4">
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

        <div className="flex flex-col flex-1 lg:w-3/5">
          <div className="lg:m-4 lg:border-2 lg:border-gray-300 lg:rounded-lg flex flex-col flex-grow text-black">
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
                activeChip={derivedActiveChip}
                effectiveCaptainId={effectiveCaptainId}
              />
            ) : (
              <ListView 
                players={allPlayers} 
                activeChip={derivedActiveChip}
                effectiveCaptainId={effectiveCaptainId}
              />
            )}
          </div>
        </div>

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
          <PlayerDetailCard 
            player={detailedPlayer} 
            onClose={() => setDetailedPlayer(null)} 
            activeChip={derivedActiveChip}
            isEffectiveCaptain={detailedPlayer.id === effectiveCaptainId}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default TeamOfTheWeek;