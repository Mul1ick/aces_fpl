import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Hourglass, CheckCircle, Calculator, Lock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

type GameweekStatus = 'Live' | 'Calculating' | 'Points Calculated' | 'Finalized';

interface GameweekStatusCardProps {
  gameweek: {
    name: string;
    deadline_time: string;
    status: GameweekStatus;
  };
  allStatsEntered: boolean;
  onCalculate: () => void;
  onFinalize: () => void;
}

const statusConfig = {
  Live: { text: 'Live', color: 'bg-success/10 text-success border-success/20', icon: Hourglass },
  Calculating: { text: 'Calculating...', color: 'bg-warning/10 text-warning border-warning/20', icon: Calculator },
  'Points Calculated': { text: 'Ready to Finalize', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: CheckCircle },
  Finalized: { text: 'Finalized', color: 'bg-muted text-muted-foreground border-border', icon: Lock },
};

export function GameweekStatusCard({
  gameweek,
  allStatsEntered,
  onCalculate,
  onFinalize,
}: GameweekStatusCardProps) {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const deadline = new Date(gameweek.deadline_time);
    const updateCountdown = () => {
      if (deadline > new Date()) {
        setCountdown(formatDistanceToNow(deadline, { addSuffix: true }));
      } else {
        setCountdown('Deadline has passed');
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [gameweek.deadline_time]);

  const config = statusConfig[gameweek.status];
  const Icon = config.icon;

  return (
    <Card className="admin-card-shadow">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{gameweek.name}</CardTitle>
        <div className="text-sm text-muted-foreground pt-1">
          Deadline: {countdown}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
            <Badge variant="outline" className={cn('text-sm py-1 px-3', config.color)}>
                <Icon className="h-4 w-4 mr-2" />
                {config.text}
            </Badge>
        </div>

        <div className="border-t pt-4">
            {gameweek.status === 'Live' && (
                <Button 
                    className="w-full"
                    disabled={!allStatsEntered}
                    onClick={onCalculate}
                    title={!allStatsEntered ? 'Enter all match stats to enable calculation' : 'Calculate points for this gameweek'}
                >
                    <Calculator className="mr-2 h-4 w-4" />
                    Calculate All Points
                </Button>
            )}

            {gameweek.status === 'Calculating' && (
                 <Button className="w-full" disabled>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Processing Points...
                </Button>
            )}

            {gameweek.status === 'Points Calculated' && (
                 <Button 
                    className="w-full bg-success hover:bg-success/90"
                    onClick={onFinalize}
                >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Finalize Gameweek
                </Button>
            )}

            {gameweek.status === 'Finalized' && (
                <p className="text-center text-sm text-muted-foreground">This gameweek is complete.</p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
