"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
    {
        question: "What is CodinzHub?",
        answer: "CodinzHub is a premium coding interview preparation platform designed to help developers crack online assessments and technical interviews at top tech companies."
    },
    {
        question: "Are the questions real?",
        answer: "Yes, our questions are curated from recent real-world online assessments and interviews from major tech companies, ensuring you practice with relevant material."
    },
    {
        question: "Do you offer solutions?",
        answer: "We provide detailed editorials, optimal approaches, and code solutions for many of our problems to help you learn and improve your problem-solving skills."
    },
    {
        question: "Is CodinzHub free to use?",
        answer: "Many parts of CodinzHub are accessible for free. We also offer premium features for structured learning paths and advanced company-specific problem sets."
    },
    {
        question: "How often is content updated?",
        answer: "We update our question bank regularly as new interview experiences and online assessment patterns emerge from the community."
    }
];

export function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="py-16 sm:py-24 bg-dark-900 border-t border-dark-800">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-dark-800 rounded-full border border-dark-700">
                            <HelpCircle className="w-6 h-6 text-brand" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
                    <p className="text-gray-400">Everything you need to know about the platform and how it works.</p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className={cn(
                                "border border-dark-700/50 rounded-lg overflow-hidden transition-all duration-300",
                                openIndex === index ? "bg-dark-800/50 border-dark-600 ring-1 ring-dark-600" : "bg-dark-800/20 hover:bg-dark-800/40"
                            )}
                        >
                            <button
                                onClick={() => toggleFAQ(index)}
                                className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                            >
                                <span className="font-semibold text-gray-200 text-lg">{faq.question}</span>
                                {openIndex === index ? (
                                    <ChevronUp className="w-5 h-5 text-brand shrink-0 ml-4" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-500 shrink-0 ml-4 transition-transform duration-300 group-hover:text-gray-300" />
                                )}
                            </button>

                            <div
                                className={cn(
                                    "overflow-hidden transition-all duration-300 ease-in-out",
                                    openIndex === index ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                                )}
                            >
                                <div className="p-5 pt-0 text-gray-400 leading-relaxed border-t border-dark-700/50 mt-2">
                                    {faq.answer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
