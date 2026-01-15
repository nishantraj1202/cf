"use client";

import React, { useState, useEffect } from "react";
import { X, Volume2 } from "lucide-react";

export function IntroVideo() {
    const [isVisible, setIsVisible] = useState(true);
    const [canSkip, setCanSkip] = useState(false);
    const videoRef = React.useRef<HTMLVideoElement>(null);

    const [showPlayButton, setShowPlayButton] = useState(false);

    useEffect(() => {
        // Check if we've already shown the intro in this session
        const hasSeenIntro = sessionStorage.getItem("hasSeenIntro");
        if (hasSeenIntro) {
            setIsVisible(false);
            return;
        }

        const playVideo = async () => {
            const video = videoRef.current;
            if (video) {
                try {
                    // Try to play with sound
                    video.muted = false;
                    video.volume = 1.0;
                    await video.play();
                } catch (error) {
                    console.log("Autoplay prevented:", error);
                    // If blocked, show manual play button
                    setShowPlayButton(true);
                }
            }
        };

        playVideo();

        // Allow skipping after 2 seconds
        const skipTimer = setTimeout(() => setCanSkip(true), 2000);

        return () => {
            clearTimeout(skipTimer);
        };
    }, []);

    const handleManualPlay = () => {
        if (videoRef.current) {
            videoRef.current.muted = false;
            videoRef.current.volume = 1.0;
            videoRef.current.play();
            setShowPlayButton(false);
        }
    };

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsVisible(false);
        sessionStorage.setItem("hasSeenIntro", "true");
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
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

                {/* Manual Play Button Overlay */}
                {showPlayButton && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                        <button
                            onClick={handleManualPlay}
                            className="group flex flex-col items-center gap-4 transition-transform hover:scale-105"
                        >
                            <div className="w-20 h-20 rounded-full bg-brand flex items-center justify-center shadow-[0_0_30px_rgba(255,153,0,0.5)] group-hover:shadow-[0_0_50px_rgba(255,153,0,0.8)] transition-shadow">
                                <Volume2 className="w-10 h-10 text-black fill-black" />
                            </div>
                            <span className="text-white font-bold text-lg tracking-widest uppercase">Click to Start</span>
                        </button>
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
