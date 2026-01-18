"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2, Play } from "lucide-react";

export function IntroVideo() {
    // Phases: 'loading' | 'interaction' | 'playing' | 'finished'
    const [phase, setPhase] = useState<'loading' | 'interaction' | 'playing' | 'finished'>('loading');
    const videoRef = useRef<HTMLVideoElement>(null);
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        // 1. Check if already seen
        const hasSeenIntro = sessionStorage.getItem("hasSeenIntro");
        if (hasSeenIntro) {
            setPhase('finished');
            return;
        }

        // 2. Loading Timer (3-4 seconds)
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setPhase('interaction');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleEnter = () => {
        const video = videoRef.current;
        if (video) {
            // User interaction allows unmuted playback
            video.muted = false;
            video.currentTime = 0;
            video.play()
                .then(() => {
                    setPhase('playing');
                })
                .catch(err => {
                    console.error("Playback failed:", err);
                    setPhase('playing'); // Fallback state
                });
        }
    };

    const handleEnd = () => {
        setPhase('finished');
        sessionStorage.setItem("hasSeenIntro", "true");
    };

    const handleSkip = () => {
        if (videoRef.current) videoRef.current.pause();
        handleEnd();
    };

    if (phase === 'finished') return null;

    return (
        <div
            className="absolute inset-0 z-[40] bg-black flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-500"
        // No inline style needed as it fills relative parent
        >
            {/* Background Video (Acts as Poster in earlier phases if needed, or Main Content) */}
            <video
                ref={videoRef}
                id="introVideo"
                src="/intro_hc.mp4"
                playsInline
                className={`w-full h-full object-contain transition-opacity duration-1000 ${phase === 'playing' ? 'opacity-100' : 'opacity-40 blur-sm'}`}
                onEnded={handleEnd}
            />

            {/* Content Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-50">

                {phase === 'loading' && (
                    <div className="flex flex-col items-center gap-6 animate-pulse">
                        <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center border border-brand/20">
                            <Loader2 className="w-10 h-10 text-brand animate-spin" />
                        </div>
                        <h2 className="text-2xl font-bold text-white tracking-widest uppercase">
                            Loading Experience
                        </h2>
                        <span className="text-brand font-mono text-sm">Initializing... {countdown}s</span>
                    </div>
                )}

                {phase === 'interaction' && (
                    <div className="text-center space-y-8 animate-in zoom-in-50 duration-500 slide-in-from-bottom-10">
                        <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tighter drop-shadow-2xl">
                            Welcome to <span className="text-brand">CodinzHub</span>
                        </h1>
                        <p className="text-gray-300 max-w-md mx-auto leading-relaxed">
                            Prepare for your coding interview with premium assessments and real-world scenarios.
                        </p>

                        <button
                            onClick={handleEnter}
                            className="group relative px-8 py-4 bg-white text-black font-bold text-lg rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                        >
                            <span className="relative z-10 flex items-center gap-3">
                                Enter Website <Play className="w-5 h-5 fill-current" />
                            </span>
                            <div className="absolute inset-0 bg-brand translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                        </button>
                    </div>
                )}

                {phase === 'playing' && (
                    <button
                        onClick={handleSkip}
                        className="absolute bottom-12 right-12 text-white/50 hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-widest border border-white/20 px-6 py-2 rounded-full hover:bg-white/10 transition-all backdrop-blur-sm"
                    >
                        Skip Intro
                    </button>
                )}
            </div>

            {/* Visual Flair (Optional) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black pointer-events-none opacity-80" />
        </div>
    );
}
