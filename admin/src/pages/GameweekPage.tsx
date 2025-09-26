import React, { useState, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { GameweekInfoCard } from '@/components/gameweek/GameweekInfoCard';
import { FixturesList } from '@/components/gameweek/FixturesList';
import { StatsEntryModal } from '@/components/gameweek/StatsEntryModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ShieldQuestion } from 'lucide-react';
import type { Team, Player, PlayerStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { gameweekAPI,playerAPI } from '@/lib/api';
import { useEffect } from 'react';

// --- DUMMY DATA ---

type GameweekStatus = 'Live' | 'Calculating' | 'Points Calculated' | 'Finalized';

const DUMMY_GAMEWEEK = {
  id: 5,
  name: 'Gameweek 5',
  deadline_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'Live' as GameweekStatus,
};

const DUMMY_TEAMS: Team[] = [
  { id: 1, name: 'Satan', short_name: 'SAT', logo_url: 'red.png' },
  { id: 2, name: 'Bandra United', short_name: 'BAN', logo_url: 'blue.png' },
  { id: 3, name: 'Mumbai Hotspurs', short_name: 'MHS', logo_url: 'white.png' },
  { id: 4, name: 'Southside', short_name: 'SOU', logo_url: 'black.png' },
];

const DUMMY_FIXTURES = [
  { id: 1, gameweek_id: 5, home_team_id: 1, away_team_id: 2, home_team: DUMMY_TEAMS[0], away_team: DUMMY_TEAMS[1], home_score: 2, away_score: 1, stats_entered: true },
  { id: 2, gameweek_id: 5, home_team_id: 3, away_team_id: 4, home_team: DUMMY_TEAMS[2], away_team: DUMMY_TEAMS[3], stats_entered: false },
];




export function GameweekPage() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [gameweek, setGameweek] = useState<any>(null);
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedFixture, setSelectedFixture] = useState<any | null>(null);
  const [isConfirming, setConfirming] = useState<'calculate' | 'finalize' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalPlayers, setModalPlayers] = useState<Player[]>([]);
