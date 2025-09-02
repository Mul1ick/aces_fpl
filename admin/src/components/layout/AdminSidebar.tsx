import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Shield, 
  Calendar,
  Database,
  Trophy,
  Settings
} from 'lucide-react';

const navigationItems = [
  {
    title: 'Overview',
    items: [
      { title: 'Dashboard', url: '/', icon: LayoutDashboard },
    ],
  },
  {
    title: 'User Management',
    items: [
      { title: 'All Users', url: '/users', icon: Users },
      { title: 'Pending Approval', url: '/users/pending', icon: UserCheck },
      { title: 'Admin Users', url: '/users/admins', icon: Shield },
    ],
  },
  {
    title: 'Data Management',
    items: [
      { title: 'Players', url: '/data/players', icon: Database },
      { title: 'Teams', url: '/data/teams', icon: Trophy },
    ],
  },
  {
    title: 'Game Control',
    items: [
      { title: 'Gameweek Manager', url: '/gameweek', icon: Calendar },
      { title: 'System Settings', url: '/settings', icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar className={collapsed ? 'w-16' : 'w-64'} collapsible="icon">
      <SidebarContent className="bg-sidebar">
        {navigationItems.map((section) => (
          <SidebarGroup key={section.title}>
            {!collapsed && (
              <SidebarGroupLabel className="text-sidebar-foreground/70 text-xs font-semibold uppercase tracking-wider px-3 py-2">
                {section.title}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground">
                      <NavLink 
                        to={item.url} 
                        className={({ isActive: linkActive }) => 
                          `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors admin-transition ${
                            isActive(item.url) || linkActive
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
                              : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                          }`
                        }
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!collapsed && <span className="truncate">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}