import React from 'react';
import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/fpl-card';

// 1. All new sections, questions, and answers have been added here.
const helpSections = [
    {
        title: "Choosing your initial squad",
        questions: [
            {
                question: "Can I make changes to my squad after entering the game?",
                answer: "Yes, unlimited free transfers can be made before the next deadline."
            },
        ]
    },
    {
        title: "Managing your team",
        questions: [
            {
                question: "What formation can I play in?",
                answer: "You can play in any formation, providing 1 goalkeeper and at least 2 defenders are selected at all times."
            },
            {
                question: "How do I change my captain?",
                answer: "On the My Team page, use the menu which appears when clicking on a player."
            },
            {
                question: "How do I change my team name or the team I support?",
                answer: "You can change this information on the team details page."
            },
            {
                question: "Can I make changes to my team during a Gameweek?",
                answer: "Any changes you make (starting 11, transfers, captain changes, substitution priorities) after the Gameweek deadline, will not take effect until the following deadline."
            }
        ]
    },
    {
        title: "Chips",
        questions: [
            {
                question: "How often can each chip be used?",
                answer: "All chips can be used twice a season. The first Bench Boost and Triple Captain chips become available from the start of the season. These chips are played when saving on the my team page. They can be cancelled at any time before the Gameweek deadline. The first Free Hit chip becomes available after the first Gameweek of your season . This chip is activated when confirming your transfers and cannot be cancelled once confirmed. The first Wildcard becomes available after the first Gameweek of your season. The Wildcard chip is played when confirming transfers and cannot be cancelled once played."
            },
            {
                question: "Can I use more than one chip in the same Gameweek?",
                answer: "No, only one chip may be active in a Gameweek. For example, it is not possible to make transfers with your Wildcard chip and then use your Bench Boost chip in the same Gameweek."
            },
            {
                question: "What happens to my Triple Captain chip if my captain doesn't play?",
                answer: "The triple points bonus will be passed to your vice-captain. If your vice-captain doesn't play either then the bonus is lost, the chip isn't returned."
            }
        ]
    },
    {
        title: "Transfers",
        questions: [
            {
                question: "If I don’t use my free transfer, do I get two the next Gameweek?",
                answer: "If you do not use your free transfer, you are able to make an additional free transfer the following Gameweek. If you do not use this saved free transfer in the following Gameweek, it will be carried over until you do. The maximum number of free transfers you can store in any gameweek is 5."
            },
            {
                question: "Can I cancel my transfers?",
                answer: "No. Once you have confirmed your transfers, they are final and can’t be reversed under any circumstances."
            }
        ]
    },
    {
        title: "Wildcards",
        questions: [
            {
                question: "What is a Wildcard?",
                answer: "A Wildcard allows you to make unlimited free transfers throughout a Gameweek. Playing a Wildcard will remove any points deductions from transfers already made in that same Gameweek. You play a Wildcard when you want to make multiple changes to your team, for example Gameweeks when teams are playing more than once, or when your team is underperforming or has a lot of injuries. When using a Wildcard, you must remain within your current budget. There is no unlimited budget when using a Wildcard."
            },
            {
                question: "When can I play a Wildcard?",
                answer: "Wildcards are played on the transfers page but aren't active until you have confirmed the transfers."
            },
            {
                question: "What happens to my saved transfers when I use my Wildcard?",
                answer: "When playing a Wildcard, any saved free transfers are maintained. If you had 2 saved free transfers, you will still have 2 saved free transfers the following Gameweek."
            },
            {
                question: "Can I cancel my Wildcard?",
                answer: "No. Once you have confirmed your Wildcard it is final and can’t be reversed under any circumstances."
            },
            {
                question: "Do all transfers have to be made at the same time when using my Wildcard?",
                answer: "No. Once you have played your Wildcard, any transfers you make within that Gameweek are free, including any you made before playing your Wildcard, up until the next deadline."
            }
        ]
    },
    {
        title: "Player data",
        questions: [
            {
                question: "When is the game updated?",
                answer: "Player points are updated as the matches take place, while team points and league tables are usually updated two hours after the final whistle in the last match of the day. Bonus points will be awarded one hour after the final whistle of the last match of any given day. Automatic substitutions and captain changes are processed at the end of the Gameweek, when all matches have been played."
            },
            {
                question: "A yellow/red card decision or goalscorer has been changed in an earlier match. Are you going to alter the points?",
                answer: "Once the points have all been updated after the last day of the Gameweek has been marked as final, no further adjustments to points will be made."
            },
            {
                question: "Why was/wasn’t an assist given to...?",
                answer: "All assists are reviewed before the points are updated at the end of each day. If an assist still has not been given after this time, please refer to the assist definition in the rules for further clarification."
            }
        ]
    },
    {
        title: "Assists",
        questions: [
            {
                question: "What constitutes a pass for a defensive touch and why does this cancel out an assist?",
                answer: "A pass is defined as the attempted delivery of the ball from one player to another player on the same team. A player can use any part of their body (permitted in the laws of the game), to execute the pass, so this includes a headed passes. These cancel out assists because they are often accompanied by a degree of control by the opposing team without a change of possession and, with other Defensive Errors no longer a factor, these were a way of capturing a loose backpass which can be the main factors in creating a goal rather than the initial pass by an attacking player."
            },
            {
                question: "How can you judge the intended target for passes received outside the penalty area?",
                answer: "While this can be subjective, for passes received outside the penalty area, the intended target is often very obvious and easy to identify. The path and trajectory of the pass before the defensive touch is one factor used to make this judgement. Secondly, the intended target is often identifiable by either their anticipation of the pass by holding position, or more likely for passes made outside the penalty area, their run to receive the pass. If a clear intended target cannot be identified then no assist will be awarded."
            }
        ]
    },
    {
        title: "Weekly and Monthly Prizes",
        questions: [
            {
                question: "I had the same number of points as the weekly/monthly winner, why didn’t I win a prize?",
                answer: "In the event of a tie in an FPL Weekly or Monthly competition, the winner will be the manager with the lowest team ID — the one who registered their team first."
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
                            <Card variant="glass">
                                <CardHeader>
                                    {/* 2. Made the section title bigger and bolder */}
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