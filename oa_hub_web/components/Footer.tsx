
import React from "react";
import { cn } from "@/lib/utils";
import { Mail } from "lucide-react";

interface FooterProps {
    className?: string;
}

export function Footer({ className }: FooterProps) {
    return (
        <div className={cn("mt-8 px-3", className)}>
            <div className="text-[10px] text-gray-500 leading-relaxed">
                &copy; 2026 CodinzHub<br />
                Terms • Privacy • Content Policy<br />
                <span className="text-dark-600">v2.4.0 (Stable)</span>
            </div>

            <a
                href="mailto:support@codinzhub.com"
                className="flex items-center gap-2 text-[11px] text-gray-400 hover:text-blue-400 transition-colors duration-200 group w-fit pt-3 border-t border-dark-800/50 mt-3"
            >
                <Mail className="w-3.5 h-3.5 group-hover:text-blue-400" />
                <span>support@codinzhub.com</span>
            </a>
        </div>
    );
}
