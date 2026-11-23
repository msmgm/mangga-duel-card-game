import { CONFIG } from './config.js';

export function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function createDeck(rng) {
  const deck = [];
  let idCounter = 1;
  
  // 4 suits * values 1-9
  for (const suit of CONFIG.SUITS) {
    for (let v = 1; v <= 9; v++) {
      deck.push({
        id: idCounter++,
        suit: suit.name,
        value: v,
        color: suit.color,
        bg: suit.bg
      });
    }
  }

  // 2 Golden Mango cards worth 10
  for (let i = 0; i < 2; i++) {
    deck.push({
      id: idCounter++,
      suit: CONFIG.GOLDEN_SUIT.name,
      value: 10,
      color: CONFIG.GOLDEN_SUIT.color,
      bg: CONFIG.GOLDEN_SUIT.bg
    });
  }

  // Shuffle deck using Fisher-Yates with rng
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

export function initGame(seed = 1) {
  const rng = mulberry32(Number(seed) || 1);
  const deck = createDeck(rng);
  
  const playerHand = [];
  const aiHand = [];
  const discard = [];

  for (let i = 0; i < CONFIG.HAND_SIZE; i++) {
    if (deck.length > 0) playerHand.push(deck.pop());
    if (deck.length > 0) aiHand.push(deck.pop());
  }

  return {
    seed: Number(seed) || 1,
    rng,
    phase: 'title', // 'title', 'table', 'win', 'loss'
    playerHp: CONFIG.MAX_HP,
    aiHp: CONFIG.MAX_HP,
    deck,
    discard,
    playerHand,
    aiHand,
    round: 1,
    playedCard: null, // { playerCard, aiCard, winner: 'player'|'ai'|'tie', diff, message }
    animating: false,
    gameOver: false,
    selectedCardIndex: 0
  };
}

export function drawCard(state) {
  if (state.deck.length === 0) {
    if (state.discard.length === 0) return null;
    // Reshuffle discard into deck
    state.deck = [...state.discard];
    state.discard = [];
    for (let i = state.deck.length - 1; i > 0; i--) {
      const j = Math.floor(state.rng() * (i + 1));
      [state.deck[i], state.deck[j]] = [state.deck[j], state.deck[i]];
    }
  }
  return state.deck.length > 0 ? state.deck.pop() : null;
}

export function resolveRound(state, playerCardIndex) {
  if (state.animating || state.phase !== 'table') return;

  const playerCard = state.playerHand[playerCardIndex];
  if (!playerCard) return;

  // Remove card from player hand
  state.playerHand.splice(playerCardIndex, 1);

  return playerCard;
}

export function executeAiAndFinishRound(state, playerCard, aiCardIndex) {
  const aiCard = state.aiHand[aiCardIndex];
  state.aiHand.splice(aiCardIndex, 1);

  let winner = 'tie';
  let diff = 1;

  if (playerCard.value > aiCard.value) {
    winner = 'player';
    diff = Math.max(1, playerCard.value - aiCard.value);
    state.aiHp = Math.max(0, state.aiHp - diff);
  } else if (aiCard.value > playerCard.value) {
    winner = 'ai';
    diff = Math.max(1, aiCard.value - playerCard.value);
    state.playerHp = Math.max(0, state.playerHp - diff);
  } else {
    // Tie
    state.playerHp = Math.max(0, state.playerHp - 1);
    state.aiHp = Math.max(0, state.aiHp - 1);
  }

  state.playedCard = {
    playerCard,
    aiCard,
    winner,
    diff
  };

  state.discard.push(playerCard);
  state.discard.push(aiCard);

  // Refill hands to 5 cards
  while (state.playerHand.length < CONFIG.HAND_SIZE) {
    const c = drawCard(state);
    if (c) state.playerHand.push(c);
    else break;
  }
  while (state.aiHand.length < CONFIG.HAND_SIZE) {
    const c = drawCard(state);
    if (c) state.aiHand.push(c);
    else break;
  }

  state.round++;

  // Check win/loss
  if (state.playerHp <= 0 && state.aiHp <= 0) {
    state.phase = 'loss';
  } else if (state.playerHp <= 0) {
    state.phase = 'loss';
  } else if (state.aiHp <= 0) {
    state.phase = 'win';
  }
}
