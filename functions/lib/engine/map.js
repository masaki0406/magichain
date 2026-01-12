"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WORLD_MAP = void 0;
exports.WORLD_MAP = {
    // --- Major Cities ---
    "arkham": {
        id: "arkham",
        name: "Arkham",
        type: "CITY",
        connections: [
            { targetId: "london", type: "SHIP" },
            { targetId: "5", type: "UNCHARTED" },
            { targetId: "6", type: "TRAIN" },
            { targetId: "8", type: "SHIP" },
            { targetId: "9", type: "UNCHARTED" }
        ]
    },
    "san_francisco": {
        id: "san_francisco",
        name: "San Francisco",
        type: "CITY",
        connections: [
            { targetId: "1", type: "TRAIN" },
            { targetId: "2", type: "SHIP" },
            { targetId: "5", type: "UNCHARTED" },
            { targetId: "6", type: "TRAIN" },
            { targetId: "7", type: "TRAIN" }
        ]
    },
    "buenos_aires": {
        id: "buenos_aires",
        name: "Buenos Aires",
        type: "CITY",
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
        connections: [
            { targetId: "antarctica", type: "SHIP" },
            { targetId: "18", type: "SHIP" },
            { targetId: "20", type: "SHIP" },
            { targetId: "21", type: "UNCHARTED" }
        ]
    },
    // --- Named Locations ---
    "amazon": { id: "amazon", name: "The Amazon", type: "WILDERNESS", connections: [{ targetId: "buenos_aires", type: "UNCHARTED" }, { targetId: "7", type: "UNCHARTED" }] },
    "pyramids": { id: "pyramids", name: "The Pyramids", type: "WILDERNESS", connections: [{ targetId: "rome", type: "UNCHARTED" }, { targetId: "istanbul", type: "UNCHARTED" }, { targetId: "heart_of_africa", type: "UNCHARTED" }, { targetId: "10", type: "UNCHARTED" }] },
    "heart_of_africa": { id: "heart_of_africa", name: "Heart of Africa", type: "WILDERNESS", connections: [{ targetId: "pyramids", type: "UNCHARTED" }, { targetId: "15", type: "UNCHARTED" }] },
    "antarctica": { id: "antarctica", name: "Antarctica", type: "WILDERNESS", connections: [{ targetId: "sydney", type: "SHIP" }, { targetId: "12", type: "SHIP" }] },
    "himalayas": { id: "himalayas", name: "Himalayas", type: "WILDERNESS", connections: [{ targetId: "shanghai", type: "UNCHARTED" }, { targetId: "17", type: "UNCHARTED" }] },
    "tunguska": { id: "tunguska", name: "Tunguska", type: "WILDERNESS", connections: [{ targetId: "16", type: "UNCHARTED" }, { targetId: "19", type: "UNCHARTED" }] },
    // --- Numbered Spaces (1-21) ---
    "1": { id: "1", name: "1", type: "CITY", connections: [{ targetId: "4", type: "UNCHARTED" }, { targetId: "san_francisco", type: "TRAIN" }] },
    "2": { id: "2", name: "2", type: "SEA", connections: [{ targetId: "san_francisco", type: "SHIP" }] },
    "3": { id: "3", name: "3", type: "SEA", connections: [{ targetId: "buenos_aires", type: "SHIP" }] },
    "4": { id: "4", name: "4", type: "WILDERNESS", connections: [{ targetId: "5", type: "UNCHARTED" }, { targetId: "1", type: "UNCHARTED" }] },
    "5": { id: "5", name: "5", type: "WILDERNESS", connections: [{ targetId: "san_francisco", type: "UNCHARTED" }, { targetId: "arkham", type: "UNCHARTED" }, { targetId: "4", type: "UNCHARTED" }] },
    "6": { id: "6", name: "6", type: "CITY", connections: [{ targetId: "san_francisco", type: "TRAIN" }, { targetId: "arkham", type: "TRAIN" }, { targetId: "7", type: "TRAIN" }] },
    "7": { id: "7", name: "7", type: "CITY", connections: [{ targetId: "san_francisco", type: "TRAIN" }, { targetId: "buenos_aires", type: "TRAIN" }, { targetId: "amazon", type: "UNCHARTED" }, { targetId: "8", type: "SHIP" }, { targetId: "6", type: "TRAIN" }] },
    "8": { id: "8", name: "8", type: "SEA", connections: [{ targetId: "arkham", type: "SHIP" }, { targetId: "buenos_aires", type: "SHIP" }, { targetId: "10", type: "SHIP" }, { targetId: "7", type: "SHIP" }] },
    "9": { id: "9", name: "9", type: "WILDERNESS", connections: [{ targetId: "arkham", type: "UNCHARTED" }] },
    "10": { id: "10", name: "10", type: "WILDERNESS", connections: [{ targetId: "rome", type: "UNCHARTED" }, { targetId: "pyramids", type: "UNCHARTED" }, { targetId: "15", type: "UNCHARTED" }, { targetId: "8", type: "SHIP" }] },
    "11": { id: "11", name: "11", type: "SEA", connections: [{ targetId: "buenos_aires", type: "SHIP" }, { targetId: "15", type: "SHIP" }] },
    "12": { id: "12", name: "12", type: "SEA", connections: [{ targetId: "buenos_aires", type: "SHIP" }, { targetId: "antarctica", type: "SHIP" }] },
    "13": { id: "13", name: "13", type: "SEA", connections: [{ targetId: "london", type: "SHIP" }] },
    "14": { id: "14", name: "14", type: "CITY", connections: [{ targetId: "rome", type: "TRAIN" }, { targetId: "16", type: "TRAIN" }] },
    "15": { id: "15", name: "15", type: "CITY", connections: [{ targetId: "heart_of_africa", type: "UNCHARTED" }, { targetId: "17", type: "TRAIN" }, { targetId: "18", type: "SHIP" }, { targetId: "10", type: "UNCHARTED" }, { targetId: "11", type: "SHIP" }] },
    "16": { id: "16", name: "16", type: "CITY", connections: [{ targetId: "istanbul", type: "TRAIN" }, { targetId: "tunguska", type: "UNCHARTED" }, { targetId: "14", type: "TRAIN" }] },
    "17": { id: "17", name: "17", type: "CITY", connections: [{ targetId: "istanbul", type: "TRAIN" }, { targetId: "himalayas", type: "UNCHARTED" }, { targetId: "shanghai", type: "TRAIN" }, { targetId: "20", type: "TRAIN" }, { targetId: "15", type: "TRAIN" }] },
    "18": { id: "18", name: "18", type: "SEA", connections: [{ targetId: "sydney", type: "SHIP" }, { targetId: "15", type: "SHIP" }] },
    "19": { id: "19", name: "19", type: "WILDERNESS", connections: [{ targetId: "tokyo", type: "UNCHARTED" }, { targetId: "tunguska", type: "UNCHARTED" }, { targetId: "shanghai", type: "UNCHARTED" }] },
    "20": { id: "20", name: "20", type: "CITY", connections: [{ targetId: "tokyo", type: "TRAIN" }, { targetId: "shanghai", type: "TRAIN" }, { targetId: "sydney", type: "SHIP" }, { targetId: "17", type: "TRAIN" }] },
    "21": { id: "21", name: "21", type: "WILDERNESS", connections: [{ targetId: "sydney", type: "UNCHARTED" }] }
};
//# sourceMappingURL=map.js.map