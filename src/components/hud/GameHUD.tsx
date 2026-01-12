"use client";

import React from 'react';

export default function GameHUD() {
    // Mock state - in a real app, this would come from props or context
    const doom = 15; // Example starting value
    const omenIndex = 0; // 0: Green, 1: Blue, 2: Red, 3: Blue

    // Doom Track Configuration (Top of map, curved or straight)
    // Since we don't have the track on the image anymore, we need to draw the track itself OR just the markers.
    // The user asked to "restore" them. Since the image doesn't have them, we should draw the track UI too.
    // Let's create a "Doom Track" component that sits at the top.

    return (
        <div className="absolute inset-0 pointer-events-none z-10">
            {/* Doom Track - Top Center */}
            <div className="absolute top-[8%] left-1/2 transform -translate-x-1/2 w-[60%] h-[10%] flex items-center justify-center">
                {/* Track Background (Visual representation of the track) */}
                <div className="absolute w-full h-8 bg-black/40 border-2 border-[#5c4033] rounded-full backdrop-blur-sm flex items-center justify-between px-4">
                    {Array.from({ length: 21 }).map((_, i) => (
                        <div key={i} className="relative flex flex-col items-center">
                            <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-red-600' : 'bg-[#d4c5a3]'}`}></div>
                            <span className="text-[8px] text-[#d4c5a3] mt-1 font-serif">{i}</span>
                        </div>
                    ))}
                </div>

                {/* Doom Marker */}
                <div
                    className="absolute top-1/2 w-6 h-6 bg-red-600 rounded-full border-2 border-white shadow-[0_0_10px_red] transition-all duration-500 z-20"
                    style={{
                        left: `${(doom / 20) * 96 + 2}%`, // Approximate positioning along the track
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-bold">
                        {doom}
                    </div>
                </div>
            </div>

            {/* Omen Track - Top Right */}
            <div className="absolute top-[5%] right-[5%] w-[12%] aspect-square">
                {/* Omen Track Background */}
                <div className="relative w-full h-full">
                    <svg viewBox="0 0 100 100" className="w-full h-full rotate-45">
                        <circle cx="50" cy="50" r="48" fill="rgba(0,0,0,0.5)" stroke="#5c4033" strokeWidth="2" />
                        {/* Segments */}
                        <path d="M50 50 L50 2 A48 48 0 0 1 98 50 Z" fill="rgba(0,255,0,0.2)" stroke="#5c4033" strokeWidth="1" /> {/* Green */}
                        <path d="M50 50 L98 50 A48 48 0 0 1 50 98 Z" fill="rgba(0,0,255,0.2)" stroke="#5c4033" strokeWidth="1" /> {/* Blue */}
                        <path d="M50 50 L50 98 A48 48 0 0 1 2 50 Z" fill="rgba(255,0,0,0.2)" stroke="#5c4033" strokeWidth="1" /> {/* Red */}
                        <path d="M50 50 L2 50 A48 48 0 0 1 50 2 Z" fill="rgba(0,0,255,0.2)" stroke="#5c4033" strokeWidth="1" /> {/* Blue */}
                    </svg>

                    {/* Omen Spinner / Marker */}
                    <div
                        className="absolute top-1/2 left-1/2 w-full h-full transition-transform duration-500"
                        style={{ transform: `translate(-50%, -50%) rotate(${omenIndex * 90}deg)` }}
                    >
                        <div className="absolute top-0 left-1/2 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white shadow-[0_0_10px_yellow] -translate-x-1/2 -translate-y-1/2"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
