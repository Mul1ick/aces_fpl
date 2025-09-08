import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/fpl-card';
import { Users } from 'lucide-react';

const NewUserDashboard: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-pl-purple flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-lg"
            >
                <Card variant="glass" className="text-center">
                    <CardHeader>
                        <CardTitle className="text-pl-white">Welcome to Aces FPL!</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center space-y-6">
                        <p className="text-pl-white/80">
                            Your account is ready. The first step is to build your squad.
                        </p>
                        <div
                            onClick={() => navigate('/transfers')}
                            className="w-full p-6 bg-pl-white/10 rounded-2xl border-2 border-dashed border-pl-white/30 cursor-pointer hover:bg-pl-white/20 hover:border-pl-cyan transition-all"
                        >
                            <Users className="size-16 text-pl-cyan mx-auto mb-4" />
                            <h3 className="text-h2 font-bold text-pl-white">Select Your Team</h3>
                            <p className="text-caption text-pl-white/60">
                                Pick your 11 players to get started.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default NewUserDashboard;