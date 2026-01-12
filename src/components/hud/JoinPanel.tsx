"use client";

import React, { useEffect, useState } from "react";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db, ensureAnonymousAuth } from "../../lib/firebaseClient";

type PlayerSummary = {
  id: string;
  name?: string;
  displayName?: string;
  ownerUid?: string | null;
};

type JoinPanelLayout = "overlay" | "panel";

export default function JoinPanel({ layout = "overlay" }: { layout?: JoinPanelLayout }) {
  const [roomId, setRoomId] = useState("game_v1_test");
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [joinedGameId, setJoinedGameId] = useState<string | null>(null);

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

  const loadPlayers = async (gameId: string) => {
    const snap = await getDocs(collection(db, "games", gameId, "players"));
    const results: PlayerSummary[] = snap.docs.map((docSnap) => {
      const data = docSnap.data() as PlayerSummary;
      return { id: docSnap.id, ...data };
    });
    setPlayers(results);
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
      const gameRef = doc(db, "games", trimmedGameId);
      await updateDoc(gameRef, {
        memberIds: arrayUnion(user.uid),
        [`memberNames.${user.uid}`]: name,
        updatedAt: serverTimestamp(),
      });
      setJoinedGameId(trimmedGameId);
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

      const now = serverTimestamp();
      await setDoc(gameRef, {
        doom: 20,
        omen: 0,
        phase: "ACTION",
        activeInvestigatorId: "",
        turnState: { actionsTaken: 0 },
        hostId: user.uid,
        memberIds: [user.uid],
        memberNames: { [user.uid]: displayName.trim() || "Host" },
        status: "active",
        schemaVersion: 1,
        createdAt: now,
        updatedAt: now,
      });

      setJoinedGameId(trimmedGameId);
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
      await updateDoc(playerRef, {
        ownerUid: user.uid,
        displayName: nextName,
      });
      await updateDoc(doc(db, "games", joinedGameId), {
        updatedAt: serverTimestamp(),
      });
      setStatus(`キャラを引き継ぎました: ${investigatorId}`);
      await loadPlayers(joinedGameId);
    } catch (err: any) {
      setError(err?.message ?? "キャラ引き継ぎに失敗しました");
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
        {players.length === 0 ? (
          <div className="mt-2 text-xs text-[#a48f6a]">まだ取得していません</div>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {players.map((player) => {
              const ownedByYou = !!currentUid && player.ownerUid === currentUid;
              const ownedByOther = !!player.ownerUid && !ownedByYou;
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
                  <div className="text-[11px]">{ownedByYou ? "あなた" : ownedByOther ? "使用中" : "未選択"}</div>
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
