import { NextResponse } from "next/server";
import { getAdminDb } from "../../../../lib/firebaseAdmin";
import { requireAuth } from "../../../../lib/apiAuth";
import { reduceGameState, checkGameEnd } from "../../../../lib/magiReducer";
import { GameAction, GameState } from "../../../../lib/magiTypes";

type ActionRequest = {
  gameId: string;
  snapshotVersion: number;
  action: GameAction;
};

export async function POST(request: Request) {
  try {
    const uid = await requireAuth(request);
    const body = (await request.json()) as ActionRequest;
    const gameId = String(body?.gameId ?? "").trim();
    const snapshotVersion = Number(body?.snapshotVersion ?? 0);
    const action = body?.action as GameAction | undefined;

    if (!gameId || !action) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const db = getAdminDb();
    const gameRef = db.collection("games").doc(gameId);

    const { newSnapshotVersion, status } = await db.runTransaction(async (tx) => {
      const snap = await tx.get(gameRef);
      if (!snap.exists) throw new Error("Game not found");
      const state = snap.data() as GameState;
      if (snapshotVersion !== state.snapshotVersion) {
        const error = new Error("Stale snapshot");
        (error as any).code = "stale";
        throw error;
      }

      const event = reduceGameState(state, action, uid);
      state.snapshotVersion += 1;
      state.updatedAt = new Date().toISOString();
      checkGameEnd(state);

      tx.set(gameRef, state);
      const eventRef = gameRef.collection("events").doc();
      tx.set(eventRef, event);

      return { newSnapshotVersion: state.snapshotVersion, status: state.status };
    });

    await db.collection("userGames").doc(uid).collection("items").doc(gameId).set(
      {
        lastAccessedAt: new Date().toISOString(),
        status,
      },
      { merge: true }
    );

    return NextResponse.json({ newSnapshotVersion });
  } catch (error: any) {
    if (error?.code === "stale") {
      return NextResponse.json({ error: "Stale snapshot" }, { status: 409 });
    }
    return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 400 });
  }
}
