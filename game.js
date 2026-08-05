const FLOWERS = [
  { value: 2, name: '花种', bg: '#eee3c8', ink: '#755a39', kind: 'seed', colors: ['#9b7045', '#6f4d2d'] },
  { value: 4, name: '新芽', bg: '#d8ebcb', ink: '#416b3a', kind: 'sprout', colors: ['#70ad61', '#388152'] },
  { value: 8, name: '雏菊', bg: '#fff0b5', ink: '#8c6721', kind: 'daisy', colors: ['#fffdf0', '#f3b933'] },
  { value: 16, name: '郁金香', bg: '#fad0d8', ink: '#8d4a50', kind: 'tulip', colors: ['#ef6f7c', '#c94b63'] },
  { value: 32, name: '薰衣草', bg: '#e2d7f1', ink: '#665182', kind: 'lavender', colors: ['#997bc8', '#7155a3'] },
  { value: 64, name: '向日葵', bg: '#f8dca0', ink: '#805928', kind: 'sunflower', colors: ['#f7bd36', '#86502f'] },
  { value: 128, name: '玫瑰', bg: '#f6c8d2', ink: '#8d3d52', kind: 'rose', colors: ['#e95576', '#b83354'] },
  { value: 256, name: '荷花', bg: '#d6ece7', ink: '#3e7473', kind: 'lotus', colors: ['#f59daf', '#e7678b'] },
  { value: 512, name: '山茶花', bg: '#f6d0be', ink: '#914d3a', kind: 'camellia', colors: ['#ee7963', '#c64543'] },
  { value: 1024, name: '绣球花', bg: '#d7e1f2', ink: '#486d8d', kind: 'hydrangea', colors: ['#6fa2d7', '#597cbc'] },
  { value: 2048, name: '牡丹', bg: '#eed0e2', ink: '#773e68', kind: 'peony', colors: ['#de71ab', '#b74f91'] }
];

const gridEl = document.querySelector('#grid');
const tilesEl = document.querySelector('#tiles');
const petalsEl = document.querySelector('#petals');
const scoreEl = document.querySelector('#score');
const bestEl = document.querySelector('#best');
const scoreAddEl = document.querySelector('#score-add');
const collectionEl = document.querySelector('#collection');
const collectionCountEl = document.querySelector('#collection-count');
const boardEl = document.querySelector('#board');
const undoBtn = document.querySelector('#undo-btn');
const newBtn = document.querySelector('#new-btn');
const soundBtn = document.querySelector('#sound-btn');
const toolShelfEl = document.querySelector('#tool-shelf');
const toolStatusEl = document.querySelector('#tool-status');
const modalEl = document.querySelector('#modal');
const modalFlowerEl = document.querySelector('#modal-flower');
const modalKickerEl = document.querySelector('#modal-kicker');
const modalTitleEl = document.querySelector('#modal-title');
const modalMessageEl = document.querySelector('#modal-message');
const continueBtn = document.querySelector('#continue-btn');
const restartBtn = document.querySelector('#restart-btn');
const catalogBtn = document.querySelector('#catalog-btn');
const catalogModalEl = document.querySelector('#catalog-modal');
const catalogBackdropEl = document.querySelector('#catalog-backdrop');
const catalogCloseBtn = document.querySelector('#catalog-close');
const catalogGridEl = document.querySelector('#catalog-grid');

let board = Array(16).fill(0);
let score = 0;
let best = Number(localStorage.getItem('flower2048-best') || 0);
let discovered = new Set([2]);
let previous = null;
let won = false;
let keepPlaying = false;
let soundEnabled = localStorage.getItem('flower2048-sound') !== 'off';
let toolCounts = { remove: 10, upgrade: 10, swap: 10 };
let activeTool = null;
let selectedIndex = null;
let toolStatusTimer = null;
let toolPointerStart = null;
let touchStart = null;
let audioContext = null;
let musicTimer = null;
let musicStep = 0;

