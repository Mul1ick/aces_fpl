import React, { useState, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Search, Trophy, ChevronLeft, ChevronRight, ArrowUpCircle, ArrowDownCircle, Minus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/fpl-button";
import { Card, CardContent } from "@/components/ui/fpl-card";
import { Input } from "@/components/ui/input";
import acesLogo from "@/assets/aces-logo-black.png";
import { useNavigate } from "react-router-dom";
import { API } from "@/lib/api";

interface LeaderboardEntry {
  rank: number;
  previous_rank?: number | null; 
  team_name: string;
  manager_email: string;
  total_points: number;
  gwPoints?: number;
  user_id: string;            
}

interface GameweekInfo {
  gw_number: number;
  deadline_time: string;
}

// --- RANK INDICATOR COMPONENT ---
const RankIndicator = ({ currentRank, previousRank }: { currentRank: number, previousRank?: number | null }) => {
  if (previousRank === null || previousRank === undefined) {
    return <Minus className="size-4 text-pl-white/40 shrink-0" />;
  }
  if (currentRank < previousRank) {
    return <ArrowUpCircle className="size-4 text-green-500 shrink-0" />;
  }
  if (currentRank > previousRank) {
    return <ArrowDownCircle className="size-4 text-red-500 shrink-0" />;
  }
  return <Minus className="size-4 text-pl-white/40 shrink-0" />;
};

// --- MOBILE CARD COMPONENT ---
const LeaderboardCard: React.FC<{ entry: LeaderboardEntry; isCurrentUser: boolean; isSeasonStarted: boolean }> = ({ entry, isCurrentUser, isSeasonStarted }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    }}
    className={`p-3 sm:p-4 border-b last:border-b-0 ${
      isCurrentUser 
        ? "bg-gradient-to-r from-[#2eb1d5] via-[#3f80db] to-[#6461e1] border-transparent rounded-md my-1" 
        : "border-gray-200"
    }`}
  >
    <div className="flex justify-between items-center w-full gap-2 sm:gap-4">
      <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
        <div className={`flex items-center justify-center gap-1 sm:gap-1.5 w-10 sm:w-14 text-center shrink-0 ${isCurrentUser ? "text-white" : "text-gray-900"}`}>
          {isSeasonStarted ? (
            <>
              <RankIndicator currentRank={entry.rank} previousRank={entry.previous_rank} />
              <span className="text-base sm:text-xl font-bold tabular-nums">{entry.rank}</span>
            </>
          ) : (
            <span className="text-base sm:text-xl font-bold tabular-nums">-</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          {/* 👇 Conditional Text Colors */}
          <p className={`font-bold text-sm sm:text-base truncate ${isCurrentUser ? "text-white" : "text-gray-900"}`}>
            {entry.team_name}
          </p>
          <p className={`text-[10px] sm:text-xs truncate ${isCurrentUser ? "text-white/90" : "text-gray-500"}`}>
            {entry.manager_email}
          </p>
        </div>
      </div>
      <div className="text-right shrink-0 pl-1 sm:pl-2">
        {/* 👇 Conditional Text Color */}
        <p className={`text-base sm:text-xl font-bold tabular-nums ${isCurrentUser ? "text-white" : "text-gray-900"}`}>
          {entry.total_points}
        </p>
      </div>
    </div>
  </motion.div>
);

const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const navigate = useNavigate();
  const [currentGameweek, setCurrentGameweek] = useState<GameweekInfo | null>(null);

  const deadlineHasPassed = useMemo(() => {
    if (!currentGameweek?.deadline_time) return false;
    return new Date() > new Date(currentGameweek.deadline_time);
  }, [currentGameweek]);

  // Use this single source of truth for both mobile and desktop
  const isSeasonStarted = useMemo(() => {
    if (leaderboardData.length === 0) return false;
    return leaderboardData.some(entry => entry.total_points > 0);
  }, [leaderboardData]);

  useEffect(() => {
  const token = localStorage.getItem("access_token");
  if (!token) { setError("You are not authenticated."); setIsLoading(false); return; }

  const headers = { Authorization: `Bearer ${token}` };

  const fetchCurrentGw = async (): Promise<GameweekInfo> => {
    const paths = [
      "/gameweeks/gameweek/current",
      "/gameweek/current",
      "/gameweeks/current",
    ];
    for (const p of paths) {
      try {
        const res = await fetch(`${API.BASE_URL}${p}`, { headers });
        if (!res.ok) {
          console.warn(`GW fetch ${p} -> ${res.status}`, await res.text().catch(() => ""));
          continue;
        }
        const gw = await res.json();
        return {
          gw_number: Number(gw.gw_number ?? gw.number ?? gw.gw ?? 0),
          deadline_time: String(gw.deadline_time ?? gw.deadline ?? gw.deadlineTime ?? ""),
        };
      } catch (e) {
        console.warn(`GW fetch ${p} network error`, e);
      }
    }
    throw new Error("Current gameweek endpoint not found");
  };

  (async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [lbRes, gwInfo] = await Promise.all([
        fetch(API.endpoints.leaderboard, { headers }),
        fetchCurrentGw(),
      ]);
      if (!lbRes.ok) throw new Error("Failed to fetch leaderboard.");

      const rawLb: any[] = await lbRes.json();
      const lbData: LeaderboardEntry[] = (rawLb ?? []).map((r: any) => ({
        rank: Number(r.rank ?? 0),
        previous_rank: r.previous_rank !== null && r.previous_rank !== undefined ? Number(r.previous_rank) : null,
        team_name: String(r.team_name ?? ""),
        manager_email: String(r.manager_email ?? ""),
        total_points: Number(r.total_points ?? 0),
        user_id: String(r.user_id ?? r.userId ?? r.id ?? r.user?.id ?? ""),
      }));

      setLeaderboardData(lbData);
      setCurrentGameweek(gwInfo);
      setCurrentPage(1);
    } catch (e: any) {
      setError(e.message || "Failed to fetch gameweek info.");
    } finally {
      setIsLoading(false);
    }
  })();
}, []);

