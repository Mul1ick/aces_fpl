import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardAPI } from '@/lib/api';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import type { DashboardStats } from '@/types';
import { Users, UserCheck, Database, Calendar } from 'lucide-react';

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!token) return;

      try {
        setIsLoading(true);
        const data = await dashboardAPI.getStats(token);
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load dashboard data. Using sample data for demo.",
        });
        
        // Fallback sample data for demo
        setStats({
          pending_users: 12,
          total_users: 1247,
          total_players: 650,
          current_gameweek: {
            id: 'gw1',
            name: 'Gameweek 1',
            deadline_time: '2024-08-16T11:30:00Z',
            is_current: true,
            is_next: false,
            finished: false,
            data_checked: false,
          },
          recent_activities: [
            {
              id: '1',
              type: 'user_registered',
              description: 'New user John Smith registered',
              timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            },
            {
              id: '2',
              type: 'user_approved',
              description: 'Approved 5 pending users',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            },
            {
              id: '3',
              type: 'stats_entered',
              description: 'Stats entered for Manchester United vs Liverpool',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
            },
          ],
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, [token, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your FPL platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Pending Users"
          value={stats.pending_users}
          description="Awaiting approval"
          icon={UserCheck}
          onClick={() => navigate('/users/pending')}
          className={stats.pending_users > 0 ? 'border-warning/50 bg-warning/5' : ''}
        />
        <StatsCard
          title="Total Users"
          value={stats.total_users.toLocaleString()}
          description="Registered users"
          icon={Users}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatsCard
          title="Players"
          value={stats.total_players}
          description="In database"
          icon={Database}
          onClick={() => navigate('/data/players')}
        />
        <StatsCard
          title="Current Gameweek"
          value={stats.current_gameweek?.name || 'N/A'}
          description={stats.current_gameweek?.finished ? 'Finished' : 'In progress'}
          icon={Calendar}
          onClick={() => navigate('/gameweek')}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <QuickActions />
        <RecentActivity activities={stats.recent_activities} />
      </div>

      {/* Current Gameweek Status */}
      {stats.current_gameweek && (
        <div className="bg-card border rounded-lg p-6 admin-card-shadow">
          <h3 className="text-lg font-semibold mb-4">
            {stats.current_gameweek.name} Status
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {stats.current_gameweek.finished ? '✅' : '⏳'}
              </div>
              <p className="text-sm text-muted-foreground">
                {stats.current_gameweek.finished ? 'Completed' : 'In Progress'}
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {stats.current_gameweek.data_checked ? '✅' : '❌'}
              </div>
              <p className="text-sm text-muted-foreground">
                Data Verified
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">📊</div>
              <p className="text-sm text-muted-foreground">
                Ready for Next
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}