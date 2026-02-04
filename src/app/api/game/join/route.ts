import { NextResponse } from "next/server";
import { getAdminDb } from "../../../../lib/firebaseAdmin";
import { requireAuth } from "../../../../lib/apiAuth";
import { createPlayerState } from "../../../../lib/magiData";
import { addPlayerToLobby } from "../../../../lib/magiState";
import { GameState } from "../../../../lib/magiTypes";

export async function POST(request: Request) {
  try {
    const uid = await requireAuth(request);
    const body = await request.json();
    const gameId = String(body?.gameId ?? "").trim();
    const name = String(body?.name ?? "Player").trim() || "Player";

    if (!gameId) {
      return NextResponse.json({ error: "gameId required" }, { status: 400 });
    }

    const db = getAdminDb();
    const gameRef = db.collection("games").doc(gameId);

    let gameName = "MAGI CHAIN";
    let gameUpdatedAt = new Date().toISOString();

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(gameRef);
      if (!snap.exists) throw new Error("Game not found");
      const data = snap.data() as GameState;
      gameName = data.name;
      gameUpdatedAt = data.updatedAt;
      if (data.memberIds.includes(uid)) return;
      if (data.memberIds.length >= data.maxPlayers) throw new Error("Game is full");
      if (data.status !== "lobby") throw new Error("Game already started");

      const seat = Object.values(data.players).length + 1;
      const player = createPlayerState(uid, name, seat);
      const nextState = addPlayerToLobby(data, player);
      tx.set(gameRef, nextState);
    });

    await db.collection("userGames").doc(uid).collection("items").doc(gameId).set({
      gameId,
      name: gameName,
      status: "lobby",
      role: "player",
      lastAccessedAt: new Date().toISOString(),
      updatedAt: gameUpdatedAt,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });
  }
}
