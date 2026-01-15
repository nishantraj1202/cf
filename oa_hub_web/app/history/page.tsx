"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import Link from "next/link";
import { type Question } from "@/types";
import { CheckCircle, Clock } from "lucide-react";

export default function HistoryPage() {
    const [history, setHistory] = useState<Question[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem("watchHistory");
        if (stored) {
            try {
                setHistory(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, []);

    if (!mounted) return null;

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-dark-950 text-gray-200">
            <Navbar />
            <div className="flex-1 flex overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-8 bg-dark-900">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-center gap-3 mb-8">
                            <Clock className="w-8 h-8 text-brand" />
                            <h1 className="text-3xl font-bold text-white">Watch History</h1>
                        </div>

                        {history.length === 0 ? (
                            <div className="text-center py-20 border border-dashed border-dark-700 rounded-xl">
                                <h2 className="text-xl font-bold text-gray-400 mb-2">No history yet</h2>
                                <p className="text-gray-500 mb-6">Start solving problems to build your history.</p>
                                <Link href="/" className="px-6 py-2 bg-brand text-black font-bold rounded hover:bg-brand/90 transition-colors">
                                    Explore Problems
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {history.map((q) => (
                                    <Link key={q.id} href={`/question/${q.slug || q.id}`} className="block bg-dark-800 p-4 rounded-lg border border-dark-700 hover:border-brand transition-all group">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-lg font-bold text-white group-hover:text-brand transition-colors mb-1">{q.title}</h3>
                                                <div className="flex items-center gap-3 text-sm text-gray-400">
                                                    <span className="font-medium text-gray-300">{q.company}</span>
                                                    <span>•</span>
                                                    <span className={
                                                        q.difficulty === "Easy" ? "text-green-400" :
                                                            q.difficulty === "Medium" ? "text-yellow-400" :
                                                                "text-red-400"
                                                    }>{q.difficulty}</span>
                                                    {q.date && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-xs text-gray-500">Viewed {new Date(q.date).toLocaleDateString()}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="hidden sm:block">
                                                <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-gray-400 group-hover:bg-brand group-hover:text-black transition-colors">
                                                    <CheckCircle className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
