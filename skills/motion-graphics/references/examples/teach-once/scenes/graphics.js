/* Story graphics on the wall behind her, in the ClassroomIO block language of the outro.
 * Behind layer only: the person matte cuts every scene here, so her head and hands stay in front.
 * Times are seconds on the cut master. Scenes that end on a jump cut end exactly on it, with no fade. */

const PAPER = '#FDFBF7';
const SAND = '#E3DACA';
const TINT = '#D6DEFF';
const BRAND_BLUE = '#0233BD';
const SKY = '#ADC3FF';
const MUTED = '#6B6152';
const CARD_SHADOW = '0 22px 48px rgba(23,20,15,0.22), 0 3px 8px rgba(23,20,15,0.14)';
const NOTCH_SCALE = 1.4;
const NOTCH_LEFT = 30;
const BLOCK_TONES = {
  sand: { fill: SAND, kind: BRAND_BLUE, title: INK },
  tint: { fill: TINT, kind: BRAND_BLUE, title: INK },
  blue: { fill: BRAND_BLUE, kind: SKY, title: '#FFFFFF' }
};

let maskCount = 0;

/** A ClassroomIO block whose notch is a real cut-out, so the footage shows through it. */
function brandBlock(parent, { kind, title, tone = 'sand', width = 400, height = 96, tab = false }) {
  const colours = BLOCK_TONES[tone];
  const maskId = `notch-${(maskCount += 1)}`;
  const tabPath = tab
    ? `<path transform="translate(${NOTCH_LEFT - 0.6 * NOTCH_SCALE} ${height - 1}) scale(${NOTCH_SCALE})" d="${TAB_D}" fill="${colours.fill}"/>`
    : '';
  const svg = `<svg width="${width}" height="${height + 18}" style="position:absolute;left:0;top:0;overflow:visible">
    <defs><mask id="${maskId}"><rect width="${width}" height="${height}" fill="#fff"/>
    <path transform="translate(${NOTCH_LEFT} -0.5) scale(${NOTCH_SCALE})" d="${NOTCH_D}" fill="#000"/></mask></defs>
    <rect width="${width}" height="${height}" rx="10" fill="${colours.fill}" mask="url(#${maskId})"/>${tabPath}</svg>`;
  const block = el('div', 'abs', parent, svg);
  css(block, { width: width + 'px', height: height + 'px', filter: 'drop-shadow(0 14px 26px rgba(23,20,15,0.2))' });
  const label = el('div', 'abs', block, kind);
  css(label, { left: '22px', top: '26px', fontFamily: 'Geist Mono, monospace', fontSize: '14px', letterSpacing: '0.14em', color: colours.kind });
  const name = el('div', 'abs', block, title);
  css(name, { left: '22px', top: '48px', fontSize: '26px', fontWeight: 600, letterSpacing: '-0.015em', color: colours.title });

  return block;
}

function card(parent, { left, top, width, height }) {
  const node = el('div', 'abs', parent);
  css(node, {
    left: left + 'px',
    top: top + 'px',
    width: width + 'px',
    height: height ? height + 'px' : undefined,
    background: PAPER,
    borderRadius: '16px',
    boxShadow: CARD_SHADOW,
    color: INK
  });

  return node;
}

function monoLabel(parent, text, styles = {}) {
  const node = el('div', 'abs', parent, text);
  css(node, { fontFamily: 'Geist Mono, monospace', fontSize: '14px', letterSpacing: '0.16em', textTransform: 'uppercase', color: MUTED, ...styles });

  return node;
}

/** Drop-in used by every card: rises 26px, scales up from 0.94, with a spring settle. */
function popIn(node, T, start, { distance = 26, from = 0.94 } = {}) {
  const enter = ep(T, start, start + 0.38, ease.outCubic);
  const settle = spring(T, start, 2.4, 8);
  node.style.opacity = String(prog(T, start, start + 0.16));
  node.style.transform = `translateY(${distance * (1 - enter)}px) scale(${lerp(from, 1, settle)})`;
}

function tickIcon(parent, size) {
  const holder = el('div', 'abs', parent, `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="${BRAND_BLUE}"/><path d="M7 12.5l3.2 3.2L17 9" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`);

  return holder;
}

