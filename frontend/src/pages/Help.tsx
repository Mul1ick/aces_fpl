import React from 'react';
import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// --- UPDATED: New data structure with scoring table ---
const scoringData = [
    { action: "Goal scored by a goalkeeper", points: 10 },
    { action: "Goal scored by a defender", points: 6 },
    { action: "Goal scored by a midfielder", points: 5 },
    { action: "Goal scored by a forward", points: 4 },
    { action: "For each assist for a goal", points: 3 },
    { action: "Clean sheet by a GK or defender", points: 4 },
    { action: "Clean sheet by a midfielder", points: 1 },
    { action: "Bonus points for best players", points: "1 to 3" },
    { action: "For each penalty save by a GK", points: 5 },
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
                answer: "Before the first gameweek, you have unlimited free transfers. After the season begins, you get 2 free transfer per gameweek. If you don’t use your free transfer, it will not be carried over to next gameweek. Any additional transfers beyond your available free ones will cost -4 points each."
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
            answer: (
                <div className="space-y-4 text-pl-white/80">
                    
                    <ul className="list-disc pl-5 space-y-2">
                        <li>
                            <span className="font-semibold text-pl-white">Wildcard:</span> Lets you make unlimited transfers in a gameweek with no points deduction and your new team stays for future weeks.
                        </li>
                        <li>
                            <span className="font-semibold text-pl-white">Bench Boost:</span> All points scored by your bench players are added to your total for that gameweek.
                        </li>
                        <li>
                            <span className="font-semibold text-pl-white">Free Hit:</span> Allows unlimited transfers for one gameweek only, after which your team automatically reverts back to the earlier version.
                        </li>
                        <li>
                            <span className="font-semibold text-pl-white">Triple Captain:</span> Your captain earns triple points instead of double for that gameweek.
                        </li>
                    </ul>

                    <div className="rounded-lg border border-pl-border bg-pl-white/5 p-4 text-sm">
                        <p className="font-semibold text-pl-white mb-1">Important Rules</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Each chip can only be used <span className="font-semibold">once per season</span>.</li>
                            <li>Once a chip is activated, it <span className="font-semibold">cannot be cancelled</span>.</li>
                        </ul>
                    </div>

                </div>
            )
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