import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { StatsToolbar } from '@/components/stats/StatsToolbar';
import { StatsTable } from '@/components/stats/StatsTable';
import { PlayerDetailModal } from '@/components/stats/PlayerDetailModal';
import { API } from '@/lib/api'; 

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
  const [sortBy, setSortBy] = useState('points');
  const [allPlayers, setAllPlayers] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);

  useEffect(() => {
    const fetchPlayerStats = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(API.endpoints.playerStats, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) {
          throw new Error('Failed to fetch player stats');
        }
        const data = await response.json();
        
        // --- MODIFIED: Ensure team_short_name is included in the formatted data ---
        const formattedData = data.map((p: any) => ({
          id: p.id,
          name: p.full_name,
          team: p.team.name,
          team_short_name: p.team.short_name, // This is the new, crucial part
          pos: p.position,
          price: parseFloat(p.price),
          points: p.total_points,
          tsb: Math.floor(Math.random() * 50) + 1,
        }));

        setAllPlayers(formattedData);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayerStats();
  }, []);

  const filteredPlayers = useMemo(() => {
    if (allPlayers.length === 0) return [];
    
    let players = [...allPlayers];

    if (filter.type === 'position') {
      const posMap: Record<string, string> = {
        'Goalkeepers': 'GK', 'Defenders': 'DEF', 'Midfielders': 'MID', 'Forwards': 'FWD'
      };
      players = players.filter(p => p.pos === posMap[filter.value]);
    } else if (filter.type === 'team') {
      players = players.filter(p => p.team === filter.value);
    }
    
    const sortedPlayers = players.sort((a, b) => {
      if (sortBy === 'price' || sortBy === 'points' || sortBy === 'tsb') {
        return b[sortBy] - a[sortBy];
      }
      return 0;
    });

    return sortedPlayers;
  }, [allPlayers, filter, sortBy]);

  const handleFilterChange = (selection: any) => {
    setFilter(selection);
  };
  
  const handleReset = () => {
    setFilter({ type: 'global', value: 'All players' });
    setSortBy('points');
  }

  const handlePlayerClick = (player: any) => {
    const fullPlayerData = allPlayers.find(p => p.id === player.id);
    setSelectedPlayer(fullPlayerData);
  };

  return (
    <>
      <div className="min-h-screen bg-pl-purple">
        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
          <StatsHeader />
          <StatsToolbar 
            onFilterChange={handleFilterChange} 
            onReset={handleReset} 
            sortBy={sortBy}
            onSortByChange={setSortBy}
          />
          
          <StatsTable 
            players={filteredPlayers} 
            isLoading={isLoading} 
            onPlayerClick={handlePlayerClick} 
          />
        </div>
      </div>
      
      <PlayerDetailModal 
        isOpen={!!selectedPlayer} 
        onClose={() => setSelectedPlayer(null)} 
        player={selectedPlayer} 
      />
    </>
  );
};

export default Stats;