"use client";

import React, { useState } from "react";
import SavePanel from "./SavePanel";

type TabKey = "rules" | "save";

export default function GameMenu() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>("rules");

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
            </div>

            {tab === "rules" ? (
              <div className="mt-4 grid gap-4 text-sm text-[#c9b691] md:grid-cols-2">
                <div className="rounded-xl border border-[#3b2e21] bg-[#120e0b] p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-[#a8946b]">Round Flow</div>
                  <ul className="mt-3 space-y-2">
                    <li>アクション → 遭遇 → 神話 の順で進行</li>
                    <li>アクションは各探索者 最大2回</li>
                    <li>遅延は次のアクションを失う</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-[#3b2e21] bg-[#120e0b] p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-[#a8946b]">Dice</div>
                  <ul className="mt-3 space-y-2">
                    <li>能力値分の d6 を振る</li>
                    <li>成功目は 5 / 6</li>
                    <li>祝福で成功範囲が拡張</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-[#3b2e21] bg-[#120e0b] p-4 md:col-span-2">
                  <div className="text-xs uppercase tracking-[0.2em] text-[#a8946b]">Notes</div>
                  <p className="mt-3 text-sm text-[#c9b691]">
                    詳細ルールはロビーまたは別紙の仕様書で確認してください。
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <SavePanel layout="panel" />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
