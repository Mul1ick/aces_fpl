import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import NewUserDashboard from "./NewUserDashboard";

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

type GameweekStats = {
  gw_number: number;
  most_captained?: string;
  most_vice_captained?: string;
  most_selected?: string;
  chips_played?: number;
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
    
const Dashboard: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [squad, setSquad] = useState<TeamResponse | null>(null);
  // const [teamOfTheWeek, setTeamOfTheWeek] = useState(null);
  // const [gameweek, setGameweek] = useState<{ gw_number: number } | null>(null);
const [gameweek, setGameweek] = useState<GameweekStats | null>(null);
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
  
  // ✅ ADD THESE STATE VARIABLES
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState<number | null>(null);

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
    club: row.team?.name ?? row.team?.short_name ?? "—",
    pos: row.position ?? "—",
    transfers: (row.count ?? 0).toLocaleString(),
  }));

  useEffect(() => {
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

  useEffect(() => {
    const fetchCurrentGameweek = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      try {
        const response = await fetch(`${API.BASE_URL}/gameweeks/gameweek/current`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setGameweek(data);
        }
      } catch (error) {
        console.error("Failed to fetch current gameweek:", error);
      }
    };

    if (user) {
        fetchCurrentGameweek();
    }
  }, [user]);
  
  // ✅ ADD THIS EFFECT TO FETCH LEADERBOARD DATA
  useEffect(() => {
    const fetchLeaderboard = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      try {
        const response = await fetch(API.endpoints.leaderboard, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setLeaderboard(data);
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      }
    };

    if (user) {
      fetchLeaderboard();
    }
  }, [user]);

  // ✅ ADD THIS EFFECT TO CALCULATE USER RANK
  useEffect(() => {
    if (user && leaderboard.length > 0) {
      const userEntry = leaderboard.find(
        (entry: any) => entry.manager_email === user.email
      );
      if (userEntry) {
        setUserRank(userEntry.rank);
      }
    }
  }, [user, leaderboard]);

  if (isLoading) {
    return <div className="min-h-screen bg-pl-purple flex items-center justify-center text-pl-white">Loading...</div>;
  }
  
  if (user && user.has_team === false) {
    return <NewUserDashboard />;
  }

  useEffect(() => {
    const fetchGameweekStats = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      try {
        const response = await fetch(API.endpoints.gameweekStats, {
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

    if (user) {
        fetchGameweekStats();
    }
  }, [user]);
  

  useEffect(() => {
    const fetchTeam = async () => {
      const token = localStorage.getItem("access_token");
      if (!user || !token) return;

      try {
        const response = await fetch(API.endpoints.team(), {
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
        const response = await fetch(API.endpoints.userStats, {
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
        const response = await fetch(API.endpoints.teamOfTheWeek, {
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
                  currentGameweekNumber={gameweek?.gw_number || 1}
                 />
                </motion.div>
                <motion.div variants={itemVariants}>
                  {/* ✅ MODIFIED: Pass the userRank prop here */}
                  <ManagerHubCard stats={hubStats} overallRank={userRank} />
                </motion.div>
              </div>

              {/* Right Column */}
              <motion.div variants={itemVariants}>
                <Card className="h-full border-gray-200">
                    <CardHeader>
                         <CardTitle className="text-2xl">Gameweek Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <GameweekStatusCard stats={gameweek} />
                        <TransfersCard transfersIn={transfersIn} transfersOut={transfersOut} />
                        {teamOfTheWeek && (
              <TeamOfTheWeekCard 
                team={teamOfTheWeek} 
                currentGameweekNumber={gameweek?.gw_number || 1} 
              />
            )}
                    </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
      </div>
  );
};
export default Dashboard;