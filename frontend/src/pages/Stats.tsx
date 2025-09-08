import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { StatsToolbar } from '@/components/stats/StatsToolbar';
import { StatsTable } from '@/components/stats/StatsTable';
import { PlayerDetailModal } from '@/components/stats/PlayerDetailModal'; // 1. Import the modal

// --- MOCK DATA ---
const mockPlayers = [
  { id: 1, name: 'Saka', team: 'Arsenal', pos: 'MID', price: 9.0, points: 159 },
  { id: 2, name: 'Haaland', team: 'Man City', pos: 'FWD', price: 14.1, points: 175 },
  { id: 3, name: 'Salah', team: 'Liverpool', pos: 'MID', price: 13.0, points: 168 },
  { id: 4, name: 'Son', team: 'Spurs', pos: 'MID', price: 9.5, points: 140 },
  { id: 5, name: 'Palmer', team: 'Chelsea', pos: 'MID', price: 5.5, points: 145 },
  { id: 6, name: 'Trippier', team: 'Newcastle', pos: 'DEF', price: 6.8, points: 120 },
];

const StatsHeader = () => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className="mb-8 text-center"
  >
    <h1 className="text-4xl md:text-5xl font-extrabold text-pl-white">
      Statistics Centre
    </h1>
    <p className="text-md text-pl-white/70 mt-2">
      View detailed player and game statistics
    </p>
  </motion.div>
);

const Stats: React.FC = () => {
  const [filter, setFilter] = useState({ type: 'global', value: 'All players' });
  const [players, setPlayers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // 2. Add state to manage the selected player and modal visibility
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setPlayers(mockPlayers);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [filter]);

  const handleFilterChange = (selection) => {
    setFilter(selection);
  };
  
  const handleReset = () => {
    setFilter({ type: 'global', value: 'All players' });
  }

  // 3. Handler to open the modal
  const handlePlayerClick = (player) => {
    setSelectedPlayer(player);
  };

  return (
    <>
      <div className="min-h-screen bg-pl-purple">
        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
          <StatsHeader />
          <StatsToolbar onFilterChange={handleFilterChange} onReset={handleReset} />
          
          {/* 4. Pass the click handler to the table */}
          <StatsTable 
            players={players} 
            isLoading={isLoading} 
            onPlayerClick={handlePlayerClick} 
          />
        </div>
      </div>
      
      {/* 5. Render the modal */}
      <PlayerDetailModal 
        isOpen={!!selectedPlayer} 
        onClose={() => setSelectedPlayer(null)} 
        player={selectedPlayer} 
      />
    </>
  );
};

export default Stats;