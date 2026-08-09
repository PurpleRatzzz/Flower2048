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
  { value: 2048, name: '牡丹', bg: '#eed0e2', ink: '#773e68', kind: 'peony', colors: ['#de71ab', '#b74f91'] },
  { value: 4096, name: '樱花', bg: '#f5dce4', ink: '#855367', kind: 'cherry', colors: ['#f09bb3', '#d56d8d'] },
  { value: 8192, name: '鸢尾', bg: '#d9dcf1', ink: '#4f5d8d', kind: 'iris', colors: ['#747bc8', '#535aaa'] },
  { value: 16384, name: '兰花', bg: '#e8d6ee', ink: '#704f7d', kind: 'orchid', colors: ['#c17ccb', '#914f9e'] },
  { value: 32768, name: '百合', bg: '#f4e8c9', ink: '#75633f', kind: 'lily', colors: ['#fff6dc', '#e49b52'] },
  { value: 65536, name: '天堂鸟', bg: '#f6d5bb', ink: '#865239', kind: 'bird', colors: ['#ef8c4b', '#496f9e'] },
  { value: 131072, name: '昙花', bg: '#d8e6ef', ink: '#496275', kind: 'nightbloom', colors: ['#fffdf1', '#9eb9ce'] }
];

// 道具总表：新增/删除道具、调整初始次数都只改这里。
// target 决定操作方式：tile 点一张卡、pair 点两张卡、board 点按钮立即生效（由 run 执行）。
const TOOLS = [
  {
    id: 'remove',
    name: '铲除',
    title: '铲除一张花朵',
    start: 99,
    target: 'tile',
    hint: '点击一张花朵卡片',
    result: (flower) => `已铲除${flower.name}`,
    icon: 'm6 19 6-6M4 20h6M14 4l6 6M13 5l6 6-7 7-6-6 7-7Z'
  },
  {
    id: 'upgrade',
    name: '升级',
    title: '将一张花朵变为高级花朵',
    start: 99,
    target: 'tile',
    hint: '点击一张花朵卡片',
    result: (flower) => `已将${flower.name}升级`,
    icon: 'M12 20V4M6 10l6-6 6 6M5 20h14'
  },
  {
    id: 'swap',
    name: '交换',
    title: '交换两张花朵的位置',
    start: 99,
    target: 'pair',
    hint: '点击第一张花朵卡片',
    hintNext: '再点击第二张花朵卡片',
    result: () => '已交换两张花朵',
    icon: 'M7 7h12l-3-3M17 17H5l3 3M19 7l-3 3M5 17l3-3'
  },
  {
    id: 'sort',
    name: '整理',
    title: '把所有花朵从小到大排好',
    start: 99,
    target: 'board',
    run: () => tidyBoard(),
    icon: 'M4 20h16M6 20v-4M12 20V11M18 20V5'
  }
];

function toolById(id) {
  return TOOLS.find((tool) => tool.id === id);
}

// 唯一的次数来源：读档时补上新道具、丢掉已删除的道具、修掉脏数据。
function makeToolCounts(saved = {}) {
  return Object.fromEntries(TOOLS.map((tool) => [
    tool.id,
    Number.isFinite(saved[tool.id]) && saved[tool.id] >= 0 ? saved[tool.id] : tool.start
  ]));
}

function spendTool(id) {
  toolCounts[id] = Math.max(0, toolCounts[id] - 1);
}

// 给道具补充次数（充值 / 奖励 / 后台发放都走这里），amount 为负数即扣减。
function grantTool(id, amount = 1) {
  if (!toolById(id)) return false;
  toolCounts[id] = Math.max(0, toolCounts[id] + amount);
  render({ animateTiles: false });
  saveGame();
  return true;
}
window.grantTool = grantTool;

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
let soundEnabled = localStorage.getItem('flower2048-sound') !== 'off';
let toolCounts = makeToolCounts();
let activeTool = null;
let selectedIndex = null;
let toolStatusTimer = null;
let outcomeTimer = null;
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

