"use client";

import React from "react";
import type { Phase, Resources } from "../../lib/magiTypes";

type GameHUDProps = {
  phase?: Phase;
  turnNumber?: number;
  currentPlayerName?: string;
  resources?: Resources;
};

const PHASE_LABEL: Record<Phase, string> = {
  play: "プレイ",
  spirit: "精霊発動",
  move: "移動",
  tile_action: "マスアクション",
  discard: "場札排出",
  draw: "補充",
};

export default function GameHUD({ phase, turnNumber, currentPlayerName, resources }: GameHUDProps) {
  return (
    <div className="absolute left-4 top-4 z-20 space-y-3 rounded-xl border border-[#3b2e21] bg-black/70 p-4 text-xs text-[#f1e6d2]">
      <div className="text-[11px] uppercase tracking-[0.2em] text-[#a8946b]">Turn</div>
      <div className="text-lg font-semibold text-[#f5e7c9]">{turnNumber ?? 1}</div>
      <div className="text-[11px] uppercase tracking-[0.2em] text-[#a8946b]">Phase</div>
      <div className="text-sm text-[#f5e7c9]">{phase ? PHASE_LABEL[phase] : "待機中"}</div>
      <div className="text-[11px] uppercase tracking-[0.2em] text-[#a8946b]">Active</div>
      <div className="text-sm text-[#f5e7c9]">{currentPlayerName ?? "-"}</div>
      <div className="text-[11px] uppercase tracking-[0.2em] text-[#a8946b]">Resources</div>
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div>移動: {resources?.move ?? 0}</div>
        <div>攻撃: {resources?.attack ?? 0}</div>
        <div>知力: {resources?.intel ?? 0}</div>
        <div>ドロー: {resources?.draw ?? 0}</div>
      </div>
    </div>
  );
}
