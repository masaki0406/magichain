import { NextResponse } from "next/server";
import { getAdminDb } from "../../../../lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const roomId = String(body?.roomId ?? "").trim();
    const uid = String(body?.uid ?? "").trim();
    const name = String(body?.name ?? "Player").trim() || "Player";

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
    const memberIds: string[] = Array.isArray(gameData.memberIds) ? gameData.memberIds : [];
    if (!memberIds.includes(uid) && memberIds.length >= 8) {
      return NextResponse.json({ error: "Room is full" }, { status: 409 });
    }

    await gameRef.update({
      memberIds: Array.from(new Set([...memberIds, uid])),
      [`memberNames.${uid}`]: name,
      updatedAt: new Date(),
    });

    return NextResponse.json({ roomId });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });
  }
}
