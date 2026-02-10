import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Team, Player, PlayerGameweekStats } from '@/types';
import { CompactInput } from '@/components/shared/CompactInput';
import { Goal, PlusCircle, ShieldCheck, ShieldX, Square, Footprints, ShieldAlert, Ban, Star, Timer } from 'lucide-react';

// --- MODIFIED: Extend type locally to include suspension duration ---
type ExtendedPlayerGameweekStats = PlayerGameweekStats & {
  suspension_duration?: number;
};

type PlayerStatInputs = {
  [playerId: number]: ExtendedPlayerGameweekStats;
};

const DEFAULT_ROW_STATS: ExtendedPlayerGameweekStats = {
  played: false, goals_scored: 0, assists: 0, clean_sheets: false,
  goals_conceded: 0, own_goals: 0, penalties_missed: 0, yellow_cards: 0,
  red_cards: 0, bonus_points: 0,
  suspension_duration: 1, // Default duration
};

type StatKey = keyof ExtendedPlayerGameweekStats;

interface Fixture {
  id: number;
  home_team: Team;
  away_team: Team;
  home_score?: number | null;
  away_score?: number | null;
}

interface StatsEntryModalProps {
  fixture: Fixture | null;
  players: Player[];
  isOpen: boolean;
  loading?: boolean;
  isReadOnly?: boolean;
  initialStats?: PlayerStatInputs | null;
  onClose: () => void;
  onSave: (fixtureId: number, scores: { home_score: number; away_score: number }, stats: PlayerStatInputs) => void;
}

const StatsTableHeader = () => {
    const headers = [
        { icon: <Footprints className="h-5 w-5" />, label: 'Played' },
        { icon: <Goal className="h-5 w-5 text-blue-500" />, label: 'Goals' },
        { icon: <PlusCircle className="h-5 w-5 text-green-500" />, label: 'Assists' },
        { icon: <ShieldCheck className="h-5 w-5 text-green-500" />, label: 'Clean Sheet' },
        { icon: <ShieldX className="h-5 w-5 text-red-500" />, label: 'Goals Conceded' },
        { icon: <ShieldAlert className="h-5 w-5" />, label: 'Own Goals' },
        { icon: <Ban className="h-5 w-5" />, label: 'Pen Miss' },
        { icon: <Square className="h-5 w-5 text-yellow-500 fill-yellow-500" />, label: 'Yellow Card' },
        { icon: <Square className="h-5 w-5 text-red-600 fill-red-600" />, label: 'Red Card' },
        { icon: <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />, label: 'Bonus' },
    ];

    return (
        <div className="grid grid-cols-[minmax(200px,_1.5fr)_repeat(10,_minmax(80px,_1fr))] items-center gap-3 px-3 py-2 font-semibold text-xs text-muted-foreground border-b sticky top-0 bg-card z-10">
            <div className="text-left font-bold">Player</div>
            {headers.map(h => (
                <div key={h.label} className="flex flex-col items-center justify-center gap-1.5 h-12">
                    {h.icon}
                    <span className="font-bold text-center text-wrap leading-tight">{h.label}</span>
                </div>
            ))}
        </div>
    );
};

