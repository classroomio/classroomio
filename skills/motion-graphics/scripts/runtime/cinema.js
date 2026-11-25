/* Cinematic toolkit: ink reveal, light-flash exit, film grain, vignette, seeded randomness. */

function seeded(seed) {
  let state = seed >>> 0 || 1;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;

    return state / 4294967296;
  };
}

const GRAIN_TILES = [];
function grainTiles() {
  if (GRAIN_TILES.length) return GRAIN_TILES;

  const random = seeded(7);
  for (let k = 0; k < 6; k += 1) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    const image = context.createImageData(256, 256);
    for (let i = 0; i < image.data.length; i += 4) {
      const value = 128 + (random() + random() + random() - 1.5) * 150;
      image.data[i] = value;
      image.data[i + 1] = value;
      image.data[i + 2] = value;
      image.data[i + 3] = 255;
    }
    context.putImageData(image, 0, 0);
    GRAIN_TILES.push(canvas.toDataURL('image/png'));
  }

  return GRAIN_TILES;
}

/**
 * Builds an opaque cinematic panel that covers the footage: background, a content layer,
 * then vignette, grain and a flash layer on top. Returns handles for `updateCinematic`.
 */
function cinematicPanel(root, { background = 'radial-gradient(120% 90% at 50% 45%, #10141F 0%, #06070B 70%)', grain = 0.2, vignette = 0.75 } = {}) {
  const panel = el('div', 'abs', root);
  css(panel, { inset: 0, background, overflow: 'hidden' });
  const content = el('div', 'abs', panel);
  css(content, { inset: 0 });
  const vignetteLayer = el('div', 'abs', panel);
  css(vignetteLayer, { inset: 0, pointerEvents: 'none', background: `radial-gradient(110% 85% at 50% 50%, transparent 55%, rgba(0,0,0,${vignette}) 100%)` });
  const grainLayer = el('div', 'abs', panel);
  css(grainLayer, { inset: '-10%', pointerEvents: 'none', mixBlendMode: 'overlay', opacity: grain, backgroundSize: '256px 256px' });
  const flash = el('div', 'abs', root);
  flash.style.zIndex = '50';
  css(flash, { inset: 0, pointerEvents: 'none', opacity: 0, background: 'radial-gradient(70% 70% at 50% 50%, #FFFFFF 0%, #D6E2FF 45%, rgba(173,195,255,0.85) 100%)' });

  return { panel, content, grainLayer, vignetteLayer, flash, grain };
}

/**
 * Drives the transitions of a cinematic panel.
 * - Ink reveal: two ink plumes and a growing disc mask the panel in over `inkDuration`.
 * - Exit: at `cut` the panel disappears behind a white-blue flash that decays over the footage until `out`.
 */
function updateCinematic(handles, T, { start, cut, inkDuration = 0.55, inks = ['ink2', 'ink1'], flashOut = true, hardCut = false, flashIn = false, effects = 1 }) {
  const { panel, grainLayer, vignetteLayer, flash } = handles;
  grainLayer.style.opacity = String(handles.grain * effects);
  vignetteLayer.style.opacity = String(effects);
  const sinceIn = T - start;

  if (sinceIn < inkDuration) {
    const p = prog(sinceIn, 0, inkDuration);
    const grow = ease.inCubic(p);
    const sizeA = lerp(40, 900, grow);
    const sizeB = lerp(20, 700, ease.inCubic(prog(sinceIn, 0.06, inkDuration)));
    const disc = lerp(0, 95, ease.inExpo(p));
    const inkFiles = (window.ASSETS && window.ASSETS.ink) || [];
    const files = inks.map((name) => inkFiles.find((file) => file.startsWith(name + '_'))).filter(Boolean);
    const discMask = `radial-gradient(circle at 50% 52%, #000 ${disc}%, transparent ${disc + 10}%)`;
    if (files.length === 2) {
      panel.style.maskImage = `url(img/ink/${files[0]}), url(img/ink/${files[1]}), ${discMask}`;
      panel.style.maskSize = `${sizeA}% auto, ${sizeB}% auto, 100% 100%`;
      panel.style.maskPosition = '48% 46%, 56% 60%, center';
    } else {
      const radius = lerp(0, 120, ease.inCubic(p));
      panel.style.maskImage = `radial-gradient(circle at 50% 52%, #000 ${radius}%, transparent ${radius + 12}%)`;
      panel.style.maskSize = '100% 100%';
      panel.style.maskPosition = 'center';
    }
    panel.style.maskRepeat = 'no-repeat';
  } else {
    panel.style.maskImage = 'none';
  }

  const tiles = grainTiles();
  const frame = Math.round(T * FPS);
  grainLayer.style.backgroundImage = `url(${tiles[frame % tiles.length]})`;
  grainLayer.style.backgroundPosition = `${(frame * 97) % 256}px ${(frame * 53) % 256}px`;

  const panelVisible = T < cut;
  panel.style.visibility = panelVisible ? 'visible' : 'hidden';
  const entry = flashIn ? (1 - ease.outCubic(prog(T, start, start + 0.3))) * 0.85 : 0;
  if (hardCut || !flashOut) {
    flash.style.opacity = entry;
    return;
  }

  const rise = ease.inCubic(prog(T, cut - 0.12, cut));
  const decay = 1 - ease.outCubic(prog(T, cut, cut + 0.3));
  flash.style.opacity = Math.max(entry, T < cut ? rise * 0.85 : decay * 0.85);
}

