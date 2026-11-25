/* Starter cues. Replace the times with word timings from transcript/words.txt, then build real cues the same way. */

/* ===================== 1. Full-frame cinematic cue: "teach it once" ===================== */

const ONCE = { in: 2.0, word: 2.6, cut: 5.0 };

scene({
  id: 'example-once',
  in: ONCE.in,
  out: ONCE.cut + 0.3,
  build(root) {
    const handles = cinematicPanel(root, { background: 'radial-gradient(90% 80% at 50% 45%, #1B1622 0%, #07060C 75%)' });
    const content = handles.content;

    const halo = el('div', 'abs', content);
    css(halo, { left: W / 2 - 700 + 'px', top: H / 2 - 500 + 'px', width: '1400px', height: '1000px', background: 'radial-gradient(closest-side, rgba(255,214,160,0.28), rgba(255,214,160,0))', mixBlendMode: 'screen' });

    const line = el('div', 'abs cine', content);
    css(line, { left: 0, right: 0, top: H / 2 - 120 + 'px', textAlign: 'center', whiteSpace: 'nowrap' });
    const lead = el('span', '', line);
    css(lead, { fontSize: '120px', fontWeight: 800, letterSpacing: '-0.05em' });
    const leadLetters = letters(lead, 'Teach it ');
    const accent = el('span', 'serif-i', line);
    css(accent, { fontSize: '170px', color: '#FFE2B0', textShadow: glow('255,214,160', 0.6) });
    const accentLetters = letters(accent, 'once.');

    return { handles, halo, leadLetters, accentLetters };
  },
  update({ T, s }) {
    updateCinematic(s.handles, T, { start: ONCE.in, cut: ONCE.cut, inkDuration: 0.45 });
    lettersIn(s.leadLetters, T, ONCE.in + 0.3, { stagger: 0.03 });
    lettersIn(s.accentLetters, T, ONCE.word, { stagger: 0.05, distance: 60, blur: 24 });
    s.halo.style.opacity = String(ep(T, ONCE.word, ONCE.word + 0.6) * (0.8 + 0.2 * Math.sin(T * 3)));
    s.halo.style.transform = `scale(${1 + 0.15 * kick(T, ONCE.word, 5)})`;
  }
});

/* ===================== 2. Behind-the-speaker cue: a glass card the speaker stands in front of ===================== */

const STAT = { in: 6.0, value: 6.5, out: 9.0, x: 1240, y: 220 };

scene({
  id: 'example-behind',
  in: STAT.in,
  out: STAT.out,
  behind: [STAT.in, STAT.out],
  build(root) {
    const view = el('div', 'abs', root);
    css(view, { inset: 0, perspective: '1800px' });
    const card = el('div', 'glass cine', view);
    css(card, { left: STAT.x + 'px', top: STAT.y + 'px', width: '560px', height: '360px', padding: '44px', background: 'linear-gradient(160deg, rgba(22,26,40,0.9), rgba(10,12,20,0.94))' });
    el('div', '', card, 'HOURS SAVED').style.cssText = 'font-family:var(--mono);font-size:20px;letter-spacing:.3em;opacity:.7';
    const number = el('div', '', card, '0');
    css(number, { fontSize: '180px', fontWeight: 800, letterSpacing: '-0.05em', fontVariantNumeric: 'tabular-nums', marginTop: '10px' });

    return { card, number };
  },
  update({ T, s }) {
    const arrive = spring(T, STAT.in, 1.1, 5);
    const leave = ep(T, STAT.out - 0.35, STAT.out, ease.inCubic);
    s.card.style.opacity = String(clamp(arrive * 3) * (1 - leave));
    s.card.style.transform = `translateZ(${lerp(-600, 0, arrive)}px) rotateY(${lerp(-25, -12, arrive)}deg)`;
    s.number.textContent = String(Math.round(120 * ep(T, STAT.value, STAT.value + 1.2, ease.outQuint)));
  }
});
