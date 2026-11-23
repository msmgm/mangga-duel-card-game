import { CONFIG } from './config.js';

export function render(ctx, state) {
  // Clear canvas with dark background
  ctx.fillStyle = '#0d1220';
  ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

  // Background ambient glow
  const grad = ctx.createRadialGradient(640, 360, 100, 640, 360, 700);
  grad.addColorStop(0, 'rgba(46, 204, 113, 0.05)');
  grad.addColorStop(1, 'rgba(13, 18, 32, 1)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

  if (state.phase === 'title') {
    renderTitleScreen(ctx);
  } else if (state.phase === 'table') {
    renderTableScreen(ctx, state);
  } else if (state.phase === 'win') {
    renderWinScreen(ctx, state);
  } else if (state.phase === 'loss') {
    renderLossScreen(ctx, state);
  }
}

function renderTitleScreen(ctx) {
  // Title glow effect
  ctx.shadowColor = '#2ecc71';
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#f3b730';
  ctx.font = 'bold 72px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MANGGA DUEL', CONFIG.WIDTH / 2, 240);

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#e0e8ff';
  ctx.font = '24px system-ui, -apple-system, sans-serif';
  ctx.fillText('Duel kartu mangga strategis. Kalahkan lawan dan jadilah juara!', CONFIG.WIDTH / 2, 310);

  // How-to box
  ctx.fillStyle = '#161e38';
  ctx.strokeStyle = '#2a3860';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(CONFIG.WIDTH / 2 - 350, 360, 700, 140, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#a0b0d0';
  ctx.font = '16px system-ui, -apple-system, sans-serif';
  ctx.fillText('Cara Bermain: Klik kartu di tanganmu atau tekan tombol 1-5.', CONFIG.WIDTH / 2, 405);
  ctx.fillText('Nilai lebih tinggi memenangkan ronde dan mengurangi HP lawan.', CONFIG.WIDTH / 2, 435);
  ctx.fillText('Tekan Enter atau klik tombol untuk mulai.', CONFIG.WIDTH / 2, 465);

  // Main button
  ctx.shadowColor = '#2ecc71';
  ctx.shadowBlur = 15;
  ctx.fillStyle = '#2ecc71';
  ctx.beginPath();
  ctx.roundRect(CONFIG.WIDTH / 2 - 120, 540, 240, 64, 16);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#0d1220';
  ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
  ctx.fillText('MAIN', CONFIG.WIDTH / 2, 582);
}

function renderTableScreen(ctx, state) {
  // HUD: Opponent Info (Top)
  ctx.fillStyle = '#161e38';
  ctx.strokeStyle = '#2a3860';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(40, 20, CONFIG.WIDTH - 80, 80, 10);
  ctx.fill();
  ctx.stroke();

  // Opponent HP bar
  ctx.fillStyle = '#e0e8ff';
  ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Lawan (AI)', 70, 65);

  drawHpBar(ctx, 220, 47, 250, 24, state.aiHp, CONFIG.MAX_HP, '#e74c3c');

  // Round & Deck info
  ctx.textAlign = 'center';
  ctx.fillStyle = '#a0b0d0';
  ctx.font = '16px system-ui, -apple-system, sans-serif';
  ctx.fillText(`Ronde: ${state.round}`, CONFIG.WIDTH / 2, 65);
  ctx.fillText(`Deck: ${state.deck.length} | Discard: ${state.discard.length}`, CONFIG.WIDTH - 200, 65);

  // Opponent Hand (Face down cards)
  const oppStartX = CONFIG.WIDTH / 2 - (state.aiHand.length * 90) / 2;
  for (let i = 0; i < state.aiHand.length; i++) {
    drawCardBack(ctx, oppStartX + i * 90, 120, 80, 110);
  }

  // Centre Arena: Played cards comparison area
  ctx.fillStyle = '#161e38';
  ctx.strokeStyle = '#2a3860';
  ctx.beginPath();
  ctx.roundRect(CONFIG.WIDTH / 2 - 280, 255, 560, 200, 14);
  ctx.fill();
  ctx.stroke();

  if (state.playedCard) {
    // Show played cards side by side
    drawCardFace(ctx, CONFIG.WIDTH / 2 - 200, 275, 110, 160, state.playedCard.aiCard, 'Lawan');
    drawCardFace(ctx, CONFIG.WIDTH / 2 + 90, 275, 110, 160, state.playedCard.playerCard, 'Kamu');

    // VS or result
    ctx.fillStyle = '#f3b730';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    let resText = 'SERI (-1 HP)';
    if (state.playedCard.winner === 'player') resText = `KAMU MENANG (-${state.playedCard.diff} HP)`;
    else if (state.playedCard.winner === 'ai') resText = `LAWAN MENANG (-${state.playedCard.diff} HP)`;
    ctx.fillText(resText, CONFIG.WIDTH / 2, 355);

    ctx.fillStyle = '#a0b0d0';
    ctx.font = '14px system-ui, -apple-system, sans-serif';
    ctx.fillText('Klik kartu di bawah untuk ronde berikutnya', CONFIG.WIDTH / 2, 435);
  } else {
    ctx.fillStyle = '#a0b0d0';
    ctx.font = '18px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Pilih kartu dari tanganmu di bawah untuk bertarung!', CONFIG.WIDTH / 2, 355);
  }

  // Player Hand (Bottom)
  const playerStartX = CONFIG.WIDTH / 2 - (state.playerHand.length * 130) / 2;
  for (let i = 0; i < state.playerHand.length; i++) {
    const card = state.playerHand[i];
    const isHovered = i === state.selectedCardIndex;
    drawCardFace(ctx, playerStartX + i * 130, 480, 110, 160, card, `[${i + 1}]`, isHovered);
  }

  // Player HP bar (Bottom HUD)
  ctx.fillStyle = '#161e38';
  ctx.strokeStyle = '#2a3860';
  ctx.beginPath();
  ctx.roundRect(40, 655, CONFIG.WIDTH - 80, 50, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#e0e8ff';
  ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Pemain (Kamu)', 70, 685);

  drawHpBar(ctx, 220, 668, 250, 24, state.playerHp, CONFIG.MAX_HP, '#2ecc71');
  
  ctx.textAlign = 'right';
  ctx.fillStyle = '#f3b730';
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.fillText('Gunakan Tombol 1-5 atau Klik Kartu', CONFIG.WIDTH - 70, 685);
}

function renderWinScreen(ctx, state) {
  ctx.fillStyle = '#161e38';
  ctx.strokeStyle = '#2ecc71';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(CONFIG.WIDTH / 2 - 350, 160, 700, 400, 20);
  ctx.fill();
  ctx.stroke();

  ctx.shadowColor = '#2ecc71';
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#2ecc71';
  ctx.font = 'bold 54px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('KAMU MENANG!', CONFIG.WIDTH / 2, 260);

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#e0e8ff';
  ctx.font = '22px system-ui, -apple-system, sans-serif';
  ctx.fillText(`Sisa HP Kamu: ${state.playerHp} / ${CONFIG.MAX_HP}`, CONFIG.WIDTH / 2, 330);
  ctx.fillText(`Ronde Dimainkan: ${state.round - 1}`, CONFIG.WIDTH / 2, 370);

  // MAIN LAGI Button
  ctx.shadowColor = '#2ecc71';
  ctx.shadowBlur = 15;
  ctx.fillStyle = '#2ecc71';
  ctx.beginPath();
  ctx.roundRect(CONFIG.WIDTH / 2 - 140, 440, 280, 64, 16);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#0d1220';
  ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
  ctx.fillText('MAIN LAGI', CONFIG.WIDTH / 2, 482);
}

function renderLossScreen(ctx, state) {
  ctx.fillStyle = '#161e38';
  ctx.strokeStyle = '#e74c3c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(CONFIG.WIDTH / 2 - 350, 160, 700, 400, 20);
  ctx.fill();
  ctx.stroke();

  ctx.shadowColor = '#e74c3c';
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#e74c3c';
  ctx.font = 'bold 54px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('KAMU KALAH', CONFIG.WIDTH / 2, 260);

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#e0e8ff';
  ctx.font = '22px system-ui, -apple-system, sans-serif';
  ctx.fillText(`Sisa HP Lawan: ${state.aiHp} / ${CONFIG.MAX_HP}`, CONFIG.WIDTH / 2, 330);
  ctx.fillText(`Ronde Dimainkan: ${state.round - 1}`, CONFIG.WIDTH / 2, 370);

  // COBA LAGI Button
  ctx.shadowColor = '#e74c3c';
  ctx.shadowBlur = 15;
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.roundRect(CONFIG.WIDTH / 2 - 140, 440, 280, 64, 16);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#0d1220';
  ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
  ctx.fillText('COBA LAGI', CONFIG.WIDTH / 2, 482);
}

function drawHpBar(ctx, x, y, w, h, current, max, color) {
  ctx.fillStyle = '#0d1220';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();

  const fillW = Math.max(0, (current / max) * w);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, fillW, h, h / 2);
  ctx.fill();

  ctx.fillStyle = '#e0e8ff';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${current} / ${max}`, x + w / 2, y + h - 7);
}

function drawCardBack(ctx, x, y, w, h) {
  ctx.fillStyle = '#1e294b';
  ctx.strokeStyle = '#3b4c7c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#2a3860';
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('M', x + w / 2, y + h / 2 + 7);
}

function drawCardFace(ctx, x, y, w, h, card, label = '', isHovered = false) {
  if (isHovered) {
    ctx.shadowColor = card.color;
    ctx.shadowBlur = 15;
    y -= 10; // Lift card on hover
  }

  // Card background
  ctx.fillStyle = card.bg || '#1a233a';
  ctx.strokeStyle = card.color || '#f3b730';
  ctx.lineWidth = isHovered ? 3 : 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;

  // Inner border accent
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x + 6, y + 6, w - 12, h - 12, 6);
  ctx.stroke();

  // Top-left value & suit initial
  ctx.fillStyle = card.color;
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(card.value, x + 12, y + 24);

  // Center big value
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(card.value, x + w / 2, y + h / 2 + 10);

  // Bottom suit name
  ctx.fillStyle = card.color;
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(card.suit.toUpperCase(), x + w / 2, y + h - 16);

  // Optional label (e.g. [1] or role)
  if (label) {
    ctx.fillStyle = '#a0b0d0';
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y - 8);
  }
}
