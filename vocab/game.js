'use strict';
/* ============================================================
 * 词域探险 · 网页版  (Vocab Roguelike Web Edition)
 * 从 WordRogue.cs (C# WinForms) 移植到 HTML5 Canvas
 * ============================================================ */

/* ---------- 常量 ---------- */
const W = 1280, H = 720, DT = 1 / 60;

const STATE = { MENU: 0, PLAYING: 1, ROOMCLEAR: 2, REWARD: 3, GAMEOVER: 4, WIN: 5, PAUSED: 6 };
const KIND = { WANDERER: 0, CHASER: 1, DASHER: 2, SHIELD: 3, GHOST: 4 };
const DROP = { APPLE: 0, COFFEE: 1, SHIELDPOTION: 2, INK: 3, BOOTS: 4, FEATHER: 5, GLOVES: 6 };
const REWARD = { SURVIVAL: 0, MOVESPEED: 1, SHIELD: 2, CHESTSPEED: 3, CHESTTHROW: 4, CHESTECHO: 5 };

/* ---------- 工具 ---------- */
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function clamp01(v) { return clamp(v, 0, 1); }
function dist(ax, ay, bx, by) { const dx = bx - ax, dy = by - ay; return Math.sqrt(dx * dx + dy * dy); }

class Vec2 {
  constructor(x, y) { this.x = x; this.y = y; }
  len() { return Math.sqrt(this.x * this.x + this.y * this.y); }
  normalized() { const l = this.len(); if (l < 0.001) return new Vec2(0, 0); return new Vec2(this.x / l, this.y / l); }
  add(o) { return new Vec2(this.x + o.x, this.y + o.y); }
  sub(o) { return new Vec2(this.x - o.x, this.y - o.y); }
  mul(s) { return new Vec2(this.x * s, this.y * s); }
}

function randRange(n) { return Math.floor(Math.random() * n); }
function randPick(arr) { return arr[randRange(arr.length)]; }

/* ---------- 主题 ---------- */
const THEMES = [
  { name: '新手森林', floor: [33, 62, 45], wall: [19, 36, 31], accent: [118, 184, 98] },
  { name: '办公废墟', floor: [58, 61, 66], wall: [32, 34, 39], accent: [224, 175, 92] },
  { name: '校园图书馆', floor: [58, 48, 75], wall: [33, 28, 48], accent: [154, 133, 201] },
  { name: '科技实验室', floor: [35, 63, 73], wall: [20, 37, 44], accent: [74, 189, 198] },
  { name: '商业矿井', floor: [72, 58, 42], wall: [40, 32, 27], accent: [227, 188, 93] },
  { name: '学术神庙', floor: [51, 53, 75], wall: [28, 31, 48], accent: [220, 219, 166] },
  { name: '旅行港口', floor: [35, 73, 86], wall: [22, 43, 54], accent: [106, 177, 221] },
  { name: '情绪洞穴', floor: [74, 45, 58], wall: [42, 27, 36], accent: [228, 122, 139] }
];

/* ---------- 词库与存档 ---------- */
let allWords = [];
let bankWords = [];
let saveData = null;

function defaultSaveData() {
  return {
    words: [], bestRoom: 0, totalCorrect: 0, totalWrong: 0, hasContinue: false,
    continueMode: 2, continueModeName: '简单 / 高中词汇', continueRoom: 1, continueHp: 100,
    continueSpeed: 245, continueDashCooldown: 1.2, continueThrowSpeed: 610, continuePickupRange: 84,
    continueDefense: 0, continueLuck: 0, continuePiercingInkRooms: 0, continueEchoScrollRooms: 0,
    continueSpeedBoostRooms: 0, continueThrowBoostRooms: 0, continueDashBoostRooms: 0, continuePickupBoostRooms: 0,
    continueTempSpeedBonus: 0, continueTempThrowBonus: 0, continueTempDashBonus: 0, continueTempPickupBonus: 0
  };
}

function loadSave() {
  try {
    const raw = localStorage.getItem('vocabRogueSave');
    if (!raw) return defaultSaveData();
    const d = JSON.parse(raw);
    const base = defaultSaveData();
    for (const k in base) if (typeof d[k] !== 'undefined') base[k] = d[k];
    return base;
  } catch (e) { return defaultSaveData(); }
}

function persistSave() {
  try { localStorage.setItem('vocabRogueSave', JSON.stringify(saveData)); } catch (e) { /* ignore */ }
}

function mergeSavedStats() {
  if (!saveData || !saveData.words) return;
  const byWord = new Map();
  for (const w of saveData.words) byWord.set(w.word, w);
  for (const w of allWords) {
    const s = byWord.get(w.word);
    if (s) {
      w.seenCount = s.seenCount || 0;
      w.correctCount = s.correctCount || 0;
      w.wrongCount = s.wrongCount || 0;
      w.deathCount = s.deathCount || 0;
      w.mastery = s.mastery || 0;
      w.lastSeenRoom = s.lastSeenRoom || 0;
    }
  }
}

function collectWordStats() {
  const out = [];
  for (const w of allWords) {
    if (w.seenCount > 0 || w.correctCount > 0 || w.wrongCount > 0) {
      out.push({ word: w.word, seenCount: w.seenCount || 0, correctCount: w.correctCount || 0, wrongCount: w.wrongCount || 0, deathCount: w.deathCount || 0, mastery: w.mastery || 0, lastSeenRoom: w.lastSeenRoom || 0 });
    }
  }
  return out;
}

/* ---------- 游戏状态 ---------- */
let player = null;
let state = STATE.MENU;
let previousState = STATE.MENU;
let monsters = [];
let meanings = [];
let projectiles = [];
let enemyProjectiles = [];
let drops = [];
let rewardCards = [];
let floatingTexts = [];
let chests = [];
let obstacles = [];
let runWords = [];
let roomLog = [];

let room = 0;
let combo = 0;
let streakWrong = 0;
let correctHits = 0;
let wrongHits = 0;
let collisions = 0;
let roomTime = 0;
let clearDelay = 0;
let roomDifficultyScale = 1;
let speedBoostRooms = 0, throwBoostRooms = 0, dashBoostRooms = 0, pickupBoostRooms = 0, piercingInkRooms = 0, echoScrollRooms = 0;
let tempSpeedBonus = 0, tempThrowBonus = 0, tempDashBonus = 0, tempPickupBonus = 0;
let walkAnimTime = 0, dashAnimTime = 0, fireAnimTime = 0;
let selectedMode = 2, selectedModeName = '简单 / 高中词汇';
let playerFacing = 0;
let message = '';
let showBook = false;
let mouseLeftDown = false;
let mouse = { x: W / 2, y: H / 2 };
let lastMoveDir = new Vec2(0, 1);

/* ---------- 工厂函数 ---------- */
function makePlayer() {
  return {
    pos: new Vec2(W / 2, H / 2 + 120), radius: 18, hp: 100, maxHp: 100,
    speed: 245, dashCooldown: 1.2, dashTimer: 0, throwSpeed: 610, pickupRange: 84,
    defense: 0, memoryBonus: 0, luck: 0, invulnerable: 0, speedBoost: 0, shieldTime: 0,
    piercingInk: false, echoScroll: false, heldMeaning: ''
  };
}

/* ---------- 资源加载 ---------- */
const images = {};
const sounds = {};
let audioCtx = null;
let assetsLoaded = 0, assetsTotal = 0;

function loadImage(key, src) {
  assetsTotal++;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { images[key] = img; assetsLoaded++; updateLoadUi(); resolve(); };
    img.onerror = () => { assetsLoaded++; updateLoadUi(); resolve(); };
    img.src = src;
  });
}

function loadSound(key, src) {
  assetsTotal++;
  return new Promise((resolve) => {
    const a = new Audio();
    a.oncanplaythrough = () => { sounds[key] = a; assetsLoaded++; updateLoadUi(); resolve(); };
    a.onerror = () => { assetsLoaded++; updateLoadUi(); resolve(); };
    a.src = src;
  });
}

function updateLoadUi() {
  const fill = document.getElementById('fill');
  const txt = document.getElementById('loadText');
  if (fill) fill.style.width = Math.round(100 * assetsLoaded / Math.max(1, assetsTotal)) + '%';
  if (txt) txt.textContent = Math.round(100 * assetsLoaded / Math.max(1, assetsTotal)) + '%';
}

function atlasRect(img, cols, rows, index) {
  const cw = img.naturalWidth / cols, ch = img.naturalHeight / rows;
  const col = index % cols, row = Math.floor(index / cols);
  return { x: col * cw, y: row * ch, w: cw, h: ch };
}

function drawAtlasCentered(ctx, img, cols, rows, index, cx, cy, dw, dh, mirror) {
  if (!img || !img.naturalWidth) return;
  const r = atlasRect(img, cols, rows, index);
  ctx.save();
  ctx.translate(cx, cy);
  if (mirror) ctx.scale(-1, 1);
  ctx.drawImage(img, r.x, r.y, r.w, r.h, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}

function drawRotatedAtlasCentered(ctx, img, cols, rows, index, cx, cy, dw, dh, degrees) {
  if (!img || !img.naturalWidth) return;
  const r = atlasRect(img, cols, rows, index);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(degrees * Math.PI / 180);
  ctx.drawImage(img, r.x, r.y, r.w, r.h, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}

/* ---------- 音效 ---------- */
function playSound(key) {
  if (key === 'hit_correct') {
    if (sounds.hit_correct) {
      const a = sounds.hit_correct.cloneNode();
      a.volume = 0.5;
      a.play().catch(() => {});
      return;
    }
  } else if (key === 'ui_click') {
    if (sounds.ui_click) {
      const a = sounds.ui_click.cloneNode();
      a.volume = 0.4;
      a.play().catch(() => {});
      return;
    }
  }
  beep(key);
}

function beep(key) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    const t = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.frequency.setValueAtTime(key === 'hit_correct' ? 660 : 440, t);
    osc.start(t); osc.stop(t + 0.13);
  } catch (e) { /* ignore */ }
}
/* ============================================================
 * 第二部分：开局、房间生成、障碍、碰撞
 * ============================================================ */

function startGame(maxDifficulty, modeName, enterFirstRoom = true) {
  selectedMode = maxDifficulty;
  selectedModeName = modeName;
  bankWords = allWords.filter(w => w.difficulty <= maxDifficulty);
  if (bankWords.length === 0) bankWords = allWords.slice();

  player = makePlayer();
  monsters = []; meanings = []; projectiles = []; enemyProjectiles = [];
  drops = []; chests = []; floatingTexts = []; obstacles = [];
  runWords = []; roomLog = [];
  room = 0; combo = 0; streakWrong = 0; correctHits = 0; wrongHits = 0; collisions = 0;
  roomDifficultyScale = 1; message = '';
  state = STATE.PLAYING;
  speedBoostRooms = 0; throwBoostRooms = 0; dashBoostRooms = 0; pickupBoostRooms = 0;
  piercingInkRooms = 0; echoScrollRooms = 0;
  tempSpeedBonus = 0; tempThrowBonus = 0; tempDashBonus = 0; tempPickupBonus = 0;
  lastMoveDir = new Vec2(0, 1);
  playerFacing = 0;
  showBook = false;
  rewardCards = [];

  if (enterFirstRoom) startRoom(true);
}

function continueGame() {
  if (!saveData || !saveData.hasContinue) return;
  const resumeRoom = Math.max(1, saveData.continueRoom);
  startGame(saveData.continueMode <= 0 ? 2 : saveData.continueMode,
    saveData.continueModeName || '简单 / 高中词汇', false);
  room = Math.max(0, resumeRoom - 1);
  player.hp = saveData.continueHp > 0 ? Math.min(player.maxHp, saveData.continueHp) : player.maxHp;
  if (saveData.continueSpeed > 0) player.speed = saveData.continueSpeed;
  if (saveData.continueDashCooldown > 0) player.dashCooldown = saveData.continueDashCooldown;
  if (saveData.continueThrowSpeed > 0) player.throwSpeed = saveData.continueThrowSpeed;
  if (saveData.continuePickupRange > 0) player.pickupRange = saveData.continuePickupRange;
  player.defense = Math.max(0, saveData.continueDefense);
  player.luck = Math.max(0, saveData.continueLuck);
  piercingInkRooms = Math.max(0, saveData.continuePiercingInkRooms);
  echoScrollRooms = Math.max(0, saveData.continueEchoScrollRooms);
  speedBoostRooms = Math.max(0, saveData.continueSpeedBoostRooms);
  throwBoostRooms = Math.max(0, saveData.continueThrowBoostRooms);
  dashBoostRooms = Math.max(0, saveData.continueDashBoostRooms);
  pickupBoostRooms = Math.max(0, saveData.continuePickupBoostRooms);
  tempSpeedBonus = Math.max(0, saveData.continueTempSpeedBonus);
  tempThrowBonus = Math.max(0, saveData.continueTempThrowBonus);
  tempDashBonus = Math.max(0, saveData.continueTempDashBonus);
  tempPickupBonus = Math.max(0, saveData.continueTempPickupBonus);
  player.piercingInk = piercingInkRooms > 0;
  player.echoScroll = echoScrollRooms > 0;
  startRoom(false);
  message = '继续游戏：第 ' + room + ' 间';
}

