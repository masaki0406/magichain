"use client";

import React, { useEffect, useState } from "react";
import { auth, ensureAnonymousAuth } from "../../lib/firebaseClient";
import { PlayerState } from "../../lib/useGameState";

type Props = {
  gameId: string | null;
  players: PlayerState[];
  currentUid: string | null;
  locked?: boolean;
};

export default function CharacterSelectPanel({ gameId, players, currentUid, locked = false }: Props) {
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("eldritch.displayName") || "";
    setDisplayName(stored);
  }, []);

  const handleSelect = async (player: PlayerState) => {
    if (!gameId || locked) return;
    setError(null);
    setStatus(null);
    setLoading(true);
    try {
      await ensureAnonymousAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("ログインに失敗しました");
      }

      if (player.ownerUid && player.ownerUid !== user.uid) {
        const ok = window.confirm(
          "このキャラは別の端末で使用中かもしれません。引き継ぎますか？"
        );
        if (!ok) {
          setLoading(false);
          return;
        }
      }

      const nextName = displayName.trim() || player.displayName || player.name || "Player";
      const response = await fetch("/api/room/select-character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: gameId,
          uid: user.uid,
          investigatorId: player.id,
          displayName: nextName,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "キャラ選択に失敗しました");
      }
      if (typeof window !== "undefined") {
        window.localStorage.setItem("eldritch.displayName", nextName);
      }
      setStatus(`${nextName} を選択しました`);
    } catch (err: any) {
      setError(err?.message ?? "キャラ選択に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#3b2e21] bg-[#16110d] p-4">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-[#a8946b]">Character Select</div>
        <div className="mt-1 text-sm text-[#c9b691]">キャラクターを選んで参加状態を確定します。</div>
        {locked && (
          <div className="mt-2 text-xs text-[#ffb86c]">
            ゲーム開始後はキャラクター変更できません。
          </div>
        )}
      </div>

      <div className="mt-3">
        <label className="text-[11px] uppercase text-[#c9b691]">表示名</label>
        <input
          className="mt-1 w-full rounded-md border border-[#5c4033] bg-[#1b1510] px-2 py-1 text-sm outline-none focus:border-[#cfa968]"
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value);
            if (typeof window !== "undefined") {
              window.localStorage.setItem("eldritch.displayName", e.target.value);
            }
          }}
          placeholder="例: Taro"
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {players.length === 0 ? (
          <div className="text-xs text-[#a48f6a]">キャラクターがまだありません</div>
        ) : (
          players.map((player) => {
            const ownedByYou = !!currentUid && player.ownerUid === currentUid;
            const ownedByOther = !!player.ownerUid && !ownedByYou;
            const statusLabel = ownedByYou
              ? "あなた"
              : ownedByOther
                ? "キャラクター使用中"
                : "キャラクター未選択";
            return (
              <button
                key={player.id}
                onClick={() => handleSelect(player)}
                disabled={loading || locked}
                className={`flex flex-col gap-2 rounded-xl border px-3 py-3 text-left text-xs transition ${
                  ownedByOther
                    ? "border-[#3a2b20] bg-[#1a1410] text-[#c7b69b]"
                    : "border-[#5c4033] bg-[#231a13] text-[#f1e6d2] hover:border-[#cfa968]"
                } ${locked ? "opacity-60" : ""}`}
              >
                <div className="text-sm font-semibold">{player.name ?? player.id}</div>
                <div className="text-[11px] text-[#b9a782]">{player.displayName || "未設定"}</div>
                <div className="text-[11px] text-[#c9b691]">{statusLabel}</div>
              </button>
            );
          })
        )}
      </div>

      {(status || error) && (
        <div className="mt-3 text-xs">
          {status && <div className="text-[#a6e3a1]">{status}</div>}
          {error && <div className="text-[#ff8b8b]">{error}</div>}
        </div>
      )}
    </div>
  );
}
