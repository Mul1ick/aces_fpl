import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GameweekHeader } from '@/components/gameweek/GameweekHeader';
import { PitchView } from '@/components/gameweek/PitchView';
import { ListView } from '@/components/gameweek/ListView';
import { PlayerDetailCard } from '@/components/gameweek/PlayerDetailCard';
import { TeamViewInfoCard } from '@/components/team/TeamViewInfoCard';
import { API } from '@/lib/api';

// --- Types ---
type Position = 'GK' | 'DEF' | 'MID' | 'FWD' | string;
type PlayerView = {
  id: number | string;
  full_name: string;
  position: Position;
  team: { name: string };
  points: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  is_benched: boolean;
  // Stats fields
  breakdown?: any[];
  raw_stats?: any;
  fixture_str?: string;
  // --- ADDED STATUS TYPES TO FIX TS ERRORS ---
  status?: string;
  news?: string | null;
  chance_of_playing?: number | null;
  return_date?: string | null;
};

type TeamStats = { overall_points?: number; total_players?: number; gameweek_points?: number };

type TeamData = {
  team_name: string;
  manager_name?: string;
  stats?: TeamStats;
  overallRank?: number;
  gameweek_points?: number;
  average_points?: number;
  highest_points?: number;
  gw_rank?: string;
  transfers?: string;
  starting: PlayerView[];
  bench: PlayerView[];
  active_chip?: string | null; 
};

