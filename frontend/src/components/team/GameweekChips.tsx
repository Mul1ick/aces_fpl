import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getChipStatus, playChip, type ChipStatus, type ChipName } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const chips = [
  { id: 'WILDCARD' as const, name: 'Wildcard', icon: RefreshCw, description: 'Unlimited free transfers for this Gameweek. Once activated, this chip cannot be cancelled. Available once per season.' },
  { id: 'TRIPLE_CAPTAIN' as const, name: 'Triple Captain', icon: Zap, description: 'Captain scores are tripled this Gameweek. Once activated, this chip cannot be cancelled. Available once per season.' },
];
type ChipItem = typeof chips[number];

export const GameweekChips: React.FC<{ token: string; gw?: number }> = ({ token, gw }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [status, setStatus] = useState<ChipStatus>({ active: null, used: [] });
  const [selectedChip, setSelectedChip] = useState<ChipItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  const refresh = async () => {
    try { setStatus(await getChipStatus(token, gw)); }
    catch (e:any) { toast({ variant: 'destructive', title: 'Chip status failed', description: e.message }); }
  };
  
  useEffect(() => { if (token) refresh(); }, [token, gw]);

  const handleChipClick = (chip: ChipItem) => {
    setSelectedChip(chip);
  };

  const executePlayChip = async () => {
    if (!selectedChip) return;
    setLoading(true);
    setIsConfirmOpen(false);
    try {
      await playChip(token, selectedChip.id as ChipName, gw);
      await refresh();
      setSelectedChip(null);
      toast({ title: `${selectedChip.name} activated` });
    } catch (e:any) {
      toast({ variant: 'destructive', title: `Could not play ${selectedChip.name}`, description: e.message });
    } finally { 
      setLoading(false); 
    }
  };
  
  return (
    <>
      <Card className="bg-gradient-to-br from-[#37003C] to-[#23003F] border-purple-800/50">
        <CardContent className="p-4">
          <div className="flex justify-around items-center text-center">
            {chips.map(chip => {
              const isActive = status.active === chip.id;
              const isUsed = status.used.includes(chip.id as ChipName);
              
              const isWildcard = chip.id === 'WILDCARD';
              const hasUnlimitedTransfers = user?.played_first_gameweek === false;
              
              // Calculate disabled state logically
              const isDisabled = loading || 
                                 (!isActive && (status.active !== null || isUsed)) ||
                                 (isWildcard && hasUnlimitedTransfers);

              let tooltipText = "";
              if (isUsed && !isActive) {
                tooltipText = "Already used";
              } else if (isWildcard && hasUnlimitedTransfers) {
                tooltipText = "Wildcard unavailable: You already have unlimited free transfers this week";
              } else if (status.active && !isActive) {
                tooltipText = "Another chip is active";
              }

              return (
                <div key={chip.id} className="flex flex-col items-center space-y-2 h-[110px] justify-start">
                  <div
                    // We use a div wrapper or remove 'disabled' attribute to ensure title tooltip works
                    className="group relative"
                    title={tooltipText} 
                  >
                    <button
                      onClick={() => {
                        // Manually enforce disabled state
                        if (!isDisabled && !isActive) {
                          handleChipClick(chip);
                        }
                      }}
                      // REMOVED: disabled={isDisabled || isActive} 
                      // REASON: HTML 'disabled' suppresses tooltips in many browsers.
                      className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all",
                        isActive 
                          ? "bg-dashboard-gradient border-transparent text-white shadow-[0_0_15px_rgba(37,99,235,0.6)]" 
                          : "bg-black/20 border-transparent text-white",
                        isDisabled && !isActive
                          ? "opacity-30 cursor-not-allowed" // Visual disabled state
                          : "hover:bg-white/5 cursor-pointer"
                      )}
                    >
                      <chip.icon className="size-8" />
                    </button>
                  </div>

                  <p className="text-xs font-semibold text-white">
                    {chip.name}{isUsed && !isActive ? " (used)" : ""}
                  </p>
                  
                  {isActive && (
                    <div className="mt-1 w-full px-3 py-1 rounded-full bg-gradient-to-r from-accent-teal to-accent-blue opacity-90 cursor-default shadow-md">
                      <p className="text-xs font-bold text-black uppercase tracking-wide">Active</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Chip Detail Modal */}
      <AnimatePresence>
        {selectedChip && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedChip(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-lg shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="text-center">
                   <div className="w-16 h-16 bg-gradient-to-br from-[#37003C] to-[#23003F] rounded-full flex items-center justify-center mx-auto mb-4">
                        <selectedChip.icon className="size-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-black">{selectedChip.name}</h3>
                </div>
                <p className="text-sm text-gray-600 my-4 text-center">{selectedChip.description}</p>
                
                <Button 
                  className="w-full mt-6" 
                  onClick={() => setIsConfirmOpen(true)} 
                  disabled={loading}
                >
                  Play Chip
                </Button>
              </div>
              <button onClick={() => setSelectedChip(null)} className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="max-w-[90%] sm:max-w-lg rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Activate {selectedChip?.name}?</AlertDialogTitle>
            <AlertDialogDescription className="text-red-600 font-medium">
              Warning: Once activated, this chip cannot be cancelled. 
              {selectedChip?.id === 'WILDCARD' 
                ? " You will have unlimited transfers for this gameweek." 
                : " Your captain's points will be tripled for this gameweek."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executePlayChip} disabled={loading} className="bg-pl-purple hover:bg-pl-purple/90">
              Confirm Activation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};