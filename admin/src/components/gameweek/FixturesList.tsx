import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import type { Team, GameweekStatus } from '@/types';
import { formatDistanceToNow, isPast } from 'date-fns';

interface Fixture {
  id: number;
  home_team: Team;
  away_team: Team;
  home_score?: number | null;
  away_score?: number | null;
  stats_entered: boolean;
  kickoff: string; // --- MODIFIED --- Changed from kickoff_time to kickoff
}

interface FixturesListProps {
  fixtures: Fixture[];
  gameweekStatus?: GameweekStatus;
  onOpenStatsModal: (fixtureId: number) => void;
}

export function FixturesList({ fixtures, gameweekStatus, onOpenStatsModal }: FixturesListProps) {
  const getLogoPath = (logoUrl: string | undefined) => {
    if (!logoUrl) return `/src/assets/images/team-logos/grey.png`;
    return `/src/assets/images/team-logos/${logoUrl}`;
  };

  return (
    <Card className="admin-card-shadow">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Gameweek Fixtures</CardTitle>
        <p className="text-muted-foreground">
          Enter player statistics for each completed match below.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {fixtures.length > 0 ? (
          fixtures.map((fixture) => {
            // --- MODIFIED --- Now reads from fixture.kickoff
            const kickoffDate = fixture.kickoff ? new Date(fixture.kickoff) : null;
            const isKickoffValid = kickoffDate && !isNaN(kickoffDate.getTime());
            const hasMatchPassed = isKickoffValid ? isPast(kickoffDate) : false;

            const getStatusBadge = () => {
              if (fixture.stats_entered) {
                return (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20 pointer-events-none">
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Complete
                  </Badge>
                );
              }
              if (!isKickoffValid) {
                  return (
                      <Badge variant="destructive">
                          <AlertTriangle className="h-4 w-4 mr-1.5" />
                          Invalid Date
                      </Badge>
                  )
              }
              if (gameweekStatus === 'LIVE' && hasMatchPassed) {
                 return (
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                    Awaiting Stats
                  </Badge>
                );
              }
              return (
                  <Badge variant="outline">
                      <Clock className="h-4 w-4 mr-1.5" />
                      {formatDistanceToNow(kickoffDate, { addSuffix: true })}
                  </Badge>
              );
            };

            return (
              <div
                key={fixture.id}
                className="flex items-center justify-between rounded-lg border bg-background hover:bg-muted/50 transition-colors p-4"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-3 w-2/5 justify-end">
                    <span className="font-bold text-right truncate">{fixture.home_team.name}</span>
                    <img src={getLogoPath(fixture.home_team.logo_url)} alt={fixture.home_team.name} className="h-8 w-8"/>
                  </div>
                  <div className="w-1/5 text-center">
                      {fixture.stats_entered ? (
                          <span className="text-2xl font-bold">{fixture.home_score} - {fixture.away_score}</span>
                      ) : (
                          <span className="text-sm font-semibold text-muted-foreground">vs</span>
                      )}
                  </div>
                  <div className="flex items-center gap-3 w-2/5 justify-start">
                    <img src={getLogoPath(fixture.away_team.logo_url)} alt={fixture.away_team.name} className="h-8 w-8"/>
                    <span className="font-bold text-left truncate">{fixture.away_team.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-4">
                  {getStatusBadge()}
                  <Button
                    size="sm"
                    onClick={() => onOpenStatsModal(fixture.id)}
                    disabled={!hasMatchPassed && !fixture.stats_entered}
                    title={!hasMatchPassed ? "You can enter stats after the match has kicked off." : "Enter or view stats"}
                  >
                    {fixture.stats_entered ? 'View Stats' : 'Enter Stats'}
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No fixtures found for this gameweek.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

