"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db, ensureAnonymousAuth } from "../../lib/firebaseClient";

type SavePanelLayout = "overlay" | "panel";

type SavePanelProps = {
  layout?: SavePanelLayout;
  onGameChange?: (gameId: string) => void;
};

type UserGameSummary = {
  gameId: string;
  name?: string;
  status?: string;
  role?: string;
  updatedAt?: string;
  lastAccessedAt?: string;
};

export default function SavePanel({ layout = "overlay", onGameChange }: SavePanelProps) {
  const router = useRouter();
  const [games, setGames] = useState<UserGameSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    ensureAnonymousAuth()
      .then(async () => {
        if (!active) return;
        await refresh();
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message ?? "読み込みに失敗しました");
      });
    return () => {
      active = false;
    };
  }, []);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("ログインに失敗しました");
      const ref = collection(db, "userGames", user.uid, "items");
      const q = query(ref, orderBy("updatedAt", "desc"));
      const snap = await getDocs(q);
      const list = snap.docs.map((docSnap) => {
        const data = docSnap.data() as UserGameSummary;
        return {
          ...data,
          gameId: data.gameId ?? docSnap.id,
        };
      });
      setGames(list);
    } catch (err: any) {
      setError(err?.message ?? "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (gameId: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("magi.gameId", gameId);
    }
    onGameChange?.(gameId);
    router.push("/game");
  };

  const containerClass =
    layout === "overlay"
      ? "absolute bottom-6 right-6 z-30 w-[340px]"
      : "relative w-full";

  return (
    <div
      className={`${containerClass} rounded-xl border border-[#6b5846] bg-black/70 p-4 text-[#f1e6d2] shadow-[0_0_24px_rgba(0,0,0,0.5)] pointer-events-auto`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-[#e6d4b0]">セーブ/ロード</h2>
        <button
          type="button"
          onClick={refresh}
          className="text-xs text-[#c9b691] hover:text-white"
        >
          更新
        </button>
      </div>
      <p className="mt-2 text-xs text-[#c9b691]">
        オートセーブ済みの参加ゲームを一覧表示します。
      </p>
      {loading && <div className="mt-3 text-xs text-[#c9b691]">読み込み中...</div>}
      {error && <div className="mt-3 text-xs text-[#ff8b8b]">{error}</div>}
      {games.length === 0 && !loading ? (
        <div className="mt-3 text-xs text-[#a48f6a]">保存済みゲームがありません。</div>
      ) : (
        <div className="mt-3 space-y-2">
          {games.map((game) => (
            <div
              key={game.gameId}
              className="flex items-center justify-between rounded-lg border border-[#3b2e21] bg-[#140f0c] px-3 py-2 text-xs"
            >
              <div>
                <div className="text-sm text-[#f1e6d2]">{game.name ?? game.gameId}</div>
                <div className="text-[11px] text-[#a48f6a]">
                  {game.status ?? "unknown"} / {game.role ?? "member"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpen(game.gameId)}
                className="rounded-md border border-[#7a5b3a] bg-[#201813] px-3 py-1 text-[11px] text-[#f1e6d2]"
              >
                開く
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 text-[11px] text-[#a48f6a]">TODO: 手動セーブ管理は次フェーズ。</div>
    </div>
  );
}
