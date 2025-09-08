import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { UserToolbar } from '@/components/users/UserToolbar';
import { UserTable } from '@/components/users/UserTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { User, PaginatedResponse } from '@/types';

type ViewMode = 'pending' | 'all' | 'admins';

export function UsersPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  });
  const getAdminToken = () => token || localStorage.getItem("admin_token");
  const { token } = useAuth();
  const { toast } = useToast();

  // Determine view mode from URL path
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/pending')) setViewMode('pending');
    else if (path.includes('/admins')) setViewMode('admins');
    else setViewMode('all');
  }, [location.pathname]);

  // --- UPDATED --- This function now handles the "all" case correctly
  const handleTabChange = (value: string) => {
    const path = value === 'all' ? '/users' : `/users/${value}`;
    navigate(path);
  };

  const fetchUsers = useCallback(async () => {
    const t = token || localStorage.getItem("admin_token");
if (!t) {
  console.warn("[UsersPage] No admin token found — not fetching");
  return;
}

    try {
      setIsLoading(true);
      setError(null);
      setSelectedUserIds(new Set()); 

      let response;
      const roleFilter = viewMode === 'admins' ? 'admin' : undefined;

      if (viewMode === 'pending') {
        response = await userAPI.getPendingUsers(t);
        setUsers(response);
        setPagination({ currentPage: 1, totalPages: 1 });
      } else {
        response = await userAPI.getAllUsers(t, pagination.currentPage, searchQuery, roleFilter);
        setUsers(response.items);
        setPagination({
          currentPage: response.page,
          totalPages: response.pages,
        });
      }

    } catch (err) {
      console.error(`Failed to fetch ${viewMode} users:`, err);
      setError("Failed to load user data. Please try again.");
      toast({
        variant: "destructive",
        title: "Error",
        description: `Could not fetch ${viewMode} users.`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [token, toast, viewMode, pagination.currentPage, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // --- Action Handlers ---

  const handleApproveUser = async (userId: string) => {
  const t = getAdminToken();
  if (!t) return;
  try {
    await userAPI.approveUser(userId, t);
    toast({ title: "Success", description: "User has been approved." });
    fetchUsers();
  } catch (error) {
    toast({ variant: "destructive", title: "Error", description: "Failed to approve user." });
  }
};
  
  const handleUpdateRole = async (userId: string, role: 'admin' | 'user') => {
    const t = getAdminToken();
     if (!t) return;
    try {
        await userAPI.updateUserRole(userId, { role }, t);
        toast({ title: "Success", description: "User role has been updated." });
        fetchUsers();
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to update user role." });
    }
  };
  
  const handleBulkApprove = async () => {
    const t = getAdminToken();
    if (!t || selectedUserIds.size === 0) return;
    try {
        await userAPI.bulkApproveUsers(Array.from(selectedUserIds), t);
        toast({ title: "Success", description: `${selectedUserIds.size} users have been approved.` });
        fetchUsers();
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to approve users." });
    }
  };

  // --- Selection and Pagination Handlers ---
  
  const handleUserSelect = (userId: string) => {
    setSelectedUserIds(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(userId)) {
        newSelection.delete(userId);
      } else {
        newSelection.add(userId);
      }
      return newSelection;
    });
  };

  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedUserIds(new Set(users.map(u => u.id)));
    } else {
      setSelectedUserIds(new Set());
    }
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= pagination.totalPages) {
      setPagination(p => ({ ...p, currentPage: page }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">User Management</h1>
        <p className="text-muted-foreground">
          Approve, manage, and monitor all users in the league.
        </p>
      </div>

      <Tabs value={viewMode} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
        </TabsList>
        
        <TabsContent value={viewMode} className="mt-4">
          <div className="bg-card border rounded-lg admin-card-shadow">
            <UserToolbar 
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onBulkApprove={handleBulkApprove}
              selectedCount={selectedUserIds.size}
              isPendingView={viewMode === 'pending'}
            />
            
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-destructive">
                <p>{error}</p>
              </div>
            ) : (
              <UserTable 
                users={users}
                selectedUserIds={selectedUserIds}
                onUserSelect={handleUserSelect}
                onSelectAll={handleSelectAll}
                onApprove={handleApproveUser}
                onUpdateRole={handleUpdateRole}
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                viewMode={viewMode}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

