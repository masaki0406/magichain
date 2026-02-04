export const PHASES = ["play", "spirit", "move", "tile_action", "discard", "draw"] as const;

export type Phase = (typeof PHASES)[number];
export type GameStatus = "lobby" | "running" | "finished";
export type CardColor = "white" | "red" | "blue" | "green" | "yellow";
export type ResourceKey = "move" | "attack" | "intel" | "draw";
export type TileType = "city" | "danger" | "element" | "seed" | "monster";
export type TileActionType = "learn" | "upgrade" | "contract" | "paper" | "hunt" | "deliver";

export type Resources = Record<ResourceKey, number>;

export type Card = {
  id: string;
  color: CardColor;
  name: string;
};

export type SpiritCard = {
  id: string;
  name: string;
  pattern: CardColor[];
  effect: { type: "resource"; resource: ResourceKey; amount: number } | { type: "score"; points: number };
};

export type Tile = {
  id: string;
  name: string;
  type: TileType;
  x: number;
  y: number;
  neighbors: string[];
};

export type Inventory = {
  papers: string[];
  monsters: string[];
  tools: string[];
};

export type PlayerState = {
  uid: string;
  name: string;
  seat: number;
  connected: boolean;
  lastSeenAt: string;
  score: number;
  resources: Resources;
  hand: Card[];
  field: Card[];
  spirits: SpiritCard[];
  boardPos: string;
  inventory: Inventory;
};

export type TurnState = {
  currentPlayerId: string;
  turnNumber: number;
  spiritsActivated: string[];
  tileActionUsed: boolean;
};

export type GameStacks = {
  cardDeck: Card[];
  cardDiscard: Card[];
  spiritDeck: SpiritCard[];
  paperDeck: string[];
  monsterDeck: string[];
};

export type GameEvent = {
  actorId: string;
  action: GameAction;
  message: string;
  createdAt: string;
  snapshotVersion: number;
};

export type GameState = {
  id: string;
  name: string;
  status: GameStatus;
  phase: Phase;
  turn: TurnState;
  snapshotVersion: number;
  maxPlayers: number;
  memberIds: string[];
  memberNames: Record<string, string>;
  players: Record<string, PlayerState>;
  stacks: GameStacks;
  rulesetVersion: string;
  createdAt: string;
  updatedAt: string;
  lastEvent?: GameEvent;
};

export type GameAction =
  | { type: "play_card"; cardId: string }
  | { type: "confirm_play" }
  | { type: "activate_spirit"; spiritId: string }
  | { type: "confirm_spirit" }
  | { type: "move"; targetId: string }
  | { type: "confirm_move" }
  | { type: "tile_action"; actionType: TileActionType }
  | { type: "end_tile_action" }
  | { type: "confirm_discard" }
  | { type: "confirm_draw" };
