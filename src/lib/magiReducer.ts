import {
  GameAction,
  GameEvent,
  GameState,
  Phase,
  PlayerState,
  ResourceKey,
  TileActionType,
} from "./magiTypes";
import { TILE_MAP, canTakeTileAction, createEmptyResources, drawCards, shuffle } from "./magiData";

const HAND_LIMIT = 8;

const RESOURCE_BY_COLOR: Record<string, ResourceKey | null> = {
  blue: "move",
  red: "attack",
  green: "intel",
  yellow: "draw",
  white: null,
};

function requireRunning(state: GameState) {
  if (state.status !== "running") {
    throw new Error("Game is not running");
  }
}

function requireTurn(state: GameState, actorId: string) {
  if (state.turn.currentPlayerId !== actorId) {
    throw new Error("Not your turn");
  }
}

function requirePhase(state: GameState, phase: Phase) {
  if (state.phase !== phase) {
    throw new Error(`Invalid phase: ${state.phase}`);
  }
}

function getPlayer(state: GameState, actorId: string): PlayerState {
  const player = state.players[actorId];
  if (!player) {
    throw new Error("Player not in game");
  }
  return player;
}

function updatePlayer(state: GameState, player: PlayerState) {
  state.players = { ...state.players, [player.uid]: player };
}

function logEvent(state: GameState, action: GameAction, actorId: string, message: string): GameEvent {
  const event: GameEvent = {
    actorId,
    action,
    message,
    createdAt: new Date().toISOString(),
    snapshotVersion: state.snapshotVersion + 1,
  };
  state.lastEvent = event;
  return event;
}

function matchesPattern(colors: string[], pattern: string[]): boolean {
  if (colors.length !== pattern.length) return false;
  return colors.every((color, index) => color === pattern[index]);
}

function advanceTurn(state: GameState) {
  const players = Object.values(state.players).sort((a, b) => a.seat - b.seat);
  const currentIndex = players.findIndex((player) => player.uid === state.turn.currentPlayerId);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % players.length;
  const nextPlayer = players[nextIndex];
  const nextTurnNumber = nextIndex === 0 ? state.turn.turnNumber + 1 : state.turn.turnNumber;

  state.turn = {
    currentPlayerId: nextPlayer.uid,
    turnNumber: nextTurnNumber,
    spiritsActivated: [],
    tileActionUsed: false,
  };
  state.phase = "play";
  Object.values(state.players).forEach((player) => {
    player.resources = createEmptyResources();
    player.field = [];
  });
}

function clearFieldToDiscard(state: GameState, player: PlayerState) {
  if (player.field.length === 0) return;
  state.stacks.cardDiscard = [...state.stacks.cardDiscard, ...player.field];
  player.field = [];
}

function enforceHandLimit(player: PlayerState) {
  if (player.hand.length <= HAND_LIMIT) return;
  player.hand = player.hand.slice(0, HAND_LIMIT);
}

function applyResourceGain(player: PlayerState, resource: ResourceKey, amount: number) {
  player.resources = { ...player.resources, [resource]: player.resources[resource] + amount };
}

function applyTileAction(state: GameState, player: PlayerState, actionType: TileActionType) {
  const tile = TILE_MAP[player.boardPos];
  if (!tile) {
    throw new Error("Unknown tile");
  }
  if (!canTakeTileAction(tile.type, actionType)) {
    throw new Error("Action not allowed on this tile");
  }

  switch (actionType) {
    case "learn": {
      if (player.resources.intel < 1) throw new Error("Not enough intel");
      player.resources = { ...player.resources, intel: player.resources.intel - 1 };
      const drawResult = drawCards(state.stacks.cardDeck, state.stacks.cardDiscard, 1);
      state.stacks.cardDeck = drawResult.deck;
      state.stacks.cardDiscard = drawResult.discard;
      player.hand = [...player.hand, ...drawResult.drawn];
      enforceHandLimit(player);
      break;
    }
    case "upgrade": {
      if (player.resources.intel < 1) throw new Error("Not enough intel");
      player.resources = { ...player.resources, intel: player.resources.intel - 1 };
      player.inventory = {
        ...player.inventory,
        tools: [...player.inventory.tools, `tool-${player.inventory.tools.length + 1}`],
      };
      break;
    }
    case "contract": {
      if (player.resources.intel < 1) throw new Error("Not enough intel");
      if (state.stacks.spiritDeck.length === 0) throw new Error("No spirit cards left");
      player.resources = { ...player.resources, intel: player.resources.intel - 1 };
      const [next, ...rest] = state.stacks.spiritDeck;
      state.stacks.spiritDeck = rest;
      player.spirits = [...player.spirits, next];
      break;
    }
    case "paper": {
      if (state.stacks.paperDeck.length === 0) throw new Error("No paper cards left");
      const [paper, ...rest] = state.stacks.paperDeck;
      state.stacks.paperDeck = rest;
      player.inventory = { ...player.inventory, papers: [...player.inventory.papers, paper] };
      break;
    }
    case "hunt": {
      if (player.resources.attack < 1) throw new Error("Not enough attack");
      if (state.stacks.monsterDeck.length === 0) throw new Error("No monster cards left");
      player.resources = { ...player.resources, attack: player.resources.attack - 1 };
      const [monster, ...rest] = state.stacks.monsterDeck;
      state.stacks.monsterDeck = rest;
      player.inventory = { ...player.inventory, monsters: [...player.inventory.monsters, monster] };
      break;
    }
    case "deliver": {
      const hasDeliverable = player.inventory.papers.length > 0 || player.inventory.monsters.length > 0;
      if (!hasDeliverable) throw new Error("No delivery items");
      if (player.inventory.papers.length > 0) {
        player.inventory = { ...player.inventory, papers: player.inventory.papers.slice(1) };
      } else {
        player.inventory = { ...player.inventory, monsters: player.inventory.monsters.slice(1) };
      }
      player.score += 2;
      break;
    }
    default: {
      throw new Error("Unknown action");
    }
  }
}

