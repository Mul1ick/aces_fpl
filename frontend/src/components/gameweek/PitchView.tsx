import React from 'react';
import PlayerCard from '@/components/layout/PlayerCard'; 
import pitchBackground from '@/assets/images/pitch.png';
import { ChipName } from '@/lib/api';

interface PitchViewProps {
  playersByPos: any;
  bench: any[];
  onPlayerClick: (player: any) => void;
  activeChip?: ChipName | null; // This prop is now correctly added
}

export const PitchView: React.FC<PitchViewProps> = ({ playersByPos, bench, onPlayerClick, activeChip }) => {
  
  return (
    <>
      <main 
        className="flex-1 relative flex flex-col justify-around py-4"
        style={{ 
          backgroundImage: `url(${pitchBackground})`,
          backgroundSize: 'cover',
           backgroundPosition: 'center top'
        }}
      >
        {/* Goalkeeper (Top of Pitch) */}
        <div className="flex justify-center items-center">
          {playersByPos.GK.map((p: any) => (
            <div key={p.id} onClick={() => onPlayerClick(p)} className="cursor-pointer">
              <PlayerCard 
                player={{
                  id: p.id,
                  name: p.full_name,
                  pos: p.position,
                  team: p.team.name,
                  points: p.points,
                  isCaptain: p.is_captain,
                  isVice: p.is_vice_captain
                }} 
                activeChip={activeChip} // Pass prop down
              />
            </div>
          ))}
        </div>

        {/* Defenders */}
        <div className="flex justify-center items-center gap-x-8 sm:gap-x-12">
           {playersByPos.DEF.map((p: any) => (
            <div key={p.id} onClick={() => onPlayerClick(p)} className="cursor-pointer">
              <PlayerCard 
                player={{
                  id: p.id,
                  name: p.full_name,
                  pos: p.position,
                  team: p.team.name,
                  points: p.points,
                  isCaptain: p.is_captain,
                  isVice: p.is_vice_captain
                }} 
                activeChip={activeChip} // Pass prop down
              />
            </div>
           ))}
        </div>

        {/* Midfielders */}
        <div className="flex justify-center items-center gap-x-8 sm:gap-x-12">
          {playersByPos.MID.map((p: any) => (
            <div key={p.id} onClick={() => onPlayerClick(p)} className="cursor-pointer">
              <PlayerCard 
                player={{
                  id: p.id,
                  name: p.full_name,
                  pos: p.position,
                  team: p.team.name,
                  points: p.points,
                  isCaptain: p.is_captain,
                  isVice: p.is_vice_captain
                }} 
                activeChip={activeChip} // Pass prop down
              />
            </div>
          ))}
        </div>

        {/* Forwards (Bottom of Pitch) */}
        <div className="flex justify-center items-center gap-x-8 sm:gap-x-12">
          {playersByPos.FWD.map((p: any) => (
            <div key={p.id} onClick={() => onPlayerClick(p)} className="cursor-pointer">
              <PlayerCard 
                player={{
                  id: p.id,
                  name: p.full_name,
                  pos: p.position,
                  team: p.team.name,
                  points: p.points ?? 0,
                  isCaptain: p.is_captain,
                  isVice: p.is_vice_captain
                }} 
                activeChip={activeChip} // Pass prop down
              />
            </div>
          ))}
        </div>
      </main>

      <footer className="flex-shrink-0 p-3 bg-gray-100 border-t">
        <div className="grid grid-cols-3 gap-4 place-items-center">
          {bench.map((p: any) => (
            <div key={p.id} onClick={() => onPlayerClick(p)} className="cursor-pointer">
              <PlayerCard 
                  isBench={true}
                  player={{
                    id: p.id,
                    name: p.full_name,
                    pos: p.position,
                    team: p.team.name,
                    points: p.points,
                    isCaptain: p.is_captain,
                    isVice: p.is_vice_captain
                  }} 
                  activeChip={activeChip} // Pass prop down
              />
            </div>
           ))}
        </div>
      </footer>
    </>
  );
};

