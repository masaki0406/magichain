export type LocationType = 'CITY' | 'SEA' | 'WILDERNESS';
export type PathType = 'TRAIN' | 'SHIP' | 'UNCHARTED';

export interface MapNode {
    id: string;
    name: string;
    type: LocationType;
    x: number;
    y: number;
    connections: { targetId: string; type: PathType }[];
}

export const WORLD_MAP: Record<string, MapNode> = {
    // --- Major Cities ---
    "san_francisco": {
        id: "san_francisco",
        name: "San Francisco",
        type: "CITY",
        x: 8, y: 48,
        connections: [
            { targetId: "1", type: "TRAIN" },
            { targetId: "2", type: "SHIP" },
            { targetId: "5", type: "UNCHARTED" },
            { targetId: "6", type: "TRAIN" },
            { targetId: "7", type: "TRAIN" }
        ]
    },
    "arkham": {
        id: "arkham",
        name: "Arkham",
        type: "CITY",
        x: 28, y: 45,
        connections: [
            { targetId: "london", type: "SHIP" },
            { targetId: "5", type: "UNCHARTED" },
            { targetId: "6", type: "TRAIN" },
            { targetId: "8", type: "SHIP" },
            { targetId: "9", type: "UNCHARTED" }
        ]
    },
    "buenos_aires": {
        id: "buenos_aires",
        name: "Buenos Aires",
        type: "CITY",
        x: 32, y: 82,
        connections: [
            { targetId: "3", type: "SHIP" },
            { targetId: "7", type: "TRAIN" },
            { targetId: "8", type: "SHIP" },
            { targetId: "11", type: "SHIP" },
            { targetId: "12", type: "SHIP" },
            { targetId: "amazon", type: "UNCHARTED" }
        ]
    },
    "london": {
        id: "london",
        name: "London",
        type: "CITY",
        x: 48, y: 38,
        connections: [
            { targetId: "arkham", type: "SHIP" },
            { targetId: "rome", type: "TRAIN" },
            { targetId: "13", type: "SHIP" }
        ]
    },
    "rome": {
        id: "rome",
        name: "Rome",
        type: "CITY",
        x: 57, y: 48, // Moved right
        connections: [
            { targetId: "london", type: "TRAIN" },
            { targetId: "istanbul", type: "TRAIN" },
            { targetId: "pyramids", type: "UNCHARTED" },
            { targetId: "10", type: "UNCHARTED" },
            { targetId: "14", type: "TRAIN" }
        ]
    },
    "istanbul": {
        id: "istanbul",
        name: "Istanbul",
        type: "CITY",
        x: 60, y: 38, // Moved left to separate from 14
        connections: [
            { targetId: "rome", type: "TRAIN" },
            { targetId: "pyramids", type: "UNCHARTED" },
            { targetId: "16", type: "TRAIN" },
            { targetId: "17", type: "TRAIN" }
        ]
    },
    "tokyo": {
        id: "tokyo",
        name: "Tokyo",
        type: "CITY",
        x: 92, y: 48,
        connections: [
            { targetId: "shanghai", type: "SHIP" },
            { targetId: "19", type: "UNCHARTED" },
            { targetId: "20", type: "TRAIN" }
        ]
    },
    "shanghai": {
        id: "shanghai",
        name: "Shanghai",
        type: "CITY",
        x: 82, y: 52,
        connections: [
            { targetId: "tokyo", type: "SHIP" },
            { targetId: "himalayas", type: "UNCHARTED" },
            { targetId: "17", type: "TRAIN" },
            { targetId: "19", type: "UNCHARTED" },
            { targetId: "20", type: "TRAIN" }
        ]
    },
    "sydney": {
        id: "sydney",
        name: "Sydney",
        type: "CITY",
        x: 92, y: 80, // Moved up-right
        connections: [
            { targetId: "antarctica", type: "SHIP" },
            { targetId: "18", type: "SHIP" },
            { targetId: "20", type: "SHIP" },
            { targetId: "21", type: "UNCHARTED" }
        ]
    },

    // --- Named Locations ---
    "amazon": { id: "amazon", name: "The Amazon", type: "WILDERNESS", x: 22, y: 65, connections: [{ targetId: "buenos_aires", type: "UNCHARTED" }, { targetId: "7", type: "UNCHARTED" }] },
    "pyramids": { id: "pyramids", name: "The Pyramids", type: "WILDERNESS", x: 55, y: 58, connections: [{ targetId: "rome", type: "UNCHARTED" }, { targetId: "istanbul", type: "UNCHARTED" }, { targetId: "heart_of_africa", type: "UNCHARTED" }, { targetId: "10", type: "UNCHARTED" }] },
    "heart_of_africa": { id: "heart_of_africa", name: "Heart of Africa", type: "WILDERNESS", x: 52, y: 72, connections: [{ targetId: "pyramids", type: "UNCHARTED" }, { targetId: "15", type: "UNCHARTED" }] },
    "antarctica": { id: "antarctica", name: "Antarctica", type: "WILDERNESS", x: 60, y: 95, connections: [{ targetId: "sydney", type: "SHIP" }, { targetId: "12", type: "SHIP" }] },
    "himalayas": { id: "himalayas", name: "Himalayas", type: "WILDERNESS", x: 72, y: 48, connections: [{ targetId: "shanghai", type: "UNCHARTED" }, { targetId: "17", type: "UNCHARTED" }] },
    "tunguska": { id: "tunguska", name: "Tunguska", type: "WILDERNESS", x: 78, y: 28, connections: [{ targetId: "16", type: "UNCHARTED" }, { targetId: "19", type: "UNCHARTED" }] },

    // --- Numbered Spaces (1-21) ---
    "1": { id: "1", name: "1", type: "CITY", x: 12, y: 68, connections: [{ targetId: "4", type: "UNCHARTED" }, { targetId: "san_francisco", type: "TRAIN" }] },
    "2": { id: "2", name: "2", type: "SEA", x: 20, y: 72, connections: [{ targetId: "san_francisco", type: "SHIP" }] },
    "3": { id: "3", name: "3", type: "SEA", x: 36, y: 35, connections: [{ targetId: "buenos_aires", type: "SHIP" }] }, // Moved left
    "4": { id: "4", name: "4", type: "WILDERNESS", x: 44, y: 35, connections: [{ targetId: "5", type: "UNCHARTED" }, { targetId: "1", type: "UNCHARTED" }] }, // Moved right
    "5": { id: "5", name: "5", type: "WILDERNESS", x: 36, y: 46, connections: [{ targetId: "san_francisco", type: "UNCHARTED" }, { targetId: "arkham", type: "UNCHARTED" }, { targetId: "4", type: "UNCHARTED" }] }, // Adjusted
    "6": { id: "6", name: "6", type: "CITY", x: 38, y: 58, connections: [{ targetId: "san_francisco", type: "TRAIN" }, { targetId: "arkham", type: "TRAIN" }, { targetId: "7", type: "TRAIN" }] },
    "7": { id: "7", name: "7", type: "CITY", x: 48, y: 52, connections: [{ targetId: "san_francisco", type: "TRAIN" }, { targetId: "buenos_aires", type: "TRAIN" }, { targetId: "amazon", type: "UNCHARTED" }, { targetId: "8", type: "SHIP" }, { targetId: "6", type: "TRAIN" }] },
    "8": { id: "8", name: "8", type: "SEA", x: 50, y: 44, connections: [{ targetId: "arkham", type: "SHIP" }, { targetId: "buenos_aires", type: "SHIP" }, { targetId: "10", type: "SHIP" }, { targetId: "7", type: "SHIP" }] }, // Moved left
    "9": { id: "9", name: "9", type: "WILDERNESS", x: 30, y: 52, connections: [{ targetId: "arkham", type: "UNCHARTED" }] }, // Moved left
    "10": { id: "10", name: "10", type: "WILDERNESS", x: 78, y: 38, connections: [{ targetId: "rome", type: "UNCHARTED" }, { targetId: "pyramids", type: "UNCHARTED" }, { targetId: "15", type: "UNCHARTED" }, { targetId: "8", type: "SHIP" }] },
    "11": { id: "11", name: "11", type: "SEA", x: 70, y: 32, connections: [{ targetId: "buenos_aires", type: "SHIP" }, { targetId: "15", type: "SHIP" }] }, // Moved up-right
    "12": { id: "12", name: "12", type: "SEA", x: 50, y: 85, connections: [{ targetId: "buenos_aires", type: "SHIP" }, { targetId: "antarctica", type: "SHIP" }] },
    "13": { id: "13", name: "13", type: "SEA", x: 52, y: 78, connections: [{ targetId: "london", type: "SHIP" }] },
    "14": { id: "14", name: "14", type: "CITY", x: 66, y: 40, connections: [{ targetId: "rome", type: "TRAIN" }, { targetId: "16", type: "TRAIN" }] }, // Moved right
    "15": { id: "15", name: "15", type: "CITY", x: 68, y: 58, connections: [{ targetId: "heart_of_africa", type: "UNCHARTED" }, { targetId: "17", type: "TRAIN" }, { targetId: "18", type: "SHIP" }, { targetId: "10", type: "UNCHARTED" }, { targetId: "11", type: "SHIP" }] },
    "16": { id: "16", name: "16", type: "CITY", x: 75, y: 58, connections: [{ targetId: "istanbul", type: "TRAIN" }, { targetId: "tunguska", type: "UNCHARTED" }, { targetId: "14", type: "TRAIN" }] },
    "17": { id: "17", name: "17", type: "CITY", x: 82, y: 62, connections: [{ targetId: "istanbul", type: "TRAIN" }, { targetId: "himalayas", type: "UNCHARTED" }, { targetId: "shanghai", type: "TRAIN" }, { targetId: "20", type: "TRAIN" }, { targetId: "15", type: "TRAIN" }] },
    "18": { id: "18", name: "18", type: "SEA", x: 82, y: 72, connections: [{ targetId: "sydney", type: "SHIP" }, { targetId: "15", type: "SHIP" }] },
    "19": { id: "19", name: "19", type: "WILDERNESS", x: 88, y: 40, connections: [{ targetId: "tokyo", type: "UNCHARTED" }, { targetId: "tunguska", type: "UNCHARTED" }, { targetId: "shanghai", type: "UNCHARTED" }] },
    "20": { id: "20", name: "20", type: "CITY", x: 86, y: 90, connections: [{ targetId: "tokyo", type: "TRAIN" }, { targetId: "shanghai", type: "TRAIN" }, { targetId: "sydney", type: "SHIP" }, { targetId: "17", type: "TRAIN" }] }, // Moved down-left
    "21": { id: "21", name: "21", type: "WILDERNESS", x: 96, y: 62, connections: [{ targetId: "sydney", type: "UNCHARTED" }] }
};
