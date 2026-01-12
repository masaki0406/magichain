import { WORLD_MAP } from './map';
import { getReachableNodes } from './pathfinding';

function verifyMap() {
    console.log("Verifying World Map...");

    const errors: string[] = [];
    const cities = ["arkham", "san_francisco", "london", "rome", "istanbul", "tokyo", "shanghai", "sydney", "buenos_aires"];

    // 1. Check Major Cities
    cities.forEach(cityId => {
        if (!WORLD_MAP[cityId]) {
            errors.push(`Missing city: ${cityId}`);
        } else {
            console.log(`[OK] City found: ${WORLD_MAP[cityId].name}`);
        }
    });

    // 2. Check Connections Integrity
    Object.values(WORLD_MAP).forEach(node => {
        node.connections.forEach(conn => {
            if (!WORLD_MAP[conn.targetId]) {
                errors.push(`Invalid connection from ${node.id} to ${conn.targetId}`);
            }
        });
    });

    // 3. Check Pathfinding (Basic)
    // San Francisco -> 7 (Train)
    const sfNeighbors = getReachableNodes("san_francisco");
    if (sfNeighbors.includes("7")) {
        console.log("[OK] San Francisco -> 7 connection verified");
    } else {
        errors.push("San Francisco should be connected to 7");
    }

    // London -> Rome (Train)
    const londonNeighbors = getReachableNodes("london");
    if (londonNeighbors.includes("rome")) {
        console.log("[OK] London -> Rome connection verified");
    } else {
        errors.push("London should be connected to Rome");
    }

    if (errors.length > 0) {
        console.error("\nVerification FAILED with errors:");
        errors.forEach(e => console.error(`- ${e}`));
        process.exit(1);
    } else {
        console.log("\nVerification SUCCESS!");
    }
}

verifyMap();
