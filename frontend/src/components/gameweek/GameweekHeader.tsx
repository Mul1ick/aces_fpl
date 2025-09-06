import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface GameweekHeaderProps {
  gw: string | undefined;
  view: string;
  setView: (view: string) => void;
  teamName?: string;
  managerName?: string;
  totalPoints?: number;
  averagePoints?: number;
  highestPoints?: number;
  gwRank?: string;
  freeTransfers?: number;
}

export const GameweekHeader: React.FC<GameweekHeaderProps> = ({ 
    gw, 
    view, 
    setView,
    teamName = "Eric Ten Hoes",
    totalPoints = 70,
    averagePoints = 54,
    highestPoints = 127,
    gwRank = "958,151",
    freeTransfers = 0
}) => {
  return (
    <header className="p-4 text-white">
      {/* Header Section */}
      <div className="text-left mb-3">
        <h1 className="font-bold text-xl text-white">{teamName}</h1>
      </div>
      <p className="font-bold text-center text-base mb-3 text-white">Gameweek {gw || 1}</p>

      {/* Stats Layout */}
      <div className="flex justify-between items-center lg:justify-center lg:gap-x-16">
        {/* Left Column Stats */}
        <div className="space-y-2 text-center">
          <div>
            <p className="font-bold text-xl text-white">{averagePoints}</p>
            <p className="text-[10px] text-gray-300">Average Points</p>
          </div>
          <div className="border-t border-white/20 w-full"></div>
          <div>
            <p className="font-bold text-xl text-white">{highestPoints}</p>
            <p className="text-[10px] text-gray-300">Highest Points</p>
          </div>
        </div>

        {/* Highlight Card (Center Focus) */}
        <div className="flex flex-col items-center px-2">
            <div className="bg-gradient-to-br from-[#00d2ff] to-[#3a47d5] rounded-lg shadow-lg p-3 w-28 text-center">
                <p className="font-bold text-4xl text-white">{totalPoints}</p>
                <p className="text-xs text-white/80 font-semibold">Total Points</p>
            </div>
            <div className="flex items-center mt-2 cursor-pointer">
                <Star className="w-4 h-4 text-green-400 mr-1.5" />
                <span className="text-xs font-semibold hover:underline text-gray-300">Team of the Week →</span>
            </div>
        </div>

        {/* Right Column Stats */}
        <div className="space-y-2 text-center">
          <div>
            <p className="font-bold text-xl text-white">{gwRank}</p>
            <p className="text-[10px] text-gray-300">GW Rank</p>
          </div>
          <div className="border-t border-white/20 w-full"></div>
          <div>
            <p className="font-bold text-xl text-white">{freeTransfers}</p>
            <p className="text-[10px] text-gray-300">Transfers</p>
          </div>
        </div>
      </div>

      {/* Bottom Toggle Buttons */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <button 
          onClick={() => setView('pitch')} 
          className={cn(
            "py-2 text-sm font-semibold rounded-lg transition-colors", 
            view === 'pitch' ? 'bg-white/20 text-white' : 'bg-transparent border border-white/30 text-white'
          )}
        >
          Pitch View
        </button>
        <button 
          onClick={() => setView('list')} 
          className={cn(
            "py-2 text-sm font-semibold rounded-lg transition-colors", 
            view === 'list' ? 'bg-white/20 text-white' : 'bg-transparent border border-white/30 text-white'
          )}
        >
          List View
        </button>
      </div>
    </header>
  );
};

export default GameweekHeader;