"use client";

import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function IntroVideo() {
    const [isVisible, setIsVisible] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        // Check session storage
        const hasSeenIntro = sessionStorage.getItem("hasSeenIntro");
        if (hasSeenIntro) {
            setIsVisible(false);
            return;
        }

        const video = videoRef.current;
        if (!video) return;

        const playVideo = async () => {
            try {
                // Attempt to play with sound first
                video.muted = false;
                video.currentTime = 0;
                await video.play();
            } catch (err) {
                console.log("Autoplay with sound failed, falling back to muted.", err);
                try {
                    // Fallback to muted autoplay
                    video.muted = true;
                    await video.play();
                } catch (mutedErr) {
                    console.error("Autoplay completely failed:", mutedErr);
                }
            }
        };

        playVideo();

    }, []);

    const handleEnd = () => {
        // Fade out effect could be added here similar to previous version if desired
        // For now, instant close to match 'a.html' simple behavior or smooth fade
        setIsVisible(false);
        sessionStorage.setItem("hasSeenIntro", "true");
    };

    const handleSkip = (e: React.MouseEvent) => {
        e.stopPropagation();
        handleEnd();
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
            <video
                ref={videoRef}
                playsInline
                className="w-full h-full object-contain"
                onEnded={handleEnd}
            >
                <source src="/intro_hc.mp4" type="video/mp4" />
            </video>

            {/* Skip Button (always available) */}
            <button
                onClick={handleSkip}
                className="absolute bottom-8 right-8 text-white/30 hover:text-white text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-2 z-50 mix-blend-difference"
            >
                Skip Intro <X className="w-4 h-4" />
            </button>
        </div>
    );
}
