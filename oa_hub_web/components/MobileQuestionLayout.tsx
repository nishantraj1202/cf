"use client";

import React, { useState } from "react";
import { FileText, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileQuestionLayoutProps {
    editor: React.ReactNode;
    details: React.ReactNode;
}

export function MobileQuestionLayout({ editor, details }: MobileQuestionLayoutProps) {
    const [activeTab, setActiveTab] = useState<"details" | "editor">("details");

    return (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
            {/* Mobile Tab Bar (Bottom) */}
            <div className="lg:hidden absolute bottom-0 left-0 right-0 h-14 bg-dark-900 border-t border-dark-700 flex z-50">
                <button
                    onClick={() => setActiveTab("details")}
                    className={cn(
                        "flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                        activeTab === "details" ? "text-brand bg-dark-800" : "text-gray-400 hover:text-white"
                    )}
                >
                    <FileText className="w-5 h-5" />
                    Description
                </button>
                <button
                    onClick={() => setActiveTab("editor")}
                    className={cn(
                        "flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                        activeTab === "editor" ? "text-brand bg-dark-800" : "text-gray-400 hover:text-white"
                    )}
                >
                    <Code2 className="w-5 h-5" />
                    Code
                </button>
            </div>

            {/* Editor Panel */}
            <div className={cn(
                "flex-1 border-r border-dark-800 bg-dark-900 overflow-hidden flex flex-col",
                // Mobile: Show only if activeTab is editor. Use hidden to preserve state? 
                // Using hidden class allows keeping the component mounted.
                "absolute inset-0 bottom-14 lg:static lg:bottom-auto lg:h-auto",
                activeTab === "editor" ? "z-10" : "z-0 hidden lg:flex"
            )}>
                {editor}
            </div>

            {/* Details Panel */}
            <div className={cn(
                "w-full lg:w-[450px] flex flex-col border-l border-dark-800 bg-black overflow-y-auto custom-scroll",
                "absolute inset-0 bottom-14 lg:static lg:bottom-auto lg:h-auto",
                activeTab === "details" ? "z-10" : "z-0 hidden lg:flex"
            )}>
                {details}
            </div>
        </div>
    );
}
