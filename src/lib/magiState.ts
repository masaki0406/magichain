import { createEmptyStacks, createPlayerState, createStacks, drawCards } from "./magiData";
import { GameState, PlayerState } from "./magiTypes";

const INITIAL_HAND_SIZE = 5;

export function createLobbyGameState(options: {
  gameId: string;
  name: string;
  hostUid: string;
  hostName: string;
  maxPlayers: number;
  rulesetVersion: string;
}): GameState {
  const now = new Date().toISOString();
  const hostPlayer = createPlayerState(options.hostUid, options.hostName, 1);
  return {
    id: options.gameId,
    name: options.name,
    status: "lobby",
    phase: "play",
    turn: {
      currentPlayerId: options.hostUid,
      turnNumber: 1,
      spiritsActivated: [],
      tileActionUsed: false,
    },
    snapshotVersion: 0,
    maxPlayers: options.maxPlayers,
    memberIds: [options.hostUid],
    memberNames: { [options.hostUid]: options.hostName },
    players: { [options.hostUid]: hostPlayer },
    stacks: createEmptyStacks(),
    rulesetVersion: options.rulesetVersion,
    createdAt: now,
    updatedAt: now,
  };
}

export function addPlayerToLobby(state: GameState, player: PlayerState) {
  if (state.players[player.uid]) {
    return state;
  }
  const now = new Date().toISOString();
  return {
    ...state,
    updatedAt: now,
    memberIds: [...state.memberIds, player.uid],
    memberNames: { ...state.memberNames, [player.uid]: player.name },
    players: { ...state.players, [player.uid]: player },
  };
}

export function initializeGame(state: GameState): GameState {
  const now = new Date().toISOString();
  const stacks = createStacks();
  const players = { ...state.players };

  Object.values(players).forEach((player) => {
    const drawResult = drawCards(stacks.cardDeck, stacks.cardDiscard, INITIAL_HAND_SIZE);
    stacks.cardDeck = drawResult.deck;
    stacks.cardDiscard = drawResult.discard;
    player.hand = [...drawResult.drawn];
  });

  const sorted = Object.values(players).sort((a, b) => a.seat - b.seat);
  const firstPlayer = sorted[0] ?? Object.values(players)[0];

  return {
    ...state,
    status: "running",
    phase: "play",
    snapshotVersion: 0,
    turn: {
      currentPlayerId: firstPlayer?.uid ?? state.turn.currentPlayerId,
      turnNumber: 1,
      spiritsActivated: [],
      tileActionUsed: false,
    },
    stacks,
    players,
    updatedAt: now,
  };
}
