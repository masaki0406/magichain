"use client";

import React, { useState } from "react";
import SavePanel from "./SavePanel";
import type { GameState, PlayerState } from "../../lib/magiTypes";

type TabKey = "rules" | "save" | "room";

type GameMenuProps = {
  gameId: string | null;
  game: GameState | null;
  players: PlayerState[];
  currentUid: string | null;
};

export default function GameMenu({ gameId, game, players, currentUid }: GameMenuProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>("rules");

  const memberIds = Array.isArray(game?.memberIds) ? (game?.memberIds ?? []) : [];
  const memberNames = game?.memberNames ?? {};
  const currentPlayerName = currentUid ? memberNames[currentUid] ?? currentUid : "-";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="absolute right-4 top-4 z-30 rounded-md border border-[#7a5b3a] bg-[#1a1410]/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#f1e6d2] shadow-[0_0_12px_rgba(0,0,0,0.4)] hover:bg-[#2a2018]"
      >
        Menu
      </button>

      {open && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
          <div className="relative w-full max-w-3xl rounded-2xl border border-[#3b2e21] bg-[#14100c] p-6 text-[#f1e6d2] shadow-[0_0_40px_rgba(0,0,0,0.55)]">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.localStorage.setItem("magi.lobbyOverride", "1");
                }
                window.location.href = "/";
              }}
              className="absolute right-20 top-4 rounded-md border border-[#3b2e21] px-2 py-1 text-xs text-[#c9b691] hover:text-white"
            >
              Lobby
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 rounded-md border border-[#3b2e21] px-2 py-1 text-xs text-[#c9b691] hover:text-white"
            >
              Close
            </button>

            <div className="flex items-center gap-3 border-b border-[#3b2e21] pb-3">
              <button
                type="button"
                onClick={() => setTab("rules")}
                className={`rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                  tab === "rules"
                    ? "bg-[#7a5b3a] text-[#f8f1e2]"
                    : "text-[#c9b691] hover:text-white"
                }`}
              >
                Rules
              </button>
              <button
                type="button"
                onClick={() => setTab("save")}
                className={`rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                  tab === "save"
                    ? "bg-[#7a5b3a] text-[#f8f1e2]"
                    : "text-[#c9b691] hover:text-white"
                }`}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setTab("room")}
                className={`rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                  tab === "room"
                    ? "bg-[#7a5b3a] text-[#f8f1e2]"
                    : "text-[#c9b691] hover:text-white"
                }`}
              >
                Room
              </button>
            </div>

            {tab === "rules" ? (
              <div className="mt-4 grid gap-4 text-sm text-[#c9b691] md:grid-cols-2">
                <div className="rounded-xl border border-[#3b2e21] bg-[#120e0b] p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-[#a8946b]">Turn Flow</div>
                  <ul className="mt-3 space-y-2">
                    <li>プレイ → 精霊 → 移動 → マスアクション</li>
                    <li>場札排出 → 手札補充 の順で進行</li>
                    <li>カード順序と精霊条件が重要</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-[#3b2e21] bg-[#120e0b] p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-[#a8946b]">Resources</div>
                  <ul className="mt-3 space-y-2">
                    <li>移動 / 攻撃 / 知力 / ドロー</li>
                    <li>青・赤・緑・黄カードで獲得</li>
                  </ul>
                </div>
              </div>
            ) : tab === "save" ? (
              <div className="mt-4">
                <SavePanel layout="panel" />
              </div>
            ) : (
              <div className="mt-4 grid gap-4 text-sm text-[#c9b691] md:grid-cols-2">
                <div className="rounded-xl border border-[#3b2e21] bg-[#120e0b] p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-[#a8946b]">Room</div>
                  <div className="mt-2 text-base text-[#f1e6d2]">{gameId ?? "未選択"}</div>
                  <div className="mt-3 text-xs uppercase tracking-[0.2em] text-[#a8946b]">Status</div>
                  <div className="mt-2 text-sm text-[#c9b691]">{game?.status ?? "unknown"}</div>
                </div>
                <div className="rounded-xl border border-[#3b2e21] bg-[#120e0b] p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-[#a8946b]">You</div>
                  <div className="mt-2 text-sm text-[#c9b691]">{currentPlayerName}</div>
                </div>
                <div className="rounded-xl border border-[#3b2e21] bg-[#120e0b] p-4 md:col-span-2">
                  <div className="text-xs uppercase tracking-[0.2em] text-[#a8946b]">Players</div>
                  {players.length === 0 ? (
                    <div className="mt-2 text-sm text-[#a48f6a]">参加者がまだいません</div>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {memberIds.map((memberId) => {
                        const player = players.find((item) => item.uid === memberId);
                        const label = memberNames[memberId] ?? player?.name ?? memberId;
                        return (
                          <div
                            key={memberId}
                            className="flex items-center gap-2 rounded-full border border-[#4a3a2c] bg-[#1a1410] px-2 py-1 text-[11px] text-[#f1e6d2]"
                          >
                            <span>{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
