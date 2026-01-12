export interface GameState {
    doom: number; // 0-20
    omen: number; // 0: Green, 1: Blue, 2: Red, 3: Green
}

export const INITIAL_GAME_STATE: GameState = {
    doom: 20, // Default starting doom
    omen: 0
};

export function advanceOmen(currentState: GameState): GameState {
    const nextOmen = (currentState.omen + 1) % 4;
    return {
        ...currentState,
        omen: nextOmen
    };
}

export function advanceDoom(currentState: GameState, amount: number = 1): GameState {
    return {
        ...currentState,
        doom: Math.max(0, currentState.doom - amount)
    };
}
