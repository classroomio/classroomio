/* v3 scenes, part A: the call wall (opening and bookend), the week behind the speaker, the dissolving call, the fake "got it"s. */

/* ===================== Shared: the wall of calls with one live tile ===================== */

const WALL = { cols: 13, rows: 9, tileW: 480, tileH: 270, gap: 22, perspective: 1400 };
const WALL_FULL = 1920 / WALL.tileW;
const REC_DOT = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#E5484D;margin-right:7px"></span>';

function buildCallWall(parent, { seed = 11, liveLabel = 'SESSION 100' } = {}) {
  const view = el('div', 'abs', parent);
  css(view, { inset: 0, perspective: WALL.perspective + 'px', perspectiveOrigin: '50% 50%' });
  const plane = el('div', 'd3', view);
  css(plane, { left: '960px', top: '540px' });

  const { cols, rows, tileW, tileH, gap } = WALL;
  const cells = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = (col - (cols - 1) / 2) * (tileW + gap);
      const y = (row - (rows - 1) / 2) * (tileH + gap);
      cells.push({ x, y, dist: Math.hypot(x, y * 1.4) });
    }
  }
  cells.sort((a, b) => a.dist - b.dist);

  const random = seeded(seed);
  const tiles = cells.map((cell, order) => {
    const node = el('div', 'tile', plane);
    css(node, { width: tileW + 'px', height: tileH + 'px', left: cell.x - tileW / 2 + 'px', top: cell.y - tileH / 2 + 'px' });
    const faceIndex = Math.floor(random() * 1000);
    let photo = null;
    if (order === 0) {
      el('canvas', 'abs', node).style.cssText += ';left:0;top:0;width:100%;height:100%';
    } else if (random() < 0.3) {
      buildSlideTile(node, faceIndex, false);
    } else {
      photo = el('div', 'ph', node);
      photo.style.backgroundImage = `url(${asset('faces', faceIndex)})`;
    }
    const number = order < 100 ? 100 - order : order + 1;
    const label = el('div', 'label', node, order === 0 ? liveLabel : `SESSION ${String(number).padStart(3, '0')}`);
    if (order === 0) label.style.background = '#E5484D';

    return { node, label, photo, order, ...cell };
  });

  const live = tiles[0];
  const rec = el('div', 'abs', live.node, `${REC_DOT}REC`);
  css(rec, { right: '12px', top: '12px', fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.1em', color: '#fff', background: 'rgba(0,0,0,0.45)', padding: '5px 8px', borderRadius: '6px' });

  return { view, plane, tiles, live, canvas: live.node.querySelector('canvas'), rec };
}

/** Places the camera so the live tile is `scale` times its size; scale 4 with no tilt fills the frame exactly. */
function setWallCamera(wall, scale, tiltX, roll) {
  const z = WALL.perspective - WALL.perspective / scale;
  wall.plane.style.transform = `translateZ(${z}px) rotateX(${tiltX}deg) rotateZ(${roll}deg)`;
}

/** `full` is 1 when the live tile must match the footage underneath pixel for pixel. */
function updateLiveTile(wall, image, scale, full) {
  drawFootage(wall.canvas, image, WALL.tileW, WALL.tileH, scale);
  wall.live.node.style.borderRadius = `${14 * (1 - full)}px`;
  wall.live.node.style.boxShadow = full > 0 ? 'none' : '';
  wall.live.label.style.opacity = String(1 - full);
  wall.rec.style.opacity = String(1 - full);
}

function buildCounter(parent, top, kickerText) {
  const box = el('div', 'abs cine', parent);
  css(box, { left: 0, right: 0, top: top + 'px', display: 'flex', flexDirection: 'column', alignItems: 'center' });
  const kicker = el('div', 'cine', box, kickerText);
  css(kicker, { fontFamily: 'var(--mono)', fontSize: '22px', letterSpacing: '0.32em', opacity: 0.92, marginBottom: '10px', textShadow: '0 2px 12px rgba(0,0,0,0.9)' });
  const line = el('div', '', box);
  css(line, { display: 'flex', alignItems: 'baseline', whiteSpace: 'nowrap' });
  const number = el('div', '', line, '001');
  css(number, { fontSize: '300px', fontWeight: 800, letterSpacing: '-0.05em', lineHeight: '1', fontVariantNumeric: 'tabular-nums', color: '#FFFFFF' });

  return { box, kicker, line, number };
}

/* ===================== A. Opening: your session becomes one call on a wall of a hundred ===================== */

const OPEN = { in: 5.75, cut: 8.866 };
const openFootage = footageClip(172, 266);

scene({
  id: 'A-call-wall',
  in: OPEN.in,
  out: OPEN.cut + 0.3,
  prepare(T) {
    return openFootage.prepare(T);
  },
  build(root) {
    const handles = cinematicPanel(root, { background: 'radial-gradient(120% 100% at 50% 50%, #0B1020 0%, #04050A 70%)' });
    const wall = buildCallWall(handles.content, { seed: 11 });
    const scrim = el('div', 'abs', handles.content);
    css(scrim, { inset: 0, background: 'radial-gradient(48% 38% at 50% 50%, rgba(3,4,9,0.94) 0%, rgba(3,4,9,0.72) 55%, rgba(3,4,9,0) 100%)' });
    const rays = plate(handles.content, asset('light', 3), { width: 1500, height: 2000, opacity: 0 });

    const counter = buildCounter(handles.content, 330, 'THE SAME ONBOARDING SESSION');
    const suffixClip = el('div', '', counter.line);
    css(suffixClip, { overflow: 'hidden', display: 'inline-block' });
    const suffix = el('div', 'serif-i', suffixClip, 'th');
    css(suffix, { fontSize: '210px', lineHeight: '1', color: '#E8EEFF', paddingLeft: '6px', paddingRight: '10px' });
    const timeClip = el('div', '', counter.line);
    css(timeClip, { overflow: 'hidden', display: 'inline-block' });
    const timeWord = el('div', 'serif-i', timeClip, 'time.');
    css(timeWord, { fontSize: '210px', lineHeight: '1', color: '#E8EEFF', paddingLeft: '28px', paddingRight: '20px' });

    return { handles, wall, scrim, rays, counter, suffixClip, suffix, timeClip, timeWord };
  },
  update({ T, s }) {
    updateCinematic(s.handles, T, { start: OPEN.in, cut: OPEN.cut, inkDuration: 0, effects: ep(T, 5.85, 6.5) });

    const zoom = ep(T, OPEN.in, 8.08, ease.inOutCubic);
    const drift = prog(T, 8.08, 8.9);
    const scale = Math.exp(lerp(Math.log(WALL_FULL), Math.log(0.341), zoom)) * (1 - 0.085 * drift);
    const turn = ep(T, 6.3, 8.08, ease.inOutCubic);
    const tiltX = 40 * turn + 3 * drift;
    const roll = -11 * turn - 3 * drift + 1.5 * Math.sin(T * 0.9) * turn;
    setWallCamera(s.wall, scale, tiltX, roll);
    updateLiveTile(s.wall, openFootage.imageAt(T), scale, clamp((scale - 3.2) / 0.8));

    const rollRad = (roll * Math.PI) / 180;
    const tiltRad = (tiltX * Math.PI) / 180;
    const rippleAge = T - 8.08;
    s.wall.tiles.forEach((tile, index) => {
      const rolledY = tile.x * Math.sin(rollRad) + tile.y * Math.cos(rollRad);
      const depth = rolledY * Math.sin(tiltRad);
      const wave = rippleAge >= 0 ? Math.exp(-Math.pow((tile.dist - 4200 * rippleAge) / 420, 2)) : 0;
      tile.node.style.transform = `translateZ(${(90 * wave).toFixed(1)}px)`;
      tile.node.style.boxShadow = wave > 0.05 ? `0 0 ${60 * wave}px rgba(173,195,255,${0.8 * wave})` : index === 0 ? tile.node.style.boxShadow : '';
      if (index === 0) return;

      const blur = Math.min(7, Math.abs(depth) / 260) * turn;
      const fog = 1 - 0.6 * clamp(tile.dist / 3600) * turn;
      tile.node.style.filter = `brightness(${(fog * (1 + 1.1 * wave)).toFixed(3)}) blur(${blur.toFixed(2)}px)`;
    });

    const counterIn = ep(T, 6.85, 7.25);
    s.scrim.style.opacity = counterIn;
    s.counter.box.style.opacity = counterIn;
    s.counter.box.style.filter = `blur(${(1 - counterIn) * 20}px)`;
    s.counter.number.textContent = String(1 + Math.floor(99 * ease.inCubic(prog(T, 7.0, 8.08)))).padStart(3, '0');
    s.counter.box.style.transform = `scale(${1 + 0.1 * kick(T, 8.08, 7)})`;
    s.counter.number.style.textShadow = glow('173,195,255', 0.6 + 1.6 * kick(T, 8.08, 3));

    const suffixIn = ep(T, 8.08, 8.3, ease.outExpo);
    s.suffixClip.style.width = s.suffix.scrollWidth * suffixIn + 'px';
    s.suffix.style.textShadow = glow('173,195,255', 1.2);
    const timeIn = ep(T, 8.44, 8.7, ease.outExpo);
    s.timeClip.style.width = s.timeWord.scrollWidth * timeIn + 'px';
    s.timeWord.style.filter = `blur(${(1 - timeIn) * 14}px)`;
    s.timeWord.style.textShadow = glow('173,195,255', 1.2);

    s.rays.style.opacity = 0.3 * ep(T, 7.4, 8.08, ease.inCubic) + 0.9 * kick(T, 8.08, 2.4);
    s.rays.style.transform = `rotate(${(T - 7) * 6}deg) scale(${1 + 0.25 * kick(T, 8.08, 2)})`;
  }
});

/* ===================== E. The week behind the speaker: "again and again. 8 hours here, 10 hours there" ===================== */

const WEEK = { in: 12.767, out: 18.733, shotCut: 15.533, cellW: 140, cellH: 40, headH: 46, labelW: 64 };
const WEEK_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const WEEK_EVENTS = [
  { day: 0, hour: 10, at: 13.1 },
  { day: 1, hour: 10, at: 14.34 },
  { day: 2, hour: 10, at: 15.17 },
  { day: 3, hour: 10, at: 15.23 },
  { day: 4, hour: 10, at: 15.29 },
  ...[9, 11, 12, 13, 14, 15, 16].map((hour, index) => ({ day: 0, hour, at: 15.66 + index * 0.04 })),
  ...[8, 9, 11, 12, 13, 14, 15, 16, 17].map((hour, index) => ({ day: 1, hour, at: 16.24 + index * 0.035 }))
];

scene({
  id: 'E-week-behind',
  in: WEEK.in,
  out: WEEK.out,
  behind: [WEEK.in, WEEK.out],
  build(root) {
    const view = el('div', 'abs', root);
    css(view, { inset: 0, perspective: '1500px' });
    const rig = el('div', 'd3', view);
    const { cellW, cellH, headH, labelW } = WEEK;
    const width = labelW + cellW * 5;
    const height = headH + cellH * 10;
    const board = el('div', 'abs', rig);
    css(board, {
      left: '0px',
      top: '0px',
      width: width + 32 + 'px',
      height: height + 32 + 'px',
      borderRadius: '22px',
      background: 'linear-gradient(160deg, rgba(14,20,40,0.78), rgba(8,10,22,0.86))',
      border: '1px solid rgba(190,208,255,0.35)',
      boxShadow: '0 40px 90px rgba(0,0,0,0.35), 0 0 60px rgba(120,150,255,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
      color: '#F2EEE6'
    });
    const grid = el('div', 'abs', board);
    css(grid, { left: '16px', top: '16px', width: width + 'px', height: height + 'px' });
    let lines = '';
    for (let row = 0; row <= 10; row += 1) lines += `<line x1="${labelW}" x2="${width}" y1="${headH + row * cellH}" y2="${headH + row * cellH}" stroke="rgba(255,255,255,0.12)"/>`;
    for (let col = 0; col <= 5; col += 1) lines += `<line x1="${labelW + col * cellW}" x2="${labelW + col * cellW}" y1="${headH}" y2="${height}" stroke="rgba(255,255,255,0.12)"/>`;
    el('div', 'abs', grid, `<svg width="${width}" height="${height}">${lines}</svg>`).style.inset = '0';
    WEEK_DAYS.forEach((day, index) => {
      const head = el('div', 'abs', grid, day);
      css(head, { left: labelW + index * cellW + 'px', width: cellW + 'px', top: '10px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '15px', letterSpacing: '0.2em', opacity: 0.75 });
    });
    for (let row = 0; row < 10; row += 1) {
      const hour = el('div', 'abs', grid, `${String(8 + row).padStart(2, '0')}:00`);
      css(hour, { left: '0px', top: headH + row * cellH + 4 + 'px', fontFamily: 'var(--mono)', fontSize: '12px', opacity: 0.45 });
    }

    const blocks = WEEK_EVENTS.map((event) => {
      const node = el('div', 'abs', grid);
      css(node, {
        left: labelW + event.day * cellW + 4 + 'px',
        top: headH + (event.hour - 8) * cellH + 3 + 'px',
        width: cellW - 8 + 'px',
        height: cellH - 6 + 'px',
        borderRadius: '7px',
        background: 'linear-gradient(135deg, #6E8BFF, #3150D8)',
        borderLeft: '4px solid #DDE5FF',
        padding: '4px 8px',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        boxShadow: '0 0 18px rgba(110,139,255,0.55)'
      });
      el('div', '', node, 'Onboarding · Acme').style.cssText = 'font-size:13px;font-weight:650;letter-spacing:-.01em;line-height:1.1';
      el('div', '', node, `${event.hour}:00 – ${event.hour + 1}:00`).style.cssText = 'font-family:var(--mono);font-size:10px;opacity:.75;line-height:1.2';

      return { ...event, node };
    });

    const tallies = [
      { day: 0, text: '8h', at: 15.76 },
      { day: 1, text: '10h', at: 16.54 }
    ].map((tally) => {
      const node = el('div', 'abs', grid, tally.text);
      css(node, { left: labelW + tally.day * cellW + cellW / 2 - 50 + 'px', width: '100px', top: '-64px', textAlign: 'center', fontSize: '44px', fontWeight: 800, letterSpacing: '-0.04em', color: '#FFFFFF', textShadow: glow('140,165,255', 0.8) });

      return { ...tally, node };
    });

    const total = el('div', 'abs', board);
    css(total, { left: '16px', right: '16px', bottom: '-66px', display: 'flex', justifyContent: 'center', gap: '14px', alignItems: 'center', fontFamily: 'var(--mono)', fontSize: '18px', letterSpacing: '0.22em', color: '#FFFFFF', textShadow: '0 2px 10px rgba(0,0,0,0.6)' });
    total.innerHTML = '<span style="padding:8px 14px;border-radius:999px;background:#E5484D">18 HOURS</span><span>ONE CUSTOMER</span>';

    return { rig, board, blocks, tallies, total, width: width + 32, height: height + 32 };
  },
  update({ T, s }) {
    const firstShot = T < WEEK.shotCut;
    const local = firstShot ? T - WEEK.in : T - WEEK.shotCut;
    const place = firstShot ? { x: 50, y: 70, scale: 0.95, rotY: 24, rotX: 4 } : { x: 40, y: 66, scale: 1.0, rotY: 20, rotX: 3 };
    const appear = ep(T, WEEK.in, WEEK.in + 0.6);
    const sway = 1.5 * Math.sin(T * 0.8);
    s.rig.style.transform = `translate3d(${place.x}px, ${place.y + (1 - appear) * 40}px, ${-120 + local * 18}px) scale(${place.scale}) rotateY(${place.rotY + sway}deg) rotateX(${place.rotX}deg)`;
    s.rig.style.transformOrigin = '0 0';
    s.board.style.opacity = appear;
    s.board.style.filter = `blur(${(1 - appear) * 14}px)`;

    const sameCustomer = kick(T, 17.69, 3.5);
    s.blocks.forEach((block) => {
      const pop = ep(T, block.at, block.at + 0.22, ease.outBack);
      block.node.style.opacity = clamp(pop * 2);
      block.node.style.transform = `scale(${lerp(0.4, 1, clamp(pop, 0, 1.15))})`;
      const hit = kick(T, block.at, 8);
      block.node.style.boxShadow = `0 0 ${18 + 40 * hit + 50 * sameCustomer}px rgba(${sameCustomer > 0.05 ? '255,110,110' : '110,139,255'},${0.55 + 0.4 * Math.max(hit, sameCustomer)})`;
      block.node.style.background = sameCustomer > 0.05 ? `linear-gradient(135deg, rgba(255,120,110,${0.6 + 0.4 * sameCustomer}), #3150D8)` : 'linear-gradient(135deg, #6E8BFF, #3150D8)';
    });
    s.tallies.forEach((tally) => {
      const pop = ep(T, tally.at, tally.at + 0.3, ease.outBack);
      tally.node.style.opacity = clamp(pop * 2);
      tally.node.style.transform = `translateY(${(1 - clamp(pop)) * 20}px) scale(${lerp(0.5, 1, clamp(pop, 0, 1.2))})`;
    });
    const totalIn = ep(T, 17.36, 17.7, ease.outBack);
    s.total.style.opacity = clamp(totalIn * 2);
    s.total.style.transform = `scale(${lerp(0.7, 1, clamp(totalIn, 0, 1.2))})`;
    s.rig.style.opacity = 1 - ep(T, WEEK.out - 0.12, WEEK.out);
  }
});

/* ===================== F. The call ends and dissolves: "there's nothing for the customer to follow up on" ===================== */

const DUST = { in: 18.733, cut: 23.333, release: 20.0, w: 1240, h: 720, x: 340, y: 150 };

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function drawCover(context, image, x, y, width, height) {
  if (!image || !image.naturalWidth) return;

  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sw = width / scale;
  const sh = height / scale;
  context.drawImage(image, (image.naturalWidth - sw) / 2, (image.naturalHeight - sh) * 0.3, sw, sh, x, y, width, height);
}

/** Paints the video-call window in window coordinates; `ended` (0..1) fades in the "Call ended" state. */
function paintCallWindow(context, faces, T, ended) {
  const { w, h } = DUST;
  context.clearRect(0, 0, w, h);
  context.save();
  roundRect(context, 0, 0, w, h, 22);
  context.fillStyle = '#10131C';
  context.fill();
  context.clip();

  context.fillStyle = '#E5484D';
  context.beginPath();
  context.arc(30, 30, 6, 0, Math.PI * 2);
  context.fill();
  const elapsed = 3598 + Math.floor(Math.max(0, T - DUST.in));
  const clock = `${String(Math.floor(elapsed / 3600)).padStart(2, '0')}:${String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
  context.font = '500 15px "Geist Mono"';
  context.fillStyle = '#F2EEE6';
  context.textBaseline = 'middle';
  context.fillText(`REC ${clock}`, 46, 31);
  context.font = '600 18px Geist';
  context.textAlign = 'center';
  context.fillText('Product 101 · Onboarding — Session 100', w / 2, 31);
  context.textAlign = 'right';
  context.font = '500 14px "Geist Mono"';
  context.globalAlpha = 0.6;
  context.fillText('6 PARTICIPANTS', w - 24, 31);
  context.globalAlpha = 1;
  context.textAlign = 'left';

  roundRect(context, 24, 64, 860, 548, 14);
  context.fillStyle = '#F3EFE6';
  context.fill();
  context.fillStyle = '#6B6152';
  context.font = '500 14px "Geist Mono"';
  context.fillText('PRODUCT 101 · ONBOARDING', 64, 120);
  context.fillStyle = '#17140F';
  context.font = '400 92px "Instrument Serif"';
  context.fillText('Getting started', 60, 210);
  context.fillStyle = '#6B6152';
  context.font = '400 20px Geist';
  context.fillText('Slide 1 of 24', 64, 268);
  [0.82, 0.64, 0.74, 0.5].forEach((width, index) => {
    roundRect(context, 64, 330 + index * 40, 520 * width, 14, 7);
    context.fillStyle = '#DCD3C2';
    context.fill();
  });

  context.filter = ended > 0 ? `grayscale(${ended}) brightness(${1 - 0.35 * ended})` : 'none';
  for (let index = 0; index < 4; index += 1) {
    const y = 64 + index * 140;
    context.save();
    roundRect(context, 904, y, 312, 128, 12);
    context.clip();
    drawCover(context, faces[index], 904, y, 312, 128);
    context.restore();
  }
  context.filter = 'none';
  for (let index = 0; index < 4; index += 1) {
    const y = 64 + index * 140;
    roundRect(context, 914, y + 96, 76, 22, 6);
    context.fillStyle = 'rgba(0,0,0,0.5)';
    context.fill();
    context.fillStyle = '#FFFFFF';
    context.font = '500 11px "Geist Mono"';
    context.fillText('GUEST', 924, y + 108);
  }

  [-170, -95, -20].forEach((offset) => {
    context.beginPath();
    context.arc(w / 2 + offset, 660, 24, 0, Math.PI * 2);
    context.fillStyle = '#262B38';
    context.fill();
  });
  roundRect(context, w / 2 + 30, 636, 110, 48, 24);
  context.fillStyle = '#E5484D';
  context.fill();
  context.fillStyle = '#FFFFFF';
  context.font = '650 17px Geist';
  context.textAlign = 'center';
  context.fillText('Leave', w / 2 + 85, 661);
  context.textAlign = 'left';

  if (ended > 0) {
    context.fillStyle = `rgba(8,10,16,${0.72 * ended})`;
    context.fillRect(0, 0, w, h);
    context.globalAlpha = ended;
    context.fillStyle = '#FFFFFF';
    context.textAlign = 'center';
    context.font = '700 54px Geist';
    context.fillText('Call ended', w / 2, h / 2 - 18);
    context.font = '500 16px "Geist Mono"';
    context.fillStyle = 'rgba(255,255,255,0.65)';
    context.fillText('SESSION 100 · 1H 00M · NO RECORDING SHARED', w / 2, h / 2 + 34);
    context.textAlign = 'left';
    context.globalAlpha = 1;
  }
  context.restore();
}

function valueNoise(seed, cell) {
  const random = seeded(seed);
  const cols = Math.ceil(DUST.w / cell) + 2;
  const rows = Math.ceil(DUST.h / cell) + 2;
  const grid = Float32Array.from({ length: cols * rows }, () => random());

  return (x, y) => {
    const gx = x / cell;
    const gy = y / cell;
    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const fx = gx - x0;
    const fy = gy - y0;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const at = (cx, cy) => grid[cy * cols + cx];
    const top = lerp(at(x0, y0), at(x0 + 1, y0), sx);
    const bottom = lerp(at(x0, y0 + 1), at(x0 + 1, y0 + 1), sx);

    return lerp(top, bottom, sy);
  };
}

function buildDust(state) {
  const density = window.devicePixelRatio || 1;
  const raster = state.raster;
  const rasterContext = raster.getContext('2d');
  rasterContext.setTransform(density, 0, 0, density, 0, 0);
  paintCallWindow(rasterContext, state.faces, DUST.release, 1);
  const pixels = rasterContext.getImageData(0, 0, raster.width, raster.height).data;
  const { w, h } = DUST;
  const coarse = valueNoise(3, 90);
  const fine = valueNoise(8, 18);
  const random = seeded(21);
  const count = w * h;
  const release = new Float32Array(count);
  const life = new Float32Array(count);
  const wind = new Float32Array(count * 4);
  const color = new Uint8Array(count * 4);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const index = y * w + x;
      const source = (Math.floor(y * density) * raster.width + Math.floor(x * density)) * 4;
      color.set([pixels[source], pixels[source + 1], pixels[source + 2], pixels[source + 3]], index * 4);
      release[index] = DUST.release + 0.95 * (1 - x / w) + 0.3 * coarse(x, y) + 0.08 * fine(x, y) + 0.02 * random();
      life[index] = 1.1 + 0.8 * random();
      wind.set([random(), random(), random() * Math.PI * 2, random() * Math.PI * 2], index * 4);
    }
  }
  state.particles = { release, life, wind, color };
  state.maskData = new ImageData(w, h);
}

scene({
  id: 'F-call-dissolves',
  in: DUST.in,
  out: DUST.cut,
  build(root) {
    const handles = cinematicPanel(root, { background: 'radial-gradient(90% 80% at 50% 45%, #131826 0%, #05060A 75%)' });
    const dust = plate(handles.content, asset('dust', 1), { width: 2300, height: 1300, opacity: 0.18 });
    const density = window.devicePixelRatio || 1;
    const canvas = el('canvas', 'abs', handles.content);
    canvas.width = 1920 * density;
    canvas.height = 1080 * density;
    css(canvas, { left: 0, top: 0, width: '1920px', height: '1080px' });
    const raster = document.createElement('canvas');
    raster.width = DUST.w * density;
    raster.height = DUST.h * density;
    const mask = document.createElement('canvas');
    mask.width = DUST.w;
    mask.height = DUST.h;
    const motes = document.createElement('canvas');
    motes.width = canvas.width;
    motes.height = canvas.height;
    const faces = [2, 9, 17, 25].map((index) => preload(asset('faces', index)));

    const words = el('div', 'abs cine', handles.content);
    css(words, { left: 0, right: 0, top: '330px', textAlign: 'center' });
    const nothing = el('div', 'serif-i', words);
    css(nothing, { fontSize: '260px', lineHeight: '1', color: '#F4EFE6' });
    const nothingLetters = letters(nothing, 'Nothing');
    const follow = el('div', '', words, 'to follow up on.');
    css(follow, { fontSize: '76px', fontWeight: 800, letterSpacing: '-0.045em', marginTop: '18px' });

    return { handles, dust, canvas, raster, mask, motes, faces, words, nothingLetters, follow };
  },
  update({ T, s }) {
    updateCinematic(s.handles, T, { start: DUST.in, cut: DUST.cut, inkDuration: 0, hardCut: true });
    if (!s.particles) buildDust(s);

    const density = window.devicePixelRatio || 1;
    const context = s.canvas.getContext('2d');
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, s.canvas.width, s.canvas.height);
    s.dust.style.transform = `scale(1.05) translate(${(T - DUST.in) * 10}px, ${(T - DUST.in) * -4}px)`;
    const { w, h, x: left, y: top } = DUST;

    if (T < DUST.release) {
      const rasterContext = s.raster.getContext('2d');
      rasterContext.setTransform(density, 0, 0, density, 0, 0);
      paintCallWindow(rasterContext, s.faces, T, ep(T, 19.6, 19.85));
      const hover = ep(T, DUST.in, DUST.in + 0.4);
      context.globalAlpha = hover;
      context.drawImage(s.raster, left * density, top * density, w * density, h * density);
      context.globalAlpha = 1;
    } else {
      const { release, life, wind, color } = s.particles;
      const maskPixels = s.maskData.data;
      for (let index = 0; index < w * h; index += 1) maskPixels[index * 4 + 3] = T < release[index] ? 255 : 0;
      s.mask.getContext('2d').putImageData(s.maskData, 0, 0);
      const rasterContext = s.raster.getContext('2d');
      rasterContext.setTransform(density, 0, 0, density, 0, 0);
      paintCallWindow(rasterContext, s.faces, DUST.release, 1);
      rasterContext.globalCompositeOperation = 'destination-in';
      rasterContext.imageSmoothingEnabled = true;
      rasterContext.drawImage(s.mask, 0, 0, w, h);
      rasterContext.globalCompositeOperation = 'source-over';
      context.drawImage(s.raster, left * density, top * density, w * density, h * density);

      const width = s.motes.width;
      const height = s.motes.height;
      const frame = new ImageData(width, height);
      const out = frame.data;
      const block = Math.max(1, Math.round(density));
      for (let index = 0; index < w * h; index += 1) {
        const age = T - release[index];
        const alphaSource = color[index * 4 + 3];
        if (age < 0 || age > life[index] || alphaSource < 10) continue;

        const r1 = wind[index * 4];
        const r2 = wind[index * 4 + 1];
        const phaseX = wind[index * 4 + 2];
        const phaseY = wind[index * 4 + 3];
        const px = (index % w) + (240 + 160 * r1) * age + 90 * age * age + 22 * Math.sin(age * 4 + phaseX) * age;
        const py = Math.floor(index / w) - (70 + 140 * r2) * age - 40 * age * age + 16 * Math.cos(age * 3.3 + phaseY) * age;
        const sx = Math.round((left + px) * density);
        const sy = Math.round((top + py) * density);
        if (sx < 0 || sy < 0 || sx >= width - block || sy >= height - block) continue;

        const fade = Math.pow(1 - age / life[index], 1.5) * (alphaSource / 255);
        const heat = clamp(age * 1.6);
        const red = lerp(color[index * 4], 255, heat * 0.8) * fade;
        const green = lerp(color[index * 4 + 1], 214, heat * 0.8) * fade;
        const blue = lerp(color[index * 4 + 2], 170, heat * 0.8) * fade;
        for (let dy = 0; dy < block; dy += 1) {
          for (let dx = 0; dx < block; dx += 1) {
            const at = ((sy + dy) * width + sx + dx) * 4;
            out[at] = Math.min(255, out[at] + red);
            out[at + 1] = Math.min(255, out[at + 1] + green);
            out[at + 2] = Math.min(255, out[at + 2] + blue);
            out[at + 3] = Math.min(255, out[at + 3] + 255 * fade);
          }
        }
      }
      const motesContext = s.motes.getContext('2d');
      motesContext.putImageData(frame, 0, 0);
      context.globalCompositeOperation = 'lighter';
      context.filter = `blur(${6 * density}px)`;
      context.globalAlpha = 0.9;
      context.drawImage(s.motes, 0, 0);
      context.filter = 'none';
      context.globalAlpha = 1;
      context.drawImage(s.motes, 0, 0);
      context.globalCompositeOperation = 'source-over';
    }

    lettersIn(s.nothingLetters, T, 20.6, { stagger: 0.045, duration: 0.6, distance: 30, blur: 20 });
    s.nothingLetters.forEach((span) => (span.style.textShadow = glow('255,214,170', 0.5)));
    const followIn = ep(T, 21.72, 22.1);
    s.follow.style.opacity = followIn;
    s.follow.style.filter = `blur(${(1 - followIn) * 14}px)`;
    s.follow.style.transform = `translateY(${(1 - followIn) * 24}px)`;
    s.words.style.transform = `scale(${1 + 0.012 * (T - 20.6)})`;
  }
});

/* ===================== G. "They say they understood it… they really didn't" ===================== */

const NOD = { in: 23.333, out: 27.95, glitch: 26.46, unmask: 26.79, shatter: 27.12, shots: [23.333, 23.9, 25.033] };
const NOD_MESSAGES = [
  { text: 'Got it 👍', at: 23.45, face: 4, depth: 1.0, spots: [[110, 110], [1180, 90], [80, 110]] },
  { text: 'Makes sense!', at: 23.72, face: 12, depth: 0.92, spots: [[520, 210], [1500, 170], [1330, 90]] },
  { text: 'Yep, all clear ✅', at: 24.05, face: 19, depth: 0.95, spots: [[110, 800], [60, 300], [60, 320]] },
  { text: 'Super helpful, thanks 🙏', at: 24.4, face: 27, depth: 0.88, spots: [[110, 800], [1180, 770], [1240, 300]] },
  { text: 'Understood 🙌', at: 24.75, face: 33, depth: 0.95, spots: [[110, 800], [60, 620], [1380, 520]] },
  { text: 'No questions here!', at: 25.15, face: 8, depth: 0.88, spots: [[110, 800], [60, 620], [60, 540]] },
  { text: 'Crystal clear 💯', at: 25.55, face: 22, depth: 0.92, spots: [[110, 800], [60, 620], [1320, 740]] }
];
const SHARDS = [
  'polygon(0 0, 56% 0, 47% 46%, 0 62%)',
  'polygon(56% 0, 100% 0, 100% 52%, 47% 46%)',
  'polygon(0 62%, 47% 46%, 63% 100%, 0 100%)',
  'polygon(47% 46%, 100% 52%, 100% 100%, 63% 100%)'
];

function buildBubble(parent, message) {
  const holder = el('div', 'abs', parent);
  const shards = SHARDS.map((clip) => {
    const shard = el('div', 'abs', holder);
    css(shard, { left: 0, top: 0, clipPath: clip });
    const bubble = el('div', '', shard);
    css(bubble, {
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      padding: '16px 30px 16px 16px',
      borderRadius: '40px 40px 40px 10px',
      background: '#FFFFFF',
      color: '#17140F',
      whiteSpace: 'nowrap',
      boxShadow: '0 18px 40px rgba(0,0,0,0.28)'
    });
    const face = el('div', '', bubble);
    css(face, { width: '64px', height: '64px', borderRadius: '50%', backgroundImage: `url(${asset('faces', message.face)})`, backgroundSize: 'cover', flex: 'none' });
    const text = el('div', '', bubble, message.text);
    css(text, { fontSize: '38px', fontWeight: 600, letterSpacing: '-0.02em' });

    return { shard, bubble, text };
  });

  return { ...message, holder, shards, seed: message.face * 13 + 7 };
}

scene({
  id: 'G-understood',
  in: NOD.in,
  out: NOD.out,
  behind: [NOD.in, NOD.out],
  build(root) {
    return { bubbles: NOD_MESSAGES.map((message) => buildBubble(root, message)) };
  },
  update({ T, s }) {
    const shot = T >= NOD.shots[2] ? 2 : T >= NOD.shots[1] ? 1 : 0;
    const glitch = T >= NOD.glitch && T < NOD.shatter + 0.05;
    const tick = Math.floor(T * 30);
    s.bubbles.forEach((bubble, index) => {
      const [x, y] = bubble.spots[shot];
      const pop = spring(T, bubble.at, 1.6, 6);
      const visible = T >= bubble.at;
      bubble.holder.style.display = visible ? 'block' : 'none';
      if (!visible) return;

      const floatY = -8 * (T - bubble.at);
      const scale = bubble.depth * lerp(0.4, 1, clamp(pop, 0, 1.2));
      let jitterX = 0;
      let jitterY = 0;
      if (glitch) {
        const random = seeded(tick * 31 + index * 7);
        jitterX = (random() - 0.5) * 40 * (random() < 0.6 ? 1 : 0);
        jitterY = (random() - 0.5) * 8;
      }
      bubble.holder.style.transform = `translate(${x + jitterX}px, ${y + floatY + jitterY}px) scale(${scale})`;
      bubble.holder.style.transformOrigin = '0 100%';
      bubble.holder.style.filter = `blur(${((1 - bubble.depth) * 6).toFixed(1)}px)`;
      bubble.holder.style.opacity = String(clamp(pop * 2) * (1 - ep(T, NOD.shatter + 0.45, NOD.shatter + 0.8)));

      const unmasked = T >= NOD.unmask;
      const label = unmasked ? '?' : glitch ? scramble(bubble.text, T, NOD.glitch, NOD.unmask + 1, bubble.seed) : bubble.text;
      const broken = ep(T, NOD.shatter, NOD.shatter + 0.7, ease.inCubic);
      bubble.shards.forEach((piece, shardIndex) => {
        piece.text.textContent = label;
        piece.text.style.fontSize = unmasked ? '54px' : '38px';
        piece.text.style.fontWeight = unmasked ? '800' : '600';
        piece.bubble.style.background = unmasked ? '#F1ECE4' : '#FFFFFF';
        piece.shard.style.filter = glitch ? 'drop-shadow(4px 0 0 rgba(255,40,90,0.85)) drop-shadow(-4px 0 0 rgba(0,220,255,0.85))' : 'none';
        const age = Math.max(0, T - NOD.shatter);
        const direction = shardIndex % 2 === 0 ? -1 : 1;
        const crack = T >= NOD.shatter ? 6 : 0;
        const dx = direction * (crack + 140 * age);
        const dy = (shardIndex < 2 ? -crack : crack) + 900 * age * age - (shardIndex < 2 ? 120 : 40) * age;
        const spin = direction * 160 * age;
        piece.shard.style.transform = `translate(${dx}px, ${dy}px) rotate(${spin}deg)`;
        piece.shard.style.opacity = String(1 - broken);
      });
    });
  }
});

/* ===================== N. Bookend: "your experts stop repeating themselves … unique about every customer" ===================== */

const BOOKEND = { in: 90.3, cut: 95.933, rewind: [91.72, 92.6], warm: 93.44, unique: 95.01, land: 95.9 };
const bookendFootage = footageClip(2709, 2878);
const UNIQUE_LABELS = ['ACME · SSO ROLLOUT', 'LUMEN · DATA MIGRATION', 'NORTHWIND · EXEC REVIEW', 'ORBIT · CUSTOM REPORTS', 'HALCYON · API WORKSHOP', 'KESTREL · ADMIN SETUP', 'ATLAS · PILOT REVIEW', 'MERIDIAN · RENEWAL PLAN'];

scene({
  id: 'N-unique',
  in: BOOKEND.in,
  out: BOOKEND.cut,
  prepare(T) {
    return bookendFootage.prepare(T);
  },
  build(root) {
    const handles = cinematicPanel(root, { background: 'radial-gradient(120% 100% at 50% 50%, #0B1020 0%, #04050A 70%)' });
    const wall = buildCallWall(handles.content, { seed: 11, liveLabel: 'YOUR EXPERT' });
    const scrim = el('div', 'abs', handles.content);
    css(scrim, { inset: 0, background: 'radial-gradient(48% 38% at 50% 50%, rgba(3,4,9,0.94) 0%, rgba(3,4,9,0.72) 55%, rgba(3,4,9,0) 100%)' });
    const counter = buildCounter(handles.content, 330, 'THE SAME ONBOARDING SESSION');
    counter.number.textContent = '100';
    const warmGlow = el('div', 'abs', handles.content);
    css(warmGlow, { inset: 0, background: 'radial-gradient(40% 40% at 50% 50%, rgba(255,190,120,0.35), rgba(255,170,90,0) 70%)', mixBlendMode: 'screen', opacity: 0 });
    wall.tiles.slice(1, 9).forEach((tile, index) => (tile.uniqueLabel = UNIQUE_LABELS[index]));

    return { handles, wall, scrim, counter, warmGlow };
  },
  update({ T, s }) {
    const fx = 1 - ep(T, 95.45, BOOKEND.land);
    updateCinematic(s.handles, T, { start: BOOKEND.in, cut: BOOKEND.cut, inkDuration: 0, hardCut: true, effects: fx });

    const level = 0.32 * (1 + 0.04 * (T - BOOKEND.in));
    const push = ep(T, 94.85, BOOKEND.land, ease.inOutCubic);
    const scale = Math.exp(lerp(Math.log(level), Math.log(WALL_FULL), push));
    const settle = ep(T, 92.7, BOOKEND.land - 0.1, ease.inOutCubic);
    const tiltX = 40 * (1 - settle);
    const roll = -12 * (1 - settle) + 1.2 * Math.sin(T * 0.9) * (1 - settle);
    setWallCamera(s.wall, scale, tiltX, roll);
    const full = T >= BOOKEND.land ? 1 : clamp((scale - 3.2) / 0.8);
    updateLiveTile(s.wall, bookendFootage.imageAt(T), scale, full);

    const rewind = ep(T, BOOKEND.rewind[0], BOOKEND.rewind[1], ease.outCubic);
    const count = Math.max(1, Math.round(100 - 99 * rewind));
    s.counter.number.textContent = String(count).padStart(3, '0');
    const counterIn = ep(T, BOOKEND.in, BOOKEND.in + 0.35);
    const counterOut = ep(T, 93.0, 93.4);
    s.counter.box.style.opacity = counterIn * (1 - counterOut);
    s.counter.box.style.filter = `blur(${(1 - counterIn) * 16 + counterOut * 18}px)`;
    s.counter.box.style.transform = `scale(${1 + 0.08 * kick(T, BOOKEND.rewind[1], 6)})`;
    s.counter.number.style.textShadow = glow('173,195,255', 0.6 + 1.4 * kick(T, BOOKEND.rewind[1], 3));
    s.scrim.style.opacity = 1 - counterOut;

    const rollRad = (roll * Math.PI) / 180;
    const tiltRad = (tiltX * Math.PI) / 180;
    s.wall.tiles.forEach((tile, index) => {
      if (index === 0) {
        tile.node.style.filter = 'none';
        return;
      }

      const rolledY = tile.x * Math.sin(rollRad) + tile.y * Math.cos(rollRad);
      const depth = rolledY * Math.sin(tiltRad);
      const blur = Math.min(7, Math.abs(depth) / 260) * (1 - settle);
      const fog = 1 - 0.6 * clamp(tile.dist / 3600) * (1 - settle);
      const goneAt = BOOKEND.rewind[0] + (BOOKEND.rewind[1] - BOOKEND.rewind[0]) * Math.pow(1 - Math.min(index, 99) / 100, 2.2);
      const dark = ep(T, goneAt, goneAt + 0.15);
      let brightness = fog * lerp(1, 0.07, dark);
      let saturate = 1 - dark;
      let ring = 0;
      if (tile.uniqueLabel) {
        const relight = ep(T, BOOKEND.warm + index * 0.09, BOOKEND.warm + index * 0.09 + 0.35);
        const spark = kick(T, BOOKEND.unique, 3);
        brightness = lerp(brightness, 1.05 + 0.3 * spark, relight);
        saturate = lerp(saturate, 1.15, relight);
        ring = relight;
        tile.originalLabel = tile.originalLabel || tile.label.textContent;
        tile.label.textContent = relight > 0.5 ? tile.uniqueLabel : tile.originalLabel;
        tile.label.style.background = relight > 0.5 ? 'rgba(214,150,60,0.92)' : '';
        tile.label.style.color = relight > 0.5 ? '#1A1206' : '';
      }
      tile.node.style.filter = `brightness(${brightness.toFixed(3)}) saturate(${saturate.toFixed(2)}) sepia(${(0.25 * ring).toFixed(2)}) blur(${blur.toFixed(2)}px)`;
      tile.node.style.boxShadow = ring > 0.02 ? `0 0 0 3px rgba(255,200,130,${0.9 * ring}), 0 0 ${70 * ring}px rgba(255,170,90,${0.6 * ring})` : '';
    });
    s.warmGlow.style.opacity = ep(T, BOOKEND.warm, BOOKEND.warm + 0.8) * (1 - push) * 0.9;
  }
});
