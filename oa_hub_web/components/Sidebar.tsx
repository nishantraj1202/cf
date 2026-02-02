"use client";

import React from "react";
import Link from "next/link";
import { Home, History, ThumbsUp } from "lucide-react";
import { Footer } from "./Footer";

export function Sidebar() {
    return (
        <aside className="hidden lg:flex flex-col w-60 bg-dark-900 border-r border-dark-800 flex-shrink-0 overflow-y-auto custom-scroll py-6 px-3 sticky top-16 h-[calc(100vh-64px)]">
            <div className="space-y-1 mb-8">
                <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm font-bold bg-dark-800 text-white rounded hover:bg-dark-700 transition-colors border-l-2 border-brand">
                    <Home className="w-4 h-4 text-brand" /> Home
                </Link>
                <Link href="/history" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-400 rounded hover:bg-dark-800 hover:text-white transition-colors border-l-2 border-transparent">
                    <History className="w-4 h-4" /> Watch History
                </Link>
                <Link href="/liked" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-400 rounded hover:bg-dark-800 hover:text-white transition-colors border-l-2 border-transparent">
                    <ThumbsUp className="w-4 h-4" /> Liked Code
                </Link>
            </div>

            <Footer />



        </aside>
    );
}
