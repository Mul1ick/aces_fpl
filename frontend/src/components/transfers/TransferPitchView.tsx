// frontend/src/components/transfers/TransferPitchView.tsx

import React, { useState } from 'react';
import { PlusCircle, X } from 'lucide-react';
import pitchBackground from '@/assets/images/pitch.png';
import PlayerCard from '@/components/layout/PlayerCard';
import PlayerDetailModal from './PlayerDetailModal';

const PlayerSlot = ({ position, onClick }: { position: string; onClick: () => void; }) => (
  <button
    onClick={onClick}
    className="w-20 h-24 bg-black/20 border-2 border-dashed border-white/30 rounded-lg flex flex-col items-center justify-center text-white/50 hover:bg-white/10 hover:border-white/50 transition-all"
  >
    <PlusCircle className="w-8 h-8" />
    <span className="text-xs font-bold mt-1">{position}</span>
  </button>
);

interface TransferPitchViewProps {
  squad: any;
  onSlotClick: (pos: string, index: number) => void;
  onPlayerRemove: (pos: string, index: number) => void;
  onStartTransfer?: (player: any, pos: string, index: number) => void;
}

export const TransferPitchView = ({ squad, onSlotClick, onPlayerRemove, onStartTransfer }: TransferPitchViewProps) => {
    const [detailedPlayer, setDetailedPlayer] = useState<any | null>(null);

    const handlePlayerClick = (player: any) => {
        setDetailedPlayer(player);
    };

    const handleRemove = (pos: string, index: number) => {
        onPlayerRemove(pos, index);
        setDetailedPlayer(null);
    };
    
    return (
        <>
            <main
                className="relative flex flex-col justify-around py-4"
                style={{
                 backgroundImage: `url(${pitchBackground})`,
                backgroundSize: 'cover',
                 backgroundPosition: 'center top',
                }}
            >
                {Object.keys(squad).map((pos) => (
                // --- MODIFIED LINE BELOW ---
                <div key={pos} className="flex justify-center items-center gap-x-8 sm:gap-x-12 my-2">
                    {squad[pos].map((player: any, index: number) =>
                     player ? (
                        <div
                            key={player.id}
                            className="relative group bg-black/40 rounded-lg hover:bg-black/50 transition-colors"
                            onClick={() => handlePlayerClick(player)}
                        >
                            <div className="pointer-events-none">
                                  <PlayerCard 
                                     player={{
                                        ...player,
                                         team: player.club 
                                    }} 
                                     displayMode="fixture" 
                                     showArmbands={false} 
                                 />
                            </div>
                            <button
                               onClick={(e) => {
                                   e.stopPropagation();
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
                        const playerPos = detailedPlayer.position;
                        const playerIndex = squad[playerPos]?.findIndex((p: any) => p && p.id === detailedPlayer.id);
                        if(playerIndex !== -1) {
                            handleRemove(playerPos, playerIndex);
                        }
                    }
                }}
                onTransfer={(p) => {
                   if (!p) return;
                    const posKey = String(p.pos ?? p.position ?? '').toUpperCase();
                    const idx = squad[posKey]?.findIndex((x:any) => x && x.id === p.id) ?? -1;
                    if (idx >= 0) {
                      setDetailedPlayer(null);
                      onStartTransfer?.(p, posKey, idx);
                    }
                }}
            />
        </>
    );
};