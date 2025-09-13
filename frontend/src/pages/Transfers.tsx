import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

// --- COMPONENT IMPORTS ---
import { TransfersHeroCard } from '@/components/transfers/TransfersHeroCard';
import { TransferPitchView } from '@/components/transfers/TransferPitchView';
import { PlayerSelectionList, PlayerSelectionModal } from '@/components/transfers/PlayerSelection';
import { EnterSquadModal } from '@/components/transfers/EnterSquadModal';
import { Button } from '@/components/ui/button';
import { TeamResponse } from "@/types";
import { API } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { TransferListView } from '@/components/transfers/TransferListView';
import { transformApiPlayer } from '@/lib/player-utils';
import acesLogo from "@/assets/aces-logo.png";

// --- CONFIGURATION ---
const initialSquad = {
  GK: [null, null],
  DEF: [null, null, null],
  MID: [null, null, null],
  FWD: [null, null, null],
};

const TeamPageSkeleton = () => (
    <div className="w-full min-h-screen bg-white font-sans">
        <div className="grid grid-cols-1 lg:grid-cols-10">
            <div className="hidden lg:block lg:col-span-4 h-screen overflow-y-auto p-4 border-r">
                <div className="space-y-4">
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <div className="p-4 space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-4">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="lg:col-span-6 flex flex-col h-screen">
                <div className="p-4">
                     <Skeleton className="h-40 w-full rounded-lg" />
                </div>
                <div className="flex-1 p-4">
                    <Skeleton className="h-full w-full rounded-lg" />
                </div>
                <div className="p-4 grid grid-cols-3 gap-4 border-t">
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                </div>
            </div>
        </div>
    </div>
);

