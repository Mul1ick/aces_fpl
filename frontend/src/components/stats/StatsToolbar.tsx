import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// --- NEW: Import the centralized logo utility ---
import { getTeamLogo } from '@/lib/player-utils';

const Teams = [
    { name: 'Umang', shortName: 'UMA' },
    { name: 'Satans', shortName: 'SAT' },
    { name: 'Aer Titans', shortName: 'AER' },
    { name: 'Trana', shortName: 'TRA' },
    { name: 'Roarers', shortName: 'ROA' },
    { name: 'Casuals FC', shortName: 'CAS' },
    { name: 'Cathect', shortName: 'CAT' },
    { name: 'Encore United', shortName: 'ENC' },
    { name: 'Matero Power 8s', shortName: 'MAT' },
    { name: 'Wolfpack FC', shortName: 'WOLF' },
    { name: 'Youngblood FC', shortName: 'YBFC' },
    { name: 'Majithia Reality FC', shortName: 'MRFC' },
];

interface FilterSelection {
  type: 'global' | 'position' | 'team';
  value: string;
}

interface StatsToolbarProps {
  onFilterChange: (selection: FilterSelection) => void;
  onReset: () => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
}

const FilterSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="border-b border-gray-200 last:border-b-0 py-4">
        <h3 className="text-sm font-semibold text-gray-500 px-4 mb-3">{title}</h3>
        {children}
    </div>
);

export const StatsToolbar: React.FC<StatsToolbarProps> = ({ onFilterChange, onReset, sortBy, onSortByChange }) => {
  const [currentFilter, setCurrentFilter] = useState<FilterSelection>({ type: 'global', value: 'All players' });
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false); 

  const handleSelect = (selection: FilterSelection) => {
    setCurrentFilter(selection);
    onFilterChange(selection);
    setIsPopoverOpen(false);
  };
  
  const handleReset = () => {
    const defaultFilter = { type: 'global' as const, value: 'All players' };
    setCurrentFilter(defaultFilter);
    onReset();
  }

  const handleSortSelect = (value: string) => {
    onSortByChange(value);
    setIsSortOpen(false);
  };
  
  const sortLabel = {
    points: 'Total Points',
    price: 'Price',
    tsb: 'Selection %'
  }[sortBy] || 'Sort By';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
      className="flex items-center gap-2 mb-6"
    >
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
            <Button className="bg-pl-white/5 border border-pl-white/20 hover:bg-pl-white/10 rounded-lg text-pl-white flex items-center justify-between w-48 h-10">
                <span>{currentFilter.value}</span>
                <ChevronDown className="size-4 opacity-60" />
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[calc(100vw-2rem)] md:w-[500px] bg-white p-0" align="start">
            <FilterSection title="Global">
                <button onClick={() => handleSelect({ type: 'global', value: 'All players' })} className="w-full text-left px-4 py-2 text-body hover:bg-gray-100 rounded-lg">All players</button>
            </FilterSection>
            <FilterSection title="Position">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 px-4">
                    <button onClick={() => handleSelect({ type: 'position', value: 'Goalkeepers' })} className="text-left px-4 py-2 text-body hover:bg-gray-100 rounded-lg">Goalkeepers</button>
                    <button onClick={() => handleSelect({ type: 'position', value: 'Defenders' })} className="text-left px-4 py-2 text-body hover:bg-gray-100 rounded-lg">Defenders</button>
                    <button onClick={() => handleSelect({ type: 'position', value: 'Midfielders' })} className="text-left px-4 py-2 text-body hover:bg-gray-100 rounded-lg">Midfielders</button>
                    <button onClick={() => handleSelect({ type: 'position', value: 'Forwards' })} className="text-left px-4 py-2 text-body hover:bg-gray-100 rounded-lg">Forwards</button>
                </div>
            </FilterSection>
            <FilterSection title="Teams">
                {/* Made grid 3 cols on mobile, 4 on desktop so all 12 teams fit nicely */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-2 gap-y-2 px-4 max-h-48 overflow-y-auto">
                    {Teams.map(team => (
                        <button key={team.name} onClick={() => handleSelect({ type: 'team', value: team.name })} className="flex flex-col items-center justify-center space-y-1 text-center p-2 hover:bg-gray-100 rounded-lg">
                            <img src={getTeamLogo(team.shortName)} alt={team.name} className="w-8 h-8 object-contain" />
                            <span className="text-[10px] font-bold text-gray-700 leading-tight">{team.name}</span>
                        </button>
                    ))}
                </div>
            </FilterSection>
        </PopoverContent>
      </Popover>

      <Popover open={isSortOpen} onOpenChange={setIsSortOpen}>
        <PopoverTrigger asChild>
            <Button className="bg-pl-white/5 border border-pl-white/20 hover:bg-pl-white/10 rounded-lg text-pl-white flex items-center justify-between w-48 h-10">
                <span>{sortLabel}</span>
                <ChevronDown className="size-4 opacity-60" />
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-0 bg-white" align="start">
           <RadioGroup value={sortBy} onValueChange={handleSortSelect} className="p-2">
              <div className="space-y-1">
                  <Label htmlFor="points" className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer"><RadioGroupItem value="points" id="points" /><span>Total Points</span></Label>
                  <Label htmlFor="price" className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer"><RadioGroupItem value="price" id="price" /><span>Price</span></Label>
              </div>
          </RadioGroup>
        </PopoverContent>
      </Popover>

      <Button 
        className="bg-pl-white/5 border border-pl-white/20 hover:bg-pl-white/10 rounded-lg text-pl-white h-10" 
        onClick={handleReset}
      >
        <RotateCcw className="size-4 mr-2" />
        Reset
      </Button>
    </motion.div>
  );
};