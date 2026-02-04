"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import GameMap from "../../components/map/GameMap";
import GameHUD from "../../components/hud/GameHUD";
import GameMenu from "../../components/hud/GameMenu";
import ActionPanel from "../../components/hud/ActionPanel";
import { ensureAnonymousAuth } from "../../lib/firebaseClient";
import { useGameState } from "../../lib/useGameState";
import { TILE_MAP } from "../../lib/magiData";
import { apiPost } from "../../lib/magiApi";

export default function GamePage() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const { game, players, loading, error } = useGameState(gameId);

  const currentPlayer = game && uid ? game.players?.[uid] ?? null : null;
  const isMyTurn = Boolean(game && currentPlayer && game.turn.currentPlayerId === currentPlayer.uid);

  const moveTargets =
    game && currentPlayer && game.phase === "move" && currentPlayer.resources.move > 0 && isMyTurn
      ? (TILE_MAP[currentPlayer.boardPos]?.neighbors ?? []).filter((targetId) => {
          const target = TILE_MAP[targetId];
          if (!target) return false;
          if (target.type === "city") return true;
          return !players.some((player) => player.uid !== currentPlayer.uid && player.boardPos === targetId);
        })
      : [];

  const handleMove = async (nodeId: string) => {
    if (!game) return;
    try {
      await apiPost("/api/game/action", {
        gameId: game.id,
        snapshotVersion: game.snapshotVersion,
        action: { type: "move", targetId: nodeId },
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const stored = window.localStorage.getItem("magi.gameId");
    setGameId(stored || null);
    ensureAnonymousAuth().then((user) => setUid(user?.uid ?? null));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0c0a09] overflow-hidden">
      <div className="relative w-full max-w-6xl aspect-square">
        <GameMap tiles={TILE_MAP} players={players} moveTargets={moveTargets} onMove={isMyTurn ? handleMove : undefined} />
        <GameHUD
          phase={game?.phase}
          turnNumber={game?.turn.turnNumber}
          currentPlayerName={game?.players?.[game?.turn.currentPlayerId ?? ""]?.name}
          resources={currentPlayer?.resources}
        />
        <ActionPanel game={game} currentPlayer={currentPlayer} />
        <GameMenu gameId={gameId} game={game} players={players} currentUid={uid} />

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
