import GameMap from '../components/map/GameMap';
import GameHUD from '../components/hud/GameHUD';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0c0a09] overflow-hidden">
      <div className="relative w-full max-w-6xl aspect-square">
        {/* The Map Component now handles the visual display using the image */}
        <GameMap />

        {/* HUD Overlay - Positioned absolutely over the map */}
        <GameHUD />
      </div>
    </main>
  );
}
