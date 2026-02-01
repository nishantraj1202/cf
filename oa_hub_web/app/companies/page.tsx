import React from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { API_URL } from "@/lib/utils";
import { CompanyList } from "@/components/CompanyList";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Companies | Codinzhub",
    description: "Browse companies and their latest interview questions.",
};

export const dynamic = 'force-dynamic';

interface Company {
    _id: string;
    name: string;
    slug: string;
    logo: string;
    description: string;
}

async function getCompanies(): Promise<Company[]> {
    try {
        const res = await fetch(`${API_URL}/api/companies?page=1&limit=12`, { cache: 'no-store' });
        if (!res.ok) return [];
        const data = await res.json();
        // Handle new paginated response format
        if (data.companies && Array.isArray(data.companies)) {
            return data.companies;
        }
        // Fallback for old format
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Failed to fetch companies:", error);
        return [];
    }
}

export default async function CompaniesPage() {
    const companies = await getCompanies();

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-dark-950 text-gray-200">
            <Navbar />
            <div className="flex-1 flex overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-8 bg-dark-900">
                    <div className="max-w-7xl mx-auto">


                        <CompanyList initialCompanies={companies} />
                    </div>
                </main>
            </div>
        </div>
    );
}
