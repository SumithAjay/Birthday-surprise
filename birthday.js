/* ============================================================
   HAPPY BIRTHDAY — a birthday film in four acts
   Vanilla canvas 2D for the tree + GSAP for the orchestration.

   ACT 1  a real recurve bow with a Cupid's arrow nocked — you
          DRAW the string down and RELEASE to fire (pointer drag,
          or keyboard). A softly beating heart waits above as the
          target.
   ACT 2  the arrow flies up and strikes the heart; the heart
          jolts, falls, and bursts into a flood of rose that
          swallows the frame (no cross-fade).
   ACT 3  a kinetic wish hinges up out of that colour, glyph by
          glyph, under cinema bars and a slow camera push.
   ACT 4  a gold light blooms, and the tree grows into one heart
          of lit blossoms with the hand-lettered wish.

   A GSAP master timeline runs the shot + Acts 2–3; at its end it
   starts the canvas tree (Act 4), which owns its own rAF and
   plays once, then holds — living, never looping.
   ============================================================ */

import gsap from 'gsap';

/* the pen-stroke plugin: a `drawn` 0..1 property for the underline */
gsap.registerPlugin({
  name: 'drawn',
  init(target, value) {
    const len = target.getTotalLength();
    target.style.strokeDasharray = len;
    this.target = target; this.len = len; this.value = value;
  },
  render(ratio, data) {
    data.target.style.strokeDashoffset = data.len * (1 - data.value * ratio);
  },
});

const $ = (id) => document.getElementById(id);

const canvas = $('tree');
const ctx    = canvas.getContext('2d');
const wishEl = $('wish');
const cakeWrapper = $('cakeWrapper');
const cakeCard    = $('cakeCard');
const cakeToast   = $('cakeToast');
const cakeConfetti= $('cakeConfetti');
let cakeBlown = false;

const hero       = $('hero');
const eyebrow    = $('eyebrow');
const hint       = $('hint');
const motes      = $('motes');
const target     = $('target');
const targetHeart= $('targetHeart');
const heartGlow  = target.querySelector('.heart__glow');
const aim        = $('aim');

const archery = $('archery');
const bow     = $('bow');
const arrow   = $('arrow');
const strL    = $('strL');
const strR    = $('strR');
const serving = $('serving');

const flood   = $('flood');
const field   = $('field');
const camera  = $('camera');
const stardustField = $('stardustField');
const wishSparkles  = $('wishSparkles');
const kEyebrow= $('kEyebrow');
const kSub    = $('kSub');
const barTop  = $('barTop');
const barBot  = $('barBot');
const uline   = $('uline').querySelector('.uline__path');
const ulineSpark = $('ulineSpark');
const bloom   = $('bloom');
const replay  = $('replay');
const toastMemoriesBtn = $('toastMemoriesBtn');
const galleryModal     = $('galleryModal');
const galleryBackdrop  = $('galleryBackdrop');
const galleryClose     = $('galleryClose');
const polaroidCard     = $('polaroidCard');
const polaroidImg      = $('polaroidImg');
const polaroidCaption  = $('polaroidCaption');
const polaroidSubnote  = $('polaroidSubnote');
const polaroidStamp    = $('polaroidStamp');
const polaroidLikeBtn  = $('polaroidLikeBtn');
const polaroidLikeCount= $('polaroidLikeCount');
const polaroidBursts   = $('polaroidBursts');
const polaroidGlare    = $('polaroidGlare');
const polaroidWrapper  = $('polaroidWrapper');
const galleryPrev      = $('galleryPrev');
const galleryNext      = $('galleryNext');
const galleryDots      = $('galleryDots');
let curPhotoIdx        = 0;
let likeCounts         = [1, 1, 1, 1];

const PHOTOS = [
  {
    src: '/photos/photo2.jpg',
    caption: 'Dancing with the ocean breeze \uD83C\uDF0A\uD83C\uDF38',
    subnote: 'Memories by the Shore \u2022 Pure Bliss',
    stamp: '\uD83C\uDF3B Seaside Sunshine',
    position: 'center 15%'
  },
  {
    src: '/photos/photo3.jpg',
    caption: 'Timeless grace & joyful heart \uD83C\uDFDB\uFE0F\uD83D\uDC96',
    subnote: 'Grace in every smile \u2022 Forever Loved',
    stamp: '\u2728 Soulful & Serene',
    position: 'center 15%'
  },
  {
    src: '/photos/photo4.jpg',
    caption: 'Radiant elegance & golden moments \uD83C\uDF3B\u2728',
    subnote: 'Traditional Beauty \u2022 Simply Magical',
    stamp: '\uD83D\uDC51 Golden Hour',
    position: 'center 15%'
  },
  {
    src: '/photos/photo6.jpg',
    caption: 'Blooming bright amidst golden sunflowers \uD83C\uDF3B\u2728',
    subnote: 'Sunflower Meadow \u2022 Pure Sunshine Deva Sri',
    stamp: '\uD83C\uDF3B Sunflower Queen Deva Sri',
    position: 'center 30%'
  }
];

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isRecord     = new URLSearchParams(location.search).has('record');

/* --- cue log for the recorder: the page stays muted, but it timestamps every
   beat the film crosses, and the offline sound synth fires foley at those exact
   times so the audio can never drift from the picture. --- */
if (isRecord) window.bdayCues = [];
let recT0 = 0;
function cue(name){ if (isRecord && recT0) window.bdayCues.push({ cue: name, t: (performance.now() - recT0) / 1000 }); }

/* ============================================================
   MATH HELPERS
   ============================================================ */
const rand  = (a, b) => a + Math.random() * (b - a);
const pick  = (a)    => a[(Math.random() * a.length) | 0];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp  = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeOutBack  = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

function shade(hex, amt){
  const n = parseInt(hex.slice(1), 16);
  const r = clamp((n >> 16) + amt, 0, 255), g = clamp(((n >> 8) & 255) + amt, 0, 255), b = clamp((n & 255) + amt, 0, 255);
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

/* ============================================================
   TREE ENGINE (Act 4) — canvas
   ============================================================ */
const BLOSSOM = [
  { c0: '#ffe1ec', c1: '#ff80aa' },
  { c0: '#ffd0e0', c1: '#f4577f' },
  { c0: '#ffc4d2', c1: '#e23b67' },
  { c0: '#ffd9c4', c1: '#ff8a5b' },
  { c0: '#ffeec2', c1: '#f6b13e' },
  { c0: '#ffd2e6', c1: '#e84d9a' },
];

/* timeline (seconds, relative to the tree's own start) — brisk */
const T = {
  trunkStart: 0.10,
  branchSpan: 1.80,
  bloomT0:    1.25,
  bloomSpan:  2.00,
  petalT0:    2.45,
  noteStart:  0.45,
  done:       4.60,
};

const SS = 168;

function heartShape(c, x, top, w, h){
  c.beginPath();
  c.moveTo(x, top + h * 0.28);
  c.bezierCurveTo(x, top, x - w * 0.5, top, x - w * 0.5, top + h * 0.28);
  c.bezierCurveTo(x - w * 0.5, top + h * 0.60, x - w * 0.16, top + h * 0.80, x, top + h);
  c.bezierCurveTo(x + w * 0.16, top + h * 0.80, x + w * 0.5, top + h * 0.60, x + w * 0.5, top + h * 0.28);
  c.bezierCurveTo(x + w * 0.5, top, x, top, x, top + h * 0.28);
  c.closePath();
}

function makeBlossom({ c0, c1 }, soft){
  const cv = document.createElement('canvas'); cv.width = cv.height = SS;
  const c = cv.getContext('2d');
  const w = SS * 0.62, h = SS * 0.58, x = SS / 2, top = SS * 0.17;

  c.save();
  c.shadowColor = 'rgba(150,38,72,0.32)';
  c.shadowBlur = SS * 0.085; c.shadowOffsetY = SS * 0.05;
  c.fillStyle = c1; heartShape(c, x, top, w, h); c.fill();
  c.restore();

  const g = c.createRadialGradient(x - w * 0.20, top + h * 0.20, h * 0.04, x, top + h * 0.42, h * 0.92);
  g.addColorStop(0, c0); g.addColorStop(0.55, c1); g.addColorStop(1, shade(c1, -26));
  heartShape(c, x, top, w, h); c.fillStyle = g; c.fill();

  c.save(); heartShape(c, x, top, w, h); c.clip();
  const g2 = c.createLinearGradient(0, top, 0, top + h);
  g2.addColorStop(0, 'rgba(255,255,255,0)');
  g2.addColorStop(0.65, 'rgba(110,16,46,0)');
  g2.addColorStop(1, 'rgba(110,16,46,0.26)');
  c.fillStyle = g2; c.fillRect(0, 0, SS, SS);
  c.globalAlpha = 0.55; c.fillStyle = '#ffffff';
  c.beginPath(); c.ellipse(x - w * 0.15, top + h * 0.24, w * 0.17, h * 0.11, -0.5, 0, Math.PI * 2); c.fill();
  c.restore();

  if (!soft) return cv;

  const cv2 = document.createElement('canvas'); cv2.width = cv2.height = SS;
  const c2 = cv2.getContext('2d');
  c2.filter = 'blur(2.6px)'; c2.drawImage(cv, 0, 0); c2.filter = 'none';
  c2.globalCompositeOperation = 'source-atop';
  c2.globalAlpha = 0.42; c2.fillStyle = '#fff3ea'; c2.fillRect(0, 0, SS, SS);
  return cv2;
}

function makeBokeh(rgb){
  const S = 128, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const c = cv.getContext('2d');
  const g = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, `rgba(${rgb},0.9)`); g.addColorStop(0.45, `rgba(${rgb},0.22)`); g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g; c.fillRect(0, 0, S, S);
  return cv;
}

function makeSparkle(){
  const S = 64, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const c = cv.getContext('2d'); const m = S / 2;
  const g = c.createRadialGradient(m, m, 0, m, m, m);
  g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.25, 'rgba(255,236,200,0.5)'); g.addColorStop(1, 'rgba(255,236,200,0)');
  c.fillStyle = g; c.beginPath(); c.arc(m, m, m, 0, 6.2832); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.95)';
  c.translate(m, m);
  for (let k = 0; k < 2; k++){
    c.beginPath();
    c.moveTo(0, -m); c.quadraticCurveTo(0, 0, m, 0); c.quadraticCurveTo(0, 0, 0, m); c.quadraticCurveTo(0, 0, -m, 0); c.quadraticCurveTo(0, 0, 0, -m);
    c.fill(); c.rotate(Math.PI / 4); c.scale(0.5, 0.5);
  }
  return cv;
}

function makeSunflowerHead(soft){
  const S = SS;
  const cv = document.createElement('canvas'); cv.width = cv.height = S;
  const c = cv.getContext('2d');
  const mid = S / 2;
  const rDisc = S * 0.17;
  const rPetalOuter = S * 0.44;
  const rPetalInner = S * 0.41;

  c.save();
  c.shadowColor = 'rgba(120, 45, 10, 0.35)';
  c.shadowBlur = S * 0.08;
  c.shadowOffsetY = S * 0.04;

  // 1. Back row of petals (16 petals)
  const numPetals = 16;
  for (let i = 0; i < numPetals; i++){
    const ang = (i / numPetals) * Math.PI * 2;
    c.save();
    c.translate(mid, mid);
    c.rotate(ang);
    c.beginPath();
    c.moveTo(0, rDisc * 0.75);
    c.quadraticCurveTo(-S * 0.075, (rDisc + rPetalOuter) * 0.5, 0, rPetalOuter);
    c.quadraticCurveTo(S * 0.075, (rDisc + rPetalOuter) * 0.5, 0, rDisc * 0.75);
    const g = c.createLinearGradient(0, rDisc * 0.8, 0, rPetalOuter);
    g.addColorStop(0, '#f59e0b');
    g.addColorStop(0.6, '#fbb03b');
    g.addColorStop(1, '#ffd166');
    c.fillStyle = g;
    c.fill();
    c.restore();
  }
  c.restore();

  // 2. Front row of petals (16 petals, offset)
  for (let i = 0; i < numPetals; i++){
    const ang = (i / numPetals) * Math.PI * 2 + Math.PI / numPetals;
    c.save();
    c.translate(mid, mid);
    c.rotate(ang);
    c.beginPath();
    c.moveTo(0, rDisc * 0.9);
    c.quadraticCurveTo(-S * 0.07, (rDisc + rPetalInner) * 0.52, 0, rPetalInner);
    c.quadraticCurveTo(S * 0.07, (rDisc + rPetalInner) * 0.52, 0, rDisc * 0.9);
    const g = c.createLinearGradient(0, rDisc * 0.9, 0, rPetalInner);
    g.addColorStop(0, '#e67e22');
    g.addColorStop(0.45, '#f59e0b');
    g.addColorStop(0.85, '#ffdd53');
    g.addColorStop(1, '#fff1a8');
    c.fillStyle = g;
    c.fill();
    c.restore();
  }

  // 3. Center seed disc
  const dg = c.createRadialGradient(mid - rDisc * 0.2, mid - rDisc * 0.2, rDisc * 0.05, mid, mid, rDisc);
  dg.addColorStop(0, '#2e1507');
  dg.addColorStop(0.5, '#451d08');
  dg.addColorStop(0.85, '#78350f');
  dg.addColorStop(1, '#b45309');
  c.beginPath();
  c.arc(mid, mid, rDisc, 0, Math.PI * 2);
  c.fillStyle = dg;
  c.fill();

  // 4. Florets / seed ring texture
  c.save();
  for (let ring = 1; ring <= 3; ring++){
    const dots = ring * 10;
    const rad = rDisc * (0.35 + ring * 0.18);
    for (let d = 0; d < dots; d++){
      const da = (d / dots) * Math.PI * 2 + ring * 0.5;
      const dx = mid + Math.cos(da) * rad;
      const dy = mid + Math.sin(da) * rad;
      c.beginPath();
      c.arc(dx, dy, S * 0.009, 0, Math.PI * 2);
      c.fillStyle = ring === 3 ? 'rgba(255, 200, 70, 0.7)' : 'rgba(217, 119, 6, 0.5)';
      c.fill();
    }
  }
  c.restore();

  if (!soft) return cv;

  const cv2 = document.createElement('canvas'); cv2.width = cv2.height = S;
  const c2 = cv2.getContext('2d');
  c2.filter = 'blur(2.5px)'; c2.drawImage(cv, 0, 0); c2.filter = 'none';
  c2.globalCompositeOperation = 'source-atop';
  c2.globalAlpha = 0.35; c2.fillStyle = '#fff4db'; c2.fillRect(0, 0, S, S);
  return cv2;
}

