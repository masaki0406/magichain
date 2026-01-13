"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import GameMap from "../../components/map/GameMap";
import GameHUD from "../../components/hud/GameHUD";
import GameMenu from "../../components/hud/GameMenu";
import { useGameState } from "../../lib/useGameState";

export default function GamePage() {
  const [gameId, setGameId] = useState<string | null>(null);
  const { game, players, loading, error } = useGameState(gameId);

  const handleMove = (nodeId: string) => {
    console.log("move", nodeId);
  };

  useEffect(() => {
    const stored = window.localStorage.getItem("eldritch.gameId");
    setGameId(stored || null);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0c0a09] overflow-hidden">
      <div className="relative w-full max-w-6xl aspect-square">
        <GameMap onMove={handleMove} />
        <GameHUD
          doom={game?.doom}
          omen={game?.omen}
          phase={game?.phase}
          activeInvestigatorId={game?.activeInvestigatorId}
        />
        <GameMenu />

        {(loading || error || !gameId) && (
          <div className="absolute left-4 bottom-4 z-40 max-w-sm rounded-md border border-[#3b2e21] bg-black/70 px-3 py-2 text-xs text-[#f1e6d2]">
            {!gameId && (
              <div className="flex items-center gap-2">
                <span>ルームが未選択です。</span>
                <Link className="underline" href="/">
                  ロビーへ
                </Link>
              </div>
            )}
            {loading && <div>同期中...</div>}
            {error && <div className="text-[#ff8b8b]">{error}</div>}
            {players.length > 0 && (
              <div className="mt-2 text-[#c9b691]">プレイヤー数: {players.length}</div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