const TeamView: React.FC = () => {
  const { gw, userId } = useParams();
  const navigate = useNavigate();
  // --- TS FIX: Relaxed state to string ---
  const [view, setView] = useState<string>('pitch');
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [detailedPlayer, setDetailedPlayer] = useState<PlayerView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!gw || !userId) return;
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setError(null);
      setTeamData(null);
      try {
        const token = localStorage.getItem('access_token');
        if (!token) throw new Error('Not authenticated');

        const isTeamOfTheWeek = userId === 'top';
        const endpoint = isTeamOfTheWeek
          ? API.endpoints.teamOfTheWeekByGameweek(Number(gw))
          : API.endpoints.userTeam(userId, Number(gw));
        
        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        const rawText = await res.text();
        let data: any = {};
        try { data = rawText ? JSON.parse(rawText) : {}; } catch { /* keep {} */ }

        if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);

        const normPos = (pos?: string): Position => {
          if (!pos) return '';
          const p = pos.toUpperCase();
          if (p === 'GK' || p.startsWith('G')) return 'GK';
          if (p === 'DEF' || p.startsWith('D')) return 'DEF';
          if (p === 'MID' || p.startsWith('M')) return 'MID';
          if (p === 'FWD' || p.startsWith('F')) return 'FWD';
          return p;
        };

        const normalize = (players?: any[]): PlayerView[] =>
          (players ?? []).map((p: any) => ({
            id: p.id,
            full_name: p.full_name ?? p.name ?? '',
            position: normPos(p.position ?? p.pos),
            team: { name: p.team?.name ?? p.team_name ?? p.team ?? '' },
            points: Number(p.points ?? p.gw_points ?? 0),
            is_captain: Boolean(p.is_captain ?? p.captain),
            is_vice_captain: Boolean(p.is_vice_captain ?? p.vice_captain),
            is_benched: Boolean(p.is_benched ?? p.bench),
            
            // STATUS DATA KEPT SAFE
            status: p.status ?? 'ACTIVE',
            news: p.news ?? null,
            chance_of_playing: p.chance_of_playing ?? null,
            return_date: p.return_date ?? null,

            breakdown: p.breakdown || [],
            raw_stats: p.raw_stats || {},
            fixture_str: p.fixture_str || ''
          }));

        const squad = data?.squad || {};
        const startingRaw =
          (Array.isArray(data?.starting) && data.starting) ||
          (Array.isArray(squad?.starting) && squad.starting) ||
          (Array.isArray(squad?.starting11) && squad.starting11) ||
          (Array.isArray(data?.players) && data.players.filter((x: any) => !x.is_benched)) ||
          [];

        const benchRaw =
          (Array.isArray(data?.bench) && data.bench) ||
          (Array.isArray(squad?.bench) && squad.bench) ||
          (Array.isArray(squad?.subs) && squad.subs) ||
          (Array.isArray(data?.players) && data.players.filter((x: any) => x.is_benched)) ||
          [];

        setTeamData({
          team_name: data.team_name ?? data.teamName ?? 'Team of the Week',
          manager_name: data.manager_name ?? data.managerName ?? '',
          stats: data.stats ?? undefined,
          overallRank: data.overallRank ?? undefined,
          gameweek_points: data.gameweek_points ?? data.stats?.gameweek_points ?? 0,
          average_points: data.average_points ?? 0,
          highest_points: data.highest_points ?? 0,
          gw_rank: data.gw_rank ?? '',
          transfers: data.transfers ?? '',
          starting: normalize(startingRaw),
          bench: normalize(benchRaw),
          active_chip: data.active_chip 
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') setError(err.message || 'Team not found or fetch failed');
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [gw, userId]);

  // --- FIXED: Find Effective Captain ---
  const effectiveCaptainId = useMemo(() => {
    if (!teamData) return null;
    const allPlayers = [...teamData.starting, ...teamData.bench];
    const captain = allPlayers.find(p => p.is_captain);
    const viceCaptain = allPlayers.find(p => p.is_vice_captain);

    // Checks minutes first to ensure 0-point playing captains don't lose the armband
    const captainPlayed = 
        (captain?.raw_stats?.minutes > 0) || 
        (captain?.raw_stats?.played === true) || 
        (captain?.points !== 0);
    
    return (captainPlayed ? captain?.id : viceCaptain?.id) ?? null;
  }, [teamData]);

  const handleNavigation = (direction: 'next' | 'prev') => {
    const currentGw = parseInt(gw || '1', 10);
    const newGw = direction === 'next' ? currentGw + 1 : currentGw - 1;
    if (newGw > 0) {
      navigate(`/team-view/${userId || 'top'}/${newGw}`);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading team...</div>;
  if (error) return <div className="p-4 text-red-600 text-center">{error}</div>;
  if (!teamData) return null;

  const playersByPos = {
    GK: teamData.starting.filter(p => p.position === 'GK'),
    DEF: teamData.starting.filter(p => p.position === 'DEF'),
    MID: teamData.starting.filter(p => p.position === 'MID'),
    FWD: teamData.starting.filter(p => p.position === 'FWD'),
  };

  const allPlayers = [...teamData.starting, ...teamData.bench];

  return (
    <div className="w-full min-h-screen bg-white flex flex-col lg:flex-row font-sans">
      <div className="hidden lg:block lg:w-2/5 p-4">
        <div className="lg:sticky lg:top-4">
            <TeamViewInfoCard
              teamName={teamData.team_name}
              managerName={teamData.manager_name ?? ''}
              stats={{
                overall_points: teamData.stats?.overall_points ?? 0,
                total_players: teamData.stats?.total_players ?? allPlayers.length,
                gameweek_points: teamData.stats?.gameweek_points ?? 0,
              }}
              overallRank={teamData.overallRank ?? undefined}
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
              teamName={teamData.team_name}
              totalPoints={teamData.gameweek_points ?? teamData.stats?.gameweek_points ?? 0}
              averagePoints={teamData.average_points ?? 0}
              highestPoints={teamData.highest_points ?? 0}
              gwRank={teamData.gw_rank ?? ''}
              // --- TS FIX: Force string to number ---
              freeTransfers={Number(teamData.transfers || 0)}
              onNavigate={handleNavigation}
            />
          </div>

          {view === 'pitch' ? (
            <PitchView
              playersByPos={playersByPos}
              bench={teamData.bench}
              onPlayerClick={setDetailedPlayer}
              activeChip={teamData.active_chip as any} 
              // 👇 PASSED DOWN CAPTAIN ID
              effectiveCaptainId={effectiveCaptainId}
            />
          ) : (
            <ListView 
                players={allPlayers} 
                activeChip={teamData.active_chip as any} 
            />
          )}
        </div>
      </div>

       <div className="block lg:hidden p-4">
        <TeamViewInfoCard
          teamName={teamData.team_name}
          managerName={teamData.manager_name ?? ''}
          stats={{
            overall_points: teamData.stats?.overall_points ?? 0,
            total_players: teamData.stats?.total_players ?? allPlayers.length,
            gameweek_points: teamData.stats?.gameweek_points ?? 0,
          }}
          overallRank={teamData.overallRank ?? undefined}
        />
      </div>

      <AnimatePresence>
        {detailedPlayer && (
          <PlayerDetailCard
            player={detailedPlayer}
            onClose={() => setDetailedPlayer(null)}
            activeChip={teamData.active_chip as any} 
            // 👇 PASSED DOWN BOOLEAN TO MODAL
            isEffectiveCaptain={detailedPlayer.id === effectiveCaptainId}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeamView;