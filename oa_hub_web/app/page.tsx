
import React from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { IntroVideo } from "@/components/IntroVideo";
import { FAQ } from "@/components/FAQ";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Play, CheckCircle, SearchX } from "lucide-react";
import { type Metadata } from "next";
import { API_URL, cn } from "@/lib/utils";
import { type Question } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://codinzhub.com';

export const metadata: Metadata = {
  title: "Home - Premium Coding Interview Prep",
  description: "The ultimate guide to cracking online assessments. Practice real OA questions from Google, Meta, Amazon, and 50+ top tech companies. Start your interview prep today!",
  openGraph: {
    title: "Codinzhub - Master Your Coding Interviews",
    description: "Practice real OA questions from top tech companies. Join thousands of developers preparing for their dream jobs.",
    url: BASE_URL,
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export const dynamic = 'force-dynamic';

async function getRecentQuestions() {
  try {
    const res = await fetch(`${API_URL}/api/questions?limit=8`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error('Failed to fetch questions');
    }
    const data = await res.json();
    // Handle both array and paginated response structure
    if (Array.isArray(data)) return data;
    if (data.questions && Array.isArray(data.questions)) return data.questions;
    return [];
  } catch (error) {
    console.error("Error fetching questions:", error);
    return [];
  }
}

export default async function Home() {
  const recentQuestions = await getRecentQuestions();

  // JSON-LD Structured Data for the website
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Codinzhub",
    "url": BASE_URL,
    "description": "The ultimate platform for tracking and practicing Online Assessments and coding interview questions.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${BASE_URL}/questions?search={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  // JSON-LD for the item list (questions collection)
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Top Coding Interview Questions",
    "description": "Recently uploaded interview questions from top tech companies",
    "numberOfItems": recentQuestions.length,
    "itemListElement": recentQuestions.slice(0, 8).map((q: Question, index: number) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Course",
        "name": q.title,
        "description": q.desc?.substring(0, 150) || "",
        "provider": {
          "@type": "Organization",
          "name": q.company
        },
        "url": `${BASE_URL}/question/${q.slug || q.id}`
      }
    }))
  };

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-dark-950 text-gray-200">
      {/* Inject JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <div className="flex-1 relative flex flex-col min-w-0 overflow-hidden">
          <IntroVideo videoSrc="/intro.mp4" maxDuration={5000} />
          <main className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-8 bg-dark-900">
            <div className="max-w-7xl mx-auto">

              {/* Hero / Featured Section (Daily Question) */}
              {recentQuestions.length > 0 && (() => {
                // simple deterministic "random" pick based on date
                const today = new Date();
                const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
                const featuredIndex = dayOfYear % recentQuestions.length;
                const featured = recentQuestions[featuredIndex];

                // 7-day image rotation
                const bgImages = [
                  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop", // Laptop Code (Original)
                  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop", // Coding Screen Matrix
                  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop", // Cyberpunk City/Tech
                  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop", // Team Collaborating
                  "https://images.unsplash.com/photo-1605379399642-870262d3d051?q=80&w=2070&auto=format&fit=crop", // Server/Hardware interaction
                  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2070&auto=format&fit=crop", // Coffee & Laptop Minimal
                  "https://images.unsplash.com/photo-1504639725590-34d0984388bd?q=80&w=2070&auto=format&fit=crop", // Abstract Tech Code
                ];
                const dailyImage = bgImages[dayOfYear % 7];

                return (
                  <Link href={`/question/${featured.slug || featured.id}`} className="block mb-10 relative w-full aspect-[4/5] sm:aspect-video lg:aspect-[24/8] bg-dark-800 rounded-xl overflow-hidden cursor-pointer group border border-dark-700 hover:border-brand transition-all shadow-2xl">
                    {/* Background Gradient/Image Simulation */}
                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black via-dark-900/80 to-transparent z-10"></div>
                    {/* Background Image (Dynamic) */}
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700"
                      style={{ backgroundImage: `url('${dailyImage}')` }}
                    ></div>

                    <div className="absolute inset-0 z-20 p-6 md:p-10 flex flex-col justify-end md:justify-center items-start">
                      <span className="bg-brand text-black text-xs font-bold px-2 py-1 rounded uppercase tracking-wider mb-3 shadow">Daily Challenge</span>
                      <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 max-w-2xl leading-tight line-clamp-2">{featured.title}</h2>
                      <div className="flex items-center gap-3 text-sm text-gray-300 mb-6">
                        <span className="font-bold text-white">{featured.company}</span>
                        <span>•</span>
                        <span>{(parseInt(featured.views || '0') + 100).toLocaleString()} Views</span>
                        <span>•</span>
                        <span className={cn(
                          "font-bold",
                          featured.difficulty === "Easy" ? "text-green-400" :
                            featured.difficulty === "Medium" ? "text-yellow-400" :
                              "text-red-400"
                        )}>{featured.difficulty}</span>
                      </div>
                      <div
                        className="bg-white hover:bg-gray-200 text-black px-6 py-3 rounded font-bold flex items-center gap-2 transition-colors w-full md:w-auto justify-center"
                      >
                        <Play className="w-5 h-5 fill-black" /> Solve Now
                      </div>
                    </div>
                  </Link>
                );
              })()}

              {/* Recommended Questions Header */}
              <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-xl font-bold text-white">Recently Uploaded</h1>
                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                  <button className="bg-dark-800 text-white px-3 py-1 rounded text-xs font-bold border border-dark-700 hover:bg-dark-700 whitespace-nowrap">All</button>
                  <button className="bg-transparent text-gray-400 px-3 py-1 rounded text-xs font-bold hover:text-white whitespace-nowrap">New to you</button>
                  <button className="bg-transparent text-gray-400 px-3 py-1 rounded text-xs font-bold hover:text-white whitespace-nowrap">Recently Uploaded</button>
                </div>
              </div>

              {/* Questions Grid */}
              {recentQuestions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                  {recentQuestions.map((q: Question) => (
                    <Link href={`/question/${q.slug || q.id}`} key={q.id} className="group cursor-pointer flex flex-col gap-2">
                      {/* Thumbnail Area */}
                      <div className="relative w-full aspect-video bg-dark-800 rounded-lg overflow-hidden border border-transparent group-hover:border-dark-600">
                        <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                          <div className={`${q.img || 'bg-gray-700'} w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>
                            {q.company ? q.company[0] : '?'}
                          </div>
                        </div>
                        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                          {q.difficulty || 'Medium'}
                        </div>
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>

                      {/* Meta Area */}
                      <div className="flex gap-3 pr-4">
                        <div className={`${q.img || 'bg-gray-700'} w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5`}>
                          {q.company ? q.company[0] : '?'}
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-sm leading-tight group-hover:text-brand line-clamp-2 mb-1">{q.title}</h3>
                          <div className="text-gray-400 text-xs">
                            <p className="hover:text-white transition-colors flex items-center gap-1">{q.company || 'Unknown'} <CheckCircle className="w-3 h-3 text-gray-500" /></p>
                            <p>{(parseInt(q.views || '0') + 100).toLocaleString()} views • 2 days ago</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-dark-700 rounded-xl">
                  <SearchX className="w-12 h-12 text-gray-600 mb-4" />
                  <h3 className="text-lg font-bold text-white">No questions found</h3>
                  <p className="text-gray-500 text-sm mt-2">
                    Make sure the backend is running and connected to the database.
                  </p>
                </div>
              )}

              {/* Explore More Button */}
              <div className="mt-12 flex justify-center mb-16">
                <Link
                  href="/questions"
                  className="px-8 py-3 bg-dark-800 hover:bg-dark-700 text-white font-bold rounded-full border border-dark-700 transition-all flex items-center gap-2"
                >
                  Explore More Problems
                </Link>
              </div>

              <FAQ />
            </div>
            <Footer className="lg:hidden" />
          </main>
        </div>
      </div>
    </div>
  );
}
