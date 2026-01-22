import React from "react";
import { type Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { CompanyPageContent } from "@/components/CompanyPageContent";
import { CheckCircle } from "lucide-react";
import { cn, API_URL } from "@/lib/utils";
import Link from "next/link";
import { type Question } from "@/types";

export const dynamic = 'force-dynamic';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://preptracker.com';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const data = await getCompanyData(slug);

    if (!data) {
        return {
            title: "Company Not Found",
        };
    }

    return {
        title: `${data.company.name} Interview Questions & OAs`,
        description: `Practice real ${data.company.name} interview questions and Online Assessments. ${data.questions.length} questions available. Join the community of developers preparing for ${data.company.name}.`,
        openGraph: {
            title: `${data.company.name} Interview Questions | PrepTracker`,
            description: data.company.description,
            url: `${BASE_URL}/company/${slug}`,
            type: 'website',
        },
        twitter: {
            card: 'summary',
            title: `${data.company.name} Interview Questions`,
            description: `Practice ${data.questions.length} real ${data.company.name} OA questions`,
        },
        alternates: {
            canonical: `${BASE_URL}/company/${slug}`,
        },
    };
}

interface CompanyData {
    company: {
        _id: string;
        name: string;
        slug: string;
        logo: string;
        subscribers: string;
        description: string;
    };
    questions: Question[];
}

async function getCompanyData(slug: string): Promise<CompanyData | null> {
    try {
        const res = await fetch(`${API_URL}/api/companies/${slug}`, { cache: 'no-store' });
        if (!res.ok) return null;
        return res.json();
    } catch (_error) {
        return null;
    }
}

export default async function CompanyPage({ params }: PageProps) {
    const { slug } = await params;
    const data = await getCompanyData(slug);

    if (!data) {
        return (
            <div className="flex flex-col h-screen overflow-hidden bg-dark-950 text-gray-200">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">Company Not Found</h1>
                        <Link href="/" className="text-gray-400 hover:text-brand mt-2 block underline">Return Home</Link>
                    </div>
                </div>
            </div>
        );
    }

    const { company, questions } = data;

    // JSON-LD structured data for the company page
    const organizationJsonLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": company.name,
        "url": `${BASE_URL}/company/${company.slug}`,
        "description": company.description,
    };

    const itemListJsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": `${company.name} Interview Questions`,
        "description": `Collection of ${company.name} interview and OA questions`,
        "numberOfItems": questions.length,
        "itemListElement": questions.slice(0, 10).map((q: Question, index: number) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
                "@type": "Course",
                "name": q.title,
                "description": q.desc?.substring(0, 100) || "",
                "provider": {
                    "@type": "Organization",
                    "name": company.name
                },
                "url": `${BASE_URL}/question/${q.slug || q.id}`
            }
        }))
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-dark-950 text-gray-200">
            {/* Inject JSON-LD structured data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
            />

            <Navbar />
            <div className="flex-1 flex overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto custom-scroll">


                    {/* Company Header Banner */}
                    <div className="bg-dark-900 border-b border-dark-800">
                        {/* Banner Art (Optional, simplified) */}
                        <div className="h-32 sm:h-48 bg-gradient-to-r from-gray-900 to-black w-full relative overflow-hidden">
                            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]"></div>
                        </div>

                        {/* Profile Info */}
                        <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 -mt-12 sm:-mt-16 relative z-10">
                                {/* Logo */}
                                <div className={cn("w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-dark-950 flex items-center justify-center text-white text-4xl sm:text-5xl font-bold shadow-2xl", company.logo)}>
                                    {company.name[0]}
                                </div>

                                {/* Text Info */}
                                <div className="flex-1 mb-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">{company.name}</h1>
                                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-brand fill-current" />
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                                        <span>@{company.slug}</span>
                                        <span>•</span>
                                        <span>{questions.length} Questions</span>
                                    </div>
                                    <p className="text-gray-400 text-sm mt-3 max-w-2xl leading-relaxed">
                                        {company.description}
                                    </p>
                                </div>

                                {/* Subscribe Button */}
                                <div className="mb-2">
                                    <button className="bg-white text-black hover:bg-gray-200 px-6 py-2.5 rounded-full font-bold text-sm transition-colors shadow-lg">
                                        Subscribe
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Interactive Content */}
                    <CompanyPageContent company={company} questions={questions} />

                </main>
            </div >
        </div >
    );
}