function makeSunflowerPetal(){
  const S = Math.round(SS * 0.6);
  const cv = document.createElement('canvas'); cv.width = cv.height = S;
  const c = cv.getContext('2d');
  const mid = S / 2;
  c.save();
  c.shadowColor = 'rgba(160, 60, 20, 0.3)';
  c.shadowBlur = 6;
  c.beginPath();
  c.moveTo(mid, S * 0.85);
  c.quadraticCurveTo(S * 0.15, S * 0.45, mid, S * 0.1);
  c.quadraticCurveTo(S * 0.85, S * 0.45, mid, S * 0.85);
  const g = c.createLinearGradient(mid, S * 0.85, mid, S * 0.1);
  g.addColorStop(0, '#f59e0b');
  g.addColorStop(0.55, '#fbbf24');
  g.addColorStop(1, '#fef08a');
  c.fillStyle = g;
  c.fill();
  c.restore();
  return cv;
}

let SPR = { crisp: [], soft: [] }, BOKEH = [], SPARKLE = null;
let SUNFLOWER = { crisp: null, soft: null }, SUNFLOWER_PETAL = null;
function buildSprites(){
  SPR = { crisp: BLOSSOM.map((b) => makeBlossom(b, false)), soft: BLOSSOM.map((b) => makeBlossom(b, true)) };
  SUNFLOWER = { crisp: makeSunflowerHead(false), soft: makeSunflowerHead(true) };
  SUNFLOWER_PETAL = makeSunflowerPetal();
  BOKEH = [makeBokeh('255,224,188'), makeBokeh('255,196,214'), makeBokeh('255,238,210')];
  SPARKLE = makeSparkle();
}

function drawSprite(sprite, x, y, size, rot, alpha){
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.globalAlpha = alpha;
  ctx.drawImage(sprite, -size * 0.5, -size * 0.47, size, size);
  ctx.restore();
}

