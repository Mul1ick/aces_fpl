import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

type GameweekStatus = 'Live' | 'Calculating' | 'Points Calculated' | 'Finalized';

interface Gameweek {
  id: number;
  name: string;
  deadline_time: string;
  status: GameweekStatus;
}

interface GameweekInfoCardProps {
  gameweek: Gameweek;
}

export function GameweekInfoCard({ gameweek }: GameweekInfoCardProps) {
  if (!gameweek) {
  return <p className="text-muted-foreground">No gameweek loaded</p>;
}


  const getStatusVariant = (status: GameweekStatus) => {
    switch (status) {
      case 'Live':
        return 'bg-success/10 text-success border-success/20';
      case 'Finalized':
        return 'bg-muted text-muted-foreground border-border';
      case 'Points Calculated':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'Calculating':
        return 'bg-warning/10 text-warning border-warning/20 animate-pulse';
      default:
        return 'secondary';
    }
  };

  const deadline = new Date(gameweek.deadline_time);
  const isPastDeadline = deadline < new Date();

  return (
    <Card className="admin-card-shadow bg-gradient-to-br from-card to-muted/50">
      <CardContent className="p-6 text-center">
        <h2 className="text-4xl font-bold text-foreground tracking-tight">{gameweek.name}</h2>
        <div className="flex items-center justify-center gap-4 mt-2">
            <Badge variant="outline" className={cn("text-sm", getStatusVariant(gameweek.status))}>
                {gameweek.status}
            </Badge>
        </div>
        <p className="text-muted-foreground mt-4">
          {isPastDeadline ? 'Deadline has passed' : `Deadline in ${formatDistanceToNow(deadline)}`}
        </p>
      </CardContent>
    </Card>
  );
}