export function reduceGameState(state: GameState, action: GameAction, actorId: string) {
  requireRunning(state);
  requireTurn(state, actorId);

  const player = getPlayer(state, actorId);
  player.connected = true;
  player.lastSeenAt = new Date().toISOString();

  switch (action.type) {
    case "play_card": {
      requirePhase(state, "play");
      const cardIndex = player.hand.findIndex((card) => card.id === action.cardId);
      if (cardIndex === -1) throw new Error("Card not in hand");
      const [card] = player.hand.splice(cardIndex, 1);
      player.field = [...player.field, card];
      const resource = RESOURCE_BY_COLOR[card.color];
      if (resource) {
        applyResourceGain(player, resource, 1);
      }
      updatePlayer(state, player);
      return logEvent(state, action, actorId, `${player.name} がカードをプレイしました`);
    }
    case "confirm_play": {
      requirePhase(state, "play");
      state.phase = "spirit";
      updatePlayer(state, player);
      return logEvent(state, action, actorId, `${player.name} がプレイを確定しました`);
    }
    case "activate_spirit": {
      requirePhase(state, "spirit");
      if (state.turn.spiritsActivated.includes(action.spiritId)) {
        throw new Error("Spirit already activated");
      }
      const spirit = player.spirits.find((item) => item.id === action.spiritId);
      if (!spirit) throw new Error("Spirit not owned");
      const colors = player.field.map((card) => card.color);
      if (!matchesPattern(colors, spirit.pattern)) {
        throw new Error("Spirit pattern not matched");
      }
      if (spirit.effect.type === "resource") {
        applyResourceGain(player, spirit.effect.resource, spirit.effect.amount);
      } else {
        player.score += spirit.effect.points;
      }
      state.turn = { ...state.turn, spiritsActivated: [...state.turn.spiritsActivated, spirit.id] };
      updatePlayer(state, player);
      return logEvent(state, action, actorId, `${player.name} が精霊 ${spirit.name} を発動しました`);
    }
    case "confirm_spirit": {
      requirePhase(state, "spirit");
      state.phase = "move";
      updatePlayer(state, player);
      return logEvent(state, action, actorId, `${player.name} が精霊フェイズを終了しました`);
    }
    case "move": {
      requirePhase(state, "move");
      if (player.resources.move < 1) throw new Error("No move points");
      const current = TILE_MAP[player.boardPos];
      const target = TILE_MAP[action.targetId];
      if (!current || !target) throw new Error("Unknown tile");
      if (!current.neighbors.includes(target.id)) throw new Error("Tile not adjacent");
      if (
        target.type !== "city" &&
        Object.values(state.players).some(
          (other) => other.uid !== player.uid && other.boardPos === target.id
        )
      ) {
        throw new Error("Tile occupied");
      }
      player.boardPos = target.id;
      player.resources = { ...player.resources, move: player.resources.move - 1 };
      updatePlayer(state, player);
      return logEvent(state, action, actorId, `${player.name} が移動しました`);
    }
    case "confirm_move": {
      requirePhase(state, "move");
      state.phase = "tile_action";
      updatePlayer(state, player);
      return logEvent(state, action, actorId, `${player.name} が移動を確定しました`);
    }
    case "tile_action": {
      requirePhase(state, "tile_action");
      if (state.turn.tileActionUsed) throw new Error("Tile action already used");
      applyTileAction(state, player, action.actionType);
      state.turn = { ...state.turn, tileActionUsed: true };
      updatePlayer(state, player);
      return logEvent(state, action, actorId, `${player.name} がマスアクションを実行しました`);
    }
    case "end_tile_action": {
      requirePhase(state, "tile_action");
      clearFieldToDiscard(state, player);
      updatePlayer(state, player);
      state.phase = "discard";
      return logEvent(state, action, actorId, `${player.name} がマスアクションを終了しました`);
    }
    case "confirm_discard": {
      requirePhase(state, "discard");
      state.phase = "draw";
      updatePlayer(state, player);
      return logEvent(state, action, actorId, `${player.name} が捨て札を確定しました`);
    }
    case "confirm_draw": {
      requirePhase(state, "draw");
      const drawCount = Math.max(0, player.resources.draw);
      const drawResult = drawCards(state.stacks.cardDeck, state.stacks.cardDiscard, drawCount);
      state.stacks.cardDeck = drawResult.deck;
      state.stacks.cardDiscard = drawResult.discard;
      player.hand = [...player.hand, ...drawResult.drawn];
      enforceHandLimit(player);
      updatePlayer(state, player);
      advanceTurn(state);
      return logEvent(state, action, actorId, `${player.name} が手札を補充しました`);
    }
    default: {
      throw new Error("Unknown action");
    }
  }
}

export function checkGameEnd(state: GameState) {
  const emptyDecks = [state.stacks.cardDeck, state.stacks.spiritDeck, state.stacks.paperDeck, state.stacks.monsterDeck].filter(
    (deck) => deck.length === 0
  ).length;
  if (emptyDecks > 0) {
    state.status = "finished";
  }
}
