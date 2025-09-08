import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { User } from '@/types';

interface UserActionsProps {
  user: User;
  onApprove: (userId: string) => void;
  // Add more handlers like onBan, onUpdateRole as we build them
}

export function UserActions({ user, onApprove }: UserActionsProps) {
  return (
    <div className="text-right">
      {!user.is_active && (
        <Button 
          variant="default" 
          size="sm" 
          onClick={() => onApprove(user.id)}
          className="bg-success text-success-foreground hover:bg-success/90"
        >
          Approve
        </Button>
      )}
      {/* We can add a dropdown for more actions on active users later */}
      {/* <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>View Details</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">Ban User</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      */}
    </div>
  );
}
