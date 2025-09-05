import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import type { Team } from '@/types';

interface Fixture {
  id: number;
  home_team: Team;
  away_team: Team;
  home_score?: number | null;
  away_score?: number | null;
  stats_entered: boolean;
}

interface FixturesListProps {
  fixtures: Fixture[];
  onOpenStatsModal: (fixtureId: number) => void;
}

export function FixturesList({ fixtures, onOpenStatsModal }: FixturesListProps) {
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
          fixtures.map((fixture) => (
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
                {fixture.stats_entered ? (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20 pointer-events-none">
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Complete
                  </Badge>
                ) : (
                  <Badge variant="outline">Upcoming</Badge>
                )}
                <Button
                  size="sm"
                  onClick={() => onOpenStatsModal(fixture.id)}
                >
                  {fixture.stats_entered ? 'View Stats' : 'Enter Stats'}
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No fixtures found for this gameweek.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

