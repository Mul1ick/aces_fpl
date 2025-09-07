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

// --- ASSET IMPORTS ---
import pitchBackground from '@/assets/images/pitch.svg';

const Team: React.FC = () => {
  const [squad, setSquad] = useState<{ starting: any[], bench: any[] }>({ starting: [], bench: [] });
  const [initialSquadState, setInitialSquadState] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  const [detailedPlayer, setDetailedPlayer] = useState<any | null>(null);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);

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
  
  const handlePlayerClick = (playerToSwap: any, isFromBench: boolean) => {
    if (!selectedPlayer) {
      setDetailedPlayer(playerToSwap);
      return;
    }

    if (selectedPlayer.isFromBench === isFromBench) {
      setSelectedPlayer({ ...playerToSwap, isFromBench });
      return;
    }

    const pitchPlayer = selectedPlayer.isFromBench ? playerToSwap : selectedPlayer;
    const benchPlayer = selectedPlayer.isFromBench ? selectedPlayer : playerToSwap;

    // --- VALIDATION LOGIC ---
    let newStarters = squad.starting.filter(p => p.id !== pitchPlayer.id).concat(benchPlayer);
    const goalkeepers = newStarters.filter(p => p.pos === 'GK').length;
    const defenders = newStarters.filter(p => p.pos === 'DEF').length;

    if (goalkeepers !== 1) {
      alert("Invalid substitution. You must have exactly one goalkeeper.");
      setSelectedPlayer(null);
      return;
    }
    if (defenders < 2) {
      alert("Invalid substitution. You must have at least two defenders.");
      setSelectedPlayer(null);
      return;
    }

    // --- CAPTAINCY RE-ASSIGNMENT LOGIC ---
    if (pitchPlayer.isCaptain) {
        const viceCaptain = squad.starting.find(p => p.isVice);
        if (viceCaptain) {
            newStarters = newStarters.map(p => p.id === viceCaptain.id ? { ...p, isCaptain: true, isVice: false } : p);
            const newViceCaptainCandidate = newStarters.find(p => p.id !== viceCaptain.id);
            if (newViceCaptainCandidate) {
                newStarters = newStarters.map(p => p.id === newViceCaptainCandidate.id ? { ...p, isVice: true } : p);
            }
        }
    } else if (pitchPlayer.isVice) {
        const captain = squad.starting.find(p => p.isCaptain);
        const newViceCaptainCandidate = newStarters.find(p => p.id !== captain?.id);
        if (newViceCaptainCandidate) {
            newStarters = newStarters.map(p => p.id === newViceCaptainCandidate.id ? { ...p, isVice: true } : p);
        }
    }

    // --- PERFORM SWAP ---
    const cleanBenchPlayer = { ...pitchPlayer, isCaptain: false, isVice: false };
    const cleanPitchPlayer = { ...benchPlayer, isCaptain: false, isVice: false };

    const finalStarters = newStarters.map(p => p.id === benchPlayer.id ? cleanPitchPlayer : p);
    const finalBench = squad.bench.map(p => p.id === benchPlayer.id ? cleanBenchPlayer : p);

    setSquad({ starting: finalStarters, bench: finalBench });
    setSelectedPlayer(null);
  };
  
  const handleSelectForSub = (playerToSub: any) => {
    const isBenched = squad.bench.some(p => p.id === playerToSub.id);
    setSelectedPlayer({ ...playerToSub, isFromBench: isBenched });
    setDetailedPlayer(null);
  };
  
  const setArmband = async (playerId: number, kind: 'C' | 'VC') => { /* ...existing function... */ };

  const handleSaveTeam = () => {
    setInitialSquadState(JSON.stringify(squad));
    setIsSavedModalOpen(true);
  };

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
            <GameweekChips />
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
                className="bg-dashboard-gradient text-white font-bold text-lg px-8 py-6 rounded-lg shadow-lg disabled:opacity-50"
            >
                Save Your Team
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