import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PlayerCard from '@/components/layout/PlayerCard';
import { ManagerInfoCard } from '@/components/gameweek/ManagerInfoCard';
import { GameweekChips } from '@/components/team/GameweekChips';
import { FixturesCard } from '@/components/team/FixturesCard';
import { EditablePlayerCard } from '@/components/team/EditablePlayerCard';
import { cn } from '@/lib/utils';
import { TeamResponse } from "@/types";
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { API } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isValid } from 'date-fns';

import pitchBackground from '@/assets/images/pitch.png';
import acesLogo from "@/assets/aces-logo.png";

const TeamPageSkeleton = () => (
    <div className="w-full min-h-screen bg-white flex flex-col lg:h-screen lg:flex-row font-sans">
        <div className="hidden lg:block lg:w-2/5 p-4 h-screen overflow-y-auto">
            <Skeleton className="h-full w-full rounded-lg" />
        </div>
        <div className="flex flex-col flex-1 lg:w-3/f lg:h-screen">
            <div className="p-4 space-y-4">
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-[72px] w-full rounded-lg" />
            </div>
             <main 
                className="flex-1 relative flex flex-col justify-around py-4"
                style={{ backgroundImage: `url(${pitchBackground})`, backgroundSize: 'cover', backgroundPosition: 'center top' }}
            >
                <div className="flex justify-center"><Skeleton className="h-28 w-20 rounded-md" /></div>
                <div className="flex justify-center gap-8"><Skeleton className="h-28 w-20 rounded-md" /><Skeleton className="h-28 w-20 rounded-md" /><Skeleton className="h-28 w-20 rounded-md" /></div>
                <div className="flex justify-center gap-8"><Skeleton className="h-28 w-20 rounded-md" /><Skeleton className="h-28 w-20 rounded-md" /><Skeleton className="h-28 w-20 rounded-md" /></div>
                <div className="flex justify-center gap-8"><Skeleton className="h-28 w-20 rounded-md" /><Skeleton className="h-28 w-20 rounded-md" /></div>
            </main>
            <footer className="flex-shrink-0 p-3 bg-gray-100 border-t">
                <div className="grid grid-cols-3 gap-4 place-items-center">
                    <Skeleton className="h-[90px] w-[70px] rounded-md" />
                    <Skeleton className="h-[90px] w-[70px] rounded-md" />
                    <Skeleton className="h-[90px] w-[70px] rounded-md" />
                </div>
            </footer>
            <div className="p-4 text-center bg-white border-t-2 border-gray-200">
                <Skeleton className="h-[60px] w-48 mx-auto rounded-lg" />
            </div>
            <div className="p-4">
                <Skeleton className="h-48 w-full rounded-lg" />
            </div>
        </div>
    </div>
);

