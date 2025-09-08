import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TransfersHeroCardProps {
  teamName: string;
  managerName: string;
  playersSelected: number;
  bank: number;
  notification: { message: string; type: 'success' | 'error' } | null;
  user: { // Define the shape of the user prop
    teamName?: string;
    full_name?: string;
    free_transfers: number;
    played_first_gameweek: boolean;
  } | null;
}

export const TransfersHeroCard: React.FC<TransfersHeroCardProps> = ({
  teamName,
  managerName,
  playersSelected,
  bank,
  notification,
  user
}) => {
  const transfersText = user?.played_first_gameweek === false 
    ? "Unlimited" 
    : user?.free_transfers;

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <CardHeader className="p-0">
          <CardTitle className="text-2xl font-bold">Squad Selection</CardTitle>
          <p className="text-sm text-gray-500">
            Select a maximum of 3 players from a single team or 'Auto Pick' if you are short of time.
          </p>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          <div className="bg-gray-100 rounded-lg p-3 mb-4">
            <p className="font-bold text-center">
              Gameweek 3 <span className="font-normal text-gray-600">•</span> Deadline: Sat 30 Aug, 15:30
            </p>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold text-lg">{teamName}</p>
              <p className="text-sm text-gray-500">{managerName}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">{playersSelected} / 11</p>
              <p className="text-sm text-gray-500">Players selected</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">{transfersText}</p>
              <p className="text-sm text-gray-500">Free Transfers</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">£{bank.toFixed(1)}m</p>
              <p className="text-sm text-gray-500">Bank</p>
            </div>
          </div>
        </CardContent>
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
