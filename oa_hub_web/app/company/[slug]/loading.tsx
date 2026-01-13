import React from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { QuestionListSkeleton } from "@/components/skeletons/QuestionListSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-dark-950 text-gray-200">
            <Navbar />
            <div className="flex-1 flex overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto custom-scroll">
                    {/* Loading Indicator */}
                    <div className="flex items-center justify-center gap-3 py-6 bg-dark-900 border-b border-dark-800">
                        <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                        <span className="text-gray-400 text-sm font-medium">Loading Company...</span>
                    </div>

                    {/* Header Banner Skeleton */}
                    <div className="bg-dark-900 border-b border-dark-800">
                        <div className="h-32 sm:h-48 bg-dark-800 w-full animate-pulse" />

                        <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 -mt-12 sm:-mt-16 relative z-10">
                                {/* Logo Skeleton */}
                                <Skeleton className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-dark-950 shadow-2xl shrink-0" />

                                {/* Info Skeleton */}
                                <div className="flex-1 mb-2 space-y-3 w-full">
                                    <Skeleton className="h-8 w-64" />
                                    <div className="flex gap-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                    <Skeleton className="h-16 w-full max-w-xl" />
                                </div>
                            </div>

                            {/* Tabs Skeleton */}
                            <div className="flex items-center gap-8 mt-8 border-b border-dark-700 pb-0.5">
                                <Skeleton className="h-6 w-16" />
                                <Skeleton className="h-6 w-24" />
                                <Skeleton className="h-6 w-24" />
                            </div>
                        </div>
                    </div>

                    {/* Content Skeleton */}
                    <div className="max-w-7xl mx-auto p-4 sm:p-8">
                        <Skeleton className="h-6 w-48 mb-4" />
                        <QuestionListSkeleton />
                    </div>
                </main>
            </div>
        </div>
    );
}
