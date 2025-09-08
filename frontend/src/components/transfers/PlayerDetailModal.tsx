import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// --- ASSET IMPORTS ---
import tshirtRed from '@/assets/images/jerseys/tshirt-red.png';
import tshirtBlue from '@/assets/images/jerseys/tshirt-blue.png';
import tshirtWhite from '@/assets/images/jerseys/tshirt-white.png';
import tshirtBlack from '@/assets/images/jerseys/tshirt-black.png';
import tshirtNavy from '@/assets/images/jerseys/tshirt-navy.png';
import tshirtGreen from '@/assets/images/jerseys/tshirt-green.png';

// --- CONFIGURATION ---
const TEAM_JERSEYS = {
  'Satan': tshirtRed,
  'Bandra United': tshirtBlue,
  'Mumbai Hotspurs': tshirtWhite,
  'Southside': tshirtBlack,
  'Titans': tshirtNavy,
  'Umaag Foundation Trust': tshirtGreen,
};

const getPos = (p: any) => String(p?.pos ?? p?.position ?? '').toUpperCase();
const getName = (p: any) => p?.name ?? p?.full_name ?? '';
const getClub = (p: any) => p?.club ?? p?.team?.name ?? p?.team_name ?? '';

const PlayerDetailModalContent = ({ player, onRemove,onTransfer,   onClose,   }: {
  player: any;
  onRemove: () => void;
  onTransfer?: (player: any) => void;
  onClose: () => void;
}) => {
    const jerseySrc = TEAM_JERSEYS[player.club] || tshirtWhite;
    const form = [ { gw: 1, opp: 'BUR', pts: 9 }, { gw: 2, opp: 'MCI', pts: 9 }, { gw: 3, opp: 'CHE', pts: 2 }, { gw: 4, opp: 'TOT', pts: 6 }, { gw: 5, opp: 'MUN', pts: 7 }, ];
    const fixtures = [ { gw: 6, opp: 'BOU (H)', fdr: 3 }, { gw: 7, opp: 'WHU (A)', fdr: 2 }, { gw: 8, opp: 'BHA (A)', fdr: 3 }, ];

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
                <div className="grid grid-cols-4 gap-2 text-center text-xs mb-4">
                    <div className="bg-gray-100 p-2 rounded-md"><p className="font-bold">£{player.price?.toFixed(1)}m</p><p>Price</p></div>
                    <div className="bg-gray-100 p-2 rounded-md"><p className="font-bold">9.0</p><p>Form</p></div>
                    <div className="bg-gray-100 p-2 rounded-md"><p className="font-bold">9.0</p><p>Pts/Match</p></div>
                    <div className="bg-gray-100 p-2 rounded-md"><p className="font-bold">{player.tsb}%</p><p>TSB %</p></div>
                </div>
                <div className="space-y-4">
                    <div>
                        <h4 className="font-bold text-sm mb-2">Form</h4>
                        <div className="flex justify-around text-center text-xs">
                            {form.map(f => (<div key={f.gw}><p className="font-semibold">{f.opp}</p><p className="font-bold mt-1">{f.pts}pts</p></div>))}
                        </div>
                    </div>
                     <div>
                        <h4 className="font-bold text-sm mb-2">Fixtures</h4>
                        <div className="flex justify-around text-center text-xs">
                            {fixtures.map(f => (<div key={f.gw}><p className="font-semibold">{f.opp}</p><div className="mt-1 font-bold text-white w-6 h-6 flex items-center justify-center rounded bg-green-500 mx-auto">{f.fdr}</div></div>))}
                        </div>
                    </div>
                </div>
            </CardContent>
            <div className="p-4 border-t">
                <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            onTransfer?.(player); // start transfer flow
            onClose();            // close modal immediately
          }}
          title="Transfer this player"
        >
          Transfer
        </Button>
         
                <Button variant="destructive" className="w-full" onClick={() => onRemove()}>Remove</Button>
            </div>
        </>
    );
}


export const PlayerDetailModal = ({
  player,
  onClose,
  onRemove,
  onTransfer, // NEW
}: {
  player: any | null;
  onClose: () => void;
  onRemove: () => void;
  onTransfer?: (player: any) => void; // NEW
}) => {
    if (!player) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 z-50 flex"
            >
                {/* Desktop: Translucent overlay */}
                <div className="hidden lg:block w-[70%]" onClick={onClose}></div>

                {/* Mobile: Full screen / Desktop: 30% solid panel */}
                <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    className="bg-white h-full w-full lg:w-[30%] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    <PlayerDetailModalContent player={player} onRemove={onRemove}               onTransfer={onTransfer} // pass through
              onClose={onClose}  />
                    <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-4 right-4 text-white lg:hidden">
                        <X className="w-5 h-5" />
                    </Button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

export default PlayerDetailModal;
