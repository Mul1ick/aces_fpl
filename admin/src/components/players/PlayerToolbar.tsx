import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Team } from '@/types';

interface PlayerToolbarProps {
  filters: {
    search: string;
    teamId: string;
    position: string;
    status: string;
  };
  onFiltersChange: React.Dispatch<React.SetStateAction<{
    search: string;
    teamId: string;
    position: string;
    status: string;
  }>>;
  teams: Team[];
  onAddPlayer: () => void;
}

export function PlayerToolbar({ filters, onFiltersChange, teams, onAddPlayer }: PlayerToolbarProps) {
  
  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    onFiltersChange(prev => ({ ...prev, [filterName]: value }));
  };

  return (
    <div className="p-4 border-b">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search players by name..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters and Action Button */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {/* Team Filter */}
          <Select value={filters.teamId} onValueChange={(value) => handleFilterChange('teamId', value)}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map(team => (
                <SelectItem key={team.id} value={String(team.id)}>{team.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Position Filter */}
          <Select value={filters.position} onValueChange={(value) => handleFilterChange('position', value)}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="All Positions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Positions</SelectItem>
              <SelectItem value="GK">Goalkeepers</SelectItem>
              <SelectItem value="DEF">Defenders</SelectItem>
              <SelectItem value="MID">Midfielders</SelectItem>
              <SelectItem value="FWD">Forwards</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Status Filter */}
          <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="injured">Injured</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="unavailable">Unavailable</SelectItem>
            </SelectContent>
          </Select>

          {/* Add Player Button */}
          <Button onClick={onAddPlayer} className="w-full sm:w-auto flex-shrink-0">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Player
          </Button>
        </div>
      </div>
    </div>
  );
}
