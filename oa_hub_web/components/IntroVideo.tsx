"use client";

import React, { useState, useEffect } from "react";
import { X, Volume2 } from "lucide-react";

export function IntroVideo() {
    const [isVisible, setIsVisible] = useState(true);
    const [canSkip, setCanSkip] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const videoRef = React.useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            // Attempt to play with sound
            video.muted = false;
            video.volume = 1.0;

            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch((error) => {
                    console.log("Autoplay with sound prevented, falling back to muted:", error);
                    // Fallback: Play muted
                    if (video) {
                        video.muted = true;
                        setIsMuted(true);
                        video.play();
                    }
                });
            }
        }

        // Check if we've already shown the intro in this session
        const hasSeenIntro = sessionStorage.getItem("hasSeenIntro");
        if (hasSeenIntro) {
            setIsVisible(false);
            return;
        }

        // Allow skipping after 2 seconds
        const skipTimer = setTimeout(() => setCanSkip(true), 2000);

        return () => {
            clearTimeout(skipTimer);
        };
    }, []);

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsVisible(false);
        sessionStorage.setItem("hasSeenIntro", "true");
    };

    const handleUnmute = () => {
        if (videoRef.current) {
            videoRef.current.muted = false;
            videoRef.current.volume = 1.0;
            setIsMuted(false);
            videoRef.current.play();
        }
    };

    if (!isVisible) return null;

    return (
        <div
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center cursor-pointer"
            onClick={handleUnmute}
        >
            {/* Video Container */}
            <div className="relative w-screen h-screen bg-black flex items-center justify-center">
                <video
                    ref={videoRef}
                    playsInline
                    className="w-full h-full object-contain"
                    onEnded={() => { setIsVisible(false); sessionStorage.setItem("hasSeenIntro", "true"); }}
                >
                    <source src="/intro_hc.mp4" type="video/mp4" />
                </video>

                {/* Click for Sound Indicator */}
                {isMuted && (
                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full flex items-center gap-2 animate-pulse">
                        <Volume2 className="w-5 h-5" />
                        <span className="text-sm font-medium">Click anywhere for sound</span>
                    </div>
                )}

                {/* Skip Button */}
                {canSkip && (
                    <button
                        onClick={handleClose}
                        className="absolute bottom-8 right-8 text-white/50 hover:text-white text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                    >
                        Skip <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
