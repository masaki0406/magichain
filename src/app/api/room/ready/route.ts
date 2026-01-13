import { NextResponse } from "next/server";
import { getAdminDb } from "../../../../lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const roomId = String(body?.roomId ?? "").trim();
    const investigatorId = String(body?.investigatorId ?? "").trim();
    const ready = Boolean(body?.ready);

    if (!roomId || !investigatorId) {
      return NextResponse.json({ error: "roomId and investigatorId are required" }, { status: 400 });
    }

    const db = getAdminDb();
    const playerRef = db
      .collection("games")
      .doc(roomId)
      .collection("players")
      .doc(investigatorId);

    await playerRef.set({ ready }, { merge: true });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });
  }
}
