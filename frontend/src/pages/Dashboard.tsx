import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import NewUserDashboard from "./NewUserDashboard"; // Import the new component

// Import your existing dashboard components
import { GameweekHeroCard } from "@/components/dashboard/GameweekHeroCard";
import { ManagerHubCard } from "@/components/dashboard/ManagerHubCard";
import { GameweekStatusCard } from "@/components/dashboard/GameweekStatusCard";
import { TransfersCard } from "@/components/dashboard/TransfersCard";
import { TeamOfTheWeekCard } from "@/components/dashboard/TeamOfTheWeekCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API } from "@/lib/api";
import { TeamResponse } from "@/types"; 

type TransferStatItem = {
  player_id: number;
  count: number;
  full_name?: string;
  position?: string;
  team?: { short_name?: string; name?: string };
};

type TransferStatsResponse =
  | {
      gameweek_id?: number;
      most_in: TransferStatItem[];
      most_out: TransferStatItem[];
    }
  | {
      transfer_stats: {
        most_in: TransferStatItem[];
        most_out: TransferStatItem[];
      };
      [k: string]: any;
    };
    
const teamOfTheWeek = {
  manager: 'John Smith',
  points: 95,
  players: [
      { id: 1, name: 'Pope', club: 'NEW', pos: 'GK', points: 12 },
      { id: 2, name: 'Trippier', club: 'NEW', pos: 'DEF', points: 18 },
      { id: 3, name: 'James', club: 'CHE', pos: 'DEF', points: 15 },
      { id: 4, name: 'De Bruyne', club: 'MCI', pos: 'MID', points: 21 },
      { id: 5, name: 'Salah', club: 'LIV', pos: 'MID', points: 19 },
      { id: 6, name: 'Saka', club: 'ARS', pos: 'MID', points: 16 },
      { id: 7, name: 'Haaland', club: 'MCI', pos: 'FWD', points: 23 },
      { id: 8, name: 'Kane', club: 'TOT', pos: 'FWD', points: 18 },
  ],
  bench: [
      { id: 9, name: 'Alisson', club: 'LIV', pos: 'GK', points: 10 },
      { id: 10, name: 'Saliba', club: 'ARS', pos: 'DEF', points: 11 },
      { id: 11, name: 'Son', club: 'TOT', pos: 'MID', points: 14 },
  ]
};


const Dashboard: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [squad, setSquad] = useState<TeamResponse | null>(null);
  const [teamOfTheWeek, setTeamOfTheWeek] = useState(null);
  const [gameweekStats, setGameweekStats] = useState({
    user_points: 0,
    average_points: 0,
    highest_points: 0,
  });
  const [hubStats, setHubStats] = useState({
    overall_points: 0,
    gameweek_points: 0,
    total_players: 0,
    squad_value: 0.0,
    in_the_bank: 110.0,
  });


  const [transfersIn, setTransfersIn] = useState<
    { rank: number; name: string; club: string; pos: string; transfers: string }[]
  >([]);
  const [transfersOut, setTransfersOut] = useState<
    { rank: number; name: string; club: string; pos: string; transfers: string }[]
  >([]);
  const [xferLoading, setXferLoading] = useState(true);
  const [xferError, setXferError] = useState<string | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };
  
  const mapApiToCardRows = (rows: TransferStatItem[]) =>
  rows.map((row, idx) => ({
    rank: idx + 1,
    name: row.full_name ?? `Player #${row.player_id}`,
    club: row.team?.short_name ?? row.team?.name ?? "—",
    pos: row.position ?? "—",
    transfers: (row.count ?? 0).toLocaleString(),
  }));

  useEffect(() => {
    // We only fetch data if the user has a team
    if (user?.has_team) {
      const token = localStorage.getItem("access_token");
      const URL = API.endpoints.transferStats;

      (async () => {
        try {
          setXferLoading(true);
          setXferError(null);
          const res = await fetch(URL, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error(await res.text());
          const data: TransferStatsResponse = await res.json();
          const mostIn = "transfer_stats" in data ? data.transfer_stats.most_in : data.most_in;
          const mostOut = "transfer_stats" in data ? data.transfer_stats.most_out : data.most_out;
          setTransfersIn(mapApiToCardRows(mostIn ?? []));
          setTransfersOut(mapApiToCardRows(mostOut ?? []));
        } catch (e: any) {
          console.error(e);
          setXferError(typeof e?.message === "string" ? e.message : "Failed to load transfer stats");
        } finally {
          setXferLoading(false);
        }
      })();
    }
  }, [user]);

  // Show a loading state while checking auth
  if (isLoading) {
    return <div className="min-h-screen bg-pl-purple flex items-center justify-center text-pl-white">Loading...</div>;
  }
  
  // Conditionally render the new user dashboard
  if (user && user.has_team === false) {
    return <NewUserDashboard />;
  }

  useEffect(() => {
    const fetchGameweekStats = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      try {
        const response = await fetch("http://localhost:8000/gameweeks/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setGameweekStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch gameweek stats:", error);
      }
    };

    if (user) { // Only fetch if the user is loaded
        fetchGameweekStats();
    }
  }, [user]);
  

  useEffect(() => {
    // Fetch the user's team data when the component mounts
    const fetchTeam = async () => {
      const token = localStorage.getItem("access_token");
      if (!user || !token) return;

      try {
        const response = await fetch("http://localhost:8000/teams/team", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data: TeamResponse = await response.json();
          setSquad(data);
        }
      } catch (error) {
        console.error("Failed to fetch team data on dashboard:", error);
      }
    };
    
    fetchTeam();
  }, [user]);



  useEffect(() => {
    const fetchHubStats = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      try {
        const response = await fetch("http://localhost:8000/users/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setHubStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch manager hub stats:", error);
      }
    };

    if (user) {
      fetchHubStats();
    }
  }, [user]);


  useEffect(() => {
    const fetchTeamOfTheWeek = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      try {
        const response = await fetch("http://localhost:8000/gameweeks/team-of-the-week", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setTeamOfTheWeek(data);
        }
      } catch (error) {
        console.error("Failed to fetch Team of the Week:", error);
      }
    };
    
    if (user) {
        fetchTeamOfTheWeek();
    }
  }, [user]);




  // Your Existing Dashboard Code
  return (
    <div className="bg-white min-h-screen text-black">
        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
            <motion.div
               variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 lg:grid-cols-2 lg:gap-8 space-y-8 lg:space-y-0"
            >
              {/* Left Column */}
              <div className="space-y-8">
                <motion.div variants={itemVariants}>
                  <GameweekHeroCard user={user}
                  points={gameweekStats.user_points}
      averagePoints={gameweekStats.average_points}
      highestPoints={gameweekStats.highest_points}
      teamName={squad?.team_name}
 />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <ManagerHubCard stats={hubStats}/>
                </motion.div>
              </div>

              {/* Right Column */}
              <motion.div variants={itemVariants}>
                <Card className="h-full border-gray-200">
                    <CardHeader>
                         <CardTitle className="text-2xl">Gameweek Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8">
                         <GameweekStatusCard />
                        <TransfersCard transfersIn={transfersIn} transfersOut={transfersOut} />
                        {teamOfTheWeek && <TeamOfTheWeekCard team={teamOfTheWeek} />}
                    </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
      </div>
  );
};
export default Dashboard;