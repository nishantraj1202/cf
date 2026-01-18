import React from "react";
import { type Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { CodePlayer } from "@/components/CodePlayer";
import { AuthorCard } from "@/components/AuthorCard";
import { QuestionInteractions } from "@/components/QuestionInteractions";
import { MobileQuestionLayout } from "@/components/MobileQuestionLayout";
// No-op - CheckCircle removed
import Link from "next/link";
import { cn, API_URL } from "@/lib/utils";
import { type Question } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PageProps {
    params: Promise<{ slug: string }>;
}

async function getQuestion(slug: string): Promise<Question | null> {
    try {
        const res = await fetch(`${API_URL}/api/questions/${slug}`, {
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) return null;
        return res.json();
    } catch (_error) {
        return null;
    }
}



export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const question = await getQuestion(slug);

    if (!question) {
        return {
            title: "Question Not Found",
        };
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://preptracker.com';
    const cleanDesc = question.desc?.replace(/[#*`]/g, '').substring(0, 150) || '';

    return {
        title: `${question.title} - ${question.company} Interview Question`,
        description: `Practice ${question.title} from ${question.company}. ${cleanDesc}...`,
        keywords: [
            question.company,
            question.topic,
            question.difficulty,
            'coding interview',
            'online assessment',
            ...(question.tags || []),
        ].filter(Boolean),
        openGraph: {
            title: `${question.title} | ${question.company} Interview`,
            description: `Solve ${question.title} online. Real interview question from ${question.company}. Difficulty: ${question.difficulty}.`,
            url: `${baseUrl}/question/${slug}`,
            type: 'article',
        },
        twitter: {
            card: 'summary',
            title: `${question.title} - ${question.company}`,
            description: `${question.difficulty} level question from ${question.company}`,
        },
        alternates: {
            canonical: `${baseUrl}/question/${slug}`,
        },
    };
}

export default async function QuestionPage({ params }: PageProps) {
    const { slug } = await params;

    // Fetch Data
    const question = await getQuestion(slug);

    if (!question) {
        return (
            <div className="flex flex-col h-screen overflow-hidden bg-dark-950 text-gray-200">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">Question Not Found</h1>
                        <Link href="/" className="text-gray-400 hover:text-brand mt-2 block underline">Return Home</Link>
                    </div>
                </div>
            </div>
        );
    }

    const companySlug = question.company.toLowerCase().replace(/\s+/g, '-');

    // JSON-LD Schema
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "QAPage",
        "mainEntity": {
            "@type": "Question",
            "name": question.title,
            "text": question.desc,
            "answerCount": 1,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": question.approach || "See solution code in the editor.",
                "upvoteCount": parseInt(question.likes) || 0,
            }
        }
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-dark-950 text-gray-200">
            {/* Inject JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <Navbar />
            <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                <MobileQuestionLayout
                    editor={
                        <div className="flex-1 flex flex-col h-full">
                            <CodePlayer question={question} />
                        </div>
                    }
                    details={
                        <div className="h-full flex flex-col">
                            {/* Problem Details */}
                            <div className="p-6 flex-1">
                                <div className="flex flex-col gap-6">

                                    {/* Mobile/Tablet ONLY: Full Problem Description (Replicates Left Panel) */}
                                    <div className="lg:hidden flex flex-col gap-6">
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight">{question.title}</h1>
                                                {question.tags?.includes("New") && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand text-black uppercase shrink-0 mt-1">New</span>
                                                )}
                                            </div>

                                            {/* Mobile Difficulty/Stats Row */}
                                            <div className="flex items-center flex-wrap gap-3 text-sm text-gray-400">
                                                <span className={cn(
                                                    "font-bold px-2 py-0.5 rounded text-xs",
                                                    question.difficulty === "Easy" ? "text-green-400 bg-green-400/10" :
                                                        question.difficulty === "Medium" ? "text-yellow-400 bg-yellow-400/10" :
                                                            "text-red-400 bg-red-400/10"
                                                )}>
                                                    {question.difficulty}
                                                </span>
                                                <span className="text-xs">{question.duration}</span>
                                            </div>
                                        </div>

                                        {/* Markdown Description */}
                                        <div className="prose prose-invert prose-sm max-w-none 
                                            prose-headings:text-gray-100 prose-headings:font-bold prose-headings:mb-3 prose-headings:mt-6
                                            prose-p:text-gray-300 prose-p:leading-7 prose-p:mb-4
                                            prose-strong:text-white prose-strong:font-bold
                                            prose-code:bg-[#282828] prose-code:text-[#e6e6e6] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-sm prose-code:font-mono prose-code:text-[13px] prose-code:before:content-none prose-code:after:content-none
                                            prose-pre:bg-[#282828] prose-pre:border prose-pre:border-dark-600 prose-pre:rounded-lg prose-pre:p-4
                                            prose-li:text-gray-300 prose-li:marker:text-gray-500 prose-li:mb-2
                                            ">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {question.desc}
                                            </ReactMarkdown>
                                        </div>

                                        {/* Examples */}
                                        <div className="space-y-6">
                                            {question.testCases?.slice(0, 3).map((tc, i) => (
                                                <div key={i}>
                                                    <h3 className="text-white font-bold text-base mb-3">Example {i + 1}:</h3>
                                                    <div className="bg-[#1a1a1a] rounded-lg p-4 font-mono text-sm border-l-2 border-dark-600">
                                                        <div className="flex gap-3 mb-2">
                                                            <span className="text-gray-500 font-medium select-none min-w-[50px]">Input:</span>
                                                            <span className="text-gray-200 break-all">{JSON.stringify(tc.input)}</span>
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <span className="text-gray-500 font-medium select-none min-w-[50px]">Output:</span>
                                                            <span className="text-gray-200 break-all">{JSON.stringify(tc.output)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Constraints */}
                                        {question.constraints && (
                                            <div className="pt-6 border-t border-dark-800">
                                                <h3 className="text-white font-bold text-base mb-4">Constraints:</h3>
                                                <div className="prose prose-invert prose-sm max-w-none 
                                                         prose-li:text-gray-300 prose-li:marker:text-gray-500 prose-li:mb-1
                                                         prose-code:bg-[#282828] prose-code:text-[#e6e6e6] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-sm prose-code:font-mono prose-code:text-[13px] prose-code:before:content-none prose-code:after:content-none
                                                    ">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {question.constraints}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        )}

                                        {/* Divider for Metadata */}
                                        <div className="h-px bg-dark-800 my-4" />
                                    </div>

                                    {/* Metadata Section - Visible on All but styled for sidebar on Desktop */}
                                    <div className="flex flex-col gap-4">

                                        {/* Status & Interactions Row */}
                                        <div className="flex items-center flex-wrap gap-3 text-sm text-gray-400 pb-4 border-b border-dark-800">
                                            <span className={cn(
                                                "font-bold px-2 py-0.5 rounded text-xs",
                                                question.difficulty === "Easy" ? "text-green-400 bg-green-400/10" :
                                                    question.difficulty === "Medium" ? "text-yellow-400 bg-yellow-400/10" :
                                                        "text-red-400 bg-red-400/10"
                                            )}>
                                                {question.difficulty}
                                            </span>
                                            <span className="text-xs">{question.duration}</span>

                                            <div className="ml-auto">
                                                <QuestionInteractions question={question} />
                                            </div>
                                        </div>

                                        {/* SEO Content: Approach & Complexity */}
                                        {question.approach && (
                                            <div className="bg-dark-800 p-4 rounded-lg border border-dark-700">
                                                <h2 className="text-xs font-bold text-white mb-2 uppercase tracking-wide">Approach Preview</h2>
                                                <div className="text-xs text-gray-400 prose prose-invert max-w-none whitespace-pre-wrap line-clamp-[10]">
                                                    {question.approach.replace(/###/g, '')}
                                                </div>
                                            </div>
                                        )}

                                        {question.complexity && (
                                            <div className="grid grid-cols-1 gap-3">
                                                <div className="bg-dark-900 p-3 rounded border border-dark-700">
                                                    <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Time Complexity</div>
                                                    <div className="text-sm font-mono text-brand truncate" title={question.complexity.time}>{question.complexity.time}</div>
                                                </div>
                                                <div className="bg-dark-900 p-3 rounded border border-dark-700">
                                                    <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Space Complexity</div>
                                                    <div className="text-sm font-mono text-purple-400 truncate" title={question.complexity.space}>{question.complexity.space}</div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Company Link */}
                                        <div className="flex items-center gap-3 pt-2">
                                            <Link href={`/company/${companySlug}`} className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0 hover:scale-105 transition-transform bg-dark-800 border border-dark-700", question.img)}>
                                                {question.company[0]}
                                            </Link>
                                            <div>
                                                <div className="text-[10px] text-gray-500 uppercase font-bold">Asked at</div>
                                                <Link href={`/company/${companySlug}`} className="text-sm text-white font-bold hover:text-brand transition-colors">
                                                    {question.company}
                                                </Link>
                                            </div>
                                        </div>

                                        {/* EEAT: Author Signal */}
                                        <div className="pt-4 border-t border-dark-800">
                                            <AuthorCard />
                                        </div>

                                        <div className="text-[10px] text-gray-600 font-mono text-center mt-4">
                                            Last updated {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                />
            </main>
        </div>
    );
}
