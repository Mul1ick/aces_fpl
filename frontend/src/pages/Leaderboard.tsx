import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/fpl-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/fpl-card";
import { Input } from "@/components/ui/input";

// Mock Data - Replace with API call
const generateMockLeaderboard = (currentUserEmail: string) => {
  const data = Array.from({ length: 150 }, (_, i) => ({
    rank: i + 1,
    manager: `Manager ${i + 1}`,
    teamName: `Team ${i + 1}`,
    gwPoints: Math.floor(Math.random() * 50) + 40,
    totalPoints: 1500 - i * 5 - Math.floor(Math.random() * 20),
    email: `manager${i+1}@test.com`
  }));
  // Ensure the current user is in the list
  const currentUserIndex = data.findIndex(d => d.email === currentUserEmail);
  if (currentUserIndex === -1) {
      data[15] = { // Place the user somewhere in the list
          rank: 16,
          manager: "John Doe",
          teamName: "Aces United",
          gwPoints: 73,
          totalPoints: 1420,
          email: currentUserEmail
      };
  }
  return data.sort((a, b) => b.totalPoints - a.totalPoints).map((p, i) => ({...p, rank: i + 1}));
};


const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserEmail = user?.email || "john.doe@example.com";

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Memoize leaderboard data to avoid re-generating on each render
  const leaderboardData = useMemo(() => generateMockLeaderboard(currentUserEmail), [currentUserEmail]);

  const filteredData = useMemo(() => 
    leaderboardData.filter(
      (entry) =>
        entry.manager.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.teamName.toLowerCase().includes(searchQuery.toLowerCase())
    ), [leaderboardData, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-pl-purple">
      {/* Header */}
      <div className="border-b border-pl-border sticky top-0 bg-pl-purple/80 backdrop-blur-lg z-20">
        <div className="container mx-auto px-6 py-4 max-w-[1100px]">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="text-pl-white/80"
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
            
            <div className="text-center">
              <h1 className="text-h2 font-bold text-pl-white">Global League</h1>
            </div>

            <div className="w-20" /> {/* Spacer */}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-[1100px]">
        <motion.div initial="hidden" animate="visible" variants={containerVariants}>
          {/* Search and Info Card */}
          <motion.div variants={itemVariants}>
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
                      setCurrentPage(1); // Reset to first page on search
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

          {/* Leaderboard Table */}
          <motion.div variants={itemVariants}>
            <Card variant="glass">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-pl-border">
                      <tr>
                        <th className="p-4 text-caption font-semibold text-pl-white/60 w-16 text-center">Rank</th>
                        <th className="p-4 text-caption font-semibold text-pl-white/60">Team & Manager</th>
                        <th className="p-4 text-caption font-semibold text-pl-white/60 text-center">GW</th>
                        <th className="p-4 text-caption font-semibold text-pl-white/60 text-center">Total</th>
                      </tr>
                    </thead>
                    <motion.tbody initial="hidden" animate="visible" variants={containerVariants}>
                      {paginatedData.map((entry) => (
                        <motion.tr
                          key={entry.rank}
                          variants={itemVariants}
                          className={`border-b border-pl-border last:border-b-0 transition-colors ${
                            entry.email === currentUserEmail
                              ? "bg-pl-green/10 hover:bg-pl-green/20"
                              : "hover:bg-pl-white/5"
                          }`}
                        >
                          <td className="p-4 text-center">
                            <span className={`font-semibold tabular-nums ${
                              entry.email === currentUserEmail ? "text-pl-green" : "text-pl-white"
                            }`}>
                              {entry.rank}
                            </span>
                          </td>
                          <td className="p-4">
                            <p className="font-semibold text-pl-white">{entry.teamName}</p>
                            <p className="text-caption text-pl-white/60">{entry.manager}</p>
                          </td>
                          <td className="p-4 text-center text-body text-pl-white tabular-nums">{entry.gwPoints}</td>
                          <td className="p-4 text-center text-body font-bold text-pl-white tabular-nums">{entry.totalPoints}</td>
                        </motion.tr>
                      ))}
                    </motion.tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div variants={itemVariants} className="mt-6 flex items-center justify-center">
              <div className="flex items-center space-x-2 glass rounded-full p-1">
                <Button
                  variant="icon"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="disabled:opacity-50"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-caption text-pl-white/80 tabular-nums">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="icon"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="disabled:opacity-50"
                >
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
