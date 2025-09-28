import React from 'react';
import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const helpSections = [
    {
        title: "Squad & Transfers",
        questions: [
            {
                question: "How many transfers do I get?",
                answer: "Before the first gameweek, you have unlimited free transfers to build your initial squad. After the season begins, you get 1 free transfer per gameweek. Any additional transfers will cost you -4 points each."
            },
            {
                question: "Can I save my free transfer?",
                answer: "Yes. If you don’t use your free transfer, it will be carried over to the next gameweek. However, you can only have a maximum of 2 free transfers at any one time."
            }
        ]
    },
    {
        title: "Managing Your Team",
        questions: [
            {
                question: "What are the formation rules for the starting lineup?",
                answer: "Your starting 8 must always include at least 1 Goalkeeper and a minimum of 2 Defenders. The remaining 5 players in your starting lineup can be from any position."
            },
            {
                question: "Can I make changes during a live gameweek?",
                answer: "You can make unlimited changes to your starting XI (substitutions, captain changes) right up until the gameweek deadline. Once the deadline passes, your team is locked for that gameweek. Any transfers you make after the deadline will apply to the *next* gameweek."
            }
        ]
    },
    {
        title: "Chips",
        questions: [
            {
                question: "What chips are available and how often can I use them?",
                answer: "You have two powerful chips available: the Wildcard, which allows unlimited free transfers for a single gameweek, and the Triple Captain, which triples your captain's points. Each chip can be used once per season."
            },
            {
                question: "Can I use multiple chips at once?",
                answer: "No, only one chip can be active in a single gameweek. For example, you cannot use your Wildcard and Triple Captain at the same time."
            }
        ]
    },
    {
        title: "Scoring & Updates",
        questions: [
            {
                question: "When are player points updated and finalized?",
                answer: "Player points for a gameweek will be fully calculated, including any bonus points, and finalized within 24 hours after the last match of that gameweek has ended."
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
                                            <AccordionItem key={itemIndex} value={`item-${itemIndex}`} className="border-b border-pl-border last:border-b-0">
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

