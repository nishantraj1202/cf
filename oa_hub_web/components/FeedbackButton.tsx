"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { MessageSquarePlus, X, Send, Star } from "lucide-react";

interface FeedbackButtonProps {
    variant?: 'sidebar' | 'navbar' | 'mobile';
}

export function FeedbackButton({ variant = 'sidebar' }: FeedbackButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [formData, setFormData] = useState({
        pros: "",
        cons: "",
        suggestions: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (rating === 0) {
            return; // Require rating
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rating,
                    pros: formData.pros,
                    cons: formData.cons,
                    suggestions: formData.suggestions,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit feedback');
            }

            // Reset form
            setFormData({ pros: "", cons: "", suggestions: "" });
            setRating(0);
            setSubmitted(true);

            // Close after showing success
            setTimeout(() => {
                setIsOpen(false);
                setSubmitted(false);
            }, 2000);
        } catch (error) {
            console.error('Feedback submission error:', error);
            // Show error state or just close
            setSubmitted(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Different button styles based on variant
    const buttonStyles = {
        sidebar: "flex items-center gap-2 w-full px-3 py-2.5 mt-3 text-sm font-medium rounded-lg bg-gradient-to-r from-brand/20 to-purple-500/20 text-brand hover:from-brand/30 hover:to-purple-500/30 border border-brand/30 hover:border-brand/50 transition-all duration-300 group",
        navbar: "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded border border-purple-500/50 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 transition-all duration-200",
        mobile: "flex items-center gap-2 text-purple-400 font-medium py-1"
    };

    return (
        <>
            {/* Feedback Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={buttonStyles[variant]}
            >
                <MessageSquarePlus className="w-4 h-4" />
                <span>Feedback</span>
                {variant === 'sidebar' && (
                    <span className="ml-auto text-[10px] text-gray-500 group-hover:text-brand/70">Share</span>
                )}
            </button>

            {/* Modal Overlay - Rendered via Portal to escape sidebar stacking context */}
            {mounted && isOpen && createPortal(
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
                    onClick={() => setIsOpen(false)}
                >
                    {/* Modal Content */}
                    <div
                        className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-md p-6 shadow-2xl
                            animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-white">Share Your Feedback</h2>
                                <p className="text-sm text-gray-400 mt-1">Help us improve CodinzHub</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {submitted ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Thank You!</h3>
                                <p className="text-gray-400">Your feedback has been submitted.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Star Rating */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Overall Rating
                                    </label>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                className="p-1 transition-transform hover:scale-110"
                                            >
                                                <Star
                                                    className={`w-6 h-6 transition-colors ${star <= (hoverRating || rating)
                                                        ? "fill-yellow-400 text-yellow-400"
                                                        : "text-gray-600"
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Pros */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        <span className="text-green-400">👍</span> What do you like?
                                    </label>
                                    <textarea
                                        value={formData.pros}
                                        onChange={(e) => setFormData({ ...formData, pros: e.target.value })}
                                        placeholder="Tell us what you love about CodinzHub..."
                                        className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg
                                            text-sm text-white placeholder-gray-500
                                            focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50
                                            resize-none transition-all"
                                        rows={2}
                                    />
                                </div>

                                {/* Cons */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        <span className="text-red-400">👎</span> What could be better?
                                    </label>
                                    <textarea
                                        value={formData.cons}
                                        onChange={(e) => setFormData({ ...formData, cons: e.target.value })}
                                        placeholder="Share any issues or frustrations..."
                                        className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg
                                            text-sm text-white placeholder-gray-500
                                            focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50
                                            resize-none transition-all"
                                        rows={2}
                                    />
                                </div>

                                {/* Suggestions */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        <span className="text-blue-400">💡</span> Suggestions
                                    </label>
                                    <textarea
                                        value={formData.suggestions}
                                        onChange={(e) => setFormData({ ...formData, suggestions: e.target.value })}
                                        placeholder="Any features you'd like to see?"
                                        className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg
                                            text-sm text-white placeholder-gray-500
                                            focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50
                                            resize-none transition-all"
                                        rows={2}
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3
                                        bg-gradient-to-r from-brand to-purple-500 
                                        hover:from-brand/90 hover:to-purple-500/90
                                        text-white font-semibold rounded-lg
                                        transition-all duration-300 
                                        disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Submit Feedback
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
