import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getChipStatus, playChip, type ChipName, type ChipStatus } from '@/lib/api';
import { useToast } from '@/hooks/use-toast'; 

export const useChipStatus = (gameweekId?: number) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Safe retrieval of token
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  // 1. Fetch Current Chip Status
  const { data: status, isLoading, error } = useQuery({
    queryKey: ['chip-status', gameweekId], // Unique key per gameweek
    queryFn: async () => {
      if (!token) return { active: null, used: [] };
      return await getChipStatus(token, gameweekId);
    },
    enabled: !!token, // Only fetch if logged in
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 1,
  });

  // 2. Mutation to Play a Chip
  const { mutate: activateChip, isPending: isActivating } = useMutation({
    mutationFn: async (chipId: ChipName) => {
      if (!token) throw new Error("You must be logged in to play a chip.");
      return await playChip(token, chipId, gameweekId);
    },
    onSuccess: (_, chipId) => {
      // A. Update the 'chip-status' cache immediately
      queryClient.invalidateQueries({ queryKey: ['chip-status'] });

      // B. Refresh Transfer Data (so cost becomes 0)
      queryClient.invalidateQueries({ queryKey: ['transfer-data'] }); 
      
      // C. Refresh Team Data (so the Pick Team UI updates)
      queryClient.invalidateQueries({ queryKey: ['team-data'] });

      toast({
        title: "Chip Activated!",
        description: `${chipId.replace('_', ' ')} is now active.`,
        variant: "default",
        className: "bg-green-600 text-white border-none"
      });
    },
    onError: (err: any) => {
      toast({
        title: "Activation Failed",
        description: err.message || err.response?.data?.detail || "Could not activate chip.",
        variant: "destructive",
      });
    }
  });

  return {
    activeChip: (status as ChipStatus)?.active ?? null,
    usedChips: (status as ChipStatus)?.used ?? [],
    isLoading,
    activateChip,
    isActivating,
    error
  };
};