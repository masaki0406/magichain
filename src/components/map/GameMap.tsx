"use client";

import React, { useMemo, useState } from "react";
import type { PlayerState, Tile } from "../../lib/magiTypes";

type GameMapProps = {
  tiles: Record<string, Tile>;
  players: PlayerState[];
  moveTargets?: string[];
  onMove?: (nodeId: string) => void;
};

const TILE_COLORS: Record<Tile["type"], string> = {
  city: "bg-[#3d2f24]",
  danger: "bg-[#5a3b2f]",
  element: "bg-[#2f3b5a]",
  seed: "bg-[#2f5a3b]",
  monster: "bg-[#5a2f2f]",
};

export default function GameMap({ tiles, players, moveTargets = [], onMove }: GameMapProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const tileList = useMemo(() => Object.values(tiles), [tiles]);

  return (
    <div className="relative w-full max-w-5xl mx-auto aspect-square rounded-lg border-4 border-[#5c4033] bg-[#0e0b09] shadow-2xl">
      <div className="absolute inset-0">
        {tileList.map((tile) => {
          const occupant = players.filter((player) => player.boardPos === tile.id);
          const isTarget = moveTargets.includes(tile.id);
          return (
            <button
              key={tile.id}
              type="button"
              disabled={!isTarget || !onMove}
              onMouseEnter={() => setHoveredNode(tile.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => onMove?.(tile.id)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[#3b2e21] px-3 py-2 text-left text-[11px] text-[#f1e6d2] shadow-md transition ${
                TILE_COLORS[tile.type]
              } ${isTarget ? "ring-2 ring-[#cfa968]" : "opacity-90"}`}
              style={{ left: `${tile.x * 10 + 10}%`, top: `${tile.y * 10 + 10}%` }}
            >
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#a8946b]">
                {tile.type}
              </div>
              <div className="font-semibold text-[#f5e7c9]">{tile.name}</div>
              <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-[#e6d4b0]">
                {occupant.length > 0 ? (
                  occupant.map((player) => (
                    <span key={player.uid} className="rounded-full bg-black/40 px-2 py-0.5">
                      {player.name}
                    </span>
                  ))
                ) : (
                  <span className="text-[#c9b691]">空き</span>
                )}
              </div>
              {hoveredNode === tile.id && (
                <div className="mt-2 text-[10px] text-[#c9b691]">
                  隣接: {tile.neighbors.join(", ")}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