toolShelfEl.innerHTML = TOOLS.map((tool) => `<button class="power-btn" type="button" data-tool="${tool.id}">
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="${tool.icon}"/></svg>
  <span>${tool.name}</span><strong data-tool-count="${tool.id}"></strong>
</button>`).join('');

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

function radialPetals(path, count, color, stroke = 'none', strokeWidth = 0, offset = 0) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (360 / count) * i + offset;
    return `<path d="${path}" fill="${color}" stroke="${stroke}" stroke-width="${strokeWidth}" transform="rotate(${angle} 50 50)"/>`;
  }).join('');
}

// 花朵 SVG 是纯函数且体量不小，按花种缓存，避免每次 render 重新拼字符串。
const svgCache = new Map();
function flowerSvg(flower) {
  if (!svgCache.has(flower.value)) svgCache.set(flower.value, buildFlowerSvg(flower));
  return svgCache.get(flower.value);
}

function buildFlowerSvg(flower) {
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
  if (flower.kind === 'cherry') {
    const petal = 'M50 52C44 47 38 38 38 28c0-8 5-14 11-16 1 0 1 3 1 5 0-2 0-5 1-5 6 2 11 8 11 16 0 10-6 19-12 24Z';
    art = `${stem}<g>${radialPetals(petal, 5, a, '#e88ba4', 1.2, 0)}<circle cx="50" cy="51" r="8" fill="#f6ca58"/><circle cx="50" cy="51" r="4" fill="${b}"/><g fill="#fff6d2"><circle cx="45" cy="48" r="1.7"/><circle cx="55" cy="48" r="1.7"/><circle cx="50" cy="56" r="1.7"/></g></g>`;
  }
  if (flower.kind === 'iris') art = `${stem}<g><path d="M50 52C30 46 25 32 33 21c10 3 16 12 17 25 1-13 7-22 17-25 8 11 3 25-17 31Z" fill="${a}"/><path d="M50 51C37 39 39 23 50 13c11 10 13 26 0 38Z" fill="#9aa0e1"/><path d="M49 50c-14-4-23 3-25 15 12 4 23-1 27-12 4 11 15 16 27 12-2-12-11-19-25-15" fill="${b}"/><path d="M44 49h12" stroke="#f5c957" stroke-width="4" stroke-linecap="round"/></g>`;
  if (flower.kind === 'orchid') art = `${stem}<g stroke="#9a5ca8" stroke-width="1.1" stroke-linejoin="round"><path d="M49 48C40 44 32 36 33 25c8 1 15 6 18 15Z" fill="${a}"/><path d="M51 48C60 44 68 36 67 25c-8 1-15 6-18 15Z" fill="${a}"/><path d="M50 48C43 40 44 27 50 18c6 9 7 22 0 30Z" fill="#d69add"/><path d="M47 52C39 46 28 47 24 56c8 8 17 8 26 1Z" fill="${a}"/><path d="M53 52C61 46 72 47 76 56c-8 8-17 8-26 1Z" fill="${a}"/></g><g><path d="M37 47c5-5 21-5 26 0-1 11-6 19-13 22-7-3-12-11-13-22Z" fill="${b}"/><path d="M43 53c2-5 12-5 14 0-1 7-4 11-7 11s-6-4-7-11Z" fill="#f7c5dc"/><path d="M46 55c1-2 3-3 4-3s3 1 4 3c-2 3-6 3-8 0Z" fill="#be4d78"/><circle cx="43.5" cy="49" r="2" fill="#56325e"/><circle cx="56.5" cy="49" r="2" fill="#56325e"/><path d="M44 48 38 45M44 51l-7 1M56 48l6-3M56 51l7 1" fill="none" stroke="#704175" stroke-width="1.2" stroke-linecap="round"/></g>`;
  if (flower.kind === 'lily') art = `${stem}<g stroke="#e4c994" stroke-width="1.2" stroke-linejoin="round"><path d="M50 56C43 45 42 28 50 13c8 15 7 32 0 43Z" fill="${a}"/><path d="M49 56C39 51 28 40 27 25c13 1 23 10 24 27Z" fill="${a}"/><path d="M51 56C61 51 72 40 73 25c-13 1-23 10-24 27Z" fill="${a}"/><path d="M48 57C37 57 27 50 22 39c13-1 24 5 29 14Z" fill="#fff9e9"/><path d="M52 57C63 57 73 50 78 39c-13-1-24 5-29 14Z" fill="#fff9e9"/><path d="M50 57C44 51 38 41 40 29c7 4 11 12 10 23Z" fill="#fffdf1"/></g><g stroke="${b}" stroke-width="1.7" stroke-linecap="round"><path d="M50 53 43 33M50 53l7-20M50 53V29M50 53 35 42M50 53l15-11"/></g><g fill="${b}"><circle cx="43" cy="32" r="2.4"/><circle cx="57" cy="32" r="2.4"/><circle cx="50" cy="28" r="2.4"/><circle cx="35" cy="41" r="2.2"/><circle cx="65" cy="41" r="2.2"/></g>`;
  if (flower.kind === 'bird') art = `<path d="M41 82c5-20 10-29 19-39" fill="none" stroke="#3d8752" stroke-width="5" stroke-linecap="round"/><path d="M35 70c-12-7-18 2-12 9 5 5 11 1 15-2" fill="#65a85b"/><g><path d="M41 55c12-21 24-31 39-33-3 14-14 26-32 37Z" fill="${a}"/><path d="M39 56c3-19 0-29-7-37 13 4 21 15 18 36Z" fill="#f4b84d"/><path d="M42 58c17-11 30-12 39-7-8 10-21 15-37 13Z" fill="${b}"/><path d="M40 59c8-9 12-21 10-34-9 7-14 19-13 33Z" fill="#e66045"/></g>`;
  if (flower.kind === 'nightbloom') {
    const outerPetal = 'M50 57C40 48 35 33 50 9c15 24 10 39 0 48Z';
    const innerPetal = 'M50 55C44 46 43 34 50 16c7 18 6 30 0 39Z';
    art = `${stem}<g>${radialPetals(outerPetal, 8, '#dfeef2', '#b5ccd5', .8, 22.5)}${radialPetals(innerPetal, 10, a, '#f3e9d8', .7, 0)}<path d="M43 56c4-6 10-7 14 0-2 8-5 12-7 12s-5-4-7-12Z" fill="#fff5cf"/><circle cx="50" cy="56" r="5" fill="#f4d26a"/><g stroke="#d7a95b" stroke-width="1" stroke-linecap="round"><path d="M47 56 42 44M49 56l-1-15M51 56l1-15M53 56l5-12"/></g><g fill="#e8bc73"><circle cx="42" cy="44" r="1.5"/><circle cx="48" cy="41" r="1.5"/><circle cx="52" cy="41" r="1.5"/><circle cx="58" cy="44" r="1.5"/></g></g>`;
  }

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
  if (score > best) {
    best = score;
    localStorage.setItem('flower2048-best', best);
  }
  bestEl.textContent = best;
  undoBtn.disabled = !previous;
  renderCollection(highest);
  soundBtn.classList.toggle('sound-muted', !soundEnabled);
  soundBtn.setAttribute('aria-label', soundEnabled ? '关闭音效与音乐' : '开启音效与音乐');
  soundBtn.title = soundEnabled ? '关闭音效与音乐' : '开启音效与音乐';
  TOOLS.forEach((tool) => {
    const button = toolShelfEl.querySelector(`[data-tool="${tool.id}"]`);
    const count = toolCounts[tool.id];
    button.classList.toggle('active', activeTool === tool.id);
    button.disabled = count <= 0;
    button.setAttribute('aria-pressed', String(activeTool === tool.id));
    button.setAttribute('aria-label', `${tool.name}道具，剩余 ${count} 次`);
    button.title = tool.title;
    button.querySelector(`[data-tool-count="${tool.id}"]`).textContent = count;
  });
  const active = activeTool ? toolById(activeTool) : null;
  const activeStatus = !active
    ? ''
    : active.hintNext && selectedIndex !== null
      ? active.hintNext
      : active.hint || '';
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

// 图鉴只在解锁集合变化时重建，否则每次 render（含道具切换）都要重绘 17 个 SVG。
let collectionKey = null;
function renderCollection(highest) {
  const key = FLOWERS.map((flower) => {
    if (flower.value === highest) return 'c';
    return discovered.has(flower.value) || flower.value <= highest ? '1' : '0';
  }).join('');
  if (key === collectionKey) return;
  collectionKey = key;

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

// 完整图鉴内容是静态的，建一次就够。
let catalogBuilt = false;
function renderCatalog() {
  if (catalogBuilt) return;
  catalogBuilt = true;
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

// 四个方向的行序是固定的，启动时算一次。
const LINES = {
  left: getLines('left'),
  right: getLines('right'),
  up: getLines('up'),
  down: getLines('down')
};

function move(direction) {
  if (!modalEl.hidden || !catalogModalEl.hidden) return;
  startMusic();
  const before = [...board];
  const scoreBefore = score;
  let gained = 0;
  let biggestMerge = 0;
  let biggestMergeCell = -1;

  LINES[direction].forEach((line) => {
    const values = line.map((index) => board[index]).filter(Boolean);
    const merged = [];
    for (let i = 0; i < values.length; i += 1) {
      if (values[i] === values[i + 1]) {
        const next = values[i] * 2;
        if (next > biggestMerge) {
          biggestMerge = next;
          biggestMergeCell = line[merged.length];
        }
        merged.push(next);
        gained += next;
        i += 1;
      } else {
        merged.push(values[i]);
      }
    }
    while (merged.length < 4) merged.push(0);
    line.forEach((index, i) => { board[index] = merged[i]; });
  });

  if (board.every((value, index) => value === before[index])) {
    // 棋盘没变：可能是死局，仍要判一次结局，否则玩家会卡在没有弹窗的满盘上。
    checkOutcome();
    return;
  }
  previous = { board: before, score: scoreBefore, discovered: [...discovered], toolCounts: { ...toolCounts } };
  score += gained;
  addFlower();
  window.lastMergedValue = biggestMerge;
  render();
  saveGame();

  if (gained) {
    showScoreGain(gained);
    burstPetals(biggestMerge, biggestMergeCell);
    playTone(biggestMerge);
  } else {
    playTone(0);
  }

  checkOutcome();
}

// 胜负判定的唯一入口：移动、道具、整理后都要走一遍。
function checkOutcome() {
  if (!modalEl.hidden || outcomeTimer) return;
  const type = !won && board.includes(FLOWERS.at(-1).value) ? 'win' : !canMove() ? 'lose' : null;
  if (!type) return;
  if (type === 'win') won = true;
  outcomeTimer = window.setTimeout(() => {
    outcomeTimer = null;
    showModal(type);
  }, 330);
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

function burstPetals(value, index) {
  if (!Number.isInteger(index) || index < 0) return;
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
    oscillator.frequency.value = value ? 360 + Math.min(Math.log2(value), FLOWERS.length) * 35 : 250;
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
  const flower = flowerFor(win ? FLOWERS.at(-1).value : Math.max(...board));
  modalKickerEl.textContent = win ? '花园盛放' : '本季收成';
  modalTitleEl.textContent = win ? `${flower.name}开花啦！` : '花园种满啦';
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
  localStorage.setItem('flower2048-save', JSON.stringify({ board, score, discovered: [...discovered], won, toolCounts }));
}

function loadGame() {
  try {
    const saved = JSON.parse(localStorage.getItem('flower2048-save'));
    const validBoard = saved && Array.isArray(saved.board) && saved.board.length === 16
      && saved.board.every((value) => Number.isFinite(value) && value >= 0)
      && saved.board.some(Boolean);
    if (validBoard) {
      board = saved.board;
      score = Math.max(0, Number(saved.score) || 0);
      discovered = new Set(Array.isArray(saved.discovered) ? saved.discovered : [2]);
      // won 表示「这局已经弹过胜利」。不能再要求昙花still在盘上：
      // 玩家选了继续培育后把昙花合掉，重进就会重复弹一次胜利。
      won = Boolean(saved.won);
      toolCounts = makeToolCounts(saved.toolCounts);
      return true;
    }
  } catch (_) { /* Ignore invalid local saves. */ }
  return false;
}

function newGame() {
  window.clearTimeout(outcomeTimer);
  outcomeTimer = null;
  board = Array(16).fill(0);
  score = 0;
  previous = null;
  discovered = new Set([2]);
  won = false;
  toolCounts = makeToolCounts();
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
  window.clearTimeout(outcomeTimer);
  outcomeTimer = null;
  if (!modalEl.hidden) hideModal();
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
  if (event.key === 'Escape') {
    // 图鉴优先关闭；结算弹窗只有「胜利」那次可以关掉继续玩，输了必须选新花园。
    if (!catalogModalEl.hidden) closeCatalog();
    else if (!modalEl.hidden && !continueBtn.hidden) hideModal();
  }
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
  const tool = toolById(button.dataset.tool);
  if (tool.target === 'board') {
    tool.run();
    return;
  }
  activeTool = activeTool === tool.id ? null : tool.id;
  selectedIndex = null;
  toolPointerStart = null;
  render({ animateTiles: false });
});

// 整理的落位顺序（由小到大），逐行折返的蛇形，保证名次相邻的花朵在棋盘上也相邻、便于继续合并。
// 棋盘格号            名次
//  0  1  2  3        4  3  2  1
//  4  5  6  7   →    5  6  7  8
//  8  9 10 11       12 11 10  9
// 12 13 14 15       13 14 15 16
const TIDY_ORDER = [3, 2, 1, 0, 4, 5, 6, 7, 11, 10, 9, 8, 12, 13, 14, 15];

function tidyBoard() {
  const values = board.filter(Boolean).sort((a, b) => a - b);
  const tidied = Array(16).fill(0);
  // 不足 16 张时填在蛇形的尾段，最大的一张始终落在右下角。
  const slots = TIDY_ORDER.slice(16 - values.length);
  values.forEach((value, i) => { tidied[slots[i]] = value; });

  activeTool = null;
  selectedIndex = null;
  toolPointerStart = null;

  if (tidied.every((value, index) => value === board[index])) {
    render({ animateTiles: false });
    showToolResult('花园已经很整齐啦');
    return;
  }

  previous = { board: [...board], score, discovered: [...discovered], toolCounts: { ...toolCounts } };
  board = tidied;
  spendTool('sort');
  window.lastMergedValue = 0;
  render();
  saveGame();
  playTone(0);
  showToolResult('已把花朵从小到大排好');
  checkOutcome();
}

function useToolOnTile(index) {
  if (!activeTool) return;
  if (!Number.isInteger(index) || !board[index]) return;

  const tool = toolById(activeTool);
  if (tool.target === 'pair' && selectedIndex === null) {
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
  spendTool(activeTool);
  const resultName = tool.result(sourceFlower);
  activeTool = null;
  selectedIndex = null;
  window.lastMergedValue = 0;
  render({ animateTiles: false });
  saveGame();
  playTone(0);
  showToolResult(resultName);
  checkOutcome();
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
continueBtn.addEventListener('click', () => { hideModal(); saveGame(); });
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
// 存档可能本身就是死局，进来先判一次。
checkOutcome();
