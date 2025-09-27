import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { GameweekInfoCard } from '@/components/gameweek/GameweekInfoCard';
import { FixturesList } from '@/components/gameweek/FixturesList';
import { StatsEntryModal } from '@/components/gameweek/StatsEntryModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Check, ShieldQuestion, Loader2 } from 'lucide-react';
import type { Player, PlayerGameweekStats, Gameweek } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { gameweekAPI, playerAPI } from '@/lib/api';

// A new component for navigation
const GameweekNavigator = ({ allGameweeks, selectedId, onNavigate, onSelect }) => {
  const currentIndex = allGameweeks.findIndex(gw => gw.id === selectedId);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === allGameweeks.length - 1;

  return (
    <Card className="admin-card-shadow mb-6">
      <CardContent className="p-4 flex items-center justify-between">
        <Button size="icon" variant="outline" onClick={() => onNavigate('prev')} disabled={isFirst}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Select value={String(selectedId)} onValueChange={(val) => onSelect(Number(val))}>
          <SelectTrigger className="w-[250px] text-center font-bold">
            <SelectValue placeholder="Select a Gameweek" />
          </SelectTrigger>
          <SelectContent>
            {allGameweeks.map(gw => (
              <SelectItem key={gw.id} value={String(gw.id)}>
                {`Gameweek ${gw.gw_number}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="icon" variant="outline" onClick={() => onNavigate('next')} disabled={isLast}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

export function GameweekPage() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [allGameweeks, setAllGameweeks] = useState<Gameweek[]>([]);
  const [selectedGameweekId, setSelectedGameweekId] = useState<number | null>(null);
  const [gameweek, setGameweek] = useState<any>(null);
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [selectedFixture, setSelectedFixture] = useState<any | null>(null);
  const [isConfirming, setConfirming] = useState<'calculate' | 'finalize' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalPlayers, setModalPlayers] = useState<Player[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [initialModalStats, setInitialModalStats] = useState(null); // State for saved stats

  useEffect(() => {
    const t = token || localStorage.getItem("admin_token");
    if (!t) return;

    const initialLoad = async () => {
      try {
        setIsLoading(true);
        const [allGws, currentGw] = await Promise.all([
          gameweekAPI.getGameweeks(t),
          gameweekAPI.getCurrentGameweek(t)
        ]);
        
        const sortedGws = allGws.sort((a, b) => a.gw_number - b.gw_number);
        setAllGameweeks(sortedGws);
        
        if (currentGw) {
          setSelectedGameweekId(currentGw.id);
        } else if (sortedGws.length > 0) {
          setSelectedGameweekId(sortedGws[0].id);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        setIsLoading(false);
        console.error("[GameweekPage] Failed to load initial data:", err);
        toast({ variant: "destructive", title: "Error", description: "Failed to load gameweek list." });
      }
    };

    initialLoad();
  }, [token, toast]);

  useEffect(() => {
    const t = token || localStorage.getItem("admin_token");
    if (!t || selectedGameweekId === null) return;

    const fetchGameweekData = async () => {
      try {
        setIsLoading(true);
        const data = await gameweekAPI.getGameweekById(selectedGameweekId, t);
        setGameweek({
          id: data.id,
          name: `Gameweek ${data.gw_number}`,
          deadline_time: typeof data.deadline === 'string' ? data.deadline : new Date(data.deadline).toISOString(),
          status: data.status,
        });
        setFixtures(data.fixtures || []);
      } catch (err) {
        console.error(`[GameweekPage] Failed to load GW ${selectedGameweekId}:`, err);
        toast({ variant: "destructive", title: "Error", description: "Failed to load selected gameweek." });
      } finally {
        setIsLoading(false);
      }
    };

    fetchGameweekData();
  }, [selectedGameweekId, token, toast]);

  const handleNavigation = (direction: 'prev' | 'next') => {
    const currentIndex = allGameweeks.findIndex(gw => gw.id === selectedGameweekId);
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedGameweekId(allGameweeks[currentIndex - 1].id);
    } else if (direction === 'next' && currentIndex < allGameweeks.length - 1) {
      setSelectedGameweekId(allGameweeks[currentIndex + 1].id);
    }
  };
  
  const allStatsEntered = useMemo(() => fixtures.length > 0 && fixtures.every(f => f.stats_entered), [fixtures]);

  const handleOpenStatsModal = async (fixtureId: number) => {
    const t = token || localStorage.getItem("admin_token");
    const fx = fixtures.find(f => f.id === fixtureId);
    if (!t || !fx) return;

    try {
      setModalLoading(true);
      
      const [homePlayers, awayPlayers, savedStats] = await Promise.all([
        playerAPI.getByTeam(t, fx.home_team_id),
        playerAPI.getByTeam(t, fx.away_team_id),
        gameweekAPI.getFixtureStats(String(fx.id), t)
      ]);
      
      setModalPlayers([...(homePlayers || []), ...(awayPlayers || [])]);
      
      const statsMap = savedStats.player_stats.reduce((acc, stat) => {
        acc[stat.player_id] = stat;
        return acc;
      }, {});
      setInitialModalStats(statsMap);

      setSelectedFixture(fx);
    } catch (e:any) {
      toast({ variant: "destructive", title: "Load failed", description: e.message || "Could not load fixture data." });
    } finally {
      setModalLoading(false);
    }
  };

  const handleSaveStats = async (fixtureId: number, scores: {home_score: number, away_score: number}, statsMap: {[playerId: number]: PlayerGameweekStats}) => {
    const t = token || localStorage.getItem("admin_token");
    if (!t || !gameweek) return;
    const player_stats = Object.entries(statsMap).map(([pid, s]) => ({
      player_id: Number(pid), played: s.played ?? false, goals_scored: s.goals_scored ?? 0,
      assists: s.assists ?? 0, clean_sheets: s.clean_sheets ?? false, goals_conceded: s.goals_conceded ?? 0,
      own_goals: s.own_goals ?? 0, penalties_missed: s.penalties_missed ?? 0, yellow_cards: s.yellow_cards ?? 0,
      red_cards: s.red_cards ?? 0, bonus_points: s.bonus_points ?? 0,
    }));
    try {
      await gameweekAPI.submitPlayerStats(gameweek.id, fixtureId, { ...scores, player_stats }, t);
      setFixtures(prev => prev.map(f => f.id === fixtureId ? { ...f, stats_entered: true, ...scores } : f));
      setSelectedFixture(null);
      toast({ title: "Saved", description: "Stats updated successfully." });
    } catch (e:any) {
      toast({ variant: "destructive", title: "Save failed", description: e.message || "An unknown error occurred." });
    }
  };

  const handleCalculatePoints = useCallback(async () => {
    const t = token || localStorage.getItem("admin_token");
    if (!t || !gameweek) return;
    setConfirming(null);
    toast({ title: "Processing...", description: "Calculating points for all users. This may take a moment." });
    try {
      setGameweek(gw => ({ ...gw, status: 'Calculating' }));
      const response = await gameweekAPI.calculatePoints(gameweek.id, t);
      setGameweek(gw => ({ ...gw, status: 'Points Calculated' }));
      toast({ title: "Success!", description: response.message || "Points calculation complete." });
    } catch (error: any) {
      setGameweek(gw => ({ ...gw, status: 'Live' }));
      toast({ variant: "destructive", title: "Calculation Failed", description: error.message || "An error occurred." });
    }
  }, [token, gameweek, toast]);

  const handleFinalizeGameweek = useCallback(async () => {
    const t = token || localStorage.getItem("admin_token");
    if (!t || !gameweek) return;
    setConfirming(null);
    toast({ title: "Finalizing...", description: "Processing gameweek rollover tasks." });
    try {
      await gameweekAPI.finalizeGameweek(gameweek.id, t);
      setGameweek(gw => ({ ...gw, status: 'Finalized' }));
      toast({ title: "Gameweek Finalized", description: `Gameweek ${gameweek.id} is now complete.` });
    } catch (error: any) {
      setGameweek(gw => ({ ...gw, status: 'Points Calculated' }));
      toast({ variant: "destructive", title: "Finalization Failed", description: error.message || "An error occurred." });
    }
  }, [token, gameweek, toast]);

  const MainActionButton = () => {
    if (!gameweek) return null;
    if (gameweek.status === 'Calculating') {
        return <Button size="lg" disabled><Loader2 className="mr-2 h-5 w-5 animate-spin" />Calculating...</Button>;
    }
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
    return null;
  };

  return (
    <div className="space-y-6">
      {allGameweeks.length > 0 && selectedGameweekId !== null ? (
        <GameweekNavigator
          allGameweeks={allGameweeks}
          selectedId={selectedGameweekId}
          onNavigate={handleNavigation}
          onSelect={setSelectedGameweekId}
        />
      ) : !isLoading && <p className="text-center text-muted-foreground">No gameweeks found in the database.</p>}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : gameweek && (
        <>
          <GameweekInfoCard gameweek={gameweek} />
          <FixturesList fixtures={fixtures} onOpenStatsModal={handleOpenStatsModal} />
          {gameweek.status !== 'Finalized' && (
            <Card className="admin-card-shadow">
              <CardContent className="p-6 flex items-center justify-center">
                <MainActionButton />
              </CardContent>
            </Card>
          )}
        </>
      )}

      <StatsEntryModal
        isOpen={!!selectedFixture}
        onClose={() => setSelectedFixture(null)}
        fixture={selectedFixture}
        players={modalPlayers}
        loading={modalLoading}
        onSave={handleSaveStats}
        isReadOnly={gameweek?.status === 'Finalized'}
        initialStats={initialModalStats}
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