import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Database, Calendar, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  // Using specific gradient sets for a polished look
  gradient: string; 
  shadowColor: string;
  textColor: string; // For description text to ensure contrast
  urgent?: boolean;
}

const quickActions: QuickAction[] = [
  {
    title: 'Review Pending',
    description: 'Approve new user registrations',
    icon: UserCheck,
    href: '/users/pending',
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-500',
    shadowColor: 'shadow-blue-500/20',
    textColor: 'text-blue-50',
    urgent: true,
  },
  {
    title: 'Manage Players',
    description: 'Edit database & player stats',
    icon: Database,
    href: '/data/players',
    gradient: 'bg-gradient-to-br from-purple-500 to-purple-600 border-purple-500',
    shadowColor: 'shadow-purple-500/20',
    textColor: 'text-purple-50',
  },
  {
    title: 'User Manager',
    description: 'View & manage accounts',
    icon: Users,
    href: '/users',
    gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-500',
    shadowColor: 'shadow-emerald-500/20',
    textColor: 'text-emerald-50',
  },
  {
    title: 'Gameweek Control',
    description: 'Deadlines & live status',
    icon: Calendar,
    href: '/gameweek',
    gradient: 'bg-gradient-to-br from-orange-500 to-orange-600 border-orange-500',
    shadowColor: 'shadow-orange-500/20',
    textColor: 'text-orange-50',
  },
];

export function QuickActions() {
  return (
    <Card className="admin-card-shadow h-full border-none bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-gray-900 tracking-tight">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link 
                key={action.title} 
                to={action.href}
                className={cn(
                  "group relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300",
                  "hover:-translate-y-1 hover:shadow-lg",
                  action.gradient,
                  action.shadowColor
                )}
              >
                {/* Header: Icon & Arrow */}
                <div className="flex items-start justify-between mb-6">
                  <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm border border-white/10 shadow-inner">
                    <Icon className="h-6 w-6 text-white" strokeWidth={2.5} />
                  </div>
                  
                  {/* Action Indicator */}
                  <div className="relative">
                    {/* {action.urgent && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-blue-500"></span>
                      </span>
                    )} */}
                    <ArrowUpRight className="h-5 w-5 text-white/70 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                  </div>
                </div>

                {/* Footer: Text */}
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight leading-none mb-1.5">
                    {action.title}
                  </h3>
                  <p className={cn("text-sm font-medium leading-snug opacity-90", action.textColor)}>
                    {action.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}