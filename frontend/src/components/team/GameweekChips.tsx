import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getChipStatus, playChip, cancelChip, type ChipStatus, type ChipName } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

const chips = [
  { id: 'WILDCARD' as const, name: 'Wildcard', icon: RefreshCw, description: 'Unlimited free transfers for this Gameweek. Once played, the chip cannot be disabled.' },
  { id: 'TRIPLE_CAPTAIN' as const, name: 'Triple Captain', icon: Zap, description: 'Captain scores are tripled this Gameweek. Once played, the chip cannot be disabled..' },
];
type ChipItem = typeof chips[number];

export const GameweekChips: React.FC<{ token: string; gw?: number }> = ({ token, gw }) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<ChipStatus>({ active: null, used: [] });
  const [selectedChip, setSelectedChip] = useState<ChipItem | null>(null);
  const [loading, setLoading] = useState(false);
  
  const refresh = async () => {
    try { setStatus(await getChipStatus(token, gw)); }
    catch (e:any) { toast({ variant: 'destructive', title: 'Chip status failed', description: e.message }); }
  };
  
  useEffect(() => { if (token) refresh(); }, [token, gw]);

  const handleChipClick = (chip: ChipItem) => {
    if (status.active && status.active !== chip.id) return;
    setSelectedChip(chip);
  };

  const onPlayChip = async () => {
    if (!selectedChip) return;
    setLoading(true);
    try {
      await playChip(token, selectedChip.id as ChipName, gw);
      await refresh();
      setSelectedChip(null);
      toast({ title: `${selectedChip.name} activated` });
    } catch (e:any) {
      toast({ variant: 'destructive', title: `Could not play ${selectedChip.name}`, description: e.message });
    } finally { setLoading(false); }
  };
  
  const onCancelChip = async () => {
    setLoading(true);
    try {
      await cancelChip(token, gw);
      await refresh();
      toast({ title: `Chip cancelled` });
    } catch (e:any) {
      toast({ variant: 'destructive', title: 'Cancel failed', description: e.message });
    } finally { setLoading(false); }
  };

  return (
    <>
      <Card className="bg-gradient-to-br from-[#37003C] to-[#23003F] border-purple-800/50">
        <CardContent className="p-4">
          <div className="flex justify-around items-center text-center">
            {chips.map(chip => {
              const isActive = status.active === chip.id;
              const isUsed = status.used.includes(chip.id as ChipName);
              const isDisabled = loading || (!isActive && (status.active !== null || isUsed));

              return (
                <div key={chip.id} className="flex flex-col items-center space-y-2 h-[110px] justify-start">
                  <button
                    onClick={() => handleChipClick(chip)}
                    disabled={isDisabled}
                    className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all",
                      isActive 
                        ? "bg-dashboard-gradient border-transparent text-white" 
                        : "bg-black/20 border-transparent text-white",
                      isDisabled 
                        ? "opacity-30 cursor-not-allowed" 
                        : "hover:bg-white/5" // --- MODIFIED: Subtle hover effect ---
                    )}
                    title={isUsed ? "Already used" : ""}
                  >
                    <chip.icon className="size-8" />
                  </button>
                  {/* --- MODIFIED: Text is now always white --- */}
                  <p className="text-xs font-semibold text-white">
                    {chip.name}{isUsed && !isActive ? " (used)" : ""}
                  </p>
                  {isActive && (
                    <button
                      onClick={onCancelChip}
                      // Disable cancellation if the active chip is a Wildcard
                      disabled={loading || status.active === 'WILDCARD'}
                      className={cn(
                        "mt-1 w-full px-3 py-1 rounded-full bg-gradient-to-r from-accent-teal to-accent-blue",
                        // Visually indicate that the button is disabled
                        status.active === 'WILDCARD' && "opacity-60 cursor-not-allowed"
                      )}
                      // Add a title to explain why it's disabled
                      title={status.active === 'WILDCARD' ? "Wildcard cannot be cancelled" : "Cancel Chip"}
                    >
                      {/* --- MODIFIED: Text is now black for contrast --- */}
                      <p className="text-xs font-bold text-black">Active</p>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
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
                <Button className="w-full mt-6" onClick={onPlayChip} disabled={loading}>Play Chip</Button>
              </div>
              <button onClick={() => setSelectedChip(null)} className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};