const Transfers: React.FC = () => {
  const { user, refreshUserStatus, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [squad, setSquad] = useState(initialSquad);
  const [initialSquadState, setInitialSquadState] = useState<string>('');
  const [isPlayerSelectionOpen, setIsPlayerSelectionOpen] = useState(false);
  const [isEnterSquadModalOpen, setIsEnterSquadModalOpen] = useState(false);
  const [positionToFill, setPositionToFill] = useState<{ position: string; index: number } | null>(null);
  const [existingTeamName, setExistingTeamName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");
  
  const [view, setView] = useState<'pitch' | 'list'>('pitch');

  const hasTeam = user?.has_team;

  const transformApiDataToSquad = (players: any[]) => {
    const newSquad = JSON.parse(JSON.stringify(initialSquad));
    if (Array.isArray(players)) {
        players.forEach(rawPlayer => {
            const player = transformApiPlayer(rawPlayer);
            if (player && newSquad[player.pos]) {
                const idx = newSquad[player.pos].findIndex((s: any) => s === null);
                if (idx !== -1) {
                    newSquad[player.pos][idx] = player;
                }
            }
        });
    }
    return newSquad;
  };
  
  const serializeSquad = (squadToSerialize: any) => JSON.stringify(Object.values(squadToSerialize).flat().map(p => (p as any)?.id || null).sort());


  useEffect(() => {
    const fetchAndSetTeam = async () => {
      setIsLoading(true);
      if (hasTeam === false) {
        setSquad(initialSquad);
        setInitialSquadState(serializeSquad(initialSquad));
        setIsLoading(false);
        return;
      }

      if (hasTeam === true && token) {
        try {
          const response = await fetch(API.endpoints.team, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) {
            setSquad(initialSquad);
            setInitialSquadState(serializeSquad(initialSquad));
            return;
          }

          const data: TeamResponse = await response.json();
          setExistingTeamName(data.team_name || '');

          const startingPlayers = Array.isArray(data.starting) ? data.starting : [];
          const benchPlayers = Array.isArray(data.bench) ? data.bench : [];
          const allPlayers = [...startingPlayers, ...benchPlayers];
          
          const populatedSquad = transformApiDataToSquad(allPlayers);
          setSquad(populatedSquad);
          setInitialSquadState(serializeSquad(populatedSquad));
        } catch (error) {
          console.error("Failed to fetch or process team data:", error);
          setSquad(initialSquad);
          setInitialSquadState(serializeSquad(initialSquad));
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (!isAuthLoading) {
      fetchAndSetTeam();
    }
  }, [hasTeam, isAuthLoading, token]);


  const squadValidation = useMemo(() => {
    const allPlayers = Object.values(squad).flat().filter(p => p !== null);
    const teamCounts = allPlayers.reduce((acc, player) => {
      const teamName = player.club;
      if (teamName) {
        acc[teamName] = (acc[teamName] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    for (const team in teamCounts) {
     if (teamCounts[team] > 2) {
        return { isValid: false, errorTeam: team };
      }
    }
    return { isValid: true, errorTeam: null };
  }, [squad]);

  useEffect(() => {
    if (!squadValidation.isValid && squadValidation.errorTeam) {
      setNotification({
        message: `You cannot have more than 2 players from ${squadValidation.errorTeam}.`,
        type: 'error',
      });
    } else {
      setNotification(null);
    }
  }, [squadValidation]);

  const handlePlayerSelect = (playerData: any) => {
    setIsPlayerSelectionOpen(false);
    const newPlayer = transformApiPlayer(playerData);
    const posKey = newPlayer.pos;

    if (!squad[posKey]) {
        console.error("Invalid player position:", posKey);
        return;
    }

    if (positionToFill) {
        setSquad((current) => {
            const newSquad = { ...current };
            const positionArray = [...newSquad[positionToFill.position]];
            positionArray[positionToFill.index] = newPlayer;
            newSquad[positionToFill.position] = positionArray;
            return newSquad;
        });
        setPositionToFill(null);
    }
  };

  const handleSlotClick = (position: string, index: number) => {
    setPositionToFill({ position, index });
    if (window.innerWidth < 1024) setIsPlayerSelectionOpen(true);
  };

  const handlePlayerRemove = (position: string, index: number) => {
    setSquad(currentSquad => {
      const newSquad = { ...currentSquad };
      const positionArray = [...newSquad[position]];
      positionArray[index] = null;
      newSquad[position] = positionArray;
      return newSquad;
    });
  };

  const handleAutoFill = () => toast({ title: 'Coming Soon!', description: 'Autofill feature is on the way.'});

  const handleReset = () => {
    if (initialSquadState) {
        const parsedSquad = JSON.parse(initialSquadState);
        if (Object.values(parsedSquad).flat().every(p => p === null)) {
            setSquad(initialSquad);
        } else {
            toast({ title: "Reset", description: "Functionality to revert to saved team is coming soon." });
        }
    }
  };

  const submitSquad = async (teamName: string) => {
    if (!token) return;
    const allPlayers = Object.values(squad).flat().filter(p => p !== null);
    const payload = { 
        team_name: teamName, 
        players: allPlayers.map(p => ({
            id: p.id,
            is_captain: p.isCaptain,
            is_vice_captain: p.isVice,
            is_benched: p.isBenched,
        }))
    };

    try {
      const response = await fetch(API.endpoints.submitTeam, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to submit team");
      }
      
      await refreshUserStatus();
      navigate('/dashboard');

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Submitting Team",
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    }
  };

  const handleConfirmSquad = (teamName: string) => submitSquad(teamName);
  
  const { playersSelected, bank } = useMemo(() => {
    const allPlayers = Object.values(squad).flat();
    const selectedCount = allPlayers.filter(p => p !== null).length;
    const totalCost = allPlayers.reduce((acc: number, p: any) => acc + (p?.price || 0), 0);
    const remainingBank = 110.0 - totalCost;
    return { playersSelected: selectedCount, bank: remainingBank };
  }, [squad]);
  
  const isDirty = useMemo(() => serializeSquad(squad) !== initialSquadState, [squad, initialSquadState]);
  
  const LoadingIndicator = () => (
    <div className="w-full min-h-screen bg-white flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <img src={acesLogo} alt="Loading..." className="w-24 h-auto" />
        </motion.div>
    </div>
  );

  if (isLoading || isAuthLoading) {
    return <LoadingIndicator />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="w-full min-h-screen bg-white font-sans">
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="hidden lg:block lg:col-span-4 h-screen overflow-y-auto p-4 border-r">
          <PlayerSelectionList
            onClose={() => {}}
            onPlayerSelect={handlePlayerSelect}
            positionFilter={positionToFill?.position}
            squad={squad}
          />
        </motion.div>
        
        {/* MODIFIED: Removed lg:h-screen to allow this column to grow naturally */}
        <motion.div variants={itemVariants} className="lg:col-span-6 flex flex-col">
          <div className="p-4 space-y-4">
            <TransfersHeroCard
              playersSelected={playersSelected}
              bank={bank}
              notification={notification}
              user={user}
              view={view}
              setView={setView}
              gameweek={null}
            />
          </div>
          
          {/* MODIFIED: Removed the flexbox classes that caused internal scrolling */}
          <div>
            {view === 'pitch' ? (
              <TransferPitchView
                squad={squad}
                onSlotClick={handleSlotClick}
                onPlayerRemove={handlePlayerRemove}
              />
            ) : (
              <div className="p-4">
                <TransferListView
                  squad={squad}
                />
              </div>
            )}
          </div>

          <div className="p-4 grid grid-cols-3 gap-4 border-t bg-white">
            <Button variant="outline" onClick={handleAutoFill}>Autofill</Button>
            <Button variant="destructive" onClick={handleReset}>Reset</Button>
            {hasTeam ? (
              <Button
                onClick={() => { toast({title: "Coming Soon!"})}}
                disabled={!isDirty || playersSelected !== 11 || !squadValidation.isValid}
              >
                Confirm Transfers
              </Button>
            ) : (
              <Button
                onClick={() => setIsEnterSquadModalOpen(true)}
                disabled={playersSelected !== 11 || !squadValidation.isValid}
                title={
                    playersSelected !== 11 ? 'Select 11 players to continue'
                    : !squadValidation.isValid ? `Error: Too many players from ${squadValidation.errorTeam}`
                    : 'Enter Squad'
                }
              >
                Enter Squad
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
      <PlayerSelectionModal
        isOpen={isPlayerSelectionOpen}
        onClose={() => setIsPlayerSelectionOpen(false)}
        onPlayerSelect={handlePlayerSelect}
        positionFilter={positionToFill?.position}
        squad={squad}
      />
      <EnterSquadModal
        isOpen={isEnterSquadModalOpen}
        onClose={() => setIsEnterSquadModalOpen(false)}
        onConfirm={handleConfirmSquad}
      />
    </div>
  );
};

export default Transfers;