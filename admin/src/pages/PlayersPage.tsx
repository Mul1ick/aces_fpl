import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { PlayerToolbar } from '@/components/players/PlayerToolbar';
import { PlayerTable } from '@/components/players/PlayerTable';
import { PlayerFormModal } from '@/components/players/PlayerFormModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import type { Player, Team, PlayerFormData } from '@/types';

// --- DUMMY DATA ---
const mockTeams: Team[] = [
  { id: 1, name: 'Arsenal', short_name: 'ARS' },
  { id: 2, name: 'Aston Villa', short_name: 'AVL' },
  { id: 3, name: 'Chelsea', short_name: 'CHE' },
  { id: 4, name: 'Everton', short_name: 'EVE' },
  { id: 5, name: 'Liverpool', short_name: 'LIV' },
  { id: 6, name: 'Manchester City', short_name: 'MCI' },
  { id: 7, name: 'Manchester United', short_name: 'MUN' },
  { id: 8, name: 'Newcastle United', short_name: 'NEW' },
  { id: 9, name: 'Tottenham Hotspur', short_name: 'TOT' },
  { id: 10, name: 'West Ham United', short_name: 'WHU' },
];

const getTeam = (id: number) => mockTeams.find(t => t.id === id)!;

const mockPlayers: Player[] = [
  // Goalkeepers
  { id: 1, full_name: 'Alisson Becker', position: 'GK', team: getTeam(5), price: 5.5, status: 'available', total_points: 120, games_played: 38, minutes_played: 3420, goals_scored: 0, assists: 1, clean_sheets: 15, goals_conceded: 40, own_goals: 0, penalties_saved: 2, penalties_missed: 0, yellow_cards: 1, red_cards: 0, saves: 95, bonus_points: 10 },
  { id: 2, full_name: 'Ederson Moraes', position: 'GK', team: getTeam(6), price: 5.5, status: 'available', total_points: 135, games_played: 38, minutes_played: 3420, goals_scored: 0, assists: 0, clean_sheets: 18, goals_conceded: 30, own_goals: 0, penalties_saved: 1, penalties_missed: 0, yellow_cards: 2, red_cards: 0, saves: 80, bonus_points: 12 },

  // Defenders
  { id: 10, full_name: 'Trent Alexander-Arnold', position: 'DEF', team: getTeam(5), price: 7.5, status: 'available', total_points: 180, games_played: 35, minutes_played: 3100, goals_scored: 3, assists: 12, clean_sheets: 14, goals_conceded: 35, own_goals: 0, penalties_saved: 0, penalties_missed: 0, yellow_cards: 5, red_cards: 0, saves: 0, bonus_points: 25 },
  { id: 11, full_name: 'Virgil van Dijk', position: 'DEF', team: getTeam(5), price: 6.5, status: 'injured', total_points: 90, games_played: 20, minutes_played: 1800, goals_scored: 4, assists: 1, clean_sheets: 8, goals_conceded: 18, own_goals: 0, penalties_saved: 0, penalties_missed: 0, yellow_cards: 1, red_cards: 0, saves: 0, bonus_points: 8 },
  { id: 12, full_name: 'Kieran Trippier', position: 'DEF', team: getTeam(8), price: 6.8, status: 'available', total_points: 198, games_played: 38, minutes_played: 3400, goals_scored: 1, assists: 10, clean_sheets: 16, goals_conceded: 33, own_goals: 0, penalties_saved: 0, penalties_missed: 0, yellow_cards: 6, red_cards: 0, saves: 0, bonus_points: 39 },
  { id: 13, full_name: 'Ben Chilwell', position: 'DEF', team: getTeam(3), price: 5.7, status: 'suspended', total_points: 105, games_played: 25, minutes_played: 2200, goals_scored: 2, assists: 4, clean_sheets: 9, goals_conceded: 28, own_goals: 0, penalties_saved: 0, penalties_missed: 0, yellow_cards: 4, red_cards: 1, saves: 0, bonus_points: 15 },

  // Midfielders
  { id: 20, full_name: 'Mohamed Salah', position: 'MID', team: getTeam(5), price: 13.0, status: 'available', total_points: 259, games_played: 38, minutes_played: 3200, goals_scored: 19, assists: 12, clean_sheets: 15, goals_conceded: 38, own_goals: 0, penalties_saved: 0, penalties_missed: 1, yellow_cards: 2, red_cards: 0, saves: 0, bonus_points: 29 },
  { id: 21, full_name: 'Kevin De Bruyne', position: 'MID', team: getTeam(6), price: 10.5, status: 'available', total_points: 166, games_played: 32, minutes_played: 2500, goals_scored: 7, assists: 18, clean_sheets: 12, goals_conceded: 25, own_goals: 0, penalties_saved: 0, penalties_missed: 0, yellow_cards: 3, red_cards: 0, saves: 0, bonus_points: 20 },
  { id: 22, full_name: 'Bruno Fernandes', position: 'MID', team: getTeam(7), price: 8.5, status: 'available', total_points: 184, games_played: 37, minutes_played: 3300, goals_scored: 10, assists: 8, clean_sheets: 13, goals_conceded: 40, own_goals: 0, penalties_saved: 0, penalties_missed: 0, yellow_cards: 8, red_cards: 0, saves: 0, bonus_points: 22 },
  { id: 23, full_name: 'Bukayo Saka', position: 'MID', team: getTeam(1), price: 8.6, status: 'available', total_points: 202, games_played: 38, minutes_played: 3100, goals_scored: 14, assists: 11, clean_sheets: 14, goals_conceded: 42, own_goals: 0, penalties_saved: 0, penalties_missed: 1, yellow_cards: 6, red_cards: 0, saves: 0, bonus_points: 25 },
  { id: 24, full_name: 'Son Heung-min', position: 'MID', team: getTeam(9), price: 9.0, status: 'unavailable', total_points: 170, games_played: 36, minutes_played: 2900, goals_scored: 10, assists: 6, clean_sheets: 10, goals_conceded: 55, own_goals: 0, penalties_saved: 0, penalties_missed: 0, yellow_cards: 2, red_cards: 0, saves: 0, bonus_points: 18 },
  
  // Forwards
  { id: 30, full_name: 'Erling Haaland', position: 'FWD', team: getTeam(6), price: 14.1, status: 'available', total_points: 272, games_played: 35, minutes_played: 2800, goals_scored: 36, assists: 8, clean_sheets: 11, goals_conceded: 28, own_goals: 0, penalties_saved: 0, penalties_missed: 0, yellow_cards: 5, red_cards: 0, saves: 0, bonus_points: 40 },
  { id: 31, full_name: 'Ollie Watkins', position: 'FWD', team: getTeam(2), price: 8.5, status: 'available', total_points: 195, games_played: 37, minutes_played: 3200, goals_scored: 19, assists: 13, clean_sheets: 10, goals_conceded: 45, own_goals: 0, penalties_saved: 0, penalties_missed: 0, yellow_cards: 4, red_cards: 0, saves: 0, bonus_points: 35 },
  { id: 32, full_name: 'Marcus Rashford', position: 'FWD', team: getTeam(7), price: 8.4, status: 'injured', total_points: 158, games_played: 35, minutes_played: 2800, goals_scored: 17, assists: 5, clean_sheets: 12, goals_conceded: 38, own_goals: 0, penalties_saved: 0, penalties_missed: 0, yellow_cards: 3, red_cards: 0, saves: 0, bonus_points: 19 },
];