function startRoom(advancePowerups) {
  state = STATE.PLAYING;
  room++;
  if (advancePowerups) advanceRoomLimitedPowerups();
  monsters = []; meanings = []; projectiles = []; enemyProjectiles = [];
  drops = []; chests = []; floatingTexts = []; obstacles = []; roomLog = [];
  player.pos = new Vec2(W / 2, H / 2 + 160);
  player.heldMeaning = '';
  roomTime = 0; clearDelay = 0; correctHits = 0; wrongHits = 0; collisions = 0;
  showBook = false;
  generateObstacles();

  let targetCount = 3 + Math.min(3, Math.floor(room / 2));
  if (roomDifficultyScale > 1.15) targetCount++;
  if (selectedMode >= 4 && room > 3) targetCount++;
  if (selectedMode >= 6 && room > 5) targetCount++;
  targetCount = Math.min(6, targetCount);
  targetCount = Math.min(targetCount, Math.max(1, bankWords.length));

  const chosen = pickRoomWords(targetCount);
  for (let i = 0; i < chosen.length; i++) {
    const entry = chosen[i];
    entry.seenCount = (entry.seenCount || 0) + 1;
    entry.lastSeenRoom = room;
    if (!runWords.includes(entry)) runWords.push(entry);

    const m = {
      entry, pos: new Vec2(0, 0), vel: new Vec2(0, 0),
      radius: 31 + entry.difficulty * 1.8,
      maxHp: (room > 4 || entry.difficulty >= 4) ? 2 : 1,
      hp: 0,
      kind: KIND.WANDERER, thinkTimer: 0, rageTimer: 0, ragePower: 0,
      dashWindup: 0, shootTimer: 0, facingRight: true, shieldUp: false, fromMistake: false
    };
    m.hp = m.maxHp;
    m.kind = pickMonsterKind(entry);
    m.shieldUp = m.kind === KIND.SHIELD;
    m.fromMistake = (entry.wrongCount || 0) > (entry.correctCount || 0) && Math.random() < 0.35;
    if (m.fromMistake) m.kind = KIND.GHOST;
    m.pos = randomFreePosition(m.radius + 8);
    m.thinkTimer = Math.random() * 1.2;
    m.shootTimer = 1.4 + Math.random() * 2.3;
    monsters.push(m);
  }

  spawnMeaningTokens();
  if (Math.random() < 0.52) chests.push({ pos: randomFreePosition(42), opened: false });
  message = '第 ' + room + ' 间：' + THEMES[(room - 1) % THEMES.length].name;
  if (targetCount > 3) {
    prepareRewardCards();
    state = STATE.REWARD;
    message = '选择一张奖励卡后开始房间';
  }
  saveContinueState();
}

function advanceRoomLimitedPowerups() {
  if (room <= 1) return;
  if (speedBoostRooms > 0 && --speedBoostRooms === 0 && tempSpeedBonus > 0) {
    player.speed = Math.max(120, player.speed - tempSpeedBonus);
    tempSpeedBonus = 0;
    addFloat('速度道具失效', player.pos.add(new Vec2(-30, -36)), [220, 220, 220]);
  }
  if (throwBoostRooms > 0 && --throwBoostRooms === 0 && tempThrowBonus > 0) {
    player.throwSpeed = Math.max(260, player.throwSpeed - tempThrowBonus);
    tempThrowBonus = 0;
    addFloat('弹速道具失效', player.pos.add(new Vec2(-30, -36)), [220, 220, 220]);
  }
  if (dashBoostRooms > 0 && --dashBoostRooms === 0 && tempDashBonus > 0) {
    player.dashCooldown += tempDashBonus;
    tempDashBonus = 0;
    addFloat('轻羽失效', player.pos.add(new Vec2(-30, -36)), [220, 220, 220]);
  }
  if (pickupBoostRooms > 0 && --pickupBoostRooms === 0 && tempPickupBonus > 0) {
    player.pickupRange = Math.max(60, player.pickupRange - tempPickupBonus);
    tempPickupBonus = 0;
    addFloat('磁力手套失效', player.pos.add(new Vec2(-30, -36)), [220, 220, 220]);
  }
  if (piercingInkRooms > 0 && --piercingInkRooms === 0) {
    player.piercingInk = false;
    addFloat('穿透墨水失效', player.pos.add(new Vec2(-30, -36)), [220, 220, 220]);
  }
  if (echoScrollRooms > 0 && --echoScrollRooms === 0) {
    player.echoScroll = false;
    addFloat('回声卷轴失效', player.pos.add(new Vec2(-30, -36)), [220, 220, 220]);
  }
}

function pickMonsterKind(entry) {
  const roll = Math.random() * 100;
  const tier = room + entry.difficulty;
  if (tier > 8 && roll < 18) return KIND.SHIELD;
  if (tier > 6 && roll < 38) return KIND.DASHER;
  if (tier > 4 && roll < 68) return KIND.CHASER;
  return KIND.WANDERER;
}

function pickRoomWords(count) {
  const selected = [];
  const pool = bankWords.slice();
  for (let i = 0; i < count && pool.length > 0; i++) {
    let total = 0;
    const weights = [];
    for (const w of pool) {
      const targetDifficulty = 1 + room * 0.42;
      const difficultyScore = 40 - Math.abs(w.difficulty - targetDifficulty) * 9;
      let weight = Math.max(6, difficultyScore);
      if (!w.seenCount) weight += 30;
      weight += (w.wrongCount || 0) * 20;
      weight += (w.deathCount || 0) * 50;
      weight -= (w.mastery || 0) * 8;
      if (room - (w.lastSeenRoom || 0) <= 3 && w.lastSeenRoom > 0) weight -= 30;
      if ((w.correctCount || 0) >= 3 && !w.wrongCount) weight -= 18;
      if (weight < 2) weight = 2;
      total += weight;
      weights.push(weight);
    }
    let pick = Math.random() * total;
    let acc = 0;
    for (let j = 0; j < pool.length; j++) {
      acc += weights[j];
      if (pick <= acc) {
        selected.push(pool[j]);
        pool.splice(j, 1);
        break;
      }
    }
  }
  return selected;
}

function requiredHitsForMonster(m) {
  let needed = Math.ceil(m.maxHp);
  if (m.shieldUp) needed++;
  return Math.max(1, needed);
}

function shareTag(a, b) {
  if (!a.tags || !b.tags) return false;
  return a.tags.some(t => b.tags.includes(t));
}

function spawnMeaningTokens() {
  const used = new Set();
  for (const m of monsters) {
    const needed = requiredHitsForMonster(m);
    for (let i = 0; i < needed; i++) addMeaningToken(m.entry.meaning, true);
    used.add(m.entry.meaning);
  }
  let distractorCount = Math.max(5, monsters.length + 3);
  const candidates = allWords.slice().sort(() => Math.random() - 0.5);
  for (const w of candidates) {
    if (used.has(w.meaning)) continue;
    let sameTheme = false;
    for (const m of monsters) if (shareTag(w, m.entry)) sameTheme = true;
    if (sameTheme || Math.random() < 0.35) {
      addMeaningToken(w.meaning, false);
      used.add(w.meaning);
      distractorCount--;
      if (distractorCount <= 0) break;
    }
  }
}

function addMeaningToken(meaning, correct) {
  return addMeaningTokenAt(meaning, correct, findMeaningTokenPosition(meaning, 100));
}

function addMeaningTokenAt(meaning, correct, pos) {
  if (!isMeaningTokenPositionFree(meaning, pos, 30)) {
    pos = findMeaningTokenPosition(meaning, 70);
  }
  const token = {
    meaning, pos,
    correctForRoom: correct,
    glowTimer: (correct && roomDifficultyScale < 0.92) ? 6 : 0
  };
  meanings.push(token);
  return token;
}

function findMeaningTokenPosition(meaning, playerClearance) {
  for (let attempt = 0; attempt < 260; attempt++) {
    const p = new Vec2(80 + randRange(W - 160), 100 + randRange(H - 170));
    if (isMeaningTokenPositionFree(meaning, p, playerClearance)) return p;
  }
  for (let y = 102; y < H - 70; y += 38) {
    for (let x = 72; x < W - 72; x += 54) {
      const p = new Vec2(x, y);
      if (isMeaningTokenPositionFree(meaning, p, Math.min(50, playerClearance))) return p;
    }
  }
  return randomFreePosition(48);
}

function findMeaningTokenPositionNear(meaning, center) {
  for (let i = 0; i < 80; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 42 + randRange(86);
    const candidate = center.add(new Vec2(Math.cos(angle), Math.sin(angle)).mul(distance));
    if (isMeaningTokenPositionFree(meaning, candidate, 24)) return candidate;
  }
  return findMeaningTokenPosition(meaning, 50);
}

function isMeaningTokenPositionFree(meaning, pos, playerClearance) {
  const bounds = meaningTokenBounds(meaning, pos);
  if (bounds.left < 44 || bounds.right > W - 44) return false;
  if (bounds.top < 78 || bounds.bottom > H - 44) return false;

  if (distancePointToRect(player.pos, bounds) < player.radius + playerClearance) return false;

  for (const obstacle of obstacles) {
    if (rectsIntersect(inflateRect(obstacleCollisionBounds(obstacle), 8, 8), bounds)) return false;
  }
  for (const m of monsters) {
    if (distancePointToRect(m.pos, bounds) < m.radius + 18) return false;
  }
  for (const chest of chests) {
    if (!chest.opened && distancePointToRect(chest.pos, bounds) < 42) return false;
  }
  const padded = inflateRect(bounds, 10, 7);
  for (const token of meanings) {
    if (rectsIntersect(padded, meaningTokenBounds(token.meaning, token.pos))) return false;
  }
  return true;
}

function meaningTokenBounds(meaning, pos) {
  let width = estimateMeaningTextWidth(meaning) + 28;
  width = clamp(width, 56, 220);
  return { left: pos.x - width / 2, top: pos.y - 16, right: pos.x + width / 2, bottom: pos.y + 16, width, height: 32 };
}

function estimateMeaningTextWidth(meaning) {
  if (!meaning) return 28;
  let width = 0;
  for (const c of meaning) {
    if (c.charCodeAt(0) <= 127) width += 8.5;
    else width += 15.5;
  }
  return width;
}

function randomFreePosition(radius = 34) {
  for (let attempt = 0; attempt < 80; attempt++) {
    const p = new Vec2(100 + randRange(W - 200), 110 + randRange(H - 210));
    if (dist(p.x, p.y, player.pos.x, player.pos.y) < 130) continue;
    if (isCircleBlocked(p, radius)) continue;
    let ok = true;
    for (const m of monsters) {
      if (dist(p.x, p.y, m.pos.x, m.pos.y) < 90) { ok = false; break; }
    }
    if (ok) return p;
  }
  for (let x = 90; x < W - 90; x += 44) {
    for (let y = 110; y < H - 80; y += 44) {
      const p = new Vec2(x, y);
      if (!isCircleBlocked(p, radius) && dist(p.x, p.y, player.pos.x, player.pos.y) >= 90) return p;
    }
  }
  return player.pos;
}

/* ---------- 障碍 ---------- */
function generateObstacles() {
  obstacles = [];
  const themeIndex = (room - 1 + THEMES.length) % THEMES.length;
  let target = 6 + randRange(4) + Math.min(3, Math.floor(room / 4));
  if (themeIndex === 7) target += 2;

  for (let attempt = 0; attempt < target * 18 && obstacles.length < target; attempt++) {
    const obstacle = createRandomObstacle(themeIndex);
    if (!canPlaceObstacle(obstacle)) continue;
    obstacles.push(obstacle);
    if (!roomNavigationIsValid()) obstacles.pop();
  }
}

function createRandomObstacle(themeIndex) {
  let width = 72 + randRange(70);
  let height = 44 + randRange(58);
  let kind = '障碍';
  let fill = [100, 125, 95];
  let stroke = [43, 54, 39];

  if (themeIndex === 0) {
    width = 46 + randRange(30); height = 46 + randRange(30);
    kind = '树木'; fill = [70, 136, 68]; stroke = [31, 73, 38];
  } else if (themeIndex === 1) {
    width = 96 + randRange(54); height = 42 + randRange(32);
    kind = '办公桌'; fill = [118, 103, 82]; stroke = [58, 49, 38];
  } else if (themeIndex === 2) {
    width = 54 + randRange(32); height = 118 + randRange(52);
    kind = '书架'; fill = [112, 78, 105]; stroke = [54, 38, 58];
  } else if (themeIndex === 3) {
    width = 108 + randRange(54); height = 48 + randRange(34);
    kind = '实验桌'; fill = [70, 116, 126]; stroke = [35, 66, 74];
  } else if (themeIndex === 4) {
    width = 70 + randRange(42); height = 78 + randRange(54);
    kind = '写字楼'; fill = [132, 116, 91]; stroke = [67, 56, 43];
  } else if (themeIndex === 5) {
    width = 58 + randRange(34); height = 118 + randRange(54);
    kind = '书架'; fill = [111, 105, 137]; stroke = [55, 53, 78];
  } else if (themeIndex === 6) {
    width = 96 + randRange(42); height = 48 + randRange(24);
    kind = '汽车'; fill = [72, 137, 166]; stroke = [33, 73, 92];
  } else if (themeIndex === 7) {
    width = 40 + randRange(34); height = 34 + randRange(30);
    kind = '花草'; fill = [101, 154, 92]; stroke = [57, 91, 53];
  }

  const x = 72 + randRange(Math.max(1, W - 144 - width));
  const y = 98 + randRange(Math.max(1, H - 170 - height));

  return {
    bounds: { left: x, top: y, right: x + width, bottom: y + height, width, height },
    kind, spriteIndex: themeIndex, fill, stroke
  };
}