const MUSIC_NOTES = [
  523.25, 659.25, 783.99, 659.25,
  587.33, 698.46, 880.00, 698.46,
  523.25, 659.25, 783.99, 987.77,
  880.00, 783.99, 698.46, 659.25
];

for (let i = 0; i < 16; i += 1) {
  const cell = document.createElement('span');
  cell.className = 'grid-cell';
  gridEl.appendChild(cell);
}

function flowerFor(value) {
  return FLOWERS.find((flower) => flower.value === value) || FLOWERS.at(-1);
}

function petals(count, radius, color, inner = '#f4c64f', offset = 0) {
  const items = Array.from({ length: count }, (_, i) => {
    const angle = (360 / count) * i + offset;
    return `<ellipse cx="50" cy="${50 - radius}" rx="${Math.max(8, 19 - count / 2)}" ry="${Math.max(16, radius * .7)}" fill="${color}" transform="rotate(${angle} 50 50)"/>`;
  }).join('');
  return `${items}<circle cx="50" cy="50" r="${count > 9 ? 15 : 12}" fill="${inner}"/>`;
}

function flowerSvg(flower) {
  const [a, b] = flower.colors;
  const stem = `<path d="M50 78 C49 68 50 58 50 48" fill="none" stroke="#3d8752" stroke-width="5" stroke-linecap="round"/><path d="M48 67c-13-10-19 0-13 7 5 5 11 1 13-1" fill="#65a85b"/><path d="M52 62c11-10 18-2 13 5-4 5-10 2-13 0" fill="#79b969"/>`;
  let art = '';

  if (flower.kind === 'seed') art = `<path d="M31 62c2-17 18-28 37-25 2 21-9 34-27 35-8 0-12-4-10-10Z" fill="${a}"/><path d="M39 64c9-11 16-17 27-23" fill="none" stroke="${b}" stroke-width="3" stroke-linecap="round"/><path d="M51 48c-4-9 0-16 8-18 5 8 1 14-5 18" fill="#69a966"/>`;
  if (flower.kind === 'sprout') art = `<path d="M50 79c-1-24 1-38 4-51" fill="none" stroke="${b}" stroke-width="6" stroke-linecap="round"/><path d="M51 49C31 48 22 37 25 25c17-2 29 7 29 23" fill="${a}"/><path d="M52 60c16 0 24-9 23-20-15-2-24 6-24 19" fill="#8dca6d"/>`;
  if (flower.kind === 'daisy') art = stem + petals(10, 23, a, b, 18);
  if (flower.kind === 'tulip') art = `${stem}<path d="M27 23c8 3 14 8 23 20 9-12 15-17 23-20 1 28-7 39-23 39S26 51 27 23Z" fill="${a}"/><path d="M50 43c-4-8-8-14-15-19 1 19 5 30 15 36 10-6 14-17 15-36-7 5-11 11-15 19Z" fill="${b}" opacity=".7"/>`;
  if (flower.kind === 'lavender') art = `<path d="M50 84V24" stroke="#408057" stroke-width="5" stroke-linecap="round"/><g fill="${a}"><ellipse cx="39" cy="58" rx="8" ry="5" transform="rotate(30 39 58)"/><ellipse cx="60" cy="51" rx="8" ry="5" transform="rotate(-30 60 51)"/><ellipse cx="41" cy="43" rx="8" ry="5" transform="rotate(30 41 43)"/><ellipse cx="58" cy="36" rx="8" ry="5" transform="rotate(-30 58 36)"/><ellipse cx="46" cy="27" rx="7" ry="5" transform="rotate(25 46 27)"/></g><g fill="${b}"><circle cx="50" cy="19" r="7"/><circle cx="51" cy="48" r="5"/><circle cx="49" cy="34" r="5"/></g>`;
  if (flower.kind === 'sunflower') art = stem + petals(12, 24, a, b, 15).replace('<circle cx="50" cy="50" r="15"', '<circle cx="50" cy="50" r="17"');
  if (flower.kind === 'rose') art = `${stem}<g transform="translate(50 48)"><circle r="28" fill="${a}"/><path d="M-21-5c6-17 29-20 37-6 9 14-2 32-17 32-14 0-23-12-18-23 4-10 20-13 27-5 6 7 0 18-8 18-6 0-10-5-7-10 2-4 8-4 11-1" fill="none" stroke="${b}" stroke-width="7" stroke-linecap="round"/></g>`;
  if (flower.kind === 'lotus') art = `<path d="M22 75h56" stroke="#59a28b" stroke-width="5" stroke-linecap="round"/><path d="M50 67C24 63 18 48 19 34c13 2 23 9 31 26 8-17 18-24 31-26 1 14-5 29-31 33Z" fill="${a}"/><path d="M50 64c-15-17-14-34 0-47 14 13 15 30 0 47Z" fill="#ffc6cf"/><path d="M50 65c-9-13-7-25 0-36 8 11 10 23 0 36Z" fill="${b}"/>`;
  if (flower.kind === 'camellia') art = stem + `<g>${petals(7, 21, a, '#f6c85a', 10)}<circle cx="50" cy="50" r="20" fill="none" stroke="${b}" stroke-width="8" stroke-dasharray="20 8"/></g>`;
  if (flower.kind === 'hydrangea') {
    const blooms = [[32,34],[49,27],[65,37],[27,51],[46,48],[65,54],[38,65],[57,68]];
    art = stem + blooms.map(([x,y], i) => `<g transform="translate(${x} ${y}) translate(-16 -16) scale(.32)">${petals(5, 19, i % 2 ? a : b, '#f6dd91', 0)}</g>`).join('');
  }
  if (flower.kind === 'peony') art = `${stem}<g>${petals(10, 25, a, '#f5bd68', 12)}<g transform="translate(50 50) scale(.72) translate(-50 -50)">${petals(8, 23, '#f09ac5', '#f7c95e', 0)}</g><g transform="translate(50 50) scale(.42) translate(-50 -50)">${petals(7, 20, b, '#ffd572', 8)}</g></g>`;

  return `<svg viewBox="0 0 100 100" aria-hidden="true">${art}</svg>`;
}