if (LAYER !== 'front') {
  /* A — "keep explaining the same product features to different customers?": the same question keeps arriving. */
  const QUESTIONS = [
    { at: 2.0, company: 'Acme', person: 'Dana', seed: 1 },
    { at: 2.62, company: 'Northwind', person: 'Femi', seed: 2 },
    { at: 3.2, company: 'Brightpath', person: 'Lena', seed: 3 },
    { at: 3.92, company: 'Kestrel', person: 'Tobi', seed: 4 },
    { at: 4.4, company: 'Halcyon', person: 'Maya', seed: 5 }
  ];
  const INBOX = { left: 1180, top: 210, width: 560, rowHeight: 104 };

  scene({
    id: 'A-same-question',
    in: 1.9,
    out: 5.0,
    behind: [1.9, 5.0],
    build(root) {
      const label = monoLabel(root, 'Support inbox', { left: INBOX.left + 4 + 'px', top: INBOX.top - 40 + 'px' });
      const count = el('div', 'abs', root);
      css(count, {
        left: INBOX.left + INBOX.width - 120 + 'px',
        top: INBOX.top - 52 + 'px',
        width: '120px',
        textAlign: 'right',
        fontFamily: 'Geist Mono, monospace',
        fontSize: '24px',
        fontWeight: 600,
        letterSpacing: '0.04em',
        color: BRAND_BLUE
      });
      const rows = QUESTIONS.map((question) => {
        const row = card(root, { left: INBOX.left, top: INBOX.top, width: INBOX.width, height: 88 });
        const avatar = makeAvatar(row, 52, question.seed);
        css(avatar, { left: '20px', top: '18px' });
        const who = el('div', 'abs', row, `${question.person} <span style="color:${MUTED};font-weight:500">· ${question.company}</span>`);
        css(who, { left: '90px', top: '17px', fontSize: '19px', fontWeight: 600 });
        const text = el('div', 'abs', row, 'How do I add a new user?');
        css(text, { left: '90px', top: '46px', fontSize: '22px', fontWeight: 500, letterSpacing: '-0.01em' });
        const dot = el('div', 'abs', row);
        css(dot, { right: '24px', top: '24px', width: '10px', height: '10px', borderRadius: '50%', background: BRAND_BLUE });

        return row;
      });

      return { label, count, rows };
    },
    update({ T, s }) {
      s.label.style.opacity = String(prog(T, 1.95, 2.2));
      const arrived = QUESTIONS.filter((question) => T >= question.at).length;
      s.count.textContent = arrived > 1 ? `×${arrived}` : '';
      s.count.style.opacity = String(prog(T, 2.6, 2.75));
      s.rows.forEach((row, index) => {
        const question = QUESTIONS[index];
        const newer = QUESTIONS.filter((other, otherIndex) => otherIndex > index && T >= other.at).map((other) => ep(T, other.at, other.at + 0.34, ease.outCubic));
        const depth = newer.reduce((sum, amount) => sum + amount, 0);
        popIn(row, T, question.at, { distance: -22 });
        const shift = depth * INBOX.rowHeight;
        const fadeDepth = clamp(depth - 2.6, 0, 1);
        row.style.transform += ` translateY(${shift}px)`;
        row.style.opacity = String(prog(T, question.at, question.at + 0.16) * (1 - fadeDepth));
        row.style.zIndex = String(10 + index);
      });
    }
  });

  /* B — "every new customer needs to learn how your product works": the week fills up with onboarding calls. */
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const CALLS = [
    { day: 0, at: 5.58, who: 'Acme' },
    { day: 1, at: 5.98, who: 'Northwind' },
    { day: 2, at: 6.36, who: 'Brightpath' },
    { day: 3, at: 6.72, who: 'Kestrel' },
    { day: 4, at: 7.14, who: 'Halcyon' },
    { day: 1, at: 7.52, who: 'Juniper', late: true },
    { day: 3, at: 7.74, who: 'Oakline', late: true }
  ];
  const WEEK = { left: 1110, top: 190, width: 740, height: 430 };

  scene({
    id: 'B-onboarding-week',
    in: 5.12,
    out: 8.033,
    behind: [5.12, 8.033],
    build(root) {
      const sheet = card(root, WEEK);
      const title = el('div', 'abs', sheet, 'This week');
      css(title, { left: '28px', top: '24px', fontSize: '26px', fontWeight: 650, letterSpacing: '-0.02em' });
      const columnWidth = (WEEK.width - 56) / 5;
      DAYS.forEach((day, index) => {
        const head = monoLabel(sheet, day, { left: 28 + index * columnWidth + 'px', top: '78px', fontSize: '13px' });
        head.style.color = MUTED;
        const rule = el('div', 'abs', sheet);
        css(rule, { left: 28 + index * columnWidth + 'px', top: '104px', width: columnWidth - 10 + 'px', height: '2px', background: '#EAE4D8' });
      });
      const calls = CALLS.map((call) => {
        const slot = el('div', 'abs', sheet);
        const top = call.late ? 262 : 122;
        css(slot, {
          left: 28 + call.day * columnWidth + 'px',
          top: top + 'px',
          width: columnWidth - 10 + 'px',
          height: '124px',
          borderRadius: '10px',
          background: call.late ? SAND : TINT,
          borderLeft: `4px solid ${BRAND_BLUE}`,
          padding: '12px 12px',
          boxSizing: 'border-box',
          transformOrigin: '50% 0'
        });
        const what = el('div', '', slot, 'Onboarding call');
        css(what, { fontSize: '16px', fontWeight: 600, lineHeight: '1.15', letterSpacing: '-0.01em' });
        const who = el('div', '', slot, call.who);
        css(who, { marginTop: '6px', fontSize: '14px', color: MUTED });
        const time = el('div', '', slot, call.late ? '3:00 pm' : '10:00 am');
        css(time, { marginTop: '18px', fontFamily: 'Geist Mono, monospace', fontSize: '12px', letterSpacing: '0.06em', color: BRAND_BLUE });

        return slot;
      });

      return { sheet, calls };
    },
    update({ T, s }) {
      popIn(s.sheet, T, 5.12);
      s.calls.forEach((slot, index) => {
        const call = CALLS[index];
        const grow = ep(T, call.at, call.at + 0.26, ease.outBack);
        slot.style.opacity = String(prog(T, call.at, call.at + 0.1));
        slot.style.transform = `scaleY(${lerp(0.4, 1, grow)})`;
      });
    }
  });

  /* D — "not repeating the same onboarding process every new week": the checklist completes, rewinds, and the week number climbs. */
  const STEPS = ['Create the account', 'Invite the team', 'Walk through setup', 'Answer the same questions'];
  const ROUNDS = [
    { week: 12, from: 14.3, ticks: [14.42, 14.62, 14.82, 15.02], rewind: [15.32, 15.6] },
    { week: 13, from: 15.6, ticks: [15.7, 15.82, 15.94, 16.06], rewind: [16.12, 16.34] },
    { week: 14, from: 16.34, ticks: [16.42, 16.52, 16.62, 16.72], rewind: null }
  ];
  const CHECKLIST = { left: 1150, top: 230, width: 600 };

  scene({
    id: 'D-onboarding-loop',
    in: 14.26,
    out: 16.833,
    behind: [14.26, 16.833],
    build(root) {
      const sheet = card(root, { ...CHECKLIST, height: 404 });
      const label = monoLabel(sheet, 'Customer onboarding', { left: '30px', top: '28px' });
      const week = el('div', 'abs', sheet);
      css(week, { right: '30px', top: '20px', height: '30px', overflow: 'hidden', width: '150px', textAlign: 'right' });
      const weekRoll = el('div', 'abs', week);
      css(weekRoll, { right: '0', top: '0', width: '150px' });
      ROUNDS.forEach((round) => {
        const line = el('div', '', weekRoll, `Week ${round.week}`);
        css(line, { height: '30px', lineHeight: '30px', fontSize: '22px', fontWeight: 650, color: BRAND_BLUE, letterSpacing: '-0.01em' });
      });
      const rows = STEPS.map((text, index) => {
        const row = el('div', 'abs', sheet);
        css(row, { left: '30px', top: 84 + index * 74 + 'px', width: CHECKLIST.width - 60 + 'px', height: '58px' });
        const box = el('div', 'abs', row);
        css(box, { left: '0', top: '13px', width: '30px', height: '30px', borderRadius: '50%', border: '2px solid #CFC5B3', boxSizing: 'border-box' });
        const tick = tickIcon(row, 32);
        css(tick, { left: '-1px', top: '12px' });
        const words = el('div', 'abs', row, text);
        css(words, { left: '50px', top: '14px', fontSize: '24px', fontWeight: 500, letterSpacing: '-0.01em' });
        const strike = el('div', 'abs', row);
        css(strike, { left: '48px', top: '30px', height: '2px', background: INK, transformOrigin: '0 50%' });
        strike.style.width = Math.round(text.length * 11.4) + 'px';
        if (index < STEPS.length - 1) {
          const rule = el('div', 'abs', row);
          css(rule, { left: '50px', bottom: '-8px', right: '0', height: '1px', background: '#EAE4D8' });
        }

        return { tick, words, strike };
      });
      const rewindIcon = el('div', 'abs', sheet, `<svg width="44" height="44" viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.6h4.6" stroke="${BRAND_BLUE}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
      css(rewindIcon, { left: CHECKLIST.width / 2 - 22 + 'px', top: '200px' });

      return { sheet, weekRoll, rows, rewindIcon };
    },
    update({ T, s }) {
      popIn(s.sheet, T, 14.26);
      const roundIndex = ROUNDS.reduce((found, round, index) => (T >= round.from ? index : found), 0);
      const round = ROUNDS[roundIndex];
      const roll = ROUNDS.reduce((sum, item, index) => sum + (index > 0 ? ep(T, item.from - 0.06, item.from + 0.16, ease.outBack) : 0), 0);
      s.weekRoll.style.transform = `translateY(${-30 * roll}px)`;
      const rewinding = round.rewind ? prog(T, round.rewind[0], round.rewind[1]) : 0;
      s.rows.forEach((row, index) => {
        const done = ep(T, round.ticks[index], round.ticks[index] + 0.12, ease.outBack);
        const undoStart = round.rewind ? lerp(round.rewind[0], round.rewind[1], (STEPS.length - 1 - index) / STEPS.length) : Infinity;
        const undo = round.rewind ? prog(T, undoStart, undoStart + 0.08) : 0;
        const amount = done * (1 - undo);
        row.tick.style.opacity = String(clamp(amount * 1.4));
        row.tick.style.transform = `scale(${lerp(0.4, 1, amount)})`;
        row.strike.style.transform = `scaleX(${amount})`;
        row.words.style.color = amount > 0.5 ? MUTED : INK;
      });
      const spin = round.rewind ? ep(T, round.rewind[0] - 0.04, round.rewind[1], ease.inOutCubic) : 0;
      const iconAlpha = round.rewind ? Math.sin(Math.PI * prog(T, round.rewind[0] - 0.04, round.rewind[1])) : 0;
      s.rewindIcon.style.opacity = String(iconAlpha);
      s.rewindIcon.style.transform = `rotate(${-360 * spin}deg) scale(${lerp(0.8, 1.15, iconAlpha)})`;
      s.sheet.style.filter = `blur(${2.2 * iconAlpha}px)`;
    }
  });

  /* E — "So how do we break that circle?": a loop circles behind her head and snaps open on "break". */
  const LOOP = { x: 836, y: 392, radius: 318, breakAt: 17.6 };

  scene({
    id: 'E-break-the-loop',
    in: 16.95,
    out: 18.567,
    behind: [16.95, 18.567],
    build(root) {
      const svg = el('div', 'abs', root, `<svg width="1920" height="1080" viewBox="0 0 1920 1080" style="overflow:visible">
        <g class="spin"><path class="arc-a" fill="none" stroke="${BRAND_BLUE}" stroke-width="16" stroke-linecap="round"/>
        <path class="arc-b" fill="none" stroke="${BRAND_BLUE}" stroke-width="16" stroke-linecap="round"/>
        <path class="head" fill="${BRAND_BLUE}" d="M0 -26 L30 0 L0 26 Z"/></g></svg>`);
      css(svg, { left: '0', top: '0' });

      return { svg, spin: svg.querySelector('.spin'), arcA: svg.querySelector('.arc-a'), arcB: svg.querySelector('.arc-b'), head: svg.querySelector('.head') };
    },
    update({ T, s }) {
      const draw = ep(T, 16.95, 17.45, ease.outCubic);
      const broken = ep(T, LOOP.breakAt, LOOP.breakAt + 0.5, ease.outCubic);
      const snap = kick(T, LOOP.breakAt, 10);
      const leave = ep(T, 18.15, 18.5, ease.inCubic);
      const rotation = -90 + 260 * (T - 16.95) * (1 - 0.7 * broken);
      const sweep = 330 * draw;
      const gap = 40 * broken;
      const arcPoint = (angle, radius) => {
        const radians = (angle * Math.PI) / 180;
        return [LOOP.x + radius * Math.cos(radians), LOOP.y + radius * Math.sin(radians)];
      };
      const arc = (from, to, radius) => {
        const [x1, y1] = arcPoint(from, radius);
        const [x2, y2] = arcPoint(to, radius);
        const large = Math.abs(to - from) > 180 ? 1 : 0;
        return `M${x1} ${y1} A${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
      };
      const radius = LOOP.radius * (1 + 0.06 * broken);
      const middle = sweep / 2;
      s.arcA.setAttribute('d', arc(0, Math.max(middle - gap, 0.1), radius - 10 * broken));
      s.arcB.setAttribute('d', arc(Math.min(middle + gap, sweep - 0.1), sweep, radius + 10 * broken));
      const [headX, headY] = arcPoint(sweep, radius + 10 * broken);
      s.head.setAttribute('transform', `translate(${headX} ${headY}) rotate(${sweep + 90})`);
      s.head.style.opacity = String(prog(T, 17.0, 17.1));
      s.spin.setAttribute('transform', `rotate(${rotation} ${LOOP.x} ${LOOP.y})`);
      s.svg.style.opacity = String(0.92 * (1 - leave));
      s.svg.style.transform = `scale(${1 + 0.05 * snap})`;
      s.svg.style.transformOrigin = `${LOOP.x}px ${LOOP.y}px`;
      s.svg.style.filter = `blur(${6 * leave}px)`;
    }
  });

  /* F — "turn your team's knowledge into structured customer training … whenever they need it". */
  const DOCS = [
    { name: 'Setup guide.pdf', icon: 'PDF', x: 1150, y: 230, rotate: -4, at: 19.36 },
    { name: 'Product tour.mp4', icon: 'MP4', x: 1420, y: 330, rotate: 3, at: 19.62 },
    { name: 'FAQ notes.doc', icon: 'DOC', x: 1200, y: 450, rotate: -2, at: 19.88 }
  ];
  const STACK = { left: 1230, bottom: 660, width: 420, height: 96, gap: 10 };
  const COURSE = [
    { kind: 'LESSON', title: 'Getting started', tone: 'sand', at: 20.6 },
    { kind: 'QUIZ', title: 'Setup check', tone: 'tint', at: 20.86 },
    { kind: 'CERTIFICATE', title: 'Certified', tone: 'blue', at: 21.12 }
  ];

  scene({
    id: 'F-knowledge-to-training',
    in: 19.3,
    out: 22.14,
    behind: [19.3, 22.14],
    build(root) {
      const docs = DOCS.map((doc) => {
        const chip = card(root, { left: doc.x, top: doc.y, width: 320, height: 76 });
        const badge = el('div', 'abs', chip, doc.icon);
        css(badge, {
          left: '16px',
          top: '16px',
          width: '44px',
          height: '44px',
          borderRadius: '10px',
          background: TINT,
          color: BRAND_BLUE,
          fontFamily: 'Geist Mono, monospace',
          fontSize: '12px',
          letterSpacing: '0.06em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        });
        const name = el('div', 'abs', chip, doc.name);
        css(name, { left: '76px', top: '24px', fontSize: '21px', fontWeight: 550, letterSpacing: '-0.01em' });

        return chip;
      });
      const label = monoLabel(root, 'Customer training', { left: STACK.left + 4 + 'px', top: STACK.bottom - 3 * STACK.height - 2 * STACK.gap - 48 + 'px' });
      const blocks = COURSE.map((item, index) => {
        const block = brandBlock(root, { ...item, width: STACK.width, height: STACK.height, tab: index > 0 });
        const top = STACK.bottom - (index + 1) * STACK.height - index * STACK.gap;
        css(block, { left: STACK.left + 'px', top: top + 'px' });

        return block;
      });
      return { docs, label, blocks };
    },
    update({ T, s }) {
      const leave = ep(T, 21.86, 22.12, ease.inCubic);
      s.docs.forEach((chip, index) => {
        const doc = DOCS[index];
        popIn(chip, T, doc.at);
        const target = s.blocks[index];
        const gather = ep(T, 20.4 + index * 0.08, 20.75 + index * 0.08, ease.inOutCubic);
        const dx = (parseFloat(target.style.left) - doc.x) * gather;
        const dy = (parseFloat(target.style.top) - doc.y) * gather;
        const drift = Math.sin((T - doc.at) * 1.6 + index) * 5 * (1 - gather);
        chip.style.transform += ` translate(${dx}px, ${dy + drift}px) rotate(${doc.rotate * (1 - gather)}deg) scale(${lerp(1, 0.82, gather)})`;
        chip.style.opacity = String(prog(T, doc.at, doc.at + 0.16) * (1 - prog(T, 20.62 + index * 0.08, 20.8 + index * 0.08)));
      });
      s.blocks.forEach((block, index) => {
        const item = COURSE[index];
        const drop = ep(T, item.at, item.at + 0.34, ease.outCubic);
        const settle = spring(T, item.at + 0.2, 3, 9);
        block.style.opacity = String(prog(T, item.at, item.at + 0.12) * (1 - leave));
        block.style.transform = `translateY(${-70 * (1 - drop) - 8 * (1 - settle) * drop}px) scale(${1 - 0.08 * leave})`;
      });
      s.label.style.opacity = String(prog(T, 21.46, 21.7) * (1 - leave));
    }
  });

  /* F2 — "that people can access whenever they need it": the course in ClassroomIO; the learner marks the lesson
   * complete on "access" and moves to the next lesson on "need it". Labels match the product's lesson page. */
  const LESSONS = ['Getting started', 'Invite your team', 'Setup check', 'Your certificate'];
  const LESSON_KINDS = ['Lesson', 'Lesson', 'Quiz', 'Certificate'];
  const APP = { left: 1080, top: 150, width: 800, height: 500, sidebar: 250 };
  const COMPLETE_CLICK = 22.92;
  const NEXT_CLICK = 23.8;

  scene({
    id: 'F2-course-ui',
    in: 21.86,
    out: 24.44,
    behind: [21.86, 24.44],
    build(root) {
      const app = card(root, { left: APP.left, top: APP.top, width: APP.width, height: APP.height });
      css(app, { overflow: 'hidden', background: '#FFFFFF' });
      const bar = el('div', 'abs', app);
      css(bar, { left: '0', top: '0', right: '0', height: '40px', background: '#F4F1EA', borderBottom: '1px solid #E7E1D5' });
      ['#E3DACA', '#E3DACA', '#E3DACA'].forEach((colour, index) => {
        const dot = el('div', 'abs', bar);
        css(dot, { left: 16 + index * 18 + 'px', top: '14px', width: '11px', height: '11px', borderRadius: '50%', background: colour });
      });
      const address = el('div', 'abs', bar, 'acme.classroomio.com');
      css(address, { left: '50%', top: '9px', transform: 'translateX(-50%)', padding: '3px 18px', borderRadius: '6px', background: '#FFFFFF', fontFamily: 'Geist Mono, monospace', fontSize: '12px', color: MUTED });

      const side = el('div', 'abs', app);
      css(side, { left: '0', top: '40px', bottom: '0', width: APP.sidebar + 'px', background: '#FAF8F3', borderRight: '1px solid #ECE6DA' });
      const brand = el('div', 'abs', side);
      css(brand, { left: '20px', top: '18px', display: 'flex', alignItems: 'center', gap: '10px' });
      logoMark(brand, 20, BRAND_BLUE).style.position = 'relative';
      const course = el('div', '', brand, 'Acme Onboarding');
      css(course, { fontSize: '15px', fontWeight: 650, letterSpacing: '-0.01em' });
      const progressLabel = el('div', 'abs', side);
      css(progressLabel, { left: '20px', top: '58px', fontSize: '12px', color: MUTED });
      const track = el('div', 'abs', side);
      css(track, { left: '20px', top: '80px', width: APP.sidebar - 40 + 'px', height: '6px', borderRadius: '3px', background: '#ECE6DA' });
      const fill = el('div', 'abs', track);
      css(fill, { left: '0', top: '0', height: '6px', borderRadius: '3px', background: BRAND_BLUE, width: '0px' });
      const items = LESSONS.map((title, index) => {
        const row = el('div', 'abs', side);
        css(row, { left: '10px', top: 104 + index * 56 + 'px', width: APP.sidebar - 20 + 'px', height: '48px', borderRadius: '8px' });
        const ring = el('div', 'abs', row);
        css(ring, { left: '12px', top: '14px', width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #CFC5B3', boxSizing: 'border-box' });
        const tick = tickIcon(row, 22);
        css(tick, { left: '11px', top: '13px', opacity: '0' });
        const kind = el('div', 'abs', row, LESSON_KINDS[index]);
        css(kind, { left: '44px', top: '6px', fontFamily: 'Geist Mono, monospace', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: BRAND_BLUE });
        const name = el('div', 'abs', row, title);
        css(name, { left: '44px', top: '22px', fontSize: '15px', fontWeight: 550, whiteSpace: 'nowrap' });

        return { row, tick };
      });

      const main = el('div', 'abs', app);
      css(main, { left: APP.sidebar + 'px', top: '40px', right: '0', bottom: '0', overflow: 'hidden' });
      const pages = [0, 1].map((lessonIndex) => {
        const page = el('div', 'abs', main);
        css(page, { left: '0', top: '0', width: APP.width - APP.sidebar + 'px', height: APP.height - 40 + 'px' });
        const kind = monoLabel(page, `${LESSON_KINDS[lessonIndex]} ${lessonIndex + 1} of 4`, { left: '32px', top: '26px', fontSize: '12px', color: BRAND_BLUE });
        const title = el('div', 'abs', page, LESSONS[lessonIndex]);
        css(title, { left: '32px', top: '48px', fontSize: '30px', fontWeight: 700, letterSpacing: '-0.025em' });
        const video = el('div', 'abs', page);
        css(video, { left: '32px', top: '100px', width: APP.width - APP.sidebar - 64 + 'px', height: '190px', borderRadius: '12px', background: lessonIndex ? '#DCE4FF' : '#E9E1D2' });
        const play = el('div', 'abs', video, `<svg width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="28" r="28" fill="#FFFFFF"/><path d="M23 19l15 9-15 9z" fill="${BRAND_BLUE}"/></svg>`);
        css(play, { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' });
        [0.92, 0.78].forEach((width, line) => {
          const text = el('div', 'abs', page);
          css(text, { left: '32px', top: 310 + line * 22 + 'px', width: (APP.width - APP.sidebar - 64) * width + 'px', height: '10px', borderRadius: '5px', background: '#EFEAE0' });
        });

        return page;
      });

      const footer = el('div', 'abs', main);
      css(footer, { left: '0', right: '0', bottom: '0', height: '72px', borderTop: '1px solid #ECE6DA', background: '#FFFFFF' });
      const prev = el('div', 'abs', footer, '← Prev');
      css(prev, { left: '32px', top: '24px', fontSize: '15px', fontWeight: 550, color: MUTED });
      const complete = el('div', 'abs', footer);
      css(complete, { right: '150px', top: '16px', height: '40px', padding: '0 18px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 600, border: `1.5px solid ${BRAND_BLUE}`, color: BRAND_BLUE, background: '#FFFFFF', whiteSpace: 'nowrap', boxSizing: 'border-box' });
      const completeLabel = el('span', '', complete, 'Mark as Complete');
      const next = el('div', 'abs', footer, 'Next →');
      css(next, { right: '32px', top: '16px', height: '40px', padding: '0 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', fontSize: '15px', fontWeight: 600, color: '#FFFFFF', background: BRAND_BLUE, boxSizing: 'border-box' });

      const cursor = el('div', 'abs', root, `<svg width="30" height="38" viewBox="0 0 30 38"><path d="M2 2l0 30 8-7 5 11 6-3-5-10 11-1z" fill="${INK}" stroke="#FFFFFF" stroke-width="2.5" stroke-linejoin="round"/></svg>`);
      const ripple = el('div', 'abs', root);
      css(ripple, { width: '60px', height: '60px', borderRadius: '50%', border: `3px solid ${BRAND_BLUE}`, boxSizing: 'border-box' });

      const pill = el('div', 'abs', root, `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#2FB36B;margin-right:12px;vertical-align:1px"></span>Available 24/7`);
      css(pill, {
        left: APP.left + APP.width - 250 + 'px',
        top: APP.top + APP.height + 26 + 'px',
        padding: '14px 24px',
        borderRadius: '999px',
        background: PAPER,
        boxShadow: CARD_SHADOW,
        fontFamily: 'Geist Mono, monospace',
        fontSize: '17px',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: INK,
        whiteSpace: 'nowrap'
      });

      return { app, progressLabel, fill, items, pages, complete, completeLabel, next, cursor, ripple, pill };
    },
    update({ T, s }) {
      const leave = ep(T, 24.2, 24.44, ease.inCubic);
      popIn(s.app, T, 21.86, { distance: 30, from: 0.92 });
      s.app.style.opacity = String(prog(T, 21.86, 22.04) * (1 - leave));

      const completed = T >= COMPLETE_CLICK ? 1 : 0;
      const grow = ep(T, COMPLETE_CLICK + 0.05, COMPLETE_CLICK + 0.45, ease.outCubic);
      s.progressLabel.textContent = `Your progress · ${completed} of 4 completed`;
      s.fill.style.width = `${(APP.sidebar - 40) * 0.25 * grow}px`;
      const done = ep(T, COMPLETE_CLICK, COMPLETE_CLICK + 0.2, ease.outBack);
      s.items[0].tick.style.opacity = String(clamp(done * 1.5));
      s.items[0].tick.style.transform = `scale(${lerp(0.4, 1, done)})`;

      const turn = ep(T, NEXT_CLICK + 0.05, NEXT_CLICK + 0.45, ease.inOutCubic);
      s.pages[0].style.transform = `translateX(${-80 * turn}px)`;
      s.pages[0].style.opacity = String(1 - turn);
      s.pages[1].style.transform = `translateX(${80 * (1 - turn)}px)`;
      s.pages[1].style.opacity = String(turn);
      s.items.forEach((item, index) => {
        const active = index === 0 ? 1 - turn : index === 1 ? turn : 0;
        item.row.style.background = `rgba(214,222,255,${0.9 * active})`;
      });

      const isDone = T >= COMPLETE_CLICK && T < NEXT_CLICK + 0.25;
      s.completeLabel.textContent = isDone ? '✓ Completed' : 'Mark as Complete';
      s.complete.style.background = isDone ? BRAND_BLUE : '#FFFFFF';
      s.complete.style.color = isDone ? '#FFFFFF' : BRAND_BLUE;
      const pressComplete = kick(T, COMPLETE_CLICK, 14);
      const pressNext = kick(T, NEXT_CLICK, 14);
      s.complete.style.transform = `scale(${1 - 0.06 * pressComplete})`;
      s.next.style.transform = `scale(${1 - 0.06 * pressNext})`;

      const footerY = APP.top + APP.height - 36;
      const completeAt = [APP.left + APP.width - 150 - 85, footerY];
      const nextAt = [APP.left + APP.width - 32 - 48, footerY];
      const startAt = [APP.left + APP.width - 120, APP.top + APP.height + 90];
      const toComplete = ep(T, 22.2, COMPLETE_CLICK - 0.04, ease.inOutCubic);
      const toNext = ep(T, COMPLETE_CLICK + 0.3, NEXT_CLICK - 0.04, ease.inOutCubic);
      const x = lerp(lerp(startAt[0], completeAt[0], toComplete), nextAt[0], toNext);
      const y = lerp(lerp(startAt[1], completeAt[1], toComplete), nextAt[1], toNext);
      const press = Math.max(pressComplete, pressNext);
      s.cursor.style.left = x - 4 + 'px';
      s.cursor.style.top = y - 4 + 'px';
      s.cursor.style.transform = `scale(${1 - 0.12 * press})`;
      s.cursor.style.opacity = String(prog(T, 22.1, 22.3) * (1 - leave));

      const rippleFrom = T >= NEXT_CLICK ? NEXT_CLICK : COMPLETE_CLICK;
      const rippleAt = T >= NEXT_CLICK ? nextAt : completeAt;
      const spread = prog(T, rippleFrom, rippleFrom + 0.4);
      s.ripple.style.left = rippleAt[0] - 30 + 'px';
      s.ripple.style.top = rippleAt[1] - 30 + 'px';
      s.ripple.style.opacity = String(T >= COMPLETE_CLICK ? 0.8 * (1 - spread) : 0);
      s.ripple.style.transform = `scale(${lerp(0.3, 1.4, ease.outCubic(spread))})`;

      popIn(s.pill, T, 23.24, { distance: 18 });
      s.pill.style.opacity = String(prog(T, 23.24, 23.4) * (1 - leave));
    }
  });

  /* G — "that's what ClassroomIO helps you do": the logo lands behind her. */
  scene({
    id: 'G-logo',
    in: 24.6,
    out: 26.433,
    behind: [24.6, 26.433],
    build(root) {
      const lockup = logoLockup(root, 100, BRAND_BLUE, INK);
      css(lockup, { left: '1070px', top: '340px', transformOrigin: '0 50%' });
      const mark = lockup.children[0];
      const word = lockup.children[1];
      word.textContent = '';
      css(word, { fontWeight: 800, letterSpacing: '-0.04em' });
      const spans = letters(word, 'classroomio');

      return { lockup, mark, spans };
    },
    update({ T, s }) {
      const markIn = ep(T, 24.64, 24.98, ease.outBack);
      s.mark.style.opacity = String(prog(T, 24.64, 24.76));
      s.mark.style.transform = `translateY(${30 * (1 - markIn)}px) scale(${lerp(0.7, 1, markIn)})`;
      lettersIn(s.spans, T, 24.84, { stagger: 0.025, duration: 0.4, distance: 34, blur: 10 });
      s.lockup.style.transform = `scale(${1 + 0.025 * prog(T, 24.64, 26.433)})`;
    }
  });
}
