/* v2 hero scenes. Times are source seconds in Video 1A.MOV. */

const FACE_COUNT = () => ASSETS.faces.length;

/* ===================== A. The call wall: "the same onboarding session for the 100th time" ===================== */


function buildSlideTile(tile, faceIndex, hero) {
  const slide = el('div', 'abs', tile);
  css(slide, { inset: 0, background: '#F3EFE6' });
  const kicker = el('div', 'abs', slide, 'PRODUCT 101 · ONBOARDING');
  css(kicker, { left: '26px', top: '24px', fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.16em', color: '#6B6152' });
  const title = el('div', 'abs serif', slide, 'Getting started');
  css(title, { left: '24px', top: '48px', fontSize: '44px', lineHeight: '1', color: '#17140F' });
  const sub = el('div', 'abs', slide, 'Slide 1 of 24');
  css(sub, { left: '26px', top: '102px', fontSize: '14px', color: '#6B6152' });
  [0.82, 0.64, 0.74].forEach((width, index) => {
    const bar = el('div', 'abs', slide);
    css(bar, { left: '26px', top: 146 + index * 22 + 'px', width: 250 * width + 'px', height: '9px', borderRadius: '5px', background: '#DCD3C2' });
  });
  const pip = el('div', 'abs', slide);
  css(pip, {
    right: '16px',
    bottom: '16px',
    width: '120px',
    height: '120px',
    borderRadius: '12px',
    backgroundImage: `url(${asset('faces', faceIndex)})`,
    backgroundSize: 'cover',
    boxShadow: '0 6px 18px rgba(0,0,0,0.25)'
  });
  if (hero) {
    const rec = el('div', 'abs', slide, '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#E5484D;margin-right:7px"></span>REC 00:47:12');
    css(rec, { right: '18px', top: '20px', fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.1em', color: '#17140F' });
  }
}

/* ===================== B. Trainer corridor: "to grow, you hire more people … again and again" ===================== */

const CORRIDOR = { in: 28.0, cut: 32.3, beats: [28.89, 29.57, 30.01, 30.59, 31.23, 31.68], cards: 120 };

function corridorSpeed(T) {
  let speed = 1900;
  for (const beat of CORRIDOR.beats) speed += 5400 * kick(T, beat, 3.0);

  return speed;
}

const CORRIDOR_PATH = (() => {
  const step = 1 / 240;
  const samples = [0];
  for (let time = CORRIDOR.in; time < CORRIDOR.cut + 0.5; time += step) {
    samples.push(samples[samples.length - 1] + corridorSpeed(time) * step);
  }

  return (T) => samples[clamp(Math.floor((T - CORRIDOR.in) * 240), 0, samples.length - 1)];
})();

scene({
  id: 'B-trainer-corridor',
  in: CORRIDOR.in,
  out: CORRIDOR.cut + 0.3,
  build(root) {
    const handles = cinematicPanel(root, { background: 'radial-gradient(60% 60% at 50% 48%, #121A33 0%, #05060B 75%)' });
    const glowCore = plate(handles.content, asset('light', 3), { width: 1100, height: 1460, opacity: 0.55 });
    const stars = el('canvas', 'abs', handles.content);
    stars.width = 1920;
    stars.height = 1080;
    css(stars, { left: 0, top: 0, width: '1920px', height: '1080px' });

    const view = el('div', 'abs', handles.content);
    css(view, { inset: 0, perspective: '900px', perspectiveOrigin: '50% 50%', zIndex: 1 });
    const textScrim = el('div', 'abs', handles.content);
    css(textScrim, { inset: 0, zIndex: 2, background: 'radial-gradient(36% 24% at 50% 52%, rgba(4,6,12,0.7) 0%, rgba(4,6,12,0) 100%)' });
    const world = el('div', 'd3', view);
    css(world, { left: '960px', top: '540px' });

    const random = seeded(29);
    const pool = [...ASSETS.bw.map((_, index) => ['bw', index]), ...ASSETS.faces.map((_, index) => ['faces', index])];
    const cards = [];
    for (let index = 0; index < CORRIDOR.cards; index += 1) {
      const angle = index * 2.39996 + (random() - 0.5) * 0.5;
      const x = Math.cos(angle) * (900 + random() * 320);
      const y = Math.sin(angle) * (560 + random() * 220);
      const z = -(700 + index * 300);
      const side = Math.cos(angle);
      const lean = Math.sin(angle);
      const node = el('div', 'tile', world);
      css(node, { width: '300px', height: '420px', left: '-150px', top: '-210px', background: '#F2EEE6' });
      const [folder, assetIndex] = pool[Math.floor(random() * pool.length)];
      const photo = el('div', 'ph', node);
      css(photo, { inset: '0 0 76px 0', backgroundImage: `url(${asset(folder, assetIndex)})`, filter: 'grayscale(1) contrast(1.15)' });
      const caption = el('div', 'abs', node);
      css(caption, { left: '16px', right: '16px', bottom: '14px', color: '#17140F' });
      el('div', '', caption, 'PRODUCT 101').style.cssText = 'font-family:var(--mono);font-size:11px;letter-spacing:.16em;color:#6B6152';
      el('div', 'serif', caption, 'Getting started · Slide 1').style.cssText += ';font-size:22px;line-height:1.2';
      cards.push({ node, x, y, z, side, lean, spin: (random() - 0.5) * 8 });
    }

    const random2 = seeded(5);
    const particles = Array.from({ length: 380 }, () => ({
      x: (random2() - 0.5) * 7000,
      y: (random2() - 0.5) * 4200,
      z: -random2() * 36000
    }));

    const headline = el('div', 'abs cine', handles.content);
    css(headline, { left: 0, right: 0, top: '400px', textAlign: 'center', zIndex: 3 });
    const lineA1 = el('div', 'serif-i', headline, 'To grow,');
    css(lineA1, { fontSize: '120px', lineHeight: '1' });
    const lineA2 = el('div', '', headline, 'you hire more people.');
    css(lineA2, { fontSize: '92px', fontWeight: 800, letterSpacing: '-0.045em', lineHeight: '1.05' });

    const headlineB = el('div', 'abs cine', handles.content);
    css(headlineB, { left: 0, right: 0, top: '400px', textAlign: 'center', zIndex: 3 });
    const lineB1 = el('div', '', headlineB, 'To teach the same thing');
    css(lineB1, { fontSize: '92px', fontWeight: 800, letterSpacing: '-0.045em', lineHeight: '1.05' });
    const lineB2 = el('div', 'serif-i', headlineB);
    css(lineB2, { fontSize: '130px', lineHeight: '1.05' });
    const againOne = el('span', '', lineB2, 'again,&nbsp;');
    const againTwo = el('span', '', lineB2, 'and again.');
    [againOne, againTwo].forEach((span) => (span.style.display = 'inline-block'));

    const counter = el('div', 'abs cine', handles.content);
    css(counter, { left: '120px', bottom: '96px', zIndex: 3 });
    const counterLabel = el('div', '', counter, 'TRAINERS ON PAYROLL');
    css(counterLabel, { fontFamily: 'var(--mono)', fontSize: '18px', letterSpacing: '0.3em', opacity: 0.7 });
    const counterValue = el('div', '', counter, '1');
    css(counterValue, { fontSize: '170px', fontWeight: 800, letterSpacing: '-0.05em', lineHeight: '0.95', fontVariantNumeric: 'tabular-nums', transformOrigin: 'left bottom' });

    return { handles, glowCore, stars, world, cards, particles, headline, lineA1, lineA2, headlineB, lineB1, againOne, againTwo, counter, counterValue };
  },
  update({ T, s }) {
    updateCinematic(s.handles, T, { start: CORRIDOR.in, cut: CORRIDOR.cut, inkDuration: 0 });

    const travel = CORRIDOR_PATH(T);
    const roll = 2.5 * Math.sin((T - 28) * 1.3);
    s.world.style.transform = `rotateZ(${roll}deg)`;
    s.cards.forEach((card) => {
      const relative = card.z + travel;
      if (relative > 860 || relative < -22000) {
        card.node.style.display = 'none';
        return;
      }

      card.node.style.display = 'block';
      const fade = clamp((relative + 22000) / 9000);
      const fog = clamp(1 - -relative / 19000, 0.12, 1);
      const nearBlur = clamp((relative - 150) / 70, 0, 12);
      card.node.style.opacity = fade;
      card.node.style.filter = `brightness(${fog.toFixed(3)}) blur(${nearBlur.toFixed(1)}px)`;
      card.node.style.transform = `translate3d(${card.x}px, ${card.y}px, ${relative}px) rotateY(${-card.side * 30 + card.spin}deg) rotateX(${-card.lean * 22}deg)`;
    });

    const context = s.stars.getContext('2d');
    context.clearRect(0, 0, 1920, 1080);
    const previous = CORRIDOR_PATH(T - 1 / 30);
    const focal = 900;
    context.lineCap = 'round';
    for (const particle of s.particles) {
      const zNow = ((particle.z + travel) % 36000) - 36000 + 900;
      const zBefore = zNow - (travel - previous);
      if (zNow > -40) continue;

      const scaleNow = focal / -zNow;
      const scaleBefore = focal / Math.min(-40, -zBefore);
      const alpha = clamp(1 - -zNow / 30000) * 0.9;
      context.strokeStyle = `rgba(190,208,255,${alpha.toFixed(3)})`;
      context.lineWidth = clamp(scaleNow * 6, 0.6, 3);
      context.beginPath();
      context.moveTo(960 + particle.x * scaleBefore, 540 + particle.y * scaleBefore);
      context.lineTo(960 + particle.x * scaleNow, 540 + particle.y * scaleNow);
      context.stroke();
    }

    let pulse = 0;
    for (const beat of CORRIDOR.beats) pulse += kick(T, beat, 4);
    s.glowCore.style.opacity = 0.45 + 0.5 * clamp(pulse);
    s.glowCore.style.transform = `scale(${1 + 0.35 * clamp(pulse)}) rotate(${(T - 28) * 10}deg)`;

    const aIn = ep(T, 28.2, 28.55);
    const a2In = ep(T, 28.85, 29.2);
    const aOut = ep(T, 29.85, 30.05, ease.inCubic);
    s.lineA1.style.opacity = aIn;
    s.lineA1.style.filter = `blur(${(1 - aIn) * 16}px)`;
    s.lineA2.style.opacity = a2In;
    s.lineA2.style.filter = `blur(${(1 - a2In) * 16}px)`;
    s.headline.style.opacity = 1 - aOut;
    s.headline.style.transform = `scale(${1 + 0.6 * aOut})`;
    s.headline.style.filter = `blur(${aOut * 20}px)`;

    const bIn = ep(T, 30.0, 30.3);
    s.headlineB.style.opacity = bIn;
    s.lineB1.style.filter = `blur(${(1 - bIn) * 16}px)`;
    s.lineB1.style.transform = `scale(${lerp(0.85, 1, bIn)})`;
    [
      [s.againOne, 31.23],
      [s.againTwo, 31.68]
    ].forEach(([span, at]) => {
      const amount = ep(T, at - 0.04, at + 0.2, ease.outExpo);
      span.style.opacity = amount;
      span.style.transform = `scale(${lerp(1.6, 1, amount) + 0.08 * kick(T, at, 8)})`;
      span.style.filter = `blur(${(1 - amount) * 18}px)`;
      span.style.textShadow = glow('173,195,255', 0.4 + 1.4 * kick(T, at, 3));
    });

    let trainers = 1;
    CORRIDOR.beats.forEach((beat) => {
      if (T >= beat) trainers *= 2;
    });
    s.counterValue.textContent = String(trainers);
    s.counterValue.style.transform = `scale(${1 + 0.18 * clamp(pulse)})`;
    s.counterValue.style.textShadow = glow('173,195,255', 0.3 + clamp(pulse));
    s.counter.style.opacity = ep(T, 28.1, 28.5);
  }
});

/* ===================== C. Teach it once: swarm → one point → a course → hosted → your customers ===================== */

const ONCE = { in: 39.3, cut: 47.27, core: [960, 640] };
const ONCE_CHIPS = ['MON 10:00', 'TUE 10:00', 'WED 14:00', 'THU 10:00', 'FRI 16:00', 'MON 10:00'];
const ONCE_LESSONS = ['Welcome', 'Set up your workspace', 'Core workflows', 'Integrations', 'Quiz & certificate'];
const ONCE_AVATARS = [
  [170, 330],
  [330, 470],
  [150, 610],
  [340, 750],
  [190, 880],
  [470, 300],
  [480, 900],
  [1750, 330],
  [1590, 470],
  [1770, 610],
  [1580, 750],
  [1730, 880],
  [1450, 300],
  [1440, 900]
];

scene({
  id: 'C-teach-it-once',
  in: ONCE.in,
  out: ONCE.cut + 0.3,
  build(root) {
    const handles = cinematicPanel(root, { background: 'radial-gradient(80% 80% at 50% 58%, #0D1328 0%, #03040A 72%)' });
    const content = handles.content;
    const lasers = plate(content, asset('light', 0), { width: 2600, height: 1733, opacity: 0 });
    const bloom = el('div', 'abs', content);
    css(bloom, { left: ONCE.core[0] - 900 + 'px', top: ONCE.core[1] - 900 + 'px', width: '1800px', height: '1800px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(200,215,255,0.6) 18%, rgba(120,150,255,0.15) 45%, rgba(0,0,0,0) 70%)', mixBlendMode: 'screen' });

    const random = seeded(41);
    const swarm = Array.from({ length: 96 }, (_, index) => {
      const node = el('div', 'abs', content);
      css(node, { width: '72px', height: '72px', borderRadius: '50%', backgroundImage: `url(${asset('faces', index)})`, backgroundSize: 'cover', boxShadow: '0 0 0 2px rgba(255,255,255,0.35)' });

      return { node, radius: 300 + random() * 820, angle: random() * Math.PI * 2, height: (random() - 0.5) * 320, speed: 0.35 + random() * 0.35 };
    });

    const core = el('div', 'abs', content);
    css(core, { left: ONCE.core[0] - 120 + 'px', top: ONCE.core[1] - 120 + 'px', width: '240px', height: '240px', borderRadius: '50%', background: 'radial-gradient(circle, #FFFFFF 0%, #DCE6FF 22%, rgba(120,150,255,0.55) 45%, rgba(40,60,200,0) 70%)', mixBlendMode: 'screen' });

    const chips = ONCE_CHIPS.map((when, index) => {
      const node = el('div', 'glass cine', content);
      css(node, { width: '300px', height: '78px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '14px', padding: '0 18px' });
      const avatar = el('div', '', node);
      css(avatar, { width: '44px', height: '44px', borderRadius: '50%', backgroundImage: `url(${asset('faces', index * 7 + 3)})`, backgroundSize: 'cover', flex: 'none' });
      const text = el('div', '', node);
      el('div', '', text, when).style.cssText = 'font-family:var(--mono);font-size:13px;letter-spacing:.14em;opacity:.7';
      el('div', '', text, 'Onboarding call').style.cssText = 'font-size:21px;font-weight:600;letter-spacing:-.01em';

      return node;
    });

    const headline = el('div', 'abs cine', content);
    css(headline, { left: 0, right: 0, top: '120px', display: 'flex', justifyContent: 'center', alignItems: 'baseline', whiteSpace: 'nowrap' });
    const teachHolder = el('div', '', headline);
    css(teachHolder, { fontSize: '150px', fontWeight: 800, letterSpacing: '-0.05em', lineHeight: '1' });
    const teachLetters = letters(teachHolder, 'Teach it');
    const once = el('div', 'serif-i', headline, 'once.');
    css(once, { fontSize: '200px', lineHeight: '1', color: '#EAF0FF', marginLeft: '40px' });

    const stackView = el('div', 'abs', content);
    css(stackView, { inset: 0, perspective: '2600px', perspectiveOrigin: `${ONCE.core[0]}px ${ONCE.core[1]}px` });
    const stack = el('div', 'd3', stackView);
    css(stack, { left: ONCE.core[0] + 'px', top: ONCE.core[1] + 'px' });
    const slabW = 540;
    const slabD = 128;
    const slabH = 34;
    const slabs = ONCE_LESSONS.map((title, index) => {
      const slab = el('div', 'd3', stack);
      const top = el('div', 'abs', slab);
      css(top, {
        left: -slabW / 2 + 'px',
        top: -slabD / 2 + 'px',
        width: slabW + 'px',
        height: slabD + 'px',
        borderRadius: '14px',
        background: 'linear-gradient(135deg, rgba(60,85,200,0.85), rgba(22,34,96,0.92) 60%, rgba(14,20,60,0.95))',
        border: '1.5px solid rgba(200,215,255,0.9)',
        boxShadow: 'inset 0 0 40px rgba(173,195,255,0.25), 0 0 40px rgba(120,150,255,0.25)',
        color: '#F2EEE6',
        display: 'flex',
        alignItems: 'center',
        gap: '22px',
        padding: '0 30px',
        transform: `translateZ(${slabH}px)`
      });
      el('div', '', top, String(index + 1).padStart(2, '0')).style.cssText = 'font-family:var(--mono);font-size:22px;letter-spacing:.12em;opacity:.65';
      el('div', '', top, title).style.cssText = 'font-size:34px;font-weight:650;letter-spacing:-.02em';
      const front = el('div', 'abs', slab);
      css(front, { left: -slabW / 2 + 'px', top: slabD / 2 + 'px', width: slabW + 'px', height: slabH + 'px', background: 'linear-gradient(rgba(150,175,255,0.55), rgba(60,90,220,0.25))', transformOrigin: 'top', transform: `translateZ(${slabH}px) rotateX(-90deg)` });
      const side = el('div', 'abs', slab);
      css(side, { left: slabW / 2 + 'px', top: -slabD / 2 + 'px', width: slabH + 'px', height: slabD + 'px', background: 'linear-gradient(90deg, rgba(120,150,255,0.45), rgba(40,60,180,0.2))', transformOrigin: 'left', transform: `translateZ(${slabH}px) rotateY(90deg)` });

      return slab;
    });

    const courseLabel = el('div', 'abs cine', content);
    css(courseLabel, { left: 0, right: 0, top: '338px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '20px', letterSpacing: '0.34em', opacity: 0 });
    courseLabel.textContent = 'PRODUCT 101 · COURSE · 5 LESSONS';

    const hosted = el('div', 'abs cine', content);
    css(hosted, { left: 0, right: 0, top: '930px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '22px' });
    el('div', '', hosted, 'HOSTED ON').style.cssText = 'font-family:var(--mono);font-size:20px;letter-spacing:.3em;opacity:.7';
    const lockup = el('div', '', hosted);
    css(lockup, { position: 'relative', height: '62px', width: '420px' });
    logoLockup(lockup, 54, '#FFFFFF', '#FFFFFF');

    const svg = svgLayer(content, 'onceGlow');
    const avatars = ONCE_AVATARS.map(([x, y], index) => {
      const node = el('div', 'abs', content);
      css(node, { left: x - 52 + 'px', top: y - 52 + 'px', width: '104px', height: '104px', borderRadius: '50%', backgroundImage: `url(${asset('faces', index * 3 + 1)})`, backgroundSize: 'cover' });
      const startX = ONCE.core[0] + (x < 960 ? -250 : 250);
      const d = `M${startX} ${ONCE.core[1]} C ${(startX + x) / 2} ${ONCE.core[1]}, ${(startX + x) / 2} ${y}, ${x + (x < 960 ? 56 : -56)} ${y}`;

      return { node, trail: makeTrail(svg, d, '#BFD0FF', 'onceGlow', 3) };
    });

    return { handles, lasers, bloom, swarm, core, chips, headline, teachLetters, once, stack, slabs, courseLabel, hosted, avatars };
  },
  update({ T, s }) {
    updateCinematic(s.handles, T, { start: ONCE.in, cut: ONCE.cut, inkDuration: 0.45, inks: ['ink1', 'ink6'] });

    const collapse = ease.inExpo(prog(T, 39.6, 40.0));
    const spin = 7 * ease.inCubic(prog(T, 39.45, 40.0));
    const tilt = (64 * Math.PI) / 180;
    s.swarm.forEach((face) => {
      if (T >= 40.0) {
        face.node.style.display = 'none';
        return;
      }

      face.node.style.display = 'block';
      const angle = face.angle + face.speed * (T - ONCE.in) + spin;
      const radius = face.radius * (1 - collapse);
      const x = radius * Math.cos(angle);
      const ringZ = radius * Math.sin(angle);
      const y = face.height * (1 - collapse) * Math.cos(tilt) - ringZ * Math.sin(tilt);
      const z = face.height * Math.sin(tilt) + ringZ * Math.cos(tilt);
      const scale = 1400 / (1400 + z);
      const depthBlur = clamp(Math.abs(z) / 220, 0, 5) + collapse * 6;
      face.node.style.transform = `translate(${ONCE.core[0] + x * scale - 36}px, ${ONCE.core[1] - 60 + y * scale - 36}px) scale(${scale * (1 - 0.7 * collapse)})`;
      face.node.style.zIndex = String(Math.round(2000 - z));
      face.node.style.filter = `blur(${depthBlur.toFixed(1)}px) brightness(${(0.55 + 0.45 * scale).toFixed(2)})`;
      face.node.style.opacity = 1 - prog(T, 39.92, 40.0);
    });

    const flash = kick(T, 40.0, 4.5);
    s.bloom.style.opacity = T < 40.0 ? ep(T, 39.9, 40.0) * 0.95 : clamp(flash * 1.2) * 0.95;
    s.bloom.style.transform = `scale(${0.4 + 1.2 * (1 - flash)})`;
    s.lasers.style.opacity = T >= 40.0 ? 1.0 * kick(T, 40.0, 1.4) + 0.16 : 0;
    s.lasers.style.transform = `translateY(${ONCE.core[1] - 540}px) scale(${0.8 + 0.25 * prog(T, 40, 47)}) rotate(${(T - 40) * 3}deg)`;

    lettersIn(s.teachLetters, T, 39.78, { stagger: 0.025, duration: 0.35, distance: 60, blur: 22 });
    const onceIn = ep(T, 40.0, 40.3, ease.outExpo);
    s.once.style.opacity = onceIn;
    s.once.style.transform = `scale(${lerp(1.7, 1, onceIn)})`;
    s.once.style.filter = `blur(${(1 - onceIn) * 24}px)`;
    s.once.style.textShadow = glow('150,180,255', 0.8 + 2 * kick(T, 40.0, 2.5));
    s.headline.style.transform = `scale(${1 + 0.05 * kick(T, 40.0, 6)})`;

    let corePulse = 0;
    ONCE_CHIPS.forEach((_, index) => (corePulse += kick(T, 42.22 + index * 0.13 + 0.2, 6)));
    const coreAlive = T >= 40.0 && T < 43.85;
    s.core.style.opacity = coreAlive ? ep(T, 40.0, 40.4) * (1 - ep(T, 43.55, 43.85)) : 0;
    s.core.style.transform = `scale(${0.7 + 0.08 * Math.sin(T * 6) + 0.35 * clamp(corePulse) + 0.8 * ep(T, 43.5, 43.8)})`;

    s.chips.forEach((chip, index) => {
      const appear = ep(T, 40.79 + index * 0.08, 41.15 + index * 0.08);
      const absorbAt = 42.22 + index * 0.13;
      const absorb = ease.inExpo(prog(T, absorbAt, absorbAt + 0.22));
      const angle = (index / ONCE_CHIPS.length) * Math.PI * 2 + (T - 40.79) * 0.45;
      const x = ONCE.core[0] + Math.cos(angle) * 560 * (1 - absorb);
      const y = ONCE.core[1] + Math.sin(angle) * 190 * (1 - absorb);
      chip.style.display = appear > 0 && absorb < 1 ? 'flex' : 'none';
      chip.style.opacity = appear;
      chip.style.transform = `translate(${x - 150}px, ${y - 39}px) scale(${lerp(0.7, 1, appear) * (1 - 0.9 * absorb)})`;
      chip.style.filter = `blur(${(1 - appear) * 10 + absorb * 8}px)`;
    });

    const orbit = prog(T, 43.6, ONCE.cut);
    s.stack.style.transform = `rotateX(${lerp(60, 52, orbit)}deg) rotateZ(${lerp(-44, -26, ease.outCubic(orbit))}deg)`;
    s.slabs.forEach((slab, index) => {
      const rise = ep(T, 43.6 + index * 0.16, 44.15 + index * 0.16, ease.outBack);
      const visible = T >= 43.6 + index * 0.16;
      slab.style.display = visible ? 'block' : 'none';
      slab.style.transform = `translateZ(${(index - 2) * 92 * rise}px) scale(${lerp(0.2, 1, clamp(rise, 0, 1.2))})`;
      slab.style.opacity = clamp(rise * 1.5);
    });
    s.courseLabel.style.opacity = ep(T, 44.15, 44.6) * 0.8;

    const hostedIn = ep(T, 44.76, 45.4, ease.outExpo);
    s.hosted.style.opacity = hostedIn;
    s.hosted.style.filter = `blur(${(1 - hostedIn) * 18}px)`;
    s.hosted.style.transform = `translateY(${(1 - hostedIn) * 30}px)`;

    s.avatars.forEach((avatar, index) => {
      const start = 46.37 + index * 0.045;
      const arrived = updateTrail(avatar.trail, T, start, 0.42, { tail: 200, wireOpacity: 0.22 });
      const lit = arrived ? ep(T, start + 0.42, start + 0.6) : 0;
      const appear = ep(T, 46.1, 46.45);
      avatar.node.style.opacity = appear * (0.35 + 0.65 * lit);
      avatar.node.style.filter = `grayscale(${1 - lit}) brightness(${0.6 + 0.4 * lit})`;
      avatar.node.style.transform = `scale(${lerp(0.6, 1, appear) + 0.15 * (arrived ? kick(T, start + 0.42, 7) : 0)})`;
      avatar.node.style.boxShadow = `0 0 0 3px rgba(191,208,255,${0.9 * lit}), 0 0 ${50 * lit}px rgba(150,180,255,${0.7 * lit})`;
    });
  }
});

/* ===================== D. The certificate: issued → stamped → sent to your systems ===================== */

const CERT = { in: 60.45, cut: 70.167, w: 1000, h: 660 };
const CERT_SYSTEMS = [
  { logo: 'hubspot', name: 'HubSpot', color: '#FF7A59', glowRgb: '255,122,89', record: 'Contact · Ada Obi', detail: 'Lifecycle → Trained', y: 270 },
  { logo: 'googlesheets', name: 'Google Sheets', color: '#34A853', glowRgb: '52,168,83', record: 'Row 214 · Ada Obi', detail: 'Product 101', y: 520 },
  { logo: 'snowflake', name: 'Snowflake', color: '#29B5E8', glowRgb: '41,181,232', record: 'course_completions', detail: '+1 row', y: 770 }
];

function guillochePath(width, height, inset, band, waves, phase) {
  const points = [];
  const perimeter = 2 * (width + height - 4 * inset);
  for (let distance = 0; distance <= perimeter; distance += 3) {
    const along = distance;
    let x;
    let y;
    let normalX;
    let normalY;
    const innerW = width - 2 * inset;
    const innerH = height - 2 * inset;
    if (along < innerW) {
      x = inset + along;
      y = inset;
      normalX = 0;
      normalY = 1;
    } else if (along < innerW + innerH) {
      x = width - inset;
      y = inset + along - innerW;
      normalX = -1;
      normalY = 0;
    } else if (along < 2 * innerW + innerH) {
      x = width - inset - (along - innerW - innerH);
      y = height - inset;
      normalX = 0;
      normalY = -1;
    } else {
      x = inset;
      y = height - inset - (along - 2 * innerW - innerH);
      normalX = 1;
      normalY = 0;
    }
    const offset = band / 2 + (band / 2) * Math.sin((along / perimeter) * Math.PI * 2 * waves + phase);
    points.push(`${(x + normalX * offset).toFixed(1)},${(y + normalY * offset).toFixed(1)}`);
  }

  return `M${points.join(' L')}Z`;
}

function rosettePath(radius, petals, depth, phase) {
  const points = [];
  for (let step = 0; step <= 720; step += 1) {
    const angle = (step / 720) * Math.PI * 2;
    const r = radius - depth / 2 + (depth / 2) * Math.sin(petals * angle + phase);
    points.push(`${(r * Math.cos(angle)).toFixed(1)},${(r * Math.sin(angle)).toFixed(1)}`);
  }

  return `M${points.join(' L')}Z`;
}

const GRUNGE = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.6 2.05"/></filter><rect width="400" height="400" filter="url(#g)"/></svg>'
)}")`;

const PAPER = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><filter id="p"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" seed="9"/><feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.22  0 0 0 0.09 0"/></filter><rect width="300" height="300" filter="url(#p)"/></svg>'
)}")`;

scene({
  id: 'D-certificate-to-systems',
  in: CERT.in,
  out: CERT.cut + 0.3,
  build(root) {
    const handles = cinematicPanel(root, { background: 'radial-gradient(70% 70% at 42% 48%, #1E1710 0%, #0A0806 55%, #040306 100%)' });
    const content = handles.content;
    const dustBack = plate(content, asset('dust', 1), { width: 2300, height: 1300, opacity: 0.3 });
    dustBack.style.filter = 'blur(1.5px)';
    const warmKey = el('div', 'abs', content);
    css(warmKey, { left: '160px', top: '-120px', width: '1400px', height: '1200px', background: 'radial-gradient(closest-side, rgba(255,190,120,0.18), rgba(255,170,90,0) 100%)', mixBlendMode: 'screen' });

    const view = el('div', 'abs', content);
    css(view, { inset: 0, perspective: '1700px', perspectiveOrigin: '50% 48%' });
    const mover = el('div', 'd3', view);
    css(mover, { left: '960px', top: '520px' });
    const card = el('div', 'abs', mover);
    css(card, {
      left: -CERT.w / 2 + 'px',
      top: -CERT.h / 2 + 'px',
      width: CERT.w + 'px',
      height: CERT.h + 'px',
      borderRadius: '6px',
      backgroundColor: '#F5EFE2',
      backgroundImage: `${PAPER}, radial-gradient(120% 120% at 30% 20%, #FBF7EE 0%, #EFE6D3 100%)`,
      boxShadow: '0 60px 120px rgba(0,0,0,0.65), 0 10px 30px rgba(0,0,0,0.4)',
      overflow: 'hidden',
      color: '#1F1A14'
    });
    const border = [0, 1, 2, 3, 4, 5]
      .map((index) => `<path d="${guillochePath(CERT.w, CERT.h, 26, 26, 64, (index * Math.PI) / 3)}" fill="none" stroke="#3E5C6E" stroke-width="0.7" opacity="0.55"/>`)
      .join('');
    el('div', 'abs', card, `<svg width="${CERT.w}" height="${CERT.h}" style="position:absolute;inset:0">${border}<rect x="62" y="62" width="${CERT.w - 124}" height="${CERT.h - 124}" fill="none" stroke="#3E5C6E" stroke-width="1" opacity="0.4"/></svg>`).style.inset = '0';

    const body = el('div', 'abs', card);
    css(body, { left: '90px', right: '90px', top: '96px', textAlign: 'center' });
    el('div', '', body, 'CERTIFICATE OF COMPLETION').style.cssText = 'font-family:var(--mono);font-size:15px;letter-spacing:.42em;color:#3E5C6E';
    el('div', 'serif-i', body, 'This certifies that').style.cssText += ';font-size:30px;margin-top:34px;color:#5A5145';
    const nameRow = el('div', 'serif', body);
    css(nameRow, { fontSize: '128px', lineHeight: '1.05', marginTop: '6px', letterSpacing: '-0.01em' });
    const nameLetters = letters(nameRow, 'Ada Obi');
    const rule = el('div', '', body);
    css(rule, { height: '1px', background: '#3E5C6E', opacity: 0.45, margin: '10px auto 22px', width: '520px', transformOrigin: 'center' });
    el('div', '', body, 'has completed <b style="font-weight:650">Product 101: Onboarding</b>').style.cssText = 'font-size:24px;color:#3B342A';

    const footer = el('div', 'abs', card);
    css(footer, { left: '110px', right: '110px', bottom: '92px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' });
    el('div', '', footer, '<div style="font-family:var(--mono);font-size:12px;letter-spacing:.2em;color:#6B6152">ISSUED</div><div style="font-size:19px;margin-top:4px">25 Nov 2026</div>');
    el('div', '', footer, '<div class="serif-i" style="font-size:40px;line-height:1;color:#1F2E5C">M. Adeyemi</div><div style="height:1px;background:#3E5C6E;opacity:.5;margin:6px 0"></div><div style="font-family:var(--mono);font-size:12px;letter-spacing:.2em;color:#6B6152">CUSTOMER EDUCATION</div>');

    const seal = el('div', 'abs', card);
    css(seal, { left: CERT.w / 2 - 74 + 'px', bottom: '64px', width: '148px', height: '148px', borderRadius: '50%', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' });
    const foil = el('div', 'abs', seal);
    css(foil, { inset: '-30%', background: 'conic-gradient(from 0deg, #FFD6E8, #C8F1FF, #D9FFD6, #FFF3C4, #E6D2FF, #FFD6E8)' });
    const sealLines = [0, 1, 2].map((index) => `<path d="${rosettePath(64 - index * 14, 18, 10, index)}" fill="none" stroke="rgba(60,70,110,0.45)" stroke-width="0.8"/>`).join('');
    el('div', 'abs', seal, `<svg width="148" height="148" viewBox="-74 -74 148 148" style="position:absolute;inset:0">${sealLines}<text x="0" y="5" text-anchor="middle" font-family="Geist Mono" font-size="11" letter-spacing="2.5" fill="#2A3150">VERIFIED</text></svg>`).style.inset = '0';
    const sealSheen = el('div', 'abs', seal);
    css(sealSheen, { inset: 0, background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.85) 50%, transparent 70%)', mixBlendMode: 'soft-light' });

    const certId = el('div', 'abs', card, 'ID · CIO-7F3A-2291');
    css(certId, { right: '70px', top: '74px', fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '0.18em', color: '#6B6152' });

    const stamp = el('div', 'abs', card);
    css(stamp, { left: '700px', top: '140px', width: '270px', height: '270px', maskImage: GRUNGE, maskSize: '400px 400px', mixBlendMode: 'multiply' });
    stamp.innerHTML = `<svg width="270" height="270" viewBox="-135 -135 270 270">
      <defs><path id="stampArc" d="M -96 0 A 96 96 0 1 1 96 0 A 96 96 0 1 1 -96 0"/></defs>
      <circle r="128" fill="none" stroke="#C8371F" stroke-width="8"/>
      <circle r="76" fill="none" stroke="#C8371F" stroke-width="3"/>
      <text font-family="Geist Mono" font-size="19" letter-spacing="5" fill="#C8371F"><textPath href="#stampArc">PRODUCT 101 · SCORE 92% · PRODUCT 101 ·</textPath></text>
      <rect x="-122" y="-34" width="244" height="68" fill="#F5EFE2"/>
      <rect x="-122" y="-34" width="244" height="68" fill="none" stroke="#C8371F" stroke-width="5"/>
      <text y="17" text-anchor="middle" font-family="Geist" font-weight="800" font-size="50" letter-spacing="2" fill="#C8371F">PASSED</text>
    </svg>`;
    const splatter = el('div', 'abs', card);
    css(splatter, { left: '835px', top: '275px' });
    const random = seeded(17);
    const drops = Array.from({ length: 22 }, () => {
      const drop = el('div', 'abs', splatter);
      const size = 3 + random() * 9;
      const angle = random() * Math.PI * 2;
      const distance = 140 + random() * 70;
      css(drop, { width: size + 'px', height: size + 'px', borderRadius: '50%', background: '#C8371F', left: Math.cos(angle) * distance + 'px', top: Math.sin(angle) * distance + 'px', opacity: 0 });

      return drop;
    });
    const sheen = el('div', 'abs', card);
    css(sheen, { inset: 0, background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.75) 48%, rgba(255,240,210,0.3) 52%, transparent 62%)', mixBlendMode: 'soft-light', backgroundSize: '300% 100%' });
    const shockwave = el('div', 'abs', content);
    css(shockwave, { width: '300px', height: '300px', borderRadius: '50%', border: '3px solid rgba(255,220,200,0.8)', opacity: 0 });

    const svg = svgLayer(content, 'certGlow');
    const hub = { x: 1060, y: 520 };
    const hubNode = el('div', 'glass', content);
    css(hubNode, { left: hub.x - 90 + 'px', top: hub.y - 90 + 'px', width: '180px', height: '180px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' });
    hubNode.innerHTML = brandLogo('zapier', 84, '#FF4F00');
    const hubLabel = el('div', 'abs cine', content, 'ZAPIER · WEBHOOK');
    css(hubLabel, { left: hub.x - 150 + 'px', width: '300px', top: hub.y + 108 + 'px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '15px', letterSpacing: '0.24em', opacity: 0 });
    const eventChip = el('div', 'abs cine', content, '<span style="opacity:.6">POST</span>&nbsp; course.certificate.issued');
    css(eventChip, { fontFamily: 'var(--mono)', fontSize: '17px', letterSpacing: '0.04em', padding: '10px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.22)', whiteSpace: 'nowrap', opacity: 0 });
    const inbound = makeTrail(svg, `M ${712} ${520} C ${850} ${520}, ${880} ${520}, ${hub.x - 92} ${hub.y}`, '#FFE2C8', 'certGlow', 3.5);

    const systems = CERT_SYSTEMS.map((system) => {
      const node = el('div', 'glass cine', content);
      css(node, { left: '1360px', top: system.y - 92 + 'px', width: '460px', height: '184px', padding: '24px 28px' });
      const head = el('div', '', node);
      css(head, { display: 'flex', alignItems: 'center', gap: '14px' });
      el('div', '', head, brandLogo(system.logo, 38, system.color));
      el('div', '', head, system.name).style.cssText = 'font-size:26px;font-weight:650;letter-spacing:-.02em';
      const row = el('div', '', node);
      css(row, { marginTop: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' });
      const left = el('div', '', row, `<div style="font-size:21px;font-weight:550">${system.record}</div><div style="font-family:var(--mono);font-size:13px;letter-spacing:.12em;opacity:.6;margin-top:4px">${system.detail.toUpperCase()}</div>`);
      const status = el('div', '', row);
      css(status, { fontFamily: 'var(--mono)', fontSize: '14px', letterSpacing: '0.12em', padding: '8px 12px', borderRadius: '999px', whiteSpace: 'nowrap' });
      const d = `M ${hub.x + 92} ${hub.y} C ${hub.x + 200} ${hub.y}, ${1250} ${system.y}, ${1352} ${system.y}`;

      return { ...system, node, row, left, status, trail: makeTrail(svg, d, system.color, 'certGlow', 3.5) };
    });

    return { handles, dustBack, mover, card, nameLetters, rule, foil, sealSheen, stamp, drops, sheen, shockwave, hubNode, hubLabel, eventChip, inbound, systems };
  },
  update({ T, s }) {
    updateCinematic(s.handles, T, { start: CERT.in, cut: CERT.cut, inkDuration: 0 });

    s.dustBack.style.transform = `scale(${1.05 + 0.015 * (T - CERT.in)}) translate(${(T - CERT.in) * -6}px, ${(T - CERT.in) * -3}px)`;

    const arrive = spring(T, CERT.in + 0.05, 0.9, 4.2);
    const recede = ep(T, 63.35, 64.1, ease.inOutCubic);
    const impact = kick(T, 62.46, 9);
    const shakeX = 16 * impact * Math.sin(T * 95);
    const shakeY = 10 * impact * Math.cos(T * 80);
    const swayX = 5 * Math.sin((T - CERT.in) * 0.9) + 8 * impact;
    const swayY = lerp(-55, -12, arrive) + 7 * Math.sin((T - CERT.in) * 0.7) + 16 * recede;
    const depth = lerp(-2600, 0, arrive) - 160 * impact;
    const x = -560 * recede + shakeX;
    const scale = lerp(1, 0.6, recede);
    s.mover.style.transform = `translate3d(${x}px, ${shakeY}px, ${depth}px) scale(${scale}) rotateX(${swayX}deg) rotateY(${swayY}deg)`;

    lettersIn(s.nameLetters, T, 60.82, { stagger: 0.05, duration: 0.5, distance: 24, blur: 12 });
    s.rule.style.transform = `scaleX(${ep(T, 61.1, 61.6)})`;
    s.foil.style.transform = `rotate(${swayY * 6 + (T - CERT.in) * 30}deg)`;
    s.sealSheen.style.transform = `translateX(${Math.sin((T - CERT.in) * 1.4) * 60}px)`;
    s.sheen.style.backgroundPosition = `${lerp(110, -10, ep(T, 61.0, 61.8, ease.inOutCubic))}% 0`;
    s.sheen.style.opacity = T > 60.95 && T < 61.9 ? 1 : 0.25;

    const stampDrop = ease.inExpo(prog(T, 62.26, 62.46));
    s.stamp.style.opacity = T >= 62.26 ? clamp(stampDrop * 3) * 0.92 : 0;
    s.stamp.style.transform = `rotate(-14deg) scale(${T < 62.46 ? lerp(3.2, 1, stampDrop) : 1 + 0.06 * impact})`;
    s.stamp.style.filter = `blur(${T < 62.46 ? (1 - stampDrop) * 8 : 0}px)`;
    s.drops.forEach((drop, index) => {
      const amount = T >= 62.46 ? ep(T, 62.46, 62.46 + 0.08 + (index % 5) * 0.02, ease.outExpo) : 0;
      drop.style.opacity = amount * 0.85;
      drop.style.transform = `scale(${amount})`;
    });
    const ring = prog(T, 62.46, 63.0);
    s.shockwave.style.left = 960 - CERT.w / 2 + 835 - 150 + 'px';
    s.shockwave.style.top = 520 - CERT.h / 2 + 275 - 150 + 'px';
    s.shockwave.style.opacity = T >= 62.46 ? (1 - ring) * 0.9 : 0;
    s.shockwave.style.transform = `scale(${0.6 + ease.outCubic(ring) * 1.8})`;

    const hubIn = ep(T, 63.7, 64.1, ease.outBack);
    s.hubNode.style.opacity = clamp(hubIn);
    s.hubNode.style.transform = `scale(${lerp(0.5, 1, clamp(hubIn, 0, 1.2)) + 0.12 * kick(T, 64.65, 7)})`;
    s.hubNode.style.boxShadow = `0 30px 80px rgba(0,0,0,0.5), 0 0 ${80 * kick(T, 64.65, 3)}px rgba(255,79,0,0.8), inset 0 1px 0 rgba(255,255,255,0.25)`;
    s.hubLabel.style.opacity = ep(T, 64.0, 64.4) * 0.75;

    updateTrail(s.inbound, T, 64.06, 0.6, { tail: 160, wireOpacity: 0.4, linger: 0.5 });
    const chipIn = ep(T, 63.75, 64.1);
    s.eventChip.style.opacity = chipIn * (1 - ep(T, 66.2, 66.6));
    s.eventChip.style.left = 730 + 'px';
    s.eventChip.style.top = 430 + (1 - chipIn) * 20 + 'px';

    s.systems.forEach((system, index) => {
      const appear = ep(T, 65.66 + index * 0.14, 66.1 + index * 0.14, ease.outCubic);
      system.node.style.opacity = appear;
      system.node.style.transform = `translateX(${(1 - appear) * 80}px)`;
      system.node.style.filter = `blur(${(1 - appear) * 12}px)`;
      const start = 66.54 + index * 0.16;
      const arrived = updateTrail(system.trail, T, start, 0.5, { tail: 200, wireOpacity: 0.5, linger: 0.6 });
      const landed = arrived ? kick(T, start + 0.5, 3.5) : 0;
      system.node.style.boxShadow = `0 30px 80px rgba(0,0,0,0.5), 0 0 ${90 * landed}px rgba(${system.glowRgb},0.85), inset 0 1px 0 rgba(255,255,255,0.25)`;
      system.row.style.opacity = arrived ? ep(T, start + 0.5, start + 0.75) : 0;
      const done = T >= 68.96 + index * 0.12;
      const doneKick = done ? kick(T, 68.96 + index * 0.12, 6) : 0;
      system.status.innerHTML = done ? '✓ COMPLETED' : 'SYNCED';
      system.status.style.background = done ? system.color : 'rgba(255,255,255,0.1)';
      system.status.style.color = done ? '#0B0B0B' : '#F2EEE6';
      system.status.style.transform = `scale(${1 + 0.25 * doneKick})`;
      system.status.style.boxShadow = done ? `0 0 ${30 + 40 * doneKick}px rgba(${system.glowRgb},0.7)` : 'none';
    });
  }
});
