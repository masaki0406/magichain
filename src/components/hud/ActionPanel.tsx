"use client";

import React, { useMemo, useState } from "react";
import type { GameState, PlayerState, TileActionType } from "../../lib/magiTypes";
import { TILE_ACTIONS_BY_TYPE, TILE_MAP } from "../../lib/magiData";
import { apiPost } from "../../lib/magiApi";

type ActionPanelProps = {
  game: GameState | null;
  currentPlayer: PlayerState | null;
};

const TILE_ACTION_LABELS: Record<TileActionType, string> = {
  learn: "学習",
  upgrade: "改良",
  contract: "契約",
  paper: "論文",
  hunt: "魔物討伐",
  deliver: "納品",
};

export default function ActionPanel({ game, currentPlayer }: ActionPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const phase = game?.phase;
  const tile = currentPlayer ? TILE_MAP[currentPlayer.boardPos] : null;
  const availableTileActions = tile ? TILE_ACTIONS_BY_TYPE[tile.type] : [];

  const canAct = Boolean(game && currentPlayer && game.turn.currentPlayerId === currentPlayer.uid);

  const spiritMatches = useMemo(() => {
    if (!currentPlayer) return [];
    const colors = currentPlayer.field.map((card) => card.color);
    return currentPlayer.spirits.filter(
      (spirit) => spirit.pattern.length === colors.length && spirit.pattern.every((color, index) => colors[index] === color)
    );
  }, [currentPlayer]);

  const sendAction = async (action: Record<string, unknown>) => {
    if (!game) return;
    setError(null);
    setBusy(true);
    try {
      await apiPost("/api/game/action", {
        gameId: game.id,
        snapshotVersion: game.snapshotVersion,
        action,
      });
    } catch (err: any) {
      setError(err?.message ?? "操作に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  if (!game || !currentPlayer) {
    return null;
  }

  return (
    <div className="absolute right-4 bottom-4 z-30 w-[340px] space-y-3 rounded-xl border border-[#6b5846] bg-black/70 p-4 text-[#f1e6d2] shadow-[0_0_24px_rgba(0,0,0,0.5)]">
      <div className="text-xs uppercase tracking-[0.2em] text-[#a8946b]">Action</div>
      <div className="text-sm text-[#f5e7c9]">{currentPlayer.name}</div>

      {!canAct && (
        <div className="text-xs text-[#c9b691]">他プレイヤーの手番です。</div>
      )}

      {phase === "play" && (
        <div className="space-y-2">
          <div className="text-xs text-[#c9b691]">手札</div>
          <div className="flex flex-wrap gap-2">
            {currentPlayer.hand.length === 0 ? (
              <div className="text-[11px] text-[#a48f6a]">手札がありません</div>
            ) : (
              currentPlayer.hand.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  disabled={!canAct || busy}
                  onClick={() =>
                    sendAction({
                      type: "play_card",
                      cardId: card.id,
                    })
                  }
                  className="rounded-md border border-[#3b2e21] bg-[#1a1410] px-2 py-1 text-[11px] hover:border-[#cfa968] disabled:opacity-60"
                >
                  {card.name}
                </button>
              ))
            )}
          </div>
          <button
            type="button"
            disabled={!canAct || busy}
            onClick={() => sendAction({ type: "confirm_play" })}
            className="w-full rounded-md border border-[#7a5b3a] bg-[#201813] px-3 py-2 text-xs font-semibold disabled:opacity-60"
          >
            プレイ確定
          </button>
        </div>
      )}

      {phase === "spirit" && (
        <div className="space-y-2">
          <div className="text-xs text-[#c9b691]">精霊</div>
          <div className="flex flex-wrap gap-2">
            {spiritMatches.length === 0 ? (
              <div className="text-[11px] text-[#a48f6a]">発動可能な精霊なし</div>
            ) : (
              spiritMatches.map((spirit) => (
                <button
                  key={spirit.id}
                  type="button"
                  disabled={!canAct || busy}
                  onClick={() =>
                    sendAction({
                      type: "activate_spirit",
                      spiritId: spirit.id,
                    })
                  }
                  className="rounded-md border border-[#3b2e21] bg-[#1a1410] px-2 py-1 text-[11px] hover:border-[#cfa968] disabled:opacity-60"
                >
                  {spirit.name}
                </button>
              ))
            )}
          </div>
          <button
            type="button"
            disabled={!canAct || busy}
            onClick={() => sendAction({ type: "confirm_spirit" })}
            className="w-full rounded-md border border-[#7a5b3a] bg-[#201813] px-3 py-2 text-xs font-semibold disabled:opacity-60"
          >
            精霊フェイズ終了
          </button>
        </div>
      )}

      {phase === "move" && (
        <div className="space-y-2 text-xs text-[#c9b691]">
          <div>移動先はマップ上をクリックしてください。</div>
          <button
            type="button"
            disabled={!canAct || busy}
            onClick={() => sendAction({ type: "confirm_move" })}
            className="w-full rounded-md border border-[#7a5b3a] bg-[#201813] px-3 py-2 text-xs font-semibold text-[#f1e6d2] disabled:opacity-60"
          >
            移動確定
          </button>
        </div>
      )}

      {phase === "tile_action" && (
        <div className="space-y-2">
          <div className="text-xs text-[#c9b691]">マスアクション</div>
          <div className="flex flex-wrap gap-2">
            {availableTileActions.map((actionType) => (
              <button
                key={actionType}
                type="button"
                disabled={!canAct || busy}
                onClick={() =>
                  sendAction({
                    type: "tile_action",
                    actionType,
                  })
                }
                className="rounded-md border border-[#3b2e21] bg-[#1a1410] px-2 py-1 text-[11px] hover:border-[#cfa968] disabled:opacity-60"
              >
                {TILE_ACTION_LABELS[actionType]}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={!canAct || busy}
            onClick={() => sendAction({ type: "end_tile_action" })}
            className="w-full rounded-md border border-[#7a5b3a] bg-[#201813] px-3 py-2 text-xs font-semibold disabled:opacity-60"
          >
            マスアクション終了
          </button>
        </div>
      )}

      {phase === "discard" && (
        <button
          type="button"
          disabled={!canAct || busy}
          onClick={() => sendAction({ type: "confirm_discard" })}
          className="w-full rounded-md border border-[#7a5b3a] bg-[#201813] px-3 py-2 text-xs font-semibold disabled:opacity-60"
        >
          場札排出を確定
        </button>
      )}

      {phase === "draw" && (
        <button
          type="button"
          disabled={!canAct || busy}
          onClick={() => sendAction({ type: "confirm_draw" })}
          className="w-full rounded-md border border-[#7a5b3a] bg-[#201813] px-3 py-2 text-xs font-semibold disabled:opacity-60"
        >
          補充を確定
        </button>
      )}

      {error && <div className="text-xs text-[#ff8b8b]">{error}</div>}
    </div>
  );
}
