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

// 1. MODIFIED TYPE DEFINITION
type GameweekStats = {
  gw_number: number;
  status?: string; // <-- This was the missing piece
  // These types are also corrected to match your components
  most_captained?: { name: string; team_name: string; };
  most_vice_captained?: { name: string; team_name: string; };
  most_selected?: { name: string; team_name: string; };
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
  const [gameweek, setGameweek] = useState<GameweekStats | null>(null);
  const [teamOfTheWeek, setTeamOfTheWeek] = useState(null);

  const [gameweekStats, setGameweekStats] = useState({
    user_points: 0,
    average_points: 0,
    highest_points: 0,
  });

  // 2. ADDED NEW STATE VARIABLE
  const [displayGameweek, setDisplayGameweek] = useState<any | null>(null);

  const [hubStats, setHubStats] = useState({
    overall_points: 0,
    gameweek_points: 0,
    total_players: 0,
    squad_value: 0.0,
    in_the_bank: 100.0,
    gameweek_transfers: 0,
    total_transfers: 0,
    transfer_cost: 0, // <--- ✅ ADD THIS LINE (Initialize to 0)

  });
  
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

  // 3. REPLACED THIS useEffect
  useEffect(() => {
    const fetchDisplayGameweekStats = async () => {
      const token = localStorage.getItem("access_token");
      if (!token || !gameweek) return; // Wait for the main gameweek object to be fetched first

      let gwNumberToFetch = gameweek.gw_number;
      let status = gameweek.status;

      // This is the core logic fix:
      // If the current gameweek is LIVE *or* UPCOMING, and it's not GW1...
      if ((status === 'LIVE' || status === 'UPCOMING') && gameweek.gw_number > 1) {
        // ...then we want to fetch stats for the PREVIOUS gameweek.
        gwNumberToFetch = gameweek.gw_number - 1;
      }
      
      // If status is 'FINISHED', or if it's GW1 (in any state),
      // it will correctly fetch stats for the current gw_number.

      try {
        // Fetch stats for the *correct* gameweek number
        const statsEndpoint = `${API.BASE_URL}/gameweeks/${gwNumberToFetch}/stats`;
        const response = await fetch(statsEndpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setGameweekStats(data); // Set the points (e.g., for GW1)
        } else {
          // Fallback if stats for GW1 aren't ready (e.g., 0 points)
          setGameweekStats({ user_points: 0, average_points: 0, highest_points: 0 });
        }
        // *Always* set the display gameweek number
        setDisplayGameweek({ gw_number: gwNumberToFetch });

      } catch (error) {
        console.error("Failed to fetch display gameweek stats:", error);
        setGameweekStats({ user_points: 0, average_points: 0, highest_points: 0 });
        setDisplayGameweek({ gw_number: gwNumberToFetch });
      }
    };

    // This effect runs when 'user' or the 'gameweek' object changes
    fetchDisplayGameweekStats();
  }, [user, gameweek]);
  
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

   // 4. REPLACED THIS useEffect
   useEffect(() => {
    const fetchTeamOfTheWeek = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      // Use displayGameweek or gameweek to decide
      const gwToFetch = displayGameweek?.gw_number;

      // Only fetch if the gameweek is greater than 0
      if (gwToFetch && gwToFetch > 0) {
        try {
          // 1. First, try to fetch the TOTW for the current display gameweek (e.g., GW4)
          const response = await fetch(API.endpoints.teamOfTheWeekByGameweek(gwToFetch), {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (response.ok) {
            const data = await response.json();
            setTeamOfTheWeek(data);
          } else if (response.status === 404 && gwToFetch > 1) {
            // 2. If it's not found (404) and it's not GW1,
            //    try to fetch the *previous* gameweek's TOTW (e.g., GW3)
            const prevGwResponse = await fetch(API.endpoints.teamOfTheWeekByGameweek(gwToFetch - 1), {
               headers: { Authorization: `Bearer ${token}` },
            });
            if (prevGwResponse.ok) {
               const data = await prevGwResponse.json();
               setTeamOfTheWeek(data);
            } else {
               // If that also fails, set to null
               setTeamOfTheWeek(null);
            }
          } else {
            // For any other error, set to null
            setTeamOfTheWeek(null);
          }
        } catch (error) {
          console.error("Failed to fetch Team of the Week:", error);
          setTeamOfTheWeek(null);
        }
      } else {
        // If it's Gameweek 1 (or 0), ensure the state is null
        setTeamOfTheWeek(null);
      }
    };
    
    if (user && (gameweek || displayGameweek)) {
        fetchTeamOfTheWeek();
    }
  }, [user, gameweek, displayGameweek]); // This dependency array is correct

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
                  
                  // 4. UPDATED PROP
                  currentGameweekNumber={displayGameweek?.gw_number || gameweek?.gw_number || 1}
                 />
                </motion.div>
                <motion.div variants={itemVariants}>
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
                        {/* This card *correctly* uses 'gameweek' (the upcoming GW) */}
                        <GameweekStatusCard stats={gameweek} /> 
                        <TransfersCard transfersIn={transfersIn} transfersOut={transfersOut} />
                        
                        {/* 5. REPLACED RENDER LOGIC */}
                        {teamOfTheWeek ? (
                          // IF teamOfTheWeek exists, show it
                          <TeamOfTheWeekCard 
                            team={teamOfTheWeek} 
                            currentGameweekNumber={displayGameweek?.gw_number || gameweek?.gw_number || 1} 
                          />
                        ) : (
                          // ELSE, show the placeholder
                          <Card className="h-full border-black border-2">
                            <CardHeader>
                              <CardTitle className="text-xl">Team of the Week</CardTitle>
                              <p className="text-sm text-gray-500 font-semibold">
                                { (displayGameweek?.gw_number || gameweek?.gw_number || 1) <= 1 
                                  ? "Available after Gameweek 1"
                                  : "Team of the Week is not yet available."
                                }
                              </p>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3 text-center text-gray-400 pt-8 pb-8">
                                Check back here after the gameweek is finalized.
                              </div>
                            </CardContent>
                          </Card>
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