const handleRowClick = (entry: LeaderboardEntry) => {
  if (!currentGameweek) {
    toast({ variant: "destructive", title: "Cannot view team", description: "Gameweek data is not available." });
    return;
  }

  const currentGwNumber = Number(currentGameweek.gw_number);
  const userKey = entry.user_id || entry.manager_email;
  if (!userKey) return;

  if (currentGwNumber === 1 && !deadlineHasPassed) {
    toast({ title: "Team Hidden", description: "You can view other managers' teams after the first gameweek deadline." });
    return;
  }

  const targetGwNumber = deadlineHasPassed ? currentGwNumber : currentGwNumber - 1;

  navigate(`/team-view/${encodeURIComponent(userKey)}/${targetGwNumber}`);

};

  const filteredData = useMemo(() =>
    leaderboardData.filter(
      (entry) =>
        entry.manager_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.team_name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [leaderboardData, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  return (
    <div className="min-h-screen bg-pl-purple">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-[1100px]">
        <motion.div initial="hidden" animate="visible" variants={containerVariants}>
          
          {/* Header Section */}
          <motion.div variants={containerVariants} className="mb-6 text-center">
            <img src={acesLogo} alt="Aces FPL Logo" className="w-26 h-16 mx-auto mb-2" />
            <h1 className="text-4xl md:text-5xl font-extrabold text-pl-white">
              FANTASY PREMIER LEAGUE
            </h1>
            <p className="text-caption text-pl-white/60 mt-2">
              Last updated: {new Date().toLocaleString()}
            </p>
          </motion.div>

          <motion.div variants={containerVariants}>
            <Card variant="glass" className="mb-6">
              <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-1/3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-pl-white/40" />
                  <Input
                    type="text"
                    placeholder="Filter by manager or team"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full h-10 pl-10 pr-4 glass rounded-xl border border-pl-border text-pl-white placeholder:text-pl-white/40 focus:border-pl-green focus:ring-2 focus:ring-pl-green/20"
                  />
                </div>
                <div className="flex items-center space-x-2 text-caption text-pl-white/80">
                  <Trophy className="size-4 text-pl-green" />
                  <span>Showing {filteredData.length} of {leaderboardData.length} managers</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={containerVariants}>
            <Card variant="glass">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="h-96 flex items-center justify-center text-pl-white">Loading standings...</div>
                ) : error ? (
                  <div className="h-96 flex items-center justify-center text-pl-pink">{error}</div>
                ) : (
                  <>
                    {/* --- DESKTOP TABLE (Hidden on mobile) --- */}
                    <div className="overflow-x-auto hidden md:block">
                      <table className="w-full text-left">
                        <thead className="border-b border-pl-border">
                          <tr>
                            <th className="p-4 text-caption font-semibold text-pl-white/60 w-24 text-center">Rank</th>
                            <th className="p-4 text-caption font-semibold text-pl-white/60">Team & Manager</th>
                            <th className="p-4 text-caption font-semibold text-pl-white/60 text-center">Total</th>
                          </tr>
                        </thead>
                        <motion.tbody initial="hidden" animate="visible" variants={containerVariants}>
                          {paginatedData.map((entry) => {
                          const isCurrentUser = entry.manager_email === user?.email;
                          
                          return (
                            <motion.tr
                              key={entry.user_id || `${entry.manager_email}-${entry.rank}`}
                              variants={containerVariants}
                              className={`border-b last:border-b-0 transition-colors cursor-pointer ${
                                isCurrentUser 
                                  ? "bg-gradient-to-r from-[#2eb1d5] via-[#3f80db] to-[#6461e1] border-transparent" 
                                  : "border-gray-200 hover:bg-gray-50"
                              }`}
                              onClick={() => handleRowClick(entry)}
                            >
                              <td className="p-4 text-center">
                                {isSeasonStarted ? (
                                  <span className={`font-semibold tabular-nums flex items-center justify-center gap-2 ${isCurrentUser ? "text-white" : "text-gray-900"}`}>
                                    <RankIndicator currentRank={entry.rank} previousRank={entry.previous_rank} />
                                    {entry.rank}
                                  </span>
                                ) : (
                                  <span className={`font-bold text-lg tabular-nums text-center ${isCurrentUser ? "text-white" : "text-gray-900"}`}>
                                    -
                                  </span>
                                )}
                              </td>
                              <td className="p-4">
                                {/* 👇 Conditional Text Colors */}
                                <p className={`font-semibold ${isCurrentUser ? "text-white" : "text-gray-900"}`}>
                                  {entry.team_name}
                                </p>
                                <p className={`text-caption ${isCurrentUser ? "text-white/90" : "text-gray-500"}`}>
                                  {entry.manager_email}
                                </p>
                              </td>
                              <td className={`p-4 text-center text-body font-bold tabular-nums ${isCurrentUser ? "text-white" : "text-gray-900"}`}>
                                {/* 👇 Conditional Text Color */}
                                {entry.total_points}
                              </td>
                            </motion.tr>
                          );
                        })}
                        </motion.tbody>
                      </table>
                    </div>
                    
                    {/* --- MOBILE CARD LIST (Hidden on desktop) --- */}
                    <div className="md:hidden">
                        <motion.div initial="hidden" animate="visible" variants={containerVariants}>
                           {paginatedData.map(entry => (
                            <div key={entry.user_id || `${entry.manager_email}-${entry.rank}`} onClick={() => handleRowClick(entry)}>
                              <LeaderboardCard entry={entry} isCurrentUser={entry.manager_email === user?.email} isSeasonStarted={isSeasonStarted} />
                            </div>
                           ))}
                        </motion.div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div variants={containerVariants} className="mt-6 flex items-center justify-center">
              <div className="flex items-center space-x-2 glass rounded-full p-1">
                <Button variant="icon" size="icon" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="disabled:opacity-50">
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-caption text-pl-white/80 tabular-nums">
                  Page {currentPage} of {totalPages}
                </span>
                <Button variant="icon" size="icon" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="disabled:opacity-50">
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Leaderboard;