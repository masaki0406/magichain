import { NextResponse } from "next/server";
import { getAdminDb } from "../../../../lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const roomId = String(body?.roomId ?? "").trim();
    const uid = String(body?.uid ?? "").trim();

    if (!roomId || !uid) {
      return NextResponse.json({ error: "roomId and uid are required" }, { status: 400 });
    }

    const db = getAdminDb();
    const gameRef = db.collection("games").doc(roomId);
    const gameSnap = await gameRef.get();
    if (!gameSnap.exists) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const gameData = gameSnap.data() || {};
    if (gameData.hostId !== uid) {
      return NextResponse.json({ error: "Only host can start selection" }, { status: 403 });
    }

    await gameRef.set(
      {
        lifecycleStage: "character_select",
        updatedAt: new Date(),
      },
      { merge: true },
    );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });
  }
}
