"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import JoinPanel from "../components/hud/JoinPanel";
import SavePanel from "../components/hud/SavePanel";
import { ensureAnonymousAuth } from "../lib/firebaseClient";
import { apiPost } from "../lib/magiApi";
import { useGameState } from "../lib/useGameState";

export default function LobbyPage() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const { game, players } = useGameState(gameId);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("magi.gameId");
    setGameId(stored || null);
    ensureAnonymousAuth().then((user) => setUid(user?.uid ?? null));
  }, []);

  const isHost = useMemo(() => {
    if (!game || !uid) return false;
    return game.memberIds?.[0] === uid;
  }, [game, uid]);

  const handleStart = async () => {
    if (!gameId) return;
    setError(null);
    setStatus(null);
    setStarting(true);
    try {
      await apiPost("/api/game/start", { gameId });
      setStatus("ゲームを開始しました");
    } catch (err: any) {
      setError(err?.message ?? "開始に失敗しました");
    } finally {
      setStarting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0c0a09] px-6 py-10 text-[#f1e6d2]">
      <div className="w-full max-w-5xl">
        <div className="mb-6">
          <div className="text-xs uppercase tracking-[0.3em] text-[#a8946b]">MAGI CHAIN</div>
          <h1 className="mt-2 text-3xl font-semibold text-[#f5e7c9]">Lobby</h1>
          <p className="mt-2 text-sm text-[#c9b691]">
            ルーム参加・再開・セーブロードをここで行います。
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <JoinPanel layout="panel" onGameChange={setGameId} />
          </div>
          <div className="lg:col-span-1">
            <SavePanel layout="panel" onGameChange={setGameId} />
          </div>
          <div className="lg:col-span-1 space-y-4 rounded-xl border border-[#6b5846] bg-black/70 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-[#a8946b]">Current Room</div>
            <div className="text-sm text-[#f5e7c9]">{gameId ?? "未選択"}</div>
            <div className="text-xs text-[#c9b691]">状態: {game?.status ?? "-"}</div>
            <div className="text-xs text-[#c9b691]">参加者: {players.length}</div>

            {gameId && (
              <div className="flex flex-col gap-2">
                <Link
                  href="/game"
                  className="rounded-md border border-[#7a5b3a] bg-[#201813] px-3 py-2 text-center text-xs font-semibold text-[#f1e6d2]"
                >
                  ゲーム画面へ
                </Link>
                <button
                  type="button"
                  disabled={!isHost || game?.status !== "lobby" || starting}
                  onClick={handleStart}
                  className="rounded-md border border-[#3b2e21] bg-[#15100c] px-3 py-2 text-xs text-[#c9b691] disabled:opacity-50"
                >
                  ゲーム開始（ホストのみ）
                </button>
              </div>
            )}

            {(status || error) && (
              <div className="text-xs">
                {status && <div className="text-[#a6e3a1]">{status}</div>}
                {error && <div className="text-[#ff8b8b]">{error}</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
