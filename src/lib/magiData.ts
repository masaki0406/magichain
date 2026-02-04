import { Card, CardColor, GameStacks, PlayerState, Resources, SpiritCard, Tile, TileActionType, TileType } from "./magiTypes";

const CARD_COLORS: CardColor[] = ["white", "red", "blue", "green", "yellow"];

const BASE_SPIRITS: SpiritCard[] = [
  {
    id: "spirit-azure-chain",
    name: "蒼のチェイン",
    pattern: ["blue", "blue", "white"],
    effect: { type: "resource", resource: "move", amount: 2 },
  },
  {
    id: "spirit-verdant-guard",
    name: "深緑の守護",
    pattern: ["green", "green", "white"],
    effect: { type: "resource", resource: "intel", amount: 2 },
  },
  {
    id: "spirit-crimson-fang",
    name: "紅蓮の牙",
    pattern: ["red", "red", "white"],
    effect: { type: "resource", resource: "attack", amount: 2 },
  },
  {
    id: "spirit-golden-stream",
    name: "金色の奔流",
    pattern: ["yellow", "yellow", "white"],
    effect: { type: "resource", resource: "draw", amount: 1 },
  },
  {
    id: "spirit-prism-wish",
    name: "彩の祈り",
    pattern: ["blue", "green", "yellow"],
    effect: { type: "score", points: 3 },
  },
];

const PAPER_DECK = [
  "古代術式論文",
  "地脈観測報告",
  "魔導式改良メモ",
  "精霊契約研究",
  "幻獣生態記録",
];

const MONSTER_DECK = ["霧の獣", "鋼皮のゴーレム", "深淵の影", "雷角獣", "灼熱の飛竜"];

const TILE_DEFS: Array<Omit<Tile, "neighbors">> = [
  { id: "city-1", name: "交易都市", type: "city", x: 2, y: 0 },
  { id: "element-fire", name: "火の属性地", type: "element", x: 1, y: 1 },
  { id: "danger-1", name: "危険な道", type: "danger", x: 2, y: 1 },
  { id: "seed-1", name: "聖樹の子株", type: "seed", x: 3, y: 1 },
  { id: "city-2", name: "学術都市", type: "city", x: 0, y: 2 },
  { id: "monster-1", name: "魔物地帯", type: "monster", x: 2, y: 2 },
  { id: "element-water", name: "水の属性地", type: "element", x: 4, y: 2 },
  { id: "seed-2", name: "芽吹きの森", type: "seed", x: 1, y: 3 },
  { id: "danger-2", name: "崩落渓谷", type: "danger", x: 3, y: 3 },
  { id: "city-3", name: "港街", type: "city", x: 2, y: 4 },
];

const ACTION_BY_TILE: Record<TileType, TileActionType[]> = {
  city: ["deliver"],
  danger: ["paper"],
  element: ["learn", "contract"],
  seed: ["upgrade", "contract"],
  monster: ["hunt"],
};

export const TILE_ACTIONS_BY_TYPE = ACTION_BY_TILE;

export function getTileMap(): Record<string, Tile> {
  const tiles: Tile[] = TILE_DEFS.map((tile) => ({ ...tile, neighbors: [] }));
  tiles.forEach((tile) => {
    const neighbors = tiles
      .filter((candidate) =>
        Math.abs(candidate.x - tile.x) + Math.abs(candidate.y - tile.y) === 1
      )
      .map((candidate) => candidate.id);
    tile.neighbors = neighbors;
  });
  return Object.fromEntries(tiles.map((tile) => [tile.id, tile]));
}

export const TILE_MAP = getTileMap();

export function getStartingTileId() {
  return "city-1";
}

export function createEmptyResources(): Resources {
  return { move: 0, attack: 0, intel: 0, draw: 0 };
}

export function createPlayerState(uid: string, name: string, seat: number): PlayerState {
  return {
    uid,
    name,
    seat,
    connected: true,
    lastSeenAt: new Date().toISOString(),
    score: 0,
    resources: createEmptyResources(),
    hand: [],
    field: [],
    spirits: [],
    boardPos: getStartingTileId(),
    inventory: { papers: [], monsters: [], tools: [] },
  };
}

export function createCardDeck(): Card[] {
  const cards: Card[] = [];
  let idx = 1;
  CARD_COLORS.forEach((color) => {
    for (let count = 0; count < 6; count += 1) {
      cards.push({ id: `card-${idx}`, color, name: `${color.toUpperCase()}-${count + 1}` });
      idx += 1;
    }
  });
  return shuffle(cards);
}

export function createSpiritDeck(): SpiritCard[] {
  return shuffle([...BASE_SPIRITS]);
}

export function createStacks(): GameStacks {
  return {
    cardDeck: createCardDeck(),
    cardDiscard: [],
    spiritDeck: createSpiritDeck(),
    paperDeck: shuffle([...PAPER_DECK]),
    monsterDeck: shuffle([...MONSTER_DECK]),
  };
}

export function createEmptyStacks(): GameStacks {
  return { cardDeck: [], cardDiscard: [], spiritDeck: [], paperDeck: [], monsterDeck: [] };
}

export function shuffle<T>(items: T[]): T[] {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function drawCards(deck: Card[], discard: Card[], count: number): { drawn: Card[]; deck: Card[]; discard: Card[] } {
  let nextDeck = [...deck];
  let nextDiscard = [...discard];
  const drawn: Card[] = [];

  while (drawn.length < count) {
    if (nextDeck.length === 0) {
      if (nextDiscard.length === 0) break;
      nextDeck = shuffle(nextDiscard);
      nextDiscard = [];
    }
    const card = nextDeck.shift();
    if (!card) break;
    drawn.push(card);
  }

  return { drawn, deck: nextDeck, discard: nextDiscard };
}

export function canTakeTileAction(tileType: TileType, actionType: TileActionType): boolean {
  return TILE_ACTIONS_BY_TYPE[tileType]?.includes(actionType) ?? false;
}
