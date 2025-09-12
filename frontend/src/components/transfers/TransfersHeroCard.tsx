import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TransfersHeroCardProps {
  playersSelected: number;
  bank: number;
  notification: { message: string; type: 'success' | 'error' } | null;
  user: {
    free_transfers: number;
    played_first_gameweek: boolean;
  } | null;
  view: 'pitch' | 'list';
  setView: (view: 'pitch' | 'list') => void;
}

// Sub-component for individual stat displays
const StatDisplay = ({ value, label }: { value: string | number; label: string }) => (
    <div className="bg-pl-white/10 p-2 rounded-lg text-center flex flex-col justify-center">
        {/* --- MODIFIED: Standardized font sizes --- */}
        <p className="font-bold text-base text-pl-white leading-tight">{value}</p>
        <p className="text-[10px] text-pl-white/70 leading-tight mt-1">{label}</p>
    </div>
);


export const TransfersHeroCard: React.FC<TransfersHeroCardProps> = ({
  playersSelected,
  bank,
  notification,
  user,
  view,
  setView
}) => {
  const transfersText = user?.played_first_gameweek === false 
    ? "Unlimited" 
    : user?.free_transfers;
  
  const transferCost = 0; // Placeholder for cost logic

  return (
    <Card className="overflow-hidden bg-pl-purple border-pl-border">
      <div className="p-4 text-pl-white">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Transfers</h2>
            <p className="text-sm text-pl-white/70">
               Select a maximum of 3 players from a single team or 'Auto Pick' if you are short of time.
            </p>
          </div>

          <div className="bg-pl-white/10 rounded-lg p-3">
            <p className="font-bold text-center text-sm">
               Gameweek 4 • Deadline: Sat 13 Sep, 15:30
            </p>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {/* --- MODIFIED: Removed the 'highlight' prop --- */}
            <StatDisplay value={`${playersSelected} / 15`} label="Players Selected" />
            <StatDisplay value={`£${bank.toFixed(1)}m`} label="Budget" />
            <StatDisplay value={transfersText} label="Free Transfers" />
            <StatDisplay value={`${transferCost} pts`} label="Cost" />
          </div>
          
          <div className="flex justify-center pt-2 bg-pl-white/10 p-1 rounded-lg">
            <div className="grid grid-cols-2 gap-1 w-full">
                <button
                    onClick={() => setView('pitch')}
                    className={cn(
                        "w-full py-2 text-sm font-semibold rounded-md transition-colors",
                        view === 'pitch' ? 'bg-pl-white text-pl-purple' : 'text-pl-white/70 hover:bg-pl-white/20'
                    )}
                >
                    Pitch View
                </button>
                <button
                    onClick={() => setView('list')}
                    className={cn(
                        "w-full py-2 text-sm font-semibold rounded-md transition-colors",
                        view === 'list' ? 'bg-pl-white text-pl-purple' : 'text-pl-white/70 hover:bg-pl-white/20'
                    )}
                >
                    List View
                </button>
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {notification && (
          <motion.div
             initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
               "p-3 text-center font-semibold text-sm",
              notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-dashboard-gradient text-purple-900'
            )}
          >
            {notification.message}
          </motion.div>
        )}
       </AnimatePresence>
    </Card>
  );
};