let heartPoly = null;
function buildHeartPoly(){
  const raw = []; let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  for (let i = 0; i <= 160; i++){
    const t = (i / 160) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    raw.push([x, y]);
    if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  const midX = (minX + maxX) / 2, midY = (minY + maxY) / 2, hw = (maxX - minX) / 2, hh = (maxY - minY) / 2;
  heartPoly = raw.map(([x, y]) => [(x - midX) / hw, (y - midY) / hh]);
}
function pointInPoly(x, y){
  let inside = false; const p = heartPoly;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++){
    const xi = p[i][0], yi = p[i][1], xj = p[j][0], yj = p[j][1];
    if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

let W = 0, H = 0, dpr = 1;
let cx = 0, cy = 0, rx = 0, ry = 0, groundY = 0;
let branches = [], hearts = [], petals = [], rested = [], orbs = [], floaters = [], twinkles = [], sunflowers = [];
let bgGrad = null, glowGrad = null, groundGrad = null;

const quad = (b, t) => { const m = 1 - t, a = m * m, k = 2 * m * t, d = t * t; return { x: a * b.x1 + k * b.cx + d * b.x2, y: a * b.y1 + k * b.cy + d * b.y2 }; };

function barkGrad(x1, y1, x2, y2, depth){
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  g.addColorStop(0, `hsl(348 26% ${26 + depth * 3}%)`);
  g.addColorStop(1, `hsl(346 24% ${40 + depth * 5}%)`);
  return g;
}

function buildScene(){
  branches = []; hearts = []; petals = []; rested = []; twinkles = []; orbs = []; floaters = []; sunflowers = [];
  buildHeartPoly();

  const wide = W / H > 1.2;
  cx = W * (wide ? 0.57 : 0.5);
  cy = H * (wide ? 0.37 : 0.40);
  ry = Math.min(H * (wide ? 0.33 : 0.28), W * 0.31);
  rx = ry * 1.16;
  groundY = H * (wide ? 0.93 : 0.94);

  bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#fff3e9');
  bgGrad.addColorStop(0.46, '#ffe7d6');
  bgGrad.addColorStop(0.78, '#fcd9c4');
  bgGrad.addColorStop(1, '#f3c4b5');
  glowGrad = ctx.createRadialGradient(cx, cy, ry * 0.1, cx, cy, ry * 1.55);
  glowGrad.addColorStop(0, 'rgba(255,219,170,0.6)');
  glowGrad.addColorStop(0.5, 'rgba(255,170,150,0.2)');
  glowGrad.addColorStop(1, 'rgba(255,170,150,0)');
  groundGrad = ctx.createRadialGradient(cx, H * 1.02, ry * 0.2, cx, H * 1.02, ry * 1.6);
  groundGrad.addColorStop(0, 'rgba(255,205,165,0.5)');
  groundGrad.addColorStop(1, 'rgba(255,205,165,0)');

  for (let i = 0; i < 11; i++){
    orbs.push({ x: rand(0, W), y: rand(0, H), r: rand(W * 0.05, W * 0.17), vy: rand(-6, -16), drift: rand(-0.3, 0.3), phase: rand(0, 6.28), alpha: rand(0.05, 0.13), sprite: pick(BOKEH) });
  }

  const FN = wide ? 18 : 15;
  for (let i = 0; i < FN; i++){
    const depth = Math.random();
    floaters.push({
      x: rand(0, W), y: rand(-H * 0.1, H * 1.1), depth,
      idx: (Math.random() * BLOSSOM.length) | 0,
      box: lerp(Math.min(W, H) * 0.025, Math.min(W, H) * 0.075, depth),
      vy: lerp(7, 20, depth), sway: rand(8, 22), phase: rand(0, 6.28),
      rot: rand(-0.4, 0.4), vrot: rand(-0.5, 0.5),
      baseA: lerp(0.16, 0.5, depth), soft: depth < 0.45,
    });
  }

  const baseX = cx, baseY = H * 1.0;
  const trunkTopY = cy + ry * 0.62;
  const trunkW = Math.max(9, W * 0.024);
  const limbLen = ry * 0.6;
  const insidePx = (x, y, m = 0.9) => pointInPoly((x - cx) / (rx * m), (cy - y) / (ry * m));

  function addBranch(x, y, ang, len, w0, depth, t0){
    let ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len, clipped = false;
    if (!insidePx(ex, ey)){
      let lo = 0, hi = 1;
      for (let k = 0; k < 12; k++){ const mid = (lo + hi) / 2; (insidePx(x + Math.cos(ang) * len * mid, y + Math.sin(ang) * len * mid) ? lo = mid : hi = mid); }
      ex = x + Math.cos(ang) * len * lo; ey = y + Math.sin(ang) * len * lo; clipped = true;
    }
    const mx = (x + ex) / 2, my = (y + ey) / 2, perp = ang + Math.PI / 2, bend = rand(-1, 1) * len * 0.12, w1 = w0 * 0.66;
    branches.push({ x1: x, y1: y, cx: mx + Math.cos(perp) * bend, cy: my + Math.sin(perp) * bend, x2: ex, y2: ey, w0, w1, t0, dur: Math.max(0.14, 0.32 - depth * 0.03), depth, grad: barkGrad(x, y, ex, ey, depth) });
    return { ex, ey, w1, clipped };
  }
  function grow(x, y, ang, len, w, depth, t0){
    const r = addBranch(x, y, ang, len, w, depth, t0);
    if (r.clipped || depth >= 6 || len < ry * 0.06) return;
    const childT0 = t0 + (0.32 - depth * 0.03) * 0.6;
    const n = Math.random() < 0.55 ? 2 : 3;
    for (let i = 0; i < n; i++){
      const spread = 0.6 * (i - (n - 1) / 2) + rand(-0.22, 0.22), lift = -0.06 + rand(-0.05, 0.05);
      grow(r.ex, r.ey, ang + spread + lift, len * rand(0.74, 0.84), r.w1, depth + 1, childT0 + i * 0.03);
    }
  }
  addBranch(baseX, baseY, -Math.PI / 2, baseY - trunkTopY, trunkW, 0, T.trunkStart);
  branches[0].dur = 0.55;
  const limbT0 = T.trunkStart + 0.36, L = 3;
  for (let i = 0; i < L; i++){
    const ang = -Math.PI / 2 + 0.62 * (i - (L - 1) / 2) + rand(-0.12, 0.12);
    grow(baseX, trunkTopY, ang, limbLen, trunkW * 0.7, 1, limbT0 + i * 0.05);
  }
  const maxT0 = branches.reduce((m, b) => Math.max(m, b.t0 + b.dur), 0);
  const sc = (T.branchSpan - T.trunkStart) / (maxT0 - T.trunkStart);
  for (const b of branches) b.t0 = T.trunkStart + (b.t0 - T.trunkStart) * sc;

  const isMobile = W <= 768;
  const COUNT = isMobile ? Math.round(clamp(rx * ry / 100, 150, 220)) : Math.round(clamp(rx * ry / 56, 250, 440));
  const baseBox = clamp(Math.min(W, H) * 0.115, 30, 74);
  let guard = 0;
  while (hearts.length < COUNT && guard < COUNT * 50){
    guard++;
    const u = rand(-1.06, 1.06), v = rand(-1.06, 1.06);
    if (!pointInPoly(u, v)) continue;
    const x = cx + u * rx, y = cy - v * ry;
    const d = clamp01(Math.hypot(u, v + 1) / 2.4);
    const t0 = T.bloomT0 + d * (T.bloomSpan * 0.82) + rand(0, T.bloomSpan * 0.18);
    const soft = Math.random() < 0.42;
    hearts.push({ x, y, idx: (Math.random() * BLOSSOM.length) | 0, soft, box: baseBox * (soft ? rand(0.6, 0.85) : rand(0.78, 1.12)), rot: rand(-0.55, 0.55), sway: rand(0, 6.28), t0 });
  }
  hearts.sort((a, b) => (a.soft === b.soft ? a.y - b.y : a.soft ? -1 : 1));

  // --- Meadow Sunflowers (Lush, vibrant golden meadow) ---
  sunflowers = [];
  const sunflowerCount = isMobile ? Math.round(clamp(W / 22, 16, 26)) : Math.round(clamp(W / 36, 28, 48));
  for (let i = 0; i < sunflowerCount; i++){
    let sx;
    if (i % 3 === 0){
      sx = rand(W * 0.02, W * 0.40); // Left meadow framing Deva Sri's wish
    } else if (i % 3 === 1){
      sx = rand(W * 0.60, W * 0.98); // Right meadow framing celebration cake
    } else {
      sx = rand(W * 0.35, W * 0.65); // Center base of heart tree
    }
    const sy = groundY + rand(-3, H * 0.05);
    const height = rand(H * 0.13, H * 0.27);
    const depth = Math.random();
    const headSize = lerp(baseBox * 0.92, baseBox * 1.62, depth);
    const lean = rand(-1, 1) * 20;
    const t0 = T.bloomT0 + rand(0, 1.2);

    sunflowers.push({
      rootX: sx, rootY: sy,
      height, lean, depth,
      headSize,
      swaySpeed: rand(1.1, 2.2),
      swayAmp: rand(0.04, 0.08),
      phase: rand(0, 6.28),
      t0,
      soft: depth < 0.30,
      leaves: [
        { pos: rand(0.25, 0.42), side: -1, len: rand(16, 28), rot: rand(-0.4, -0.2) },
        { pos: rand(0.50, 0.70), side: 1, len: rand(16, 28), rot: rand(0.2, 0.4) }
      ]
    });
  }
  sunflowers.sort((a, b) => a.depth - b.depth);
}

function drawSunflowers(t){
  for (const s of sunflowers){
    const p = clamp01((t - s.t0) / 0.85);
    if (p <= 0) continue;
    const scale = easeOutBack(p);
    const sway = Math.sin(t * s.swaySpeed + s.phase) * s.swayAmp;
    const curH = s.height * scale;
    const hx = s.rootX + (s.lean + Math.sin(sway) * 28) * scale;
    const hy = s.rootY - curH * Math.cos(sway);

    // Stem
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(s.rootX, s.rootY);
    const mx = (s.rootX + hx) / 2 + s.lean * 0.3 * scale;
    const my = (s.rootY + hy) / 2;
    ctx.quadraticCurveTo(mx, my, hx, hy);
    const stemGrad = ctx.createLinearGradient(s.rootX, s.rootY, hx, hy);
    stemGrad.addColorStop(0, '#2d5a27');
    stemGrad.addColorStop(1, '#538d38');
    ctx.strokeStyle = stemGrad;
    ctx.lineWidth = Math.max(2, 4.5 * scale);
    ctx.lineCap = 'round';
    ctx.stroke();

    // Leaves
    for (const lf of s.leaves){
      const lp = lf.pos;
      const lx = lerp(s.rootX, hx, lp);
      const ly = lerp(s.rootY, hy, lp);
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(sway + lf.rot + (lf.side < 0 ? -0.4 : 0.4));
      ctx.beginPath();
      ctx.ellipse(lf.side * lf.len * 0.5 * scale, 0, lf.len * 0.5 * scale, lf.len * 0.22 * scale, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#416d2f';
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // Sunflower Bloom Head
    const sprite = s.soft ? SUNFLOWER.soft : SUNFLOWER.crisp;
    if (sprite){
      drawSprite(sprite, hx, hy, s.headSize * scale, sway * 1.6, clamp01(p * 2));
    }
  }
}

function drawBackground(){
  ctx.globalAlpha = 1;
  ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 1; ctx.fillStyle = groundGrad; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawGodRays(t, intensity){
  if (intensity <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const ox = cx, oy = cy - ry * 0.35, R = Math.hypot(W, H) * 1.1;
  const rays = 9, sweep = Math.sin(t * 0.07) * 0.18;
  for (let i = 0; i < rays; i++){
    const a = -Math.PI / 2 + sweep + (i - (rays - 1) / 2) * 0.2;
    const hw = 0.035 + 0.02 * (0.5 + 0.5 * Math.sin(t * 0.5 + i * 1.7));
    const a1 = a - hw, a2 = a + hw;
    const g = ctx.createLinearGradient(ox, oy, ox + Math.cos(a) * R, oy + Math.sin(a) * R);
    g.addColorStop(0, `rgba(255,232,190,${0.10 * intensity})`);
    g.addColorStop(0.5, `rgba(255,214,170,${0.05 * intensity})`);
    g.addColorStop(1, 'rgba(255,214,170,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox + Math.cos(a1) * R, oy + Math.sin(a1) * R);
    ctx.lineTo(ox + Math.cos(a2) * R, oy + Math.sin(a2) * R);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function drawGlow(t){
  const gi = clamp01((t - T.bloomT0) / (T.bloomSpan * 0.9));
  if (gi <= 0) return;
  ctx.save(); ctx.globalAlpha = gi; ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = glowGrad; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawBokeh(t, dt){
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const o of orbs){
    o.y += o.vy * dt; o.x += Math.sin(t * 0.3 + o.phase) * o.drift;
    if (o.y < -o.r){ o.y = H + o.r; o.x = rand(0, W); }
    ctx.globalAlpha = o.alpha;
    ctx.drawImage(o.sprite, o.x - o.r, o.y - o.r, o.r * 2, o.r * 2);
  }
  ctx.restore();
}

function drawFloaters(t, dt, front){
  const appear = clamp01((t - 0.2) / 1.4);
  if (appear <= 0) return;
  for (const f of floaters){
    if ((f.depth >= 0.6) !== front) continue;
    f.y -= f.vy * dt;
    f.x += Math.sin(t * 0.5 + f.phase) * f.sway * dt;
    f.rot += f.vrot * dt;
    if (f.y < -f.box){ f.y = H + f.box; f.x = rand(0, W); }
    drawSprite((f.soft ? SPR.soft : SPR.crisp)[f.idx], f.x, f.y, f.box, f.rot, f.baseA * appear);
  }
}

function drawBranches(t){
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const b of branches){
    const f = clamp01((t - b.t0) / b.dur);
    if (f <= 0) continue;
    const e = easeOutCubic(f);
    ctx.strokeStyle = b.grad;
    const steps = 12, last = Math.max(1, Math.ceil(steps * e));
    let prev = quad(b, 0);
    for (let i = 1; i <= last; i++){
      const tt = Math.min(e, i / steps), p = quad(b, tt);
      ctx.lineWidth = lerp(b.w0, b.w1, tt);
      ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      prev = p;
    }
  }
}

function drawHearts(t){
  const breathe = 1 + Math.sin(t * 0.8) * 0.012;
  for (const h of hearts){
    const p = clamp01((t - h.t0) / 0.6);
    if (p <= 0) continue;
    const scale = Math.max(0, easeOutBack(p));
    let alpha = clamp01(p * 1.7); if (h.soft) alpha *= 0.8;
    const settled = clamp01((t - h.t0 - 0.6) / 0.7);
    const sway = settled * Math.sin(t * 1.5 + h.sway) * (h.box * 0.05);
    const rise = (1 - easeOutCubic(p)) * h.box * 0.45;
    const hx = cx + (h.x - cx) * breathe + sway;
    const hy = cy + (h.y - cy) * breathe - rise;
    drawSprite((h.soft ? SPR.soft : SPR.crisp)[h.idx], hx, hy, h.box * scale, h.rot + sway * 0.012, alpha);
  }
}

function updateTwinkles(t, dt){
  const active = t > T.bloomT0 + T.bloomSpan * 0.45;
  if (active && twinkles.length < 9 && Math.random() < 0.5){
    const h = hearts[(Math.random() * hearts.length) | 0];
    if (h) twinkles.push({ x: h.x, y: h.y, size: rand(0.6, 1.3) * (Math.min(W, H) * 0.05), age: 0, life: rand(0.7, 1.2), rot: rand(0, 6.28) });
  }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = twinkles.length - 1; i >= 0; i--){
    const s = twinkles[i]; s.age += dt;
    const k = s.age / s.life;
    if (k >= 1){ twinkles.splice(i, 1); continue; }
    const a = Math.sin(k * Math.PI);
    drawSprite(SPARKLE, s.x, s.y, s.size * (0.6 + 0.4 * a), s.rot + k * 1.2, a);
  }
  ctx.restore();
}

function spawnPetal(){
  const isSunflower = Math.random() < 0.55;
  if (isSunflower && SUNFLOWER_PETAL){
    const sx = rand(W * 0.05, W * 0.95);
    const sy = rand(H * 0.10, H * 0.45);
    petals.push({
      x: sx, y: sy,
      vy: rand(16, 34), vx: rand(-12, 12),
      sway: rand(0.7, 1.5), phase: rand(0, 6.28),
      box: rand(18, 30), isSunflower: true,
      rot: rand(0, 6.28), vrot: rand(-1.6, 1.6),
      age: 0, land: groundY + rand(-6, H * 0.05)
    });
    return;
  }
  const h = hearts[(Math.random() * hearts.length) | 0];
  if (!h) return;
  petals.push({
    x: h.x + rand(-8, 8), y: h.y + rand(-8, 8),
    vy: rand(14, 30), vx: rand(-8, 8),
    sway: rand(0.6, 1.4), phase: rand(0, 6.28),
    box: h.box * rand(0.34, 0.6), idx: h.idx,
    rot: rand(0, 6.28), vrot: rand(-1.4, 1.4),
    age: 0, land: groundY + rand(-6, H * 0.05)
  });
}
function drawPetals(t, dt){
  for (let i = petals.length - 1; i >= 0; i--){
    const p = petals[i]; p.age += dt; p.vy += 8 * dt;
    p.x += (p.vx + Math.sin(t * p.sway + p.phase) * 16) * dt;
    p.y += p.vy * dt; p.rot += p.vrot * dt;
    if (p.y >= p.land){
      rested.push({
        x: clamp(p.x, 6, W - 6), y: p.land, box: p.box,
        idx: p.idx, isSunflower: p.isSunflower,
        rot: p.rot, a: rand(0.7, 0.95)
      });
      if (rested.length > (W <= 768 ? 38 : 115)) rested.shift();
      petals.splice(i, 1); continue;
    }
    const a = p.age < 0.3 ? p.age / 0.3 : 1;
    if (p.isSunflower && SUNFLOWER_PETAL){
      drawSprite(SUNFLOWER_PETAL, p.x, p.y, p.box, p.rot, a);
    } else {
      drawSprite(SPR.crisp[p.idx], p.x, p.y, p.box, p.rot, a);
    }
  }
}
function drawRested(){
  for (const r of rested){
    if (r.isSunflower && SUNFLOWER_PETAL){
      drawSprite(SUNFLOWER_PETAL, r.x, r.y, r.box, r.rot, r.a);
    } else {
      drawSprite(SPR.crisp[r.idx], r.x, r.y, r.box, r.rot, r.a);
    }
  }
}

function showWish(on){ wishEl.classList.toggle('is-in', on); }

function showCake(on){
  if (cakeWrapper) cakeWrapper.classList.toggle('is-in', on);
}

function resetCake(){
  cakeBlown = false;
  if (cakeCard){
    cakeCard.classList.remove('is-blown');
    cakeCard.setAttribute('aria-label', 'Interactive Birthday Cake. Click to blow out the candles and make a wish!');
  }
  if (cakeConfetti) cakeConfetti.innerHTML = '';
}

function spawnConfetti(){
  if (!cakeConfetti || !cakeCard) return;
  cakeConfetti.innerHTML = '';
  const rect = cakeCard.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height * 0.35;

  const colors = ['#ffb703', '#fb8500', '#e63946', '#ff006e', '#ffd166', '#ffffff', '#2a9d8f'];
  const count = 45;

  for (let i = 0; i < count; i++){
    const p = document.createElement('span');
    p.className = 'confetti-p';
    const size = rand(5, 10);
    p.style.width = `${size}px`;
    p.style.height = `${size * rand(0.6, 1.4)}px`;
    p.style.background = pick(colors);
    p.style.left = `${originX}px`;
    p.style.top = `${originY}px`;
    cakeConfetti.appendChild(p);

    const angle = rand(-Math.PI * 0.95, -Math.PI * 0.05);
    const dist = rand(70, 240);
    const targetX = Math.cos(angle) * dist + rand(-30, 30);
    const targetY = Math.sin(angle) * dist + rand(20, 50);
    const duration = rand(1.2, 2.0);

    gsap.to(p, {
      x: targetX,
      y: targetY,
      rotation: rand(-720, 720),
      duration,
      ease: 'power2.out',
      onComplete: () => p.remove()
    });
    gsap.to(p, {
      y: `+=${rand(80, 150)}`,
      opacity: 0,
      duration: duration * 0.6,
      delay: duration * 0.4,
      ease: 'power1.in'
    });
  }

  // Floating celebration sunflowers and cakes burst!
  const celebrationIcons = ['🌻', '🎂', '🍰', '🧁', '✨', '🌻', '🎂', '💖', '🎉'];
  const iconCount = 26;
  for (let i = 0; i < iconCount; i++){
    const span = document.createElement('span');
    span.className = 'cake-burst-icon';
    span.textContent = pick(celebrationIcons);
    span.style.left = `${originX}px`;
    span.style.top = `${originY}px`;
    cakeConfetti.appendChild(span);

    const angle = rand(-Math.PI * 0.98, -Math.PI * 0.02);
    const dist = rand(80, 320);
    const targetX = Math.cos(angle) * dist + rand(-35, 35);
    const targetY = Math.sin(angle) * dist - rand(30, 90);
    const duration = rand(1.5, 2.6);

    gsap.to(span, {
      x: targetX,
      y: targetY,
      rotation: rand(-45, 45),
      scale: rand(1.1, 1.8),
      duration,
      ease: 'power2.out',
      onComplete: () => span.remove()
    });
    gsap.to(span, {
      y: `+=${rand(60, 120)}`,
      opacity: 0,
      duration: duration * 0.55,
      delay: duration * 0.45,
      ease: 'power1.in'
    });
  }
}

function blowCandles(){
  if (cakeBlown){
    openGallery(0);
    return;
  }
  cakeBlown = true;
  cue('candles');
  cakeCard.classList.add('is-blown');
  cakeCard.setAttribute('aria-label', 'Candles blown out! Click to view memories.');
  spawnConfetti();
  launchMidnightFireworks();
}

function setupCake(){
  if (!cakeCard) return;
  cakeCard.addEventListener('click', blowCandles);
  cakeCard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      blowCandles();
    }
  });

  const tMem = $('toastMemoriesBtn');
  if (tMem) tMem.addEventListener('click', (e) => { e.stopPropagation(); openGallery(0); });
  const tLan = $('toastLanternBtn');
  if (tLan) tLan.addEventListener('click', (e) => { e.stopPropagation(); openLanternModal(); });
  const tLet = $('toastLetterBtn');
  if (tLet) tLet.addEventListener('click', (e) => { e.stopPropagation(); openLetterModal(); });
}

/* ============================================================
   PHOTO MEMORIES ALBUM (Enhanced Skeuomorphic & Interactive)
   ============================================================ */
function renderPhoto(idx, direction = 0){
  if (!polaroidImg) return;
  curPhotoIdx = (idx + PHOTOS.length) % PHOTOS.length;
  const p = PHOTOS[curPhotoIdx];

  const tilt = (curPhotoIdx % 2 === 0 ? 1 : -1) * rand(1.2, 2.5);

  if (direction !== 0){
    gsap.to(polaroidCard, {
      x: direction * 55,
      rotation: tilt + direction * 5,
      opacity: 0.35,
      scale: 0.94,
      duration: 0.16,
      ease: 'power2.in',
      onComplete: () => {
        polaroidImg.src = p.src;
        polaroidImg.style.objectPosition = p.position || 'center 15%';
        polaroidCaption.textContent = p.caption;
        if (polaroidSubnote) polaroidSubnote.textContent = p.subnote;
        if (polaroidStamp) polaroidStamp.textContent = p.stamp;
        if (polaroidLikeCount) polaroidLikeCount.textContent = likeCounts[curPhotoIdx];

        gsap.fromTo(polaroidCard, 
          { x: -direction * 45, rotation: tilt - direction * 3, opacity: 0.5, scale: 0.95 },
          { x: 0, rotation: tilt, opacity: 1, scale: 1, duration: 0.32, ease: 'back.out(1.5)' }
        );
      }
    });
  } else {
    polaroidImg.src = p.src;
    polaroidImg.style.objectPosition = p.position || 'center 15%';
    polaroidCaption.textContent = p.caption;
    if (polaroidSubnote) polaroidSubnote.textContent = p.subnote;
    if (polaroidStamp) polaroidStamp.textContent = p.stamp;
    if (polaroidLikeCount) polaroidLikeCount.textContent = likeCounts[curPhotoIdx];
    gsap.to(polaroidCard, { x: 0, rotation: tilt, duration: 0.3, ease: 'power2.out' });
  }

  if (galleryDots){
    const dots = galleryDots.querySelectorAll('.gallery-dot');
    dots.forEach((d, i) => d.classList.toggle('is-active', i === curPhotoIdx));
  }
}

function popHeartReaction(e){
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  likeCounts[curPhotoIdx]++;
  if (polaroidLikeCount) polaroidLikeCount.textContent = likeCounts[curPhotoIdx];

  if (polaroidLikeBtn){
    gsap.fromTo(polaroidLikeBtn, { scale: 0.8 }, { scale: 1.18, duration: 0.14, yoyo: true, repeat: 1, ease: 'power2.out' });
  }

  if (polaroidBursts && polaroidLikeBtn){
    const rect = polaroidLikeBtn.getBoundingClientRect();
    const wrapRect = polaroidWrapper.getBoundingClientRect();
    const ox = rect.left - wrapRect.left + rect.width / 2;
    const oy = rect.top - wrapRect.top;

    const icons = ['💖', '✨', '🌻', '🎂', '🌸', '🍰', '💕', '⭐', '🥰'];
    for (let i = 0; i < 7; i++){
      const span = document.createElement('span');
      span.className = 'burst-heart-p';
      span.textContent = pick(icons);
      span.style.left = `${ox}px`;
      span.style.top = `${oy}px`;
      polaroidBursts.appendChild(span);

      const ang = rand(-Math.PI * 0.9, -Math.PI * 0.1);
      const dist = rand(50, 150);
      gsap.to(span, {
        x: Math.cos(ang) * dist + rand(-25, 25),
        y: Math.sin(ang) * dist - rand(15, 45),
        rotation: rand(-35, 35),
        scale: rand(0.9, 1.4),
        opacity: 0,
        duration: rand(1.1, 1.7),
        ease: 'power2.out',
        onComplete: () => span.remove()
      });
    }
  }
}

function setupParallaxTilt(){
  if (!polaroidWrapper || !polaroidCard) return;

  polaroidWrapper.addEventListener('mousemove', (e) => {
    const rect = polaroidWrapper.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotX = -((y - cy) / cy) * 6;
    const rotY = ((x - cx) / cx) * 6;

    gsap.to(polaroidCard, {
      rotateX: rotX,
      rotateY: rotY,
      duration: 0.25,
      ease: 'power1.out',
      overwrite: 'auto'
    });

    if (polaroidGlare){
      const px = Math.round((x / rect.width) * 100);
      const py = Math.round((y / rect.height) * 100);
      polaroidGlare.style.background = `radial-gradient(circle at ${px}% ${py}%, rgba(255,255,255,0.3) 0%, transparent 60%)`;
    }
  });

  polaroidWrapper.addEventListener('mouseleave', () => {
    gsap.to(polaroidCard, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.45,
      ease: 'power2.out'
    });
  });
}

function openGallery(initialIdx = 0){
  if (!galleryModal) return;
  galleryModal.hidden = false;
  galleryModal.setAttribute('aria-hidden', 'false');
  galleryModal.classList.add('is-open');
  renderPhoto(initialIdx);
}

function closeGallery(){
  if (!galleryModal) return;
  galleryModal.classList.remove('is-open');
  galleryModal.setAttribute('aria-hidden', 'true');
  setTimeout(() => {
    if (!galleryModal.classList.contains('is-open')) galleryModal.hidden = true;
  }, 400);
}

function setupGallery(){
  const triggerOpen = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    openGallery(0);
  };

  if (toastMemoriesBtn) {
    toastMemoriesBtn.addEventListener('click', triggerOpen);
    toastMemoriesBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
  }
  const openMemBtn = $('openMemoriesBtn');
  if (openMemBtn) {
    openMemBtn.addEventListener('click', triggerOpen);
  }
  if (galleryClose) galleryClose.addEventListener('click', closeGallery);
  if (galleryBackdrop) galleryBackdrop.addEventListener('click', closeGallery);
  if (galleryPrev) galleryPrev.addEventListener('click', (e) => { e.stopPropagation(); renderPhoto(curPhotoIdx - 1, -1); });
  if (galleryNext) galleryNext.addEventListener('click', (e) => { e.stopPropagation(); renderPhoto(curPhotoIdx + 1, 1); });
  if (polaroidLikeBtn) polaroidLikeBtn.addEventListener('click', popHeartReaction);

  if (galleryDots){
    galleryDots.addEventListener('click', (e) => {
      e.stopPropagation();
      const dot = e.target.closest('.gallery-dot');
      if (dot && dot.dataset.index !== undefined){
        renderPhoto(parseInt(dot.dataset.index, 10));
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (!galleryModal || !galleryModal.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeGallery();
    else if (e.key === 'ArrowLeft') renderPhoto(curPhotoIdx - 1, -1);
    else if (e.key === 'ArrowRight') renderPhoto(curPhotoIdx + 1, 1);
  });

  let touchStartX = 0;
  polaroidCard && polaroidCard.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  polaroidCard && polaroidCard.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX;
    if (Math.abs(diff) > 40){
      if (diff > 0) renderPhoto(curPhotoIdx - 1, -1);
      else renderPhoto(curPhotoIdx + 1, 1);
    }
  }, { passive: true });

  setupParallaxTilt();
  window.openMemories = () => openGallery(0);
}

/* the tree's own rAF: plays once from treeStart(), then holds, living */
let treeStartT = 0, treeLastT = 0, treeRAF = 0, lastPetal = 0, replayArmed = false;
window.bdayDone = false;

function treeFrame(now){
  if (!treeStartT){ treeStartT = now; treeLastT = now; }
  const t  = (now - treeStartT) / 1000;
  const dt = Math.min(0.05, (now - treeLastT) / 1000); treeLastT = now;

  const rays = clamp01((t - T.bloomT0) / T.bloomSpan);

  drawBackground();
  drawGodRays(t, rays);
  drawGlow(t);
  drawBokeh(t, dt);
  drawFloaters(t, dt, false);
  drawBranches(t);
  drawHearts(t);
  updateTwinkles(t, dt);
  drawSunflowers(t);
  if (t > T.petalT0 && now - lastPetal > (W <= 768 ? 220 : 150)){ spawnPetal(); if (W > 768) spawnPetal(); lastPetal = now; }
  drawPetals(t, dt);
  drawRested();
  drawFloaters(t, dt, true);

  showWish(t >= T.noteStart);
  showCake(t >= T.noteStart + 0.3);

  if (!window.bdayDone && t >= T.done) window.bdayDone = true;
  if (!replayArmed && t >= T.done + 1.0){ replayArmed = true; armReplay(); }

  treeRAF = requestAnimationFrame(treeFrame);
}

function treeStart(){
  treeStartT = 0; treeLastT = 0; lastPetal = 0; replayArmed = false; window.bdayDone = false;
  cue('grow');
  buildScene();
  if (!treeRAF) treeRAF = requestAnimationFrame(treeFrame);
}
function treeStop(){
  if (treeRAF){ cancelAnimationFrame(treeRAF); treeRAF = 0; }
  ctx.clearRect(0, 0, W, H);
}

function drawFinal(){
  buildScene();
  drawBackground(); drawGodRays(0, 1); drawGlow(T.done); drawBokeh(0, 0); drawFloaters(99, 0, false);
  drawBranches(99); drawHearts(99);
  drawSunflowers(99);
  for (let i = 0; i < 45; i++){
    const isSun = Math.random() < 0.4;
    rested.push({
      x: rand(10, W - 10),
      y: groundY + rand(-6, H * 0.05),
      box: rand(16, 32),
      idx: (Math.random() * BLOSSOM.length) | 0,
      isSunflower: isSun,
      rot: rand(0, 6.28),
      a: 0.85
    });
  }
  drawRested(); drawFloaters(99, 0, true);
  showWish(true);
  showCake(true);
  window.bdayDone = true;
}

/* ============================================================
   ACTS 1–3 (GSAP) — the bow, the shot, the wish
   ============================================================ */

/* the two headline words become per-glyph spans so each hinges up on its own */
function splitWord(el){
  const chars = [...el.textContent];
  el.textContent = '';
  return chars.map((c) => {
    const s = document.createElement('span');
    s.className = 'hl__ch';
    s.textContent = c === ' ' ? ' ' : c;
    el.appendChild(s);
    return s;
  });
}
const line1Chars = splitWord($('wLine1'));
const line2Chars = splitWord($('wLine2'));
const kChars = [...line1Chars, ...line2Chars];

/* drifting light motes behind the scene */
function buildMotes(){
  motes.innerHTML = '';
  for (let i = 0; i < 12; i++){
    const m = document.createElement('span');
    m.className = 'mote';
    const s = rand(4, 12);
    m.style.width = m.style.height = `${s}px`;
    m.style.left = `${rand(4, 96)}%`;
    m.style.top  = `${rand(10, 96)}%`;
    motes.appendChild(m);
    gsap.set(m, { opacity: rand(0.25, 0.7) });
    gsap.to(m, { y: -rand(40, 140), x: rand(-30, 30), duration: rand(7, 14), repeat: -1, yoyo: true, ease: 'sine.inOut', delay: -rand(0, 8) });
    gsap.to(m, { opacity: rand(0.1, 0.5), duration: rand(2.5, 5), repeat: -1, yoyo: true, ease: 'sine.inOut' });
  }
}

/* --- bow geometry (measured; re-measured on resize) -------------------------
   The rig lives lower-left and is rotated so its local "up" axis points at the
   heart; the shot therefore travels on a diagonal. The draw + arrow math all
   live in the rig's LOCAL space (offset geometry is transform-independent, so
   rotation never corrupts it); only the aim ANGLE and the flight DISTANCE come
   from screen measurements. */
const tip = $('tip');
let svgScale = 1, arrowBaseX = 0, arrowBaseY = 0, maxDraw = 120, curDraw = 0;
let pullUX = 0, pullUY = 1;                               // screen unit: string pull-back
const REST_NOCK = 96;                                    // string nock, in bow viewBox units
const nockProxy = { val: REST_NOCK };

function applyNock(){
  const y = nockProxy.val;
  strL.setAttribute('y2', y); strR.setAttribute('y2', y); serving.setAttribute('cy', y);
}

function refreshRig(){
  // the grip is anchored here, and the heart sits at its layout centre (33% down,
  // centred) — using the layout point, not a live rect, keeps the aim steady even
  // while the heart is scaling in.
  const gripX = W * 0.24, gripY = H * 0.76;
  const heartX = W * 0.5, heartY = H * 0.33;
  // rotation so local "up" (0,-1) maps to the grip→heart direction
  const aimRad = Math.atan2(heartX - gripX, gripY - heartY);
  pullUX = -Math.sin(aimRad); pullUY = Math.cos(aimRad);  // opposite of aim = pull-back

  // #bow / #arrow are SVG — no offset* — so measure rects in the rig's LOCAL
  // frame: neutralise the rig transform first (getBBox-style, sync, no paint).
  nockProxy.val = REST_NOCK; applyNock();
  gsap.set(archery, { rotation: 0, scale: 1, x: 0, y: 0 });
  archery.style.left = '0px'; archery.style.top = '0px';
  gsap.set(arrow, { x: 0, y: 0 });
  const aR = archery.getBoundingClientRect();
  const bR = bow.getBoundingClientRect();
  const sR = serving.getBoundingClientRect();
  const rR = arrow.getBoundingClientRect();
  svgScale = bR.width / 460;
  const gripLX = (bR.left - aR.left) + 0.5 * bR.width;
  const gripLY = (bR.top  - aR.top ) + (240 / 300) * bR.height;   // grip ~y240 in viewBox
  const nockLX = (sR.left - aR.left) + 0.5 * sR.width;
  const nockLY = (sR.top  - aR.top ) + 0.5 * sR.height;
  arrowBaseX = nockLX - ((rR.left - aR.left) + 0.5 * rR.width);
  arrowBaseY = nockLY - ((rR.top  - aR.top ) + (205 / 220) * rR.height);

  // anchor the grip at (gripX,gripY) and rotate the rig around it
  archery.style.left = (gripX - gripLX) + 'px';
  archery.style.top  = (gripY - gripLY) + 'px';
  gsap.set(archery, { transformOrigin: `${gripLX}px ${gripLY}px`, rotation: aimRad * 180 / Math.PI });
  gsap.set(arrow, { x: arrowBaseX, y: arrowBaseY });
  maxDraw = Math.min(bR.height * 0.72, H * 0.16, 132);
  curDraw = 0;
}

function setDraw(d){
  curDraw = clamp(d, 0, maxDraw);
  gsap.set(arrow, { x: arrowBaseX, y: arrowBaseY + curDraw });   // local +Y = pull back
  nockProxy.val = REST_NOCK + curDraw / svgScale; applyNock();
  gsap.set(aim, { opacity: 0.55 * (curDraw / maxDraw) });
}

/* the target heart's beat — gentle, alive; killed the instant we fire */
let beatTL = null;
function startBeat(){
  gsap.set(targetHeart, { scale: 1 });
  gsap.set(heartGlow, { scale: 1, opacity: 0.7 });
  beatTL = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });
  beatTL.to(targetHeart, { scale: 1.07, duration: 0.13, ease: 'power2.out' }, 0)
        .to(heartGlow,   { scale: 1.15, opacity: 0.9, duration: 0.13, ease: 'power2.out' }, 0)
        .to(targetHeart, { scale: 1.0, duration: 0.2, ease: 'power2.in' }, 0.13)
        .to(targetHeart, { scale: 1.05, duration: 0.12, ease: 'power2.out' }, 0.3)
        .to(targetHeart, { scale: 1.0, duration: 0.5, ease: 'power2.inOut' }, 0.42)
        .to(heartGlow,   { scale: 1.0, opacity: 0.7, duration: 0.7, ease: 'power2.inOut' }, 0.3);
}
function stopBeat(){ if (beatTL){ beatTL.kill(); beatTL = null; } gsap.set(targetHeart, { scale: 1 }); }

/* a little burst of hearts + sparks where the arrow strikes */
function miniHeartSVG(fill){
  return `<svg viewBox="0 0 24 22" width="100%" height="100%"><path d="M12 20C5.5 15 1.5 11.4 1.5 6.9 1.5 3.6 4 1.5 7 1.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3 0 5.5 2.1 5.5 5.4C23.5 11.4 19.5 15 12 20Z" fill="${fill}"/></svg>`;
}
function burstHearts(){
  const r = target.getBoundingClientRect();
  const hr = hero.getBoundingClientRect();
  const ox = r.left - hr.left + r.width / 2;
  const oy = r.top - hr.top + r.height * 0.42;
  const cols = ['#ff6f97', '#ffb14e', '#ff8fae', '#ffd36a', '#e23b67'];
  const frag = document.createDocumentFragment();
  const nodes = [];
  for (let i = 0; i < 12; i++){
    const heart = i < 8;
    const el = document.createElement('span');
    el.className = 'burst';
    const s = heart ? rand(12, 22) : rand(4, 8);
    el.style.cssText = `position:absolute;left:${ox}px;top:${oy}px;width:${s}px;height:${s}px;margin:${-s / 2}px 0 0 ${-s / 2}px;pointer-events:none;z-index:4;`;
    if (heart) el.innerHTML = miniHeartSVG(pick(cols));
    else { el.style.borderRadius = '50%'; el.style.background = 'radial-gradient(circle,#fff,rgba(255,210,150,0) 70%)'; }
    frag.appendChild(el); nodes.push({ el, heart });
  }
  hero.appendChild(frag);
  nodes.forEach(({ el, heart }) => {
    const ang = rand(-Math.PI, 0);                       // fan upward + out
    const dist = rand(heart ? 70 : 40, heart ? 190 : 120);
    gsap.to(el, {
      x: Math.cos(ang) * dist, y: Math.sin(ang) * dist - rand(10, 50),
      rotation: rand(-120, 120), scale: heart ? rand(0.7, 1.2) : rand(0.4, 1),
      duration: rand(0.7, 1.15), ease: 'power2.out',
    });
    gsap.to(el, { opacity: 0, duration: 0.5, delay: rand(0.35, 0.6), ease: 'power1.in', onComplete: () => el.remove() });
  });
}

/* --- the shot + Acts 2–3 timeline ------------------------------------------ */
function shotGeom(){
  // flight distance = straight-line from the arrow tip to the heart (measured on
  // screen, rotation-aware). Moving the arrow that far along its local "up" axis
  // — which is aimed at the heart — lands the tip dead-centre on it.
  const tipR = tip.getBoundingClientRect();
  const tRect = target.getBoundingClientRect();
  const tipX = tipR.left + tipR.width / 2, tipY = tipR.top + tipR.height / 2;
  const tcx = tRect.left + tRect.width / 2, tcy = tRect.top + tRect.height / 2;
  const flightDist = Math.hypot(tcx - tipX, tcy - tipY);
  const fallPx = Math.min(H * 0.26, H - tcy - tRect.height * 0.4);
  const impactX = tcx, impactY = tcy + fallPx;
  const distC = Math.hypot(Math.max(impactX, W - impactX), Math.max(impactY, H - impactY));
  const reach = Math.hypot(W / 2, H / 2);
  return {
    arrowStartY: arrowBaseY + curDraw,
    arrowFlyY:   arrowBaseY + curDraw - flightDist,       // local -Y = toward the heart
    drawnNock:   REST_NOCK + curDraw / svgScale,
    fallPx, fx: impactX - W / 2, fy: impactY - H / 2,
    floodScale: (distC * 1.12) / 70, bloomScale: (reach * 1.2) / 30,
  };
}

/* floating stardust and sparkles for Act 3 */
function spawnStardustField(){
  if (!stardustField) return;
  stardustField.innerHTML = '';
  const isMobile = window.innerWidth <= 768;
  const count = isMobile ? 18 : 38;
  for (let i = 0; i < count; i++){
    const p = document.createElement('span');
    p.className = 'stardust-p';
    const s = rand(2.5, 6.5);
    p.style.width = `${s}px`;
    p.style.height = `${s}px`;
    p.style.left = `${rand(2, 98)}%`;
    p.style.top = `${rand(16, 84)}%`;
    p.style.opacity = '0';
    stardustField.appendChild(p);

    gsap.to(p, {
      y: rand(-30, -65),
      x: rand(-18, 18),
      opacity: rand(0.35, 0.95),
      duration: rand(2.0, 3.8),
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: rand(0, 1.2)
    });
  }
}

function spawnWishBurst(){
  if (!wishSparkles) return;
  wishSparkles.innerHTML = '';
  const isMobile = window.innerWidth <= 768;
  const stars = ['🌻', '🎂', '✨', '✦', '⭐', '🍰', '💖', '🌻', '🎂'];
  const count = isMobile ? 9 : 16;
  for (let i = 0; i < count; i++){
    const s = document.createElement('span');
    s.className = 'wish-star';
    s.textContent = pick(stars);
    s.style.left = `${rand(12, 88)}%`;
    s.style.top = `${rand(24, 76)}%`;
    s.style.opacity = '0';
    s.style.fontSize = `${rand(13, 24)}px`;
    wishSparkles.appendChild(s);

    gsap.to(s, {
      opacity: rand(0.55, 1),
      scale: rand(1.1, 1.6),
      rotation: rand(-35, 35),
      duration: rand(0.8, 1.6),
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: rand(0, 1.4)
    });
  }
}

let filmTL = null;
function buildFilm(m){
  const t = gsap.timeline({
    paused: true,
    onComplete: () => {
      gsap.set(field, { autoAlpha: 0 });
      treeStart();
      // fade promptly so the growing tree is revealed with no white hold
      gsap.to(bloom, { autoAlpha: 0, duration: 1.15, ease: 'power2.out' });
    },
  });

  // reset (t=0)
  t.set(target, { y: 0, scaleX: 1, scaleY: 1, opacity: 1 })
   .set(arrow, { opacity: 1, x: arrowBaseX, y: m.arrowStartY, scaleY: 1 })
   .set([flood, bloom], { autoAlpha: 0, scale: 0.001, x: 0, y: 0 })
   .set(flood, { x: m.fx, y: m.fy })
   .set(field, { autoAlpha: 0 })
   .set('.blob', { opacity: 0 })
   .set(camera, { scale: 1, yPercent: 0 })
   .set(barTop, { yPercent: -100 })
   .set(barBot, { yPercent: 100 })
   .set(kEyebrow, { opacity: 0, y: 14 })
   .set(kSub, { opacity: 0, y: 14 })
   .set(kChars, { transformPerspective: 1000, transformOrigin: '50% 100%', yPercent: 55, rotationX: -45, opacity: 0, scale: 0.88 })
   .set(uline, { drawn: 0 });
  if (ulineSpark) t.set(ulineSpark, { opacity: 0, x: 0, y: 16 });

  // --- the shot: string snaps (twang), arrow flies up into the heart --------
  t.fromTo(nockProxy, { val: m.drawnNock }, { val: REST_NOCK, duration: 0.5, ease: 'elastic.out(1,0.34)', onUpdate: applyNock }, 0)
   .to(arrow, { y: m.arrowFlyY, duration: 0.26, ease: 'power2.in' }, 0)
   .to(arrow, { scaleY: 1.16, duration: 0.14, ease: 'power2.in' }, 0)
   .to(arrow, { scaleY: 1.0, duration: 0.1, ease: 'power1.out' }, 0.16)
   .to(aim, { opacity: 0, duration: 0.18 }, 0)
   .to([eyebrow, hint], { opacity: 0, duration: 0.2, ease: 'power1.out' }, 0);

  // --- the strike: the arrow embeds, the heart recoils, then holds pierced --
  t.add(burstHearts, 0.26)
   // recoil along the arrow's line (up + right), springing back
   .to(target, { x: 7, y: -9, duration: 0.06, ease: 'power2.out' }, 0.26)
   .to(target, { x: 0, y: 0, duration: 0.32, ease: 'power2.out' }, 0.32)
   .to(target, { scale: 1.14, duration: 0.06, ease: 'power2.out' }, 0.26)
   .to(target, { scale: 1.0, duration: 0.26, ease: 'power2.inOut' }, 0.32)
   // the arrow shudders in the wound, holds embedded so the hit reads, then sinks in
   .to(arrow, { rotation: '+=4', duration: 0.05, yoyo: true, repeat: 4, ease: 'sine.inOut' }, 0.27)
   .set(arrow, { rotation: 0 }, 0.52)
   .to(arrow, { opacity: 0, duration: 0.16, ease: 'power1.out' }, 0.56);

  // --- the fall + the burst / flood -----------------------------------------
  t.to(target, { y: m.fallPx, scaleX: 0.84, scaleY: 1.3, duration: 0.34, ease: 'power1.in' }, 0.64)
   .to(target, { scaleX: 1.4, scaleY: 0.6, duration: 0.07, ease: 'power2.out' }, 0.98)
   .set(flood, { autoAlpha: 1 }, 1.00)
   .fromTo(flood, { scale: 0.02 }, { scale: m.floodScale, duration: 0.34, ease: 'power2.in' }, 1.00)
   .to(target, { opacity: 0, duration: 0.12, ease: 'power1.out' }, 1.06);

  // seam: the field is the same rose as the flood
  t.set(field, { autoAlpha: 1 }, 1.32)
   .set(hero, { autoAlpha: 0 }, 1.33)
   .to('.blob', { opacity: 1, duration: 0.6, ease: 'power2.out' }, 1.34)
   .call(spawnStardustField, null, 1.34)
   .set(flood, { autoAlpha: 0 }, 1.36);

  // --- the camera push -------------------------------------------------------
  t.fromTo(camera, { scale: 1.0, yPercent: 0 }, { scale: 1.08, yPercent: -1.4, duration: 4.3, ease: 'none' }, 1.38);
  if (stardustField){
    t.fromTo(stardustField, { xPercent: 0, yPercent: 0 }, { xPercent: -1.5, yPercent: -1.0, duration: 4.3, ease: 'none' }, 1.38);
  }

  // beat markers for the recorder's soundtrack (no-ops off ?record)
  t.call(cue, ['hit'], 0.26)
   .call(cue, ['flood'], 1.00)
   .call(cue, ['wish'], 1.68)
   .call(cue, ['wish2'], 2.06)
   .call(cue, ['bloom'], 5.00);

  // cinema bars ease into a letterbox with fine golden hairline borders
  t.to(barTop, { yPercent: 0, duration: 0.65, ease: 'power2.out' }, 1.48)
   .to(barBot, { yPercent: 0, duration: 0.65, ease: 'power2.out' }, 1.48);

  // --- the kinetic wish: smooth luxurious reveal with no mask clipping ---
  t.to(kEyebrow, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 1.54)
   .to(line1Chars, { yPercent: 0, rotationX: 0, opacity: 1, scale: 1, duration: 0.62, ease: 'back.out(1.4)', stagger: 0.038 }, 1.68)
   .to(line2Chars, { yPercent: 0, rotationX: 0, opacity: 1, scale: 1, duration: 0.62, ease: 'back.out(1.4)', stagger: 0.038 }, 2.06)
   .to(uline, { drawn: 1, duration: 0.62, ease: 'power2.inOut' }, 2.54);
  if (ulineSpark){
    t.to(ulineSpark, { opacity: 1, duration: 0.12 }, 2.54)
     .fromTo(ulineSpark, { x: 0, y: 16 }, { x: 280, y: 18, duration: 0.62, ease: 'power2.inOut' }, 2.54)
     .to(ulineSpark, { opacity: 0, duration: 0.25 }, 3.12);
  }
  t.call(spawnWishBurst, null, 2.72)
   .to(kSub, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' }, 2.85);

  // --- extended hold: savor the magical stardust, glowing typography & wonder (holds until 4.90s) ---

  // --- the handoff bloom -----------------------------------------------------
  t.to(barTop, { yPercent: -100, duration: 0.55, ease: 'power2.in' }, 4.90)
   .to(barBot, { yPercent: 100, duration: 0.55, ease: 'power2.in' }, 4.90)
   .set(bloom, { autoAlpha: 1 }, 5.00)
   .fromTo(bloom, { scale: 0.02 }, { scale: m.bloomScale, duration: 0.62, ease: 'power2.in' }, 5.00);

  return t;
}

/* --- draw / release interaction -------------------------------------------- */
let played = false, drawing = false, startPX = 0, startPY = 0, startDraw = 0;

function fire(){
  if (played) return;
  played = true;
  drawing = false;
  stopBeat();
  cue('release'); cue('whoosh');
  filmTL = buildFilm(shotGeom());
  filmTL.play(0);
}

function springBack(){
  const from = curDraw;
  gsap.to({ d: from }, { d: 0, duration: 0.55, ease: 'elastic.out(1,0.4)', onUpdate() { setDraw(this.targets()[0].d); } });
}

function autoFire(){
  if (played) return;
  recT0 = performance.now(); cue('draw');       // t=0 of the soundtrack
  gsap.to({ d: curDraw }, {
    d: maxDraw * 0.94, duration: 0.62, ease: 'power2.inOut',
    onUpdate() { setDraw(this.targets()[0].d); },
    onComplete: () => gsap.delayedCall(0.16, fire),
  });
}

archery.addEventListener('pointerdown', (e) => {
  if (played) return;
  drawing = true;
  try { archery.setPointerCapture(e.pointerId); } catch (_) {}
  startPX = e.clientX; startPY = e.clientY; startDraw = curDraw;
  e.preventDefault();
});
archery.addEventListener('pointermove', (e) => {
  if (!drawing) return;
  // project the drag onto the pull-back axis, so dragging back along the aim
  // (down + away from the heart) draws the string — on any shot angle.
  const proj = (e.clientX - startPX) * pullUX + (e.clientY - startPY) * pullUY;
  setDraw(startDraw + proj);
});
function endDraw(e){
  if (!drawing) return;
  drawing = false;
  const dist = e && e.clientX !== undefined ? Math.hypot(e.clientX - startPX, e.clientY - startPY) : 0;
  if (curDraw > maxDraw * 0.22) {
    fire();
  } else if (dist < 10) {
    autoFire(); // Tap on bow automatically draws and fires
  } else {
    springBack();
  }
}
archery.addEventListener('pointerup', endDraw);
archery.addEventListener('pointercancel', endDraw);
archery.addEventListener('keydown', (e) => {
  if (played) return;
  if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); autoFire(); }
});

