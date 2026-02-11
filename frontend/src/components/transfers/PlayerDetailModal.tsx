// frontend/src/components/transfers/PlayerDetailModal.tsx

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getTeamJersey } from '@/lib/player-utils';

// --- SUB-COMPONENTS for the Modal ---

const StatBox = ({ label, value }: { label: string, value: string | number }) => (
    <div className="bg-gray-100 p-2 rounded-lg text-center">
        <p className="font-bold text-lg text-black">{value}</p>
        <p className="text-xs text-gray-600">{label}</p>
    </div>
);

const FixtureRow = ({ gameweek, opponent, points }: { gameweek: string, opponent: string, points: number }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-200 text-sm">
        <p className="font-semibold text-gray-800">{gameweek}</p>
        <p className="text-gray-600">{opponent}</p>
        <p className="font-bold text-black">{points} pts</p>
    </div>
);

// --- NEW STATUS BANNER COMPONENT ---
const PlayerStatusBanner = ({ player }: { player: any }) => {
    // Hide banner if player is perfectly healthy
    if (!player.status || player.status === 'ACTIVE') return null;

    const isYellow = player.chance_of_playing > 0 && player.chance_of_playing <= 75;
    const bgColor = isYellow ? 'bg-yellow-50 border-yellow-400' : 'bg-[#B2002D] border-red-500';
    const textColor = isYellow ? 'text-yellow-800' : 'text-red-800';
    const iconColor = isYellow ? 'text-yellow-600' : 'text-red-600';

    // Format the date to look like "15 Feb"
    const returnDateStr = player.return_date
        ? new Date(player.return_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        : null;

    return (
        <div className={`mb-4 p-3 border rounded-lg flex items-start gap-3 ${bgColor} ${textColor}`}>
            <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${iconColor}`} />
            <div className="flex-1">
                <p className="font-bold text-sm">
                    {player.status === 'INJURED' ? 'Injured' :
                     player.status === 'SUSPENDED' ? 'Suspended' :
                     player.status === 'UNAVAILABLE' ? 'Unavailable' : 'Doubtful'}
                     {player.chance_of_playing !== null && ` - ${player.chance_of_playing}% chance`}
                </p>
                {player.news && <p className="text-xs mt-1">{player.news}</p>}
                {returnDateStr && <p className="text-xs mt-1 font-semibold">Expected Return: {returnDateStr}</p>}
            </div>
        </div>
    );
};

const PlayerDetailModalContent = ({ player, onRemove, onTransfer, onClose }: {
  player: any;
  onRemove?: () => void;
  onTransfer?: (player: any) => void;
  onClose: () => void;
}) => {
    const jerseySrc = getTeamJersey(player.club || player.teamName);

    return (
        <>
            <CardHeader className="p-4 bg-gradient-to-r from-accent-blue to-accent-purple text-white rounded-t-2xl lg:rounded-none">
                <div className="flex items-center space-x-4">
                    <img src={jerseySrc} alt="jersey" className="w-16 h-auto" />
                    <div>
                        <p className="text-xs font-bold">{player.pos}</p>
                        <h3 className="text-2xl font-bold">{player.name}</h3>
                        <p className="font-semibold">{player.club}</p>
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="p-4 flex-1 overflow-y-auto">
                {/* --- INJECTED THE BANNER HERE --- */}
                <PlayerStatusBanner player={player} />

                {/* Stats Section */}
                <div className="mb-4">
                    <StatBox label="Price" value={`£${player.price?.toFixed(1)}m`} />
                </div>

                {/* Recent Fixtures Section */}
                <div className="space-y-4">
                    <div>
                        <h4 className="font-bold text-sm mb-2 text-black">Recent Form</h4>
                        {player.recent_fixtures && player.recent_fixtures.length > 0 ? (
                            <div className="space-y-1">
                                {player.recent_fixtures.slice(0, 5).map((fx: any) => ( // Show last 5
                                    <FixtureRow
                                        key={`gw-${fx.gw}`}
                                        gameweek={`GW${fx.gw}`}
                                        opponent={`${fx.opp} (${fx.ha})`}
                                        points={fx.points ?? 0}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500 text-center py-4">No recent fixture data available.</p>
                        )}
                    </div>
                </div>
            </CardContent>

            <div className="p-4 border-t space-y-2">
                {onTransfer && (
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                            onTransfer(player);
                            onClose();
                        }}
                        title="Transfer this player"
                    >
                        Transfer
                    </Button>
                )}
                {onRemove && (
                    <Button variant="destructive" className="w-full" onClick={onRemove}>
                        Remove
                    </Button>
                )}
            </div>
        </>
    );
};

// --- MAIN MODAL COMPONENT ---
export const PlayerDetailModal = ({ player, onClose, onRemove, onTransfer }: {
    player: any | null;
    onClose: () => void;
    onRemove?: () => void;
    onTransfer?: (player: any) => void;
}) => {
    // The modal hides itself entirely if player is null
    if (!player) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 z-[60] flex"
            >
                {/* Desktop: Translucent overlay */}
                <div className="hidden lg:block w-[70%]" onClick={onClose}></div>

                {/* Mobile: Full screen / Desktop: 30% solid panel */}
                <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    className="bg-white h-full w-full lg:w-[30%] flex flex-col ml-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <PlayerDetailModalContent 
                        player={player} 
                        onRemove={onRemove} 
                        onTransfer={onTransfer}
                        onClose={onClose}
                    />
                    <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-4 right-4 text-white lg:hidden">
                        <X className="w-5 h-5" />
                    </Button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PlayerDetailModal;