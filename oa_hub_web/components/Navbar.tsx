"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Upload, X, Menu, Loader2 } from "lucide-react";
import { API_URL, cn } from "@/lib/utils";

interface Suggestion {
    slug?: string;
    title?: string;
    name?: string;
    type?: 'company' | 'question';
}

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    // Search State
    const pathname = usePathname();
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const placeholder = "Search companies or questions...";

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.trim().length > 1) {
                setIsLoading(true);
                try {
                    const res = await fetch(`${API_URL}/api/search?search=${encodeURIComponent(query)}&limit=5`);
                    const data = await res.json();
                    setSuggestions(Array.isArray(data) ? data : []);
                    setShowSuggestions(true);
                } catch (error) {
                    console.error("Search error:", error);
                    setSuggestions([]);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleSearchSubmit = (e?: React.KeyboardEvent) => {
        if (e && e.key !== "Enter") return;

        if (query.trim()) {
            setShowSuggestions(false);

            // Check for exact match in suggestions to auto-navigate
            const exactMatch = suggestions.find(s => s.title?.toLowerCase() === query.toLowerCase());

            if (exactMatch) {
                if (exactMatch.type === 'company') {
                    window.location.href = `/company/${exactMatch.slug}`;
                } else {
                    window.location.href = `/question/${exactMatch.slug}`; // Assuming questions have slugs
                }
            } else {
                // Default fallback: Search Questions Page (or Companies if it looks like a company?)
                // For now, default to questions search as it handles title/company text search
                window.location.href = `/questions?search=${query}`;
            }
        }
    };

    return (
        <header className="h-16 bg-dark-800 border-b border-dark-700 flex items-center justify-between px-4 sm:px-8 shrink-0 z-30 sticky top-0">
            {/* Logo */}
            <div className="flex items-center gap-6">
                <Link href="/" className="flex items-center text-2xl font-bold tracking-tight cursor-pointer group">
                    <span className="text-white mr-1 group-hover:text-gray-200 transition-colors">Codinz</span>
                    <span className="bg-brand text-black px-1.5 py-0.5 rounded-[4px] text-xl group-hover:bg-yellow-500 transition-colors shadow-lg shadow-orange-500/20">Hub</span>
                </Link>
                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                    <Link href="/" className={cn("transition-colors", pathname === "/" ? "text-white font-bold" : "text-gray-400 hover:text-white")}>
                        Home
                    </Link>
                    <Link href="/questions" className={cn("transition-colors", pathname?.startsWith("/questions") ? "text-white font-bold" : "text-gray-400 hover:text-white")}>
                        Problem Set
                    </Link>
                    <Link href="/companies" className={cn("transition-colors", pathname?.startsWith("/companies") ? "text-white font-bold" : "text-gray-400 hover:text-white")}>
                        Companies
                    </Link>
                    <Link href="/contribute" className={cn("transition-colors", pathname?.startsWith("/contribute") ? "text-white font-bold" : "text-gray-400 hover:text-white")}>
                        Contribute
                    </Link>
                </nav>
            </div>

            {/* Search Area */}
            <div className="flex-1 max-w-xl mx-8 hidden md:block relative" ref={searchRef}>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {isLoading ? <Loader2 className="w-4 h-4 text-brand animate-spin" /> : <Search className="w-4 h-4 text-gray-500 group-focus-within:text-brand transition-colors" />}
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-10 py-2 bg-black border border-dark-600 text-white text-sm rounded focus:ring-1 focus:ring-brand focus:border-brand transition-all placeholder-gray-600 focus:outline-none"
                        placeholder={placeholder}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                        onKeyDown={handleSearchSubmit}
                    />
                    {query && (
                        <button
                            onClick={() => { setQuery(""); setSuggestions([]); }}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-500 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}

                    {/* Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-dark-800 border border-dark-600 rounded-lg shadow-xl overflow-hidden z-50">
                            {suggestions.map((item, idx) => (
                                <Link
                                    key={idx}
                                    href={item.type === 'company' ? `/company/${item.slug}` : `/question/${item.slug}`}
                                    className="block px-4 py-3 hover:bg-dark-700 transition-colors border-b border-dark-700/50 last:border-0"
                                    onClick={() => setShowSuggestions(false)}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-white text-sm font-medium">{item.title}</span>
                                        <span className={cn(
                                            "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase",
                                            item.type === 'company' ? "bg-blue-900/50 text-blue-300" : "bg-brand/20 text-brand"
                                        )}>
                                            {item.type === 'company' ? "Company" : "Question"}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => alert("Upload feature coming soon!")}
                    className="hidden sm:flex items-center gap-2 text-gray-300 hover:text-white text-sm font-medium"
                >
                    <Upload className="w-4 h-4" />
                    Upload
                </button>
                <button
                    onClick={() => alert("Go Premium for 4K coding resolution!")}
                    className="hidden sm:flex items-center gap-2 border border-brand text-brand hover:bg-brand hover:text-black px-3 py-1 rounded text-sm font-bold uppercase transition-all duration-200 shadow-[0_0_10px_rgba(255,153,0,0.2)]"
                >
                    Premium
                </button>
                <div className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center text-xs font-bold text-gray-400 border border-dark-500 cursor-pointer hover:border-white transition-colors">
                    ME
                </div>
                {/* Mobile Menu Toggle */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="md:hidden w-10 h-10 flex items-center justify-center text-white hover:bg-dark-700/50 rounded-full transition-colors"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div className="absolute top-16 left-0 w-full bg-dark-900 border-b border-dark-700 p-4 flex flex-col gap-4 md:hidden shadow-2xl animate-fade-in z-50">
                    <Link href="/" onClick={() => setIsOpen(false)} className="text-white font-bold py-2 border-b border-dark-800">
                        Home
                    </Link>
                    <Link href="/questions" onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-brand py-2 border-b border-dark-800">
                        Problem Set
                    </Link>
                    <Link href="/companies" onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-brand py-2 border-b border-dark-800">
                        Companies
                    </Link>
                    <Link href="/contribute" onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-brand py-2 border-b border-dark-800">
                        Contribute
                    </Link>
                    <button className="text-left text-brand font-bold py-2">
                        Premium
                    </button>
                </div>
            )}
        </header>
    );
}
