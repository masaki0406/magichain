import fs from "fs";
import path from "path";
import { getAdminDb } from "../src/lib/firebaseAdmin";
import { CHARACTER_SEEDS } from "../src/data/characters";

function loadEnvFromFile(filename: string) {
  if (!fs.existsSync(filename)) return;
  const contents = fs.readFileSync(filename, "utf8");
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if (!key || value === undefined) continue;
    if (value.startsWith("\"") && value.endsWith("\"")) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const rootDir = path.resolve(__dirname, "..");
loadEnvFromFile(path.join(rootDir, ".env.local"));

async function seedInvestigators() {
  const db = getAdminDb();
  const batch = db.batch();
  const collection = db.collection("investigators");

  CHARACTER_SEEDS.forEach((seed) => {
    const docRef = collection.doc(seed.id);
    batch.set(
      docRef,
      {
        ...seed,
        schemaVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: true },
    );
  });

  await batch.commit();
  console.log(`Seeded ${CHARACTER_SEEDS.length} investigators.`);
}

seedInvestigators().catch((error) => {
  console.error("Failed to seed investigators", error);
  process.exitCode = 1;
});