if (target){
  target.style.pointerEvents = 'auto';
  target.style.cursor = 'pointer';
  target.addEventListener('click', () => {
    if (!played) autoFire();
  });
}

/* boot Act 1: reveal the target + bow + hint, then start the beat */
function enter(){
  try { if (!isMusicBoxPlaying) startMusicBox(); } catch(e){}
  gsap.set(hero, { autoAlpha: 1 });
  refreshRig();
  setDraw(0);
  gsap.set([eyebrow, hint], { opacity: 0, y: 14 });
  gsap.set(target, { opacity: 0, y: 10, scaleX: 0.9, scaleY: 0.9 });
  gsap.set(archery, { opacity: 0, scale: 0.85 });        // scale from the grip; keeps rotation
  gsap.set(heartGlow, { opacity: 0, scale: 1 });
  gsap.set(arrow, { opacity: 1 });

  const tl = gsap.timeline({ onComplete: startBeat });
  tl.to(target,   { opacity: 1, y: 0, scaleX: 1, scaleY: 1, duration: 0.8, ease: 'power3.out' }, 0.1)
    .to(heartGlow,{ opacity: 0.7, duration: 0.8, ease: 'power2.out' }, 0.2)
    .to(archery,  { opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' }, 0.28)
    .to(eyebrow,  { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0.4)
    .to(hint,     { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0.7);
}

function armReplay(){
  replay.hidden = false;
  requestAnimationFrame(() => {
    replay.classList.add('is-shown');
  });
}

/* back to Act 1, ready to be drawn again */
function resetAll(){
  treeStop();
  showWish(false);
  showCake(false);
  resetCake();
  closeGallery();
  window.bdayDone = false; replayArmed = false;
  replay.classList.remove('is-shown'); replay.hidden = true;
  if (stardustField) stardustField.innerHTML = '';
  if (wishSparkles) wishSparkles.innerHTML = '';
  if (filmTL){ filmTL.pause(0); }
  gsap.set([flood, bloom], { autoAlpha: 0 });
  gsap.set(field, { autoAlpha: 0 });
  gsap.set(arrow, { opacity: 1, scaleY: 1 });
  played = false;
  enter();
}

/* ============================================================
   FEATURE 5: BIRTHDAY SONG PLAYER ("Happy Birthday")
   Plays the 30s to 1m20s (50s loop) segment of Happy-Birthday.mp3
   ============================================================ */
let audioCtx = null;

function initAudioContext(){
  if (!audioCtx){
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx){
      audioCtx = new AudioCtx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended'){
    audioCtx.resume();
  }
}

window.addEventListener('pointerdown', () => { initAudioContext(); }, { once: true });
window.addEventListener('keydown', () => { initAudioContext(); }, { once: true });

let bdayAudio = null;
let isMusicBoxPlaying = false;

function initAudioElement(){
  if (!bdayAudio){
    bdayAudio = new Audio('/happy-birthday.mp3');
    bdayAudio.loop = true;
    bdayAudio.preload = 'auto';

    // If loaded file is full duration (>65s), maintain 30s to 80s (1m20s) playback
    bdayAudio.addEventListener('timeupdate', () => {
      if (bdayAudio.duration > 65){
        if (bdayAudio.currentTime < 30){
          bdayAudio.currentTime = 30;
        } else if (bdayAudio.currentTime >= 80){
          bdayAudio.currentTime = 30;
        }
      }
    });

    bdayAudio.addEventListener('ended', () => {
      if (bdayAudio.duration > 65) bdayAudio.currentTime = 30;
      bdayAudio.play().catch(() => {});
    });

    bdayAudio.addEventListener('play', () => {
      isMusicBoxPlaying = true;
      const btn = $('musicBoxBtn');
      if (btn) btn.classList.add('is-playing');
    });

    bdayAudio.addEventListener('pause', () => {
      isMusicBoxPlaying = false;
      const btn = $('musicBoxBtn');
      if (btn) btn.classList.remove('is-playing');
    });
  }
}

function startMusicBox(){
  initAudioElement();
  initAudioContext();
  if (!bdayAudio) return;

  if (bdayAudio.duration > 65 && bdayAudio.currentTime < 30){
    bdayAudio.currentTime = 30;
  }

  const p = bdayAudio.play();
  if (p !== undefined){
    p.then(() => {
      isMusicBoxPlaying = true;
      const btn = $('musicBoxBtn');
      if (btn) btn.classList.add('is-playing');
    }).catch(() => {
      // Audio playback waiting for user gesture
    });
  }
}

function stopMusicBox(){
  if (bdayAudio){
    bdayAudio.pause();
  }
  isMusicBoxPlaying = false;
  const btn = $('musicBoxBtn');
  if (btn) btn.classList.remove('is-playing');
}

function toggleMusicBox(){
  if (isMusicBoxPlaying) stopMusicBox();
  else startMusicBox();
}

function playMagicalChime(){
  initAudioContext();
  if (!audioCtx) return;
  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((f, i) => {
    setTimeout(() => {
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 1.2);
    }, i * 75);
  });
}

function setupMusicBox(){
  const btn = $('musicBoxBtn');
  if (btn){
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMusicBox();
    });
  }

  // Auto-play music as soon as user enters or touches/clicks anywhere
  const autoPlayOnEnter = () => {
    if (!isMusicBoxPlaying) {
      startMusicBox();
    }
  };

  window.addEventListener('pointerdown', autoPlayOnEnter, { once: true });
  window.addEventListener('touchstart', autoPlayOnEnter, { once: true });
  window.addEventListener('click', autoPlayOnEnter, { once: true });
  window.addEventListener('keydown', autoPlayOnEnter, { once: true });

  // Try immediate start on load
  try {
    startMusicBox();
  } catch(e){}
}

/* ============================================================
   FEATURE 1: SPARKLER & STARDUST CURSOR WAND
   ============================================================ */
let cursorCanvas = null;
let cursorCtx = null;
let cursorParticles = [];
let cursorRAF = 0;
let lastPointerPos = { x: -1, y: -1 };

function initCursorCanvas(){
  cursorCanvas = $('cursorCanvas');
  if (!cursorCanvas) return;
  cursorCtx = cursorCanvas.getContext('2d');
  
  function resizeCursor(){
    cursorCanvas.width = window.innerWidth;
    cursorCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCursor);
  resizeCursor();

  function spawnCursorParticles(x, y, count = 2){
    const colors = ['#ffe17d', '#ffb703', '#fb8500', '#ffffff', '#ffd166'];
    for (let i = 0; i < count; i++){
      const angle = rand(0, Math.PI * 2);
      const spd = rand(0.5, 3.2);
      const isStar = Math.random() < 0.35;
      const isPetal = Math.random() < 0.15;
      cursorParticles.push({
        x: x + rand(-4, 4),
        y: y + rand(-4, 4),
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd + rand(0.3, 1.2),
        size: isPetal ? rand(4, 7) : (isStar ? rand(3, 5.5) : rand(1.5, 3.2)),
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: rand(0.022, 0.045),
        type: isPetal ? 'petal' : (isStar ? 'star' : 'spark'),
        rot: rand(0, Math.PI * 2),
        vrot: rand(-0.08, 0.08)
      });
    }
    if (!cursorRAF){
      cursorRAF = requestAnimationFrame(animateCursor);
    }
  }

  function onPointerMove(e){
    if (e.pointerType === 'touch') return; // Don't track drag on touchscreens to ensure smooth UI
    const x = e.clientX !== undefined ? e.clientX : -1;
    const y = e.clientY !== undefined ? e.clientY : -1;
    if (x < 0 || y < 0) return;

    if (lastPointerPos.x >= 0){
      const dx = x - lastPointerPos.x;
      const dy = y - lastPointerPos.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 6){
        const steps = Math.min(5, Math.floor(dist / 14));
        for (let s = 1; s <= steps; s++){
          const t = s / steps;
          spawnCursorParticles(lastPointerPos.x + dx * t, lastPointerPos.y + dy * t, 1);
        }
      }
    }
    lastPointerPos = { x, y };
    spawnCursorParticles(x, y, 1);
  }

  function onPointerDown(e){
    const x = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : -1);
    const y = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : -1);
    if (x < 0 || y < 0) return;
    const count = e.pointerType === 'touch' ? 7 : 18;
    spawnCursorParticles(x, y, count);
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerdown', onPointerDown, { passive: true });
}

