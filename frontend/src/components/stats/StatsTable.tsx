import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/fpl-card';
import { Skeleton } from '@/components/ui/skeleton';
import { getTeamLogo } from '@/lib/player-utils';

// --- SUB-COMPONENTS ---

const PlayerRow = ({ player, index, onPlayerClick }: { player: any, index: number, onPlayerClick: (player: any) => void }) => (
    <motion.tr
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="border-b border-pl-border last:border-b-0 cursor-pointer hover:bg-pl-white/5"
        onClick={() => onPlayerClick(player)}
    >
        <td className="p-4">
            <div className="flex items-center space-x-3">
                <img src={getTeamLogo(player.team_short_name)} alt={player.team} className="w-7 h-7" />
                <div>
                    <p className="font-bold text-pl-white">{player.name}</p>
                    <p className="text-caption text-pl-white/60">{player.team} · {player.pos}</p>
                </div>
            </div>
        </td>
        <td className="p-4 text-center font-semibold text-pl-white tabular-nums">£{player.price.toFixed(1)}m</td>
        <td className="p-4 text-center font-bold text-pl-white text-body tabular-nums">{player.points}</td>
    </motion.tr>
);

const StatsLoading = () => (
    <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
                <Skeleton className="size-10 rounded-full bg-pl-white/10" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4 bg-pl-white/10" />
                    <Skeleton className="h-3 w-1/2 bg-pl-white/10" />
                </div>
                <Skeleton className="h-6 w-16 bg-pl-white/10 rounded-md" />
                <Skeleton className="h-6 w-16 bg-pl-white/10 rounded-md" />
            </div>
        ))}
    </div>
);

// --- MAIN COMPONENT ---
interface StatsTableProps {
    players: any[];
    isLoading: boolean;
    onPlayerClick: (player: any) => void;
}

export const StatsTable: React.FC<StatsTableProps> = ({ players, isLoading, onPlayerClick }) => {
    if (isLoading) {
        return <Card variant="glass"><StatsLoading /></Card>;
    }

    if (players.length === 0) {
        return (
            <Card variant="glass" className="flex items-center justify-center p-16">
                <p className="text-pl-white/60">No players match the current filters.</p>
            </Card>
        );
    }

    return (
        <Card variant="glass">
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-pl-border">
                            <tr>
                                <th className="p-4 text-caption font-semibold text-pl-white/60">Player</th>
                                <th className="p-4 text-caption font-semibold text-pl-white/60 text-center">Price</th>
                                <th className="p-4 text-caption font-semibold text-pl-white/60 text-center">Total Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {players.map((player, index) => (
                                <PlayerRow key={player.id} player={player} index={index} onPlayerClick={onPlayerClick} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};