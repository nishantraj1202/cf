
import React from "react";
import { cn } from "@/lib/utils";

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
        </div>
    );
}
