import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Search, Filter, ArrowUpDown, DollarSign, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

// --- ASSET IMPORTS & CONSTANTS ---
import tshirtRed from '@/assets/images/jerseys/tshirt-red.png';
import tshirtBlue from '@/assets/images/jerseys/tshirt-blue.png';
import tshirtWhite from '@/assets/images/jerseys/tshirt-white.png';
import tshirtBlack from '@/assets/images/jerseys/tshirt-black.png';
import tshirtNavy from '@/assets/images/jerseys/tshirt-navy.png';
import tshirtGreen from '@/assets/images/jerseys/tshirt-green.png';

// --- MODIFIED: The jersey mapping is now complete ---
const TEAM_JERSEYS: Record<string, string> = {
  'Satan': tshirtRed,
  'Bandra United': tshirtBlue,
  'Mumbai Hotspurs': tshirtWhite,
  'Southside': tshirtBlack,
  'Titans': tshirtNavy,
  'Umaag Foundation Trust': tshirtGreen,
};

// ============================================================================
// SUB-COMPONENT: FilterModal
// ============================================================================
const FilterModal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                     initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.9 }}
                    className="w-full max-w-md bg-white rounded-lg shadow-xl"
                     onClick={(e) => e.stopPropagation()}
                >
                    <CardHeader className="border-b flex flex-row justify-between items-center">
                        <CardTitle>{title}</CardTitle>
                         <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
                    </CardHeader>
                    <CardContent className="p-4">
                        {children}
                         <Button onClick={onClose} className="w-full mt-4">Apply Filters</Button>
                    </CardContent>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

// ============================================================================
// SUB-COMPONENT: PlayerTable
// ============================================================================
const PlayerTable = ({ players, onPlayerSelect }: { players: any[], onPlayerSelect: (player: any) => void }) => (
    <table className="w-full text-left">
        <thead className="sticky top-0 bg-gray-50 z-10">
            <tr className="border-b">
            <th className="p-3 text-xs font-bold text-gray-500 uppercase">Player</th>
            <th className="p-3 text-xs font-bold text-gray-500 uppercase text-right">Price</th>
            <th className="p-3 text-xs font-bold text-gray-500 uppercase text-right">Points</th>
            </tr>
        </thead>
        <tbody>
            {players.map(player => (
            <tr key={player.id} className="border-b hover:bg-gray-100 cursor-pointer" onClick={() => onPlayerSelect(player)}>
                <td className="p-3 flex items-center space-x-3">
                 <img src={TEAM_JERSEYS[player.club] || tshirtWhite} alt="jersey" className="w-8 h-10 object-contain" />
                <div>
                    <p className="font-bold text-sm">{player.name}</p>
                    <p className="text-xs text-gray-500">{player.pos} · {player.club}</p>
                </div>
                </td>
                <td className="p-3 text-right font-bold text-sm">£{player.price.toFixed(1)}m</td>
                <td className="p-3 text-right font-bold text-sm">{player.points}</td>
             </tr>
            ))}
        </tbody>
    </table>
);