type SortConfig = {
  key: keyof Player;
  direction: 'ascending' | 'descending';
} | null;

export function PlayersPage() {
  // Data State - Initialized with dummy data
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null);

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

  const { toast } = useToast();

  // Simulate fetching data on component mount
  useEffect(() => {
    setIsLoading(true);
    // Simulate network delay
    setTimeout(() => {
      setAllPlayers(mockPlayers);
      setTeams(mockTeams);
      setIsLoading(false);
    }, 500);
  }, []);

  // Memoized logic for filtering and sorting players
  const filteredAndSortedPlayers = useMemo(() => {
    let sortedPlayers = [...allPlayers];

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
  }, [allPlayers, filters, sortConfig]);

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
  const handleCloseModal = () => { setIsModalOpen(false); setEditingPlayer(null); };
  const handleCloseDeleteDialog = () => { setDeletingPlayer(null); };

  // Simulate form submission
  const handleSubmitForm = (playerData: PlayerFormData, playerId?: number) => {
    const isEditMode = !!playerId;
    setIsLoading(true);
    
    setTimeout(() => {
      if (isEditMode) {
        setAllPlayers(prev => prev.map(p => p.id === playerId ? { ...p, ...playerData, team: teams.find(t => t.id === playerData.team_id)! } : p));
        toast({ title: "Success", description: "Player updated successfully." });
      } else {
        const newPlayer: Player = {
          id: Date.now(), // Simple unique ID for dummy data
          ...playerData,
          team: teams.find(t => t.id === playerData.team_id)!,
          // Add empty stats for consistency
          total_points: 0, games_played: 0, minutes_played: 0, goals_scored: 0, assists: 0,
          clean_sheets: 0, goals_conceded: 0, own_goals: 0, penalties_saved: 0,
          penalties_missed: 0, yellow_cards: 0, red_cards: 0, saves: 0, bonus_points: 0
        };
        setAllPlayers(prev => [newPlayer, ...prev]);
        toast({ title: "Success", description: "Player created successfully." });
      }
      setIsLoading(false);
      handleCloseModal();
    }, 500);
  };

  // Simulate deletion
  const handleConfirmDelete = () => {
    if (!deletingPlayer) return;
    setIsLoading(true);
    setTimeout(() => {
      setAllPlayers(prev => prev.filter(p => p.id !== deletingPlayer.id));
      toast({ title: "Success", description: "Player deleted successfully." });
      setIsLoading(false);
      handleCloseDeleteDialog();
    }, 500);
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

