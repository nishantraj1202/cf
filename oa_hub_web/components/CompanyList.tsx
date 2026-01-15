"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">Companies</h1>
                <p className="text-gray-400">Find questions by company</p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
                {initialCompanies.map((company) => (
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

            {/* No Results State */}
            {initialCompanies.length === 0 && (
                <div className="text-center text-gray-500 py-20 bg-dark-800/50 rounded-lg border border-dashed border-dark-700">
                    <p className="text-lg">No companies found.</p>
                </div>
            )}
        </div>
    );
}

