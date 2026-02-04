import { NextResponse } from "next/server";
import { getAdminDb } from "../../../../lib/firebaseAdmin";
import { requireAuth } from "../../../../lib/apiAuth";
import { createLobbyGameState } from "../../../../lib/magiState";

export async function POST(request: Request) {
  try {
    const uid = await requireAuth(request);
    const body = await request.json();
    const name = String(body?.name ?? "MAGI CHAIN").trim() || "MAGI CHAIN";
    const maxPlayers = Math.min(Math.max(Number(body?.maxPlayers ?? 4), 1), 4);
    const rulesetVersion = String(body?.rulesetVersion ?? "v3");

    const db = getAdminDb();
    const gameRef = db.collection("games").doc();
    const gameId = gameRef.id;
    const gameState = createLobbyGameState({
      gameId,
      name,
      hostUid: uid,
      hostName: String(body?.hostName ?? "Host"),
      maxPlayers,
      rulesetVersion,
    });

    await gameRef.set(gameState);
    await db.collection("userGames").doc(uid).collection("items").doc(gameId).set({
      gameId,
      name,
      status: gameState.status,
      role: "host",
      lastAccessedAt: new Date().toISOString(),
      updatedAt: gameState.updatedAt,
    });

    return NextResponse.json({ gameId });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });
  }
}
