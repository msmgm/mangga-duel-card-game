import { selectAiCardIndex, selectPlayerAutopilotCardIndex } from './ai.js';
import { resolveRound, executeAiAndFinishRound } from './state.js';

export function runShotMode(state, shotName) {
  if (!shotName) return false;

  if (shotName === 'title') {
    state.phase = 'title';
  } else if (shotName === 'table') {
    state.phase = 'table';
    // Play ~6 rounds so HP has changed and both hands are visible
    for (let i = 0; i < 6; i++) {
      if (state.playerHp <= 0 || state.aiHp <= 0) break;
      const pIdx = selectPlayerAutopilotCardIndex(state.playerHand, 'best');
      const pCard = resolveRound(state, pIdx);
      if (!pCard) break;
      const aiIdx = selectAiCardIndex(state.aiHand, pCard);
      executeAiAndFinishRound(state, pCard, aiIdx);
    }
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
