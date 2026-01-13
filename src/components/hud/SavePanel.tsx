"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db, ensureAnonymousAuth } from "../../lib/firebaseClient";

type SaveSlotSummary = {
  id: string;
  label?: string;
  createdAt?: { toDate?: () => Date } | null;
  createdBy?: string;
  players?: Record<string, any>;
};

type SavePanelLayout = "overlay" | "panel";

type SavePanelProps = {
  layout?: SavePanelLayout;
  onGameChange?: (gameId: string) => void;
};

type PendingClaim = {
  gameId: string;
  slotId: string;
  players: { id: string; label: string }[];
};

function formatDate(value?: { toDate?: () => Date } | null) {
  if (!value?.toDate) return "—";
  const date = value.toDate();
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

export default function SavePanel({ layout = "overlay", onGameChange }: SavePanelProps) {
  const router = useRouter();
  const [gameId, setGameId] = useState("");
  const [slotId, setSlotId] = useState("slot_1");
  const [label, setLabel] = useState("");
  const [slots, setSlots] = useState<SaveSlotSummary[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingClaim, setPendingClaim] = useState<PendingClaim | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedGameId = window.localStorage.getItem("eldritch.gameId") || "";
    setGameId(savedGameId);
  }, []);

  const loadSlots = async (targetGameId: string) => {
    const slotsRef = collection(db, "games", targetGameId, "saves");
    const q = query(slotsRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const list = snap.docs.map((docSnap) => {
      const data = docSnap.data() as SaveSlotSummary;
      return { ...data, id: docSnap.id };
    });
    setSlots(list);
  };

  const handleRefresh = async () => {
    setError(null);
    setStatus(null);
    const trimmed = gameId.trim();
    if (!trimmed) {
      setError("ルームIDを入力してください");
      return;
    }
    setLoading(true);
    try {
      await loadSlots(trimmed);
    } catch (err: any) {
      setError(err?.message ?? "スロットの読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError(null);
    setStatus(null);
    setLoading(true);
    try {
      await ensureAnonymousAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("ログインに失敗しました");
      }
      const trimmedGameId = gameId.trim();
      if (!trimmedGameId) {
        throw new Error("ルームIDを入力してください");
      }

      const slot = slotId.trim() || `slot_${Date.now()}`;

      const gameRef = doc(db, "games", trimmedGameId);
      const playersRef = collection(db, "games", trimmedGameId, "players");

      const [gameSnap, playersSnap] = await Promise.all([
        getDoc(gameRef),
        getDocs(playersRef),
      ]);

      if (!gameSnap.exists()) {
        throw new Error("ルームが見つかりません");
      }

      const playersMap: Record<string, unknown> = {};
      playersSnap.docs.forEach((docSnap) => {
        playersMap[docSnap.id] = docSnap.data();
      });

      await setDoc(doc(db, "games", trimmedGameId, "saves", slot), {
        label: label.trim() || slot,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        game: gameSnap.data(),
        players: playersMap,
      });

      setStatus(`保存しました: ${slot}`);
      setSlotId(slot);
      await loadSlots(trimmedGameId);
    } catch (err: any) {
      setError(err?.message ?? "セーブに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async (targetSlotId?: string) => {
    setError(null);
    setStatus(null);
    setLoading(true);
    try {
      await ensureAnonymousAuth();
      const trimmedGameId = gameId.trim();
      if (!trimmedGameId) {
        throw new Error("ルームIDを入力してください");
      }
      const slot = targetSlotId || slotId.trim();
      if (!slot) {
        throw new Error("スロットIDを入力してください");
      }

      const gameRef = doc(db, "games", trimmedGameId);
      const saveRef = doc(db, "games", trimmedGameId, "saves", slot);

      const [gameSnap, saveSnap] = await Promise.all([
        getDoc(gameRef),
        getDoc(saveRef),
      ]);

      if (!gameSnap.exists()) {
        throw new Error("ルームが見つかりません");
      }
      if (!saveSnap.exists()) {
        throw new Error("セーブスロットが見つかりません");
      }

      const saveData = saveSnap.data() || {};
      const currentGame = gameSnap.data() || {};

      const preserved = {
        memberIds: currentGame.memberIds ?? [],
        memberNames: currentGame.memberNames ?? {},
        hostId: currentGame.hostId ?? null,
        status: currentGame.status ?? "active",
        schemaVersion: currentGame.schemaVersion ?? 1,
        createdAt: currentGame.createdAt ?? null,
        joinCode: currentGame.joinCode ?? null,
      };

      const nextGame = {
        ...(saveData.game || {}),
        ...preserved,
        updatedAt: serverTimestamp(),
      };

      const batch = writeBatch(db);
      batch.set(gameRef, nextGame, { merge: true });

      const players = saveData.players || {};
      Object.entries(players).forEach(([playerId, data]) => {
        const playerRef = doc(db, "games", trimmedGameId, "players", playerId);
        batch.set(playerRef, data as Record<string, unknown>, { merge: true });
      });

      await batch.commit();

      if (typeof window !== "undefined") {
        window.localStorage.setItem("eldritch.gameId", trimmedGameId);
      }
      onGameChange?.(trimmedGameId);

      let claimList = Object.entries(players).map(([playerId, data]) => {
        const display = (data as any)?.displayName || (data as any)?.name || playerId;
        return { id: playerId, label: display };
      });

      if (claimList.length === 0) {
        const playersSnap = await getDocs(collection(db, "games", trimmedGameId, "players"));
        claimList = playersSnap.docs.map((docSnap) => {
          const data = docSnap.data() as any;
          const display = data?.displayName || data?.name || docSnap.id;
          return { id: docSnap.id, label: display };
        });
      }

      if (claimList.length === 0) {
        setError("キャラクターが見つかりません");
      } else {
        setPendingClaim({ gameId: trimmedGameId, slotId: slot, players: claimList });
      }

      setStatus(`ロードしました: ${slot}`);
    } catch (err: any) {
      setError(err?.message ?? "ロードに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleClaimAfterLoad = async (playerId: string, label: string) => {
    if (!pendingClaim) return;
    setError(null);
    setStatus(null);
    setLoading(true);
    try {
      await ensureAnonymousAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("ログインに失敗しました");
      }
      const playerRef = doc(db, "games", pendingClaim.gameId, "players", playerId);
      await updateDoc(playerRef, {
        ownerUid: user.uid,
        displayName: label,
      });
      await updateDoc(doc(db, "games", pendingClaim.gameId), {
        updatedAt: serverTimestamp(),
      });
      if (typeof window !== "undefined") {
        window.localStorage.setItem("eldritch.displayName", label);
      }
      setPendingClaim(null);
      router.push("/game");
    } catch (err: any) {
      setError(err?.message ?? "キャラ引き継ぎに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const slotOptions = useMemo(() => slots, [slots]);

  const containerClass =
    layout === "overlay"
      ? "absolute bottom-6 right-6 z-30 w-[320px]"
      : "relative w-full max-w-sm";

  return (
    <div
      className={`${containerClass} rounded-xl border border-[#6b5846] bg-black/70 p-4 text-[#f1e6d2] shadow-[0_0_24px_rgba(0,0,0,0.5)] pointer-events-auto`}
    >
      <h2 className="text-sm font-semibold tracking-wide text-[#e6d4b0]">Save / Load</h2>
      <div className="mt-3 flex flex-col gap-2">
        <label className="text-[11px] uppercase text-[#c9b691]">ルームID</label>
        <input
          className="rounded-md border border-[#5c4033] bg-[#1b1510] px-2 py-1 text-sm outline-none focus:border-[#cfa968]"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          placeholder="game_v1_test"
        />
        <label className="text-[11px] uppercase text-[#c9b691]">スロットID</label>
        <input
          className="rounded-md border border-[#5c4033] bg-[#1b1510] px-2 py-1 text-sm outline-none focus:border-[#cfa968]"
          value={slotId}
          onChange={(e) => setSlotId(e.target.value)}
          placeholder="slot_1"
        />
        <label className="text-[11px] uppercase text-[#c9b691]">ラベル</label>
        <input
          className="rounded-md border border-[#5c4033] bg-[#1b1510] px-2 py-1 text-sm outline-none focus:border-[#cfa968]"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="例: 神話後"
        />
        <div className="mt-2 flex gap-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 rounded-md bg-[#7a5b3a] px-3 py-2 text-sm font-semibold text-[#f8f1e2] hover:bg-[#8b6945] disabled:opacity-50"
          >
            セーブ
          </button>
          <button
            onClick={() => handleLoad()}
            disabled={loading}
            className="flex-1 rounded-md border border-[#7a5b3a] px-3 py-2 text-sm font-semibold text-[#f8f1e2] hover:border-[#cfa968] disabled:opacity-50"
          >
            ロード
          </button>
        </div>
      </div>

      <div className="mt-4 border-t border-[#5c4033] pt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#c9b691]">保存スロット</span>
          <button
            className="text-[11px] text-[#e6d4b0] underline hover:text-white"
            onClick={handleRefresh}
            disabled={loading}
          >
            再読み込み
          </button>
        </div>
        {slotOptions.length === 0 ? (
          <div className="mt-2 text-xs text-[#a48f6a]">スロットはまだありません</div>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {slotOptions.map((slot) => (
              <button
                key={slot.id}
                onClick={() => handleLoad(slot.id)}
                disabled={loading}
                className="flex items-center justify-between rounded-md border border-[#5c4033] bg-[#231a13] px-2 py-2 text-left text-xs text-[#f1e6d2] hover:border-[#cfa968]"
              >
                <div>
                  <div className="font-semibold">{slot.label || slot.id}</div>
                  <div className="text-[11px] text-[#b9a782]">{formatDate(slot.createdAt)}</div>
                </div>
                <div className="text-[11px]">ロード</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {pendingClaim && (
        <div className="mt-4 rounded-xl border border-[#3b2e21] bg-[#140f0c] p-3">
          <div className="text-xs uppercase tracking-[0.2em] text-[#a8946b]">キャラクター選択</div>
          <p className="mt-2 text-xs text-[#c9b691]">前回のキャラクター名を選んで再開してください。</p>
          <div className="mt-3 flex flex-col gap-2">
            {pendingClaim.players.map((player) => (
              <button
                key={player.id}
                onClick={() => handleClaimAfterLoad(player.id, player.label)}
                disabled={loading}
                className="rounded-md border border-[#5c4033] bg-[#231a13] px-2 py-2 text-left text-xs text-[#f1e6d2] hover:border-[#cfa968]"
              >
                {player.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {(status || error) && (
        <div className="mt-3 text-xs">
          {status && <div className="text-[#a6e3a1]">{status}</div>}
          {error && <div className="text-[#ff8b8b]">{error}</div>}
        </div>
      )}
    </div>
  );
}
