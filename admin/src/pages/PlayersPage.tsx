import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { PlayerToolbar } from '@/components/players/PlayerToolbar';
import { PlayerTable } from '@/components/players/PlayerTable';
import { PlayerFormModal } from '@/components/players/PlayerFormModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import type { Player, Team, PlayerFormData } from '@/types';
import { teamAPI, playerAPI } from '@/lib/api';
import { PlayerStatusModal } from '@/components/players/PlayerStatusModal';
import { useAuth } from '@/contexts/AuthContext';

// --- DUMMY DATA ---




type SortConfig = {
  key: keyof Player;
  direction: 'ascending' | 'descending';
} | null;

export function PlayersPage() {

  const authToken = localStorage.getItem("admin_token");
  const { token } = useAuth();
const { toast } = useToast();

  // Data State - Initialized with dummy data
  const [teams, setTeams] = useState<Team[]>([]);
const [players, setPlayers] = useState<Player[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string|null>(null);

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null);

  // --- ADDED: State for Status Modal ---
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusEditingPlayer, setStatusEditingPlayer] = useState<Player | null>(null);

  // Filtering, Sorting, and Pagination State
  const [filters, setFilters] = useState({
    search: '',
    teamId: 'all',
    position: 'all',
    status: 'all',
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'full_name', direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const playersPerPage = 15;


  const loadTeams = useCallback(async () => {
  if (!authToken) { setError("Not authenticated"); setIsLoading(false); return; }
  try {
    setError(null);
    const res = await teamAPI.getTeams(authToken);
    setTeams(res);
  } catch (e:any) { setError(e.message || "Failed to load teams"); }
}, [authToken]);

  

const loadPlayers = useCallback(async () => {
  if (!authToken) { setError("Not authenticated"); setIsLoading(false); return; }
  try {
    setIsLoading(true);
    setError(null);
    const teamParam = filters.teamId !== 'all' ? String(filters.teamId) : '';
    const posParam  = filters.position !== 'all' ? filters.position : '';
    const statusParam = filters.status !== 'all' ? filters.status : '';
    const res = await playerAPI.getPlayers(authToken, filters.search || '', teamParam, posParam);
    setPlayers(res);
  } catch (e:any) { setError(e.message || "Failed to load players"); }
  finally { setIsLoading(false); }
}, [authToken, filters]);


  // Simulate fetching data on component mount
  useEffect(() => { loadTeams(); }, [loadTeams]);
useEffect(() => { loadPlayers(); }, [loadPlayers]);

  // Memoized logic for filtering and sorting players
  const filteredAndSortedPlayers = useMemo(() => {
    let sortedPlayers = [...players];

    // Filtering logic
    sortedPlayers = sortedPlayers.filter(player => {
      const searchLower = filters.search.toLowerCase();
      return (
        (player.full_name.toLowerCase().includes(searchLower) || player.team.name.toLowerCase().includes(searchLower)) &&
        (filters.teamId === 'all' || player.team.id === parseInt(filters.teamId)) &&
        (filters.position === 'all' || player.position === filters.position) &&
        (filters.status === 'all' || player.status === filters.status)
      );
    });

    // Sorting logic
    if (sortConfig !== null) {
      sortedPlayers.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return sortedPlayers;
  }, [players, filters, sortConfig]);

  // Memoized logic for pagination
  const { paginatedPlayers, totalPages } = useMemo(() => {
    const startIndex = (currentPage - 1) * playersPerPage;
    const endIndex = startIndex + playersPerPage;
    return {
      paginatedPlayers: filteredAndSortedPlayers.slice(startIndex, endIndex),
      totalPages: Math.ceil(filteredAndSortedPlayers.length / playersPerPage),
    };
  }, [filteredAndSortedPlayers, currentPage]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // --- Handlers ---
  const handleSortRequest = (key: keyof Player) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const handleOpenAddModal = () => { setEditingPlayer(null); setIsModalOpen(true); };
  const handleOpenEditModal = (player: Player) => { setEditingPlayer(player); setIsModalOpen(true); };
  const handleOpenDeleteDialog = (player: Player) => { setDeletingPlayer(player); };
  // --- ADDED: Handler for opening the Status Modal ---
  const handleOpenStatusModal = (player: Player) => {
    setStatusEditingPlayer(player);
    setIsStatusModalOpen(true);
  };
  const handleCloseModal = () => { setIsModalOpen(false); setEditingPlayer(null); };
  const handleCloseDeleteDialog = () => { setDeletingPlayer(null); };
  const handleCloseStatusModal = () => {
    setIsStatusModalOpen(false);
    setStatusEditingPlayer(null);
  };

  const handleSubmitStatusForm = async (playerId: number, data: any) => {
    if (!authToken) return;
    try {
      setIsLoading(true);
      await playerAPI.updatePlayer(String(playerId), data, authToken);
      toast({ title: 'Availability updated successfully' });
      await loadPlayers();
      handleCloseStatusModal();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Update failed', description: e.message });
    } finally {
      setIsLoading(false);
    }
  };
  

  // Simulate form submission
  const POSITION_MAP: Record<string, string> = {
  Goalkeeper: 'GK',
  Defender: 'DEF',
  Midfielder: 'MID',
  Forward: 'FWD',
};

const STATUS_MAP: Record<string, string> = {
  Available: 'ACTIVE',
  Injured: 'INJURED',
  Suspended: 'SUSPENDED',
};

const handleSubmitForm = async (data: PlayerFormData, playerId?: number) => {
  const adminToken = localStorage.getItem("admin_token");
  if (!adminToken) { toast({ variant: 'destructive', title: 'Not authenticated' }); return; }

  const payload: any = {
    full_name: data.full_name,
    position: POSITION_MAP[data.position as any] ?? data.position,   // map UI -> enum
    team_id: Number(data.team_id),
    status: STATUS_MAP[data.status as any] ?? data.status,           // map UI -> enum
  };
  // price only when creating (you show it disabled on edit)
  if (!playerId && data.price != null) payload.price = Number(data.price);

  try {
    setIsLoading(true);
    if (playerId) {
      await playerAPI.updatePlayer(String(playerId), payload, adminToken);
      toast({ title: 'Player updated' });
    } else {
      await playerAPI.createPlayer(payload, adminToken);
      toast({ title: 'Player created' });
    }
    await loadPlayers();
    setIsModalOpen(false);
    setEditingPlayer(null);
  } catch (e:any) {
    toast({ variant: 'destructive', title: 'Save failed', description: e.message || 'Error' });
  } finally {
    setIsLoading(false);
  }
};

  // Simulate deletion
const handleConfirmDelete = async () => {
  const adminToken = localStorage.getItem("admin_token");
  if (!deletingPlayer || !adminToken) {
    toast({ variant: 'destructive', title: 'Not authenticated' });
    return;
  }
  try {
    setIsLoading(true);
    await playerAPI.deletePlayer(String(deletingPlayer.id), adminToken);
    toast({ title: 'Player deleted' });
    await loadPlayers();
    setDeletingPlayer(null);
  } catch (e:any) {
    toast({ variant: 'destructive', title: 'Delete failed', description: e.message || 'Error' });
  } finally {
    setIsLoading(false);
  }
};



  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Player Management</h1>
        <p className="text-muted-foreground">Add, edit, and manage all players in the FPL database.</p>
      </div>

      <div className="bg-card border rounded-lg admin-card-shadow">
        <PlayerToolbar 
          filters={filters} 
          onFiltersChange={setFilters} 
          teams={teams}
          onAddPlayer={handleOpenAddModal} 
        />
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>
        ) : error ? (
          <div className="text-center py-12 text-destructive"><p>{error}</p></div>
        ) : (
          <>
            <PlayerTable 
              players={paginatedPlayers} 
              onUpdateStatus={handleOpenStatusModal} 
              onEdit={handleOpenEditModal} 
              onDelete={handleOpenDeleteDialog}
              sortConfig={sortConfig}
              onSortRequest={handleSortRequest}
            />
             {totalPages > 1 && (
              <div className="p-4 border-t">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)); }} aria-disabled={currentPage === 1} /></PaginationItem>
                    <PaginationItem><PaginationLink href="#">Page {currentPage} of {totalPages}</PaginationLink></PaginationItem>
                    <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(totalPages, p + 1)); }} aria-disabled={currentPage === totalPages} /></PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>

      <PlayerFormModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitForm}
        teams={teams}
        editingPlayer={editingPlayer}
      />

      <PlayerStatusModal
        isOpen={isStatusModalOpen}
        onClose={handleCloseStatusModal}
        onSubmit={handleSubmitStatusForm}
        player={statusEditingPlayer}
      />
      
      <ConfirmDialog
        open={!!deletingPlayer}
        onOpenChange={(isOpen) => !isOpen && handleCloseDeleteDialog()}
        title="Are you sure?"
        description={`This will permanently delete ${deletingPlayer?.full_name}. This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        variant="destructive"
        confirmText="Delete"
      />
    </div>
  );
}