function canPlaceObstacle(candidate) {
  const candidateBounds = obstacleCollisionBounds(candidate);
  const padded = inflateRect(candidateBounds, 30, 30);
  if (padded.top < 78 || padded.left < 42 || padded.right > W - 42 || padded.bottom > H - 48) return false;
  if (pointInRect(player.pos, padded)) return false;
  if (distancePointToRect(player.pos, candidateBounds) < 150) return false;

  const startArea = { left: W / 2 - 95, top: H / 2 + 95, right: W / 2 + 95, bottom: H / 2 + 245 };
  const centerArea = { left: W / 2 - 100, top: H / 2 - 80, right: W / 2 + 100, bottom: H / 2 + 80 };
  if (rectsIntersect(candidateBounds, startArea) || rectsIntersect(candidateBounds, centerArea)) return false;

  for (const obstacle of obstacles) {
    if (rectsIntersect(padded, obstacleCollisionBounds(obstacle))) return false;
  }
  return true;
}

function roomNavigationIsValid() {
  const cell = 40;
  const cols = Math.floor((W - 96) / cell);
  const rows = Math.floor((H - 140) / cell);
  const blocked = new Array(cols);
  let totalWalkable = 0;
  let startX = -1, startY = -1;

  for (let x = 0; x < cols; x++) {
    blocked[x] = new Array(rows);
    for (let y = 0; y < rows; y++) {
      const center = new Vec2(48 + x * cell + cell / 2, 82 + y * cell + cell / 2);
      blocked[x][y] = isCircleBlocked(center, 18);
      if (!blocked[x][y]) {
        totalWalkable++;
        if (startX < 0 || dist(center.x, center.y, player.pos.x, player.pos.y) <
            dist(48 + startX * cell + cell / 2, 82 + startY * cell + cell / 2, player.pos.x, player.pos.y)) {
          startX = x; startY = y;
        }
      }
    }
  }

  if (totalWalkable < cols * rows * 0.62 || startX < 0) return false;

  const seen = new Array(cols);
  for (let x = 0; x < cols; x++) seen[x] = new Array(rows).fill(false);
  const queue = [[startX, startY]];
  seen[startX][startY] = true;
  let visited = 0;

  while (queue.length > 0) {
    const p = queue.pop();
    visited++;
    tryVisitCell(p[0] + 1, p[1], cols, rows, blocked, seen, queue);
    tryVisitCell(p[0] - 1, p[1], cols, rows, blocked, seen, queue);
    tryVisitCell(p[0], p[1] + 1, cols, rows, blocked, seen, queue);
    tryVisitCell(p[0], p[1] - 1, cols, rows, blocked, seen, queue);
  }

  return visited >= totalWalkable * 0.9;
}

function tryVisitCell(x, y, cols, rows, blocked, seen, queue) {
  if (x < 0 || y < 0 || x >= cols || y >= rows) return;
  if (blocked[x][y] || seen[x][y]) return;
  seen[x][y] = true;
  queue.push([x, y]);
}

function inflateRect(rect, ix, iy) {
  return { left: rect.left - ix, top: rect.top - iy, right: rect.right + ix, bottom: rect.bottom + iy,
    width: rect.right - rect.left + ix * 2, height: rect.bottom - rect.top + iy * 2 };
}

function isCircleBlocked(center, radius) {
  if (center.x - radius < 34 || center.x + radius > W - 34) return true;
  if (center.y - radius < 66 || center.y + radius > H - 34) return true;
  for (const obstacle of obstacles) {
    if (circleIntersectsRect(center, radius, obstacleCollisionBounds(obstacle))) return true;
  }
  return false;
}

function obstacleCollisionBounds(obstacle) {
  const b = obstacle.bounds;
  const insetX = Math.min(6, b.width * 0.05);
  const insetY = Math.min(6, b.height * 0.05);
  return { left: b.left + insetX, top: b.top + insetY, right: b.right - insetX, bottom: b.bottom - insetY,
    width: b.width - insetX * 2, height: b.height - insetY * 2 };
}

function obstacleVisualSlot(obstacle) {
  const b = obstacle.bounds;
  const minSide = Math.max(1, Math.min(b.width, b.height));
  let scale = Math.min(2.85, Math.max(1.45, 112 / minSide));
  if (obstacle.kind === '花草') scale = Math.min(2.7, Math.max(1.7, 92 / minSide));
  if (obstacle.kind === '树木') scale = Math.min(2.7, Math.max(1.55, 104 / minSide));
  const width = b.width * scale;
  const height = b.height * scale;
  return { left: b.left + (b.width - width) / 2, top: b.top + (b.height - height) / 2,
    right: b.left + (b.width - width) / 2 + width, bottom: b.top + (b.height - height) / 2 + height,
    width, height };
}

function moveCircle(start, delta, radius) {
  let blocked = false;
  const steps = Math.max(1, Math.ceil(delta.len() / 12));
  const step = delta.mul(1 / steps);
  let pos = start;
  for (let i = 0; i < steps; i++) {
    const nextX = new Vec2(pos.x + step.x, pos.y);
    if (!isCircleBlocked(nextX, radius)) pos = nextX;
    else blocked = true;
    const nextY = new Vec2(pos.x, pos.y + step.y);
    if (!isCircleBlocked(nextY, radius)) pos = nextY;
    else blocked = true;
  }
  return { pos, blocked };
}

function ensurePlayerNotStuck() {
  if (!isCircleBlocked(player.pos, player.radius)) return;
  const original = player.pos;
  for (let ring = 1; ring <= 9; ring++) {
    const distance = ring * 18;
    for (let i = 0; i < 24; i++) {
      const angle = Math.PI * 2 * i / 24;
      const candidate = original.add(new Vec2(Math.cos(angle), Math.sin(angle)).mul(distance));
      if (!isCircleBlocked(candidate, player.radius)) {
        player.pos = candidate;
        addFloat('脱离卡位', player.pos.add(new Vec2(-20, -30)), [180, 230, 255]);
        return;
      }
    }
  }
  player.pos = new Vec2(W / 2, H / 2 + 160);
}

function circleIntersectsRect(center, radius, rect) {
  const closestX = clamp(center.x, rect.left, rect.right);
  const closestY = clamp(center.y, rect.top, rect.bottom);
  const dx = center.x - closestX;
  const dy = center.y - closestY;
  return dx * dx + dy * dy <= radius * radius;
}

function distancePointToRect(point, rect) {
  const dx = Math.max(Math.max(rect.left - point.x, 0), point.x - rect.right);
  const dy = Math.max(Math.max(rect.top - point.y, 0), point.y - rect.bottom);
  return Math.sqrt(dx * dx + dy * dy);
}

function rectsIntersect(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function pointInRect(p, r) {
  return p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
}
/* ============================================================
 * 第三部分：更新循环、战斗、暴怒、掉落、奖励
 * ============================================================ */

function tick(dt) {
  if (state === STATE.PLAYING) {
    updatePlaying(dt);
  } else if (state === STATE.ROOMCLEAR) {
    clearDelay -= dt;
    updatePlayer(dt);
    updateDrops(dt);
    updateFloatingText(dt);
    if (clearDelay <= 0) startRoom(true);
  }
}

function updatePlaying(dt) {
  roomTime += dt;
  updatePlayer(dt);
  updateMonsters(dt);
  updateProjectiles(dt);
  updateEnemyProjectiles(dt);
  updateDrops(dt);
  updateFloatingText(dt);

  if (monsters.length === 0) {
    onRoomCleared();
  }

  if (player.hp <= 0) {
    for (const m of monsters) m.entry.deathCount = (m.entry.deathCount || 0) + 1;
    state = STATE.GAMEOVER;
    message = '探险失败。按 Enter 回到主菜单。';
    saveData.hasContinue = false;
    saveGame();
  }

  if (mouseLeftDown && player.heldMeaning.length > 0) {
    mouseLeftDown = false;
  }
}

function updatePlayer(dt) {
  const input = getMoveInput();
  if (Math.abs(input.x) > 0.05 || Math.abs(input.y) > 0.05) {
    lastMoveDir = input;
    walkAnimTime += dt;
    if (Math.abs(input.x) > Math.abs(input.y)) {
      playerFacing = input.x < 0 ? 1 : 2;
    } else {
      playerFacing = input.y < 0 ? 3 : 0;
    }
  } else {
    walkAnimTime = 0;
    updateFacingFromAim(false);
  }
  let speed = player.speed;
  if (player.speedBoost > 0) speed *= 1.35;
  const moved = moveCircle(player.pos, input.mul(speed * dt), player.radius);
  player.pos = moved.pos;
  player.pos.x = clamp(player.pos.x, 48, W - 48);
  player.pos.y = clamp(player.pos.y, 78, H - 48);
  if (player.dashTimer > 0) player.dashTimer -= dt;
  if (player.invulnerable > 0) player.invulnerable -= dt;
  if (player.speedBoost > 0) player.speedBoost -= dt;
  if (player.shieldTime > 0) player.shieldTime -= dt;
  if (dashAnimTime > 0) dashAnimTime -= dt;
  if (fireAnimTime > 0) fireAnimTime -= dt;
  ensurePlayerNotStuck();
}

function getMoveInput() {
  let x = 0, y = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
  return new Vec2(x, y).normalized();
}

function facingVector() {
  if (playerFacing === 1) return new Vec2(-1, 0);
  if (playerFacing === 2) return new Vec2(1, 0);
  if (playerFacing === 3) return new Vec2(0, -1);
  return new Vec2(0, 1);
}

function updateFacingFromAim(force) {
  const aim = new Vec2(mouse.x - player.pos.x, mouse.y - player.pos.y).normalized();
  if (!force && aim.len() < 0.001) return;
  if (Math.abs(aim.x) > Math.abs(aim.y)) {
    playerFacing = aim.x < 0 ? 1 : 2;
  } else {
    playerFacing = aim.y < 0 ? 3 : 0;
  }
}

function updateMonsters(dt) {
  for (let i = 0; i < monsters.length; i++) {
    const m = monsters[i];
    if (m.rageTimer > 0) {
      m.rageTimer -= dt;
      if (m.rageTimer <= 0) {
        m.rageTimer = 0;
        addFloat('怒气消退', m.pos.add(new Vec2(0, -44)), [230, 220, 190]);
      }
    } else if (m.ragePower > 0) {
      m.ragePower = Math.max(0, m.ragePower - dt * 0.4);
    }
    const rageMul = 1 + m.ragePower * 1.15;
    let speed = 55 + room * 3 + m.entry.difficulty * 8;
    if (m.kind === KIND.CHASER) speed += 28;
    if (m.kind === KIND.GHOST) speed += 38;
    speed *= rageMul;
    if (roomDifficultyScale < 0.95) speed *= 0.85;
    if (roomDifficultyScale > 1.1) speed *= 1.12;

    const toPlayer = player.pos.sub(m.pos).normalized();
    if (m.kind === KIND.WANDERER || m.kind === KIND.SHIELD) {
      m.thinkTimer -= dt;
      if (m.thinkTimer <= 0) {
        const a = Math.random() * Math.PI * 2;
        m.vel = new Vec2(Math.cos(a), Math.sin(a));
        m.thinkTimer = 0.8 + Math.random() * 1.4;
      }
      if (dist(m.pos.x, m.pos.y, player.pos.x, player.pos.y) < 180) {
        m.vel = m.vel.mul(0.75).add(toPlayer.mul(0.25)).normalized();
      }
    } else if (m.kind === KIND.CHASER || m.kind === KIND.GHOST) {
      m.vel = m.vel.mul(0.82).add(toPlayer.mul(0.18)).normalized();
    } else if (m.kind === KIND.DASHER) {
      if (m.dashWindup > 0) {
        m.dashWindup -= dt;
        if (m.dashWindup <= 0) m.vel = toPlayer.mul(4.2);
      } else {
        m.thinkTimer -= dt;
        m.vel = m.vel.mul(0.94);
        if (m.thinkTimer <= 0 && dist(m.pos.x, m.pos.y, player.pos.x, player.pos.y) < 360) {
          m.dashWindup = 0.55;
          m.thinkTimer = 2.2;
        } else if (m.vel.len() < 0.1) {
          m.vel = toPlayer.mul(0.45);
        }
      }
    }

    if (m.rageTimer > 0) {
      m.vel = m.vel.mul(0.55).add(toPlayer.mul(0.45)).normalized();
    }

    const moved = moveCircle(m.pos, m.vel.mul(speed * dt), m.radius);
    m.pos = moved.pos;
    if (m.vel.x > 0.05) m.facingRight = true;
    else if (m.vel.x < -0.05) m.facingRight = false;
    if (moved.blocked) m.vel = m.vel.mul(-0.6);
    if (m.pos.x < 48 || m.pos.x > W - 48) m.vel.x *= -1;
    if (m.pos.y < 82 || m.pos.y > H - 52) m.vel.y *= -1;
    m.pos.x = clamp(m.pos.x, 48, W - 48);
    m.pos.y = clamp(m.pos.y, 82, H - 52);

    const touch = dist(m.pos.x, m.pos.y, player.pos.x, player.pos.y);
    if (touch < m.radius + player.radius && player.invulnerable <= 0) {
      let damage = 12 + m.entry.difficulty * 1.8;
      damage *= 1 + m.ragePower;
      damage *= 1 - player.defense;
      if (player.shieldTime > 0) damage *= 0.55;
      player.hp -= damage;
      player.invulnerable = 0.55;
      collisions++;
      addFloat('-' + Math.floor(damage), player.pos.add(new Vec2(0, -24)), [255, 115, 115]);
      const push = player.pos.sub(m.pos).normalized();
      const p = push.len() < 0.001 ? new Vec2(1, 0) : push;
      const pushed = moveCircle(player.pos, p.mul(34), player.radius);
      player.pos = pushed.pos;
      ensurePlayerNotStuck();
    }

    updateMonsterShooting(m, dt);
  }
}

function updateMonsterShooting(m, dt) {
  if (!isEliteMonster(m)) return;
  m.shootTimer -= dt;
  const distance = dist(m.pos.x, m.pos.y, player.pos.x, player.pos.y);
  if (m.shootTimer > 0 || distance > 520 || distance < 70) return;
  if (!hasLineOfSight(m.pos, player.pos)) return;

  const dir = player.pos.sub(m.pos).normalized();
  const bullet = {
    pos: m.pos.add(dir.mul(m.radius + 12)),
    vel: dir.mul(210 + room * 8 + m.entry.difficulty * 12),
    life: 3.2, damage: 9 + m.entry.difficulty * 1.6
  };
  enemyProjectiles.push(bullet);

  if (m.rageTimer > 0) {
    const angle = Math.atan2(dir.y, dir.x);
    const sideDir = new Vec2(Math.cos(angle - 0.16), Math.sin(angle - 0.16));
    const extra = {
      pos: m.pos.add(sideDir.mul(m.radius + 12)),
      vel: sideDir.mul(210 + room * 8 + m.entry.difficulty * 12).mul(1.08),
      life: 3.2, damage: 9 + m.entry.difficulty * 1.6
    };
    enemyProjectiles.push(extra);
  }

  const fireRate = m.rageTimer > 0 ? Math.max(0.45, 1 - m.ragePower * 0.5) : 1;
  m.shootTimer = Math.max(0.55, Math.max(1.25, 3.3 - room * 0.08 - m.entry.difficulty * 0.08) * fireRate);
  addFloat('精英弹幕', m.pos.add(new Vec2(-22, -42)), [255, 156, 116]);
}

function isEliteMonster(m) {
  return m.maxHp >= 2 || m.kind === KIND.SHIELD || m.entry.difficulty >= 5;
}

function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.pos = p.pos.add(p.vel.mul(dt));
    p.life -= dt;
    let remove = p.life <= 0 || p.pos.x < -40 || p.pos.x > W + 40 || p.pos.y < -40 || p.pos.y > H + 40;
    if (!remove && projectileHitsObstacle(p)) {
      addFloat('被障碍挡住', p.pos.add(new Vec2(-18, -22)), [230, 220, 150]);
      remove = true;
    }

    if (!remove) {
      for (let j = monsters.length - 1; j >= 0; j--) {
        const m = monsters[j];
        if (p.hit.has(m)) continue;
        if (dist(p.pos.x, p.pos.y, m.pos.x, m.pos.y) < m.radius + 9) {
          p.hit.add(m);
          const effective = resolveHit(p, m);
          if (effective) {
            p.returnOnMiss = false;
            if (!p.piercing) remove = true;
          } else {
            returnProjectileMeaning(p);
            remove = true;
          }
          if (monsters.length === 0) break;
        }
      }
    }

    if (remove) {
      returnProjectileMeaning(p);
      projectiles.splice(i, 1);
    }
  }
}

