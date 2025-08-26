import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

// Import the new components
import { GameweekHeroCard } from "@/components/dashboard/GameweekHeroCard";
import { ManagerHubCard } from "@/components/dashboard/ManagerHubCard";
import { GameweekStatusCard } from "@/components/dashboard/GameweekStatusCard";
import { TransfersCard } from "@/components/dashboard/TransfersCard";
import { TeamOfTheWeekCard } from "@/components/dashboard/TeamOfTheWeekCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


// Mock Data
const transfersIn = [ 
    {rank: 1, name: "Salah", club: "LIV", pos: "MID", transfers: "250,123"}, 
    {rank: 2, name: "Son", club: "TOT", pos: "MID", transfers: "210,456"}, 
    {rank: 3, name: "Watkins", club: "AVL", pos: "FWD", transfers: "180,789"}
];
const transfersOut = [ 
    {rank: 1, name: "Mbeumo", club: "BRE", pos: "MID", transfers: "190,543"}, 
    {rank: 2, name: "Diaby", club: "AVL", pos: "MID", transfers: "175,123"}, 
    {rank: 3, name: "Saka", club: "ARS", pos: "MID", transfers: "150,987"}
];

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
  const { user } = useAuth();
  const [userStatus] = useState<"new_user" | "pre_deadline" | "post_deadline">("pre_deadline"); 
  const gameweekDeadline = new Date("2025-08-22T23:00:00");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

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
                  <GameweekHeroCard user={user} userStatus={userStatus} gameweekDeadline={gameweekDeadline} />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <ManagerHubCard />
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
                        <TeamOfTheWeekCard team={teamOfTheWeek} />
                    </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
      </div>
  );
};

export default Dashboard;
