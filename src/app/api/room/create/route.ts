import { NextResponse } from "next/server";
import { getAdminDb } from "../../../../lib/firebaseAdmin";
import { CHARACTER_SEEDS } from "../../../../data/characters";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const roomId = String(body?.roomId ?? "").trim();
    const hostUid = String(body?.hostUid ?? "").trim();
    const hostName = String(body?.hostName ?? "Host").trim() || "Host";

    if (!roomId || !hostUid) {
      return NextResponse.json({ error: "roomId and hostUid are required" }, { status: 400 });
    }

    const db = getAdminDb();
    const gameRef = db.collection("games").doc(roomId);
    const existing = await gameRef.get();
    if (existing.exists) {
      return NextResponse.json({ error: "Room already exists" }, { status: 409 });
    }

    await gameRef.set({
      doom: 20,
      omen: 0,
      phase: "ACTION",
      activeInvestigatorId: "",
      turnState: { actionsTaken: 0 },
      hostId: hostUid,
      memberIds: [hostUid],
      memberNames: { [hostUid]: hostName },
      status: "active",
      schemaVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const batch = db.batch();
    CHARACTER_SEEDS.forEach((seed) => {
      const playerRef = gameRef.collection("players").doc(seed.id);
      batch.set(
        playerRef,
        {
          id: seed.id,
          investigatorId: seed.id,
          name: seed.name,
          title: seed.title,
          portrait: seed.portrait,
          displayName: "",
          ownerUid: null,
          ready: false,
          locationId: seed.locationId,
          health: seed.healthMax,
          healthMax: seed.healthMax,
          sanity: seed.sanityMax,
          sanityMax: seed.sanityMax,
          isDelayed: false,
          clues: 0,
          focus: 0,
          tickets: { train: 0, ship: 0 },
          inventory: { assets: [], spells: [], artifacts: [], conditions: [] },
          stats: seed.stats,
          improvements: { lore: 0, influence: 0, observation: 0, strength: 0, will: 0 },
        },
        { merge: true },
      );
    });
    await batch.commit();

    return NextResponse.json({ roomId });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });
  }
}
