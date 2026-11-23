export function selectAiCardIndex(aiHand, playerCard = null) {
  if (!aiHand || aiHand.length === 0) return 0;

  if (playerCard) {
    // Find cards that beat playerCard
    let winningIndices = [];
    for (let i = 0; i < aiHand.length; i++) {
      if (aiHand[i].value > playerCard.value) {
        winningIndices.push(i);
      }
    }

    if (winningIndices.length > 0) {
      // Pick the lowest winning card (minimum value among winning cards)
      let bestIdx = winningIndices[0];
      let lowestVal = aiHand[bestIdx].value;
      for (const idx of winningIndices) {
        if (aiHand[idx].value < lowestVal) {
          lowestVal = aiHand[idx].value;
          bestIdx = idx;
        }
      }
      return bestIdx;
    }
  }

  // Fallback: pick the lowest card in hand
  let lowestIdx = 0;
  let lowestVal = aiHand[0].value;
  for (let i = 1; i < aiHand.length; i++) {
    if (aiHand[i].value < lowestVal) {
      lowestVal = aiHand[i].value;
      lowestIdx = i;
    }
  }
  return lowestIdx;
}

export function selectPlayerAutopilotCardIndex(playerHand, goal = 'best') {
  if (!playerHand || playerHand.length === 0) return 0;
  let targetIdx = 0;
  let targetVal = playerHand[0].value;

  for (let i = 1; i < playerHand.length; i++) {
    if (goal === 'best' && playerHand[i].value > targetVal) {
      targetVal = playerHand[i].value;
      targetIdx = i;
    } else if (goal === 'worst' && playerHand[i].value < targetVal) {
      targetVal = playerHand[i].value;
      targetIdx = i;
    }
  }
  return targetIdx;
}
