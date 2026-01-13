import React from "react";
import { Navbar } from "@/components/Navbar";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-dark-950 text-gray-200">
            <Navbar />
            <main className="flex-1 flex overflow-hidden">
                {/* Left Column: Code Editor Skeleton */}
                <div className="flex-1 border-r border-dark-800 bg-dark-900 overflow-hidden flex flex-col p-4">
                    {/* Loading Indicator */}
                    <div className="flex items-center justify-center gap-3 py-4 mb-4">
                        <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                        <span className="text-gray-400 text-sm font-medium">Loading Question...</span>
                    </div>

                    {/* Toolbar Skeleton */}
                    <div className="flex items-center justify-between mb-4 border-b border-dark-800 pb-4">
                        <div className="flex gap-4">
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-8 w-24" />
                        </div>
                        <Skeleton className="h-8 w-32" />
                    </div>
                    {/* Editor Area */}
                    <div className="flex-1 bg-dark-800/30 rounded-lg animate-pulse" />
                </div>

                {/* Right Column: Details & Up Next */}
                <div className="w-[450px] flex flex-col border-l border-dark-800 bg-black overflow-y-auto custom-scroll">
                    <div className="p-6 border-b border-dark-800 space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between items-start">
                                <Skeleton className="h-8 w-3/4" />
                                <Skeleton className="h-6 w-12 rounded" />
                            </div>
                            <div className="flex gap-3">
                                <Skeleton className="h-5 w-16 rounded" />
                                <Skeleton className="h-5 w-24 rounded" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>

                        <div className="space-y-2 pt-4">
                            <Skeleton className="h-6 w-32 mb-2" />
                            <Skeleton className="h-24 w-full rounded-lg" />
                        </div>

                        <div className="flex items-center gap-3 pt-4 border-t border-dark-800">
                            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                            <div className="space-y-1">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </div>
                    </div>

                    {/* Up Next List Skeleton */}
                    <div className="p-6 space-y-4">
                        <Skeleton className="h-4 w-20" />
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex gap-3">
                                <Skeleton className="w-24 aspect-video rounded shrink-0" />
                                <div className="space-y-1 flex-1">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
