import React from 'react';
import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// --- UPDATED: New data structure with scoring table ---
const scoringData = [
    { action: "For entering field of play", points: 1 },
    { action: "Goal scored by a goalkeeper", points: 10 },
    { action: "Goal scored by a defender", points: 6 },
    { action: "Goal scored by a midfielder", points: 5 },
    { action: "Goal scored by a forward", points: 4 },
    { action: "For each assist for a goal", points: 3 },
    { action: "Clean sheet by a GK or defender (min 25 mins)", points: 4 },
    { action: "Clean sheet by a midfielder (min 25 mins)", points: 1 },
    { action: "Bonus points for best players", points: "1 to 3" },
    { action: "For every 2 goals conceded by a GK or defender", points: -1 },
    { action: "For each penalty miss", points: -2 },
    { action: "For each yellow card", points: -1 },
    { action: "For each red card", points: -3 },
    { action: "For each own goal", points: -2 },
];

const helpSections = [
    {
        title: "Squad & Transfers",
        questions: [
            {
                question: "How many transfers do I get?",
                answer: "Before the first gameweek, you have unlimited free transfers. After the season begins, you get 1 free transfer per gameweek. If you don’t use your free transfer, it will be carried over, but you can only have a maximum of 2 free transfers at any time. Any additional transfers beyond your available free ones will cost -4 points each."
            }
        ]
    },
    {
        title: "Managing Your Team",
        questions: [
            {
                question: "What are the formation rules?",
                answer: "Your starting 8 must always include at least 1 Goalkeeper and a minimum of 2 Defenders. The remaining 5 players in your starting lineup can be from any position."
            },
            {
                question: "Can I make changes during a live gameweek?",
                answer: "You can make unlimited changes to your starting XI (substitutions, captain changes) until the gameweek deadline. Once the deadline passes, your team is locked for that gameweek. Any transfers you make after the deadline will apply to the next gameweek."
            }
        ]
    },
    {
        title: "Chips",
        questions: [
            {
                question: "What chips are available and how do they work?",
                answer: "You have two chips, each can be used once per season: Wildcard (unlimited free transfers for one gameweek) and Triple Captain (triples your captain's points). Only one chip can be active in a single gameweek."
            }
        ]
    },
    {
        title: "Scoring & Updates",
        questions: [
            {
                question: "When are player points updated?",
                answer: "Player points for a gameweek will be fully calculated, including any bonus points, and finalized within 24 hours after the last match of that gameweek has ended."
            },
            {
                question: "How are points awarded?",
                answer: (
                    <div className="overflow-x-auto text-pl-white/80">
                        <table className="w-full text-left">
                            <thead className="bg-pl-white/10">
                                <tr>
                                    <th className="p-3 font-semibold text-pl-white">Action</th>
                                    <th className="p-3 font-semibold text-pl-white text-right">Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scoringData.map((item, index) => (
                                    <tr key={index} className="border-b border-pl-border">
                                        <td className="p-3">{item.action}</td>
                                        <td className="p-3 text-right font-bold tabular-nums">{item.points}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            }
        ]
    }
];


const Help: React.FC = () => {
    return (
        <div className="min-h-screen bg-pl-purple text-pl-white">
            <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="mb-8 text-center"
                >
                    <h1 className="text-4xl md:text-5xl font-extrabold text-pl-white">
                        Help & FAQ
                    </h1>
                    <p className="text-md text-pl-white/70 mt-2">
                        Frequently asked questions about Aces FPL.
                    </p>
                </motion.div>

                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: {},
                        visible: { transition: { staggerChildren: 0.1 } }
                    }}
                    className="space-y-6"
                >
                    {helpSections.map((section, sectionIndex) => (
                        <motion.div
                            key={sectionIndex}
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0 }
                            }}
                        >
                            <Card className="bg-pl-white/5 border border-pl-border text-pl-white">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-pl-white">{section.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Accordion type="single" collapsible className="w-full">
                                        {section.questions.map((item, itemIndex) => (
                                            <AccordionItem key={itemIndex} value={`item-${sectionIndex}-${itemIndex}`} className="border-b border-pl-border last:border-b-0">
                                                <AccordionTrigger className="text-left text-body font-bold hover:no-underline text-pl-white">
                                                    {item.question}
                                                </AccordionTrigger>
                                                <AccordionContent className="text-body text-pl-white/80 pt-2">
                                                    {item.answer}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};

export default Help;