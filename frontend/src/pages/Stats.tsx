// import React, { useState, useEffect,useMemo } from 'react';
// import { motion } from 'framer-motion';
// import { StatsToolbar } from '@/components/stats/StatsToolbar';
// import { StatsTable } from '@/components/stats/StatsTable';
// import { PlayerDetailModal } from '@/components/stats/PlayerDetailModal'; // 1. Import the modal
// import { API } from '@/lib/api'; // --- NEW: Import API helper


// // --- MOCK DATA ---
// const mockPlayers = [
//   { id: 1, name: 'Saka', team: 'Arsenal', pos: 'MID', price: 9.0, points: 159 },
//   { id: 2, name: 'Haaland', team: 'Man City', pos: 'FWD', price: 14.1, points: 175 },
//   { id: 3, name: 'Salah', team: 'Liverpool', pos: 'MID', price: 13.0, points: 168 },
//   { id: 4, name: 'Son', team: 'Spurs', pos: 'MID', price: 9.5, points: 140 },
//   { id: 5, name: 'Palmer', team: 'Chelsea', pos: 'MID', price: 5.5, points: 145 },
//   { id: 6, name: 'Trippier', team: 'Newcastle', pos: 'DEF', price: 6.8, points: 120 },
// ];

// const StatsHeader = () => (
//   <motion.div
//     initial={{ opacity: 0, y: -20 }}
//     animate={{ opacity: 1, y: 0 }}
//     transition={{ duration: 0.5, ease: "easeOut" }}
//     className="mb-8 text-center"
//   >
//     <h1 className="text-4xl md:text-5xl font-extrabold text-pl-white">
//       Statistics Centre
//     </h1>
//     <p className="text-md text-pl-white/70 mt-2">
//       View detailed player and game statistics
//     </p>
//   </motion.div>
// );

// const Stats: React.FC = () => {
//   const [filter, setFilter] = useState({ type: 'global', value: 'All players' });
//     const [sortBy, setSortBy] = useState('points'); // --- NEW: State for sorting

//   const [allPlayers, setAllPlayers] = useState<any[]>([]); // --- NEW: Store all players from API
//   const [isLoading, setIsLoading] = useState(true);
//   // 2. Add state to manage the selected player and modal visibility
//   const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);

//   useEffect(() => {
//     const fetchPlayerStats = async () => {
//       setIsLoading(true);
//       try {
//         const token = localStorage.getItem("access_token");
//         const response = await fetch(API.endpoints.playerStats, {
//           headers: token ? { Authorization: `Bearer ${token}` } : {},
//         });
//         if (!response.ok) {
//           throw new Error('Failed to fetch player stats');
//         }
//         const data = await response.json();
//         // --- NEW: Map API data to the format components expect ---
//         const formattedData = data.map((p: any) => ({
//           id: p.id,
//           name: p.full_name,
//           team: p.team.name,
//           pos: p.position,
//           price: parseFloat(p.price),
//           points: p.total_points,
//           tsb: Math.floor(Math.random() * 50) + 1, // Placeholder selection %
//         }));
//         setAllPlayers(formattedData);
//       } catch (error) {
//         console.error(error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchPlayerStats();
//   }, []);



//   const filteredPlayers = useMemo(() => {
//     if (!allPlayers) return [];
    
//     let players = [...allPlayers];

//     if (filter.type === 'position') {
//       const posMap: Record<string, string> = {
//         'Goalkeepers': 'GK',
//         'Defenders': 'DEF',
//         'Midfielders': 'MID',
//         'Forwards': 'FWD'
//       };
//       players = players.filter(p => p.pos === posMap[filter.value]);
//     } else if (filter.type === 'team') {
//       players = players.filter(p => p.team === filter.value);
//     }
    

//     // Default sort by points
// return players.sort((a, b) => {
//       if (sortBy === 'price' || sortBy === 'points' || sortBy === 'tsb') {
//         return b[sortBy] - a[sortBy];
//       }
//       return 0;
//     });  }, [allPlayers, filter,sortBy]);



//   const handleFilterChange = (selection) => {
//     setFilter(selection);
//   };
  
//   const handleReset = () => {
//     setFilter({ type: 'global', value: 'All players' });
//     setSortBy('points');
//   }

//   // 3. Handler to open the modal
//   const handlePlayerClick = (player) => {
//     const fullPlayerData = allPlayers.find(p => p.id === player.id);
//     setSelectedPlayer(fullPlayerData);

//   };

//   return (
//     <>
//       <div className="min-h-screen bg-pl-purple">
//         <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
//           <StatsHeader />
//           <StatsToolbar onFilterChange={handleFilterChange} onReset={handleReset} sortBy={sortBy} onSortByChange={setSortBy}/>
          
//           {/* 4. Pass the click handler to the table */}
//           <StatsTable 
//             players={allPlayers} 
//             isLoading={isLoading} 
//             onPlayerClick={handlePlayerClick} 
//           />
//         </div>
//       </div>
      
//       {/* 5. Render the modal */}
//       <PlayerDetailModal 
//         isOpen={!!selectedPlayer} 
//         onClose={() => setSelectedPlayer(null)} 
//         player={selectedPlayer} 
//       />
//     </>
//   );
// };

// export default Stats;


// frontend/src/pages/Stats.tsx

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
        const formattedData = data.map((p: any) => ({
          id: p.id,
          name: p.full_name,
          team: p.team.name,
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
    
    // --- DEBUG LOG #1: Check sortBy state and first player's data types ---
    console.log(`--- Sorting by: ${sortBy} ---`);
    console.log(`Data type of first player's points: ${typeof allPlayers[0].points}`);
    console.log(`Data type of first player's price: ${typeof allPlayers[0].price}`);

    let players = [...allPlayers];

    if (filter.type === 'position') {
      const posMap: Record<string, string> = {
        'Goalkeepers': 'GK', 'Defenders': 'DEF', 'Midfielders': 'MID', 'Forwards': 'FWD'
      };
      players = players.filter(p => p.pos === posMap[filter.value]);
    } else if (filter.type === 'team') {
      players = players.filter(p => p.team === filter.value);
    }
    
    // --- DEBUG LOG #2: Show the top 3 players BEFORE sorting ---
    console.log('Top 3 players BEFORE sorting:', players.slice(0, 3).map(p => ({ name: p.name, points: p.points, price: p.price })));

    const sortedPlayers = players.sort((a, b) => {
      if (sortBy === 'price' || sortBy === 'points' || sortBy === 'tsb') {
        return b[sortBy] - a[sortBy];
      }
      return 0;
    });

    // --- DEBUG LOG #3: Show the top 3 players AFTER sorting ---
    console.log('Top 3 players AFTER sorting:', sortedPlayers.slice(0, 3).map(p => ({ name: p.name, points: p.points, price: p.price })));
    console.log('---------------------------------');


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