function animateCursor(){
  if (!cursorCtx || !cursorCanvas) return;
  cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);

  for (let i = cursorParticles.length - 1; i >= 0; i--){
    const p = cursorParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05;
    p.vx *= 0.98;
    p.alpha -= p.decay;
    p.rot += p.vrot;

    if (p.alpha <= 0){
      cursorParticles.splice(i, 1);
      continue;
    }

    cursorCtx.save();
    cursorCtx.translate(p.x, p.y);
    cursorCtx.rotate(p.rot);

    if (p.type === 'star'){
      const r = p.size;
      cursorCtx.fillStyle = p.color;
      // Soft radial glow without costly shadowBlur
      cursorCtx.globalAlpha = Math.max(0, p.alpha * 0.32);
      cursorCtx.beginPath();
      cursorCtx.arc(0, 0, r * 1.8, 0, Math.PI * 2);
      cursorCtx.fill();
      // Crisp star
      cursorCtx.globalAlpha = Math.max(0, p.alpha);
      cursorCtx.beginPath();
      cursorCtx.moveTo(0, -r);
      cursorCtx.quadraticCurveTo(0, 0, r, 0);
      cursorCtx.quadraticCurveTo(0, 0, 0, r);
      cursorCtx.quadraticCurveTo(0, 0, -r, 0);
      cursorCtx.quadraticCurveTo(0, 0, 0, -r);
      cursorCtx.fill();
    } else if (p.type === 'petal'){
      cursorCtx.fillStyle = '#ffb703';
      cursorCtx.globalAlpha = Math.max(0, p.alpha * 0.35);
      cursorCtx.beginPath();
      cursorCtx.ellipse(0, 0, p.size * 0.9, p.size * 1.5, 0, 0, Math.PI * 2);
      cursorCtx.fill();
      cursorCtx.globalAlpha = Math.max(0, p.alpha);
      cursorCtx.beginPath();
      cursorCtx.ellipse(0, 0, p.size * 0.5, p.size, 0, 0, Math.PI * 2);
      cursorCtx.fill();
    } else {
      cursorCtx.fillStyle = p.color;
      cursorCtx.globalAlpha = Math.max(0, p.alpha * 0.3);
      cursorCtx.beginPath();
      cursorCtx.arc(0, 0, p.size * 2.2, 0, Math.PI * 2);
      cursorCtx.fill();
      cursorCtx.globalAlpha = Math.max(0, p.alpha);
      cursorCtx.beginPath();
      cursorCtx.arc(0, 0, p.size, 0, Math.PI * 2);
      cursorCtx.fill();
    }

    cursorCtx.restore();
  }

  if (cursorParticles.length > 0){
    cursorRAF = requestAnimationFrame(animateCursor);
  } else {
    cursorRAF = 0;
  }
}

