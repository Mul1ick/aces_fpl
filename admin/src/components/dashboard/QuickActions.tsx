import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, Database, Calendar } from 'lucide-react';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  variant: 'default' | 'secondary' | 'outline';
  urgent?: boolean;
}

const quickActions: QuickAction[] = [
  {
    title: 'Review Pending Users',
    description: 'Approve new user registrations',
    icon: UserCheck,
    href: '/users/pending',
    variant: 'default',
    urgent: true,
  },
  {
    title: 'Manage Players',
    description: 'Add, edit, or remove players',
    icon: Database,
    href: '/data/players',
    variant: 'secondary',
  },
  {
    title: 'User Management',
    description: 'View and manage all users',
    icon: Users,
    href: '/users',
    variant: 'outline',
  },
  {
    title: 'Gameweek Control',
    description: 'Manage current gameweek',
    icon: Calendar,
    href: '/gameweek',
    variant: 'outline',
  },
];

export function QuickActions() {
  return (
    <Card className="admin-card-shadow">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.title} to={action.href}>
              <Button
                variant={action.variant}
                className={`w-full justify-start h-auto p-4 ${
                  action.urgent ? 'admin-primary-shadow border-primary/30' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {action.description}
                    </div>
                  </div>
                </div>
              </Button>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}