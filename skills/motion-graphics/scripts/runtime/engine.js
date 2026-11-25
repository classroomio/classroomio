/* Deterministic timeline engine: every visual is a pure function of source time T (seconds). */

const PROJECT = window.PROJECT || { fps: 30, width: 1920, height: 1080 };
const FPS = PROJECT.fps;
const W = PROJECT.width;
const H = PROJECT.height;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));

const ease = {
  linear: (t) => t,
  inCubic: (t) => t * t * t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  outQuint: (t) => 1 - Math.pow(1 - t, 5),
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  outBack: (t, s = 1.6) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2)
};

/** Eased progress between two times. */
const ep = (t, a, b, fn = ease.outCubic) => fn(prog(t, a, b));

/** Damped spring settle from 0 to 1, starting at time `a`. */
function spring(t, a, freq = 2.2, damping = 7) {
  const local = t - a;
  if (local <= 0) return 0;

  return 1 - Math.exp(-damping * local) * Math.cos(2 * Math.PI * freq * local);
}

/** A decaying kick used for punches and shakes: 1 at time a, falling to 0. */
function kick(t, a, decay = 9) {
  const local = t - a;
  if (local < 0) return 0;

  return Math.exp(-decay * local);
}

function el(tag, className, parent, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  if (parent) parent.appendChild(node);

  return node;
}

function css(node, styles) {
  for (const key in styles) node.style[key] = styles[key];
}

function show(node, visible) {
  node.style.visibility = visible ? 'visible' : 'hidden';
}

function typed(text, t, start, charsPerSecond) {
  const count = Math.floor(clamp((t - start) * charsPerSecond, 0, text.length));

  return text.slice(0, count);
}

function caretOn(t) {
  return Math.floor(t * 2.2) % 2 === 0;
}

const NOTCH_D = 'M0 0 H46 Q41.6 0 40.4 2.6 L38 8.4 Q36.9 11 34.2 11 H11.8 Q9.1 11 8 8.4 L5.6 2.6 Q4.4 0 0 0 Z';
const TAB_D = 'M0 0 H47.2 Q42.8 0 41.6 2.6 L39.2 9.4 Q38.4 12 35.6 12 H11.6 Q8.8 12 8 9.4 L5.6 2.6 Q4.4 0 0 0 Z';

/** The brand notch bite: painted in the surface colour behind the block. */
function addNotch(block, surface, scale = 1.4, left = 30) {
  const svg = `<svg width="${46 * scale}" height="${11 * scale}" viewBox="0 0 46 11"><path d="${NOTCH_D}" fill="${surface}"/></svg>`;
  const notch = el('div', 'notch', block, svg);
  css(notch, { left: left + 'px', top: '-1px' });

  return notch;
}

/** The tab that hangs below a block and locks into the notch of the block underneath. */
function addTab(block, fill, scale = 1.4, left = 30) {
  const svg = `<svg width="${47.2 * scale}" height="${12 * scale}" viewBox="0 0 47.2 12"><path d="${TAB_D}" fill="${fill}"/></svg>`;
  const tab = el('div', 'tab', block, svg);
  css(tab, { left: left - 0.6 * scale + 'px', bottom: -12 * scale + 1 + 'px' });

  return tab;
}

const BLOCK_FILL = { sand: '#E3DACA', tint: '#D6DEFF', blue: '#0233BD', ink: '#17140F' };

function makeBlock(parent, { kind, title, tone = 'sand', w = 420, h = 92, notch = true, tab = false, surface = '#F7F7F7', scale = 1.4 }) {
  const block = el('div', `block ${tone}`, parent);
  css(block, { width: w + 'px', height: h + 'px' });
  if (kind) el('div', 'kind', block, kind);
  if (title) el('div', 'title', block, title);
  if (notch) addNotch(block, surface, scale);
  if (tab) addTab(block, BLOCK_FILL[tone] || '#E3DACA', scale);

  return block;
}

const LOGO_PATHS = `
  <path d="M385 180 H518 Q528 180 528 190 V836 Q528 846 518 846 H385 A333 333 0 0 1 385 180 Z"/>
  <circle cx="796" cy="353" r="173"/>
  <path d="M748 595 H961 Q971 595 971 605 V836 Q971 846 961 846 H601 Q591 846 591 836 V752 A157 157 0 0 1 748 595 Z"/>`;

function logoMark(parent, height, color = '#0233BD') {
  const width = (height * 916) / 666;
  const holder = el('div', 'abs', parent, `<svg width="${width}" height="${height}" viewBox="55 180 916 666" fill="${color}">${LOGO_PATHS}</svg>`);

  return holder;
}