/* ============================================================
   FEATURE 3: MIDNIGHT FIREWORKS SPECTACULAR ("DEVA SRI")
   ============================================================ */
let fwCanvas = null;
let fwCtx = null;
let fwParticles = [];
let fwRockets = [];
let fwRAF = 0;
let fwRunning = false;

function initFireworksCanvas(){
  fwCanvas = $('fireworksCanvas');
  if (!fwCanvas) return;
  fwCtx = fwCanvas.getContext('2d');
  function resizeFw(){
    fwCanvas.width = window.innerWidth;
    fwCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeFw);
  resizeFw();
}

function playFireworkSound(isFinale = false){
  initAudioContext();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(isFinale ? 130 : 100, now);
  osc.frequency.exponentialRampToValueAtTime(28, now + (isFinale ? 0.8 : 0.5));
  gain.gain.setValueAtTime(isFinale ? 0.4 : 0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + (isFinale ? 0.9 : 0.6));
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 1.0);
}

function launchRocket(startX, startY, targetX, targetY, type, onExplode){
  fwRockets.push({
    x: startX,
    y: startY,
    targetX,
    targetY,
    vx: (targetX - startX) / 32,
    vy: (targetY - startY) / 32,
    step: 0,
    maxSteps: 32,
    type,
    onExplode
  });
  if (!fwRAF){
    fwRunning = true;
    fwRAF = requestAnimationFrame(animateFireworks);
  }
}