const PlayerStatRow = ({
  player,
  stats,
  onStatChange,
  isReadOnly,
}: {
  player: Player;
  stats: ExtendedPlayerGameweekStats;
  onStatChange: (playerId: number, field: StatKey, value: number | boolean) => void;
  isReadOnly?: boolean;
}) => {
  return (
    <div className="grid grid-cols-[minmax(200px,_1.5fr)_repeat(10,_minmax(80px,_1fr))] items-center gap-3 py-2 border-b last:border-b-0">
      <div>
        <p className="font-medium text-sm truncate">{player.full_name}</p>
        <p className="text-xs text-muted-foreground">{player.position}</p>
      </div>
      <div className="flex justify-center"><Switch checked={stats.played} onCheckedChange={(val) => onStatChange(player.id, 'played', val)} disabled={isReadOnly} /></div>
      <CompactInput value={stats.goals_scored} onValueChange={(val) => onStatChange(player.id, 'goals_scored', val)} disabled={isReadOnly} />
      <CompactInput value={stats.assists} onValueChange={(val) => onStatChange(player.id, 'assists', val)} disabled={isReadOnly} />
      <div className="flex justify-center"><Switch checked={stats.clean_sheets} onCheckedChange={(val) => onStatChange(player.id, 'clean_sheets', val)} disabled={isReadOnly} /></div>
      <CompactInput value={stats.goals_conceded} onValueChange={(val) => onStatChange(player.id, 'goals_conceded', val)} disabled={isReadOnly} />
      <CompactInput value={stats.own_goals} onValueChange={(val) => onStatChange(player.id, 'own_goals', val)} disabled={isReadOnly} />
      <CompactInput value={stats.penalties_missed} onValueChange={(val) => onStatChange(player.id, 'penalties_missed', val)} disabled={isReadOnly} />
      <CompactInput value={stats.yellow_cards} onValueChange={(val) => onStatChange(player.id, 'yellow_cards', val)} max={1} disabled={isReadOnly} />
      
      {/* --- MODIFIED: Red Card Column with Duration Popup --- */}
      <div className="flex flex-col items-center gap-1">
        <CompactInput value={stats.red_cards} onValueChange={(val) => onStatChange(player.id, 'red_cards', val)} max={1} disabled={isReadOnly} />
        {stats.red_cards > 0 && !isReadOnly && (
           <div className="flex items-center gap-1 scale-75 origin-top">
             <Timer className="w-3 h-3 text-red-500" />
             <Select 
                value={String(stats.suspension_duration || 1)} 
                onValueChange={(val) => onStatChange(player.id, 'suspension_duration', parseInt(val))}
             >
                <SelectTrigger className="h-6 w-14 text-[10px] px-1">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="1">1 GM</SelectItem>
                    <SelectItem value="2">2 GM</SelectItem>
                    <SelectItem value="3">3 GM</SelectItem>
                    <SelectItem value="4">4 GM</SelectItem>
                </SelectContent>
             </Select>
           </div>
        )}
      </div>
      {/* --------------------------------------------------- */}

      <CompactInput value={stats.bonus_points} onValueChange={(val) => onStatChange(player.id, 'bonus_points', val)} max={3} disabled={isReadOnly} />
    </div>
  );
};

