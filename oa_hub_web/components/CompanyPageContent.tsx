"use client";

import React, { useState } from "react";
import { QuestionList } from "@/components/QuestionList";
import { type Question } from "@/types";
import { SearchX } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompanyPageContentProps {
    company: {
        name: string;
        description: string;
        slug: string;
    };
    questions: Question[];
}

export function CompanyPageContent({ company, questions }: CompanyPageContentProps) {
    const [activeTab, setActiveTab] = useState<"home" | "questions" | "community" | "about">("home");

    return (
        <>
            {/* Tabs */}
            <div className="bg-dark-900 border-b border-dark-800 sticky top-16 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-8">
                    <div className="flex items-center justify-between sm:justify-start sm:gap-8 text-[10px] sm:text-sm font-bold text-gray-400 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setActiveTab("home")}
                            className={cn(
                                "border-b-2 pb-3 px-1 sm:px-2 cursor-pointer whitespace-nowrap transition-colors",
                                activeTab === "home" ? "text-white border-white" : "border-transparent hover:text-white"
                            )}
                        >
                            HOME
                        </button>
                        <button
                            onClick={() => setActiveTab("questions")}
                            className={cn(
                                "border-b-2 pb-3 px-1 sm:px-2 cursor-pointer whitespace-nowrap transition-colors",
                                activeTab === "questions" ? "text-white border-white" : "border-transparent hover:text-white"
                            )}
                        >
                            QUESTIONS
                        </button>
                        <button
                            onClick={() => setActiveTab("community")}
                            className={cn(
                                "border-b-2 pb-3 px-1 sm:px-2 cursor-pointer whitespace-nowrap transition-colors",
                                activeTab === "community" ? "text-white border-white" : "border-transparent hover:text-white"
                            )}
                        >
                            COMMUNITY
                        </button>
                        <button
                            onClick={() => setActiveTab("about")}
                            className={cn(
                                "border-b-2 pb-3 px-1 sm:px-2 cursor-pointer whitespace-nowrap transition-colors",
                                activeTab === "about" ? "text-white border-white" : "border-transparent hover:text-white"
                            )}
                        >
                            ABOUT
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-7xl mx-auto p-4 sm:p-8 min-h-[500px]">

                {/* HOME TAB */}
                {activeTab === "home" && (
                    <div className="animate-fade-in space-y-8">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-white">Latest Questions</h2>
                                <button
                                    onClick={() => setActiveTab("questions")}
                                    className="text-brand text-xs font-bold hover:underline"
                                >
                                    View All ({questions.length})
                                </button>
                            </div>

                            {questions.length > 0 ? (
                                <QuestionList questions={questions.slice(0, 8)} />
                            ) : (
                                <EmptyState companyName={company.name} />
                            )}
                        </div>

                        {/* Recent Activity / Stats placeholder could go here */}
                    </div>
                )}

                {/* QUESTIONS TAB */}
                {activeTab === "questions" && (
                    <div className="animate-fade-in">
                        <h2 className="text-lg font-bold text-white mb-4">All Questions</h2>
                        {questions.length > 0 ? (
                            <QuestionList questions={questions} />
                        ) : (
                            <EmptyState companyName={company.name} />
                        )}
                    </div>
                )}

                {/* ABOUT TAB */}
                {activeTab === "about" && (
                    <div className="animate-fade-in max-w-3xl">
                        <h2 className="text-xl font-bold text-white mb-6">About {company.name}</h2>
                        <div className="bg-dark-900 border border-dark-800 rounded-xl p-6 sm:p-8">
                            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {company.description}
                            </p>
                        </div>
                    </div>
                )}

                {/* COMMUNITY TAB */}
                {activeTab === "community" && (
                    <div className="animate-fade-in flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mb-4">
                            <span className="text-2xl">🚧</span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Community Coming Soon</h3>
                        <p className="text-gray-500 max-w-md">
                            Discuss interview experiences and get referrals from {company.name} employees.
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}

function EmptyState({ companyName }: { companyName: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 bg-dark-800/50 rounded-lg border border-dashed border-dark-700">
            <SearchX className="w-12 h-12 text-gray-600 mb-4" />
            <h3 className="text-lg font-bold text-white">No questions yet</h3>
            <p className="text-gray-500 text-sm">Check back later for new {companyName} OAs.</p>
        </div>
    );
}
