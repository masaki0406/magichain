"use client";

import React, { useState } from 'react';
import { WORLD_MAP } from '../../data/map';

export default function GameMap({ onMove }: { onMove: (nodeId: string) => void }) {
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    return (
        <div className="relative w-full max-w-5xl mx-auto aspect-square bg-black rounded-lg shadow-2xl overflow-hidden border-8 border-[#5c4033]">
            {/* Background Image */}
            <img
                src="/assets/board_bg.png"
                alt="Eldritch Horror Map"
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Connections Layer (SVG) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {Object.values(WORLD_MAP).flatMap((node) =>
                    node.connections.map((conn) => {
                        const target = WORLD_MAP[conn.targetId];
                        if (!target) return null;
                        // Draw line from node to target
                        // To avoid drawing twice, we could check IDs, but drawing twice is fine for now.

                        let strokeColor = "#888"; // Default
                        let strokeDasharray = "5,5"; // Default dashed

                        if (conn.type === 'TRAIN') {
                            strokeColor = "#b91c1c"; // Red-700
                            strokeDasharray = "8,4";
                        } else if (conn.type === 'SHIP') {
                            strokeColor = "#0369a1"; // Sky-700
                            strokeDasharray = "8,4";
                        } else if (conn.type === 'UNCHARTED') {
                            strokeColor = "#d4d4d8"; // Zinc-300
                            strokeDasharray = "2,4";
                        }

                        return (
                            <line
                                key={`${node.id}-${target.id}`}
                                x1={`${node.x}%`}
                                y1={`${node.y}%`}
                                x2={`${target.x}%`}
                                y2={`${target.y}%`}
                                stroke={strokeColor}
                                strokeWidth="0.8%"
                                strokeDasharray={strokeDasharray}
                                strokeLinecap="round"
                                className="opacity-80"
                            />
                        );
                    })
                )}
            </svg>

            {/* Interactive Nodes Layer */}
            <div className="absolute inset-0 w-full h-full">
                {Object.values(WORLD_MAP).map((node) => {
                    // Determine Node Style based on ID
                    const isMajorCity = ["san_francisco", "arkham", "buenos_aires", "london", "rome", "istanbul", "tokyo", "shanghai", "sydney"].includes(node.id);
                    const isMajorWilderness = ["amazon", "pyramids", "heart_of_africa", "antarctica", "himalayas", "tunguska"].includes(node.id);
                    const isNumberedCity = ["1", "5", "6", "7", "14", "15", "16", "17", "20"].includes(node.id);
                    const isNumberedWilderness = ["4", "9", "10", "19", "21"].includes(node.id);
                    const isNumberedSea = ["2", "3", "8", "11", "12", "13", "18"].includes(node.id);

                    let iconSrc = "";
                    let sizeClass = "w-[4%] h-[4%]"; // Default size for numbered

                    // 1. Specific Unique Icons
                    if (node.id === "tokyo") iconSrc = "/assets/icon_tokyo.png";
                    else if (node.id === "london") iconSrc = "/assets/icon_london.png";
                    else if (node.id === "pyramids") iconSrc = "/assets/icon_pyramids.png";
                    else if (node.id === "istanbul") iconSrc = "/assets/icon_istanbul.png";
                    else if (node.id === "shanghai") iconSrc = "/assets/icon_shanghai.png";
                    else if (node.id === "sydney") iconSrc = "/assets/icon_sydney.png";
                    else if (node.id === "amazon") iconSrc = "/assets/icon_amazon.png";
                    else if (node.id === "heart_of_africa") iconSrc = "/assets/icon_heart_of_africa.png";
                    else if (node.id === "antarctica") iconSrc = "/assets/icon_antarctica.png";
                    else if (node.id === "himalayas") iconSrc = "/assets/icon_himalayas.png";
                    else if (node.id === "tunguska") iconSrc = "/assets/icon_tunguska.png";
                    else if (node.id === "san_francisco") iconSrc = "/assets/icon_san_francisco.png";
                    else if (node.id === "arkham") iconSrc = "/assets/icon_arkham.png";
                    else if (node.id === "buenos_aires") iconSrc = "/assets/icon_buenos_aires.png";
                    else if (node.id === "rome") iconSrc = "/assets/icon_rome.png";

                    // 2. Generic Major Icons
                    else if (isMajorCity) iconSrc = "/assets/icon_city.png";
                    else if (isMajorWilderness) iconSrc = "/assets/icon_wilderness.png";

                    // 3. Numbered Type Icons
                    else if (isNumberedCity) iconSrc = "/assets/icon_type_city.png";
                    else if (isNumberedWilderness) iconSrc = "/assets/icon_type_wilderness.png";
                    else if (isNumberedSea) iconSrc = "/assets/icon_type_sea.png";

                    // Adjust size for Major locations
                    if (isMajorCity || isMajorWilderness) {
                        sizeClass = "w-[6%] h-[6%]";
                    }

                    return (
                        <div
                            key={node.id}
                            onMouseEnter={() => setHoveredNode(node.id)}
                            onMouseLeave={() => setHoveredNode(null)}
                            onClick={() => onMove(node.id)}
                            className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition-all z-10 flex items-center justify-center ${sizeClass}`}
                            style={{
                                left: `${node.x}%`,
                                top: `${node.y}%`,
                            }}
                        >
                            {/* Icon Image */}
                            {iconSrc && (
                                <img
                                    src={iconSrc}
                                    alt={node.name}
                                    className="w-full h-full object-contain drop-shadow-md rounded-full"
                                />
                            )}

                            {/* Number Overlay (only for numbered nodes) */}
                            {(isNumberedCity || isNumberedWilderness || isNumberedSea) && (
                                <span className="absolute text-[10px] font-serif font-bold text-[#3e2723] mt-4 bg-[#eaddcf]/80 px-1 rounded-sm border border-[#5c4033]/50 pointer-events-none">
                                    {node.name}
                                </span>
                            )}

                            {/* Tooltip on Hover */}
                            {hoveredNode === node.id && (
                                <div className="absolute bottom-full mb-2 px-2 py-1 bg-[#eaddcf] text-[#5c4033] text-xs font-serif border border-[#5c4033] rounded shadow-lg whitespace-nowrap z-50 pointer-events-none">
                                    {node.name}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