function render({ animateTiles = true } = {}) {
  tilesEl.innerHTML = '';
  let highest = 2;
  board.forEach((value, index) => {
    if (!value) return;
    highest = Math.max(highest, value);
    discovered.add(value);
    const flower = flowerFor(value);
    const tile = document.createElement('div');
    tile.className = `tile${value === window.lastMergedValue ? ' merged' : ''}${activeTool ? ' tool-target' : ''}${selectedIndex === index ? ' selected' : ''}${animateTiles ? '' : ' no-animate'}`;
    tile.style.setProperty('--row', Math.floor(index / 4));
    tile.style.setProperty('--col', index % 4);
    tile.style.setProperty('--tile-bg', flower.bg);
    tile.style.setProperty('--tile-ink', flower.ink);
    tile.dataset.index = index;
    tile.setAttribute('aria-label', flower.name);
    tile.innerHTML = `<div class="flower-art">${flowerSvg(flower)}</div><span class="tile-name">${flower.name}</span>`;
    tilesEl.appendChild(tile);
  });

  scoreEl.textContent = score;
  best = Math.max(best, score);
  bestEl.textContent = best;
  localStorage.setItem('flower2048-best', best);
  undoBtn.disabled = !previous;
  renderCollection(highest);
  soundBtn.classList.toggle('sound-muted', !soundEnabled);
  soundBtn.setAttribute('aria-label', soundEnabled ? '关闭音效与音乐' : '开启音效与音乐');
  soundBtn.title = soundEnabled ? '关闭音效与音乐' : '开启音效与音乐';
  toolShelfEl.querySelectorAll('.power-btn').forEach((button) => {
    const tool = button.dataset.tool;
    const count = toolCounts[tool];
    button.classList.toggle('active', activeTool === tool);
    button.disabled = count <= 0;
    button.setAttribute('aria-pressed', String(activeTool === tool));
    button.setAttribute('aria-label', `${button.querySelector('span').textContent}道具，剩余 ${count} 次`);
    button.title = tool === 'remove' ? '铲除一张花朵' : tool === 'upgrade' ? '将一张花朵变为高级花朵' : '交换两张花朵的位置';
    button.querySelector(`[data-tool-count="${tool}"]`).textContent = count;
  });
  const activeStatus = activeTool === 'remove'
    ? '点击一张花朵卡片'
    : activeTool === 'upgrade'
      ? '点击一张花朵卡片'
      : activeTool === 'swap' && selectedIndex === null
        ? '点击第一张花朵卡片'
        : activeTool === 'swap'
          ? '再点击第二张花朵卡片'
          : '';
  toolStatusEl.textContent = activeStatus;
  toolStatusEl.classList.toggle('visible', Boolean(activeStatus));
  toolStatusEl.classList.remove('result');
  window.lastMergedValue = 0;
}

