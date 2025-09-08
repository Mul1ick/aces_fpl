import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

interface TeamToolbarProps {
  onAddTeam: () => void;
}

// Ensure the "export" keyword is present here
export function TeamToolbar({ onAddTeam }: TeamToolbarProps) {
  return (
    <div className="flex items-center justify-end p-4 border-b">
      <div>
        <Button onClick={onAddTeam}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Team
        </Button>
      </div>
    </div>
  );
}

