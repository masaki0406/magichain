import { NextResponse } from "next/server";
import { getAdminDb } from "../../../../lib/firebaseAdmin";
import { requireAuth } from "../../../../lib/apiAuth";
import { initializeGame } from "../../../../lib/magiState";
import { GameState } from "../../../../lib/magiTypes";

export async function POST(request: Request) {
  try {
    const uid = await requireAuth(request);
    const body = await request.json();
    const gameId = String(body?.gameId ?? "").trim();
    if (!gameId) {
      return NextResponse.json({ error: "gameId required" }, { status: 400 });
    }

    const db = getAdminDb();
    const gameRef = db.collection("games").doc(gameId);

    const updated = await db.runTransaction(async (tx) => {
      const snap = await tx.get(gameRef);
      if (!snap.exists) throw new Error("Game not found");
      const data = snap.data() as GameState;
      if (data.status !== "lobby") throw new Error("Already started");
      if (data.memberIds[0] !== uid) throw new Error("Only host can start");
      const nextState = initializeGame(data);
      tx.set(gameRef, nextState);
      return nextState;
    });

    await Promise.all(
      updated.memberIds.map((memberId) =>
        db
          .collection("userGames")
          .doc(memberId)
          .collection("items")
          .doc(gameId)
          .set(
            {
              gameId,
              name: updated.name,
              status: updated.status,
              lastAccessedAt: new Date().toISOString(),
              updatedAt: updated.updatedAt,
            },
            { merge: true }
          )
      )
    );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });
  }
}