function projectileHitsObstacle(p) {
  for (const obstacle of obstacles) {
    if (circleIntersectsRect(p.pos, 8, obstacleCollisionBounds(obstacle))) return true;
  }
  return false;
}

function updateEnemyProjectiles(dt) {
  for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
    const bullet = enemyProjectiles[i];
    bullet.pos = bullet.pos.add(bullet.vel.mul(dt));
    bullet.life -= dt;
    let remove = bullet.life <= 0 || bullet.pos.x < -30 || bullet.pos.x > W + 30 || bullet.pos.y < -30 || bullet.pos.y > H + 30;

    if (!remove && enemyProjectileHitsObstacle(bullet)) remove = true;

    if (!remove && dist(bullet.pos.x, bullet.pos.y, player.pos.x, player.pos.y) < player.radius + 9 && player.invulnerable <= 0) {
      let damage = bullet.damage * (1 - player.defense);
      if (player.shieldTime > 0) damage *= 0.55;
      player.hp -= damage;
      player.invulnerable = 0.42;
      collisions++;
      addFloat('弹幕 -' + Math.floor(damage), player.pos.add(new Vec2(-8, -34)), [255, 132, 108]);
      remove = true;
    }

    if (remove) enemyProjectiles.splice(i, 1);
  }
}

function enemyProjectileHitsObstacle(bullet) {
  for (const obstacle of obstacles) {
    if (circleIntersectsRect(bullet.pos, 8, obstacleCollisionBounds(obstacle))) return true;
  }
  return false;
}

function hasLineOfSight(from, to) {
  const delta = to.sub(from);
  const len = delta.len();
  if (len < 0.001) return true;
  const step = delta.normalized().mul(18);
  const steps = Math.floor(len / 18);
  let p = from;
  for (let i = 0; i < steps; i++) {
    p = p.add(step);
    for (const obstacle of obstacles) {
      if (circleIntersectsRect(p, 8, obstacleCollisionBounds(obstacle))) return false;
    }
  }
  return true;
}

function resolveHit(p, m) {
  const correct = p.universal || p.meaning === m.entry.meaning;
  if (correct) {
    correctHits++;
    saveData.totalCorrect++;
    if (!p.universal) {
      m.entry.correctCount = (m.entry.correctCount || 0) + 1;
      m.entry.mastery = Math.min(10, (m.entry.mastery || 0) + 1);
    }
    combo++;
    streakWrong = 0;

    if (m.shieldUp) {
      m.shieldUp = false;
      addFloat(p.universal ? '回声破盾' : '破盾', m.pos.add(new Vec2(0, -36)), [122, 211, 255]);
      triggerRage(m, 0.15, 0.9);
      return true;
    }

    triggerRage(m, 0.25, 1.6);
    let damage = m.maxHp >= 2 ? 1 : 99;
    if (combo >= 3) {
      damage += 1;
      player.hp = Math.min(player.maxHp, player.hp + 4);
      addFloat('连击+' + combo, player.pos.add(new Vec2(0, -34)), [148, 255, 166]);
    }
    m.hp -= damage;
    playSound('hit_correct');
    addFloat(p.universal ? '回声命中' : '正确：' + m.entry.meaning, m.pos.add(new Vec2(0, -38)), [152, 245, 180]);
    if (m.hp <= 0) killMonster(m);
    return true;
  } else {
    wrongHits++;
    saveData.totalWrong++;
    m.entry.wrongCount = (m.entry.wrongCount || 0) + 1;
    m.entry.mastery = Math.max(0, (m.entry.mastery || 0) - 1);
    combo = 0;
    streakWrong++;
    triggerRage(m, 0.5, 3);
    m.hp -= 0.15;
    addFloat('错配！' + m.entry.word + ' = ' + m.entry.meaning, m.pos.add(new Vec2(0, -38)), [255, 210, 94]);
    if (streakWrong >= 2) {
      roomDifficultyScale += 0.08;
      addFloat('房间躁动', new Vec2(W / 2 - 40, 120), [255, 130, 130]);
      streakWrong = 0;
    }
    return false;
  }
}

/* 怪物被射击后暴怒：
 * - 任何命中都会积累怒气 power 并刷新暴怒时长
 * - 正确命中 +0.25 / 1.6s，破盾 +0.15 / 0.9s，错配 +0.5 / 3s
 * - 暴怒中：移速×（1+怒气*1.15）、更凶狠追击、接触伤害提升、
 *   精英双发弹幕且射速更快；暴怒·MAX 时效果最强 */
function triggerRage(m, power, duration) {
  const wasCalm = m.rageTimer <= 0;
  m.rageTimer = Math.max(m.rageTimer, duration);
  m.ragePower = Math.min(1, m.ragePower + power);
  if (wasCalm) {
    addFloat('暴怒！', m.pos.add(new Vec2(0, -56)), [255, 96, 72]);
  }
}

function returnProjectileMeaning(p) {
  if (!p.returnOnMiss || p.universal || !p.meaning || monsters.length === 0) return;
  const correctForRemaining = monsters.some(m => m.entry.meaning === p.meaning);
  const token = addMeaningToken(p.meaning, correctForRemaining);
  p.returnOnMiss = false;
  addFloat('词块刷新：' + p.meaning, token.pos.add(new Vec2(-22, -28)), [236, 224, 132]);
}

function killMonster(m) {
  addFloat('记住 ' + m.entry.word, m.pos.add(new Vec2(0, -58)), [255, 255, 255]);
  const lastMonster = monsters.length === 1;
  if (Math.random() < 0.16 + player.luck) {
    const kind = randomDropKind();
    if (lastMonster) autoCollectFinalDrop(kind, m.pos);
    else drops.push({ kind, pos: m.pos, life: 16 });
  }
  monsters.splice(monsters.indexOf(m), 1);
}

const DROP_KEYS = Object.keys(DROP);
function randomDropKind() {
  return DROP_KEYS[randRange(DROP_KEYS.length)];
}

function autoCollectFinalDrop(kind, pos) {
  applyDrop(kind);
  addFloat('自动拾取：' + dropDisplayName(kind), pos.add(new Vec2(-26, -30)), [255, 226, 117]);
}

function dropDisplayName(kind) {
  switch (kind) {
    case DROP.APPLE: return '苹果';
    case DROP.COFFEE: return '咖啡';
    case DROP.SHIELDPOTION: return '护盾';
    case DROP.INK: return '穿透墨水';
    case DROP.BOOTS: return '风之靴';
    case DROP.FEATHER: return '轻羽';
    case DROP.GLOVES: return '磁力手套';
  }
  return '道具';
}

function updateDrops(dt) {
  for (let i = drops.length - 1; i >= 0; i--) {
    drops[i].life -= dt;
    if (dist(drops[i].pos.x, drops[i].pos.y, player.pos.x, player.pos.y) < 34) {
      applyDrop(drops[i].kind);
      drops.splice(i, 1);
      continue;
    }
    if (drops[i].life <= 0) drops.splice(i, 1);
  }
}

function updateFloatingText(dt) {
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    floatingTexts[i].life -= dt;
    floatingTexts[i].pos.y -= 24 * dt;
    if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
  }
}

function tryDash() {
  if (player.dashTimer > 0 || (state !== STATE.PLAYING && state !== STATE.ROOMCLEAR)) return;
  let dir = getMoveInput();
  if (dir.len() < 0.001) dir = lastMoveDir;
  if (dir.len() < 0.001) dir = facingVector();
  const moved = moveCircle(player.pos, dir.mul(128), player.radius);
  player.pos = moved.pos;
  player.pos.x = clamp(player.pos.x, 48, W - 48);
  player.pos.y = clamp(player.pos.y, 78, H - 48);
  player.dashTimer = player.dashCooldown;
  player.invulnerable = 0.28;
  dashAnimTime = 0.22;
}

function tryInteract() {
  if (state === STATE.ROOMCLEAR) {
    clearDelay = 0;
    return;
  }

  let best = null;
  let bestDist = player.pickupRange;
  for (const token of meanings) {
    const d = dist(token.pos.x, token.pos.y, player.pos.x, player.pos.y);
    if (d < bestDist) { best = token; bestDist = d; }
  }
  if (best) {
    if (player.heldMeaning.length > 0) dropHeldMeaning();
    player.heldMeaning = best.meaning;
    meanings.splice(meanings.indexOf(best), 1);
    addFloat('拾取：' + best.meaning, player.pos.add(new Vec2(0, -30)), [234, 239, 156]);
    return;
  }

  for (const chest of chests) {
    if (!chest.opened && dist(chest.pos.x, chest.pos.y, player.pos.x, player.pos.y) < 46) {
      chest.opened = true;
      openChest();
      return;
    }
  }

  if (player.heldMeaning.length > 0 && monsters.length > 0) {
    dropHeldMeaning();
  }
}

