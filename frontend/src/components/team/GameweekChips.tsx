import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Zap, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getChipStatus, playChip, cancelChip, type ChipStatus, type ChipName } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const chips = [
  { id: 'WILDCARD' as const, name: 'Wildcard', icon: RefreshCw, description: 'Unlimited free transfers for this Gameweek. Can be cancelled before the deadline.' },
  { id: 'TRIPLE_CAPTAIN' as const, name: 'Triple Captain', icon: Zap, description: 'Captain scores are tripled this Gameweek. Can be cancelled before the deadline.' },
  { id: 'FREE_HIT' as const, name: 'Free Hit', icon: Shield, description: 'Not available in this build.' },
];
type ChipItem = typeof chips[number];

export const GameweekChips: React.FC<{ token: string; gw?: number }> = ({ token, gw }) => {
  
  const [activeChip, setActiveChip] = useState<string | null>(null);

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
  if (chip.id === 'FREE_HIT') return; // disabled
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
        const isSupported = chip.id === 'WILDCARD' || chip.id === 'TRIPLE_CAPTAIN';
        const isActive = status.active === chip.id;
        const isUsed = status.used.includes(chip.id as ChipName);
        const isDisabled = loading || (!isActive && (status.active !== null || isUsed || !isSupported));

        return (
          <div key={chip.id} className="flex flex-col items-center space-y-2">
            <button
              onClick={() => handleChipClick(chip)}
              disabled={isDisabled}
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all",
                isActive ? "bg-fpl-highlight-teal border-fpl-highlight-teal text-black" : "bg-black/20 border-transparent text-white",
                isDisabled ? "opacity-30 cursor-not-allowed" : "hover:border-fpl-highlight-teal"
              )}
              title={isUsed ? "Already used" : !isSupported ? "Not available" : ""}
            >
              <chip.icon className="size-8" />
            </button>
            <p className={cn("text-xs font-semibold", isActive ? "text-fpl-highlight-teal" : "text-white")}>
              {chip.name}{isUsed && !isActive ? " (used)" : ""}
            </p>
            {isActive && (
              <Button variant="destructive" size="sm" className="text-xs h-6" onClick={onCancelChip} disabled={loading}>Cancel</Button>
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
                <div className="text-xs text-gray-500 space-y-1 text-center">
                    <p>You lose the first {selectedChip.name} after the Gameweek 19 deadline, Wed 31 Dec 00:00.</p>
                    <p>The second {selectedChip.name} will be available after Wed 31 Dec 00:00.</p>
                </div>
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
