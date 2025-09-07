import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
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

// --- ASSET IMPORTS ---
import pitchBackground from '@/assets/images/pitch.svg';

const Team: React.FC = () => {
  const { toast } = useToast();
  const [squad, setSquad] = useState<{ starting: any[], bench: any[] }>({ starting: [], bench: [] });
  const [initialSquadState, setInitialSquadState] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  const [detailedPlayer, setDetailedPlayer] = useState<any | null>(null);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem("access_token") || "" : "";

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    fetch("http://localhost:8000/teams/team", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async res => {
        if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);
        const data: TeamResponse = await res.json();
        if (!data.starting || !data.bench) throw new Error("Malformed team data");

        const transformPlayer = (player: any) => ({
          id: player.id,
          name: player.full_name,
          team: player.team.name,
          pos: player.position,
          fixture: player.fixture_str,
          points: 0,
          isCaptain: player.is_captain,
          isVice: player.is_vice_captain,
          is_benched: player.is_benched,
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
      });
  }, []);

  const isDirty = useMemo(() => {
    return JSON.stringify(squad) !== initialSquadState;
  }, [squad, initialSquadState]);
  
const handlePlayerClick = (clickedPlayer: any) => {
    // If a player is already selected for substitution, this click is the swap target
    if (selectedPlayer) {
        if (selectedPlayer.id === clickedPlayer.id || selectedPlayer.is_benched === clickedPlayer.is_benched) {
            setSelectedPlayer(null); // Deselect
            return;
        }

        const starter = selectedPlayer.is_benched ? clickedPlayer : selectedPlayer;
        const benched = selectedPlayer.is_benched ? selectedPlayer : clickedPlayer;

        // --- VALIDATION LOGIC ---
        const tempStartingXI = squad.starting.filter(p => p.id !== starter.id).concat(benched);
        const goalkeepers = tempStartingXI.filter(p => p.pos === 'GK').length;
        if (goalkeepers !== 1) {
            toast({ variant: "destructive", title: "Invalid Substitution", description: "Your starting team must have exactly one goalkeeper." });
            setSelectedPlayer(null);
            return;
        }
        
        // --- NEW LOGIC: Direct Captaincy Swap ---
        let newStarterPlayer = { ...benched, is_benched: false, isCaptain: false, isVice: false };
        let newBenchedPlayer = { ...starter, is_benched: true, isCaptain: false, isVice: false };

        // If the player going to the bench was the captain...
        if (starter.isCaptain) {
            // ...make the player coming from the bench the new captain.
            newStarterPlayer.isCaptain = true;
        }
        // If the player going to the bench was the vice-captain...
        if (starter.isVice) {
            // ...make the player coming from the bench the new vice-captain.
            newStarterPlayer.isVice = true;
        }
        
        // --- PERFORM THE SWAP ---
        setSquad(currentSquad => {
            const updatedStarting = currentSquad.starting.filter(p => p.id !== starter.id).concat(newStarterPlayer);
            const updatedBench = currentSquad.bench.filter(p => p.id !== benched.id).concat(newBenchedPlayer);
            
            return { starting: updatedStarting, bench: updatedBench };
        });

        setSelectedPlayer(null); // Reset selection
    } else {
        // If no player is selected, this click opens the detail modal
        setDetailedPlayer(clickedPlayer);
    }
};
  
  const handleSelectForSub = (playerToSub: any) => {
    // Find the full player object from the current squad to get its benched status
    const isBenched = squad.bench.some(p => p.id === playerToSub.id);
    setSelectedPlayer({ ...playerToSub, is_benched: isBenched });
    setDetailedPlayer(null); // Close the detail card to allow the next selection
  };
  
  const setArmband = async (playerId: number, kind: 'C' | 'VC') => { /* ...existing function... */ };

  // const handleSaveTeam = () => {
  //   setInitialSquadState(JSON.stringify(squad));
  //   setIsSavedModalOpen(true);
  // };

  const handleReset = () => {
    if (initialSquadState) {
        setSquad(JSON.parse(initialSquadState));
    }
  };

  if (!squad.starting.length && !squad.bench.length) {
    return <div className="p-4">Loading team...</div>;
  }

  const playersByPos = {
    GK: squad.starting.filter(p => p.pos === 'GK'),
    DEF: squad.starting.filter(p => p.pos === 'DEF'),
    MID: squad.starting.filter(p => p.pos === 'MID'),
    FWD: squad.starting.filter(p => p.pos === 'FWD'),
  };


  const handleSaveTeam = async () => {
    const token = localStorage.getItem("access_token");
    if (!isDirty || !token) return;

    const payload = {
        players: [...squad.starting, ...squad.bench].map(p => ({
            id: p.id,
            position: p.pos,
            // CORRECT MAPPING:
            // backend_key: frontend_property
            is_captain: p.isCaptain,
            is_vice_captain: p.isVice,
            is_benched: p.is_benched,
        }))
    };

    try {
        const response = await fetch("http://localhost:8000/teams/save-team", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Failed to save team.");
        }
        
        const updatedSquadData: TeamResponse = await response.json();
        
        // You'll need to transform the backend response back to your frontend format
        const transformBackendResponse = (players) => players.map(p => ({
            id: p.id,
            name: p.full_name,
            team: p.team.name,
            pos: p.position,
            fixture: p.fixture_str,
            points: p.points,
            isCaptain: p.is_captain,
            isVice: p.is_vice_captain,
            is_benched: p.is_benched,
        }));
        
        const newSquadState = { 
            starting: transformBackendResponse(updatedSquadData.starting), 
            bench: transformBackendResponse(updatedSquadData.bench) 
        };
        
        setSquad(newSquadState);
        setInitialSquadState(JSON.stringify(newSquadState));
        toast({ title: "Success!", description: "Your team changes have been saved." });

    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    }
};


  return (
    <div className="w-full min-h-screen bg-white flex flex-col lg:h-screen lg:flex-row font-sans">
      <div className="hidden lg:block lg:w-2/5 p-4 h-screen overflow-y-auto">
        <ManagerInfoCard />
      </div>
      <div className="flex flex-col flex-1 lg:w-3/5 lg:h-screen">
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Pick Team</h1>
                    <p className="text-sm text-gray-500">Gameweek 16 Deadline: Sat 23 Aug 11:00</p>
                </div>
            </div>
            {token && <GameweekChips token={token} /* gw optional; omit to use current */ />}
        </div>
        
        <main 
          className="flex-1 relative flex flex-col justify-around py-4"
          style={{ 
            backgroundImage: `url(${pitchBackground})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center top',
          }}
        >
          {Object.values(playersByPos).map((players, index) => (
            <div key={index} className="flex justify-center items-center gap-x-8 sm:gap-x-12">
              {players.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => handlePlayerClick(p, false)} 
                  className={cn("cursor-pointer rounded-md transition-all", selectedPlayer?.id === p.id && "ring-2 ring-accent-teal ring-offset-2 ring-offset-transparent")}
                >
                  <PlayerCard player={p} displayMode='fixture'/>
                </div>
              ))}
            </div>
          ))}
        </main>

        <footer className="flex-shrink-0 p-3 bg-gray-100 border-t">
          <div className="grid grid-cols-3 gap-4 place-items-center">
            {squad.bench.map(player => (
              <div 
                key={player.id} 
                onClick={() => handlePlayerClick(player, true)} 
                className={cn("cursor-pointer rounded-md transition-all", selectedPlayer?.id === player.id && "ring-2 ring-accent-teal ring-offset-2 ring-offset-transparent")}
              >
                <PlayerCard player={player} isBench={true} displayMode='fixture' />
              </div>
            ))}
          </div>
        </footer>

        <div className="p-4 text-center bg-white border-t-2 border-gray-200">
            <Button 
        onClick={handleSaveTeam} 
        disabled={!isDirty}
        className="bg-accent-pink text-white font-bold text-lg px-8 py-6 rounded-lg shadow-lg disabled:opacity-50"
    >
        Save Changes
    </Button>
        </div>

        <div className="p-4">
            <FixturesCard />
        </div>
      </div>
      
      <div className="block lg:hidden p-4">
          <ManagerInfoCard />
      </div>

      <AnimatePresence>
        {detailedPlayer && <EditablePlayerCard player={detailedPlayer} onClose={() => setDetailedPlayer(null)} onSubstitute={handleSelectForSub} onSetArmband={setArmband} />}
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
    </div>
  );
};

export default Team;