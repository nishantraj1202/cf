import React from "react";
import { CheckCircle, Github, Linkedin, ExternalLink } from "lucide-react";

interface AuthorProps {
    name?: string;
    role?: string;
    bio?: string;
    initials?: string;
    verified?: boolean;
    socials?: {
        github?: string;
        linkedin?: string;
    };
}

export function AuthorCard({
    name = "Amit Dayal",
    role = "Software Engineer",
    bio = "CSE Undergrad @ NIT Jalandhar. Expert in Data Structures & Algorithms. Building tools to help developers crack FAANG interviews.",
    initials = "AD",
    verified = true,
    socials = {
        github: "https://github.com",
        linkedin: "https://linkedin.com"
    }
}: AuthorProps) {
    return (
        <div className="bg-dark-950/50 rounded-xl p-6 border border-dark-800 my-8 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left hover:border-brand/30 transition-colors duration-300 group">
            <div className="shrink-0 relative">
                <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-2xl border-2 border-brand/20 group-hover:bg-brand/20 transition-colors">
                    {initials}
                </div>
                {verified && (
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full border-2 border-black p-0.5" title="Verified Author">
                        <CheckCircle className="w-3 h-3 text-white fill-green-500" />
                    </div>
                )}
            </div>

            <div className="flex-1">
                <div className="flex flex-col sm:flex-row items-center gap-2 mb-1 justify-center sm:justify-start">
                    <h3 className="text-white font-bold text-lg">Author: {name}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-dark-800 text-[10px] text-gray-400 font-bold uppercase tracking-wide border border-dark-700">
                        {role}
                    </span>
                </div>

                <p className="text-gray-400 text-sm leading-relaxed mb-4 max-w-2xl">
                    {bio}
                </p>

                <div className="flex flex-wrap items-center gap-4 justify-center sm:justify-start text-sm mb-4">
                    <div className="flex items-center gap-1.5 text-green-400 bg-green-400/10 px-2.5 py-1 rounded border border-green-400/20">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Reviewed by Senior Engineers</span>
                    </div>
                </div>

                <div className="flex items-center gap-4 justify-center sm:justify-start text-sm">
                    {socials.github && (
                        <a href={socials.github} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors font-medium flex items-center gap-1.5 group/link">
                            <Github className="w-4 h-4 group-hover/link:text-brand transition-colors" />
                            GitHub
                        </a>
                    )}
                    {socials.linkedin && (
                        <a href={socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors font-medium flex items-center gap-1.5 group/link">
                            <Linkedin className="w-4 h-4 group-hover/link:text-[#0A66C2] transition-colors" />
                            LinkedIn
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
