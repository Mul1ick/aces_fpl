import React, { useState, useEffect, useMemo } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';

// --- ASSET IMPORTS ---
import pitchBackground from '@/assets/images/pitch.svg';
import acesLogo from "@/assets/aces-logo.png";

const TeamPageSkeleton = () => (
    <div className="w-full min-h-screen bg-white flex flex-col lg:flex-row font-sans">
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
  const [squad, setSquad] = useState<{ starting: any[], bench: any[] }>({ starting: [], bench: [] });
  const [initialSquadState, setInitialSquadState] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  const [detailedPlayer, setDetailedPlayer] = useState<any | null>(null);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem("access_token") || "" : "";

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setIsLoading(true);
    fetch(API.endpoints.team, {
      headers: { Authorization: `Bearer ${token}` },
    })
     .then(async res => {
        if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);
        const data: TeamResponse = await res.json();
        if (!data.starting || !data.bench) throw new Error("Malformed team data");

      const transformPlayer = (p: any) => ({
      id: p.id,
      name: p.full_name,
      full_name: p.full_name,
      pos: p.position,
      position: p.position,
      team: p.team?.name,
      team_obj: p.team,
      price: p.price,
      points: p.points,
      fixture: p.fixture_str,
      fixture_str: p.fixture_str,
      isCaptain: p.is_captain,
      isVice: p.is_vice_captain,
      is_captain: p.is_captain,
      is_vice_captain: p.is_vice_captain,
      is_benched: p.is_benched,
      recent_fixtures: p.recent_fixtures,
      raw_stats: p.raw_stats,
      breakdown: p.breakdown,
    });

        const starting = data.starting.map(transformPlayer);
        const bench = data.bench.map(transformPlayer);
        
        const currentSquad = { starting, bench };
        setSquad(currentSquad);
        setInitialSquadState(JSON.stringify(currentSquad));
      })
      .catch(err => {
        console.error("Failed to fetch team:", err);
         setSquad({ starting: [], bench: [] });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const isDirty = useMemo(() => {
    return JSON.stringify(squad) !== initialSquadState;
  }, [squad, initialSquadState]);
  
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
        
        setSquad(currentSquad => {
            const updatedStarting = currentSquad.starting.filter(p => p.id !== starter.id).concat(newStarterPlayer);
            const updatedBench = currentSquad.bench.filter(p => p.id !== benched.id).concat(newBenchedPlayer);
             
            return { starting: updatedStarting, bench: updatedBench };
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

    setSquad(currentSquad => {
        const newStarting = currentSquad.starting.map(p => {
            if (kind === 'C') p.isCaptain = false;
            if (kind === 'VC') p.isVice = false;
            return p;
        });

        const targetPlayer = newStarting.find(p => p.id === playerId);
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
    // ... (existing save logic remains the same)
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

  const containerVariants = { /* ... */ };
  const itemVariants = { /* ... */ };

  return (
    <motion.div 
      // --- MODIFIED: Removed lg:h-screen to allow the container to grow ---
      className="w-full min-h-screen bg-white flex flex-col lg:flex-row font-sans"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* --- MODIFIED: Added classes for sticky positioning --- */}
      <motion.div variants={itemVariants} className="hidden lg:block lg:w-2/5 p-4">
        <div className="lg:sticky lg:top-4">
          <ManagerInfoCard />
        </div>
      </motion.div>
      
       {/* --- MODIFIED: Removed lg:h-screen from the right column --- */}
       <div className="flex flex-col flex-1 lg:w-3/5">
        <motion.div variants={itemVariants} className="p-4 space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Pick Team</h1>
                     <p className="text-sm text-gray-500">Gameweek 16 Deadline: Sat 23 Aug 11:00</p>
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
              {playersByPos[pos].map(p => (
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
           <motion.div variants={containerVariants} className="grid grid-cols-3 gap-4 place-items-center">
            {squad.bench.map(player => (
              <motion.div
                key={player.id}
                variants={itemVariants}
                onClick={() => handlePlayerClick(player)} 
                 className={cn("cursor-pointer rounded-md transition-all", selectedPlayer?.id === player.id && "ring-2 ring-accent-teal ring-offset-2 ring-offset-transparent")}
              >
                <PlayerCard player={player} isBench={true} displayMode='fixture' />
              </motion.div>
            ))}
          </motion.div>
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
            <FixturesCard />
        </motion.div>
      </div>
      
      <motion.div variants={itemVariants} className="block lg:hidden p-4">
          <ManagerInfoCard />
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