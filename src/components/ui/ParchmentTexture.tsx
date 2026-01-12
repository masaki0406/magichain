"use client";

import React from 'react';

export default function ParchmentTexture({ className = "", opacity = 0.1 }: { className?: string, opacity?: number }) {
    return (
        <div className={`absolute inset-0 pointer-events-none z-0 ${className}`} style={{ opacity }}>
            <svg className='isolate w-full h-full'>
                <filter id='noiseFilter'>
                    <feTurbulence
                        type='fractalNoise'
                        baseFrequency='0.8'
                        numOctaves='3'
                        stitchTiles='stitch' />
                </filter>
                <rect width='100%' height='100%' filter='url(#noiseFilter)' opacity={0.5} />
            </svg>
            <div className="absolute inset-0 bg-[#d6c0a0] mix-blend-multiply"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]"></div>
        </div>
    );
}
