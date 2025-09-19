import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GameweekHeader } from '@/components/gameweek/GameweekHeader';
import { PitchView } from '@/components/gameweek/PitchView';
import { ListView } from '@/components/gameweek/ListView';
import { PlayerDetailCard } from '@/components/gameweek/PlayerDetailCard';
import { TeamViewInfoCard } from '@/components/team/TeamViewInfoCard'; // <-- 1. IMPORT THE NEW CARD
import { API } from '@/lib/api';

// --- Placeholder Data for an 8+3 Squad ---
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
};

const TeamView: React.FC = () => {
  const { gw, userId } = useParams();
  const navigate = useNavigate();
  const [view, setView] = useState<'pitch' | 'list'>('pitch');
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

      const res = await fetch(API.endpoints.userTeam(userId, Number(gw)), {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      const rawText = await res.text();
      let data: any = {};
      try { data = rawText ? JSON.parse(rawText) : {}; } catch { /* keep {} */ }

      // quick visibility while debugging
      console.log('TeamView response', res.status, data);

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
          team: { name: p.team?.name ?? p.team_name ?? '' },
          points: Number(p.points ?? p.gw_points ?? 0),
          is_captain: Boolean(p.is_captain ?? p.captain),
          is_vice_captain: Boolean(p.is_vice_captain ?? p.vice_captain),
          is_benched: Boolean(p.is_benched ?? p.bench),
        }));

      // Accept multiple server shapes:
      // A) { starting, bench }
      // B) { players: [...] with is_benched flags }
      // C) { squad: { starting11/subs } }
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
        team_name: data.team_name ?? data.teamName ?? '',
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
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') setError(err.message || 'Team not found or fetch failed');
    } finally {
      setLoading(false);
    }
  })();

  return () => controller.abort();
}, [gw, userId]);

  const handleNavigation = (direction: 'next' | 'prev') => {
    const currentGw = parseInt(gw || '1', 10);
    const newGw = direction === 'next' ? currentGw + 1 : currentGw - 1;
    if (newGw > 0) {
      navigate(`/team-view/${userId || 'top'}/${newGw}`);
    }
  };
  if (loading) return <div className="p-4">Loading…</div>;
if (error) return <div className="p-4 text-red-600">{error}</div>;
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
      {/* --- Left Column (Manager Info on Desktop) --- */}
      <div className="hidden lg:block lg:w-2/5 p-4">
        <div className="lg:sticky lg:top-4">
            {/* --- 2. USE THE NEW CARD COMPONENT --- */}
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

      {/* --- Right Column / Main Content --- */}
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
  freeTransfers={teamData.transfers ?? ''}
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

       {/* --- Manager Info Card (Mobile Only) --- */}
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
    />
  )}
</AnimatePresence>
    </div>
  );
};

export default TeamView;