function showToolResult(message) {
  window.clearTimeout(toolStatusTimer);
  toolStatusEl.textContent = message;
  toolStatusEl.classList.add('visible', 'result');
  toolStatusTimer = window.setTimeout(() => {
    toolStatusEl.textContent = '';
    toolStatusEl.classList.remove('visible', 'result');
  }, 1400);
}

function renderCollection(highest) {
  collectionEl.innerHTML = FLOWERS.map((flower) => {
    const unlocked = discovered.has(flower.value) || flower.value <= highest;
    return `<div class="collect-item ${unlocked ? '' : 'locked'} ${flower.value === highest ? 'current' : ''}" style="--flower-bg:${flower.bg}" title="${unlocked ? flower.name : '尚未解锁'}">
      <div class="collect-art">${unlocked ? flowerSvg(flower) : '<svg viewBox="0 0 100 100"><path d="M50 79V42" stroke="#829084" stroke-width="7" stroke-linecap="round"/><circle cx="50" cy="34" r="24" fill="#aeb8af"/><text x="50" y="44" text-anchor="middle" fill="#f1f1ea" font-size="30" font-weight="900">?</text></svg>'}</div>
      <span>${unlocked ? flower.name : '待发现'}</span>
    </div>`;
  }).join('');
  const unlockedCount = FLOWERS.filter((flower) => discovered.has(flower.value) || flower.value <= highest).length;
  collectionCountEl.textContent = `${unlockedCount} / ${FLOWERS.length}`;
}

function renderCatalog() {
  catalogGridEl.innerHTML = FLOWERS.map((flower, index) => `<article class="catalog-item" style="--flower-bg:${flower.bg}">
    <div class="catalog-art">${flowerSvg(flower)}</div>
    <div><strong>${flower.name}</strong><small>成长阶段 ${index + 1}</small></div>
  </article>`).join('');
}

function openCatalog() {
  renderCatalog();
  catalogModalEl.hidden = false;
  catalogCloseBtn.focus();
}

function closeCatalog() {
  catalogModalEl.hidden = true;
  boardEl.focus();
}

function emptyCells() {
  return board.map((value, index) => value === 0 ? index : -1).filter((index) => index >= 0);
}

function addFlower() {
  const empties = emptyCells();
  if (!empties.length) return;
  const target = empties[Math.floor(Math.random() * empties.length)];
  board[target] = Math.random() < .9 ? 2 : 4;
}

