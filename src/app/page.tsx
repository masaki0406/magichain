import Link from "next/link";
import JoinPanel from "../components/hud/JoinPanel";
import SavePanel from "../components/hud/SavePanel";

export default function LobbyPage() {
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

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-[#3b2e21] bg-gradient-to-br from-[#19130f] via-[#15100c] to-[#0f0b09] p-4 shadow-[0_0_40px_rgba(0,0,0,0.45)]">
            <JoinPanel layout="panel" />
          </div>
          <div className="rounded-2xl border border-[#3b2e21] bg-gradient-to-br from-[#19130f] via-[#15100c] to-[#0f0b09] p-4 shadow-[0_0_40px_rgba(0,0,0,0.45)]">
            <SavePanel layout="panel" />
          </div>
        </section>

        <section className="rounded-2xl border border-[#3b2e21] bg-[#130f0c] p-6 text-sm text-[#c9b691]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[#a8946b]">Next</div>
              <div className="text-lg font-semibold text-[#f5e7c9]">ゲーム盤面へ</div>
              <p className="mt-1 text-sm text-[#c9b691]">
                参加・引き継ぎ後にゲームへ移動します。
              </p>
            </div>
            <Link
              href="/game"
              className="inline-flex items-center justify-center rounded-md border border-[#7a5b3a] bg-[#7a5b3a] px-5 py-2 text-sm font-semibold text-[#f8f1e2] shadow-[0_0_12px_rgba(122,91,58,0.35)] hover:bg-[#8b6945]"
            >
              ゲームを開く
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
