"use client";

import React, { useState, useEffect } from "react";
import { QuestionCard } from "@/components/QuestionCard";
import { type Question } from "@/types";
import { SearchX, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuestionExplorer() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter States
    const [selectedCompany, setSelectedCompany] = useState<string>("All");
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");

    useEffect(() => {
        // Fetch from Backend
        const fetchQuestions = async () => {
            try {
                const res = await fetch('http://127.0.0.1:5000/api/questions');
                const data = await res.json();
                if (Array.isArray(data)) {
                    setQuestions(data);
                    setFilteredQuestions(data);
                } else {
                    console.error("API returned non-array:", data);
                    setQuestions([]);
                    setFilteredQuestions([]);
                }
            } catch (error) {
                console.error("Failed to fetch questions:", error);
                setQuestions([]);
                setFilteredQuestions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchQuestions();
    }, []);

    // Filter Logic
    useEffect(() => {
        let result = questions || [];

        if (selectedCompany !== "All") {
            result = result.filter(q => q.company === selectedCompany);
        }

        if (selectedDifficulty !== "All") {
            result = result.filter(q => q.difficulty === selectedDifficulty);
        }

        // Always sort by Date (Latest First)
        result = result.sort((a, b) => {
            const dateA = new Date(a.date || 0);
            const dateB = new Date(b.date || 0);
            return dateB.getTime() - dateA.getTime();
        });

        setFilteredQuestions(result);
    }, [selectedCompany, selectedDifficulty, questions]);

    const companies = ["All", ...Array.from(new Set((questions || []).map(q => q.company))).sort()];
    const difficulties = ["All", "Easy", "Medium", "Hard"];

    if (loading) {
        return <div className="p-8 text-center text-gray-500 animate-pulse">Loading Hub Data...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header & Filters */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-white mb-1">Recommended Questions</h1>
                    <p className="text-sm text-gray-400">Freshly requested online assessments</p>
                </div>

                <div className="flex gap-3">
                    {/* Company Filter */}
                    <select
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                        className="bg-dark-800 text-white text-sm px-4 py-2 rounded border border-dark-700 focus:border-brand focus:outline-none cursor-pointer"
                    >
                        {companies.map(c => <option key={c} value={c}>{c === "All" ? "All Companies" : c}</option>)}
                    </select>

                    {/* Difficulty Filter */}
                    <select
                        value={selectedDifficulty}
                        onChange={(e) => setSelectedDifficulty(e.target.value)}
                        className="bg-dark-800 text-white text-sm px-4 py-2 rounded border border-dark-700 focus:border-brand focus:outline-none cursor-pointer"
                    >
                        {difficulties.map(d => <option key={d} value={d}>{d === "All" ? "Any Difficulty" : d}</option>)}
                    </select>
                </div>
            </div>

            {/* Grid */}
            {filteredQuestions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 animate-fade-in">
                    {filteredQuestions.map((q, index) => (
                        <div key={q.id} className="relative group">
                            {/* NEW Badge for the first 2 items */}
                            {index < 2 && (
                                <div className="absolute -top-1 -right-1 z-10 bg-brand text-black text-[10px] font-bold px-2 py-0.5 rounded shadow-lg animate-pulse">
                                    NEW
                                </div>
                            )}
                            <QuestionCard
                                question={q}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in bg-dark-800/50 rounded-lg border border-dashed border-dark-700">
                    <SearchX className="w-12 h-12 text-gray-600 mb-4" />
                    <h3 className="text-lg font-bold text-white">No matches found</h3>
                    <p className="text-gray-500 text-sm mt-1">Try adjusting your filters</p>
                </div>
            )}
        </div>
    );
}
