"use client";

import React, { useEffect, useRef, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { auth, db, ensureAnonymousAuth } from "../../lib/firebaseClient";

type PlayerSummary = {
  id: string;
  name?: string;
  displayName?: string;
  ownerUid?: string | null;
};

type JoinPanelLayout = "overlay" | "panel";

type JoinPanelProps = {
  layout?: JoinPanelLayout;
  onGameChange?: (gameId: string) => void;
  canSelectCharacter?: boolean;
  reconnectMode?: boolean;
};

export default function JoinPanel({
  layout = "overlay",
  onGameChange,
  canSelectCharacter = false,
  reconnectMode = false,
}: JoinPanelProps) {
  const [roomId, setRoomId] = useState("game_v1_test");
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [joinedGameId, setJoinedGameId] = useState<string | null>(null);
  const autoClaimRef = useRef<string | null>(null);

  const currentUid = auth.currentUser?.uid ?? null;

  useEffect(() => {
    let active = true;
    ensureAnonymousAuth()
      .then(() => {
        if (active) setStatus("匿名ログイン完了");
      })
      .catch((err) => {
        if (active) setError(err?.message ?? "匿名ログインに失敗しました");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedGameId = window.localStorage.getItem("eldritch.gameId");
    const savedName = window.localStorage.getItem("eldritch.displayName");
    if (savedGameId) {
      setRoomId(savedGameId);
    }
    if (savedName) {
      setDisplayName(savedName);
    }
  }, []);

  const loadPlayers = async (gameId: string) => {
    const snap = await getDocs(collection(db, "games", gameId, "players"));
    const results: PlayerSummary[] = snap.docs.map((docSnap) => {
      const data = docSnap.data() as PlayerSummary;
      return { ...data, id: docSnap.id };
    });
    setPlayers(results);
    return results;
  };

  const handleJoin = async () => {
    setError(null);
    setStatus(null);
    setLoading(true);
    try {
      await ensureAnonymousAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("ログインに失敗しました");
      }
      const trimmedGameId = roomId.trim();
      if (!trimmedGameId) {
        throw new Error("ルームIDを入力してください");
      }
      const name = displayName.trim() || "Player";
      const response = await fetch("/api/room/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: trimmedGameId, uid: user.uid, name }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "参加に失敗しました");
      }
      setJoinedGameId(trimmedGameId);
      onGameChange?.(trimmedGameId);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("eldritch.gameId", trimmedGameId);
        window.localStorage.setItem("eldritch.displayName", displayName.trim());
      }
      setStatus("ルームに参加しました");
      await loadPlayers(trimmedGameId);
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
      if (!user) {
        throw new Error("ログインに失敗しました");
      }
      const trimmedGameId = roomId.trim();
      if (!trimmedGameId) {
        throw new Error("ルームIDを入力してください");
      }

      const gameRef = doc(db, "games", trimmedGameId);
      try {
        const existing = await getDoc(gameRef);
        if (existing.exists()) {
          throw new Error("同じIDのルームが既に存在します");
        }
      } catch (err: any) {
        if (err?.code !== "permission-denied") {
          throw err;
        }
      }

      const hostName = displayName.trim() || "Host";
      const response = await fetch("/api/room/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: trimmedGameId, hostUid: user.uid, hostName }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "ルーム作成に失敗しました");
      }

      setJoinedGameId(trimmedGameId);
      onGameChange?.(trimmedGameId);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("eldritch.gameId", trimmedGameId);
        window.localStorage.setItem("eldritch.displayName", displayName.trim());
      }
      setStatus("ルームを作成しました");
      await loadPlayers(trimmedGameId);
    } catch (err: any) {
      setError(err?.message ?? "ルーム作成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (investigatorId: string) => {
    if (!joinedGameId) return;
    setError(null);
    setStatus(null);
    setLoading(true);
    try {
      await ensureAnonymousAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("ログインに失敗しました");
      }
      const playerRef = doc(db, "games", joinedGameId, "players", investigatorId);
      const playerSnap = await getDoc(playerRef);
      if (!playerSnap.exists()) {
        throw new Error("キャラが見つかりません");
      }
      const playerData = playerSnap.data() || {};
      const nextName = displayName.trim() || playerData.displayName || "Player";
      const response = await fetch("/api/room/select-character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: joinedGameId,
          uid: user.uid,
          investigatorId,
          displayName: nextName,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "キャラ引き継ぎに失敗しました");
      }
      if (typeof window !== "undefined") {
        window.localStorage.setItem("eldritch.displayName", nextName);
      }
      setStatus(`キャラを引き継ぎました: ${investigatorId}`);
      await loadPlayers(joinedGameId);
    } catch (err: any) {
      setError(err?.message ?? "キャラ引き継ぎに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canSelectCharacter || !joinedGameId) return;
    const targetName = displayName.trim();
    if (!targetName) return;
    const key = `${joinedGameId}:${targetName}`;
    if (autoClaimRef.current === key) return;
    const match = players.find((player) => (player.displayName || "").trim() === targetName);
    if (!match) return;
    autoClaimRef.current = key;
    handleClaim(match.id);
  }, [canSelectCharacter, joinedGameId, displayName, players, currentUid]);

  const containerClass =
    layout === "overlay"
      ? "absolute bottom-6 left-6 z-30 w-[320px]"
      : "relative w-full max-w-sm";

  return (
    <div
      className={`${containerClass} rounded-xl border border-[#6b5846] bg-black/70 p-4 text-[#f1e6d2] shadow-[0_0_24px_rgba(0,0,0,0.5)] pointer-events-auto`}
    >
      <h2 className="text-sm font-semibold tracking-wide text-[#e6d4b0]">Join / Resume</h2>
      <div className="mt-3 flex flex-col gap-2">
        <label className="text-[11px] uppercase text-[#c9b691]">ルームID</label>
        <input
          className="rounded-md border border-[#5c4033] bg-[#1b1510] px-2 py-1 text-sm outline-none focus:border-[#cfa968]"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="game_v1_test"
        />
        <label className="text-[11px] uppercase text-[#c9b691]">プレイヤー名</label>
        <input
          className="rounded-md border border-[#5c4033] bg-[#1b1510] px-2 py-1 text-sm outline-none focus:border-[#cfa968]"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="例: Taro"
        />
        <div className="mt-2 flex gap-2">
          <button
            onClick={handleJoin}
            disabled={loading}
            className="flex-1 rounded-md bg-[#7a5b3a] px-3 py-2 text-sm font-semibold text-[#f8f1e2] hover:bg-[#8b6945] disabled:opacity-50"
          >
            ルームに参加
          </button>
          <button
            onClick={handleCreateRoom}
            disabled={loading}
            className="flex-1 rounded-md border border-[#7a5b3a] px-3 py-2 text-sm font-semibold text-[#f8f1e2] hover:border-[#cfa968] disabled:opacity-50"
          >
            ルーム作成
          </button>
        </div>
      </div>

      <div className="mt-4 border-t border-[#5c4033] pt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#c9b691]">キャラ選択</span>
          {joinedGameId && (
            <button
              className="text-[11px] text-[#e6d4b0] underline hover:text-white"
              onClick={() => loadPlayers(joinedGameId)}
              disabled={loading}
            >
              再読み込み
            </button>
          )}
        </div>
        {!canSelectCharacter ? (
          <div className="mt-2 text-xs text-[#a48f6a]">
            {reconnectMode
              ? "ゲーム進行中です。プレイヤー名で引き継ぎできます。"
              : "ホストがキャラクター選択を開始するまでお待ちください。"}
          </div>
        ) : players.length === 0 ? (
          <div className="mt-2 text-xs text-[#a48f6a]">まだ取得していません</div>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {players.map((player) => {
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
                  onClick={() => {
                    if (ownedByOther) {
                      const ok = window.confirm(
                        "このキャラは別の端末で使用中かもしれません。引き継ぎますか？"
                      );
                      if (!ok) return;
                    }
                    handleClaim(player.id);
                  }}
                  disabled={loading}
                  className={`flex items-center justify-between rounded-md border px-2 py-2 text-left text-xs ${
                    ownedByOther
                      ? "border-[#3a2b20] bg-[#1a1410] text-[#c7b69b]"
                      : "border-[#5c4033] bg-[#231a13] text-[#f1e6d2] hover:border-[#cfa968]"
                  }`}
                >
                  <div>
                    <div className="font-semibold">{player.name ?? player.id}</div>
                    <div className="text-[11px] text-[#b9a782]">{player.displayName || "未設定"}</div>
                  </div>
                  <div className="text-[11px]">{statusLabel}</div>
                </button>
              );
            })}
          </div>
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
