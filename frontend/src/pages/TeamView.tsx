import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GameweekHeader } from '@/components/gameweek/GameweekHeader';
import { PitchView } from '@/components/gameweek/PitchView';
import { ListView } from '@/components/gameweek/ListView';
import { PlayerDetailCard } from '@/components/gameweek/PlayerDetailCard';
import { TeamViewInfoCard } from '@/components/team/TeamViewInfoCard'; // <-- 1. IMPORT THE NEW CARD

// --- Placeholder Data for an 8+3 Squad ---
const mockTeamData = {
  team_name: "Pique Blinders",
  manager_name: "King Kenny",
  gameweek_points: 74,
  average_points: 63,
  highest_points: 139,
  gw_rank: "2,575,654",
  transfers: "2(-4 pts)",
  // Stats for the ManagerInfoCard
  stats: {
    overall_points: 1320,
    total_players: 11,
    gameweek_points: 74,
  },
  overallRank: 492326,
  // 8 starting players (1-3-3-1 formation)
  starting: [
    { id: 1, full_name: 'Pickford', position: 'GK', team: { name: 'Southside' }, points: 6, is_captain: false, is_vice_captain: false, is_benched: false },
    { id: 2, full_name: 'Cucurella', position: 'DEF', team: { name: 'Traana' }, points: 1, is_captain: false, is_vice_captain: false, is_benched: false },
    { id: 3, full_name: 'Gusto', position: 'DEF', team: { name: 'Traana' }, points: 6, is_captain: false, is_vice_captain: false, is_benched: false },
    { id: 4, full_name: 'Romero', position: 'DEF', team: { name: 'Satans' }, points: 12, is_captain: false, is_vice_captain: false, is_benched: false },
    { id: 5, full_name: 'Semenyo', position: 'MID', team: { name: 'Southside' }, points: 13, is_captain: false, is_vice_captain: false, is_benched: false },
    { id: 6, full_name: 'Mbeumo', position: 'MID', team: { name: 'Satans' }, points: 2, is_captain: false, is_vice_captain: true, is_benched: false },
    { id: 7, full_name: 'Enzo', position: 'MID', team: { name: 'Traana' }, points: 4, is_captain: false, is_vice_captain: false, is_benched: false },
    { id: 10, full_name: 'Haaland', position: 'FWD', team: { name: 'Roarers' }, points: 13, is_captain: true, is_vice_captain: false, is_benched: false },
  ],
  // 3 substitutes
  bench: [
    { id: 12, full_name: 'Verbruggen', position: 'GK', team: { name: 'Southside' }, points: 2, is_captain: false, is_vice_captain: false, is_benched: true },
    { id: 9, full_name: 'Watkins', position: 'FWD', team: { name: 'Southside' }, points: 2, is_captain: false, is_vice_captain: false, is_benched: true },
    { id: 11, full_name: 'Joao Pedro', position: 'FWD', team: { name: 'Southside' }, points: 14, is_captain: false, is_vice_captain: false, is_benched: true },
  ],
};

const TeamView: React.FC = () => {
  const { gw, userId } = useParams();
  const navigate = useNavigate();
  const [view, setView] = useState('pitch');
  const [teamData, setTeamData] = useState<any>(mockTeamData);
  const [detailedPlayer, setDetailedPlayer] = useState(null);
  
  useEffect(() => {
    console.log(`Fetching data for GW ${gw} and User ${userId || 'Top Player'}`);
    setTeamData(mockTeamData);
  }, [gw, userId]);

  const handleNavigation = (direction: 'next' | 'prev') => {
    const currentGw = parseInt(gw || '1', 10);
    const newGw = direction === 'next' ? currentGw + 1 : currentGw - 1;
    if (newGw > 0) {
      navigate(`/team-view/${userId || 'top'}/${newGw}`);
    }
  };

  const playersByPos = {
    GK: teamData.starting.filter(p => p.position === 'GK'),
    DEF: teamData.starting.filter(p => p.position === 'DEF'),
    MID: teamData.starting.filter(p => p.position === 'MID'),
    FWD: teamData.starting.filter(p => p.position === 'FWD'),
  };

  const allPlayers = [...teamData.starting, ...teamData.bench];

  return (
    <div className="w-full min-h-screen bg-white flex flex-col lg:flex-row font-sans">
      {/* --- Left Column (Manager Info on Desktop) --- */}
      <div className="hidden lg:block lg:w-2/5 p-4">
        <div className="lg:sticky lg:top-4">
            {/* --- 2. USE THE NEW CARD COMPONENT --- */}
            <TeamViewInfoCard 
              teamName={teamData.team_name}
              managerName={teamData.manager_name}
              stats={teamData.stats}
              overallRank={teamData.overallRank}
            />
        </div>
      </div>

      {/* --- Right Column / Main Content --- */}
      <div className="flex flex-col flex-1 lg:w-3/5">
        <div className="lg:m-4 lg:border-2 lg:border-gray-300 lg:rounded-lg flex flex-col flex-grow">
          <div className="bg-gradient-to-b from-[#37003C] to-[#23003F] p-4 lg:rounded-t-lg">
            <GameweekHeader
              gw={gw}
              view={view}
              setView={setView}
              teamName={teamData.team_name}
              totalPoints={teamData.gameweek_points}
              averagePoints={teamData.average_points}
              highestPoints={teamData.highest_points}
              gwRank={teamData.gw_rank}
              freeTransfers={teamData.transfers}
              onNavigate={handleNavigation}
            />
          </div>

          {view === 'pitch' ? (
            <PitchView
              playersByPos={playersByPos}
              bench={teamData.bench}
              onPlayerClick={setDetailedPlayer}
            />
          ) : (
            <ListView players={allPlayers} />
          )}
        </div>
      </div>

       {/* --- Manager Info Card (Mobile Only) --- */}
       <div className="block lg:hidden p-4">
        <TeamViewInfoCard 
            teamName={teamData.team_name}
            managerName={teamData.manager_name}
            stats={teamData.stats}
            overallRank={teamData.overallRank}
        />
      </div>

      <AnimatePresence>
        {detailedPlayer && (
          <PlayerDetailCard
            player={detailedPlayer}
            onClose={() => setDetailedPlayer(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeamView;