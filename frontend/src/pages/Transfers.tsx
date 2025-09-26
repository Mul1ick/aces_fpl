import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import { TransferListView } from '@/components/transfers/TransferListView';
import { Skeleton } from '@/components/ui/skeleton';
import { ChipStatus } from '@/lib/api'; // Make sure ChipStatus is imported
import acesLogo from "@/assets/aces-logo.png";

// --- LIB & TYPE IMPORTS ---
import { TeamResponse } from "@/types";
import { API } from '@/lib/api';
import { transformApiPlayer } from '@/lib/player-utils';

// --- CONFIGURATION ---
const initialSquad = {
  GK: [null, null],
  DEF: [null, null, null],
  MID: [null, null, null],
  FWD: [null, null, null],
};

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

const Transfers: React.FC = () => {
  const { user, refreshUserStatus, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");

  const [chipStatus, setChipStatus] = useState<ChipStatus | null>(null);

  // --- STATE MANAGEMENT ---
  const [squad, setSquad] = useState(initialSquad);
const [initialSquadObject, setInitialSquadObject] = useState(initialSquad);
  // --- MODIFIED --- Added state to store the existing team name
  const [existingTeamName, setExistingTeamName] = useState<string>('');
  const [gameweek, setGameweek] = useState(null);
  const [isPlayerSelectionOpen, setIsPlayerSelectionOpen] = useState(false);
  const [isEnterSquadModalOpen, setIsEnterSquadModalOpen] = useState(false);
  const [positionToFill, setPositionToFill] = useState<{ position: string; index: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [view, setView] = useState<'pitch' | 'list'>('pitch');



  const hasTeam = user?.has_team;

  // --- DATA TRANSFORMATION & SERIALIZATION ---
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

  // --- DATA FETCHING ---
  const fetchAndSetTeam = useCallback(async () => {
    setIsLoading(true);
    if (hasTeam === false) {
      setSquad(initialSquad);
      setInitialSquadObject(initialSquad); // Store the full object
      setIsLoading(false);
      return;
    }

    if (hasTeam === true && token) {
      try {
        const response = await fetch(API.endpoints.team(), { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error("Could not fetch team data.");
        
        const data: TeamResponse = await response.json();
        const allPlayers = [...(data.starting || []), ...(data.bench || [])];
        const populatedSquad = transformApiDataToSquad(allPlayers);
        
        setSquad(populatedSquad);
        setInitialSquadObject(populatedSquad); // CORRECTED

        // --- MODIFIED --- Store the fetched team name
        setExistingTeamName(data.team_name || '');
      } catch (error) {
        console.error("Failed to fetch team:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load your team. Please try again." });
        setSquad(initialSquad);
        setInitialSquadObject(initialSquad);
      } finally {
        setIsLoading(false);
      }
    }
  }, [hasTeam, token, toast]);

  useEffect(() => {
    if (!isAuthLoading) {
      fetchAndSetTeam();
      
      fetch(`${API.BASE_URL}/gameweeks/gameweek/current`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        .then(res => res.json())
        .then(setGameweek)
        .catch(() => console.error("Failed to fetch gameweek data"));
    }
    fetch(`${API.BASE_URL}/chips/status`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        .then(res => res.json())
        .then(setChipStatus)
        .catch(() => console.error("Failed to fetch chip status"));
  }, [hasTeam, isAuthLoading, fetchAndSetTeam, token]);

  // --- SQUAD LOGIC & VALIDATION ---
  const { playersOut, playersIn, bank, transferCost, playersSelected } = useMemo(() => {
    const initialPlayers = Object.values(initialSquadObject).flat().filter(p => p !== null);
    const currentPlayers = Object.values(squad).flat().filter(p => p !== null);

    const initialIds = new Set(initialPlayers.map(p => p.id));
    const currentIds = new Set(currentPlayers.map(p => p.id));

    const out = initialPlayers.filter(p => !currentIds.has(p.id));
    const into = currentPlayers.filter(p => !initialIds.has(p.id));

    const totalCost = currentPlayers.reduce((acc, p) => acc + (p?.price || 0), 0);
    const remainingBank = 100.0 - totalCost;
    const isWildcardActive = chipStatus?.active === 'WILDCARD';
    const freeTransfers = user?.free_transfers ?? 1;
    const numTransfers = out.length;
    const paidTransfers = (isWildcardActive || user?.played_first_gameweek === false) 
        ? 0 
        : Math.max(0, numTransfers - freeTransfers);

    const cost = paidTransfers * 4;

    return {
      playersOut: out,
      playersIn: into,
      bank: remainingBank,
      transferCost: cost,
      playersSelected: currentPlayers.length
    };
  }, [squad, initialSquadObject, user,chipStatus]);

  const squadValidation = useMemo(() => {
    const allPlayers = Object.values(squad).flat().filter(p => p !== null);
    const teamCounts = allPlayers.reduce((acc, player) => {
      const teamName = player.club;
      if (teamName) acc[teamName] = (acc[teamName] || 0) + 1;
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
      setNotification({ message: `You cannot have more than 2 players from ${squadValidation.errorTeam}.`, type: 'error' });
    } else {
      setNotification(null);
    }
  }, [squadValidation]);

  // --- HANDLERS ---
  const handleSlotClick = (position: string, index: number) => {
    setPositionToFill({ position, index });
    if (window.innerWidth < 1024) setIsPlayerSelectionOpen(true);
  };

  const handleStartTransfer = (player: any, pos: string, index: number) => {
  setPositionToFill({ position: pos, index: index });
  handlePlayerRemove(pos, index);
  if (window.innerWidth < 1024) setIsPlayerSelectionOpen(true);
};
  
  const handlePlayerSelect = (playerData: any) => {
    setIsPlayerSelectionOpen(false);
    const newPlayer = transformApiPlayer(playerData);
    const posKey = newPlayer.pos;

    let targetSlot = positionToFill;

    if (!targetSlot) {
        const positionArray = squad[posKey];
        const emptyIndex = positionArray.findIndex(p => p === null);

        if (emptyIndex !== -1) {
            targetSlot = { position: posKey, index: emptyIndex };
        } else {
            toast({
                variant: "destructive",
                title: "Position Full",
                description: `All ${posKey} slots in your squad are already filled. Please transfer a player out first.`,
            });
            return;
        }
    }
    
    if (targetSlot) {
        setSquad((current) => {
            const newSquad = { ...current };
            const newPositionArray = [...newSquad[targetSlot.position]];
            newPositionArray[targetSlot.index] = newPlayer;
            newSquad[targetSlot.position] = newPositionArray;
            return newSquad;
        });
        setPositionToFill(null);
    }
  };
  
const handlePlayerRemove = (position: string, index: number) => {
    setPositionToFill({ position, index });
    setSquad(current => {
      const newSquad = { ...current };
      const positionArray = [...newSquad[position]];
      positionArray[index] = null;
      newSquad[position] = positionArray;
      return newSquad;
    });
    // For mobile, automatically open the selection list
    if (window.innerWidth < 1024) {
      setIsPlayerSelectionOpen(true);
    }
  };


  const handleReset = () => {
    setIsLoading(true);
    fetchAndSetTeam();
  };
  
  const handleAutoFill = () => toast({ title: 'Coming Soon!', description: 'Autofill feature is on the way.'});

  const handleConfirmTransfers = async (teamNameFromModal?: string) => {
    if (!token) return;

    // Logic for submitting a brand new team
    if (!hasTeam) {
        if (playersSelected !== 11) {
            toast({ variant: "destructive", title: "Incomplete Squad", description: "You must select 11 players to save your team." });
            return;
        }
        const allPlayers = Object.values(squad).flat().filter(p => p !== null);
        const payload = {
            team_name: teamNameFromModal,
            players: allPlayers.map((p: any) => ({ id: p.id, position: p.pos, is_captain: false, is_vice_captain: false, is_benched: false })),
        };
        try {
            const res = await fetch(API.endpoints.submitTeam, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error((await res.json()).detail || "Failed to save team");
            await refreshUserStatus();
            toast({ title: "Success", description: "Your team has been created." });
            navigate("/dashboard");
        } catch (e) {
            toast({ variant: "destructive", title: "Error Saving Team", description: e instanceof Error ? e.message : "Unknown error" });
        }
        return;
    }
    
    // Logic for confirming transfers for an existing team
    if (playersIn.length === 0 && playersOut.length === 0) {
      toast({ variant: "destructive", title: "No Changes", description: "You haven't made any transfers." });
      return;
    }

    const transferPayload = {
      transfers: playersOut.map((pOut, index) => ({
        out_player_id: pOut.id,
        in_player_id: playersIn[index].id,
      })),
    };

    try {
        const res = await fetch(`${API.BASE_URL}/transfers/confirm`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(transferPayload),
        });
        if (!res.ok) throw new Error((await res.json()).detail || "Transfer failed");

        await fetchAndSetTeam(); // Refresh squad from backend to get new initial state
        await refreshUserStatus();
        toast({ title: "Transfers Confirmed!", description: "Your changes have been saved." });

    } catch (e) {
        toast({ variant: "destructive", title: "Transfer Failed", description: e instanceof Error ? e.message : "Unknown error" });
    }
  };

  // --- RENDER LOGIC ---
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
          {/* --- MODIFIED: Added z-20 to raise this column's stacking context --- */}
        <motion.div 
          variants={itemVariants} 
          className="hidden lg:block lg:col-span-4 h-screen overflow-y-auto p-4 border-r sticky top-0 z-20"
        >
          <PlayerSelectionList
            onClose={() => {}}
            onPlayerSelect={handlePlayerSelect}
            positionFilter={positionToFill?.position}
            squad={squad}
          />
        </motion.div>
        
        <motion.div variants={itemVariants} className="lg:col-span-6 flex flex-col min-h-screen">
          <div className="p-4 space-y-4">
            <TransfersHeroCard
              playersSelected={playersSelected}
              bank={bank}
              notification={notification}
              user={user}
              view={view}
              setView={setView}
              gameweek={gameweek}
              transferCount={playersOut.length}
              transferCost={transferCost}
              activeChip={chipStatus?.active}

            />
          </div>
          
          <div className="flex-grow">
            {view === 'pitch' ? (
              <TransferPitchView
                squad={squad}
                onSlotClick={handleSlotClick}
                onPlayerRemove={handlePlayerRemove}
                onStartTransfer={handleStartTransfer}
              />
            ) : (
              <div className="p-4">
                <TransferListView squad={squad} />
              </div>
            )}
          </div>

          <div className="p-4 grid grid-cols-3 gap-4 border-t bg-white sticky bottom-0">
            {/* <Button variant="outline" onClick={handleAutoFill}>Autofill</Button> */}
            <Button variant="destructive" onClick={handleReset}>Reset</Button>
            {hasTeam ? (
               <Button
                  onClick={() => handleConfirmTransfers()}
                  disabled={!squadValidation.isValid || playersOut.length === 0}
                >
                  Make Transfers
                </Button>
            ) : (
              <Button
                onClick={() => setIsEnterSquadModalOpen(true)}
                disabled={playersSelected !== 11 || !squadValidation.isValid}
              >
                Enter Squad
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* --- MODALS --- */}
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
        onConfirm={(teamName) => {
            setIsEnterSquadModalOpen(false);
            handleConfirmTransfers(teamName);
        }}
      />
    </div>
  );
};

export default Transfers;