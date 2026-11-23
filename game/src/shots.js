import { selectAiCardIndex, selectPlayerAutopilotCardIndex } from './ai.js';
import { resolveRound, executeAiAndFinishRound, initGame } from './state.js';

export function runShotMode(state, shotName) {
  if (!shotName) return false;

  if (shotName === 'title') {
    state.phase = 'title';
  } else if (shotName === 'table') {
    let currentSeed = Number(state.seed) || 1;
    let currentState = state;
    let valid = false;
    let safety = 20;

    while (!valid && safety > 0) {
      safety--;
      currentState = initGame(currentSeed);
      currentState.phase = 'table';
      let ended = false;

      for (let i = 0; i < 3; i++) {
        if (currentState.playerHp <= 0 || currentState.aiHp <= 0) {
          ended = true;
          break;
        }
        const pIdx = selectPlayerAutopilotCardIndex(currentState.playerHand, 'best');
        const pCard = resolveRound(currentState, pIdx);
        if (!pCard) {
          ended = true;
          break;
        }
        const aiIdx = selectAiCardIndex(currentState.aiHand, pCard);
        executeAiAndFinishRound(currentState, pCard, aiIdx);
      }

      if (!ended && currentState.playerHp > 0 && currentState.aiHp > 0) {
        valid = true;
      } else {
        currentSeed++;
      }
    }

    Object.assign(state, currentState);
    state.phase = 'table';
  } else if (shotName === 'win') {
    // Play until player wins
    let safety = 30;
    state.phase = 'table';
    while (state.aiHp > 0 && safety > 0) {
      safety--;
      const pIdx = selectPlayerAutopilotCardIndex(state.playerHand, 'best');
      const pCard = resolveRound(state, pIdx);
      if (!pCard) break;
      const aiIdx = selectAiCardIndex(state.aiHand, pCard);
      executeAiAndFinishRound(state, pCard, aiIdx);
    }
    state.phase = 'win';
  } else if (shotName === 'loss') {
    // Play until player loses
    let safety = 30;
    state.phase = 'table';
    while (state.playerHp > 0 && safety > 0) {
      safety--;
      const pIdx = selectPlayerAutopilotCardIndex(state.playerHand, 'worst');
      const pCard = resolveRound(state, pIdx);
      if (!pCard) break;
      const aiIdx = selectAiCardIndex(state.aiHand, pCard);
      executeAiAndFinishRound(state, pCard, aiIdx);
    }
    state.phase = 'loss';
  }

  return true;
}