const [modalLoading, setModalLoading] = useState(false);



  useEffect(() => {
    const t = token || localStorage.getItem("admin_token");
    if (!t) return;

    (async () => {
      try {
        setIsLoading(true);
        const data = await gameweekAPI.getCurrentGameweek(t);  // backend endpoint
        setGameweek({
    id: data.id,
    name: `Gameweek ${data.gw_number}`,
    deadline_time:
      typeof data.deadline === 'string'
        ? data.deadline
        : new Date(data.deadline).toISOString(),
    status: 'Live',
  });

        setFixtures(data.fixtures || []);
      } catch (err) {
        console.error("[GameweekPage] Failed to load:", err);
        toast({ variant: "destructive", title: "Error", description: "Failed to load gameweek." });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [token, toast]);
  

  const allStatsEntered = useMemo(() => fixtures.every(f => f.stats_entered), [fixtures]);

  const handleOpenStatsModal = async (fixtureId: number) => {
  const t = token || localStorage.getItem("admin_token");
  const fx = fixtures.find(f => f.id === fixtureId);
  if (!t || !fx) return;

  try {
    setModalLoading(true);
    const [home, away] = await Promise.all([
      playerAPI.getByTeam(t, fx.home_team_id),
      playerAPI.getByTeam(t, fx.away_team_id),
    ]);
    setModalPlayers([...home, ...away]);
    setSelectedFixture(fx);
  } catch (e:any) {
    toast({ variant: "destructive", title: "Load failed", description: e.message || "Could not load players." });
  } finally {
    setModalLoading(false);
  }
};

const handleSaveStats = async (
  fixtureId: number,
  scores: { home_score: number; away_score: number },
  statsMap: { [playerId: number]: PlayerGameweekStats}
) => {
  const t = token || localStorage.getItem("admin_token");
  if (!t || !gameweek) return;

  // map object -> array for API
  const player_stats = Object.entries(statsMap).map(([pid, s]) => ({
    player_id: Number(pid),
    played: s.played ?? false,
    goals_scored: s.goals_scored ?? 0,
    assists: s.assists ?? 0,
    clean_sheets: s.clean_sheets ?? false,
    goals_conceded: s.goals_conceded ?? 0,
    own_goals: s.own_goals ?? 0,
    penalties_missed: s.penalties_missed ?? 0,
    yellow_cards: s.yellow_cards ?? 0,
    red_cards: s.red_cards ?? 0,
    bonus_points: s.bonus_points ?? 0,
  }));


  try {
    await gameweekAPI.submitPlayerStats(gameweek.id, fixtureId, {
      home_score: scores.home_score,
      away_score: scores.away_score,
      player_stats,
    }, t);

    // reflect locally
    setFixtures(prev =>
      prev.map(f =>
        f.id === fixtureId
          ? { ...f, stats_entered: true, home_score: scores.home_score, away_score: scores.away_score }
          : f
      )
    );
    setSelectedFixture(null);
    toast({ title: "Saved", description: "Stats updated." });
  } catch (e:any) {
    toast({ variant: "destructive", title: "Save failed", description: e.message || "Error" });
  }
};

  const handleCalculatePoints = useCallback(async () => {
  const t = token || localStorage.getItem("admin_token");
  if (!t || !gameweek) return;

  setConfirming(null); // Close the confirmation dialog immediately

  toast({ title: "Processing...", description: "Calculating points for all users. This may take a moment." });

  try {
    // Set a calculating status locally for immediate UI feedback
    setGameweek(gw => ({ ...gw, status: 'Calculating' }));

    const response = await gameweekAPI.calculatePoints(gameweek.id, t);

    // Update UI to reflect completion
    setGameweek(gw => ({ ...gw, status: 'Points Calculated' }));
    toast({ title: "Success!", description: response.message || "Points calculation complete." });

  } catch (error: any) {
    // Revert status on error
    setGameweek(gw => ({ ...gw, status: 'Live' }));
    toast({
      variant: "destructive",
      title: "Calculation Failed",
      description: error.message || "An error occurred while calculating points.",
    });
  }
}, [token, gameweek, toast]);


  const handleFinalizeGameweek = useCallback(async () => {
    const t = token || localStorage.getItem("admin_token");
    if (!t || !gameweek) return;

    setConfirming(null); // Close the confirmation dialog

    toast({ title: "Finalizing...", description: "Processing gameweek rollover tasks." });

    try {
      // Set a temporary "finalizing" status if you want visual feedback
      // setGameweek(gw => ({ ...gw, status: 'Finalizing' })); // Optional

      await gameweekAPI.finalizeGameweek(gameweek.id, t);

      // On success, update the UI permanently
      setGameweek(gw => ({ ...gw, status: 'Finalized' }));
      toast({ 
        title: "Gameweek Finalized", 
        description: `Gameweek ${gameweek.id} is now complete and rollover tasks have been executed.` 
      });
      
    } catch (error: any) {
      // Revert status on error if you used a temporary one
      setGameweek(gw => ({ ...gw, status: 'Points Calculated' })); // Revert to pre-finalize state
      toast({
        variant: "destructive",
        title: "Finalization Failed",
        description: error.message || "An error occurred during the finalization process.",
      });
    }
  }, [token, gameweek, toast]);

  const MainActionButton = () => {
    if (!gameweek) return null;
    if (gameweek.status === 'Live') {
      return (
        <Button size="lg" disabled={!allStatsEntered} onClick={() => setConfirming('calculate')}>
          <Check className="mr-2 h-5 w-5" />
          Calculate All Points
        </Button>
      );
    }
    if (gameweek.status === 'Points Calculated') {
      return (
        <Button size="lg" variant="destructive" onClick={() => setConfirming('finalize')}>
          <ShieldQuestion className="mr-2 h-5 w-5" />
          Finalize Gameweek
        </Button>
      );
    }
    return null; // Don't show a button for Calculating or Finalized statuses
  };


  return (
    <div className="space-y-6">
      <GameweekInfoCard gameweek={gameweek} />

      <FixturesList
        fixtures={fixtures}
        onOpenStatsModal={handleOpenStatsModal}
      />
      
      {gameweek && gameweek.status !== 'Finalized' && (
  <Card className="admin-card-shadow">
    <CardContent className="p-6 flex items-center justify-center">
      <MainActionButton />
    </CardContent>
  </Card>
)}

      <StatsEntryModal
        isOpen={!!selectedFixture}
        onClose={() => setSelectedFixture(null)}
        fixture={selectedFixture}
        players={modalPlayers}
        loading={modalLoading}
        onSave={handleSaveStats}
      />

      <ConfirmDialog
        open={!!isConfirming}
        onOpenChange={(isOpen) => !isOpen && setConfirming(null)}
        title={isConfirming === 'calculate' ? "Calculate Points?" : "Finalize Gameweek?"}
        description={
            isConfirming === 'calculate' 
            ? "This will calculate points for all players based on the stats entered. This action cannot be undone."
            : "This is the final step. Once finalized, scores cannot be changed. Are you sure you want to proceed?"
        }
        onConfirm={isConfirming === 'calculate' ? handleCalculatePoints : handleFinalizeGameweek}
        confirmText={isConfirming === 'calculate' ? "Yes, Calculate" : "Yes, Finalize"}
        variant={isConfirming === 'finalize' ? 'destructive' : 'default'}
      />
    </div>
  );
}