function createFireworkBurst(cx, cy, type = 'willow'){
  playFireworkSound(type === 'devaSri');
  const paletteGold = ['#fff275', '#ffb703', '#fb8500', '#ffffff', '#ffd166'];
  const paletteRose = ['#ff4d6d', '#ff758f', '#ffb3c1', '#fff0f3', '#ff8fa3'];
  const isMobile = window.innerWidth <= 768;

  if (type === 'willow'){
    const count = isMobile ? 55 : 90;
    for (let i = 0; i < count; i++){
      const angle = rand(0, Math.PI * 2);
      const spd = rand(1.5, 7.5);
      fwParticles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        gravity: 0.06,
        drag: 0.97,
        alpha: 1,
        decay: rand(0.009, 0.018),
        color: paletteGold[Math.floor(Math.random() * paletteGold.length)],
        size: rand(1.8, 3.2),
        flicker: true
      });
    }
  } else if (type === 'heart'){
    const step = isMobile ? 0.12 : 0.08;
    for (let t = 0; t < Math.PI * 2; t += step){
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
      const spd = rand(0.22, 0.28);
      fwParticles.push({
        x: cx, y: cy,
        vx: hx * spd,
        vy: hy * spd,
        gravity: 0.03,
        drag: 0.96,
        alpha: 1,
        decay: rand(0.012, 0.022),
        color: paletteRose[Math.floor(Math.random() * paletteRose.length)],
        size: rand(2.2, 3.8),
        flicker: true
      });
    }
  } else if (type === 'sunflower'){
    const count = isMobile ? 48 : 80;
    for (let i = 0; i < count; i++){
      const angle = (i / count) * Math.PI * 2;
      const spd = rand(4.5, 6.2);
      fwParticles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        gravity: 0.04,
        drag: 0.96,
        alpha: 1,
        decay: rand(0.012, 0.022),
        color: '#ffb703',
        size: rand(2.5, 4.0),
        flicker: true
      });
    }
    for (let i = 0; i < 25; i++){
      const angle = rand(0, Math.PI * 2);
      const spd = rand(0.5, 2.2);
      fwParticles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        gravity: 0.02,
        drag: 0.95,
        alpha: 1,
        decay: 0.016,
        color: '#8b4500',
        size: rand(2, 3),
        flicker: false
      });
    }
  } else if (type === 'devaSri'){
    const LETTER_MATRICES = {
      'D': [
        [1,1,1,0],
        [1,0,0,1],
        [1,0,0,1],
        [1,0,0,1],
        [1,0,0,1],
        [1,0,0,1],
        [1,1,1,0]
      ],
      'E': [
        [1,1,1,1],
        [1,0,0,0],
        [1,0,0,0],
        [1,1,1,0],
        [1,0,0,0],
        [1,0,0,0],
        [1,1,1,1]
      ],
      'V': [
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [0,1,0,1,0],
        [0,1,0,1,0],
        [0,1,0,1,0],
        [0,0,1,0,0]
      ],
      'A': [
        [0,1,1,0],
        [1,0,0,1],
        [1,0,0,1],
        [1,1,1,1],
        [1,0,0,1],
        [1,0,0,1],
        [1,0,0,1]
      ],
      'S': [
        [0,1,1,1],
        [1,0,0,0],
        [1,1,1,0],
        [0,0,0,1],
        [0,0,0,1],
        [1,0,0,1],
        [0,1,1,0]
      ],
      'R': [
        [1,1,1,0],
        [1,0,0,1],
        [1,0,0,1],
        [1,1,1,0],
        [1,0,1,0],
        [1,0,0,1],
        [1,0,0,1]
      ],
      'I': [
        [1,1,1],
        [0,1,0],
        [0,1,0],
        [0,1,0],
        [0,1,0],
        [0,1,0],
        [1,1,1]
      ]
    };

    const word1 = ['D', 'E', 'V', 'A'];
    const word2 = ['S', 'R', 'I'];
    const dotSpacing = Math.min(13, Math.max(7, window.innerWidth / 70));
    
    function measureWordWidth(letters){
      let w = 0;
      letters.forEach((ch, idx) => {
        const mat = LETTER_MATRICES[ch];
        const cols = mat ? mat[0].length : 3;
        w += cols * dotSpacing;
        if (idx < letters.length - 1) w += dotSpacing * 1.6;
      });
      return w;
    }

    const w1Width = measureWordWidth(word1);
    const w2Width = measureWordWidth(word2);
    const spaceBetweenWords = dotSpacing * 3.5;
    const totalWidth = w1Width + spaceBetweenWords + w2Width;
    let currX = cx - totalWidth / 2;
    const baseY = cy - (3.5 * dotSpacing);

    function spawnWord(letters){
      letters.forEach((ch, idx) => {
        const mat = LETTER_MATRICES[ch];
        if (!mat) return;
        const rows = mat.length;
        const cols = mat[0].length;
        for (let r = 0; r < rows; r++){
          for (let c = 0; c < cols; c++){
            if (mat[r][c] === 1){
              const px = currX + c * dotSpacing;
              const py = baseY + r * dotSpacing;
              fwParticles.push({
                x: cx + rand(-15, 15),
                y: cy + rand(-15, 15),
                targetX: px,
                targetY: py,
                isLetter: true,
                alpha: 1,
                life: 0,
                maxLife: 240,
                color: '#fff5b8',
                size: rand(2.2, 3.8),
                flickerRate: rand(0.15, 0.35)
              });
            }
          }
        }
        currX += (cols * dotSpacing) + (dotSpacing * 1.6);
      });
    }

    spawnWord(word1);
    currX += spaceBetweenWords - (dotSpacing * 1.6);
    spawnWord(word2);

    for (let i = 0; i < 70; i++){
      const angle = rand(0, Math.PI * 2);
      const spd = rand(4, 9);
      fwParticles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        gravity: 0.04,
        drag: 0.97,
        alpha: 1,
        decay: rand(0.008, 0.016),
        color: paletteGold[Math.floor(Math.random() * paletteGold.length)],
        size: rand(1.8, 3.2),
        flicker: true
      });
    }
  }
}

