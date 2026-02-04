"use client";

import React, { useEffect, useState } from "react";
import { auth, ensureAnonymousAuth } from "../../lib/firebaseClient";
import { apiPost } from "../../lib/magiApi";

type JoinPanelLayout = "overlay" | "panel";

type JoinPanelProps = {
  layout?: JoinPanelLayout;
  onGameChange?: (gameId: string) => void;
};

export default function JoinPanel({ layout = "overlay", onGameChange }: JoinPanelProps) {
  const [roomId, setRoomId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedGameId = window.localStorage.getItem("magi.gameId");
    const savedName = window.localStorage.getItem("magi.playerName");
    if (savedGameId) setRoomId(savedGameId);
    if (savedName) setDisplayName(savedName);
  }, []);

  const handleJoin = async () => {
    setError(null);
    setStatus(null);
    setLoading(true);
    try {
      await ensureAnonymousAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("ログインに失敗しました");
      const trimmedGameId = roomId.trim();
      if (!trimmedGameId) throw new Error("ルームIDを入力してください");

      const name = displayName.trim() || "Player";
      await apiPost("/api/game/join", { gameId: trimmedGameId, name });

      if (typeof window !== "undefined") {
        window.localStorage.setItem("magi.gameId", trimmedGameId);
        window.localStorage.setItem("magi.playerName", name);
      }
      onGameChange?.(trimmedGameId);
      setStatus("ルームに参加しました");
    } catch (err: any) {
      setError(err?.message ?? "参加に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    setError(null);
    setStatus(null);
    setLoading(true);
    try {
      await ensureAnonymousAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("ログインに失敗しました");
      const name = displayName.trim() || "Host";
      const data = await apiPost<{ gameId?: string }>("/api/game/create", {
        name: "MAGI CHAIN",
        hostName: name,
      });
      const newGameId = data.gameId as string | undefined;
      if (!newGameId) throw new Error("ゲームIDが取得できませんでした");

      if (typeof window !== "undefined") {
        window.localStorage.setItem("magi.gameId", newGameId);
        window.localStorage.setItem("magi.playerName", name);
      }
      onGameChange?.(newGameId);
      setRoomId(newGameId);
      setStatus("ルームを作成しました");
    } catch (err: any) {
      setError(err?.message ?? "ルーム作成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const containerClass =
    layout === "overlay"
      ? "absolute bottom-6 left-6 z-30 w-[320px]"
      : "relative w-full max-w-sm";

  return (
    <div
      className={`${containerClass} rounded-xl border border-[#6b5846] bg-black/70 p-4 text-[#f1e6d2] shadow-[0_0_24px_rgba(0,0,0,0.5)] pointer-events-auto`}
    >
      <h2 className="text-sm font-semibold tracking-wide text-[#e6d4b0]">Join / Create</h2>
      <div className="mt-3 flex flex-col gap-2">
        <label className="text-[11px] uppercase text-[#c9b691]">ルームID</label>
        <input
          className="rounded-md border border-[#5c4033] bg-[#1b1510] px-2 py-1 text-sm outline-none focus:border-[#cfa968]"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="発行済みIDを入力"
        />
        <label className="text-[11px] uppercase text-[#c9b691]">名前</label>
        <input
          className="rounded-md border border-[#5c4033] bg-[#1b1510] px-2 py-1 text-sm outline-none focus:border-[#cfa968]"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Mage"
        />
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleJoin}
          disabled={loading}
          className="rounded-md border border-[#7a5b3a] bg-[#201813] px-3 py-2 text-xs font-semibold text-[#f1e6d2] hover:border-[#cfa968] disabled:opacity-50"
        >
          参加 / 再開
        </button>
        <button
          type="button"
          onClick={handleCreateRoom}
          disabled={loading}
          className="rounded-md border border-[#3b2e21] bg-[#15100c] px-3 py-2 text-xs text-[#c9b691] hover:border-[#cfa968] disabled:opacity-50"
        >
          新規ルーム作成
        </button>
      </div>
      {error && <div className="mt-3 text-xs text-[#ff8b8b]">{error}</div>}
      {status && <div className="mt-3 text-xs text-[#a8946b]">{status}</div>}
    </div>
  );
}
