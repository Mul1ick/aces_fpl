import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import NewUserDashboard from "./NewUserDashboard";

import { GameweekHeroCard } from "@/components/dashboard/GameweekHeroCard";
import { ManagerHubCard } from "@/components/dashboard/ManagerHubCard";
import { GameweekStatusCard } from "@/components/dashboard/GameweekStatusCard";
import { TransfersCard } from "@/components/dashboard/TransfersCard";
import { TeamOfTheWeekCard } from "@/components/dashboard/TeamOfTheWeekCard";
import { DreamTeamCard } from "@/components/dashboard/DreamTeamCard";
import { DeadlineCard } from "@/components/dashboard/DeadlineCard";
import { TeamOfTheSeasonStrip } from "@/components/dashboard/TeamOfTheSeasonStrip"; // ✅ Imported

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API } from "@/lib/api";
import { TeamResponse } from "@/types";

// ... [Keep existing types: TransferStatItem, GameweekStats, etc.] ...
type TransferStatItem = {
  player_id: number;
  count: number;
  full_name?: string;
  position?: string;
  team?: { short_name?: string; name?: string };
};

type GameweekStats = {
  gw_number: number;
  status?: string;
  most_captained?: { name: string; team_name: string; };
  most_vice_captained?: { name: string; team_name: string; };
  most_selected?: { name: string; team_name: string; };
  chips_played?: number;
  id: number;
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

interface SimpleGameweek {
  id: number;
  gw_number: number;
  deadline: string;
}

interface SimpleFixture {
  id: number;
  gameweek_id: number;
  kickoff: string;
  home: { name: string; short_name: string };
  away: { name: string; short_name: string };
}

const Dashboard: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [squad, setSquad] = useState<TeamResponse | null>(null);
  const [gameweek, setGameweek] = useState<GameweekStats | null>(null);
  const [teamOfTheWeek, setTeamOfTheWeek] = useState(null);
  const [dreamTeam, setDreamTeam] = useState(null);

  const [nextDeadlineGW, setNextDeadlineGW] = useState<SimpleGameweek | null>(null);
  const [upcomingFixtures, setUpcomingFixtures] = useState<SimpleFixture[]>([]);

  const [gameweekStats, setGameweekStats] = useState({
    user_points: 0,
    average_points: 0,
    highest_points: 0,
  });

  const [displayGameweek, setDisplayGameweek] = useState<any | null>(null);

  const [hubStats, setHubStats] = useState({
    overall_points: 0,
    gameweek_points: 0,
    total_players: 0,
    squad_value: 0.0,
    in_the_bank: 100.0,
    gameweek_transfers: 0,
    total_transfers: 0,
  });
  
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);

  const [transfersIn, setTransfersIn] = useState<
    { rank: number; name: string; club: string; pos: string; transfers: string }[]
  >([]);
  const [transfersOut, setTransfersOut] = useState<
    { rank: number; name: string; club: string; pos: string; transfers: string }[]
  >([]);
  const [xferLoading, setXferLoading] = useState(true);
  const [xferError, setXferError] = useState<string | null>(null);

  const [tots, setTots] = useState(null); // ✅ TOTS State

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

  // --- DATA FETCHING (Same as before) ---
  
  useEffect(() => {
    const fetchDeadlineData = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      try {
        const [gwsRes, fixturesRes] = await Promise.all([
          fetch(API.endpoints.gameweek, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(API.endpoints.fixtures, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        if (gwsRes.ok && fixturesRes.ok) {
          const allGameweeks: SimpleGameweek[] = await gwsRes.json();
          const allFixtures: SimpleFixture[] = await fixturesRes.json();
          const now = new Date();
          const nextGW = allGameweeks
            .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
            .find(gw => new Date(gw.deadline) > now);
          if (nextGW) {
            setNextDeadlineGW(nextGW);
            const gwFixtures = allFixtures
              .filter(f => f.gameweek_id === nextGW.id)
              .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
            setUpcomingFixtures(gwFixtures);
          }
        }
      } catch (e) {
        console.error("Failed to fetch deadline info", e);
      }
    };
    fetchDeadlineData();
  }, []);

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
    if (user) fetchCurrentGameweek();
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
    if (user) fetchLeaderboard();
  }, [user]);

  useEffect(() => {
    if (user && leaderboard.length > 0) {
      const userEntry = leaderboard.find(
        (entry: any) => entry.manager_email === user.email
      );
      if (userEntry) setUserRank(userEntry.rank);
    }
  }, [user, leaderboard]);

  useEffect(() => {
    const fetchBestTeams = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      const gwToFetch = displayGameweek?.gw_number;
      if (gwToFetch && gwToFetch > 0) {
        try {
          const response = await fetch(API.endpoints.teamOfTheWeekByGameweek(gwToFetch), {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setTeamOfTheWeek(data);
          } else if (response.status === 404 && gwToFetch > 1) {
            const prevGwResponse = await fetch(API.endpoints.teamOfTheWeekByGameweek(gwToFetch - 1), {
               headers: { Authorization: `Bearer ${token}` },
            });
            if (prevGwResponse.ok) {
               const data = await prevGwResponse.json();
               setTeamOfTheWeek(data);
            } else {
               setTeamOfTheWeek(null);
            }
          } else {
            setTeamOfTheWeek(null);
          }
        } catch (error) {
          console.error("Failed to fetch Team of the Week:", error);
          setTeamOfTheWeek(null);
        }

        try {
            const res = await fetch(API.endpoints.dreamTeam(gwToFetch), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setDreamTeam(await res.json());
            } else if (res.status === 404 && gwToFetch > 1) {
                const prevRes = await fetch(API.endpoints.dreamTeam(gwToFetch - 1), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (prevRes.ok) {
                    setDreamTeam(await prevRes.json());
                } else {
                    setDreamTeam(null);
                }
            } else {
                setDreamTeam(null);
            }
        } catch (e) {
            console.error("Failed to fetch Dream Team", e);
            setDreamTeam(null);
        }
      } else {
        setTeamOfTheWeek(null);
        setDreamTeam(null);
      }
    };
    if (user && (gameweek || displayGameweek)) fetchBestTeams();
  }, [user, gameweek, displayGameweek]);

  useEffect(() => {
    const fetchDisplayGameweekStats = async () => {
      const token = localStorage.getItem("access_token");
      if (!token || !gameweek) return;
      let gwNumberToFetch = gameweek.gw_number;
      let status = gameweek.status;
      if ((status === 'LIVE' || status === 'UPCOMING') && gameweek.gw_number > 1) {
        gwNumberToFetch = gameweek.gw_number - 1;
      }
      try {
        const statsEndpoint = `${API.BASE_URL}/gameweeks/${gwNumberToFetch}/stats`;
        const response = await fetch(statsEndpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setGameweekStats(data);
        } else {
          setGameweekStats({ user_points: 0, average_points: 0, highest_points: 0 });
        }
        setDisplayGameweek({ gw_number: gwNumberToFetch });
      } catch (error) {
        console.error("Failed to fetch display gameweek stats:", error);
        setGameweekStats({ user_points: 0, average_points: 0, highest_points: 0 });
        setDisplayGameweek({ gw_number: gwNumberToFetch });
      }
    };
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
    if (user) fetchHubStats();
  }, [user]);

  // ✅ Fetch TOTS
  useEffect(() => {
    const fetchTots = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) return;
        try {
            const res = await fetch(API.endpoints.teamOfTheSeason, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setTots(await res.json());
        } catch (e) {
            console.error("TOTS fetch error", e);
        }
    };
    if (user) fetchTots();
  }, [user]);

  if (isLoading) {
    return <div className="min-h-screen bg-pl-purple flex items-center justify-center text-pl-white">Loading...</div>;
  }
  
  if (user && user.has_team === false) {
    return <NewUserDashboard />;
  }

  return (
    <div className="bg-white min-h-screen text-black">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            // Use 12-column grid
            className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8 space-y-8 lg:space-y-0"
        >
          {/* Left Column (Approx 40%) */}
          <div className="space-y-8 lg:col-span-5">
            <motion.div variants={itemVariants}>
              <GameweekHeroCard 
                user={user}
                points={gameweekStats.user_points}
                averagePoints={gameweekStats.average_points}
                highestPoints={gameweekStats.highest_points}
                teamName={squad?.team_name}
                currentGameweekNumber={displayGameweek?.gw_number || gameweek?.gw_number || 1}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <DeadlineCard 
                gameweek={nextDeadlineGW} 
                fixtures={upcomingFixtures} 
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <ManagerHubCard stats={hubStats} overallRank={userRank} />
            </motion.div>
          </div>

          {/* Right Column (Approx 60%) */}
          <motion.div variants={itemVariants} className="lg:col-span-7">
            <Card className="h-full border-gray-200">
                <CardHeader>
                  <CardTitle className="text-2xl">Gameweek Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                    <GameweekStatusCard stats={gameweek} /> 
                    <TransfersCard transfersIn={transfersIn} transfersOut={transfersOut} />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {teamOfTheWeek ? (
                          <TeamOfTheWeekCard 
                            team={teamOfTheWeek} 
                            currentGameweekNumber={displayGameweek?.gw_number || gameweek?.gw_number || 1} 
                          />
                        ) : (
                          <Card className="h-full border-black border-2">
                            <CardHeader>
                              <CardTitle className="text-xl">Manager of the Week</CardTitle>
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

                        {dreamTeam ? (
                            <DreamTeamCard 
                                team={dreamTeam} 
                                gameweekNumber={displayGameweek?.gw_number || 1} 
                            />
                        ) : (
                            <Card className="h-full border-black border-2 bg-white">
                                <CardHeader>
                                    <CardTitle className="text-xl text-black">Team of the Week</CardTitle>
                                    <p className="text-sm text-gray-500 font-semibold">
                                      { (displayGameweek?.gw_number || gameweek?.gw_number || 1) <= 1 
                                        ? "Available after Gameweek 1"
                                        : "Team of the Week is not yet available."
                                      }
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center text-gray-400 py-8">
                                      Check back here after the gameweek is finalized.

                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* ✅ MOVED HERE: TOTS Strip spans FULL WIDTH below the columns */}
        <motion.div variants={itemVariants}>
          <TeamOfTheSeasonStrip team={tots} />
        </motion.div>

      </div>
    </div>
  );
};
export default Dashboard;