// ============================================================================
// SUB-COMPONENT: PlayerFilterControls
// ============================================================================
const PlayerFilterControls = ({ filters, setFilters, resetFilters, allTeamNames }: { filters: any, setFilters: any, resetFilters: () => void, allTeamNames: string[] }) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isPriceOpen, setIsPriceOpen] = useState(false);

    const { selectedPositions, selectedClubs, sortBy, priceRange } = filters;
    const { setSelectedPositions, setSelectedClubs, setSortBy, setPriceRange } = setFilters;

    return (
        <>
             <div className="grid grid-cols-4 gap-2">
                <Button variant="outline" onClick={() => setIsFilterOpen(true)}><Filter className="w-4 h-4 mr-2" /> Filter</Button>
                <Button variant="outline" onClick={() => setIsSortOpen(true)}><ArrowUpDown className="w-4 h-4 mr-2" /> Sort by</Button>
                 <Button variant="outline" onClick={() => setIsPriceOpen(true)}><DollarSign className="w-4 h-4 mr-2" /> Price</Button>
                 <Button variant="destructive" onClick={resetFilters}><RotateCcw className="w-4 h-4 mr-2" /> Reset</Button>
            </div>

            <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Filter Players">
                 <div className="space-y-4">
                    <div>
                         <h4 className="font-bold mb-2">Position</h4>
                        <div className="grid grid-cols-2 gap-2">
                             {['GK', 'DEF', 'MID', 'FWD'].map(pos => (
                                 <div key={pos} className="flex items-center space-x-2">
                                     <Checkbox id={pos} checked={selectedPositions.includes(pos)} onCheckedChange={(checked) => {
                                         setSelectedPositions((prev: string[]) => checked ? [...prev, pos] : prev.filter(p => p !== pos));
                                    }}/>
                                     <Label htmlFor={pos}>{pos}</Label>
                                 </div>
                            ))}
                         </div>
                     </div>
                    <div>
                        <h4 className="font-bold mb-2">Club</h4>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                             {allTeamNames.map(club => (
                                 <div key={club} className="flex items-center space-x-2">
                                     <Checkbox id={club} checked={selectedClubs.includes(club)} onCheckedChange={(checked) => {
                                         setSelectedClubs((prev: string[]) => checked ? [...prev, club] : prev.filter(c => c !== club));
                                     }}/>
                                     <Label htmlFor={club}>{club}</Label>
                                </div>
                             ))}
                         </div>
                    </div>
                </div>
             </FilterModal>
            <FilterModal isOpen={isSortOpen} onClose={() => setIsSortOpen(false)} title="Sort Players By">
                 <RadioGroup value={sortBy} onValueChange={setSortBy}>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="points" id="points" /><Label htmlFor="points">Total Points</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="price" id="price" /><Label htmlFor="price">Price</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="tsb" id="tsb" /><Label htmlFor="tsb">Team Selected By %</Label></div>
                     </div>
                </RadioGroup>
            </FilterModal>
             <FilterModal isOpen={isPriceOpen} onClose={() => setIsPriceOpen(false)} title="Filter by Price">
                <div className="p-4">
                     <Slider defaultValue={[3.5, 14.0]} min={3.5} max={14.0} step={0.1} value={priceRange} onValueChange={setPriceRange} />
                    <div className="flex justify-between mt-2 text-sm font-bold">
                        <span>£{priceRange[0].toFixed(1)}m</span>
                        <span>£{priceRange[1].toFixed(1)}m</span>
                     </div>
                 </div>
            </FilterModal>
        </>
    );
};

