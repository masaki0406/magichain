"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db, ensureAnonymousAuth } from "./firebaseClient";
import { GameState, PlayerState } from "./magiTypes";

type GameStateResult = {
  game: GameState | null;
  players: PlayerState[];
  loading: boolean;
  error: string | null;
};

export function useGameState(gameId: string | null): GameStateResult {
  const [game, setGame] = useState<GameState | null>(null);
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) {
      setGame(null);
      setPlayers([]);
      setLoading(false);
      setError(null);
      return;
    }

    let active = true;
    let unsubGame: (() => void) | null = null;

    setLoading(true);
    setError(null);

    ensureAnonymousAuth()
      .then(() => {
        if (!active) return;
        const gameRef = doc(db, "games", gameId);

        unsubGame = onSnapshot(
          gameRef,
          (snap) => {
            if (snap.exists()) {
              const data = snap.data() as GameState;
              setGame(data);
              setPlayers(Object.values(data.players ?? {}));
            } else {
              setGame(null);
              setPlayers([]);
            }
            setLoading(false);
          },
          (err) => {
            setError(err.message);
            setLoading(false);
          }
        );
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message ?? "認証に失敗しました");
        setLoading(false);
      });

    return () => {
      active = false;
      if (unsubGame) unsubGame();
    };
  }, [gameId]);

  return { game, players, loading, error };
}
