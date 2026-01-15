"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { QuestionCard } from "@/components/QuestionCard";
import { QuestionCardSkeleton } from "@/components/skeletons/QuestionCardSkeleton";
import { type Question } from "@/types";
import { SearchX, ListFilter, ChevronLeft, ChevronRight } from "lucide-react";
import { API_URL } from "@/lib/utils";

export function QuestionExplorer() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const ITEMS_PER_PAGE = 12;

    // Filter States
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");
    const [selectedTopic, setSelectedTopic] = useState<string>("All");
    const searchParams = useSearchParams();
    const initialSearch = searchParams.get("search") || "";
    const [searchQuery] = useState<string>(initialSearch);

    const fetchQuestions = useCallback(async () => {
        setLoading(true);
        try {
            // Build Query Params
            const params = new URLSearchParams();
            params.append("page", currentPage.toString());
            params.append("limit", ITEMS_PER_PAGE.toString());

            if (selectedDifficulty !== "All") params.append("difficulty", selectedDifficulty);
            if (selectedTopic !== "All") params.append("topic", selectedTopic);
            if (searchQuery) params.append("search", searchQuery);

            const res = await fetch(`${API_URL}/api/questions?${params.toString()}`);
            const data = await res.json();

            if (data.questions && Array.isArray(data.questions)) {
                setQuestions(data.questions);
                setTotalPages(data.pagination.pages);
                setTotalQuestions(data.pagination.total);
            } else if (Array.isArray(data)) {
                // Fallback for old API response structure
                setQuestions(data);
                setTotalPages(1);
                setTotalQuestions(data.length);
            } else {
                setQuestions([]);
            }
        } catch (error) {
            console.error("Failed to fetch questions:", error);
            setQuestions([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, selectedDifficulty, selectedTopic, searchQuery, ITEMS_PER_PAGE]);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);


    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedDifficulty, selectedTopic, searchQuery]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Extract unique values for filters (Note: This logic needs adjustment for server-side pagination as we don't have all data)
    // Ideally, we should fetch available filters from a separate endpoint. 
    // For now, we'll keep hardcoded lists or rely on what we have, but dynamic lists from *current page* is bad UX.
    // Let's use static lists for now or fetch all companies/topics once.
    const difficulties = ["All", "Easy", "Medium", "Hard"];
    const topics = ["All", "Arrays", "Strings", "LinkedList", "Trees", "Graphs", "DP", "Heaps", "Backtracking", "System Design", "Matrix", "Other"];

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto">
                {/* Loading Indicator */}
                <div className="flex items-center justify-center gap-3 mb-8 py-4">
                    <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                    <span className="text-gray-400 text-sm font-medium">Loading Problem Set...</span>
                </div>

                {/* Header Skeleton */}
                <div className="mb-6 space-y-4">
                    <div className="flex justify-between items-center mb-8">
                        <div className="h-8 w-48 bg-dark-800/50 rounded animate-pulse" />
                        <div className="h-10 w-64 bg-dark-800/50 rounded animate-pulse" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 animate-fade-in">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <QuestionCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header & Filters */}
            <div className="mb-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1">Problem Set</h1>
                        <p className="text-sm text-gray-400">Showing {questions.length} of {totalQuestions} questions</p>
                    </div>

                </div>

                <div className="flex flex-wrap gap-3 p-4 bg-dark-800/30 rounded-xl border border-dark-800 items-center">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mr-2">
                        <ListFilter className="w-4 h-4" />
                        <span>Filters:</span>
                    </div>

                    {/* Topic Filter */}
                    <select
                        value={selectedTopic}
                        onChange={(e) => setSelectedTopic(e.target.value)}
                        className="bg-dark-900 text-white text-sm px-3 py-1.5 rounded-lg border border-dark-700 hover:border-dark-600 focus:border-brand focus:outline-none cursor-pointer transition-colors"
                    >
                        {topics.map(t => <option key={t} value={t}>{t === "All" ? "Topic" : t}</option>)}
                    </select>

                    {/* Difficulty Filter */}
                    <select
                        value={selectedDifficulty}
                        onChange={(e) => setSelectedDifficulty(e.target.value)}
                        className="bg-dark-900 text-white text-sm px-3 py-1.5 rounded-lg border border-dark-700 hover:border-dark-600 focus:border-brand focus:outline-none cursor-pointer transition-colors"
                    >
                        {difficulties.map(d => <option key={d} value={d}>{d === "All" ? "Difficulty" : d}</option>)}
                    </select>

                    {(selectedDifficulty !== "All" || selectedTopic !== "All" || searchQuery) && (
                        <button
                            onClick={() => {
                                setSelectedDifficulty("All");
                                setSelectedTopic("All");
                                // setSearchQuery(""); 
                            }}
                            className="text-xs text-red-400 hover:text-red-300 ml-auto flex items-center gap-1"
                        >
                            <SearchX className="w-3 h-3" />
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Grid View */}
            {
                questions.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 animate-fade-in">
                            {questions.map((q, index) => (
                                <div key={q.id} className="relative group">
                                    {/* NEW Badge for the first 2 items on page 1 */}
                                    {currentPage === 1 && index < 2 && (
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

                        {/* Pagination Controls */}
                        <div className="mt-12 flex items-center justify-center gap-4">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="flex items-center gap-2 px-4 py-2 bg-dark-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-700 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </button>

                            <span className="text-gray-400 text-sm font-medium">
                                Page <span className="text-white">{currentPage}</span> of <span className="text-white">{totalPages}</span>
                            </span>

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="flex items-center gap-2 px-4 py-2 bg-dark-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-700 transition-colors"
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in bg-dark-800/30 rounded-xl border border-dashed border-dark-700">
                        <SearchX className="w-16 h-16 text-gray-700 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-1">No matches found</h3>
                        <p className="text-gray-500 text-sm">Try adjusting your filters or search query</p>
                    </div>
                )
            }
        </div >
    );
}