/** Glowing display type: layered text-shadows read as light, not a drop shadow. */
function glow(color = '173,195,255', strength = 1) {
  return `0 0 ${18 * strength}px rgba(${color},0.55), 0 0 ${60 * strength}px rgba(${color},0.35), 0 0 ${140 * strength}px rgba(${color},0.25)`;
}

/** Splits text into spans for per-letter animation. */
function letters(parent, text, className = '') {
  return [...text].map((char) => {
    const span = el('span', className, parent, char === ' ' ? '&nbsp;' : char);
    span.style.display = 'inline-block';

    return span;
  });
}

/** Per-letter blur-in from below, staggered. */
function lettersIn(spans, t, start, { stagger = 0.03, duration = 0.5, distance = 40, blur = 18 } = {}) {
  spans.forEach((span, index) => {
    const local = prog(t, start + index * stagger, start + index * stagger + duration);
    const amount = ease.outCubic(local);
    span.style.opacity = String(prog(t, start + index * stagger, start + index * stagger + duration * 0.5));
    span.style.transform = `translateY(${distance * (1 - amount)}px)`;
    span.style.filter = `blur(${blur * (1 - amount)}px)`;
  });
}

function asset(folder, index) {
  const list = ASSETS[folder];

  return `img/${folder}/${list[((index % list.length) + list.length) % list.length]}`;
}

