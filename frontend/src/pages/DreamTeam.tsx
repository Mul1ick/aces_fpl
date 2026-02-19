import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PitchView } from '@/components/gameweek/PitchView';
import { ListView } from '@/components/gameweek/ListView';
import { PlayerDetailCard } from '@/components/gameweek/PlayerDetailCard';
import { ManagerInfoCard } from '@/components/gameweek/ManagerInfoCard';
import { useAuth } from '@/contexts/AuthContext';
import { API } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { transformApiPlayer, getTeamJersey } from '@/lib/player-utils';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// --- COMPACT HEADER ---
interface DreamTeamHeaderProps {
  gw: string | undefined;
  view: string;
  setView: (view: string) => void;
  totalPoints?: number;
  onNavigate: (direction: 'prev' | 'next') => void;
  playerOfTheWeek: any; // The highest scoring player object
}

const DreamTeamHeader: React.FC<DreamTeamHeaderProps> = ({
    gw,
    view,
    setView,
    totalPoints,
    onNavigate,
    playerOfTheWeek,
}) => {
  const currentGw = parseInt(gw || '1', 10);
  return (
    <header className="p-3 text-white">
      {/* Top Row: Title & View Toggles */}
      <div className="flex justify-between items-center mb-2">
        <h1 className="font-bold text-xl text-white">Team of the Week</h1>
        <div className="bg-black/20 rounded-full p-1 flex">
            <button onClick={() => setView('pitch')} className={cn("px-3 py-1 text-[10px] md:text-xs font-semibold rounded-full transition-colors", view === 'pitch' ? 'bg-[#23003F] shadow-sm' : 'text-white/70 hover:text-white')}>Pitch View</button>
            <button onClick={() => setView('list')} className={cn("px-3 py-1 text-[10px] md:text-xs font-semibold rounded-full transition-colors", view === 'list' ? 'bg-[#23003F] shadow-sm' : 'text-white/70 hover:text-white')}>List View</button>
        </div>
      </div>

      {/* Middle Row: Gameweek Navigation */}
      <div className="flex justify-center items-center gap-3 mb-3">
        {currentGw > 1 ? (
          <Button variant="ghost" size="icon" className="bg-black/20 hover:bg-black/40 rounded-full w-7 h-7" onClick={() => onNavigate('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        ) : (
          <div className="w-7 h-7" />
        )}
        <p className="font-bold text-center text-base text-white">Gameweek {gw || 1}</p>
        <Button variant="ghost" size="icon" className="bg-black/20 hover:bg-black/40 rounded-full w-7 h-7" onClick={() => onNavigate('next')}>
            <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Bottom Row: Stats Section (Now Centered) */}
      <div className="flex justify-center items-start gap-12 md:gap-24">
        {/* Total Points */}
        <div className="flex flex-col items-center text-center">
            <p className="text-xs font-semibold text-white/80 mb-1">Total Points</p>
            <div className="bg-gradient-to-br from-[#00d2ff] to-[#3a47d5] rounded-xl shadow-md p-2 w-24 text-center">
                <p className="font-black text-3xl text-white tracking-tighter">{totalPoints ?? '...'}</p>
            </div>
            
        </div>
        
        {/* Vertical Divider */}
        <div className="h-16 w-px bg-white/20"></div>

        {/* Player of the Week */}
        {playerOfTheWeek && (
            <div className="flex flex-col items-center text-center">
                <p className="text-xs font-semibold text-white/80 mb-1">Player of the Week</p>
                <div className="relative w-14 h-14 mb-1">
                    <img src={getTeamJersey(playerOfTheWeek.team)} alt="jersey" className="w-full h-full object-contain" />
                </div>
                <p className="font-bold text-sm text-white">{playerOfTheWeek.full_name}</p>
                <p className="text-[10px] font-semibold text-white/70">{playerOfTheWeek.team.substring(0,3).toUpperCase()} {playerOfTheWeek.points}pts</p>
            </div>
        )}
      </div>
    </header>
  );
};

// --- MAIN PAGE COMPONENT ---
const DreamTeam: React.FC = () => {
  const { gw } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [view, setView] = useState<string>('pitch');
  const [data, setData] = useState<any>(null);
  const [detailedPlayer, setDetailedPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentGameweek, setCurrentGameweek] = useState<number | null>(null);

  // States for ManagerInfoCard
  const [hubStats, setHubStats] = useState<any>({
    overall_points: 0, gameweek_points: 0, total_players: 0, squad_value: 0.0, in_the_bank: 0.0, gameweek_transfers: 0, total_transfers: 0,
  });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isExtraDataLoading, setIsExtraDataLoading] = useState(true);

  useEffect(() => {
    if (!gw) return;
    const fetchDreamTeam = async () => {
      setLoading(true);
      setIsExtraDataLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [res, currentGwRes, hubRes, leaderboardRes] = await Promise.all([
          fetch(API.endpoints.dreamTeam(Number(gw)), { headers }),
          fetch(`${API.BASE_URL}/gameweeks/gameweek/current`, { headers }),
          fetch(API.endpoints.userStats, { headers }),
          fetch(API.endpoints.leaderboard, { headers }),
        ]);

        if (!res.ok) throw new Error("Team of the Week not found");
        const json = await res.json();
        
        if (currentGwRes.ok) {
            const currentGwData = await currentGwRes.json();
            setCurrentGameweek(currentGwData.gw_number);
        }

        if (hubRes.ok) setHubStats(await hubRes.json());
        if (leaderboardRes.ok) setLeaderboard(await leaderboardRes.json());
        
        const mapDreamTeamPlayer = (p: any) => {
            const transformed = transformApiPlayer(p);
            const statsObj = p.raw_stats || p.stats || p; // Safe extraction

            return {
                ...p, ...transformed,
                team: p.team?.name || p.team_name || p.team || '',
                pos: transformed.pos || p.position || p.pos,
                position: p.position || transformed.pos || p.pos,
                full_name: p.full_name || transformed.name || p.name,
                status: p.status ?? 'ACTIVE',
                news: p.news ?? null,
                chance_of_playing: p.chance_of_playing ?? null,
                return_date: p.return_date ?? null,
                // 👇 EXPLICITLY CAPTURE BREAKDOWN AND RAW STATS
                raw_stats: {
                    ...statsObj,
                    played: statsObj.played === true || statsObj.played === 1 || statsObj.played === "true" || (p.points > 0)
                },
                breakdown: p.breakdown || [],
            };
        };

        const starting = (json.starting || []).map(mapDreamTeamPlayer);
        const bench = (json.bench || []).map(mapDreamTeamPlayer);
        
        setData({ ...json, starting, bench });
      } catch (e) {
        console.error(e);
        toast({ variant: "destructive", title: "Error", description: "Could not load Team of the Week." });
      } finally {
        setLoading(false);
        setIsExtraDataLoading(false);
      }
    };
    fetchDreamTeam();
  }, [gw, toast]);

  const playerOfTheWeek = useMemo(() => {
      if (!data?.starting) return null;
      return [...data.starting].sort((a, b) => b.points - a.points)[0];
  }, [data]);

  const userEntry = useMemo(() => {
    if (!leaderboard || !user) return undefined;
    return leaderboard.find((entry: any) => entry.manager_email === user.email);
  }, [leaderboard, user]);

  const handleNavigation = (dir: 'prev' | 'next') => {
    const current = Number(gw);
    const next = dir === 'next' ? current + 1 : current - 1;
    if (next > 0) navigate(`/dream-team/${next}`);
  };

  if (loading || !data) return <div className="p-10 text-center">Loading Team of the Week...</div>;

  const playersByPos = {
    GK: data.starting.filter((p: any) => p.pos === 'GK'),
    DEF: data.starting.filter((p: any) => p.pos === 'DEF'),
    MID: data.starting.filter((p: any) => p.pos === 'MID'),
    FWD: data.starting.filter((p: any) => p.pos === 'FWD'),
  };

  return (
    <div className="w-full min-h-screen bg-white flex flex-col lg:flex-row font-sans">
      
      {/* LEFT SIDE: Manager Info Card */}
      <div className="hidden lg:block lg:w-2/5 p-4 text-black">
        <div className="lg:sticky lg:top-4">
            <ManagerInfoCard
              isLoading={isExtraDataLoading}
              teamName={userEntry?.team_name || "Manager"}
              managerName={user?.full_name}
              stats={hubStats}
              leagueStandings={leaderboard.slice(0, 5)}
              overallRank={userEntry?.rank}
              currentUserEmail={user?.email}
            />
        </div>
      </div>

      {/* RIGHT SIDE: Pitch and Header */}
      <div className="flex flex-col flex-1 lg:w-3/5">
        <div className="lg:m-4 lg:border-2 lg:border-gray-300 lg:rounded-lg flex flex-col flex-grow">
            <div className="bg-gradient-to-b from-[#37003C] to-[#23003F] lg:rounded-t-lg">
                <DreamTeamHeader
                    gw={gw}
                    view={view}
                    setView={setView}
                    totalPoints={data.points}
                    onNavigate={handleNavigation}
                    playerOfTheWeek={playerOfTheWeek}
                />
            </div>
            
            {view === 'pitch' ? (
                <PitchView 
                    playersByPos={playersByPos} 
                    bench={data.bench} 
                    onPlayerClick={setDetailedPlayer} 
                    // 👇 FORCE THE MATH TO STAY 1x
                    effectiveCaptainId={null} 
                />
            ) : (
                <ListView players={[...data.starting, ...data.bench]} />
            )}
        </div>
      </div>

      {/* BOTTOM SIDE: Mobile Manager Info Card */}
      <div className="block lg:hidden p-4">
          <ManagerInfoCard
              isLoading={isExtraDataLoading}
              teamName={userEntry?.team_name || "Manager"}
              managerName={user?.full_name}
              stats={hubStats}
              leagueStandings={leaderboard.slice(0, 5)}
              overallRank={userEntry?.rank}
              currentUserEmail={user?.email}
          />
      </div>

      <AnimatePresence>
        {detailedPlayer && (
            <PlayerDetailCard 
                player={detailedPlayer} 
                onClose={() => setDetailedPlayer(null)} 
                // 👇 FORCE THE MODAL TO NOT DOUBLE THE BREAKDOWN
                isEffectiveCaptain={false}
            />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DreamTeam;