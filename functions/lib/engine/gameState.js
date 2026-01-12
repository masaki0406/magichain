"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.advanceDoom = exports.advanceOmen = exports.INITIAL_GAME_STATE = void 0;
exports.INITIAL_GAME_STATE = {
    doom: 20,
    omen: 0
};
function advanceOmen(currentState) {
    const nextOmen = (currentState.omen + 1) % 4;
    return Object.assign(Object.assign({}, currentState), { omen: nextOmen });
}
exports.advanceOmen = advanceOmen;
function advanceDoom(currentState, amount = 1) {
    return Object.assign(Object.assign({}, currentState), { doom: Math.max(0, currentState.doom - amount) });
}
exports.advanceDoom = advanceDoom;
//# sourceMappingURL=gameState.js.map