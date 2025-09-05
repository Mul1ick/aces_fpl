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
import { Badge } from '@/components/ui/badge';
import type { Team, Player } from '@/types';

// Define a type for the stats we'll be collecting for each player
type PlayerStatInputs = {
  [playerId: number]: {
    goals_scored: number;
    assists: number;
    yellow_cards: number;
    red_cards: number;
    bonus_points: number;
  };
};

// Fixture type needs to be defined here as well for props
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
  onClose: () => void;
  onSave: (fixtureId: number, scores: { home_score: number; away_score: number }, stats: PlayerStatInputs) => void;
}

const PlayerStatRow = ({ player, stats, onStatChange }: { player: Player; stats: PlayerStatInputs[number]; onStatChange: (playerId: number, field: keyof PlayerStatInputs[number], value: number) => void; }) => (
    <div className="grid grid-cols-6 items-center gap-3 py-2 border-b last:border-b-0">
        <div className="col-span-2">
            <p className="font-medium text-sm truncate">{player.full_name}</p>
            <p className="text-xs text-muted-foreground">{player.position}</p>
        </div>
        {Object.keys(stats).map((key) => (
            <Input
                key={key}
                type="number"
                min="0"
                className="h-8 text-center"
                value={stats[key as keyof typeof stats]}
                onChange={(e) => onStatChange(player.id, key as keyof typeof stats, parseInt(e.target.value) || 0)}
            />
        ))}
    </div>
);

const StatsTableHeader = () => (
    <div className="grid grid-cols-6 items-center gap-3 px-2 pb-2 font-semibold text-xs text-muted-foreground border-b sticky top-0 bg-card z-10">
        <div className="col-span-2">Player</div>
        <div className="text-center">G</div>
        <div className="text-center">A</div>
        <div className="text-center">YC</div>
        <div className="text-center">RC</div>
        <div className="text-center">BP</div>
    </div>
);


export function StatsEntryModal({ fixture, players, isOpen, onClose, onSave }: StatsEntryModalProps) {
  const [stats, setStats] = useState<PlayerStatInputs>({});
  const [homeScore, setHomeScore] = useState<number | string>('');
  const [awayScore, setAwayScore] = useState<number | string>('');

  const getLogoPath = (logoUrl: string | undefined) => {
    if (!logoUrl) return `/src/assets/images/team-logos/grey.png`;
    return `/src/assets/images/team-logos/${logoUrl}`;
  };

  const { homePlayers, awayPlayers } = useMemo(() => {
    if (!fixture) return { homePlayers: [], awayPlayers: [] };
    return {
      homePlayers: players.filter(p => p.team_id === fixture.home_team.id),
      awayPlayers: players.filter(p => p.team_id === fixture.away_team.id),
    };
  }, [fixture, players]);

  useEffect(() => {
    if (fixture) {
      setHomeScore(fixture.home_score ?? '');
      setAwayScore(fixture.away_score ?? '');
      const allFixturePlayers = [...homePlayers, ...awayPlayers];
      const initialStats: PlayerStatInputs = {};
      allFixturePlayers.forEach(player => {
        initialStats[player.id] = {
          goals_scored: 0,
          assists: 0,
          yellow_cards: 0,
          red_cards: 0,
          bonus_points: 0,
        };
      });
      setStats(initialStats);
    }
  }, [fixture, homePlayers, awayPlayers]);
  
  const handleStatChange = (playerId: number, field: keyof PlayerStatInputs[number], value: number) => {
    setStats(prev => ({ ...prev, [playerId]: { ...prev[playerId], [field]: value } }));
  };

  const handleSave = () => {
    if (fixture) {
      const scores = { home_score: Number(homeScore), away_score: Number(awayScore) };
      onSave(fixture.id, scores, stats);
    }
  };

  if (!fixture) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0">
        <DialogHeader className="bg-sidebar text-sidebar-foreground p-4 rounded-t-lg">
          <DialogTitle className="text-xl">Enter Match Stats</DialogTitle>
          <DialogDescription className="text-sidebar-foreground/80">
            Update the final score and individual player performance for this fixture.
          </DialogDescription>
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-3 w-2/5 justify-end">
              <h3 className="text-lg font-bold">{fixture.home_team.name}</h3>
              <img src={getLogoPath(fixture.home_team.logo_url)} alt={fixture.home_team.name} className="h-10 w-10"/>
            </div>
            <div className="flex items-center gap-2 w-1/5 justify-center">
              <Input type="number" min="0" value={homeScore} onChange={(e) => setHomeScore(e.target.value)} className="h-12 w-16 text-center text-2xl font-bold bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border" />
              <span className="text-2xl font-light">-</span>
              <Input type="number" min="0" value={awayScore} onChange={(e) => setAwayScore(e.target.value)} className="h-12 w-16 text-center text-2xl font-bold bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border" />
            </div>
            <div className="flex items-center gap-3 w-2/5 justify-start">
              <img src={getLogoPath(fixture.away_team.logo_url)} alt={fixture.away_team.name} className="h-10 w-10"/>
              <h3 className="text-lg font-bold">{fixture.away_team.name}</h3>
            </div>
          </div>
        </DialogHeader>
        
        <div className="p-6">
            <ScrollArea className="h-[50vh] w-full">
              <div className="space-y-6">
                {/* Home Team Section in a distinct container */}
                <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-lg">{fixture.home_team.name}</h4>
                      <Badge variant="secondary">Home</Badge>
                    </div>
                    <StatsTableHeader />
                    <div className="px-2">
                        {homePlayers.map(player => (
                            <PlayerStatRow key={player.id} player={player} stats={stats[player.id]} onStatChange={handleStatChange} />
                        ))}
                    </div>
                </div>

                {/* Away Team Section in a distinct container */}
                <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-lg">{fixture.away_team.name}</h4>
                      <Badge variant="secondary">Away</Badge>
                    </div>
                    <StatsTableHeader />
                    <div className="px-2">
                        {awayPlayers.map(player => (
                            <PlayerStatRow key={player.id} player={player} stats={stats[player.id]} onStatChange={handleStatChange} />
                        ))}
                    </div>
                </div>
              </div>
            </ScrollArea>
        </div>

        <DialogFooter className="p-6 pt-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Stats & Results</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

