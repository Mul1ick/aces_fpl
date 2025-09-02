import React from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { User } from '@/types';
import { format, isValid } from 'date-fns';
import { MoreHorizontal, Shield, UserX } from 'lucide-react';

interface UserTableProps {
  users: User[];
  selectedUserIds: Set<string>;
  onUserSelect: (userId: string) => void;
  onSelectAll: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onApprove: (userId: string) => void;
  onUpdateRole: (userId: string, role: 'admin' | 'user') => void;
  // Pagination Props
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function UserTable({
  users,
  selectedUserIds,
  onUserSelect,
  onSelectAll,
  onApprove,
  onUpdateRole,
  currentPage,
  totalPages,
  onPageChange,
}: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>No users found matching your criteria.</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isValid(date) ? format(date, 'dd MMM yyyy') : 'N/A';
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); onPageChange(currentPage - 1); }} 
                        aria-disabled={currentPage <= 1}
                        className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                </PaginationItem>
                <PaginationItem>
                  <span className="p-2 text-sm">Page {currentPage} of {totalPages}</span>
                </PaginationItem>
                <PaginationItem>
                    <PaginationNext 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); onPageChange(currentPage + 1); }} 
                        aria-disabled={currentPage >= totalPages}
                        className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
  };

  return (
    <>
      <Table>
        <TableCaption>A list of all registered users in the league.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                aria-label="Select all rows"
                onChange={onSelectAll}
                checked={users.length > 0 && selectedUserIds.size === users.length}
              />
            </TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[120px]">Role</TableHead>
            <TableHead>User Details</TableHead>
            <TableHead>Date Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} data-state={selectedUserIds.has(user.id) ? 'selected' : ''}>
              <TableCell>
                <Checkbox
                  aria-label={`Select row for ${user.email}`}
                  checked={selectedUserIds.has(user.id)}
                  onCheckedChange={() => onUserSelect(user.id)}
                />
              </TableCell>
              <TableCell>
                <StatusBadge status={user.is_active ? 'active' : 'pending'} />
              </TableCell>
               <TableCell>
                <StatusBadge status={user.role} />
              </TableCell>
              <TableCell>
                <div className="font-medium text-foreground">{user.full_name || 'N/A'}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </TableCell>
              <TableCell>{formatDate(user.created_at)}</TableCell>
              <TableCell className="text-right">
                {!user.is_active ? (
                  <Button variant="default" size="sm" onClick={() => onApprove(user.id)}>
                    Approve
                  </Button>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onUpdateRole(user.id, user.role === 'admin' ? 'user' : 'admin')}>
                        <Shield className="mr-2 h-4 w-4" />
                        <span>{user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <UserX className="mr-2 h-4 w-4" />
                        <span>Ban User</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="p-4 border-t">
        {renderPagination()}
      </div>
    </>
  );
}

