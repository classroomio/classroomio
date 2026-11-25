/* v3 scenes, part B: your domain, name and logo; the test; the whole team at once. */

/* ===================== H. "a site that has your domain, your name, and your logo" ===================== */

const SITE = { in: 49.3, cut: 53.84, domainAt: 51.41, nameAt: 52.27, logoAt: 53.18, url: 'learn.northwind.com', name: 'Northwind Academy', brand: '#E8632B', brandRgb: '232,99,43', grey: '#C9CDD6' };
const SITE_W = 1240;
const SITE_H = 740;

function northwindMark(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" style="display:block"><rect width="48" height="48" rx="13" fill="${SITE.brand}"/><path d="M11 31 C 17 14, 24 34, 31 18 S 38 14, 39 15" fill="none" stroke="#FFF" stroke-width="5" stroke-linecap="round"/><circle cx="35" cy="33" r="3.5" fill="#FFF"/></svg>`;
}

scene({
  id: 'H-your-academy',
  in: SITE.in,
  out: SITE.cut + 0.3,
  build(root) {
    const handles = cinematicPanel(root, { background: 'radial-gradient(90% 90% at 60% 45%, #1A1420 0%, #07060C 72%)' });
    const content = handles.content;
    const warm = el('div', 'abs', content);
    css(warm, { left: '600px', top: '-200px', width: '1500px', height: '1400px', background: `radial-gradient(closest-side, rgba(${SITE.brandRgb},0.22), rgba(${SITE.brandRgb},0) 100%)`, mixBlendMode: 'screen', opacity: 0 });

    const view = el('div', 'abs', content);
    css(view, { inset: 0, perspective: '2200px', perspectiveOrigin: '62% 50%' });
    const rig = el('div', 'd3', view);
    css(rig, { left: '1215px', top: '540px' });
    const win = el('div', 'abs', rig);
    css(win, { left: -SITE_W / 2 + 'px', top: -SITE_H / 2 + 'px', width: SITE_W + 'px', height: SITE_H + 'px', borderRadius: '18px', overflow: 'hidden', background: '#FBFAF7', boxShadow: '0 70px 140px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.12)', color: '#17140F' });

    const chrome = el('div', 'abs', win);
    css(chrome, { left: 0, right: 0, top: 0, height: '58px', background: '#ECEAE5', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 22px' });
    ['#FF5F57', '#FEBC2E', '#28C840'].forEach((color) => (el('div', '', chrome).style.cssText = `width:13px;height:13px;border-radius:50%;background:${color}`));
    const bar = el('div', '', chrome);
    css(bar, { marginLeft: '170px', width: '560px', height: '36px', borderRadius: '10px', background: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 16px', fontSize: '18px', boxShadow: '0 0 0 1px rgba(0,0,0,0.06)' });
    const lock = el('div', '', bar, '<svg width="14" height="16" viewBox="0 0 14 16"><rect x="1" y="7" width="12" height="9" rx="2" fill="#3A3A3A"/><path d="M3.5 7V5a3.5 3.5 0 0 1 7 0v2" stroke="#3A3A3A" stroke-width="1.8" fill="none"/></svg>');
    const url = el('div', '', bar);
    css(url, { fontWeight: 500, letterSpacing: '-0.01em', whiteSpace: 'nowrap' });
    const caret = el('div', '', bar);
    css(caret, { width: '2px', height: '20px', background: '#2B59FF', marginLeft: '-8px' });

    const nav = el('div', 'abs', win);
    css(nav, { left: '48px', right: '48px', top: '84px', height: '56px', display: 'flex', alignItems: 'center', gap: '16px' });
    const logoSlot = el('div', '', nav);
    css(logoSlot, { width: '48px', height: '48px', borderRadius: '13px', background: '#E2E0DA', position: 'relative', flex: 'none' });
    const logo = el('div', 'abs', logoSlot, northwindMark(48));
    css(logo, { left: 0, top: 0 });
    const navName = el('div', '', nav);
    css(navName, { fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', minWidth: '220px', height: '28px', borderRadius: '8px', whiteSpace: 'nowrap' });
    const links = el('div', '', nav, 'Courses&nbsp;&nbsp;&nbsp;&nbsp;Community&nbsp;&nbsp;&nbsp;&nbsp;Sign in');
    css(links, { marginLeft: 'auto', fontSize: '17px', color: '#6B6152' });

    const hero = el('div', 'abs', win);
    css(hero, { left: '48px', top: '182px', width: '620px' });
    const kicker = el('div', '', hero, 'SELF-PACED · ONLINE');
    css(kicker, { fontFamily: 'var(--mono)', fontSize: '14px', letterSpacing: '0.22em' });
    const headline = el('div', '', hero);
    css(headline, { fontSize: '62px', fontWeight: 800, letterSpacing: '-0.045em', lineHeight: '1.02', marginTop: '14px', minHeight: '128px' });
    const sub = el('div', '', hero, 'Learn the product at your own pace, whenever your team is ready.');
    css(sub, { fontSize: '21px', color: '#5A5145', marginTop: '14px', lineHeight: '1.35', width: '520px' });
    const cta = el('div', '', hero, 'Start learning →');
    css(cta, { display: 'inline-block', marginTop: '24px', padding: '15px 26px', borderRadius: '12px', fontSize: '19px', fontWeight: 650, color: '#FFFFFF' });
    const heroImage = el('div', 'abs', win);
    css(heroImage, { right: '48px', top: '178px', width: '470px', height: '300px', borderRadius: '18px', backgroundImage: `url(${asset('room', 1)})`, backgroundSize: 'cover', backgroundPosition: 'center' });

    const cards = ['Product 101', 'Admin setup', 'Reporting'].map((title, index) => {
      const card = el('div', 'abs', win);
      css(card, { left: 48 + index * 390 + 'px', top: '520px', width: '366px', height: '190px', borderRadius: '16px', background: '#FFFFFF', boxShadow: '0 1px 0 rgba(0,0,0,0.06), 0 10px 30px rgba(0,0,0,0.08)', overflow: 'hidden' });
      el('div', 'abs', card).style.cssText = `left:0;right:0;top:0;height:92px;background-image:url(${asset('room', index + 2)});background-size:cover;background-position:center`;
      el('div', 'abs', card, title).style.cssText = 'left:18px;top:106px;font-size:21px;font-weight:650;letter-spacing:-.02em';
      const track = el('div', 'abs', card);
      css(track, { left: '18px', right: '18px', top: '148px', height: '8px', borderRadius: '4px', background: '#ECE8E0' });
      const fill = el('div', 'abs', track);
      css(fill, { left: 0, top: 0, bottom: 0, borderRadius: '4px', width: [72, 38, 14][index] + '%' });
      el('div', 'abs', card, `${[72, 38, 14][index]}% complete`).style.cssText = 'left:18px;top:162px;font-family:var(--mono);font-size:12px;color:#8A8072';

      return fill;
    });

    const callouts = [
      { label: 'YOUR DOMAIN', value: SITE.url, at: SITE.domainAt, target: bar },
      { label: 'YOUR NAME', value: SITE.name, at: 52.49, target: navName },
      { label: 'YOUR LOGO', value: '', at: 53.35, target: logoSlot }
    ].map((item, index) => {
      const node = el('div', 'abs cine', content);
      css(node, { left: '70px', top: 250 + index * 190 + 'px', width: '430px' });
      el('div', '', node, `<span class="check" style="display:inline-block;width:26px;height:26px;border-radius:50%;background:${SITE.brand};color:#fff;font-size:16px;text-align:center;line-height:26px;margin-right:12px">✓</span>${item.label}`).style.cssText = 'font-family:var(--mono);font-size:18px;letter-spacing:.26em;display:flex;align-items:center';
      const value = el('div', '', node, item.value || northwindMark(64));
      css(value, { fontSize: '36px', fontWeight: 750, letterSpacing: '-0.035em', marginTop: '12px', whiteSpace: 'nowrap', textShadow: item.value ? glow(SITE.brandRgb, 0.5) : 'none' });

      return { ...item, node };
    });
    const svg = svgLayer(content, 'siteGlow');
    const leaders = callouts.map(() => {
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', SITE.brand);
      path.setAttribute('stroke-width', '2.5');
      path.setAttribute('filter', 'url(#siteGlow)');
      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('r', '7');
      dot.setAttribute('fill', '#FFFFFF');
      dot.setAttribute('filter', 'url(#siteGlow)');
      svg.append(path, dot);

      return { path, dot };
    });
    const burst = el('div', 'abs', content);
    css(burst, { width: '240px', height: '240px', borderRadius: '50%', border: `3px solid rgba(${SITE.brandRgb},0.9)`, opacity: 0 });

    return { handles, warm, rig, url, caret, lock, logo, logoSlot, navName, headline, kicker, cta, cards, callouts, leaders, burst };
  },
  update({ T, s }) {
    updateCinematic(s.handles, T, { start: SITE.in, cut: SITE.cut, inkDuration: 0.45, inks: ['ink1', 'ink13'] });

    const arrive = spring(T, SITE.in + 0.15, 0.8, 4.5);
    const drift = prog(T, SITE.in, SITE.cut);
    s.rig.style.transform = `translateZ(${lerp(-1600, 200, arrive) + 60 * drift}px) rotateY(${lerp(-24, -13, arrive) + 6 * drift}deg) rotateX(${lerp(9, 4, arrive) - 1.5 * drift}deg)`;

    const typed = typedText(SITE.url, T, 50.61, SITE.domainAt);
    s.url.textContent = typed;
    s.caret.style.opacity = T < SITE.domainAt + 0.2 && caretOn(T) ? 1 : 0;
    s.lock.style.opacity = T >= SITE.domainAt ? 1 : 0.25;

    const named = T >= SITE.nameAt;
    const nameText = scramble(SITE.name, T, SITE.nameAt, 52.62, 5);
    s.navName.textContent = named ? nameText : '';
    s.navName.style.background = named ? 'transparent' : '#E2E0DA';
    s.headline.innerHTML = named ? `Welcome to<br>${nameText}` : '<div style="width:420px;height:52px;border-radius:10px;background:#E2E0DA"></div><div style="width:300px;height:52px;border-radius:10px;background:#E2E0DA;margin-top:14px"></div>';

    const logoIn = ep(T, SITE.logoAt, SITE.logoAt + 0.25, ease.outBack);
    s.logo.style.opacity = clamp(logoIn * 2);
    s.logo.style.transform = `scale(${T >= SITE.logoAt ? lerp(2.4, 1, clamp(logoIn, 0, 1.2)) : 0})`;
    const wash = ep(T, 53.3, 53.6);
    const brandColor = mixColor(SITE.grey, SITE.brand, wash);
    s.cta.style.background = brandColor;
    s.kicker.style.color = mixColor('#8A8072', SITE.brand, wash);
    s.cards.forEach((fill) => (fill.style.background = brandColor));
    s.warm.style.opacity = wash;

    s.callouts.forEach((item, index) => {
      const appear = ep(T, item.at - 0.05, item.at + 0.3);
      item.node.style.opacity = appear;
      item.node.style.transform = `translateX(${(1 - appear) * -30}px) scale(${1 + 0.06 * kick(T, item.at, 7)})`;
      item.node.style.filter = `blur(${(1 - appear) * 12}px)`;
      const from = item.node.getBoundingClientRect();
      const to = item.target.getBoundingClientRect();
      const startX = from.left + 430;
      const startY = from.top + 22;
      const endX = to.left + to.width / 2;
      const endY = to.top + to.height / 2;
      const draw = ep(T, item.at, item.at + 0.35);
      const path = `M ${startX} ${startY} C ${startX + 140} ${startY}, ${endX - 200} ${endY}, ${endX} ${endY}`;
      const leader = s.leaders[index];
      leader.path.setAttribute('d', path);
      const length = leader.path.getTotalLength();
      leader.path.setAttribute('stroke-dasharray', `${length * draw} ${length}`);
      leader.path.style.opacity = T >= item.at ? 0.9 : 0;
      const point = leader.path.getPointAtLength(length * draw);
      leader.dot.setAttribute('cx', point.x);
      leader.dot.setAttribute('cy', point.y);
      leader.dot.style.opacity = T >= item.at ? 1 : 0;
    });

    const logoBox = s.logoSlot.getBoundingClientRect();
    const ring = prog(T, SITE.logoAt + 0.05, SITE.logoAt + 0.6);
    s.burst.style.left = logoBox.left + logoBox.width / 2 - 120 + 'px';
    s.burst.style.top = logoBox.top + logoBox.height / 2 - 120 + 'px';
    s.burst.style.opacity = T >= SITE.logoAt ? (1 - ring) * 0.9 : 0;
    s.burst.style.transform = `scale(${0.2 + 1.6 * ease.outCubic(ring)})`;
  }
});

function typedText(text, T, start, end) {
  return text.slice(0, Math.round(text.length * prog(T, start, end)));
}

function mixColor(from, to, amount) {
  const parse = (hex) => [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
  const a = parse(from);
  const b = parse(to);

  return `rgb(${a.map((value, index) => Math.round(lerp(value, b[index], amount))).join(',')})`;
}

/* ===================== I. The test: "a test that validates that they actually understood your product" ===================== */

const QUIZ = { in: 54.0, fly: 59.3, cut: 60.45, x: 1250, y: 150, w: 600, h: 700 };
const QUIZ_QUESTIONS = [
  { at: 54.3, lock: 55.0, q: 'Where do you invite your whole team?', options: ['Billing', 'Settings → Team', 'Course outline', 'Analytics'], answer: 1 },
  { at: 55.5, lock: 56.35, q: 'What proves a learner finished?', options: ['A calendar invite', 'A certificate', 'An email thread', 'A meeting note'], answer: 1 },
  { at: 56.7, lock: 57.32, q: 'Where does completion data go?', options: ['Nowhere', 'A screenshot', 'Your internal systems', 'A sticky note'], answer: 2 }
];

scene({
  id: 'I-the-test',
  in: QUIZ.in,
  out: QUIZ.cut,
  behind: [QUIZ.in, QUIZ.fly],
  build(root) {
    const view = el('div', 'abs', root);
    css(view, { inset: 0, perspective: '1800px' });
    const card = el('div', 'abs cine', view);
    css(card, { left: QUIZ.x + 'px', top: QUIZ.y + 'px', width: QUIZ.w + 'px', height: QUIZ.h + 'px', borderRadius: '30px', background: 'linear-gradient(160deg, rgba(22,26,40,0.9), rgba(10,12,20,0.94))', border: '1px solid rgba(255,255,255,0.18)', boxShadow: '0 40px 100px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.2)', overflow: 'hidden', transformOrigin: '50% 50%' });

    const head = el('div', 'abs', card);
    css(head, { left: '40px', right: '40px', top: '36px', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: '16px', letterSpacing: '0.22em', opacity: 0.75 });
    el('div', '', head, 'PRODUCT 101 · FINAL CHECK');
    const step = el('div', '', head, '1 / 3');
    const segments = [0, 1, 2].map((index) => {
      const segment = el('div', 'abs', card);
      css(segment, { left: 40 + index * 178 + 'px', top: '76px', width: '166px', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.14)' });

      return segment;
    });

    const faces = QUIZ_QUESTIONS.map((question) => {
      const face = el('div', 'abs', card);
      css(face, { left: '40px', right: '40px', top: '118px', bottom: '40px', transformOrigin: '50% 0' });
      const prompt = el('div', '', face, question.q);
      css(prompt, { fontSize: '38px', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: '1.12', height: '96px' });
      const rows = question.options.map((option, index) => {
        const row = el('div', '', face);
        css(row, { marginTop: '16px', height: '78px', borderRadius: '18px', border: '1.5px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', gap: '18px', padding: '0 22px', fontSize: '25px', fontWeight: 550 });
        const badge = el('div', '', row, 'ABCD'[index]);
        css(badge, { width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: '18px', flex: 'none' });
        el('div', '', row, option);

        return { row, badge };
      });

      return { ...question, face, rows };
    });

    const result = el('div', 'abs', card);
    css(result, { left: 0, right: 0, top: '110px', bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' });
    result.innerHTML = `<svg width="330" height="330" viewBox="-165 -165 330 330" style="margin-top:20px">
      <circle r="138" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="18"/>
      <circle class="arc" r="138" fill="none" stroke="#3DDC84" stroke-width="18" stroke-linecap="round" transform="rotate(-90)" stroke-dasharray="0 1000"/>
    </svg>`;
    const arc = result.querySelector('.arc');
    const score = el('div', 'abs', result);
    css(score, { left: 0, right: 0, top: '112px', textAlign: 'center', fontSize: '110px', fontWeight: 800, letterSpacing: '-0.05em', lineHeight: '1' });
    const scoreLabel = el('div', 'abs', result, 'YOUR SCORE');
    css(scoreLabel, { left: 0, right: 0, top: '232px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '16px', letterSpacing: '0.3em', opacity: 0.65 });
    const passed = el('div', '', result, '✓&nbsp; PASSED · UNDERSTOOD');
    css(passed, { marginTop: '34px', padding: '14px 26px', borderRadius: '999px', background: '#3DDC84', color: '#06210F', fontFamily: 'var(--mono)', fontSize: '20px', fontWeight: 600, letterSpacing: '0.18em' });

    const fill = el('div', 'abs', root);
    css(fill, { inset: 0, background: 'radial-gradient(70% 70% at 42% 48%, #1E1710 0%, #0A0806 55%, #040306 100%)', opacity: 0 });

    return { card, step, segments, faces, result, arc, score, passed, fill };
  },
  update({ T, s }) {
    const appear = spring(T, QUIZ.in, 1.2, 5.5);
    const fly = ease.inExpo(prog(T, QUIZ.fly, QUIZ.cut - 0.04));
    const lift = ep(T, QUIZ.fly - 0.25, QUIZ.fly + 0.2, ease.inOutCubic);
    const centerShift = 960 - (QUIZ.x + QUIZ.w / 2);
    const testKick = kick(T, 55.88, 7);
    s.card.style.opacity = clamp(appear * 2);
    s.card.style.transform = `translate3d(${centerShift * lift}px, ${(540 - (QUIZ.y + QUIZ.h / 2)) * lift}px, ${lerp(-300, 0, clamp(appear, 0, 1.1)) + 1700 * fly}px) rotateY(${lerp(-24, -10, clamp(appear)) * (1 - lift)}deg) rotateX(${2 * Math.sin(T * 0.8) * (1 - lift)}deg) scale(${1 + 0.04 * testKick})`;
    s.card.style.filter = `blur(${clamp(1 - appear) * 14}px)`;
    s.card.style.background = fly > 0 ? `linear-gradient(160deg, rgba(30,23,16,${0.9 + 0.1 * fly}), rgba(10,8,6,${0.94 + 0.06 * fly}))` : 'linear-gradient(160deg, rgba(22,26,40,0.9), rgba(10,12,20,0.94))';

    const current = QUIZ_QUESTIONS.reduce((found, question, index) => (T >= question.at ? index : found), 0);
    const showResult = T >= 57.62;
    s.step.textContent = showResult ? 'RESULT' : `${current + 1} / 3`;
    s.segments.forEach((segment, index) => {
      const done = T >= QUIZ_QUESTIONS[index].lock;
      segment.style.background = done ? '#3DDC84' : index === current && !showResult ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.14)';
    });

    s.faces.forEach((face, index) => {
      const next = index < 2 ? QUIZ_QUESTIONS[index + 1].at : 57.62;
      const enter = ep(T, face.at - 0.02, face.at + 0.2, ease.outCubic);
      const leave = ep(T, next - 0.16, next, ease.inCubic);
      const visible = T >= face.at - 0.02 && T < next;
      face.face.style.display = visible ? 'block' : 'none';
      face.face.style.transform = `rotateX(${90 * (1 - enter) - 90 * leave}deg)`;
      face.face.style.opacity = String(enter * (1 - leave));
      face.rows.forEach((option, optionIndex) => {
        const locked = T >= face.lock && optionIndex === face.answer;
        const hit = locked ? kick(T, face.lock, 6) : 0;
        option.row.style.background = locked ? `rgba(61,220,132,${0.22 + 0.5 * hit})` : 'transparent';
        option.row.style.borderColor = locked ? '#3DDC84' : 'rgba(255,255,255,0.18)';
        option.row.style.boxShadow = locked ? `0 0 ${50 * hit + 10}px rgba(61,220,132,${0.35 + 0.5 * hit})` : 'none';
        option.row.style.transform = `scale(${1 + 0.04 * hit})`;
        option.badge.textContent = locked ? '✓' : 'ABCD'[optionIndex];
        option.badge.style.background = locked ? '#3DDC84' : 'rgba(255,255,255,0.1)';
        option.badge.style.color = locked ? '#06210F' : '';
      });
    });

    const resultIn = ep(T, 57.62, 57.9);
    s.result.style.display = showResult ? 'flex' : 'none';
    s.result.style.opacity = resultIn;
    s.result.style.transform = `scale(${lerp(0.85, 1, resultIn)})`;
    const fillAmount = 0.92 * ep(T, 58.05, 58.9, ease.outCubic);
    const circumference = 2 * Math.PI * 138;
    s.arc.setAttribute('stroke-dasharray', `${circumference * fillAmount} 1000`);
    s.score.textContent = `${Math.round(fillAmount * 100)}%`;
    const passedIn = ep(T, 58.96, 59.2, ease.outBack);
    s.passed.style.opacity = clamp(passedIn * 2);
    s.passed.style.transform = `scale(${lerp(0.6, 1, clamp(passedIn, 0, 1.2))})`;
    s.passed.style.boxShadow = `0 0 ${60 * kick(T, 58.96, 4)}px rgba(61,220,132,0.8)`;

    s.fill.style.opacity = ep(T, 60.05, QUIZ.cut - 1 / 30, ease.inCubic);
  }
});

/* ===================== J. "New customers sign up their whole team at once" ===================== */

const TEAM = { in: 70.167, cut: 73.3, signUp: 71.3, whole: 71.9, once: 72.72, cols: 8, rows: 6, size: 118, gap: 28 };

scene({
  id: 'J-whole-team',
  in: TEAM.in,
  out: TEAM.cut + 0.3,
  build(root) {
    const handles = cinematicPanel(root, { background: 'radial-gradient(80% 80% at 50% 60%, #2A1A0C 0%, #0D0805 60%, #050304 100%)' });
    const content = handles.content;
    const rays = plate(content, asset('light', 3), { width: 1600, height: 2100, opacity: 0 });
    rays.style.filter = 'sepia(1) saturate(2.2) hue-rotate(-12deg)';

    const view = el('div', 'abs', content);
    css(view, { inset: 0, perspective: '1500px', perspectiveOrigin: '50% 30%' });
    const plane = el('div', 'd3', view);
    css(plane, { left: '960px', top: '660px' });
    const { cols, rows, size, gap } = TEAM;
    const seats = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const x = (col - (cols - 1) / 2) * (size + gap);
        const y = (row - (rows - 1) / 2) * (size + gap);
        seats.push({ x, y, dist: Math.hypot(x, y * 1.2) });
      }
    }
    seats.sort((a, b) => a.dist - b.dist);
    seats.forEach((seat, index) => {
      const node = el('div', 'abs', plane);
      css(node, { left: seat.x - size / 2 + 'px', top: seat.y - size / 2 + 'px', width: size + 'px', height: size + 'px', borderRadius: '50%', backgroundImage: `url(${asset('faces', index * 5 + 2)})`, backgroundSize: 'cover', backgroundPosition: 'center 30%' });
      const check = el('div', 'abs', node, '✓');
      css(check, { right: '-4px', bottom: '-4px', width: '36px', height: '36px', borderRadius: '50%', background: '#F5B544', color: '#2A1606', fontSize: '20px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 4px #1A0F07' });
      seat.node = node;
      seat.check = check;
      seat.at = index === 0 ? TEAM.signUp : TEAM.whole + (index - 1) * 0.0125;
    });

    const invite = el('div', 'glass cine', content);
    css(invite, { left: '660px', width: '600px', top: '470px', height: '110px', display: 'flex', alignItems: 'center', gap: '20px', padding: '0 28px', borderRadius: '24px' });
    el('div', '', invite, '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#F5B544" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>');
    el('div', '', invite, '<div style="font-family:var(--mono);font-size:14px;letter-spacing:.22em;opacity:.7">NEW CUSTOMER · ACME</div><div style="font-size:30px;font-weight:700;letter-spacing:-.02em;margin-top:4px">Invite your team to Product 101</div>');

    const headline = el('div', 'abs cine', content);
    css(headline, { left: 0, right: 0, top: '70px', display: 'flex', justifyContent: 'center', alignItems: 'baseline', whiteSpace: 'nowrap' });
    const lineA = el('div', '', headline, 'Their whole team,');
    css(lineA, { fontSize: '104px', fontWeight: 800, letterSpacing: '-0.05em' });
    const lineB = el('div', 'serif-i', headline, 'at once.');
    css(lineB, { fontSize: '150px', marginLeft: '30px', color: '#FFE2B0' });

    const counter = el('div', 'abs cine', content);
    css(counter, { right: '110px', bottom: '80px', textAlign: 'right' });
    el('div', '', counter, 'SEATS FILLED').style.cssText = 'font-family:var(--mono);font-size:18px;letter-spacing:.3em;opacity:.7';
    const counterValue = el('div', '', counter, '00');
    css(counterValue, { fontSize: '120px', fontWeight: 800, letterSpacing: '-0.05em', lineHeight: '0.95', fontVariantNumeric: 'tabular-nums' });

    return { handles, rays, plane, seats, invite, headline, lineA, lineB, counter, counterValue };
  },
  update({ T, s }) {
    updateCinematic(s.handles, T, { start: TEAM.in, cut: TEAM.cut, inkDuration: 0, flashIn: true });

    const together = kick(T, TEAM.once, 4);
    const drift = prog(T, TEAM.in, TEAM.cut);
    s.plane.style.transform = `translateZ(${lerp(-500, -120, ease.outCubic(drift))}px) rotateX(${lerp(58, 46, drift)}deg) rotateZ(${lerp(-6, 4, drift)}deg) scale(${1 + 0.05 * together})`;

    let filled = 0;
    s.seats.forEach((seat) => {
      const lit = ep(T, seat.at, seat.at + 0.18);
      if (T >= seat.at) filled += 1;
      const hit = kick(T, seat.at, 9);
      const visible = ep(T, TEAM.in + 0.1, TEAM.in + 0.5) * (seat === s.seats[0] ? 1 : ep(T, 71.4, 71.8));
      seat.node.style.opacity = String(visible * (0.3 + 0.7 * lit));
      seat.node.style.filter = `grayscale(${1 - lit}) brightness(${0.35 + 0.65 * lit + 0.5 * together})`;
      seat.node.style.transform = `translateZ(${30 * hit + 40 * together}px) scale(${1 + 0.25 * hit})`;
      seat.node.style.boxShadow = `0 0 0 ${3 + 2 * together}px rgba(245,181,68,${0.95 * lit}), 0 0 ${30 + 70 * (hit + together)}px rgba(245,170,70,${0.55 * lit})`;
      seat.check.style.opacity = lit;
    });
    s.counterValue.textContent = String(filled).padStart(2, '0');
    s.counter.style.opacity = ep(T, TEAM.signUp - 0.1, TEAM.signUp + 0.2);
    s.counterValue.style.textShadow = glow('245,181,68', 0.4 + 1.4 * together);

    const inviteIn = ep(T, TEAM.in, TEAM.in + 0.22);
    const inviteGone = ep(T, TEAM.signUp - 0.15, TEAM.signUp + 0.1, ease.inCubic);
    s.invite.style.opacity = inviteIn * (1 - inviteGone);
    s.invite.style.transform = `translateY(${(1 - inviteIn) * 30 + inviteGone * 120}px) scale(${1 - 0.6 * inviteGone})`;
    s.invite.style.filter = `blur(${(1 - inviteIn) * 12 + inviteGone * 10}px)`;

    const aIn = ep(T, TEAM.whole - 0.05, TEAM.whole + 0.3);
    s.lineA.style.opacity = aIn;
    s.lineA.style.filter = `blur(${(1 - aIn) * 16}px)`;
    const bIn = ep(T, TEAM.once - 0.04, TEAM.once + 0.22, ease.outExpo);
    s.lineB.style.opacity = bIn;
    s.lineB.style.transform = `scale(${lerp(1.6, 1, bIn)})`;
    s.lineB.style.filter = `blur(${(1 - bIn) * 20}px)`;
    s.lineB.style.textShadow = glow('255,200,120', 0.6 + 1.8 * together);

    s.rays.style.opacity = 0.15 * ep(T, TEAM.whole, TEAM.once) + 0.85 * together;
    s.rays.style.transform = `translateY(120px) rotate(${(T - TEAM.in) * 5}deg) scale(${1 + 0.3 * together})`;
  }
});