function dropHeldMeaning() {
  if (!player.heldMeaning) return;
  const correctForRemaining = monsters.some(m => m.entry.meaning === player.heldMeaning);
  const pos = findDropPositionNearPlayer();
  addMeaningTokenAt(player.heldMeaning, correctForRemaining, pos);
  addFloat('脱落：' + player.heldMeaning, pos.add(new Vec2(-20, -30)), [236, 224, 132]);
  player.heldMeaning = '';
}

function findDropPositionNearPlayer() {
  return findMeaningTokenPositionNear(player.heldMeaning, player.pos);
}

function usePotion() {
  if (player.shieldTime <= 0) {
    player.shieldTime = 5;
    addFloat('护盾药剂', player.pos.add(new Vec2(0, -34)), [124, 205, 255]);
  }
}

function fireHeldMeaning(echo) {
  if (!player.heldMeaning) return;
  const dir = getAimDirection();
  if (dir.len() < 0.001) return;
  updateFacingFromAim(true);
  const p = {
    meaning: player.heldMeaning,
    pos: getMuzzlePosition(dir),
    vel: dir.mul(player.throwSpeed),
    life: 1.55,
    piercing: player.piercingInk,
    universal: false,
    returnOnMiss: true,
    hit: new Set()
  };
  projectiles.push(p);
  fireAnimTime = 0.16;

  if (player.echoScroll && !echo) {
    const p2 = {
      meaning: '回声',
      pos: getMuzzlePosition(dir).add(new Vec2(-dir.y, dir.x).mul(11)),
      vel: dir.mul(0.94).add(new Vec2(-dir.y, dir.x).mul(0.15)).normalized().mul(player.throwSpeed * 0.95),
      life: 1.45,
      piercing: player.piercingInk,
      universal: true,
      returnOnMiss: false,
      hit: new Set()
    };
    projectiles.push(p2);
  }
  player.heldMeaning = '';
}

function getAimDirection() {
  const dir = new Vec2(mouse.x - player.pos.x, mouse.y - player.pos.y).normalized();
  if (dir.len() < 0.001) return new Vec2(1, 0);
  return dir;
}

function getMuzzlePosition(dir) {
  const recoil = fireAnimTime > 0 ? 5 : 0;
  return player.pos.add(dir.mul(42 - recoil)).add(new Vec2(0, -8));
}

function applyDrop(kind) {
  if (kind === DROP.APPLE) {
    player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.3);
    addFloat('苹果 +HP', player.pos.add(new Vec2(0, -30)), [160, 255, 174]);
  } else if (kind === DROP.COFFEE) {
    player.speedBoost = 7;
    addFloat('咖啡 加速', player.pos.add(new Vec2(0, -30)), [234, 192, 126]);
  } else if (kind === DROP.SHIELDPOTION) {
    player.shieldTime = 10;
    addFloat('护盾 10s', player.pos.add(new Vec2(0, -30)), [124, 205, 255]);
  } else if (kind === DROP.INK) {
    grantPiercingInk('穿透墨水 3间');
  } else if (kind === DROP.BOOTS) {
    grantSpeedBonus(18, '风之靴 3间');
  } else if (kind === DROP.FEATHER) {
    grantDashBonus(0.12, '轻羽 3间');
  } else if (kind === DROP.GLOVES) {
    grantPickupBonus(18, '磁力手套 3间');
  }
  saveContinueState();
}

function openChest() {
  const choice = randRange(3);
  if (choice === 0) {
    grantSpeedBonus(22, '宝箱：移速 3间');
    message = '宝箱：移动速度提升 3间';
  } else if (choice === 1) {
    grantThrowBonus(90, '宝箱：弹速 3间');
    message = '宝箱：中文词义弹丸速度提升 3间';
  } else {
    grantEchoScroll('宝箱：回声卷轴 3间');
    message = '宝箱：回声卷轴生效 3间';
  }
  saveContinueState();
}

function grantSpeedBonus(amount, label) {
  if (tempSpeedBonus <= 0) {
    player.speed += amount;
    tempSpeedBonus = amount;
  } else if (amount > tempSpeedBonus) {
    player.speed += amount - tempSpeedBonus;
    tempSpeedBonus = amount;
  }
  speedBoostRooms = 3;
  addFloat(label, player.pos.add(new Vec2(-30, -42)), [159, 225, 255]);
}

function grantThrowBonus(amount, label) {
  if (tempThrowBonus <= 0) {
    player.throwSpeed += amount;
    tempThrowBonus = amount;
  } else if (amount > tempThrowBonus) {
    player.throwSpeed += amount - tempThrowBonus;
    tempThrowBonus = amount;
  }
  throwBoostRooms = 3;
  addFloat(label, player.pos.add(new Vec2(-30, -42)), [255, 226, 117]);
}

function grantDashBonus(amount, label) {
  if (tempDashBonus <= 0) {
    player.dashCooldown -= amount;
    tempDashBonus = amount;
  } else if (amount > tempDashBonus) {
    player.dashCooldown -= amount - tempDashBonus;
    tempDashBonus = amount;
  }
  dashBoostRooms = 3;
  addFloat(label, player.pos.add(new Vec2(-30, -42)), [196, 255, 214]);
}

function grantPickupBonus(amount, label) {
  if (tempPickupBonus <= 0) {
    player.pickupRange += amount;
    tempPickupBonus = amount;
  } else if (amount > tempPickupBonus) {
    player.pickupRange += amount - tempPickupBonus;
    tempPickupBonus = amount;
  }
  pickupBoostRooms = 3;
  addFloat(label, player.pos.add(new Vec2(-30, -42)), [255, 196, 132]);
}

function grantPiercingInk(label) {
  player.piercingInk = true;
  piercingInkRooms = 3;
  addFloat(label, player.pos.add(new Vec2(-30, -42)), [178, 210, 255]);
}

function grantEchoScroll(label) {
  player.echoScroll = true;
  echoScrollRooms = 3;
  addFloat(label, player.pos.add(new Vec2(-30, -42)), [226, 210, 255]);
}

function prepareRewardCards() {
  rewardCards = [];
  const hpPercent = 0.2 + Math.random() * 0.3;
  const hpText = Math.round(hpPercent * 100);
  rewardCards.push({ kind: REWARD.SURVIVAL, category: '生存类', title: '生命补给', description: '最大生命和当前生命 +' + hpText + '%', value: hpPercent });

  if (Math.random() < 0.5) {
    rewardCards.push({ kind: REWARD.MOVESPEED, category: '防御类', title: '机动步伐', description: '移动速度永久 +14', value: 14 });
  } else {
    rewardCards.push({ kind: REWARD.SHIELD, category: '防御类', title: '能量护盾', description: '减伤提升并获得护盾', value: 0.06 });
  }

  const item = randRange(3);
  if (item === 0) rewardCards.push({ kind: REWARD.CHESTSPEED, category: '道具类', title: '风箱补给', description: '获得宝箱移速道具 3间', value: 22 });
  else if (item === 1) rewardCards.push({ kind: REWARD.CHESTTHROW, category: '道具类', title: '弹药校准', description: '获得宝箱弹速道具 3间', value: 90 });
  else rewardCards.push({ kind: REWARD.CHESTECHO, category: '道具类', title: '回声卷轴', description: '获得回声卷轴 3间', value: 0 });
}

function chooseReward(index) {
  if (state !== STATE.REWARD || index < 0 || index >= rewardCards.length) return;
  const card = rewardCards[index];
  applyReward(card);
  rewardCards = [];
  state = STATE.PLAYING;
  message = '奖励生效：' + card.title;
  saveContinueState();
}

function applyReward(card) {
  if (card.kind === REWARD.SURVIVAL) {
    const gain = player.maxHp * card.value;
    player.maxHp += gain;
    player.hp = Math.min(player.maxHp, player.hp + gain);
    addFloat('生命 +' + Math.round(gain), player.pos.add(new Vec2(-20, -42)), [160, 255, 174]);
  } else if (card.kind === REWARD.MOVESPEED) {
    player.speed += card.value;
    addFloat('移速 +' + Math.round(card.value), player.pos.add(new Vec2(-20, -42)), [159, 225, 255]);
  } else if (card.kind === REWARD.SHIELD) {
    player.defense = Math.min(0.35, player.defense + card.value);
    player.shieldTime = Math.max(player.shieldTime, 12);
    addFloat('护盾强化', player.pos.add(new Vec2(-20, -42)), [124, 205, 255]);
  } else if (card.kind === REWARD.CHESTSPEED) {
    grantSpeedBonus(card.value, '奖励：移速 3间');
  } else if (card.kind === REWARD.CHESTTHROW) {
    grantThrowBonus(card.value, '奖励：弹速 3间');
  } else if (card.kind === REWARD.CHESTECHO) {
    grantEchoScroll('奖励：回声卷轴 3间');
  }
}

function onRoomCleared() {
  const total = correctHits + wrongHits;
  const accuracy = total === 0 ? 1 : correctHits / total;
  if (accuracy >= 0.8 && collisions <= 1 && roomTime < 80) {
    roomDifficultyScale = Math.min(1.35, roomDifficultyScale + 0.08);
    message = '清房漂亮：下一间更有挑战';
  } else if (accuracy < 0.5 || collisions >= 4 || roomTime > 100) {
    roomDifficultyScale = Math.max(0.74, roomDifficultyScale - 0.12);
    player.hp = Math.min(player.maxHp, player.hp + 18);
    message = '系统降压：下间减少压迫并闪烁正确释义';
  } else {
    message = '房间清空。按 E 立刻进入下一间。';
  }

  const distinct = new Set(runWords.map(w => w.word)).size;
  if (distinct >= bankWords.length) {
    state = STATE.WIN;
    message = '词库清空，通关！按 Enter 回到主菜单。';
    saveData.bestRoom = Math.max(saveData.bestRoom, room);
    saveData.hasContinue = false;
    saveGame();
    return;
  }

  state = STATE.ROOMCLEAR;
  clearDelay = 2.2;
  saveData.bestRoom = Math.max(saveData.bestRoom, room);
  saveGame();
}

function addFloat(text, pos, rgb) {
  floatingTexts.push({ text, pos, life: 1.35, rgb });
}

function saveContinueState() {
  saveData.hasContinue = true;
  saveData.continueMode = selectedMode;
  saveData.continueModeName = selectedModeName;
  saveData.continueRoom = room;
  saveData.continueHp = Math.max(1, player.hp);
  saveData.continueSpeed = player.speed;
  saveData.continueDashCooldown = player.dashCooldown;
  saveData.continueThrowSpeed = player.throwSpeed;
  saveData.continuePickupRange = player.pickupRange;
  saveData.continueDefense = player.defense;
  saveData.continueLuck = player.luck;
  saveData.continuePiercingInkRooms = piercingInkRooms;
  saveData.continueEchoScrollRooms = echoScrollRooms;
  saveData.continueSpeedBoostRooms = speedBoostRooms;
  saveData.continueThrowBoostRooms = throwBoostRooms;
  saveData.continueDashBoostRooms = dashBoostRooms;
  saveData.continuePickupBoostRooms = pickupBoostRooms;
  saveData.continueTempSpeedBonus = tempSpeedBonus;
  saveData.continueTempThrowBonus = tempThrowBonus;
  saveData.continueTempDashBonus = tempDashBonus;
  saveData.continueTempPickupBonus = tempPickupBonus;
  saveData.words = collectWordStats();
  persistSave();
}

function saveGame() {
  saveData.bestRoom = Math.max(saveData.bestRoom, room);
  saveData.words = collectWordStats();
  persistSave();
}
/* ============================================================
 * 第四部分：渲染
 * ============================================================ */

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const FONT_UI = '"Microsoft YaHei UI","Microsoft YaHei","PingFang SC",sans-serif';
const FONT_WORD = '"Segoe UI",sans-serif';
let renderScale = 1, renderOffsetX = 0, renderOffsetY = 0;

function updateRenderViewport() {
  const sw = canvas.clientWidth, sh = canvas.clientHeight;
  renderScale = Math.max(0.1, Math.min(sw / W, sh / H));
  renderOffsetX = (sw - W * renderScale) / 2;
  renderOffsetY = (sh - H * renderScale) / 2;
}

function resizeCanvas() {
  const wrap = document.getElementById('wrap');
  const w = wrap.clientWidth, h = wrap.clientHeight;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  updateRenderViewport();
}

function css(rgb, alpha = 1) {
  return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + alpha + ')';
}