const Team: React.FC = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [squad, setSquad] = useState<{ starting: any[], bench: any[], team_name?: string }>({ starting: [], bench: [] });
    const [initialSquadState, setInitialSquadState] = useState<string>('');
    const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
    const [detailedPlayer, setDetailedPlayer] = useState<any | null>(null);
    const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hubStats, setHubStats] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [isExtraDataLoading, setIsExtraDataLoading] = useState(true);
    const [gameweek, setGameweek] = useState<{ gw_number: number; deadline: string; id: number } | null>(null);

    // --- ADDED: State for fixtures ---
    const [allGameweeks, setAllGameweeks] = useState<any[]>([]);
    const [allFixtures, setAllFixtures] = useState<any[]>([]);
    const [fixtureView, setFixtureView] = useState<'previous' | 'current' | 'next'>('current');

    const token = typeof window !== 'undefined' ? localStorage.getItem("access_token") || "" : "";

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        setIsLoading(true);
        setIsExtraDataLoading(true);

        const fetchAllData = async () => {
            try {
                // --- MODIFIED: Fetch gameweeks and fixtures ---
                const [teamRes, hubRes, leaderboardRes, gameweekRes, allGameweeksRes, allFixturesRes] = await Promise.all([
                    fetch(API.endpoints.team(), { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(API.endpoints.userStats, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(API.endpoints.leaderboard, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API.BASE_URL}/gameweeks/gameweek/current`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(API.endpoints.gameweek, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(API.endpoints.fixtures, { headers: { Authorization: `Bearer ${token}` } })
                ]);

                if (!teamRes.ok) throw new Error("Failed to fetch team data");
                if (!hubRes.ok || !leaderboardRes.ok || !gameweekRes.ok) console.warn("Failed to fetch manager or gameweek data");

                // Process Team Data
                const teamData: TeamResponse = await teamRes.json();
                const transformPlayer = (p: any) => ({
                    id: p.id, name: p.full_name, full_name: p.full_name, pos: p.position,
                    position: p.position, team: p.team?.name, team_obj: p.team,
                    price: p.price, points: p.points, fixture: p.fixture_str, fixture_str: p.fixture_str,
                    isCaptain: p.is_captain, isVice: p.is_vice_captain, is_captain: p.is_captain,
                    is_vice_captain: p.is_vice_captain, is_benched: p.is_benched,
                    recent_fixtures: p.recent_fixtures, raw_stats: p.raw_stats, breakdown: p.breakdown,
                });
                const starting = teamData.starting.map(transformPlayer);
                const bench = teamData.bench.map(transformPlayer);
                const currentSquad = { starting, bench, team_name: teamData.team_name };
                setSquad(currentSquad);
                setInitialSquadState(JSON.stringify(currentSquad));
                
                // Process Hub, Leaderboard, Gameweek and Fixture Data
                if (hubRes.ok) setHubStats(await hubRes.json());
                if (leaderboardRes.ok) setLeaderboard(await leaderboardRes.json());
                if (gameweekRes.ok) setGameweek(await gameweekRes.json());
                if (allGameweeksRes.ok) setAllGameweeks(await allGameweeksRes.json());
                if (allFixturesRes.ok) setAllFixtures(await allFixturesRes.json());

            } catch (err) {
                console.error("Failed to fetch initial data:", err);
                setSquad({ starting: [], bench: [] });
                toast({ variant: "destructive", title: "Could not load your team." });
            } finally {
                setIsLoading(false);
                setIsExtraDataLoading(false);
            }
        };
        
        fetchAllData();
    }, [toast]);

    const userRank = useMemo(() => {
        if (!leaderboard || !user) return undefined;
        const userEntry: any = leaderboard.find((entry: any) => entry.manager_email === user.email);
        return userEntry?.rank;
    }, [leaderboard, user]);

    // --- ADDED: Memo hook to filter fixtures for the selected view ---
    const displayedFixtures = useMemo(() => {
        if (!gameweek || allFixtures.length === 0 || allGameweeks.length === 0) return [];

        const currentGw = allGameweeks.find(gw => gw.id === gameweek.id);
        if (!currentGw) return [];
        
        let targetGwNumber;
        if (fixtureView === 'current') targetGwNumber = currentGw.gw_number;
        else if (fixtureView === 'previous') targetGwNumber = currentGw.gw_number - 1;
        else targetGwNumber = currentGw.gw_number + 1;

        const targetGw = allGameweeks.find(gw => gw.gw_number === targetGwNumber);
        if (!targetGw) return [];
        
        return allFixtures.filter(f => f.gameweek_id === targetGw.id);
    }, [fixtureView, gameweek, allFixtures, allGameweeks]);

    const isDirty = useMemo(() => {
        return JSON.stringify(squad) !== initialSquadState;
    }, [squad, initialSquadState]);

    const benchLayout = useMemo(() => {
        if (!squad || !squad.bench) return { goalkeeper: null, outfielders: [] };
        
        const goalkeeper = squad.bench.find(p => p.pos === 'GK') || null;
        const outfielders = squad.bench.filter(p => p.pos !== 'GK');
        
        return { goalkeeper, outfielders };
    }, [squad]);

    const handlePlayerClick = (clickedPlayer: any) => {
        if (selectedPlayer) {
            if (selectedPlayer.id === clickedPlayer.id || selectedPlayer.is_benched === clickedPlayer.is_benched) {
                 setSelectedPlayer(null);
                return;
            }

            const starter = selectedPlayer.is_benched ? clickedPlayer : selectedPlayer;
            const benched = selectedPlayer.is_benched ? selectedPlayer : clickedPlayer;

            const tempStartingXI = squad.starting.filter(p => p.id !== starter.id).concat(benched);
            const goalkeepers = tempStartingXI.filter(p => p.pos === 'GK').length;
            if (goalkeepers !== 1) {
                 toast({ variant: "destructive", title: "Invalid Substitution", description: "Your starting team must have exactly one goalkeeper." });
                setSelectedPlayer(null);
                return;
            }
            
            let newStarterPlayer = { ...benched, is_benched: false, isCaptain: false, isVice: false };
            let newBenchedPlayer = { ...starter, is_benched: true, isCaptain: false, isVice: false };

            if (starter.isCaptain) {
                newStarterPlayer.isCaptain = true;
            }
            if (starter.isVice) {
                newStarterPlayer.isVice = true;
            }
            
            setSquad((currentSquad: any) => {
                const updatedStarting = currentSquad.starting.filter((p: any) => p.id !== starter.id).concat(newStarterPlayer);
                const updatedBench = currentSquad.bench.filter((p: any) => p.id !== benched.id).concat(newBenchedPlayer);
                return { ...currentSquad, starting: updatedStarting, bench: updatedBench };
            });

            setSelectedPlayer(null);
        } else {
            setDetailedPlayer(clickedPlayer);
        }
    };

    const handleSelectForSub = (playerToSub: any) => {
        const isBenched = squad.bench.some(p => p.id === playerToSub.id);
        setSelectedPlayer({ ...playerToSub, is_benched: isBenched });
        setDetailedPlayer(null);
    };

    const setArmband = (playerId: number, kind: 'C' | 'VC') => {
        const player = squad.starting.find(p => p.id === playerId) || squad.bench.find(p => p.id === playerId);
        
        if (player.is_benched) {
            toast({ variant: "destructive", title: "Invalid Action", description: "Captain and Vice-Captain must be in the starting XI." });
            return;
        }

        setSquad((currentSquad: any) => {
            const newStarting = currentSquad.starting.map((p: any) => {
                if (kind === 'C') p.isCaptain = false;
                 if (kind === 'VC') p.isVice = false;
                return p;
            });

            const targetPlayer = newStarting.find((p: any) => p.id === playerId);
            if (targetPlayer) {
                if (kind === 'C') {
                    targetPlayer.isCaptain = true;
                    if (targetPlayer.isVice) targetPlayer.isVice = false;
                }
                if (kind === 'VC') {
                    targetPlayer.isVice = true;
                    if (targetPlayer.isCaptain) targetPlayer.isCaptain = false;
                }
            }
            
             return { ...currentSquad, starting: newStarting };
        });

        toast({ title: "Success", description: `${player.name} is now your ${kind === 'C' ? 'Captain' : 'Vice-Captain'}.` });
        setDetailedPlayer(null);
    };

    const handleViewProfile = () => {
        navigate('/stats');
        setDetailedPlayer(null);
    };

    const handleReset = () => {
        if (initialSquadState) {
             setSquad(JSON.parse(initialSquadState));
        }
    };

    const handleSaveTeam = async () => {
        const token = localStorage.getItem("access_token");
        if (!isDirty || !token) return;

        const allPlayers = [...squad.starting, ...squad.bench];

        const captain = allPlayers.find(p => p.isCaptain);
        const viceCaptain = allPlayers.find(p => p.isVice);

        if (!captain) {
            toast({ variant: "destructive", title: "Validation Error", description: "Please select a Captain for your team." });
            return;
        }
        if (!viceCaptain) {
            toast({ variant: "destructive", title: "Validation Error", description: "Please select a Vice-Captain for your team." });
            return;
        }
        
        const payload = {
            players: allPlayers.map((p) => ({
                id: p.id,
                position: p.pos,
                is_captain: p.isCaptain,
                is_vice_captain: p.isVice,
                is_benched: p.is_benched,
            }))
        };

        try {
            const response = await fetch(API.endpoints.saveTeam, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to save team.");
            }
            
            const updatedSquadData: TeamResponse = await response.json();
            
            const transformBackendResponse = (players: any[]) => players.map(p => ({
                id: p.id, name: p.full_name, team: p.team.name, pos: p.position,
                fixture_str: p.fixture_str, points: p.points, isCaptain: p.is_captain,
                isVice: p.is_vice_captain, is_benched: p.is_benched,
            }));
            
            const newSquadState = { 
                starting: transformBackendResponse(updatedSquadData.starting), 
                bench: transformBackendResponse(updatedSquadData.bench),
                team_name: updatedSquadData.team_name
            };
            
            setSquad(newSquadState);
            setInitialSquadState(JSON.stringify(newSquadState));
            setIsSavedModalOpen(true);

        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    };
    
    const playersByPos = {
        GK: squad.starting.filter(p => p.pos === 'GK'),
        DEF: squad.starting.filter(p => p.pos === 'DEF'),
        MID: squad.starting.filter(p => p.pos === 'MID'),
        FWD: squad.starting.filter(p => p.pos === 'FWD'),
    };
    
    const positionOrder = ['GK', 'DEF', 'MID', 'FWD'];

    if (isLoading) {
        return <TeamPageSkeleton />;
    }

    const deadlineDate = gameweek?.deadline ? new Date(gameweek.deadline) : null;
    const deadlineText = deadlineDate && isValid(deadlineDate)
        ? `Gameweek ${gameweek.gw_number} Deadline: ${format(deadlineDate, "E dd MMM HH:mm")}`
        : "Loading deadline...";

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.1 }
        }
    };
    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div 
          className="w-full min-h-screen bg-white flex flex-col lg:h-screen lg:flex-row font-sans"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="hidden lg:block lg:w-2/5 p-4">
            <div className="lg:sticky lg:top-4">
              <ManagerInfoCard 
                isLoading={isExtraDataLoading}
                teamName={squad.team_name}
                managerName={user?.full_name}
                stats={hubStats as any}
                leagueStandings={leaderboard.slice(0, 5)}
                overallRank={userRank}
                currentUserEmail={user?.email}
              />
            </div>
          </motion.div>
           <div className="flex flex-col flex-1 lg:w-3/5">
            <motion.div variants={itemVariants} className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Pick Team</h1>
                         <p className="text-sm text-gray-500">{deadlineText}</p>
                    </div>
                </div>
                {token && <GameweekChips token={token} />}
            </motion.div>
            
             <motion.main 
              variants={itemVariants}
              className="flex-1 relative flex flex-col justify-around py-4"
              style={{ 
                  backgroundImage: `url(${pitchBackground})`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center top',
              }}
             >
              {positionOrder.map((pos) => (
                <motion.div
                   key={pos}
                   className="flex justify-center items-center gap-x-8 sm:gap-x-12"
                  variants={containerVariants}
                >
                  {playersByPos[pos as keyof typeof playersByPos].map((p: any) => (
                    <motion.div
                      key={p.id}
                      variants={itemVariants}
                       onClick={() => handlePlayerClick(p)} 
                      className={cn("cursor-pointer rounded-md transition-all", selectedPlayer?.id === p.id && "ring-2 ring-accent-teal ring-offset-2 ring-offset-transparent")}
                    >
                       <PlayerCard player={p} displayMode='fixture'/>
                    </motion.div>
                  ))}
                </motion.div>
              ))}
            </motion.main>

            <motion.footer variants={itemVariants} className="flex-shrink-0 p-3 bg-gray-100 border-t">
                <div className="flex justify-center items-center gap-x-12">
                    {benchLayout.goalkeeper && (
                        <motion.div
                            key={benchLayout.goalkeeper.id}
                            variants={itemVariants}
                            onClick={() => handlePlayerClick(benchLayout.goalkeeper)}
                            className={cn("cursor-pointer rounded-md transition-all", selectedPlayer?.id === benchLayout.goalkeeper.id && "ring-2 ring-accent-teal ring-offset-2 ring-offset-transparent")}
                        >
                            <PlayerCard player={benchLayout.goalkeeper} isBench={true} displayMode='fixture' />
                        </motion.div>
                    )}
                    <div className="h-16 w-px bg-gray-300"></div>
                    <div className="grid grid-cols-2 gap-12">
                        {benchLayout.outfielders.map((player: any) => (
                            <motion.div
                                key={player.id}
                                variants={itemVariants}
                                onClick={() => handlePlayerClick(player)}
                                className={cn("cursor-pointer rounded-md transition-all", selectedPlayer?.id === player.id && "ring-2 ring-accent-teal ring-offset-2 ring-offset-transparent")}
                            >
                                <PlayerCard player={player} isBench={true} displayMode='fixture' />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.footer>

            <motion.div variants={itemVariants} className="p-4 text-center bg-white border-t-2 border-gray-200">
                <Button 
                    onClick={handleSaveTeam} 
                    disabled={!isDirty}
                    className="bg-accent-pink text-white font-bold text-lg px-8 py-6 rounded-lg shadow-lg disabled:opacity-50"
                >
                    Save Changes
                </Button>
            </motion.div>

            <motion.div variants={itemVariants} className="p-4">
                {/* --- MODIFIED: Pass fixture data and handlers to the card --- */}
                <FixturesCard 
                    fixtures={displayedFixtures}
                    view={fixtureView}
                    setView={setFixtureView}
                    currentGwNumber={gameweek?.gw_number}
                />
            </motion.div>
          </div>
          
          <motion.div variants={itemVariants} className="block lg:hidden p-4">
              <ManagerInfoCard 
                isLoading={isExtraDataLoading}
                teamName={squad.team_name}
                managerName={user?.full_name}
                stats={hubStats as any}
                leagueStandings={leaderboard.slice(0, 5)}
                overallRank={userRank}
                currentUserEmail={user?.email}
              />
          </motion.div>

          
          <AnimatePresence>
             {detailedPlayer && <EditablePlayerCard player={detailedPlayer} onClose={() => setDetailedPlayer(null)} onSubstitute={handleSelectForSub} onSetArmband={setArmband} onViewProfile={handleViewProfile} />}
          </AnimatePresence>

          <AlertDialog open={isSavedModalOpen} onOpenChange={setIsSavedModalOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Team Saved!</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogAction onClick={() => setIsSavedModalOpen(false)}>
                    Continue
                </AlertDialogAction>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>
      );
};

export default Team;