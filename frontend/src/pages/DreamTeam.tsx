import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PitchView } from '@/components/gameweek/PitchView';
import { ListView } from '@/components/gameweek/ListView';
import { PlayerDetailCard } from '@/components/gameweek/PlayerDetailCard';
import { API } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { transformApiPlayer, getTeamJersey } from '@/lib/player-utils';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// --- NEW, DEDICATED HEADER COMPONENT FOR THIS PAGE (COMPACT VERSION) ---
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
    <header className="p-4 text-white">
      {/* Top Row: Title & View Toggles */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-bold text-2xl text-white">Team of the Week</h1>
        <div className="bg-black/20 rounded-full p-1 flex">
            <button onClick={() => setView('pitch')} className={cn("px-3 py-1 text-xs font-semibold rounded-full transition-colors", view === 'pitch' ? 'bg-[#23003F] shadow-sm' : 'text-white/70 hover:text-white')}>Pitch View</button>
            <button onClick={() => setView('list')} className={cn("px-3 py-1 text-xs font-semibold rounded-full transition-colors", view === 'list' ? 'bg-[#23003F] shadow-sm' : 'text-white/70 hover:text-white')}>List View</button>
        </div>
      </div>

      {/* Middle Row: Gameweek Navigation */}
      <div className="flex justify-center items-center gap-4 mb-6">
        {currentGw > 1 ? (
          <Button variant="ghost" size="icon" className="bg-black/20 hover:bg-black/40 rounded-full w-8 h-8" onClick={() => onNavigate('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        ) : (
          <div className="w-8 h-8" />
        )}
        <p className="font-bold text-center text-lg text-white">Gameweek {gw || 1}</p>
        {/* Logic to hide next button on latest GW will be handled by parent */}
        <Button variant="ghost" size="icon" className="bg-black/20 hover:bg-black/40 rounded-full w-8 h-8" onClick={() => onNavigate('next')}>
            <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Bottom Row: Stats Section */}
      <div className="flex justify-around items-start">
        {/* Total Points */}
        <div className="flex flex-col items-center text-center">
            <p className="text-sm font-semibold text-white/80 mb-2">Total Points</p>
            <div className="bg-gradient-to-br from-[#00d2ff] to-[#3a47d5] rounded-xl shadow-lg p-3 w-32 text-center">
                <p className="font-black text-5xl text-white tracking-tighter">{totalPoints ?? '...'}</p>
            </div>
            <div className="flex items-center mt-2 text-white/80 font-semibold text-xs cursor-pointer hover:text-white">
                <span>Overall</span>
                <ArrowRight className="w-3 h-3 ml-1" />
            </div>
        </div>
        
        {/* Vertical Divider */}
        <div className="h-20 w-px bg-white/20"></div>

        {/* Player of the Week */}
        {playerOfTheWeek && (
            <div className="flex flex-col items-center text-center">
                <p className="text-sm font-semibold text-white/80 mb-2">Player of the Week</p>
                <div className="relative w-20 h-20 mb-1">
                    <img src={getTeamJersey(playerOfTheWeek.team)} alt="jersey" className="w-full h-full object-contain" />
                </div>
                <p className="font-bold text-md text-white">{playerOfTheWeek.full_name}</p>
                <p className="text-xs font-semibold text-white/70">{playerOfTheWeek.team.substring(0,3).toUpperCase()} {playerOfTheWeek.points}pts</p>
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
  
  const [view, setView] = useState<string>('pitch');
  const [data, setData] = useState<any>(null);
  const [detailedPlayer, setDetailedPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentGameweek, setCurrentGameweek] = useState<number | null>(null);

  useEffect(() => {
    if (!gw) return;
    const fetchDreamTeam = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [res, currentGwRes] = await Promise.all([
          fetch(API.endpoints.dreamTeam(Number(gw)), { headers }),
          fetch(`${API.BASE_URL}/gameweeks/gameweek/current`, { headers }),
        ]);

        if (!res.ok) throw new Error("Team of the Week not found");
        const json = await res.json();
        
        if (currentGwRes.ok) {
            const currentGwData = await currentGwRes.json();
            setCurrentGameweek(currentGwData.gw_number);
        }
        
        const mapDreamTeamPlayer = (p: any) => {
            const transformed = transformApiPlayer(p);
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
      }
    };
    fetchDreamTeam();
  }, [gw, toast]);

  const playerOfTheWeek = useMemo(() => {
      if (!data?.starting) return null;
      return [...data.starting].sort((a, b) => b.points - a.points)[0];
  }, [data]);

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
    <div className="w-full min-h-screen bg-white flex justify-center font-sans">
      <div className="w-full max-w-4xl p-0 md:p-4 flex flex-col h-full">
        <div className="border-b-2 md:border-2 md:border-gray-300 md:rounded-lg flex flex-col flex-grow overflow-hidden shadow-sm">
            <div className="bg-gradient-to-b from-[#37003C] to-[#23003F] md:rounded-t-lg">
                <DreamTeamHeader
                    gw={gw}
                    view={view}
                    setView={setView}
                    totalPoints={data.points}
                    onNavigate={handleNavigation}
                    currentGameweekNumber={currentGameweek}
                    playerOfTheWeek={playerOfTheWeek}
                />
            </div>
            {view === 'pitch' ? (
                <PitchView playersByPos={playersByPos} bench={data.bench} onPlayerClick={setDetailedPlayer} />
            ) : (
                <ListView players={[...data.starting, ...data.bench]} />
            )}
        </div>
      </div>
      <AnimatePresence>
        {detailedPlayer && <PlayerDetailCard player={detailedPlayer} onClose={() => setDetailedPlayer(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default DreamTeam;