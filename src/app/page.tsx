"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import JoinPanel from "../components/hud/JoinPanel";
import SavePanel from "../components/hud/SavePanel";
import CharacterSelectPanel from "../components/hud/CharacterSelectPanel";
import { ensureAnonymousAuth } from "../lib/firebaseClient";
import { useGameState } from "../lib/useGameState";

export default function LobbyPage() {
  const router = useRouter();
  const [gameId, setGameId] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [readyBusy, setReadyBusy] = useState(false);
  const [startBusy, setStartBusy] = useState(false);
  const [stageBusy, setStageBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<"join" | "save">("join");
  const { game, players, loading, error } = useGameState(gameId);

  useEffect(() => {
    const stored = window.localStorage.getItem("eldritch.gameId");
    setGameId(stored || null);
    ensureAnonymousAuth().then((user) => setUid(user?.uid ?? null));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (game?.status !== "in_progress") {
      window.localStorage.removeItem("eldritch.lobbyOverride");
    }
  }, [game?.status]);

  useEffect(() => {
    if (!gameId || game?.status !== "in_progress") return;
    if (typeof window === "undefined") return;
    const override = window.localStorage.getItem("eldritch.lobbyOverride");
    if (override) return;
    const claimed = !!uid && players.some((player) => player.ownerUid === uid);
    if (claimed) {
      router.push("/game");
    }
  }, [gameId, game?.status, players, uid, router]);

  const currentPlayer = players.find((player) => player.ownerUid && player.ownerUid === uid);
  const lifecycleStage = game?.lifecycleStage ?? "waiting";
  const memberIds = Array.isArray(game?.memberIds) ? (game?.memberIds ?? []) : [];
  const allReady = memberIds.length > 0 && memberIds.every((memberId) =>
    players.some((player) => player.ownerUid === memberId && player.ready === true)
  );
  const isHost = !!uid && !!game?.hostId && game.hostId === uid;
  const canSelectCharacter = lifecycleStage === "character_select";
  const inProgress = game?.status === "in_progress";
  const canClaim = canSelectCharacter || inProgress;

  const handleBeginCharacterSelection = async () => {
    if (!gameId || !uid || !isHost) return;
    setStageBusy(true);
    try {
      const response = await fetch("/api/room/begin-character-selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: gameId, uid }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "キャラクター選択の開始に失敗しました");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setStageBusy(false);
    }
  };

  const handleToggleReady = async () => {
    if (!gameId || !currentPlayer || !canSelectCharacter) return;
    setReadyBusy(true);
    try {
      const response = await fetch("/api/room/ready", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: gameId,
          investigatorId: currentPlayer.id,
          ready: !currentPlayer.ready,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "準備完了の更新に失敗しました");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setReadyBusy(false);
    }
  };

  const handleStartGame = async () => {
    if (!gameId || !allReady || !isHost || !uid || !canSelectCharacter) return;
    setStartBusy(true);
    try {
      const response = await fetch("/api/room/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: gameId, uid }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "ゲーム開始に失敗しました");
      }
      router.push("/game");
    } catch (error) {
      console.error(error);
    } finally {
      setStartBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0a08] text-[#f1e6d2]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.3em] text-[#a8946b]">Eldritch Horror Online</p>
          <h1 className="text-4xl font-semibold tracking-wide text-[#f5e7c9]">Lobby</h1>
          <p className="max-w-2xl text-sm text-[#c9b691]">
            参加・再開・セーブ管理はここで完結。ゲーム開始後は盤面に集中できます。
          </p>
        </header>

        <section className="rounded-2xl border border-[#3b2e21] bg-gradient-to-br from-[#19130f] via-[#15100c] to-[#0f0b09] p-4 shadow-[0_0_40px_rgba(0,0,0,0.45)]">
          <div className="flex flex-wrap gap-2 border-b border-[#3b2e21] pb-3">
            <button
              type="button"
              onClick={() => setActiveTab("join")}
              className={`rounded-full px-4 py-2 text-xs font-semibold tracking-[0.2em] ${
                activeTab === "join"
                  ? "border border-[#cfa968] bg-[#2a1f18] text-[#f5e7c9]"
                  : "border border-[#3b2e21] bg-[#140f0c] text-[#8a7860]"
              }`}
            >
              参加 / 再開
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("save")}
              className={`rounded-full px-4 py-2 text-xs font-semibold tracking-[0.2em] ${
                activeTab === "save"
                  ? "border border-[#cfa968] bg-[#2a1f18] text-[#f5e7c9]"
                  : "border border-[#3b2e21] bg-[#140f0c] text-[#8a7860]"
              }`}
            >
              セーブ / ロード
            </button>
          </div>
          <div className="mt-4">
            {activeTab === "join" ? (
              <JoinPanel
                layout="panel"
                onGameChange={setGameId}
                canSelectCharacter={canClaim}
                reconnectMode={inProgress}
              />
            ) : (
              <SavePanel layout="panel" onGameChange={setGameId} />
            )}
          </div>
        </section>

        {canSelectCharacter ? (
          <CharacterSelectPanel
            gameId={gameId}
            players={players}
            currentUid={uid}
            locked={game?.status === "in_progress"}
          />
        ) : (
          <section className="rounded-2xl border border-[#3b2e21] bg-[#16110d] p-4 text-sm text-[#c9b691]">
            <div className="text-xs uppercase tracking-[0.2em] text-[#a8946b]">Character Select</div>
            <div className="mt-2">参加者が揃ったらホストがキャラクター選択を開始します。</div>
            {isHost && gameId ? (
              <button
                type="button"
                onClick={handleBeginCharacterSelection}
                disabled={stageBusy}
                className="mt-3 rounded-md border border-[#7a5b3a] bg-[#201813] px-3 py-2 text-xs font-semibold text-[#f1e6d2] hover:border-[#cfa968] disabled:opacity-50"
              >
                キャラクター選択を開始
              </button>
            ) : (
              <div className="mt-3 text-xs text-[#a48f6a]">ホストが開始するまでお待ちください。</div>
            )}
          </section>
        )}

        <section className="rounded-2xl border border-[#3b2e21] bg-[#130f0c] p-6 text-sm text-[#c9b691]">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[#a8946b]">Next</div>
                <div className="text-lg font-semibold text-[#f5e7c9]">ゲーム盤面へ</div>
                <p className="mt-1 text-sm text-[#c9b691]">参加・引き継ぎ後にゲームへ移動します。</p>
              </div>

              <div className="rounded-xl border border-[#3b2e21] bg-[#16110d] p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-[#a8946b]">Room</div>
                <div className="mt-1 text-base font-semibold text-[#f1e6d2]">
                  {gameId ?? "未選択"}
                </div>
                <div className="mt-3 text-xs uppercase tracking-[0.2em] text-[#a8946b]">Players</div>
                {loading && <div className="mt-2 text-xs text-[#c9b691]">同期中...</div>}
                {error && <div className="mt-2 text-xs text-[#ff8b8b]">{error}</div>}
                {!loading && players.length === 0 && (
                  <div className="mt-2 text-xs text-[#a48f6a]">プレイヤー未取得</div>
                )}
                {players.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {players.map((player) => {
                      const label = player.displayName || player.name || player.id;
                      const ownedByYou = !!uid && player.ownerUid === uid;
                      const ownedByOther = !!player.ownerUid && !ownedByYou;
                      const statusLabel = ownedByYou
                        ? "あなた"
                        : ownedByOther
                          ? "キャラクター使用中"
                          : "キャラクター未選択";
                      return (
                        <div
                          key={player.id}
                          className="flex items-center gap-2 rounded-full border border-[#4a3a2c] bg-[#201813] px-2 py-1 text-[11px] text-[#f1e6d2]"
                        >
                          <span>{label}</span>
                          <span className="text-[#b9a782]">{statusLabel}</span>
                          <span className={player.ready ? "text-[#a6e3a1]" : "text-[#8a7860]"}>
                            {player.ready ? "READY" : "WAIT"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-2">
                  {currentPlayer ? (
                    <button
                      type="button"
                      onClick={handleToggleReady}
                      disabled={readyBusy || !canSelectCharacter}
                      className="rounded-md border border-[#7a5b3a] bg-[#201813] px-3 py-2 text-xs font-semibold text-[#f1e6d2] hover:border-[#cfa968] disabled:opacity-50"
                    >
                      {currentPlayer.ready ? "準備完了を解除" : "準備完了"}
                    </button>
                  ) : (
                    <div className="text-xs text-[#a48f6a]">先にキャラクターを引き継いでください。</div>
                  )}
                </div>
              </div>
            </div>

            {gameId ? (
              <div className="flex flex-col items-start gap-3">
                {inProgress ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.localStorage.removeItem("eldritch.lobbyOverride");
                      }
                      router.push("/game");
                    }}
                    className="inline-flex items-center justify-center rounded-md border border-[#7a5b3a] bg-[#7a5b3a] px-5 py-2 text-sm font-semibold text-[#f8f1e2] shadow-[0_0_12px_rgba(122,91,58,0.35)] hover:bg-[#8b6945]"
                  >
                    ゲーム盤面へ戻る
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartGame}
                    disabled={!allReady || startBusy || !isHost || !canSelectCharacter}
                    className={`inline-flex items-center justify-center rounded-md px-5 py-2 text-sm font-semibold shadow-[0_0_12px_rgba(122,91,58,0.35)] ${
                      allReady && isHost
                        ? "border border-[#7a5b3a] bg-[#7a5b3a] text-[#f8f1e2] hover:bg-[#8b6945]"
                        : "border border-[#4a3a2c] bg-[#1a1410] text-[#8a7860]"
                    }`}
                  >
                    ゲーム開始
                  </button>
                )}
                {!isHost && !inProgress && (
                  <div className="text-xs text-[#a48f6a]">開始はホストのみ行えます。</div>
                )}
              </div>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center rounded-md border border-[#4a3a2c] bg-[#1a1410] px-5 py-2 text-sm font-semibold text-[#8a7860]"
              >
                ゲーム開始
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
