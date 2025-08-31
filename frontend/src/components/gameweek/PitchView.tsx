import React from 'react';
import PlayerCard from '@/components/layout/PlayerCard'; 
import pitchBackground from '@/assets/images/pitch.svg';
import { P } from 'node_modules/framer-motion/dist/types.d-Cjd591yU';

interface PitchViewProps {
  playersByPos: any;
  bench: any[];
  onPlayerClick: (player: any) => void;
}

export const PitchView: React.FC<PitchViewProps> = ({ playersByPos, bench, onPlayerClick }) => {
  
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
        <div className="flex justify-center items-center gap-x-8 sm:gap-x-12">
          {playersByPos.FWD.map(p => <div key={p.id} onClick={() => onPlayerClick(p)} className="cursor-pointer"><PlayerCard player={p} />
          <PlayerCard player={{
                id: p.id,
                name: p.full_name,
                pos: p.position,
                team: p.team.name,
                points: 0, // Placeholder
                isCaptain: p.is_captain,
                isVice: p.is_vice_captain
              }} />
          </div>)}
        </div>
        <div className="flex justify-center items-center gap-x-8 sm:gap-x-12">
          {playersByPos.MID.map(p => <div key={p.id} onClick={() => onPlayerClick(p)} className="cursor-pointer"><PlayerCard player={p} />
          <PlayerCard player={{
                id: p.id,
                name: p.full_name,
                pos: p.position,
                team: p.team.name,
                points: 0, // Placeholder
                isCaptain: p.is_captain,
                isVice: p.is_vice_captain
              }} />
          </div>)}
        </div>
        <div className="flex justify-center items-center gap-x-8 sm:gap-x-12">
          {playersByPos.DEF.map(p => <div key={p.id} onClick={() => onPlayerClick(p)} className="cursor-pointer"><PlayerCard player={p} />
          <PlayerCard player={{
                id: p.id,
                name: p.full_name,
                pos: p.position,
                team: p.team.name,
                points: 0, // Placeholder
                isCaptain: p.is_captain,
                isVice: p.is_vice_captain
              }} />
          </div>)}
        </div>
        <div className="flex justify-center items-center">
          {playersByPos.GK.map(p => <div key={p.id} onClick={() => onPlayerClick(p)} className="cursor-pointer"><PlayerCard player={p} />
          <PlayerCard player={{
                id: p.id,
                name: p.full_name,
                pos: p.position,
                team: p.team.name,
                points: 0, // Placeholder
                isCaptain: p.is_captain,
                isVice: p.is_vice_captain
              }} /></div>)}
        
        </div>
      </main>
      <footer className="flex-shrink-0 p-3 bg-gray-100 border-t">
        <div className="grid grid-cols-3 gap-4 place-items-center">
          {bench.map(p => (
            <div key={p.id} onClick={() => onPlayerClick(p)} className="cursor-pointer"><PlayerCard player={p} isBench={true} />
            <PlayerCard player={{
                id: p.id,
                name: p.full_name,
                pos: p.position,
                team: p.team.name,
                points: 0, // Placeholder
                isCaptain: p.is_captain,
                isVice: p.is_vice_captain
              }} />
            </div>
          ))}
        </div>
      </footer>
    </>
  );
};
