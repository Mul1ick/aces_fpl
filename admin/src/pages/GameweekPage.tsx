import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useToast } from '../hooks/use-toast';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { GameweekInfoCard } from '../components/gameweek/GameweekInfoCard';
import { FixturesList } from '../components/gameweek/FixturesList';
import { StatsEntryModal } from '../components/gameweek/StatsEntryModal';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ChevronLeft, ChevronRight, Check, ShieldQuestion, Loader2, PlayCircle, Pencil } from 'lucide-react';
import type { Player, PlayerGameweekStats, Gameweek } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { gameweekAPI, playerAPI, statsAPI, API_BASE_URL } from '../lib/api';

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
  const [isConfirming, setConfirming] = useState<'calculate' | 'finalize' | 'start' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalPlayers, setModalPlayers] = useState<Player[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'entry' | 'correction'>('view');
  const [initialModalStats, setInitialModalStats] = useState(null);

  const fetchAllGameweekData = useCallback(async () => {
    const t = token || localStorage.getItem("admin_token");
    if (!t) return;

    try {
        setIsLoading(true);
        const allGws = await gameweekAPI.getGameweeks(t);
        const sortedGws = allGws.sort((a, b) => a.gw_number - b.gw_number);
        setAllGameweeks(sortedGws);

        const liveGw = sortedGws.find(gw => gw.status === 'LIVE');
        const upcomingGw = sortedGws.find(gw => gw.status === 'UPCOMING');
        
        if (liveGw) {
            setSelectedGameweekId(liveGw.id);
        } else if (upcomingGw) {
            setSelectedGameweekId(upcomingGw.id);
        } else if (sortedGws.length > 0) {
            setSelectedGameweekId(sortedGws[sortedGws.length - 1].id);
        }
    } catch (err) {
        console.error("[GameweekPage] Failed to load initial data:", err);
        toast({ variant: "destructive", title: "Error", description: "Failed to load gameweek list." });
    } finally {
        setIsLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchAllGameweekData();
  }, [fetchAllGameweekData]);

  useEffect(() => {
    const t = token || localStorage.getItem("admin_token");
    if (!t || selectedGameweekId === null) return;

    const fetchGameweekData = async () => {
      try {
        setIsLoading(true);
        const data = await gameweekAPI.getGameweekById(selectedGameweekId, t);
        setGameweek({
          id: data.id,
          gw_number: data.gw_number,
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

  const handleOpenStatsModal = async (fixtureId: number, mode: 'view' | 'entry' | 'correction' = 'view') => {
    const t = token || localStorage.getItem("admin_token");
    const fx = fixtures.find(f => f.id === fixtureId);
    if (!t || !fx) return;

    // Logic to determine mode if not explicitly passed (backward compatibility)
    let targetMode = mode;
    if (mode === 'view' && !fx.stats_entered && gameweek?.status === 'LIVE') {
        targetMode = 'entry'; // Auto-switch to entry if live and not entered
    }

    try {
      setModalLoading(true);
      setModalMode(targetMode); // Set the mode state
      setSelectedFixture(fx);

      const [players, savedStats] = await Promise.all([
        gameweekAPI.getPlayersForFixture(fx.id, t),
        gameweekAPI.getFixtureStats(String(fx.id), t)
      ]);

      setModalPlayers(players);
      
      const statsMap = (savedStats as any).player_stats.reduce((acc: any, stat: any) => {
        acc[stat.player_id] = stat;
        return acc;
      }, {});
      setInitialModalStats(statsMap);

    } catch (e:any) {
      toast({ variant: "destructive", title: "Load failed", description: e.message || "Could not load fixture data." });
      setSelectedFixture(null);
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
      await gameweekAPI.submitPlayerStats(gameweek.id, fixtureId, { home_score: scores.home_score, away_score: scores.away_score, player_stats }, t);
      setFixtures(prev => prev.map(f => f.id === fixtureId ? { ...f, stats_entered: true, ...scores } : f));
      setSelectedFixture(null);
      toast({ title: "Saved", description: "Stats updated successfully." });
    } catch (e:any) {
      toast({ variant: "destructive", title: "Save failed", description: e.message || "An unknown error occurred." });
    }
  };

  const handleSaveCorrections = async (statsMap: {[playerId: number]: PlayerGameweekStats}) => {
    const t = token || localStorage.getItem("admin_token");
    if (!t || !gameweek || !selectedFixture || !initialModalStats) return;

    setModalLoading(true);
    const updates = [];
    let updateCount = 0;

    // 1. Iterate over new stats and compare with initial
    for (const [playerIdStr, newStat] of Object.entries(statsMap)) {
      const playerId = Number(playerIdStr);
      const oldStat = (initialModalStats as any)[playerId];

      if (!oldStat) continue; // Should not happen

      // 2. Diffing: Check if any relevant field changed
      // We manually check fields to avoid noise from backend-only fields like 'id' or timestamps
      const fieldsToCheck = ['goals_scored', 'assists', 'clean_sheets', 'goals_conceded', 'own_goals', 'penalties_missed', 'penalties_saved', 'yellow_cards', 'red_cards', 'bonus_points'];
      
      const hasChanged = fieldsToCheck.some(field => (newStat as any)[field] !== (oldStat as any)[field]);

      if (hasChanged) {
        // 3. Prepare payload for this specific player
        const payload = {
          player_id: playerId,
          gameweek_id: gameweek.id,
          ...newStat
        };
        // Remove unnecessary fields if your API is strict, but spread usually works fine
        
        updates.push(statsAPI.updatePlayerStats(t, payload));
        updateCount++;
      }
    }

    try {
      if (updateCount === 0) {
        toast({ title: "No Changes", description: "No stats were modified." });
        return;
      }

      await Promise.all(updates);
      toast({ title: "Corrections Saved", description: `Updated stats for ${updateCount} players. Scores recalculated.` });
      
      // Refresh to get new data
      setSelectedFixture(null);
      // Optional: Refresh gameweek data if needed
    } catch (e: any) {
      toast({ variant: "destructive", title: "Correction Failed", description: e.message || "Error updating stats." });
    } finally {
      setModalLoading(false);
    }
  };

  const handleStartSeason = useCallback(async () => {
    const t = token || localStorage.getItem("admin_token");
    if (!t) return;
    setConfirming(null);
    try {
        const response = await fetch(`${API_BASE_URL}/admin/gameweeks/start-season`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${t}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Failed to start season.");
        toast({ title: "Success", description: data.message });
        await fetchAllGameweekData();
    } catch (error: any) {
        toast({ variant: "destructive", title: "Failed to Start Season", description: error.message });
    }
  }, [token, toast, fetchAllGameweekData]);


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
      setGameweek(gw => ({ ...gw, status: 'LIVE' }));
      toast({ variant: "destructive", title: "Calculation Failed", description: error.message || "An error occurred." });
    }
  }, [token, gameweek, toast]);

  const handleFinalizeGameweek = useCallback(async () => {
    const t = token || localStorage.getItem("admin_token");
    if (!t || !gameweek) return;
    setConfirming(null);
    try {
        await gameweekAPI.finalizeGameweek(gameweek.id, t);
        toast({ title: `Gameweek ${gameweek.gw_number} Finalized!` });
        await fetchAllGameweekData();
    } catch (error: any) {
        toast({ variant: "destructive", title: "Finalization Failed", description: error.message });
    }
  }, [token, gameweek, toast, fetchAllGameweekData]);

  const MainActionButton = () => {
    if (!gameweek) return null;

    const isSeasonStarted = allGameweeks.some(gw => gw.status !== 'UPCOMING');

    if (!isSeasonStarted && gameweek.gw_number === 1) {
        const isPastDeadline = new Date(gameweek.deadline_time) < new Date();
        return (
            <Button 
                size="lg" 
                onClick={() => setConfirming('start')} 
                disabled={!isPastDeadline}
                title={!isPastDeadline ? `You can start the season after the GW1 deadline has passed.` : `Start the FPL Season`}
            >
                <PlayCircle className="mr-2 h-5 w-5" />
                Start Season
            </Button>
        );
    }

    if (gameweek.status === 'LIVE') {
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

  const getConfirmationDetails = () => {
    switch (isConfirming) {
        case 'start':
            return {
                title: "Start the Season?",
                description: "This will set Gameweek 1 to LIVE and lock all teams. This action cannot be undone.",
                onConfirm: handleStartSeason,
                confirmText: "Yes, Start Season",
                variant: 'default'
            };
        case 'calculate':
            return {
                title: "Calculate Points?",
                description: "This will calculate points for all players based on the stats entered. This action cannot be undone.",
                onConfirm: handleCalculatePoints,
                confirmText: "Yes, Calculate",
                variant: 'default'
            };
        case 'finalize':
            return {
                title: "Finalize Gameweek?",
                description: "This is the final step. Once finalized, scores cannot be changed. Are you sure you want to proceed?",
                onConfirm: handleFinalizeGameweek,
                confirmText: "Yes, Finalize",
                variant: 'destructive'
            };
        default:
            return {};
    }
  };

  const confirmationDetails = getConfirmationDetails();

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
          <FixturesList 
            fixtures={fixtures} 
            gameweekStatus={gameweek.status} 
            onOpenStatsModal={(id) => handleOpenStatsModal(id, 'entry')} // Standard Entry
            onOpenCorrectionModal={(id) => handleOpenStatsModal(id, 'correction')} // New Correction Action
          />
          {gameweek.status !== 'FINISHED' && (
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
            
            // 1. Pass the standard Entry handler to onSave
            onSave={(fixtureId, scores, stats) => handleSaveStats(fixtureId, scores, stats)}
            
            // 2. Pass the Correction handler to new prop
            onCorrectionSave={handleSaveCorrections}
            
            // 3. Pass mode
            mode={modalMode}
            
            // 4. isReadOnly is true ONLY if in view mode
            isReadOnly={modalMode === 'view'}
            
            initialStats={initialModalStats}
          />

      <ConfirmDialog
        open={!!isConfirming}
        onOpenChange={(isOpen) => !isOpen && setConfirming(null)}
        title={confirmationDetails.title}
        description={confirmationDetails.description}
        onConfirm={confirmationDetails.onConfirm}
        confirmText={confirmationDetails.confirmText}
        variant={confirmationDetails.variant as any}
      />
    </div>
  );
}

