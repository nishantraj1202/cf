"use client";

import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { type Question } from "@/types";
import { cn } from "@/lib/utils";

interface QuestionInteractionsProps {
    question: Question;
}

export function QuestionInteractions({ question }: QuestionInteractionsProps) {
    const [isLiked, setIsLiked] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);

        // 1. Handle Watch History
        const history = JSON.parse(localStorage.getItem("watchHistory") || "[]");
        // Remove duplicate if exists (to move it to top)
        const newHistory = history.filter((q: Question) => q.id !== question.id);
        // Add current question to top
        newHistory.unshift({
            id: question.id,
            title: question.title,
            company: question.company,
            difficulty: question.difficulty,
            slug: question.slug || question.id, // Fallback
            date: new Date().toISOString()
        });
        // Limit history to 50 items
        if (newHistory.length > 50) newHistory.pop();
        localStorage.setItem("watchHistory", JSON.stringify(newHistory));

        // 2. Check Like Status
        const likes = JSON.parse(localStorage.getItem("likedQuestions") || "[]");
        const isLiked = likes.some((q: Question) => q.id === question.id);
        setIsLiked(isLiked);

    }, [question]);

    const toggleLike = () => {
        const likes = JSON.parse(localStorage.getItem("likedQuestions") || "[]");
        let newLikes;

        if (isLiked) {
            // Unlike
            newLikes = likes.filter((q: Question) => q.id !== question.id);
        } else {
            // Like
            newLikes = [...likes, {
                id: question.id,
                title: question.title,
                company: question.company,
                difficulty: question.difficulty,
                slug: question.slug || question.id
            }];
        }

        localStorage.setItem("likedQuestions", JSON.stringify(newLikes));
        setIsLiked(!isLiked);
    };

    if (!hasMounted) return null;

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={toggleLike}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                    isLiked
                        ? "bg-red-500/10 text-red-500 border-red-500/50 hover:bg-red-500/20"
                        : "bg-dark-800 text-gray-400 border-dark-700 hover:text-white hover:border-gray-600"
                )}
            >
                <Heart className={cn("w-3 h-3", isLiked && "fill-current")} />
                {isLiked ? "Liked" : "Like"}
            </button>
        </div>
    );
}
