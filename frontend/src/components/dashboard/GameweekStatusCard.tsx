import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const GameweekStatusCard: React.FC = () => {
  return (
    <Card className="h-full border-black border-2">
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
        <div className="text-center flex flex-col items-center">
          <Avatar className="w-12 h-12 mb-2">
              <AvatarImage src="https://placehold.co/100x100/6a11cb/FFFFFF/png?text=Chips" />
              <AvatarFallback>C</AvatarFallback>
          </Avatar>
          <p className="font-bold text-lg">5</p>
          <p className="text-xs text-gray-500">Chips Played</p>
        </div>
        <div className="text-center flex flex-col items-center">
          <Avatar className="w-12 h-12 mb-2">
              <AvatarImage src="https://placehold.co/100x100/000000/FFFFFF/png?text=S" />
              <AvatarFallback>S</AvatarFallback>
          </Avatar>
          <p className="font-bold text-lg">Son</p>
          <p className="text-xs text-gray-500">Most Captained</p>
        </div>
        <div className="text-center flex flex-col items-center">
          <Avatar className="w-12 h-12 mb-2">
              <AvatarImage src="https://placehold.co/100x100/000000/FFFFFF/png?text=F" />
              <AvatarFallback>F</AvatarFallback>
          </Avatar>
          <p className="font-bold text-lg">Fernandes</p>
          <p className="text-xs text-gray-500">Most Vice-Captained</p>
        </div>
        <div className="text-center flex flex-col items-center">
          <Avatar className="w-12 h-12 mb-2">
              <AvatarImage src="https://placehold.co/100x100/000000/FFFFFF/png?text=H" />
              <AvatarFallback>H</AvatarFallback>
          </Avatar>
          <p className="font-bold text-lg">Haaland</p>
          <p className="text-xs text-gray-500">Most Selected</p>
        </div>
      </CardContent>
    </Card>
  );
};
