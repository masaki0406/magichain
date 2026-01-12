"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveAction = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const pathfinding_1 = require("./pathfinding");
const map_1 = require("./map");
const db = admin.firestore();
exports.moveAction = functions.https.onCall(async (data, context) => {
    // 1. Auth Check
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }
    const playerId = context.auth.uid;
    const { gameId, destinationId } = data;
    // 2. Validate Input
    if (!gameId || !destinationId) {
        throw new functions.https.HttpsError("invalid-argument", "Missing gameId or destinationId.");
    }
    if (!map_1.WORLD_MAP[destinationId]) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid destination.");
    }
    // 3. Fetch Game State (Transaction for consistency)
    await db.runTransaction(async (transaction) => {
        const gameRef = db.collection("games").doc(gameId);
        const playerRef = gameRef.collection("players").doc(playerId);
        const gameDoc = await transaction.get(gameRef);
        const playerDoc = await transaction.get(playerRef);
        if (!gameDoc.exists || !playerDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Game or player not found.");
        }
        const gameState = gameDoc.data();
        const playerState = playerDoc.data();
        // 4. Validate Turn
        if ((gameState === null || gameState === void 0 ? void 0 : gameState.activePlayerId) !== playerId) {
            throw new functions.https.HttpsError("failed-precondition", "Not your turn.");
        }
        if ((gameState === null || gameState === void 0 ? void 0 : gameState.turnState.actionsTaken) >= 2) {
            throw new functions.https.HttpsError("failed-precondition", "No actions remaining.");
        }
        // 5. Validate Move Logic
        const currentLoc = playerState === null || playerState === void 0 ? void 0 : playerState.location;
        const reachable = (0, pathfinding_1.getReachableNodes)(currentLoc); // TODO: Pass tickets
        if (!reachable.includes(destinationId)) {
            throw new functions.https.HttpsError("failed-precondition", "Cannot move to that location.");
        }
        // 6. Execute Move
        transaction.update(playerRef, { location: destinationId });
        transaction.update(gameRef, {
            "turnState.actionsTaken": admin.firestore.FieldValue.increment(1)
        });
    });
    return { success: true, newLocation: destinationId };
});
//# sourceMappingURL=actions.js.map