function animateFireworks(){
  if (!fwCtx || !fwCanvas) return;
  fwCtx.clearRect(0, 0, fwCanvas.width, fwCanvas.height);

  for (let i = fwRockets.length - 1; i >= 0; i--){
    const r = fwRockets[i];
    r.step++;
    r.x += r.vx;
    r.y += r.vy;

    fwCtx.save();
    fwCtx.fillStyle = '#ffcf56';
    // Soft outer glow without shadowBlur
    fwCtx.globalAlpha = 0.35;
    fwCtx.beginPath();
    fwCtx.arc(r.x, r.y, 5.5, 0, Math.PI * 2);
    fwCtx.fill();
    // Core rocket head
    fwCtx.globalAlpha = 1;
    fwCtx.beginPath();
    fwCtx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
    fwCtx.fill();
    fwCtx.restore();

    if (r.step >= r.maxSteps){
      createFireworkBurst(r.targetX, r.targetY, r.type);
      if (r.onExplode) r.onExplode();
      fwRockets.splice(i, 1);
    }
  }

  for (let i = fwParticles.length - 1; i >= 0; i--){
    const p = fwParticles[i];

    if (p.isLetter){
      p.life++;
      if (p.targetX !== undefined){
        p.x += (p.targetX - p.x) * 0.12;
        p.y += (p.targetY - p.y) * 0.12;
      }
      if (p.life > 190){
        p.y += (p.life - 190) * 0.04;
        p.alpha -= 0.018;
      }
      if (p.alpha <= 0 || p.life >= p.maxLife){
        fwParticles.splice(i, 1);
        continue;
      }

      fwCtx.save();
      const sparkle = (Math.sin(p.life * p.flickerRate) * 0.4 + 0.6) * p.alpha;
      const jx = rand(-0.7, 0.7);
      const jy = rand(-0.7, 0.7);
      // Soft glow
      fwCtx.fillStyle = '#ffb703';
      fwCtx.globalAlpha = Math.max(0, sparkle * 0.32);
      fwCtx.beginPath();
      fwCtx.arc(p.x + jx, p.y + jy, p.size * 2.2, 0, Math.PI * 2);
      fwCtx.fill();
      // Core sparkle
      fwCtx.fillStyle = p.color;
      fwCtx.globalAlpha = Math.max(0, sparkle);
      fwCtx.beginPath();
      fwCtx.arc(p.x + jx, p.y + jy, p.size, 0, Math.PI * 2);
      fwCtx.fill();
      fwCtx.restore();

    } else {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity || 0.04;
      p.vx *= p.drag || 0.97;
      p.vy *= p.drag || 0.97;
      p.alpha -= p.decay || 0.015;

      if (p.alpha <= 0){
        fwParticles.splice(i, 1);
        continue;
      }

      fwCtx.save();
      const flicker = p.flicker ? (Math.random() * 0.4 + 0.6) : 1;
      const curA = Math.max(0, p.alpha * flicker);
      fwCtx.fillStyle = p.color;
      // Soft glow
      fwCtx.globalAlpha = curA * 0.28;
      fwCtx.beginPath();
      fwCtx.arc(p.x, p.y, p.size * 1.8, 0, Math.PI * 2);
      fwCtx.fill();
      // Core particle
      fwCtx.globalAlpha = curA;
      fwCtx.beginPath();
      fwCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      fwCtx.fill();
      fwCtx.restore();
    }
  }

  if (fwRockets.length > 0 || fwParticles.length > 0){
    fwRAF = requestAnimationFrame(animateFireworks);
  } else {
    fwRAF = 0;
    fwRunning = false;
  }
}

function launchMidnightFireworks(){
  initFireworksCanvas();
  const W = window.innerWidth;
  const H = window.innerHeight;

  setTimeout(() => {
    launchRocket(W * 0.25, H, W * 0.32, H * 0.32, 'willow');
    launchRocket(W * 0.75, H, W * 0.68, H * 0.30, 'willow');
  }, 200);

  setTimeout(() => {
    launchRocket(W * 0.35, H, W * 0.40, H * 0.36, 'heart');
    launchRocket(W * 0.65, H, W * 0.60, H * 0.36, 'heart');
  }, 1600);

  setTimeout(() => {
    launchRocket(W * 0.5, H, W * 0.5, H * 0.26, 'sunflower');
  }, 3100);

  setTimeout(() => {
    launchRocket(W * 0.5, H, W * 0.5, H * 0.22, 'devaSri');
  }, 4500);
}

/* ============================================================
   FEATURE 2: FLOATING SKY LANTERNS SYSTEM
   ============================================================ */
let selectedLanternWish = '🌻 Bright Smiles & Golden Sunshine';

function openLanternModal(){
  const modal = $('lanternModal');
  if (!modal) return;
  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
  modal.classList.add('is-open');
  const input = $('lanternCustomInput');
  if (input) input.value = '';
  updateLanternTagPreview(selectedLanternWish);
}

function closeLanternModal(){
  const modal = $('lanternModal');
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  setTimeout(() => {
    if (!modal.classList.contains('is-open')) modal.hidden = true;
  }, 400);
}

function updateLanternTagPreview(text){
  const tag = $('lanternTagPreview');
  if (tag){
    tag.textContent = 'Deva Sri ✦ ' + (text || 'Pure Joy');
  }
}

function playLanternAscentChimes(){
  initAudioContext();
  if (!audioCtx) return;
  const notes = [523.25, 659.25, 783.99, 987.77, 1046.50];
  notes.forEach((f, idx) => {
    setTimeout(() => {
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(f * 2, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + 1.4);
      osc2.stop(now + 1.4);
    }, idx * 110);
  });
}

function createSingleLantern(wishText, xPercent, isCompanion = false, delayMs = 0){
  setTimeout(() => {
    const container = $('skyLanterns');
    if (!container) return;

    const lantern = document.createElement('div');
    lantern.className = 'sky-lantern' + (isCompanion ? ' sky-lantern--companion' : '');

    const inner = document.createElement('div');
    inner.className = 'sky-lantern__inner';

    const base = document.createElement('div');
    base.className = 'sky-lantern__base';

    lantern.appendChild(inner);
    lantern.appendChild(base);

    if (!isCompanion){
      const tag = document.createElement('div');
      tag.className = 'sky-lantern__tag';
      tag.textContent = '🌻 Deva Sri ✦ ' + wishText;
      lantern.appendChild(tag);
    }

    lantern.style.left = (xPercent + rand(-3, 3)) + 'vw';
    lantern.style.bottom = (isCompanion ? rand(10, 16) : 14) + '%';
    lantern.style.opacity = '0';
    lantern.style.transform = 'scale(' + (isCompanion ? rand(0.7, 0.9) : 1.1) + ')';

    container.appendChild(lantern);

    gsap.to(lantern, {
      opacity: 1,
      duration: 0.8,
      ease: 'power2.out'
    });

    const floatDuration = isCompanion ? rand(10, 14) : 11;
    const driftX = rand(-60, 60);

    gsap.to(lantern, {
      y: -(window.innerHeight * 0.95 + 120),
      duration: floatDuration,
      ease: 'power1.inOut',
      onComplete: () => {
        if (lantern.parentNode) lantern.parentNode.removeChild(lantern);
      }
    });

    gsap.to(lantern, {
      x: driftX,
      duration: rand(3.5, 5.5),
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });

    gsap.to(lantern, {
      scale: isCompanion ? 0.25 : 0.4,
      opacity: 0.5,
      delay: floatDuration * 0.55,
      duration: floatDuration * 0.45,
      ease: 'power2.in'
    });
  }, delayMs);
}

function spawnSkyLantern(wishText){
  const container = $('skyLanterns');
  if (!container) return;

  const skyToast = $('skyWishToast');
  const skyToastTag = $('skyWishToastTag');
  if (skyToast && skyToastTag){
    skyToastTag.textContent = 'Deva Sri ✦ ' + wishText;
    skyToast.classList.add('is-active');
    setTimeout(() => {
      skyToast.classList.remove('is-active');
    }, 6000);
  }

  playLanternAscentChimes();

  createSingleLantern(wishText, 50, false, 0);
  createSingleLantern(wishText, 24, true, 250);
  createSingleLantern(wishText, 38, true, 550);
  createSingleLantern(wishText, 64, true, 380);
  createSingleLantern(wishText, 78, true, 700);

  setTimeout(() => {
    if (typeof createFireworkBurst === 'function'){
      const W = window.innerWidth;
      const H = window.innerHeight;
      createFireworkBurst(W * 0.35, H * 0.28, 'willow');
      createFireworkBurst(W * 0.65, H * 0.25, 'sunflower');
    }
  }, 2800);
}

function setupLanterns(){
  const openBtn = $('openLanternBtn');
  if (openBtn) openBtn.addEventListener('click', openLanternModal);

  const closeBtn = $('lanternCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', closeLanternModal);

  const backdrop = $('lanternBackdrop');
  if (backdrop) backdrop.addEventListener('click', closeLanternModal);

  const presets = document.querySelectorAll('.lantern-presets .preset-btn');
  presets.forEach(btn => {
    btn.addEventListener('click', () => {
      presets.forEach(p => p.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      selectedLanternWish = btn.dataset.wish || btn.textContent.trim();
      updateLanternTagPreview(selectedLanternWish);
    });
  });

  const customInput = $('lanternCustomInput');
  if (customInput){
    customInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val){
        presets.forEach(p => p.classList.remove('is-selected'));
        selectedLanternWish = val;
      }
      updateLanternTagPreview(val || selectedLanternWish);
    });
  }

  const submitBtn = $('lanternSubmitBtn');
  if (submitBtn){
    submitBtn.addEventListener('click', () => {
      const customVal = customInput ? customInput.value.trim() : '';
      const wishToRelease = customVal || selectedLanternWish || 'Golden Sunshine & Smiles';
      closeLanternModal();
      spawnSkyLantern(wishToRelease);
    });
  }

  window.addEventListener('keydown', (e) => {
    const modal = $('lanternModal');
    if (modal && modal.classList.contains('is-open') && e.key === 'Escape'){
      closeLanternModal();
    }
  });
}

/* ============================================================
   FEATURE 4: WAX-SEALED SECRET LETTER MODAL
   ============================================================ */
let isLetterUnsealed = false;

function openLetterModal(){
  const modal = $('letterModal');
  if (!modal) return;
  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
  modal.classList.add('is-open');

  const envelope = $('letterEnvelope');
  const parchment = $('letterParchment');
  if (envelope && parchment){
    if (isLetterUnsealed){
      envelope.hidden = true;
      parchment.hidden = false;
    } else {
      envelope.hidden = false;
      parchment.hidden = true;
    }
  }
}

function closeLetterModal(){
  const modal = $('letterModal');
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  setTimeout(() => {
    if (!modal.classList.contains('is-open')) modal.hidden = true;
  }, 400);
}

function unsealLetter(){
  if (isLetterUnsealed) return;
  isLetterUnsealed = true;

  const seal = $('letterSeal');
  const envelope = $('letterEnvelope');
  const parchment = $('letterParchment');

  playMagicalChime();

  if (seal){
    gsap.to(seal, {
      scale: 1.25,
      rotation: 12,
      boxShadow: '0 0 35px #ffd066',
      duration: 0.2,
      onComplete: () => {
        gsap.to(seal, { scale: 0, opacity: 0, duration: 0.25 });
        if (envelope && parchment){
          gsap.to(envelope, {
            scale: 0.9,
            opacity: 0,
            duration: 0.35,
            onComplete: () => {
              envelope.hidden = true;
              parchment.hidden = false;
              gsap.fromTo(parchment,
                { scale: 0.85, opacity: 0, y: 30 },
                { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.4)' }
              );
            }
          });
        }
      }
    });
  }
}

function setupLetter(){
  const openBtn = $('openLetterBtn');
  if (openBtn) openBtn.addEventListener('click', openLetterModal);

  const seal = $('letterSeal');
  if (seal) seal.addEventListener('click', unsealLetter);

  const envelope = $('letterEnvelope');
  if (envelope) envelope.addEventListener('click', unsealLetter);

  const closeBtn = $('letterCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', closeLetterModal);

  const backdrop = $('letterBackdrop');
  if (backdrop) backdrop.addEventListener('click', closeLetterModal);

  window.addEventListener('keydown', (e) => {
    const modal = $('letterModal');
    if (modal && modal.classList.contains('is-open') && e.key === 'Escape'){
      closeLetterModal();
    }
  });
}

/* ============================================================
   SIZING + BOOT
   ============================================================ */
function resize(){
  const isMobile = window.innerWidth <= 768;
  dpr = isMobile ? Math.min(window.devicePixelRatio || 1, 1.5) : Math.min(window.devicePixelRatio || 1, 2);
  W = canvas.clientWidth; H = canvas.clientHeight;
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  buildSprites();
  buildScene();
  if (reduceMotion){ drawFinal(); return; }
  if (played && filmTL){
    const at = filmTL.time(); const active = filmTL.isActive();
    filmTL = buildFilm(shotGeom());
    filmTL.pause(at);
    if (active) filmTL.play(at);
  } else {
    refreshRig(); setDraw(0);
  }
}
let resizeRAF = 0;
window.addEventListener('resize', () => { if (resizeRAF) return; resizeRAF = requestAnimationFrame(() => { resizeRAF = 0; resize(); }); });

resize();

if (reduceMotion){
  setupCake();
  setupGallery();
  setupMusicBox();
  initCursorCanvas();
  initFireworksCanvas();
  setupLanterns();
  setupLetter();
  drawFinal();
} else {
  buildMotes();
  setupCake();
  setupGallery();
  setupMusicBox();
  initCursorCanvas();
  initFireworksCanvas();
  setupLanterns();
  setupLetter();
  document.fonts && document.fonts.ready.then(() => { refreshRig(); setDraw(0); });
  enter();
  replay.addEventListener('click', resetAll);
}

/* ============================================================
   RECORDING HOOK — the rig draws + fires after its pre-roll
   ============================================================ */
if (isRecord){
  window.bdayAPI = {
    start(){ autoFire(); },
    replay(){ resetAll(); },
  };
}
