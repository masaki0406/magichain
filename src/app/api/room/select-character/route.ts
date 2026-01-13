import { NextResponse } from "next/server";
import { getAdminDb } from "../../../../lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const roomId = String(body?.roomId ?? "").trim();
    const uid = String(body?.uid ?? "").trim();
    const investigatorId = String(body?.investigatorId ?? "").trim();
    const displayName = String(body?.displayName ?? "Player").trim() || "Player";

    if (!roomId || !uid || !investigatorId) {
      return NextResponse.json({ error: "roomId, uid, and investigatorId are required" }, { status: 400 });
    }

    const db = getAdminDb();
    const playerRef = db
      .collection("games")
      .doc(roomId)
      .collection("players")
      .doc(investigatorId);

    await playerRef.set(
      {
        ownerUid: uid,
        displayName,
      },
      { merge: true },
    );

    await db.collection("games").doc(roomId).set(
      {
        updatedAt: new Date(),
      },
      { merge: true },
    );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });
  }
}
