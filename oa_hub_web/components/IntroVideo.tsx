"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface IntroVideoProps {
    videoSrc?: string;
    maxDuration?: number; // in ms
    onComplete?: () => void;
}

export function IntroVideo({
    videoSrc = "/intro.mp4",
    maxDuration = 5000,
    onComplete
}: IntroVideoProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [isFading, setIsFading] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        // Check if already seen
        const hasSeenIntro = sessionStorage.getItem("hasSeenIntro");
        if (hasSeenIntro) {
            setIsVisible(false);
            if (onComplete) onComplete();
            return;
        }

        // Auto-skip timer
        const timer = setTimeout(() => {
            handleComplete();
        }, maxDuration);

        return () => clearTimeout(timer);
    }, [maxDuration, onComplete]);

    const handleComplete = () => {
        setIsFading(true);
        // Allow fade animation to play
        setTimeout(() => {
            setIsVisible(false);
            sessionStorage.setItem("hasSeenIntro", "true");
            if (onComplete) onComplete();
        }, 500); // 500ms match duration-500
    };

    if (!isVisible) return null;

    return (
        <div
            onClick={handleComplete}
            className={cn(
                "absolute inset-0 z-[40] bg-black flex items-center justify-center cursor-pointer transition-opacity duration-500",
                isFading ? "opacity-0 pointer-events-none" : "opacity-100"
            )}
        >
            <video
                ref={videoRef}
                src={videoSrc}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain"
                onEnded={handleComplete}
            />

            {/* Optional text or overlay can go here if needed */}
            <div className="absolute bottom-10 right-10 text-white/30 text-sm font-light">
                Click anywhere to skip
            </div>
        </div>
    );
}
