import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Activity } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface RecentActivityProps {
  activities: Activity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'user_registered':
        return '👤';
      case 'user_approved':
        return '✅';
      case 'gameweek_finalized':
        return '⚽';
      case 'stats_entered':
        return '📊';
      default:
        return '📋';
    }
  };

  const getActivityBadgeVariant = (type: Activity['type']) => {
    switch (type) {
      case 'user_registered':
        return 'secondary';
      case 'user_approved':
        return 'default';
      case 'gameweek_finalized':
        return 'outline';
      case 'stats_entered':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatActivityType = (type: Activity['type']) => {
    switch (type) {
      case 'user_registered':
        return 'Registration';
      case 'user_approved':
        return 'Approved';
      case 'gameweek_finalized':
        return 'Gameweek';
      case 'stats_entered':
        return 'Stats';
      default:
        return 'Activity';
    }
  };

  return (
    <Card className="admin-card-shadow">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getActivityIcon(activity.type)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge 
                    variant={getActivityBadgeVariant(activity.type)}
                    className="text-xs"
                  >
                    {formatActivityType(activity.type)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-foreground">{activity.description}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}