function logoLockup(parent, height, color = '#0233BD', textColor = '#17140F') {
  const holder = el('div', 'abs', parent);
  css(holder, { display: 'flex', alignItems: 'center', gap: height * 0.28 + 'px' });
  const width = (height * 916) / 666;
  el('div', '', holder, `<svg width="${width}" height="${height}" viewBox="55 180 916 666" fill="${color}">${LOGO_PATHS}</svg>`);
  const word = el('div', '', holder, 'classroomio');
  css(word, { fontSize: height * 1.05 + 'px', fontWeight: 650, letterSpacing: '-0.03em', color: textColor, lineHeight: 1 });

  return holder;
}

const SKIN = ['#6B4226', '#8D5524', '#C68642', '#4A2C1A', '#A0673B', '#E0AC69', '#5C3A21', '#7A4A2A'];
const SHIRT = ['#0233BD', '#17140F', '#ADC3FF', '#6B6152', '#2F5BE0', '#CFC5B3'];

/** Flat-shape avatar: circle crop with a head and shoulders. */
function makeAvatar(parent, size, seed = 0, backdrop = '#F1EEE7') {
  const avatar = el('div', 'avatar', parent);
  css(avatar, { width: size + 'px', height: size + 'px', background: backdrop });
  const body = el('div', 'body', avatar);
  css(body, {
    width: size * 0.84 + 'px',
    height: size * 0.5 + 'px',
    left: size * 0.08 + 'px',
    top: size * 0.66 + 'px',
    background: SHIRT[seed % SHIRT.length]
  });
  const head = el('div', 'head', avatar);
  css(head, {
    width: size * 0.42 + 'px',
    height: size * 0.42 + 'px',
    left: size * 0.29 + 'px',
    top: size * 0.2 + 'px',
    background: SKIN[(seed * 3) % SKIN.length]
  });

  return avatar;
}

/* ---------- scene registry ---------- */

const SCENES = [];

/**
 * Registers a scene.
 * `full` scenes cover the frame with a blue-then-paper wipe; their content goes in `ctx.content`.
 * `update(ctx)` receives { T, t (seconds since in), d (duration), toOut (seconds left) }.
 */
function scene(def) {
  SCENES.push(def);
}

const WIPE_IN = 0.3;
const WIPE_OUT = 0.3;

function buildScenes(stage) {
  for (const def of SCENES) {
    const root = el('div', 'scene', stage);
    root.dataset.id = def.id;
    def.root = root;
    if (def.full) {
      def.blueLayer = el('div', 'wipe blue', root);
      def.paperLayer = el('div', 'wipe paper', root);
      def.content = el('div', 'abs', def.paperLayer);
      css(def.content, { inset: 0 });
    } else {
      def.content = root;
    }
    def.state = def.build ? def.build(def.content, def) || {} : {};
  }
}

function updateFullWipe(def, T) {
  const sinceIn = T - def.in;
  const untilOut = def.out - T;
  const hardIn = def.hardIn === true;
  const hardOut = def.hardOut === true;

  let blueTop = 0;
  let paperTop = 0;
  if (!hardIn) {
    blueTop = 100 * (1 - ease.outExpo(prog(sinceIn, 0, WIPE_IN * 0.8)));
    paperTop = 100 * (1 - ease.outExpo(prog(sinceIn, 0.07, WIPE_IN)));
  }

  let blueBottom = 0;
  let paperBottom = 0;
  if (!hardOut) {
    paperBottom = 100 * ease.inExpo(prog(WIPE_OUT - untilOut, 0, WIPE_OUT * 0.8));
    blueBottom = 100 * ease.inExpo(prog(WIPE_OUT - untilOut, 0.07, WIPE_OUT));
  }

  def.blueLayer.style.clipPath = `inset(${blueTop}% 0 ${blueBottom}% 0)`;
  def.paperLayer.style.clipPath = `inset(${paperTop}% 0 ${paperBottom}% 0)`;
}

window.renderAt = function renderAt(T) {
  let active = 0;
  for (const def of SCENES) {
    const isOn = T >= def.in && T < def.out;
    def.root.style.display = isOn ? 'block' : 'none';
    if (!isOn) continue;

    active += 1;
    if (def.full) updateFullWipe(def, T);
    def.update({ T, t: T - def.in, d: def.out - def.in, toOut: def.out - T, s: def.state, root: def.content, def });
  }

  return active;
};

window.prepareAt = async function prepareAt(T) {
  const jobs = SCENES.filter((def) => def.prepare && T >= def.in - 0.05 && T < def.out + 0.05).map((def) => def.prepare(T, def.state, def));
  await Promise.all(jobs);
};

window.sceneList = () => SCENES.map((def) => ({ id: def.id, in: def.in, out: def.out, full: !!def.full, behind: def.behind || null }));

window.assetsReady = new Promise((resolve) => {
  window.addEventListener('DOMContentLoaded', () => {
    buildScenes(document.getElementById('stage'));
    resolve(Promise.all(typeof PENDING === 'undefined' ? [] : PENDING));
  });
});