function roundRectPath(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCentered(text, font, rgb, y, alpha = 1) {
  ctx.save();
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = css(rgb, alpha);
  ctx.fillText(text, W / 2, y);
  ctx.restore();
}

function drawOutlinedText(text, font, x, y, fill, outline, align = 'left') {
  ctx.save();
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = outline;
  ctx.lineWidth = 3;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawHpBar(x, y, w, h, value, rgb) {
  ctx.fillStyle = 'rgba(20,20,28,0.75)';
  ctx.fillRect(x, y, w, h);
  const v = clamp01(value);
  if (v > 0) {
    ctx.fillStyle = css(rgb);
    ctx.fillRect(x, y, w * v, h);
  }
}

function drawMiniMeter(x, y, label, value, rgb) {
  ctx.save();
  ctx.font = '12px ' + FONT_UI;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = css(rgb);
  ctx.fillText(label, x - 6, y + 4);
  ctx.restore();
  drawHpBar(x, y, 74, 6, value, rgb);
}

function render() {
  updateRenderViewport();
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.translate(renderOffsetX, renderOffsetY);
  ctx.scale(renderScale, renderScale);

  if (state === STATE.MENU) {
    drawMenu();
  } else {
    drawGame();
    if (state === STATE.REWARD) drawRewardChoice();
    if (state === STATE.PAUSED) drawOverlayPanel('暂停', '按 Esc 继续');
    if (state === STATE.GAMEOVER) drawEndScreen('探险失败');
    if (state === STATE.WIN) drawEndScreen('通关结算');
    if (showBook && (state === STATE.PLAYING || state === STATE.ROOMCLEAR)) drawMemoryBook();
    if (state === STATE.PLAYING || state === STATE.ROOMCLEAR) drawCrosshair();
  }
  ctx.restore();
}

/* ---------- 主菜单 ---------- */
const MENU_DIFFS = [
  { max: 2, title: '简单', subtitle: '高中词汇', desc: '词汇较基础，节奏轻松' },
  { max: 4, title: '普通', subtitle: '四六级词汇', desc: '标准挑战，进阶词汇' },
  { max: 6, title: '困难', subtitle: '雅思词汇', desc: '高难词汇，怪物更凶' }
];

function menuDifficultyRect(i) {
  return { left: 150, top: 290 + i * 96, right: 560, bottom: 290 + i * 96 + 74 };
}

function menuStartRect() {
  return { left: 150, top: 588, right: 560, bottom: 588 + 56 };
}

function menuContinueRect() {
  return { left: 610, top: 588, right: 1000, bottom: 588 + 56 };
}

function drawMenu() {
  ctx.fillStyle = '#0b1018';
  ctx.fillRect(0, 0, W, H);
  drawStars();

  ctx.save();
  ctx.font = 'bold 54px ' + FONT_UI;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const grad = ctx.createLinearGradient(0, 90, 0, 190);
  grad.addColorStop(0, '#ffe9a3');
  grad.addColorStop(0.5, '#ffcf5c');
  grad.addColorStop(1, '#ff9d5c');
  ctx.fillStyle = grad;
  ctx.fillText('词域探险', W / 2, 120);
  ctx.font = '18px ' + FONT_UI;
  ctx.fillStyle = 'rgba(190,205,225,0.85)';
  ctx.fillText('Word Realm Roguelike · 网页版', W / 2, 168);
  ctx.restore();

  for (let i = 0; i < MENU_DIFFS.length; i++) {
    drawDifficultyButton(i, MENU_DIFFS[i]);
  }

  const start = menuStartRect();
  ctx.save();
  ctx.fillStyle = selectedMode >= 2 ? 'rgba(88,199,255,0.18)' : 'rgba(40,50,64,0.6)';
  roundRectPath(start.left, start.top, start.right - start.left, start.bottom - start.top, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,210,255,0.9)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = 'bold 22px ' + FONT_UI;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#dff4ff';
  ctx.fillText('开始冒险  ▶', (start.left + start.right) / 2, (start.top + start.bottom) / 2);
  ctx.restore();

  if (saveData && saveData.hasContinue) {
    const cont = menuContinueRect();
    ctx.save();
    ctx.fillStyle = 'rgba(120,220,160,0.14)';
    roundRectPath(cont.left, cont.top, cont.right - cont.left, cont.bottom - cont.top, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(140,230,170,0.85)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = 'bold 20px ' + FONT_UI;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#d9ffe6';
    ctx.fillText('继续游戏（第 ' + (saveData.continueRoom || 1) + ' 间）', (cont.left + cont.right) / 2, (cont.top + cont.bottom) / 2);
    ctx.restore();
  } else {
    const cont = menuContinueRect();
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    roundRectPath(cont.left, cont.top, cont.right - cont.left, cont.bottom - cont.top, 10);
    ctx.fill();
    ctx.font = '16px ' + FONT_UI;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(160,175,195,0.4)';
    ctx.fillText('（暂无存档）', (cont.left + cont.right) / 2, (cont.top + cont.bottom) / 2);
    ctx.restore();
  }

  ctx.save();
  ctx.font = '14px ' + FONT_UI;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(160,175,195,0.65)';
  ctx.fillText('WASD/方向键移动 · 鼠标瞄准 · 左键发射中文词块 · E 拾取 · Space 闪避 · Q 护盾 · Tab 记忆书 · F11 全屏', W / 2, 672);
  ctx.restore();
}

function drawDifficultyButton(i, diff) {
  const r = menuDifficultyRect(i);
  const selected = selectedMode === diff.max;
  ctx.save();
  ctx.fillStyle = selected ? 'rgba(88,199,255,0.22)' : 'rgba(38,48,64,0.55)';
  roundRectPath(r.left, r.top, r.right - r.left, r.bottom - r.top, 12);
  ctx.fill();
  ctx.strokeStyle = selected ? 'rgba(120,215,255,1)' : 'rgba(120,140,165,0.35)';
  ctx.lineWidth = selected ? 2.5 : 1.5;
  ctx.stroke();

  ctx.font = 'bold 24px ' + FONT_UI;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = selected ? '#e8f8ff' : '#c4d2e2';
  ctx.fillText(diff.title, r.left + 22, r.top + 26);
  ctx.font = '14px ' + FONT_UI;
  ctx.fillStyle = selected ? 'rgba(160,225,255,0.9)' : 'rgba(150,170,195,0.75)';
  ctx.fillText(diff.subtitle + '  ·  ' + diff.desc, r.left + 22, r.top + 52);

  if (selected) {
    ctx.font = '16px ' + FONT_UI;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#7fe0ff';
    ctx.fillText('✓', r.right - 20, r.top + 26);
  }
  ctx.restore();
}

function drawStars() {
  for (let i = 0; i < 90; i++) {
    const x = (i * 137.508) % W;
    const y = (i * 73.21) % (H * 0.55);
    const a = 0.08 + 0.16 * Math.abs(Math.sin(i * 12.9898 + roomTime * 0.7));
    ctx.fillStyle = 'rgba(255,255,255,' + a + ')';
    ctx.fillRect(x, y, 2, 2);
  }
}

/* ---------- 游戏场景 ---------- */
function drawGame() {
  const t = THEMES[(room - 1 + THEMES.length) % THEMES.length];
  if (!drawThemeBackground(t)) drawFloorFallback(t);
  drawObstacles();
  drawChests();
  drawMeanings();
  drawDrops();
  drawProjectiles();
  drawEnemyProjectiles();
  drawMonsters();
  drawPlayer();
  drawHud(t);
  drawFloating();
}

function drawThemeBackground(t) {
  const bg = images['bg_' + ((room - 1 + THEMES.length) % THEMES.length)];
  if (!bg || !bg.naturalWidth) return false;
  ctx.drawImage(bg, 0, 0, W, H);
  return true;
}

function drawFloorFallback(t) {
  ctx.fillStyle = css(t.floor);
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = css(t.wall);
  ctx.fillRect(0, 0, W, 58);
  ctx.fillRect(0, H - 30, W, 30);
  ctx.fillRect(0, 0, 28, H);
  ctx.fillRect(W - 28, 0, 28, H);
  drawFloorTiles(t);
}

function drawFloorTiles(t) {
  const tiles = images['tiles'];
  if (tiles && tiles.naturalWidth) {
    const themeIndex = (room - 1 + THEMES.length) % THEMES.length;
    const floorSrc = atlasRect(tiles, 4, 4, themeIndex);
    const wallSrc = atlasRect(tiles, 4, 4, 8 + themeIndex);
    for (let x = 28; x < W - 28; x += 128) {
      for (let y = 58; y < H - 30; y += 128) {
        ctx.drawImage(tiles, floorSrc.x, floorSrc.y, floorSrc.w, floorSrc.h, x, y, 128, 128);
      }
    }
    for (let x = 0; x < W; x += 128) {
      ctx.drawImage(tiles, wallSrc.x, wallSrc.y, wallSrc.w, wallSrc.h, x, 0, 128, 58);
      ctx.drawImage(tiles, wallSrc.x, wallSrc.y, wallSrc.w, wallSrc.h, x, H - 30, 128, 30);
    }
    for (let y = 0; y < H; y += 128) {
      ctx.drawImage(tiles, wallSrc.x, wallSrc.y, wallSrc.w, wallSrc.h, 0, y, 28, 128);
      ctx.drawImage(tiles, wallSrc.x, wallSrc.y, wallSrc.w, wallSrc.h, W - 28, y, 28, 128);
    }
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 28; x < W; x += 64) { ctx.moveTo(x, 58); ctx.lineTo(x, H - 30); }
  for (let y = 58; y < H; y += 64) { ctx.moveTo(28, y); ctx.lineTo(W - 28, y); }
  ctx.stroke();
}

function drawObstacles() {
  for (const obstacle of obstacles) {
    const r = obstacleVisualSlot(obstacle);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(r.left + 5 + (r.width - 10) / 2, r.bottom - 2, Math.max(8, r.width - 10) / 2, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    if (obstacle.kind === '树木') {
      ctx.fillStyle = css([98, 67, 43]);
      ctx.fillRect(r.left + r.width * 0.42, r.top + r.height * 0.46, r.width * 0.16, r.height * 0.42);
      ctx.fillStyle = css(obstacle.fill);
      ctx.beginPath();
      ctx.ellipse(r.left + r.width / 2, r.top + r.height * 0.34, r.width / 2, r.height * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = css(obstacle.stroke);
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (obstacle.kind === '花草') {
      ctx.fillStyle = css(obstacle.fill);
      ctx.beginPath();
      ctx.ellipse(r.left + r.width / 2, r.top + r.height / 2, r.width / 2, r.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = css(obstacle.stroke);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = 'rgba(230,134,160,1)';
      ctx.beginPath(); ctx.arc(r.left + r.width * 0.55, r.top + r.height * 0.24, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r.left + r.width * 0.28, r.top + r.height * 0.46, 3.5, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = css(obstacle.fill);
      roundRectPath(r.left, r.top, r.width, r.height, 6);
      ctx.fill();
      ctx.strokeStyle = css(obstacle.stroke);
      ctx.lineWidth = 3;
      ctx.stroke();

      if (obstacle.kind === '办公桌' || obstacle.kind === '实验桌') {
        ctx.strokeStyle = 'rgba(255,255,255,0.32)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(r.left + 12, r.top + r.height / 2); ctx.lineTo(r.right - 12, r.top + r.height / 2);
        ctx.moveTo(r.left + r.width / 3, r.top + 8); ctx.lineTo(r.left + r.width / 3, r.bottom - 8);
        ctx.stroke();
      } else if (obstacle.kind === '书架') {
        ctx.strokeStyle = 'rgba(255,238,190,0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let y = r.top + 22; y < r.bottom - 10; y += 28) {
          ctx.moveTo(r.left + 8, y); ctx.lineTo(r.right - 8, y);
        }
        ctx.stroke();
      } else if (obstacle.kind === '写字楼') {
        ctx.fillStyle = 'rgba(224,213,150,0.6)';
        for (let x = r.left + 12; x < r.right - 12; x += 22) {
          for (let y = r.top + 12; y < r.bottom - 12; y += 24) {
            ctx.fillRect(x, y, 8, 8);
          }
        }
      } else if (obstacle.kind === '汽车') {
        ctx.fillStyle = 'rgba(192,231,245,0.6)';
        ctx.fillRect(r.left + r.width * 0.32, r.top + 8, r.width * 0.34, r.height * 0.32);
        ctx.fillStyle = 'rgba(30,35,40,1)';
        ctx.beginPath(); ctx.arc(r.left + 22, r.bottom - 6, 8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(r.right - 22, r.bottom - 6, 8, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
}

function drawChests() {
  for (const chest of chests) {
    if (chest.opened) {
      ctx.fillStyle = 'rgba(120,95,60,0.9)';
      roundRectPath(chest.pos.x - 20, chest.pos.y - 14, 40, 26, 5);
      ctx.fill();
      continue;
    }
    const items = images['items'];
    if (items && items.naturalWidth) {
      drawAtlasCentered(ctx, items, 4, 4, 15, chest.pos.x, chest.pos.y, 52, 40);
    } else {
      ctx.fillStyle = '#8a6a3f';
      roundRectPath(chest.pos.x - 20, chest.pos.y - 14, 40, 28, 5);
      ctx.fill();
      ctx.strokeStyle = '#4d3518';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = '#f3cf6e';
      ctx.fillRect(chest.pos.x - 14, chest.pos.y - 6, 28, 5);
    }
    ctx.fillStyle = 'rgba(255,235,150,0.75)';
    ctx.font = '11px ' + FONT_UI;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('E', chest.pos.x, chest.pos.y - 30);
  }
}

function drawMeanings() {
  for (const token of meanings) {
    const bounds = meaningTokenBounds(token.meaning, token.pos);
    let fill = 'rgba(224,229,170,0.86)';
    if (token.glowTimer > 0 && (Math.floor(roomTime * 5) % 2 === 0)) fill = 'rgba(158,244,145,0.92)';
    ctx.fillStyle = fill;
    roundRectPath(bounds.left, bounds.top, bounds.width, bounds.height, 7);
    ctx.fill();
    ctx.strokeStyle = 'rgba(80,40,24,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(42,35,23,1)';
    ctx.font = 'bold 12px ' + FONT_UI;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(token.meaning, token.pos.x, token.pos.y + 1);
  }
}

function drawDrops() {
  const items = images['items'];
  for (const drop of drops) {
    const alpha = drop.life < 3 ? 0.35 + 0.65 * (drop.life / 3) : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (items && items.naturalWidth) {
      drawAtlasCentered(ctx, items, 4, 4, dropSpriteIndex(drop.kind), drop.pos.x, drop.pos.y, 34, 34);
    } else {
      ctx.fillStyle = 'rgba(255,230,140,0.9)';
      ctx.beginPath();
      ctx.arc(drop.pos.x, drop.pos.y, 12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function dropSpriteIndex(kind) {
  switch (kind) {
    case DROP.APPLE: return 8;
    case DROP.COFFEE: return 9;
    case DROP.SHIELDPOTION: return 10;
    case DROP.INK: return 11;
    case DROP.BOOTS: return 12;
    case DROP.FEATHER: return 13;
    case DROP.GLOVES: return 14;
  }
  return 8;
}

function drawProjectiles() {
  const items = images['items'];
  for (const p of projectiles) {
    if (items && items.naturalWidth) {
      drawAtlasCentered(ctx, items, 4, 4, p.universal ? 2 : 1, p.pos.x, p.pos.y, 34, 34);
    } else {
      ctx.fillStyle = p.universal ? 'rgba(200,180,255,0.95)' : 'rgba(255,226,120,0.95)';
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, 11, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.font = 'bold 11px ' + FONT_UI;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillText(p.meaning, p.pos.x, p.pos.y + 22);
  }
}

function drawEnemyProjectiles() {
  const items = images['items'];
  for (const bullet of enemyProjectiles) {
    if (items && items.naturalWidth) {
      drawAtlasCentered(ctx, items, 4, 4, 3, bullet.pos.x, bullet.pos.y, 30, 30);
    }
    const glow = ctx.createRadialGradient(bullet.pos.x, bullet.pos.y, 2, bullet.pos.x, bullet.pos.y, 14);
    glow.addColorStop(0, 'rgba(255,120,110,0.95)');
    glow.addColorStop(1, 'rgba(255,80,80,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(bullet.pos.x, bullet.pos.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,180,160,1)';
    ctx.beginPath();
    ctx.arc(bullet.pos.x, bullet.pos.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMonsters() {
  for (const m of monsters) {
    let c = [214, 83, 92];
    if (m.kind === KIND.CHASER) c = [232, 117, 79];
    if (m.kind === KIND.DASHER) c = [236, 185, 73];
    if (m.kind === KIND.SHIELD) c = [105, 142, 220];
    if (m.kind === KIND.GHOST) c = [174, 111, 214];

    /* 暴怒特效：红色脉冲光环 + 怒圈 */
    if (m.rageTimer > 0) {
      c = [255, 72, 72];
      const auraPulse = 1 + Math.sin(roomTime * 14) * 0.1;
      const auraR = (m.radius + 18) * auraPulse;
      const glow = ctx.createRadialGradient(m.pos.x, m.pos.y - 4, 4, m.pos.x, m.pos.y - 4, auraR);
      glow.addColorStop(0, 'rgba(255,60,50,' + (0.25 + 0.4 * m.ragePower) + ')');
      glow.addColorStop(1, 'rgba(255,40,40,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(m.pos.x, m.pos.y - 4, auraR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,70,60,' + (0.45 + 0.5 * m.ragePower) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(m.pos.x, m.pos.y - 4, m.radius + 16, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(m.pos.x, m.pos.y + m.radius - 4, m.radius, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    const chars = images['characters'];
    if (chars && chars.naturalWidth) {
      const sprite = monsterSpriteIndex(m);
      const spriteSize = m.radius * 2.6;
      drawAtlasCentered(ctx, chars, 4, 2, sprite, m.pos.x, m.pos.y - 4, spriteSize * 1.22, spriteSize, !m.facingRight);
    } else {
      ctx.fillStyle = css(c);
      ctx.beginPath();
      ctx.arc(m.pos.x, m.pos.y, m.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(35,22,26,0.9)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    if (m.shieldUp) {
      ctx.strokeStyle = 'rgba(172,224,255,0.75)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(m.pos.x, m.pos.y, m.radius + 7, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (isEliteMonster(m)) {
      ctx.strokeStyle = 'rgba(255,188,112,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(m.pos.x, m.pos.y, m.radius + 12, 0, Math.PI * 2);
      ctx.stroke();
    }

    drawOutlinedText(m.entry.word, 'bold 12px ' + FONT_WORD, m.pos.x, m.pos.y - 12, 'rgb(255,240,132)', 'rgb(18,18,24)', 'center');
    drawHpBar(m.pos.x - 28, m.pos.y + m.radius + 9, 56, 5, m.hp / m.maxHp, [255, 222, 118]);

    if (m.rageTimer > 0) {
      drawHpBar(m.pos.x - 28, m.pos.y + m.radius + 16, 56, 4, m.ragePower, [255, 84, 84]);
      const rageLabel = m.ragePower >= 0.95 ? '暴怒·MAX' : '暴怒';
      const pulse = m.ragePower >= 0.95 ? (Math.floor(roomTime * 8) % 2 === 0 ? 'rgb(255,170,140)' : 'rgb(255,90,70)') : 'rgb(255,128,96)';
      drawOutlinedText(rageLabel, 'bold 11px ' + FONT_UI, m.pos.x, m.pos.y - m.radius - 34, pulse, 'rgb(42,4,4)', 'center');
    }
  }
}

function monsterSpriteIndex(m) {
  if (isEliteMonster(m)) return 6;
  if (m.kind === KIND.CHASER) return 2;
  if (m.kind === KIND.DASHER) return 3;
  if (m.kind === KIND.SHIELD) return 4;
  if (m.kind === KIND.GHOST) return 5;
  return 1;
}

function heroActionFrameIndex() {
  if (fireAnimTime > 0) return 6;
  if (dashAnimTime > 0) return 5;
  if (player.invulnerable > 0) return 7;
  if (walkAnimTime <= 0.001) return 0;
  return 1 + (Math.floor(walkAnimTime * 10) % 4);
}

function heroFrameIndex() {
  if (dashAnimTime > 0) return 5;
  if (walkAnimTime <= 0.001) return 0;
  return 1 + (Math.floor(walkAnimTime * 10) % 4);
}

function drawPlayer() {
  const aim = getAimDirection();
  const pulse = 1 + Math.sin(walkAnimTime * 18) * 0.06;
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath();
  ctx.ellipse(player.pos.x, player.pos.y + 14, 24 * pulse, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const gun = images['hero_gun'];
  const walk = images['hero_walk'];
  const dirs = images['hero_dirs'];
  const chars = images['characters'];

  if (gun && gun.naturalWidth) {
    const frame = heroActionFrameIndex();
    drawAtlasCentered(ctx, gun, 8, 4, playerFacing * 8 + frame, player.pos.x, player.pos.y - 14, 90, 90);
    drawPlayerShield();
    drawPlayerWeapon(aim);
    return;
  }
  if (walk && walk.naturalWidth) {
    const frame = heroFrameIndex();
    drawAtlasCentered(ctx, walk, 6, 4, playerFacing * 6 + frame, player.pos.x, player.pos.y - 16, 88, 88);
    drawPlayerShield();
    drawPlayerWeapon(aim);
    return;
  }
  if (dirs && dirs.naturalWidth) {
    drawAtlasCentered(ctx, dirs, 4, 1, playerFacing, player.pos.x, player.pos.y - 14, 84, 84);
    drawPlayerShield();
    drawPlayerWeapon(aim);
    return;
  }
  if (chars && chars.naturalWidth) {
    drawAtlasCentered(ctx, chars, 4, 2, 0, player.pos.x, player.pos.y - 14, 84, 84);
    drawPlayerShield();
    drawPlayerWeapon(aim);
    return;
  }

  const body = player.invulnerable > 0 ? 'rgb(255,238,161)' : 'rgb(96,197,255)';
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(player.pos.x, player.pos.y, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(18,34,45,0.9)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(player.pos.x, player.pos.y);
  ctx.lineTo(player.pos.x + aim.x * 45, player.pos.y + aim.y * 45);
  ctx.stroke();
  drawPlayerShield();
}

function drawPlayerWeapon(aim) {
  const weapon = images['weapon'];
  if (!weapon || !weapon.naturalWidth) return;
  const angle = Math.atan2(aim.y, aim.x) * 180 / Math.PI;
  const recoil = fireAnimTime > 0 ? 6 * (fireAnimTime / 0.16) : 0;
  const weaponCenter = player.pos.add(aim.mul(27 - recoil)).add(new Vec2(0, -10));
  drawRotatedAtlasCentered(ctx, weapon, 4, 1, 0, weaponCenter.x, weaponCenter.y, 46, 30, angle);
  if (fireAnimTime > 0) {
    const muzzle = getMuzzlePosition(aim);
    const flashSize = 30 + 20 * (fireAnimTime / 0.16);
    drawRotatedAtlasCentered(ctx, weapon, 4, 1, 1, muzzle.x, muzzle.y, flashSize, flashSize, angle);
  }
}

function drawPlayerShield() {
  if (player.shieldTime > 0) {
    ctx.strokeStyle = 'rgba(128,221,255,0.55)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(player.pos.x, player.pos.y, 27, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawHud(t) {
  ctx.save();
  ctx.fillStyle = 'rgba(10,14,20,0.55)';
  ctx.fillRect(0, 0, W, 58);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.moveTo(0, 58); ctx.lineTo(W, 58);
  ctx.stroke();

  drawHpBar(16, 16, 240, 14, player.hp / player.maxHp, [88, 214, 141]);
  ctx.font = 'bold 13px ' + FONT_UI;
  ctx.fillStyle = '#eafaf0';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('HP ' + Math.max(0, Math.ceil(player.hp)) + '/' + Math.round(player.maxHp), 22, 23);

  ctx.fillStyle = 'rgba(220,235,250,0.9)';
  ctx.fillText('第 ' + room + ' 间 · ' + THEMES[(room - 1 + THEMES.length) % THEMES.length].name, 280, 20);
  ctx.fillStyle = 'rgba(180,200,220,0.75)';
  ctx.fillText('命中率 ' + accuracyText() + ' · 连击 x' + combo, 280, 42);

  drawCooldown(760, 15);
  drawMiniMeter(886, 30, 'Dash', 1 - clamp01(player.dashTimer / Math.max(0.01, player.dashCooldown)), [120, 200, 255]);
  drawMiniMeter(1010, 30, 'Shield', clamp01(player.shieldTime / 12), [140, 220, 255]);

  ctx.font = 'bold 13px ' + FONT_UI;
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffe9a3';
  ctx.fillText('持有：' + (player.heldMeaning ? player.heldMeaning : '无'), W - 18, 20);
  ctx.font = '12px ' + FONT_UI;
  ctx.fillStyle = 'rgba(190,205,225,0.8)';
  ctx.textAlign = 'right';
  ctx.fillText('E 拾取 · 左键发射', W - 18, 40);

  if (message) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 17px ' + FONT_UI;
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = 'rgba(235,244,255,0.95)';
    ctx.fillText(message, W / 2, 90);
    ctx.restore();
  }
  ctx.restore();
}

function drawCooldown(x, y) {
  const potionReady = player.shieldTime <= 0;
  ctx.save();
  ctx.fillStyle = potionReady ? 'rgba(124,205,255,0.25)' : 'rgba(60,80,100,0.35)';
  roundRectPath(x, y, 108, 34, 8);
  ctx.fill();
  ctx.strokeStyle = potionReady ? 'rgba(124,205,255,0.9)' : 'rgba(90,110,130,0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = 'bold 13px ' + FONT_UI;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = potionReady ? '#cfefff' : '#8fa7bd';
  ctx.fillText('Q 护盾药剂', x + 54, y + 17);
  ctx.restore();
}

function accuracyText() {
  const total = correctHits + wrongHits;
  if (total === 0) return '100%';
  return Math.round(100 * correctHits / total) + '%';
}

function drawFloating() {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const ft of floatingTexts) {
    const alpha = clamp01(ft.life / 1.35);
    ctx.font = 'bold 13px ' + FONT_UI;
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = css(ft.rgb, alpha);
    ctx.fillText(ft.text, ft.pos.x, ft.pos.y);
  }
  ctx.restore();
}

function drawCrosshair() {
  const mx = mouse.x, my = mouse.y;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(mx, my, 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(mx - 15, my); ctx.lineTo(mx - 5, my);
  ctx.moveTo(mx + 5, my); ctx.lineTo(mx + 15, my);
  ctx.moveTo(mx, my - 15); ctx.lineTo(mx, my - 5);
  ctx.moveTo(mx, my + 5); ctx.lineTo(mx, my + 15);
  ctx.stroke();
  ctx.restore();
}

function drawMemoryBook() {
  ctx.save();
  ctx.fillStyle = 'rgba(8,12,18,0.9)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#1b2431';
  roundRectPath(240, 80, W - 480, H - 160, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(140,170,210,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = 'bold 26px ' + FONT_UI;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#e8f1fb';
  ctx.fillText('记忆书', W / 2, 120);

  ctx.font = '15px ' + FONT_UI;
  ctx.textAlign = 'left';
  let y = 170;
  const entries = allWords
    .filter(w => w.correctCount > 0 || w.wrongCount > 0 || w.seenCount > 0)
    .sort((a, b) => (b.wrongCount || 0) - (a.wrongCount || 0) || (b.correctCount || 0) - (a.correctCount || 0));
  if (entries.length === 0) {
    ctx.fillStyle = 'rgba(200,215,235,0.6)';
    ctx.textAlign = 'center';
    ctx.fillText('还没有记录，去战斗吧！', W / 2, 320);
  }
  const cols = 2;
  const colW = (W - 520) / cols;
  for (let i = 0; i < Math.min(48, entries.length); i++) {
    const w = entries[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 280 + col * colW;
    const yy = 170 + row * 46;
    const good = (w.correctCount || 0) > (w.wrongCount || 0);
    ctx.fillStyle = good ? 'rgba(170,245,185,0.95)' : 'rgba(255,222,138,0.95)';
    ctx.font = 'bold 14px ' + FONT_WORD;
    ctx.fillText(w.word, x, yy);
    ctx.font = '13px ' + FONT_UI;
    ctx.fillStyle = 'rgba(190,205,225,0.8)';
    ctx.fillText(w.meaning + '  (对 ' + (w.correctCount || 0) + ' / 错 ' + (w.wrongCount || 0) + ')', x + 150, yy);
  }
  ctx.restore();
}

function rewardCardRect(index) {
  const width = 250, height = 218, gap = 28;
  const total = width * 3 + gap * 2;
  const x = W / 2 - total / 2 + index * (width + gap);
  return { left: x, top: H / 2 - height / 2 - 10, right: x + width, bottom: H / 2 - height / 2 - 10 + height, width, height };
}

function drawRewardChoice() {
  ctx.save();
  ctx.fillStyle = 'rgba(6,9,14,0.72)';
  ctx.fillRect(0, 0, W, H);
  drawCentered('选择一张奖励卡', 'bold 30px ' + FONT_UI, [235, 244, 255], 110);
  for (let i = 0; i < rewardCards.length; i++) drawRewardCard(i, rewardCards[i]);
  ctx.restore();
}

function drawRewardCard(index, card) {
  const r = rewardCardRect(index);
  const accent = [116, 201, 255];
  ctx.fillStyle = 'rgba(24,33,48,0.95)';
  roundRectPath(r.left, r.top, r.width, r.height, 12);
  ctx.fill();
  ctx.strokeStyle = css(accent, 0.7);
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = 'bold 14px ' + FONT_UI;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(140,200,255,0.85)';
  ctx.fillText(card.category, r.left + r.width / 2, r.top + 28);
  ctx.font = 'bold 22px ' + FONT_UI;
  ctx.fillStyle = '#f2f8ff';
  ctx.fillText(card.title, r.left + r.width / 2, r.top + 62);
  ctx.font = '14px ' + FONT_UI;
  ctx.fillStyle = 'rgba(205,220,240,0.9)';
  const lines = card.description.match(/.{1,14}/g) || [card.description];
  lines.forEach((line, li) => {
    ctx.fillText(line, r.left + r.width / 2, r.top + 96 + li * 24);
  });
  ctx.font = 'bold 16px ' + FONT_UI;
  ctx.fillStyle = 'rgba(120,215,255,0.9)';
  ctx.fillText((index + 1) + ' 选择', r.left + r.width / 2, r.top + r.height - 28);
  ctx.restore();
}

function drawOverlayPanel(title, body) {
  ctx.save();
  ctx.fillStyle = 'rgba(6,9,14,0.72)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(24,33,48,0.95)';
  roundRectPath(W / 2 - 220, H / 2 - 90, 440, 180, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(140,170,210,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  drawCentered(title, 'bold 30px ' + FONT_UI, [235, 244, 255], H / 2 - 40);
  drawCentered(body, '16px ' + FONT_UI, [180, 200, 225], H / 2 + 20);
  ctx.restore();
}

function drawEndScreen(title) {
  ctx.save();
  ctx.fillStyle = 'rgba(6,9,14,0.9)';
  ctx.fillRect(0, 0, W, H);
  drawCentered(title, 'bold 44px ' + FONT_UI, [255, 220, 130], 110);
  drawCentered('到达第 ' + room + ' 间', '20px ' + FONT_UI, [200, 215, 235], 170);

  ctx.fillStyle = 'rgba(24,33,48,0.9)';
  roundRectPath(180, 210, W - 360, 320, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(140,170,210,0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const entries = allWords
    .filter(w => w.seenCount > 0)
    .sort((a, b) => (b.wrongCount || 0) - (a.wrongCount || 0));
  ctx.font = 'bold 14px ' + FONT_UI;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(150,170,195,0.9)';
  ctx.fillText('命中率 ' + accuracyText() + ' · 本房间命中 ' + correctHits + ' · 错配 ' + wrongHits + ' · 碰撞 ' + collisions, W / 2, 236);

  ctx.font = '13px ' + FONT_UI;
  ctx.textAlign = 'left';
  let y = 270;
  for (let i = 0; i < Math.min(20, entries.length); i++) {
    const w = entries[i];
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 210 + col * 500;
    const yy = 270 + row * 28;
    ctx.fillStyle = (w.wrongCount || 0) > (w.correctCount || 0) ? 'rgba(255,214,138,0.95)' : 'rgba(170,245,185,0.9)';
    ctx.font = 'bold 13px ' + FONT_WORD;
    ctx.fillText(w.word, x, yy);
    ctx.font = '12px ' + FONT_UI;
    ctx.fillStyle = 'rgba(190,205,225,0.75)';
    ctx.fillText(w.meaning + '  (对 ' + (w.correctCount || 0) + ' / 错 ' + (w.wrongCount || 0) + ')', x + 170, yy);
  }
  ctx.restore();
  drawCentered('按 Enter 回到主菜单', '16px ' + FONT_UI, [160, 180, 205], 585);
}
/* ============================================================
 * 第五部分：输入、菜单点击、主循环、启动
 * ============================================================ */

const keys = new Set();

function clientToGame(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  updateRenderViewport();
  let x = (clientX - rect.left - renderOffsetX) / renderScale;
  let y = (clientY - rect.top - renderOffsetY) / renderScale;
  x = clamp(x, 0, W);
  y = clamp(y, 0, H);
  return { x, y };
}

function pointInMenuRect(p, r) {
  return p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
}

function handleMenuClick(p) {
  for (let i = 0; i < MENU_DIFFS.length; i++) {
    if (pointInMenuRect(p, menuDifficultyRect(i))) {
      playSound('ui_click');
      selectedMode = MENU_DIFFS[i].max;
      selectedModeName = MENU_DIFFS[i].title + ' / ' + MENU_DIFFS[i].subtitle;
      return;
    }
  }
  if (pointInMenuRect(p, menuStartRect())) {
    playSound('ui_click');
    startSelectedGame();
    return;
  }
  if (saveData && saveData.hasContinue && pointInMenuRect(p, menuContinueRect())) {
    playSound('ui_click');
    continueGame();
  }
}

function handleRewardClick(p) {
  for (let i = 0; i < rewardCards.length; i++) {
    if (pointInMenuRect(p, rewardCardRect(i))) {
      chooseReward(i);
      return;
    }
  }
}

function startSelectedGame() {
  startGame(selectedMode, selectedModeName);
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
  setTimeout(resizeCanvas, 60);
}

window.addEventListener('resize', resizeCanvas);

document.addEventListener('keydown', (e) => {
  if (e.code === 'F11') {
    e.preventDefault();
    toggleFullscreen();
    return;
  }
  keys.add(e.code);

  if (state === STATE.MENU) {
    if (e.code === 'Enter') {
      e.preventDefault();
      playSound('ui_click');
      startSelectedGame();
    }
    return;
  }

  if (e.code === 'Escape') {
    if (state === STATE.PLAYING) {
      previousState = state;
      state = STATE.PAUSED;
    } else if (state === STATE.PAUSED) {
      state = previousState;
    }
    return;
  }

  if (state === STATE.GAMEOVER || state === STATE.WIN) {
    if (e.code === 'Enter') state = STATE.MENU;
    return;
  }

  if (state === STATE.REWARD) {
    if (e.code === 'Digit1' || e.code === 'Numpad1') chooseReward(0);
    if (e.code === 'Digit2' || e.code === 'Numpad2') chooseReward(1);
    if (e.code === 'Digit3' || e.code === 'Numpad3') chooseReward(2);
    return;
  }

  if (state === STATE.PLAYING || state === STATE.ROOMCLEAR) {
    if (e.code === 'Tab') { e.preventDefault(); showBook = true; }
    if (e.code === 'Space') { e.preventDefault(); tryDash(); }
    if (e.code === 'KeyE') { e.preventDefault(); tryInteract(); }
    if (e.code === 'KeyQ') { e.preventDefault(); usePotion(); }
  }
});

document.addEventListener('keyup', (e) => {
  keys.delete(e.code);
  if (e.code === 'Tab') showBook = false;
});

canvas.addEventListener('mousemove', (e) => {
  mouse = clientToGame(e.clientX, e.clientY);
});

canvas.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  const p = clientToGame(e.clientX, e.clientY);
  if (state === STATE.MENU) { handleMenuClick(p); return; }
  if (state === STATE.REWARD) { handleRewardClick(p); return; }
  mouse = p;
  mouseLeftDown = true;
  if (state === STATE.PLAYING) fireHeldMeaning(false);
});

document.addEventListener('mouseup', (e) => {
  if (e.button === 0) mouseLeftDown = false;
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

/* ---------- 主循环 ---------- */
let lastTime = performance.now();
let accumulator = 0;

function frame(now) {
  requestAnimationFrame(frame);
  let frameDt = (now - lastTime) / 1000;
  lastTime = now;
  if (frameDt > 0.25) frameDt = 0.25;
  accumulator += frameDt;
  let steps = 0;
  while (accumulator >= DT && steps < 4) {
    tick(DT);
    accumulator -= DT;
    steps++;
  }
  if (steps === 4) accumulator = 0;
  render();
}

/* ---------- 启动 ---------- */
async function boot() {
  saveData = loadSave();
  try {
    const resp = await fetch('wordbank.json');
    if (resp.ok) {
      allWords = await resp.json();
    }
  } catch (e) { /* fallback below */ }

  if (!Array.isArray(allWords) || allWords.length === 0) {
    allWords = [
      { word: 'increase', meaning: '增加', difficulty: 2, frequencyRank: 1200, tags: ['highschool', 'verb'] },
      { word: 'environment', meaning: '环境', difficulty: 2, frequencyRank: 800, tags: ['highschool', 'noun'] },
      { word: 'achieve', meaning: '实现', difficulty: 3, frequencyRank: 900, tags: ['cet', 'verb'] },
      { word: 'significant', meaning: '重要的', difficulty: 3, frequencyRank: 700, tags: ['cet', 'adj'] },
      { word: 'sophisticated', meaning: '复杂的', difficulty: 5, frequencyRank: 600, tags: ['ielts', 'adj'] },
      { word: 'meticulous', meaning: '一丝不苟的', difficulty: 6, frequencyRank: 500, tags: ['ielts', 'adj'] }
    ];
  }
  mergeSavedStats();

  const p = [];
  p.push(loadImage('characters', 'assets/runtime/characters_monsters.png'));
  p.push(loadImage('hero_gun', 'assets/runtime/hero_gun_actions.png'));
  p.push(loadImage('hero_walk', 'assets/runtime/hero_walk.png'));
  p.push(loadImage('hero_dirs', 'assets/runtime/hero_directions.png'));
  p.push(loadImage('weapon', 'assets/runtime/weapon_ammo.png'));
  p.push(loadImage('items', 'assets/runtime/items_projectiles_chests.png'));
  p.push(loadImage('tiles', 'assets/runtime/theme_tiles_walls.png'));
  const bgNames = ['forest', 'office', 'library', 'lab', 'business_mine', 'academic_temple', 'travel_port', 'emotion_cave'];
  bgNames.forEach((n, i) => p.push(loadImage('bg_' + i, 'assets/runtime/backgrounds/' + n + '.jpg')));
  p.push(loadSound('ui_click', 'assets/runtime/sounds/ui_click.mp3'));
  p.push(loadSound('hit_correct', 'assets/runtime/sounds/hit_correct.mp3'));
  await Promise.all(p);

  document.getElementById('loading').style.display = 'none';
  resizeCanvas();
  requestAnimationFrame(frame);
}

boot();
