import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Zap, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const chips = [
    { id: 'wildcard', name: 'Wildcard', icon: RefreshCw, description: 'Make unlimited free transfers for a single Gameweek. It can be cancelled at any time before the Gameweek deadline.' },
    { id: 'tripleCaptain', name: 'Triple Captain', icon: Zap, description: 'The points scored by your captain will be tripled instead of doubled in a Gameweek. It can be cancelled at anytime before the Gameweek deadline.' },
    { id: 'freeHit', name: 'Free Hit', icon: Shield, description: 'Make unlimited free transfers for a single Gameweek. At the next deadline your squad is returned to how it was before the Free Hit was played.' }
];

export const GameweekChips: React.FC = () => {
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [selectedChip, setSelectedChip] = useState<any | null>(null);

  const handleChipClick = (chip) => {
    if (activeChip && activeChip !== chip.id) return; // Another chip is active
    setSelectedChip(chip);
  };

  const playChip = () => {
    if (selectedChip) {
      setActiveChip(selectedChip.id);
      setSelectedChip(null);
    }
  };
  
  const cancelChip = () => {
      setActiveChip(null);
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-[#37003C] to-[#23003F] border-purple-800/50">
        <CardContent className="p-4">
          <div className="flex justify-around items-center text-center">
            {chips.map(chip => {
              const isActive = activeChip === chip.id;
              const isDisabled = activeChip !== null && !isActive;

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
                  >
                    <chip.icon className="size-8" />
                  </button>
                  <p className={cn("text-xs font-semibold", isActive ? "text-fpl-highlight-teal" : "text-white")}>{chip.name}</p>
                  {isActive && (
                      <Button variant="destructive" size="sm" className="text-xs h-6" onClick={cancelChip}>Cancel</Button>
                  )}
                </div>
              )
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
                <Button className="w-full mt-6" onClick={playChip}>Play Chip</Button>
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
