import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UserToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  // We can add props for bulk actions later
}

export function UserToolbar({ searchQuery, onSearchChange }: UserToolbarProps) {
  return (
    <div className="p-4 border-b">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        {/* Bulk actions button can be added here later */}
        {/* <Button>Bulk Actions</Button> */}
      </div>
    </div>
  );
}
