"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query } from "firebase/firestore";
import { db, ensureAnonymousAuth } from "./firebaseClient";

export type GameState = {
  doom?: number;
  omen?: number;
  phase?: string;
  activeInvestigatorId?: string;
  turnState?: { actionsTaken?: number; actionHistory?: string[] };
  hostId?: string;
  status?: string;
  lifecycleStage?: string;
  memberIds?: string[];
  memberNames?: Record<string, string>;
  startedAt?: unknown;
};

export type PlayerState = {
  id: string;
  name?: string;
  displayName?: string;
  ownerUid?: string | null;
  locationId?: string;
  health?: number;
  sanity?: number;
  ready?: boolean;
};

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
    let unsubPlayers: (() => void) | null = null;

    setLoading(true);
    setError(null);

    ensureAnonymousAuth()
      .then(() => {
        if (!active) return;
        const gameRef = doc(db, "games", gameId);
        const playersRef = query(collection(db, "games", gameId, "players"));

        unsubGame = onSnapshot(
          gameRef,
          (snap) => {
            if (snap.exists()) {
              setGame(snap.data() as GameState);
            } else {
              setGame(null);
            }
            setLoading(false);
          },
          (err) => {
            setError(err.message);
            setLoading(false);
          }
        );

        unsubPlayers = onSnapshot(
          playersRef,
          (snap) => {
            const nextPlayers = snap.docs.map((docSnap) => ({
              id: docSnap.id,
              ...(docSnap.data() as Omit<PlayerState, "id">),
            }));
            setPlayers(nextPlayers);
          },
          (err) => {
            setError(err.message);
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
      if (unsubPlayers) unsubPlayers();
    };
  }, [gameId]);

  return { game, players, loading, error };
}
