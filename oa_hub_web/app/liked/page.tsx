"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import Link from "next/link";
import { type Question } from "@/types";
import { Heart, ArrowRight } from "lucide-react";

export default function LikedPage() {
    const [liked, setLiked] = useState<Question[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem("likedQuestions");
        if (stored) {
            try {
                setLiked(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse liked questions", e);
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
                            <Heart className="w-8 h-8 text-red-500 fill-red-500" />
                            <h1 className="text-3xl font-bold text-white">Liked Code</h1>
                        </div>

                        {liked.length === 0 ? (
                            <div className="text-center py-20 border border-dashed border-dark-700 rounded-xl">
                                <h2 className="text-xl font-bold text-gray-400 mb-2">No liked code yet</h2>
                                <p className="text-gray-500 mb-6">Like questions to save them here for later.</p>
                                <Link href="/" className="px-6 py-2 bg-brand text-black font-bold rounded hover:bg-brand/90 transition-colors">
                                    Explore Problems
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {liked.map((q) => (
                                    <Link key={q.id} href={`/question/${q.slug || q.id}`} className="block bg-dark-800 p-5 rounded-lg border border-dark-700 hover:border-red-500/50 transition-all group relative overflow-hidden">

                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <Heart className="w-24 h-24 text-red-500 fill-current -rotate-12" />
                                        </div>

                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{q.company}</span>
                                                <span className={
                                                    q.difficulty === "Easy" ? "text-green-400 text-xs font-bold px-2 py-1 bg-green-400/10 rounded" :
                                                        q.difficulty === "Medium" ? "text-yellow-400 text-xs font-bold px-2 py-1 bg-yellow-400/10 rounded" :
                                                            "text-red-400 text-xs font-bold px-2 py-1 bg-red-400/10 rounded"
                                                }>{q.difficulty}</span>
                                            </div>

                                            <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors mb-4 line-clamp-2">{q.title}</h3>

                                            <div className="flex items-center text-sm text-gray-400 group-hover:text-white transition-colors">
                                                Solve Again <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
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
