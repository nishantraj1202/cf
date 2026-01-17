"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Play, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type IntroStep = 'loading' | 'ready' | 'playing' | 'ended';

export function IntroVideo() {
    const [step, setStep] = useState<IntroStep>('loading');
    const [isExiting, setIsExiting] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        // Check session storage
        const hasSeenIntro = sessionStorage.getItem("hasSeenIntro");
        if (hasSeenIntro) {
            setStep('ended');
            return;
        }

        // Simulate initial load / splash screen time
        const timer = setTimeout(() => {
            setStep('ready');
        }, 3500); // 3.5 seconds splash

        return () => clearTimeout(timer);
    }, []);

    const handleEnter = async () => {
        setIsExiting(true);
        // Small delay for fade out of splash elements if needed, 
        // or just transition state immediately.

        // We want to keep the black background, just switch content.
        setStep('playing');
        setIsExiting(false);
    };

    // Auto-play effect when state switches to playing
    useEffect(() => {
        if (step === 'playing' && videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.muted = false; // Enable sound
            videoRef.current.volume = 1.0;

            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Video playback failed:", error);
                    // Fallback or just end intro
                    // setStep('ended');
                });
            }
        }
    }, [step]);

    const handleEnd = () => {
        setIsExiting(true);
        setTimeout(() => {
            setStep('ended');
            sessionStorage.setItem("hasSeenIntro", "true");
        }, 1000); // Fade out duration
    };

    const handleSkip = (e: React.MouseEvent) => {
        e.stopPropagation();
        handleEnd();
    };

    if (step === 'ended') return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-[100] bg-black flex items-center justify-center transition-opacity duration-1000",
                isExiting ? "opacity-0 pointer-events-none" : "opacity-100"
            )}
        >
            {/* SPLASH SCREEN STATE */}
            {step === 'loading' && (
                <div className="flex flex-col items-center animate-fade-in">
                    <div className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 relative">
                        <span className="text-white">Codinz</span>
                        <span className="text-brand">Hub</span>
                        {/* Glitch effect or accent */}
                        <div className="absolute -inset-1 bg-brand/20 blur-xl rounded-full opacity-50 animate-pulse"></div>
                    </div>
                    <div className="flex items-center gap-3 text-gray-400 text-sm tracking-widest uppercase">
                        <Loader2 className="w-4 h-4 animate-spin text-brand" />
                        <span>Initializing Environment</span>
                    </div>
                </div>
            )}

            {/* READY STATE - ENTER BUTTON */}
            {step === 'ready' && (
                <div className="flex flex-col items-center animate-fade-in-up">
                    <div className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 scale-110 transition-transform">
                        <span className="text-white">Codinz</span>
                        <span className="text-brand">Hub</span>
                    </div>

                    <button
                        onClick={handleEnter}
                        className="group relative px-8 py-4 bg-transparent overflow-hidden rounded-full border border-brand/50 hover:border-brand transition-all duration-300"
                    >
                        <div className="absolute inset-0 bg-brand/10 group-hover:bg-brand/20 transition-colors"></div>
                        <div className="relative flex items-center gap-4">
                            <span className="text-xl font-bold text-white tracking-widest uppercase group-hover:tracking-[0.2em] transition-all">Enter Experience</span>
                            <Play className="w-5 h-5 text-brand fill-brand animate-pulse" />
                        </div>
                    </button>

                    <p className="mt-6 text-gray-500 text-xs uppercase tracking-widest">
                        Immersive Experience • Sound On
                    </p>
                </div>
            )}

            {/* VIDEO PLAYING STATE */}
            {step === 'playing' && (
                <div className="relative w-screen h-screen bg-black">
                    <video
                        ref={videoRef}
                        playsInline
                        className="w-full h-full object-contain"
                        onEnded={handleEnd}
                    >
                        <source src="/intro_hc.mp4" type="video/mp4" />
                    </video>

                    {/* Skip Button (always available during video) */}
                    <button
                        onClick={handleSkip}
                        className="absolute bottom-8 right-8 text-white/30 hover:text-white text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-2 z-50 mix-blend-difference"
                    >
                        Skip Intro <X className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