export function StatsEntryModal({ fixture, players, isOpen, loading = false, isReadOnly = false, initialStats, onClose, onSave }: StatsEntryModalProps) {
  const [stats, setStats] = useState<PlayerStatInputs>({});
  const [homeScore, setHomeScore] = useState<number | string>('');
  const [awayScore, setAwayScore] = useState<number | string>('');

  const getLogoPath = (logoUrl: string | undefined) => {
    if (!logoUrl) return `/src/assets/images/team-logos/grey.png`;
    return `/src/assets/images/team-logos/${logoUrl}`;
  };

  const { homePlayers, awayPlayers } = useMemo(() => {
    if (!fixture) return { homePlayers: [], awayPlayers: [] };
    const getTid = (p: Player) => (p as any).team_id ?? (p as any).team?.id;
    return {
      homePlayers: players.filter(p => getTid(p) === fixture.home_team.id),
      awayPlayers: players.filter(p => getTid(p) === fixture.away_team.id),
    };
  }, [fixture, players]);

  useEffect(() => {
    if (fixture) {
      setHomeScore(fixture.home_score ?? '');
      setAwayScore(fixture.away_score ?? '');
      const allFixturePlayers = [...homePlayers, ...awayPlayers];
      
      const populatedStats: PlayerStatInputs = {};

      allFixturePlayers.forEach(player => {
        const savedStat = initialStats ? initialStats[player.id] : null;
        if (savedStat) {
          populatedStats[player.id] = {
            played: savedStat.played ?? false,
            goals_scored: savedStat.goals_scored ?? 0,
            assists: savedStat.assists ?? 0,
            clean_sheets: savedStat.clean_sheets ?? false,
            goals_conceded: savedStat.goals_conceded ?? 0,
            own_goals: savedStat.own_goals ?? 0,
            penalties_missed: savedStat.penalties_missed ?? 0,
            yellow_cards: savedStat.yellow_cards ?? 0,
            red_cards: savedStat.red_cards ?? 0,
            bonus_points: savedStat.bonus_points ?? 0,
            // Only strictly needed for new input, saved stats won't have it (that's fine)
            suspension_duration: 1, 
          };
        } else {
          populatedStats[player.id] = { ...DEFAULT_ROW_STATS };
        }
      });
      
      setStats(populatedStats);
    }
  }, [fixture, homePlayers, awayPlayers, initialStats]);

  const handleStatChange = (playerId: number, field: keyof ExtendedPlayerGameweekStats, value: number | boolean) => {
    setStats(prev => ({ ...prev, [playerId]: { ...prev[playerId], [field]: value } }));
  };

  const handleSave = () => {
    if (fixture) {
      const scores = { home_score: Number(homeScore), away_score: Number(awayScore) };
      onSave(fixture.id, scores, stats);
    }
  };

  if (!fixture) return null;

  const renderPlayerTable = (teamPlayers: Player[]) => (
    <div className="border rounded-lg">
      <StatsTableHeader />
      <div className="px-3">
        {teamPlayers.map(player => (
          <PlayerStatRow
            key={player.id}
            player={player}
            stats={stats[player.id] || DEFAULT_ROW_STATS}
            onStatChange={handleStatChange}
            isReadOnly={isReadOnly}
          />
        ))}
      </div>
    </div>
  );

  // ... (Rest of component render logic, dialog content, etc. remains exactly the same) ...
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl p-0">
        <DialogHeader className="bg-sidebar text-sidebar-foreground p-4 rounded-t-lg">
          <DialogTitle className="text-xl">{isReadOnly ? 'View Match Stats' : 'Enter Match Stats'}</DialogTitle>
          <DialogDescription className="text-sidebar-foreground/80">
            {isReadOnly ? 'These stats have been finalized and cannot be edited.' : 'Update the final score and individual player performance for this fixture.'}
          </DialogDescription>
          <div className="flex items-center justify-center pt-4 gap-4">
            <div className="flex items-center gap-3 w-2/5 justify-end">
              <h3 className="text-lg font-bold">{fixture.home_team.name}</h3>
              <img src={getLogoPath(fixture.home_team.logo_url)} alt={fixture.home_team.name} className="h-10 w-10"/>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <Input type="number" min="0" value={homeScore} onChange={(e) => setHomeScore(e.target.value)} className="h-12 w-16 text-center text-2xl font-bold bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border" disabled={isReadOnly} />
              <span className="text-2xl font-light">-</span>
              <Input type="number" min="0" value={awayScore} onChange={(e) => setAwayScore(e.target.value)} className="h-12 w-16 text-center text-2xl font-bold bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border" disabled={isReadOnly} />
            </div>
            <div className="flex items-center gap-3 w-2/5 justify-start">
              <img src={getLogoPath(fixture.away_team.logo_url)} alt={fixture.away_team.name} className="h-10 w-10"/>
              <h3 className="text-lg font-bold">{fixture.away_team.name}</h3>
            </div>
          </div>
        </DialogHeader>
        
        <div className="p-6">
          <ScrollArea className="h-[55vh] w-full pr-4">
            {loading ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Loading players…</div>
            ) : (
              <Tabs defaultValue="home">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="home">
                    <img src={getLogoPath(fixture.home_team.logo_url)} alt="" className="h-5 w-5 mr-2" /> {fixture.home_team.name}
                  </TabsTrigger>
                  <TabsTrigger value="away">
                    <img src={getLogoPath(fixture.away_team.logo_url)} alt="" className="h-5 w-5 mr-2" /> {fixture.away_team.name}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="home">
                  {renderPlayerTable(homePlayers)}
                </TabsContent>
                <TabsContent value="away">
                  {renderPlayerTable(awayPlayers)}
                </TabsContent>
              </Tabs>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="p-6 pt-0">
          {isReadOnly ? (
            <Button onClick={onClose}>Close</Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSave} disabled={loading || homePlayers.length === 0 || awayPlayers.length === 0}>Save Stats & Results</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}