function getLines(direction) {
  const lines = [];
  for (let outer = 0; outer < 4; outer += 1) {
    const line = [];
    for (let inner = 0; inner < 4; inner += 1) {
      let row = outer;
      let col = inner;
      if (direction === 'right') col = 3 - inner;
      if (direction === 'up') { row = inner; col = outer; }
      if (direction === 'down') { row = 3 - inner; col = outer; }
      line.push(row * 4 + col);
    }
    lines.push(line);
  }
  return lines;
}

function move(direction) {
  if (!modalEl.hidden) return;
  startMusic();
  const before = [...board];
  const scoreBefore = score;
  let gained = 0;
  let biggestMerge = 0;

  getLines(direction).forEach((line) => {
    const values = line.map((index) => board[index]).filter(Boolean);
    const merged = [];
    for (let i = 0; i < values.length; i += 1) {
      if (values[i] === values[i + 1]) {
        const next = values[i] * 2;
        merged.push(next);
        gained += next;
        biggestMerge = Math.max(biggestMerge, next);
        i += 1;
      } else {
        merged.push(values[i]);
      }
    }
    while (merged.length < 4) merged.push(0);
    line.forEach((index, i) => { board[index] = merged[i]; });
  });

  if (board.every((value, index) => value === before[index])) return;
  previous = { board: before, score: scoreBefore, discovered: [...discovered], toolCounts: { ...toolCounts } };
  score += gained;
  addFlower();
  window.lastMergedValue = biggestMerge;
  render();
  saveGame();

  if (gained) {
    showScoreGain(gained);
    burstPetals(biggestMerge);
    playTone(biggestMerge);
  } else {
    playTone(0);
  }

  if (!won && board.includes(2048)) {
    won = true;
    setTimeout(() => showModal('win'), 330);
  } else if (!canMove()) {
    setTimeout(() => showModal('lose'), 330);
  }
}

function canMove() {
  if (board.includes(0)) return true;
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const i = row * 4 + col;
      if (col < 3 && board[i] === board[i + 1]) return true;
      if (row < 3 && board[i] === board[i + 4]) return true;
    }
  }
  return false;
}

function showScoreGain(amount) {
  scoreAddEl.textContent = `+${amount}`;
  scoreAddEl.classList.remove('show');
  void scoreAddEl.offsetWidth;
  scoreAddEl.classList.add('show');
}

function burstPetals(value) {
  const index = board.indexOf(value);
  if (index < 0) return;
  const col = index % 4;
  const row = Math.floor(index / 4);
  const x = (col + .5) * 25;
  const y = (row + .5) * 25;
  const flower = flowerFor(value);
  for (let i = 0; i < 10; i += 1) {
    const petal = document.createElement('span');
    const angle = (Math.PI * 2 * i) / 10;
    const distance = 35 + Math.random() * 38;
    petal.className = 'petal';
    petal.style.left = `${x}%`;
    petal.style.top = `${y}%`;
    petal.style.setProperty('--petal', i % 2 ? flower.colors[0] : flower.colors[1]);
    petal.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    petal.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
    petal.style.setProperty('--spin', `${180 + Math.random() * 360}deg`);
    petalsEl.appendChild(petal);
    petal.addEventListener('animationend', () => petal.remove());
  }
}

function ensureAudio() {
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

function playTone(value) {
  if (!soundEnabled) return;
  try {
    ensureAudio();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = value ? 360 + Math.min(Math.log2(value), 11) * 35 : 250;
    gain.gain.setValueAtTime(.045, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + .13);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + .14);
  } catch (_) {
    soundEnabled = false;
  }
}

function scheduleMusicNote() {
  if (!soundEnabled || !audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const note = MUSIC_NOTES[musicStep % MUSIC_NOTES.length];
  const now = audioContext.currentTime;
  oscillator.type = musicStep % 4 === 3 ? 'sine' : 'triangle';
  oscillator.frequency.setValueAtTime(note, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.026, now + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.27);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.3);
  musicStep += 1;
}

