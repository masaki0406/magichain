# Player / Investigator Data Structure

This document outlines the data structure required to represent a player (Investigator) in the Eldritch Horror Online game.

## 1. Core Identity
Static information defining who the character is.

| Field | Type | Description | Example |
|---|---|---|---|
| `id` | `string` | Unique identifier for the investigator | `"silas_marsh"` |
| `name` | `string` | Display name | `"Silas Marsh"` |
| `title` | `string` | Character occupation/title | `"The Sailor"` |
| `portraitUrl` | `string` | Path to character image | `"/assets/investigators/silas.png"` |
| `backstory` | `string` | Flavor text | `"Silas has always felt the call of the sea..."` |

## 2. Attributes (Skills)
Base values for skill checks. These can be modified by items or improvements.

| Field | Type | Description |
|---|---|---|
| `lore` | `number` | Knowledge and magical aptitude |
| `influence` | `number` | Charisma and social ability |
| `observation` | `number` | Perception and investigation |
| `strength` | `number` | Physical power and combat |
| `will` | `number` | Mental fortitude and courage |

## 3. Vitals & Status
Dynamic state that changes frequently during gameplay.

| Field | Type | Description |
|---|---|---|
| `health` | `number` | Current physical health (Stamina) |
| `healthMax` | `number` | Maximum physical health |
| `sanity` | `number` | Current mental health (Sanity) |
| `sanityMax` | `number` | Maximum mental health |
| `isDelayed` | `boolean` | If true, player loses their next action phase |
| `locationId` | `string` | ID of the map node where the player is currently located |

## 4. Resources & Tokens
Currency and expendable items.

| Field | Type | Description |
|---|---|---|
| `clues` | `number` | Number of Clue tokens held |
| `focus` | `number` | Token used to re-roll 1 die during a test. (Max usually 2) |
| `tickets.train` | `number` | Number of Train tickets |
| `tickets.ship` | `number` | Number of Ship tickets |

## 5. Inventory & Possessions
Cards and items held by the player. Note: There is no "Money" token in Eldritch Horror; items are acquired by testing Influence.

| Field | Type | Description |
|---|---|---|
| `assets` | `string[]` | List of Asset card IDs (Items, Allies, Services) |
| `spells` | `string[]` | List of Spell card IDs |
| `artifacts` | `string[]` | List of Artifact card IDs |
| `conditions` | `string[]` | List of Condition card IDs (Injuries, Madness, Debt, etc.) |

## 6. Abilities
Unique character powers.

| Field | Type | Description |
|---|---|---|
| `actionAbility` | `object` | Description and logic for the character's unique Action |
| `passiveAbility` | `object` | Description and logic for the character's constant effect |

---

## TypeScript Interface Draft

```typescript
export interface Investigator {
    id: string;
    name: string;
    title: string;
    portrait: string;
    
    // Base Stats
    stats: {
        lore: number;
        influence: number;
        observation: number;
        strength: number;
        will: number;
    };

    // Vitals
    maxHealth: number;
    maxSanity: number;
    
    // Starting Info
    startingLocation: string;
    startingPossessions: string[]; // Description of starting items
}

export interface PlayerState {
    investigatorId: string; // Link to static Investigator data
    
    // Dynamic Status
    health: number;
    sanity: number;
    isDelayed: boolean; // If true, lose actions this turn
    locationId: string;
    
    // Tokens
    clues: number;
    focus: number;
    tickets: {
        train: number;
        ship: number;
    };

    // Inventory (Card Instance IDs)
    inventory: {
        assets: string[];
        spells: string[];
        artifacts: string[];
        conditions: string[];
    };
    
    // Stat Improvements (from training)
    improvements: {
        lore: number;
        influence: number;
        observation: number;
        strength: number;
        will: number;
    };
}
```