/** Inline Simple Icons mark (24×24 viewBox) in any fill colour. */
function brandLogo(name, size, fill) {
  const paths = window.LOGO_PATHS_SI[name].map((d) => `<path d="${d}"/>`).join('');

  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" style="display:block">${paths}</svg>`;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Full-frame SVG layer with a glow filter, for light trails. */
function svgLayer(parent, id) {
  const holder = el('div', 'abs', parent);
  css(holder, { inset: 0, pointerEvents: 'none' });
  holder.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;left:0;top:0;overflow:visible">
    <defs><filter id="${id}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="b1"/><feGaussianBlur in="SourceGraphic" stdDeviation="16" result="b2"/>
      <feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter></defs></svg>`;

  return holder.querySelector('svg');
}

/** A light packet that travels along a path, leaving a glowing streak and a faint wire behind. */
function makeTrail(svg, d, color, filterId, width = 3) {
  const wire = document.createElementNS(SVG_NS, 'path');
  wire.setAttribute('d', d);
  wire.setAttribute('fill', 'none');
  wire.setAttribute('stroke', color);
  wire.setAttribute('stroke-width', '1.5');
  wire.setAttribute('stroke-dasharray', '2 7');
  const streak = document.createElementNS(SVG_NS, 'path');
  streak.setAttribute('d', d);
  streak.setAttribute('fill', 'none');
  streak.setAttribute('stroke', color);
  streak.setAttribute('stroke-width', String(width));
  streak.setAttribute('stroke-linecap', 'round');
  streak.setAttribute('filter', `url(#${filterId})`);
  const head = document.createElementNS(SVG_NS, 'circle');
  head.setAttribute('r', String(width * 2.2));
  head.setAttribute('fill', '#FFFFFF');
  head.setAttribute('filter', `url(#${filterId})`);
  svg.append(wire, streak, head);

  return { wire, streak, head, length: streak.getTotalLength() };
}

function updateTrail(trail, T, start, duration, { tail = 240, wireOpacity = 0.35, linger = 0.3 } = {}) {
  const travelled = ep(T, start, start + duration, ease.inOutCubic) * trail.length;
  const segment = Math.min(tail, travelled);
  const alive = T >= start ? 1 - prog(T, start + duration, start + duration + linger) : 0;
  trail.wire.style.opacity = T >= start ? wireOpacity * ep(T, start, start + 0.25) : 0;
  trail.streak.setAttribute('stroke-dasharray', `${segment} ${trail.length + tail}`);
  trail.streak.setAttribute('stroke-dashoffset', String(-(travelled - segment)));
  trail.streak.style.opacity = alive;
  const point = trail.streak.getPointAtLength(travelled);
  trail.head.setAttribute('cx', point.x);
  trail.head.setAttribute('cy', point.y);
  trail.head.style.opacity = T < start + duration ? alive : 0;

  return T >= start + duration;
}

/** A centred image layer used for light and dust plates (screen-blended). */
function plate(parent, src, { width = W, height = H, blend = 'screen', opacity = 1 } = {}) {
  const node = el('div', 'abs', parent);
  css(node, {
    left: W / 2 - width / 2 + 'px',
    top: H / 2 - height / 2 + 'px',
    width: width + 'px',
    height: height + 'px',
    backgroundImage: `url(${src})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    mixBlendMode: blend,
    opacity: String(opacity)
  });

  return node;
}

/* ---------- assets that must be decoded before a frame is captured ---------- */

const PENDING = [];

/** Starts loading an image and registers it with `window.assetsReady`. */
function preload(src) {
  const image = new Image();
  image.src = src;
  PENDING.push(image.decode().catch(() => {}));

  return image;
}

/** Source footage frames used inside graphics (e.g. a live wall tile). Loaded on demand per frame. */
function footageClip(firstFrame, lastFrame) {
  const cache = new Map();
  const frameAt = (T) => clamp(Math.round(T * FPS), firstFrame, lastFrame);

  return {
    async prepare(T) {
      const frame = frameAt(T);
      if (cache.has(frame)) return;

      const image = new Image();
      image.src = `img/footage/f_${String(frame).padStart(5, '0')}.jpg`;
      await image.decode();
      cache.set(frame, image);
      for (const key of [...cache.keys()]) if (Math.abs(key - frame) > 3) cache.delete(key);
    },
    imageAt(T) {
      return cache.get(frameAt(T));
    }
  };
}

/** Draws a footage frame into a canvas sized for its on-screen scale, so it stays sharp up close and clean far away. */
function drawFootage(canvas, image, cssWidth, cssHeight, onScreenScale) {
  const density = window.devicePixelRatio || 1;
  const width = Math.round(clamp(cssWidth * onScreenScale * density, 64, 3840));
  const height = Math.round((width * cssHeight) / cssWidth);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  if (!image) return;

  const context = canvas.getContext('2d');
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, width, height);
}

/** Replaces letters with random glyphs until `settle`, then reveals the final text left to right. */
function scramble(text, T, start, settle, seed = 1) {
  if (T < start) return '';
  if (T >= settle) return text;

  const glyphs = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+=?';
  const revealed = Math.floor(text.length * prog(T, start + (settle - start) * 0.4, settle));
  const tick = Math.floor(T * FPS);
  let out = '';
  for (let index = 0; index < text.length; index += 1) {
    if (index < revealed || text[index] === ' ') {
      out += text[index];
      continue;
    }

    const random = seeded(seed * 977 + index * 131 + tick * 7)();
    out += glyphs[Math.floor(random * glyphs.length)];
  }

  return out;
}