// ============================================================================
// MAIN COMPONENT: PlayerSelectionList
// ============================================================================
export const PlayerSelectionList: React.FC<any> = ({ onClose, onPlayerSelect, positionFilter, squad }) => {
    const [players, setPlayers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
    const [selectedClubs, setSelectedClubs] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState('points');
    const [priceRange, setPriceRange] = useState([3.5, 14.0]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        const fetchPlayers = async () => {
         try {
            const response = await fetch('http://localhost:8000/players/');
            if (!response.ok) throw new Error('API failed');
            const data = await response.json();
            const mapped = data.map((player: any) => ({
             id: player.id ?? player.full_name,
              name: player.full_name,
              pos: player.position === 'ST' ? 'FWD' : player.position,
              club: player.team?.name || 'Unknown',
              price: player.price,
              points: Math.floor(Math.random() * 50) + 100, // Placeholder points
              tsb: Math.floor(Math.random() * 50) + 30 // Placeholder selection %
            }));
            setPlayers(mapped);
          } catch (err: any) {
            console.warn('API fetch failed:', err.message);
           }
        };
         fetchPlayers();
    }, []);

    useEffect(() => {
        if (positionFilter) {
            setSelectedPositions([positionFilter]);
        } else {
            setSelectedPositions([]);
        }
     }, [positionFilter]);
     
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedPositions, selectedClubs, sortBy, priceRange]);

    const squadPlayerIds = useMemo(() => {
        if (!squad) return new Set();
        return new Set(Object.values(squad).flat().filter(p => p !== null).map((p: any) => p.id));
    }, [squad]);

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedPositions(positionFilter ? [positionFilter] : []);
        setSelectedClubs([]);
        setSortBy('points');
        setPriceRange([3.5, 14.0]);
    };

    const isFiltered = useMemo(() => {
        return (
             searchQuery.trim() !== '' ||
            (positionFilter ? selectedPositions.length > 1 : selectedPositions.length > 0) ||
            selectedClubs.length > 0 ||
            priceRange[0] !== 3.5 ||
            priceRange[1] !== 14.0
        );
    }, [searchQuery, selectedPositions, selectedClubs, priceRange, positionFilter]);
    
    const allTeamNames = useMemo(() => [...new Set(players.map(p => p.club))].sort(), [players]);

    const filteredAndSortedPlayers = useMemo(() => {
        return players
            .filter(p => {
                if (squadPlayerIds.has(p.id)) return false;
                const searchMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
                 const positionMatch = selectedPositions.length === 0 || selectedPositions.includes(p.pos);
                const clubMatch = selectedClubs.length === 0 || selectedClubs.includes(p.club);
                const priceMatch = p.price >= priceRange[0] && p.price <= priceRange[1];
                 return searchMatch && positionMatch && clubMatch && priceMatch;
            })
            .sort((a, b) => {
              if (sortBy === 'price' || sortBy === 'points' || sortBy === 'tsb') {
                return b[sortBy] - a[sortBy];
              }
              return 0;
            });
    }, [searchQuery, selectedPositions, selectedClubs, sortBy, priceRange, squadPlayerIds, players]);

    const playersByPosition = useMemo(() => {
        const grouped: Record<string, any[]> = { GK: [], DEF: [], MID: [], FWD: [] };
        filteredAndSortedPlayers.forEach(p => {
             if (grouped[p.pos]) {
                grouped[p.pos].push(p);
            }
        });
        return grouped;
    }, [filteredAndSortedPlayers]);

    const paginatedPlayers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedPlayers.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredAndSortedPlayers, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredAndSortedPlayers.length / itemsPerPage);


    return (
         <Card className="w-full h-full flex flex-col border-gray-300 border-2 rounded-none lg:rounded-lg">
            <CardHeader className="border-b">
                <div className="flex justify-between items-center">
                     <CardTitle className="text-2xl font-bold">Player Selection</CardTitle>
                     <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
                        <X className="w-5 h-5" />
                     </Button>
                </div>
                <p className="text-sm text-gray-500">Select a maximum of 2 players from a single team or 'Auto Pick' if you're short of time.</p>
                <div className="pt-4">
                     <Label className="text-sm font-bold">Find a player</Label>
                    <div className="relative mt-1">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" placeholder="Search player..." className="w-full pl-10 pr-4 py-3 border rounded-lg" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                     </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 border-b">
                 <PlayerFilterControls 
                    filters={{ selectedPositions, selectedClubs, sortBy, priceRange }}
                    setFilters={{ setSelectedPositions, setSelectedClubs, setSortBy, setPriceRange }}
                    resetFilters={resetFilters}
                    allTeamNames={allTeamNames}
                />
            </CardContent>
            
            <div className="p-4 border-b">
                <p className="text-sm font-bold text-gray-600">{filteredAndSortedPlayers.length} players shown</p>
            </div>

            <div className="flex-1 overflow-y-auto">
                {isFiltered ? (
                    <>
                        <PlayerTable players={paginatedPlayers} onPlayerSelect={onPlayerSelect} />
                         {totalPages > 1 && (
                            <div className="p-4 flex justify-center items-center gap-2 sticky bottom-0 bg-white border-t">
                                 <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft className="size-4" /></Button>
                                <span className="text-sm font-semibold">Page {currentPage} of {totalPages}</span>
                                <Button variant="outline" size="icon" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight className="size-4" /></Button>
                            </div>
                        )}
                    </>
                 ) : (
                    <div className="space-y-6 p-4">
                        {Object.entries(playersByPosition).map(([pos, posPlayers]) => (
                             posPlayers.length > 0 && (
                                <div key={pos}>
                                     <h3 className="font-bold text-lg mb-2">{pos}</h3>
                                     <PlayerTable players={posPlayers.slice(0, 5)} onPlayerSelect={onPlayerSelect} />
                                </div>
                            )
                        ))}
                    </div>
                )}
             </div>
        </Card>
    )
}

// ============================================================================
// EXPORTED COMPONENT: PlayerSelectionModal
// ============================================================================
export const PlayerSelectionModal: React.FC<any> = ({ isOpen, ...props }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div
                 initial={{ y: "100%" }}
                animate={{ y: 0 }}
                 exit={{ y: "100%" }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="fixed inset-0 bg-white z-50 flex flex-col lg:hidden"
            >
                <PlayerSelectionList {...props} />
             </motion.div>
        )}
    </AnimatePresence>
)