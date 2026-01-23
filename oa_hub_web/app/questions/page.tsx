import React, { Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { QuestionExplorer } from "@/components/QuestionExplorer";
import { Metadata } from "next";
import { Footer } from "@/components/Footer";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://codinzhub.com';

export const metadata: Metadata = {
    title: "Problem Set - Browse All Questions",
    description: "Browse and filter hundreds of real interview questions and online assessments from Google, Meta, Amazon, Apple, Microsoft, and 50+ top tech companies.",
    openGraph: {
        title: "Coding Problems & OA Questions | Codinzhub",
        description: "Find the perfect practice problem. Filter by company, topic, or difficulty.",
        url: `${BASE_URL}/questions`,
    },
    alternates: {
        canonical: `${BASE_URL}/questions`,
    },
};

export const dynamic = 'force-dynamic';

export default function QuestionsPage() {
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-dark-950 text-gray-200">
            <Navbar />
            <div className="flex-1 flex overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-8 bg-dark-900">
                    <Suspense fallback={<div className="text-center py-10 text-gray-400">Loading questions...</div>}>
                        <QuestionExplorer />
                    </Suspense>
                    <Footer className="lg:hidden" />
                </main>
            </div>
        </div>
    );
}