function startMusic() {
  if (!soundEnabled || musicTimer) return;
  try {
    ensureAudio();
    scheduleMusicNote();
    musicTimer = window.setInterval(scheduleMusicNote, 300);
  } catch (_) {
    soundEnabled = false;
  }
}

function stopMusic() {
  if (musicTimer) window.clearInterval(musicTimer);
  musicTimer = null;
}

function showModal(type) {
  const win = type === 'win';
  const flower = flowerFor(win ? 2048 : Math.max(...board));
  modalKickerEl.textContent = win ? '花园盛放' : '本季收成';
  modalTitleEl.textContent = win ? '牡丹开花啦！' : '花园种满啦';
  modalMessageEl.textContent = win ? '你培育出了花园里最灿烂的花朵。' : `最终得分 ${score}，最高培育到${flower.name}。`;
  modalFlowerEl.innerHTML = flowerSvg(flower);
  continueBtn.hidden = !win;
  modalEl.hidden = false;
  restartBtn.focus();
}

function hideModal() {
  modalEl.hidden = true;
  boardEl.focus();
}

function saveGame() {
  localStorage.setItem('flower2048-save', JSON.stringify({ board, score, discovered: [...discovered], won, keepPlaying, toolCounts }));
}

function loadGame() {
  try {
    const saved = JSON.parse(localStorage.getItem('flower2048-save'));
    if (saved && Array.isArray(saved.board) && saved.board.length === 16 && saved.board.some(Boolean)) {
      board = saved.board;
      score = Number(saved.score) || 0;
      discovered = new Set(saved.discovered || [2]);
      won = Boolean(saved.won);
      keepPlaying = Boolean(saved.keepPlaying);
      toolCounts = { remove: 10, upgrade: 10, swap: 10, ...(saved.toolCounts || {}) };
      return true;
    }
  } catch (_) { /* Ignore invalid local saves. */ }
  return false;
}

function newGame() {
  board = Array(16).fill(0);
  score = 0;
  previous = null;
  discovered = new Set([2]);
  won = false;
  keepPlaying = false;
  toolCounts = { remove: 10, upgrade: 10, swap: 10 };
  activeTool = null;
  selectedIndex = null;
  addFlower();
  addFlower();
  hideModal();
  render();
  saveGame();
}

function undo() {
  if (!previous) return;
  board = previous.board;
  score = previous.score;
  discovered = new Set(previous.discovered);
  toolCounts = { ...previous.toolCounts };
  activeTool = null;
  selectedIndex = null;
  previous = null;
  render({ animateTiles: false });
  saveGame();
}

const keyDirections = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
document.addEventListener('keydown', (event) => {
  if (keyDirections[event.key]) {
    event.preventDefault();
    move(keyDirections[event.key]);
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    undo();
  }
  if (event.key === 'Escape' && !modalEl.hidden) hideModal();
  if (event.key === 'Escape' && !catalogModalEl.hidden) closeCatalog();
});

boardEl.addEventListener('pointerdown', (event) => {
  touchStart = { x: event.clientX, y: event.clientY, pointerId: event.pointerId, captured: false };
});

boardEl.addEventListener('pointermove', (event) => {
  if (!touchStart || touchStart.captured) return;
  const dx = event.clientX - touchStart.x;
  const dy = event.clientY - touchStart.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) > 12) {
    boardEl.setPointerCapture(event.pointerId);
    touchStart.captured = true;
  }
});

boardEl.addEventListener('pointerup', (event) => {
  if (!touchStart) return;
  const dx = event.clientX - touchStart.x;
  const dy = event.clientY - touchStart.y;
  if (touchStart.captured && boardEl.hasPointerCapture(event.pointerId)) {
    boardEl.releasePointerCapture(event.pointerId);
  }
  touchStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
  else move(dy > 0 ? 'down' : 'up');
});

boardEl.addEventListener('pointercancel', () => {
  touchStart = null;
});

