import React from 'react';
import { PlusCircle } from 'lucide-react';
import PlayerCard from '@/components/layout/PlayerCard'; 
import pitchBackground from '@/assets/images/pitch.svg';

const PlayerSlot = ({ position, onClick }) => (
  <button 
    onClick={onClick}
    className="w-20 h-24 bg-black/20 border-2 border-dashed border-white/30 rounded-lg flex flex-col items-center justify-center text-white/50 hover:bg-white/10 hover:border-white/50 transition-all"
  >
    <PlusCircle className="w-8 h-8" />
    <span className="text-xs font-bold mt-1">{position}</span>
  </button>
);

export const TransferPitchView = ({ squad, onSlotClick }) => (
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
            <PlayerCard key={player.id} player={player} />
          ) : (
            <PlayerSlot key={`${pos}-${index}`} position={pos} onClick={() => onSlotClick(pos, index)} />
          )
        )}
      </div>
    ))}
  </main>
);
