import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { GameweekHeader } from '@/components/gameweek/GameweekHeader';
import { PitchView } from '@/components/gameweek/PitchView';
import { ListView } from '@/components/gameweek/ListView';
import { PlayerDetailCard } from '@/components/gameweek/PlayerDetailCard';
import { TeamViewInfoCard } from '@/components/team/TeamViewInfoCard';
import { API } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { transformApiPlayer } from '@/lib/player-utils';

const DreamTeam: React.FC = () => {
  const { gw } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Explicitly typing this as string prevents the GameweekHeader TS error
  const [view, setView] = useState<string>('pitch');
  const [data, setData] = useState<any>(null);
  const [detailedPlayer, setDetailedPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gw) return;
    const fetchDreamTeam = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(API.endpoints.dreamTeam(Number(gw)), {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Dream Team not found");
        const json = await res.json();
        
        // Map players to ensure jerseys, names, and status flags work flawlessly
        const mapDreamTeamPlayer = (p: any) => {
            const transformed = transformApiPlayer(p);
            return {
                ...p, // Keep raw stats and breakdown for the side drawer
                ...transformed, // Get normalized fields
                
                // --- BULLETPROOF OVERRIDES ---
                // Ensure team is a string for PlayerCard jerseys
                team: p.team?.name || p.team_name || p.team || '',
                // Ensure BOTH pos and position exist so PitchView doesn't drop them
                pos: transformed.pos || p.position || p.pos,
                position: p.position || transformed.pos || p.pos,
                // Ensure names are mapped correctly for the drawer
                full_name: p.full_name || transformed.name || p.name,
                
                // --- INJURY & STATUS DATA ---
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
        toast({ variant: "destructive", title: "Error", description: "Could not load Dream Team." });
      } finally {
        setLoading(false);
      }
    };
    fetchDreamTeam();
  }, [gw, toast]);

  const handleNavigation = (dir: 'prev' | 'next') => {
    const current = Number(gw);
    const next = dir === 'next' ? current + 1 : current - 1;
    if (next > 0) navigate(`/dream-team/${next}`);
  };

  if (loading || !data) return <div className="p-10 text-center">Loading Dream Team...</div>;

  const playersByPos = {
    GK: data.starting.filter((p: any) => p.pos === 'GK'),
    DEF: data.starting.filter((p: any) => p.pos === 'DEF'),
    MID: data.starting.filter((p: any) => p.pos === 'MID'),
    FWD: data.starting.filter((p: any) => p.pos === 'FWD'),
  };

  return (
    <div className="w-full min-h-screen bg-white flex flex-col lg:flex-row font-sans">
      <div className="hidden lg:block lg:w-2/5 p-4">
        <TeamViewInfoCard 
            isLoading={false}
            teamName="Dream Team"
            managerName="Aces AI"
            stats={{ overall_points: data.points, total_players: 11, gameweek_points: data.points }}
        />
      </div>
      <div className="flex flex-col flex-1 lg:w-3/5">
        <div className="lg:m-4 lg:border-2 lg:border-yellow-400 lg:rounded-lg flex flex-col flex-grow">
            <div className="bg-gradient-to-b from-yellow-600 to-yellow-800 p-4 lg:rounded-t-lg">
                <GameweekHeader 
                    gw={gw} 
                    view={view} 
                    setView={setView} 
                    teamName="Dream Team"
                    totalPoints={data.points}
                    onNavigate={handleNavigation}
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