toolShelfEl.addEventListener('click', (event) => {
  const button = event.target.closest('.power-btn');
  if (!button || button.disabled) return;
  const tool = button.dataset.tool;
  activeTool = activeTool === tool ? null : tool;
  selectedIndex = null;
  toolPointerStart = null;
  render({ animateTiles: false });
});

function useToolOnTile(index) {
  if (!activeTool) return;
  if (!Number.isInteger(index) || !board[index]) return;

  if (activeTool === 'swap' && selectedIndex === null) {
    selectedIndex = index;
    render({ animateTiles: false });
    return;
  }

  previous = { board: [...board], score, discovered: [...discovered], toolCounts: { ...toolCounts } };
  const sourceFlower = flowerFor(board[index]);
  if (activeTool === 'remove') {
    board[index] = 0;
    if (!board.some(Boolean)) addFlower();
  } else if (activeTool === 'upgrade') {
    const highestIndex = Math.max(0, ...board.filter(Boolean).map((value) => FLOWERS.findIndex((flower) => flower.value === value)));
    const selectedFlowerIndex = FLOWERS.findIndex((flower) => flower.value === board[index]);
    const roll = Math.random();
    const offset = roll < .2 ? 1 : roll < .5 ? 2 : 3;
    const targetIndex = Math.min(FLOWERS.length - 1, Math.max(highestIndex - offset, selectedFlowerIndex + 1));
    board[index] = FLOWERS[targetIndex].value;
  } else if (activeTool === 'swap') {
    if (selectedIndex === index) {
      selectedIndex = null;
      previous = null;
      render({ animateTiles: false });
      return;
    }
    [board[selectedIndex], board[index]] = [board[index], board[selectedIndex]];
  }
  toolCounts[activeTool] -= 1;
  const resultName = activeTool === 'remove' ? `已铲除${sourceFlower.name}` : activeTool === 'upgrade' ? `已将${sourceFlower.name}升级` : '已交换两张花朵';
  activeTool = null;
  selectedIndex = null;
  window.lastMergedValue = 0;
  render({ animateTiles: false });
  saveGame();
  playTone(0);
  showToolResult(resultName);
}

tilesEl.addEventListener('pointerdown', (event) => {
  if (!activeTool) return;
  const tile = event.target.closest('.tile');
  if (!tile) return;
  event.preventDefault();
  event.stopPropagation();
  toolPointerStart = {
    x: event.clientX,
    y: event.clientY,
    index: Number(tile.dataset.index),
    pointerId: event.pointerId
  };
});

tilesEl.addEventListener('pointermove', (event) => {
  if (!toolPointerStart) return;
  event.preventDefault();
  event.stopPropagation();
});

tilesEl.addEventListener('pointerup', (event) => {
  if (!toolPointerStart) return;
  event.preventDefault();
  event.stopPropagation();
  const start = toolPointerStart;
  toolPointerStart = null;
  const dx = event.clientX - start.x;
  const dy = event.clientY - start.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 16) useToolOnTile(start.index);
});

tilesEl.addEventListener('pointercancel', () => {
  toolPointerStart = null;
});

undoBtn.addEventListener('click', undo);
newBtn.addEventListener('click', newGame);
restartBtn.addEventListener('click', newGame);
continueBtn.addEventListener('click', () => { keepPlaying = true; hideModal(); saveGame(); });
catalogBtn.addEventListener('click', openCatalog);
catalogCloseBtn.addEventListener('click', closeCatalog);
catalogBackdropEl.addEventListener('click', closeCatalog);
soundBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  localStorage.setItem('flower2048-sound', soundEnabled ? 'on' : 'off');
  render({ animateTiles: false });
  if (soundEnabled) {
    playTone(8);
    startMusic();
  } else {
    stopMusic();
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopMusic();
  else if (soundEnabled) startMusic();
});

if (!loadGame()) {
  addFlower();
  addFlower();
}
render();
saveGame();
setTimeout(() => boardEl.focus(), 120);
