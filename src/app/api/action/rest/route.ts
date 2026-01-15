import { NextResponse } from "next/server";
import { getAdminDb } from "../../../../lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const gameId = String(body?.gameId ?? "").trim();
    const investigatorId = String(body?.investigatorId ?? "").trim();
    const uid = String(body?.uid ?? "").trim();
    const recover = String(body?.recover ?? "health").trim();

    if (!gameId || !investigatorId || !uid) {
      return NextResponse.json(
        { error: "gameId, investigatorId, and uid are required" },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const gameRef = db.collection("games").doc(gameId);
    const playerRef = gameRef.collection("players").doc(investigatorId);

    const [gameSnap, playerSnap] = await Promise.all([gameRef.get(), playerRef.get()]);
    if (!gameSnap.exists) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }
    if (!playerSnap.exists) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const game = gameSnap.data() || {};
    if (game.status !== "in_progress" || game.phase !== "ACTION") {
      return NextResponse.json({ error: "Not in action phase" }, { status: 409 });
    }

    const player = playerSnap.data() || {};
    if (player.ownerUid !== uid) {
      return NextResponse.json({ error: "Not your character" }, { status: 403 });
    }

    const activeId = game.activeInvestigatorId || "";
    if (activeId && activeId !== investigatorId) {
      return NextResponse.json({ error: "Not your turn" }, { status: 403 });
    }

    const actionsTaken = Number(game.turnState?.actionsTaken ?? 0);
    if (actionsTaken >= 2) {
      return NextResponse.json({ error: "No actions remaining" }, { status: 409 });
    }

    const health = Number(player.health ?? 0);
    const healthMax = Number(player.healthMax ?? 0);
    const sanity = Number(player.sanity ?? 0);
    const sanityMax = Number(player.sanityMax ?? 0);

    let nextHealth = health;
    let nextSanity = sanity;

    if (recover === "sanity") {
      nextSanity = Math.min(sanity + 1, sanityMax);
    } else {
      nextHealth = Math.min(health + 1, healthMax);
    }

    const nextTurnState = {
      ...(game.turnState ?? {}),
      actionsTaken: actionsTaken + 1,
    };

    await db.runTransaction(async (tx) => {
      tx.update(playerRef, {
        health: nextHealth,
        sanity: nextSanity,
      });
      tx.update(gameRef, {
        activeInvestigatorId: investigatorId,
        turnState: nextTurnState,
        updatedAt: new Date(),
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });
  }
}
