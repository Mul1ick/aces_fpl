import React, { useState } from 'react';
import { PlusCircle, X } from 'lucide-react';
import pitchBackground from '@/assets/images/pitch.svg';
import PlayerCard from '@/components/layout/PlayerCard';
import PlayerDetailModal from './PlayerDetailModal';

const PlayerSlot = ({ position, onClick }) => (
  <button
    onClick={onClick}
    className="w-20 h-24 bg-black/20 border-2 border-dashed border-white/30 rounded-lg flex flex-col items-center justify-center text-white/50 hover:bg-white/10 hover:border-white/50 transition-all"
  >
    <PlusCircle className="w-8 h-8" />
    <span className="text-xs font-bold mt-1">{position}</span>
  </button>
);

export const TransferPitchView = ({ squad, onSlotClick, onPlayerRemove}) => {
    const [detailedPlayer, setDetailedPlayer] = useState(null);

    const handlePlayerClick = (player) => {
        setDetailedPlayer(player);
    };

    const handleRemove = (pos, index) => {
        onPlayerRemove(pos, index);
        setDetailedPlayer(null);
    }
    const transformPlayerForCard = (player) => ({
        id: player.id,
        name: player.full_name ?? player.name,
        team: player.team_name,
        pos: player.position,
        points: player.points ?? 0, // Placeholder
        fixture: player.fixture_str ?? '—',
        isCaptain: player.is_captain,
        isVice: player.is_vice_captain,
    });


    return (
        <>
            <main
                className="flex-1 relative flex flex-col justify-around py-4"
                style={{
                backgroundImage: `url(${pitchBackground})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center top',
                minHeight: '550px'
                }}
            >
                {Object.keys(squad).map((pos) => (
                <div key={pos} className="flex justify-center items-center gap-x-4">
                    {squad[pos].map((player, index) =>
                    player ? (
                        <div
                            key={player.id}
                            className="relative group bg-black/40 rounded-lg hover:bg-black/50 transition-colors"
                            onClick={() => handlePlayerClick(player)}
                        >
                            <div className="pointer-events-none">
                                <PlayerCard player={transformPlayerForCard(player)} displayMode="fixture" />
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent modal from opening
                                    onPlayerRemove(pos, index);
                                }}
                                className="absolute top-1 right-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all hidden lg:flex items-center justify-center w-5 h-5"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ) : (
                        <PlayerSlot key={`${pos}-${index}`} position={pos} onClick={() => onSlotClick(pos, index)} />
                    )
                    )}
                </div>
                ))}
            </main>
            <PlayerDetailModal
                player={detailedPlayer}
                onClose={() => setDetailedPlayer(null)}
                onRemove={() => {
                    if (detailedPlayer) {
                        const playerPos = detailedPlayer.pos;
                        const playerIndex = squad[playerPos].findIndex(p => p && p.id === detailedPlayer.id);
                        if(playerIndex !== -1) {
                            handleRemove(playerPos, playerIndex);
                        }
                    }
                }}
            />
        </>
    );
};
