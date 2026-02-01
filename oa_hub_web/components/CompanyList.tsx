"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn, API_URL } from "@/lib/utils";
import { ChevronLeft, ChevronRight, SearchX } from "lucide-react";

interface Company {
    _id: string;
    name: string;
    slug: string;
    logo: string;
    description: string;
}

interface CompanyListProps {
    initialCompanies: Company[];
}

export function CompanyList({ initialCompanies }: CompanyListProps) {
    const [companies, setCompanies] = useState<Company[]>(initialCompanies);
    const [loading, setLoading] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCompanies, setTotalCompanies] = useState(0);
    const ITEMS_PER_PAGE = 12;

    const fetchCompanies = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("page", currentPage.toString());
            params.append("limit", ITEMS_PER_PAGE.toString());

            const res = await fetch(`${API_URL}/api/companies?${params.toString()}`);
            const data = await res.json();

            if (data.companies && Array.isArray(data.companies)) {
                setCompanies(data.companies);
                setTotalPages(data.pagination.pages);
                setTotalCompanies(data.pagination.total);
            } else if (Array.isArray(data)) {
                // Fallback for old API response
                setCompanies(data);
                setTotalPages(1);
                setTotalCompanies(data.length);
            } else {
                setCompanies([]);
            }
        } catch (error) {
            console.error("Failed to fetch companies:", error);
            setCompanies([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, ITEMS_PER_PAGE]);

    useEffect(() => {
        // Only fetch if not on first page (initial data is already loaded)
        if (currentPage > 1 || companies.length === 0) {
            fetchCompanies();
        } else if (currentPage === 1 && initialCompanies.length > 0) {
            // For first page, use initial data but still need pagination info
            fetchCompanies();
        }
    }, [currentPage, fetchCompanies, initialCompanies.length, companies.length]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Companies</h1>
                    <p className="text-gray-400">Find questions by company</p>
                </div>
                <div className="flex items-center justify-center gap-3 py-8">
                    <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                    <span className="text-gray-400 text-sm font-medium">Loading companies...</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="bg-dark-800 border border-dark-700 p-6 rounded-lg animate-pulse">
                            <div className="w-16 h-16 rounded-full bg-dark-700 mx-auto mb-4" />
                            <div className="h-5 w-24 bg-dark-700 rounded mx-auto mb-2" />
                            <div className="h-4 w-full bg-dark-700 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">Companies</h1>
                <p className="text-gray-400">
                    Showing {companies.length} of {totalCompanies} companies
                </p>
            </div>

            {/* Grid */}
            {companies.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
                        {companies.map((company) => (
                            <Link key={company._id} href={`/company/${company.slug}`} className="block group h-full">
                                <div className="bg-dark-800 border border-dark-700 hover:border-brand p-6 rounded-lg transition-all flex flex-col items-center text-center h-full shadow-sm hover:shadow-md">
                                    <div className={cn("w-16 h-16 rounded-full border-2 border-dark-600 flex items-center justify-center text-2xl font-bold text-white mb-4 group-hover:border-brand transition-colors bg-dark-900", company.logo)}>
                                        {company.name[0]}
                                    </div>
                                    <h3 className="text-lg font-bold text-white group-hover:text-brand transition-colors mb-2">{company.name}</h3>
                                    <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">{company.description || "No description available."}</p>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
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
                    )}
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in bg-dark-800/30 rounded-xl border border-dashed border-dark-700">
                    <SearchX className="w-16 h-16 text-gray-700 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-1">No companies found</h3>
                    <p className="text-gray-500 text-sm">Try again later</p>
                </div>
            )}
        </div>
    );
}
