import React from "react";
import Link from "next/link";
import { Home, Flame, History, Code, Server, Database, Settings, Info } from "lucide-react";

export function Sidebar() {
    return (
        <aside className="hidden lg:flex flex-col w-60 bg-dark-900 border-r border-dark-800 flex-shrink-0 overflow-y-auto h-[calc(100vh-64px)] py-6 px-3 sticky top-16">
            <div className="space-y-1 mb-8">
                <Link href="/" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-dark-800 px-3 py-2 rounded transition-colors group">
                    <Home className="w-5 h-5 group-hover:text-brand transition-colors" />
                    <span className="font-medium">Home</span>
                </Link>
                <Link href="/admin" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-dark-800 px-3 py-2 rounded transition-colors group">
                    <Settings className="w-5 h-5 group-hover:text-brand transition-colors" />
                    <span className="font-medium">Admin Panel</span>
                </Link>
                <div className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-dark-800 px-3 py-2 rounded cursor-pointer transition-colors group">
                    <Flame className="w-5 h-5 group-hover:text-brand transition-colors" />
                    <span className="font-medium">Best of 2024</span>
                </div>
                <Link
                    href="#"
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-400 rounded hover:bg-dark-800 hover:text-white transition-colors"
                >
                    <History className="w-4 h-4" /> History
                </Link>
            </div>

            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-3">
                Categories
            </h3>
            <div className="space-y-1">
                <Link
                    href="#"
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-400 rounded hover:bg-dark-800 hover:text-white transition-colors"
                >
                    <Code className="w-4 h-4" /> Algorithms
                </Link>
                <Link
                    href="#"
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-400 rounded hover:bg-dark-800 hover:text-white transition-colors"
                >
                    <Server className="w-4 h-4" /> System Design
                </Link>
                <Link
                    href="#"
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-400 rounded hover:bg-dark-800 hover:text-white transition-colors"
                >
                    <Database className="w-4 h-4" /> Database
                </Link>
            </div>

            {/* Bottom Links */}
            <div className="mt-auto pt-6 border-t border-dark-800">
                <Link href="/about" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-dark-800 rounded transition-colors group">
                    <Info className="w-4 h-4 group-hover:text-brand transition-colors" />
                    <span className="font-medium text-sm">About & Team</span>
                </Link>
            </div>
        </aside>
    );
}
