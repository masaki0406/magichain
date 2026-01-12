
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
// Note: This requires GOOGLE_APPLICATION_CREDENTIALS to be set or running in an environment with access.
// For local development with emulators, it connects automatically if configured.
// For this script to run against the real DB from local, we might need `firebase login` credentials.
// However, a simpler way for the user is to use the Firebase Admin SDK with a service account, 
// OR just use the client SDK for this one-off seed if auth allows.
// Given the constraints, I will create a script that uses the Admin SDK but assumes we can run it via `ts-node` 
// and the user might need to log in via `gcloud auth application-default login`.

// Actually, to make it easiest for the user right now without complex auth setup, 
// I will create a simple script that they can run which uses the *Client* SDK 
// (since they are likely logged in or can easily be) or just explain that I will use the `functions` to do it.

// Better approach: Create a temporary Cloud Function that seeds the DB when triggered. 
// This avoids local auth issues.

// Wait, the user wants me to "create tables". 
// I will create a local script using the Admin SDK. 
// I'll ask the user to run `gcloud auth application-default login` if needed, 
// but first I'll try to write it.

const projectId = 'eldritch-206a9';
process.env.GCLOUD_PROJECT = projectId;

if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();

async function seedDatabase() {
    console.log('Seeding database for project:', projectId);

    // 1. Create a Game Session
    const gameId = 'game_v1_test';
    const gameRef = db.collection('games').doc(gameId);

    const initialGameState = {
        doom: 20,
        omen: 0, // Green
        activeInvestigatorId: 'silas_marsh',
        phase: 'ACTION',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await gameRef.set(initialGameState);
    console.log('Created game document:', gameId);

    // 2. Create a Player (Investigator)
    const playerId = 'silas_marsh';
    const playerRef = gameRef.collection('players').doc(playerId);

    const silasData = {
        id: 'silas_marsh',
        name: 'Silas Marsh',
        title: 'The Sailor',
        portrait: '/assets/investigators/silas.png',
        stats: {
            lore: 1,
            influence: 2,
            observation: 3,
            strength: 3,
            will: 2
        },
        health: 7,
        healthMax: 7,
        sanity: 5,
        sanityMax: 5,
        isDelayed: false,
        locationId: 'sydney', // Starting location
        clues: 0,
        focus: 0,
        tickets: {
            train: 0,
            ship: 0
        },
        inventory: {
            assets: [],
            spells: [],
            artifacts: [],
            conditions: []
        },
        improvements: {
            lore: 0,
            influence: 0,
            observation: 0,
            strength: 0,
            will: 0
        }
    };

    await playerRef.set(silasData);
    console.log('Created player document:', playerId);

    console.log('Database seeding completed!');
}

seedDatabase().catch(console.error);
