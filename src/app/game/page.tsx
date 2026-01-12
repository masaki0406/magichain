import GameMap from "../../components/map/GameMap";
import GameHUD from "../../components/hud/GameHUD";
import GameMenu from "../../components/hud/GameMenu";

export default function GamePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0c0a09] overflow-hidden">
      <div className="relative w-full max-w-6xl aspect-square">
        <GameMap />
        <GameHUD />
        <GameMenu />
      </div>
    </main>
  );
}
