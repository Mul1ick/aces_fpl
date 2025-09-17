import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shirt, ArrowUpDown, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface GameweekHeroCardProps {
  user: {
    full_name?: string;
  } | null;
  points: number;
  averagePoints: number;
  highestPoints: number;
  teamName?: string; 
  currentGameweekNumber: number;
}


export const GameweekHeroCard: React.FC<GameweekHeroCardProps> = ({ user,teamName, points, averagePoints, highestPoints,currentGameweekNumber  }) => {
  const navigate = useNavigate();

  return (
    <Card className="border-none p-6 text-white rounded-2xl shadow-lg bg-[linear-gradient(to_top_right,_#00c6ff,_#2196f3,_#6a11cb)]">
      <div className="flex flex-col space-y-5">
        {/* Team and Manager Name */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">
            {teamName || "Aces United"}
          </h2>
          <p className="text-white/90 font-semibold text-md">
            {user?.full_name || "John Doe"} 🇮🇳
          </p>
        </div>

        {/* Divider and Gameweek Label */}
        <div className="flex items-center justify-center space-x-4">
            <div className="flex-grow border-t border-white/20"></div>
            <p className="text-sm font-semibold text-white/80">Gameweek {currentGameweekNumber}</p>
            <div className="flex-grow border-t border-white/20"></div>
        </div>

        {/* Points Section */}
        <div className="flex justify-around items-center text-center">
          <div>
            <p className="text-3xl font-bold tabular-nums">{averagePoints}</p>
            <p className="text-sm text-white/80 font-medium">Average</p>
          </div>
          
          <motion.div 
            whileHover={{ scale: 1.1 }}
            onClick={() => navigate(`/gameweek/${currentGameweekNumber}`)} // Corrected Navigation
            className="cursor-pointer"
          >
            <motion.p 
              className="text-6xl font-bold tabular-nums"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
            >
              {points}
            </motion.p>
            <div className="flex items-center justify-center">
                <p className="text-sm text-white/80 font-medium">Your Points</p>
                <ChevronRight className="w-4 h-4 text-white/80 ml-1" />
            </div>
          </motion.div>

          <div 
            onClick={() => navigate(`/gameweek/${currentGameweek}/top`)} // This can link to a top player's gameweek page
            className="cursor-pointer flex flex-col items-center"
          >
            <p className="text-3xl font-bold tabular-nums">{highestPoints}</p>
            <div className="flex items-center justify-center">
                <p className="text-sm text-white/80 font-medium">Highest</p>
                <ChevronRight className="w-4 h-4 text-white/80 ml-1" />
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="grid grid-cols-2 gap-4 pt-4">
          <motion.button 
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center space-x-2 text-white font-bold py-2 px-4 text-sm md:py-3 md:px-7 md-text-base rounded-full bg-indigo-900/40 backdrop-blur-sm border border-white/20 hover:bg-indigo-900/50 transition-all" 
            onClick={() => navigate("/team")}
          >
            <Shirt className="size-4 md:size-5" />
            <span>Pick Team</span>
          </motion.button>
          <motion.button 
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center space-x-2 text-white font-bold py-2 px-4 text-sm md:py-3 md:px-7 md-text-base rounded-full bg-indigo-900/40 backdrop-blur-sm border border-white/20 hover:bg-indigo-900/50 transition-all" 
            onClick={() => navigate("/transfers")}
          >
            <ArrowUpDown className="size-4 md:size-5" />
            <span>Transfers</span>
          </motion.button>
        </div>
      </div>
    </Card>
  );
};

export default GameweekHeroCard;