import { initGame, resolveRound, executeAiAndFinishRound } from './state.js';
import { selectAiCardIndex } from './ai.js';
import { render } from './render.js';
import { runShotMode } from './shots.js';
import { CONFIG } from './config.js';

let audioCtx = null;
function playBeep(freq = 440, type = 'sine', duration = 0.1) {
  try {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (audioCtx) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    }
  } catch (e) {
    // Audio never breaks game
  }
}

const params = new URLSearchParams(window.location.search);
const seedParam = params.get('seed') || '1';
const shotParam = params.get('shot');

const state = initGame(seedParam);

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

if (shotParam) {
  runShotMode(state, shotParam);
  render(ctx, state);
  window.__shotReady = true;
} else {
  // Interactive mode
  render(ctx, state);
}

// Mouse interaction
canvas.addEventListener('click', (e) => {
  if (shotParam) return; // Ignore in shot mode

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (state.phase === 'title') {
    // Check MAIN button (center x, y 540-604, width 240)
    if (x >= CONFIG.WIDTH / 2 - 120 && x <= CONFIG.WIDTH / 2 + 120 && y >= 540 && y <= 604) {
      playBeep(523.25, 'sine', 0.15); // C5
      state.phase = 'table';
      render(ctx, state);
    }
  } else if (state.phase === 'table') {
    if (state.animating) return;

    if (state.playedCard) {
      // If result is showing, click anywhere or on screen to dismiss playedCard and continue
      state.playedCard = null;
      render(ctx, state);
      return;
    }

    // Check player hand clicks (5 cards, startX to startX + 5 * 130)
    const playerStartX = CONFIG.WIDTH / 2 - (state.playerHand.length * 130) / 2;
    for (let i = 0; i < state.playerHand.length; i++) {
      const cardX = playerStartX + i * 130;
      const cardY = 480;
      const cardW = 110;
      const cardH = 160;

      if (x >= cardX && x <= cardX + cardW && y >= cardY && y <= cardY + cardH) {
        playBeep(329.63, 'triangle', 0.1); // E4
        playCardAction(i);
        break;
      }
    }
  } else if (state.phase === 'win' || state.phase === 'loss') {
    // MAIN LAGI / COBA LAGI button
    if (x >= CONFIG.WIDTH / 2 - 140 && x <= CONFIG.WIDTH / 2 + 140 && y >= 440 && y <= 504) {
      playBeep(587.33, 'sine', 0.2); // D5
      Object.assign(state, initGame(state.seed + 1));
      state.phase = 'table';
      render(ctx, state);
    }
  }
});

// Keyboard interaction
window.addEventListener('keydown', (e) => {
  if (shotParam) return;

  if (state.phase === 'title') {
    if (e.key === 'Enter') {
      playBeep(523.25, 'sine', 0.15);
      state.phase = 'table';
      render(ctx, state);
    }
  } else if (state.phase === 'table') {
    if (state.animating) return;

    if (state.playedCard) {
      if (e.key === 'Enter' || e.key === ' ') {
        state.playedCard = null;
        render(ctx, state);
      }
      return;
    }

    // Number keys 1-5
    const num = parseInt(e.key, 10);
    if (num >= 1 && num <= 5) {
      const idx = num - 1;
      if (idx < state.playerHand.length) {
        playBeep(329.63, 'triangle', 0.1);
        playCardAction(idx);
      }
    }
  } else if (state.phase === 'win' || state.phase === 'loss') {
    if (e.key === 'Enter') {
      playBeep(587.33, 'sine', 0.2);
      Object.assign(state, initGame(state.seed + 1));
      state.phase = 'table';
      render(ctx, state);
    }
  }
});

function playCardAction(cardIndex) {
  state.animating = true;
  const playerCard = resolveRound(state, cardIndex);
  if (!playerCard) {
    state.animating = false;
    return;
  }

  // Render player card played immediately
  state.playedCard = {
    playerCard,
    aiCard: { value: '...', suit: '...', color: '#a0b0d0', bg: '#161e38' },
    winner: 'pending',
    diff: 0
  };
  render(ctx, state);

  // AI plays after ~600ms
  setTimeout(() => {
    const aiIdx = selectAiCardIndex(state.aiHand, playerCard);
    executeAiAndFinishRound(state, playerCard, aiIdx);
    state.animating = false;

    if (state.phase === 'win') {
      playBeep(659.25, 'sine', 0.3); // Win sound E5
    } else if (state.phase === 'loss') {
      playBeep(220, 'sawtooth', 0.3); // Loss sound A3
    } else {
      playBeep(440, 'sine', 0.15); // Normal round sound
    }

    render(ctx, state);
  }, 600);
}
