(function () {
  const stage = document.getElementById('fx-stage');
  if (!stage) return;

  const section = stage.closest('.fx');
  const svg = document.getElementById('fx-svg');
  const tip = document.getElementById('fx-tip');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const CDN = 'https://assets.cdn.clsrio.com/www/home/';
  const AX = 0.7071;
  const AY = 0.3851;
  const AZ = 0.8387;
  const HUB_R = 104;
  const PUCK_H = 48;

  const project = (x, y, z = 0) => [AX * (x + y), AY * (y - x) - AZ * z];
  const pt = (x, y, z) =>
    project(x, y, z)
      .map((value) => value.toFixed(1))
      .join(' ');
  const faceMatrix = (x, y, z) => {
    const [ex, ey] = project(x, y, z);
    return `matrix(${AX} ${-AY} ${AX} ${AY} ${ex.toFixed(1)} ${ey.toFixed(1)})`;
  };

  const el = (tag, attrs, parent) => {
    const node = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach((key) => node.setAttribute(key, attrs[key]));
    if (parent) parent.appendChild(node);
    return node;
  };

  const icon = {
    doc: '<svg viewBox="0 0 32 32"><path d="M9 4h10l6 6v18H9z" fill="#fff" stroke="#0542cc" stroke-width="1.8" stroke-linejoin="round"/><path d="M19 4v6h6" fill="none" stroke="#0542cc" stroke-width="1.8" stroke-linejoin="round"/><rect x="5" y="16" width="16" height="8" rx="2" fill="#0542cc"/><text x="13" y="22.3" text-anchor="middle" font-size="6" font-weight="700" fill="#fff" font-family="Geist, sans-serif">PDF</text></svg>',
    video:
      '<svg viewBox="0 0 32 32"><rect x="4" y="7" width="24" height="18" rx="4" fill="#0b1233"/><path d="M13.5 11.5v9l7.5-4.5z" fill="#fff"/></svg>',
    slides:
      '<svg viewBox="0 0 32 32"><rect x="4" y="6" width="24" height="16" rx="3" fill="#5b82ff"/><path d="M10 17v-3M14 17v-6M18 17v-4M22 17v-7" stroke="#fff" stroke-width="2" stroke-linecap="round"/><path d="M16 22v4M12 27h8" stroke="#5b82ff" stroke-width="2" stroke-linecap="round"/></svg>',
    image:
      '<svg viewBox="0 0 32 32"><rect x="4" y="6" width="24" height="20" rx="4" fill="#0542cc"/><circle cx="11.5" cy="12.5" r="2.5" fill="#fff"/><path d="M6 24l7-7 5 5 3-3 5 5" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg>',
    scorm:
      '<svg viewBox="0 0 32 32"><path d="M16 4l11 6v12l-11 6-11-6V10z" fill="#eaf0fd" stroke="#0b1233" stroke-width="1.8" stroke-linejoin="round"/><path d="M5 10l11 6 11-6M16 16v12" fill="none" stroke="#0b1233" stroke-width="1.8" stroke-linejoin="round"/></svg>'
  };

  const tiles = [
    { name: 'Documents', svg: icon.doc, color: '#0542cc', x: -320, y: -472 },
    { name: 'Videos', svg: icon.video, color: '#0b1233', x: -408, y: -256 },
    { name: 'Slides', svg: icon.slides, color: '#5b82ff', x: -130, y: -408 },
    { name: 'Images', svg: icon.image, color: '#0542cc', x: -437, y: -57 },
    { name: 'SCORM packages', svg: icon.scorm, color: '#0b1233', x: -398, y: 158 },
    { name: 'Claude Code', img: `${CDN}claude-logo.svg`, color: '#d97757', x: -195, y: -144 },
    { name: 'Cursor', img: `${CDN}cursor-logo.png`, color: '#0e0f13', x: -653, y: -223 },
    { name: 'Codex', img: `${CDN}codex-logo.png`, color: '#0e0f13', x: -224, y: 54 }
  ];

  const lessonIcons = [
    '<path d="M8 6.5v7l5.5-3.5z" fill="currentColor"/>',
    '<path d="M6 10.5l2.6 2.6L14.5 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    '<rect x="5" y="6" width="10" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    '<path d="M7 5h4.5L14 7.5V15H7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>'
  ];

  const defs = el('defs', {}, svg);
  const gradient = (tag, id, attrs, stops) => {
    const node = el(tag, Object.assign({ id }, attrs), defs);
    stops.forEach(([offset, color, opacity = 1]) =>
      el('stop', { offset, 'stop-color': color, 'stop-opacity': opacity }, node)
    );
  };
  gradient('radialGradient', 'fx-glow', {}, [
    ['0', '#0542cc', 0.24],
    ['.55', '#0542cc', 0.07],
    ['1', '#0542cc', 0]
  ]);
  gradient('linearGradient', 'fx-side', { x1: 0, x2: 1, y1: 0, y2: 0 }, [
    ['0', '#0b1233'],
    ['.38', '#2a4fc9'],
    ['.72', '#16297a'],
    ['1', '#0b1233']
  ]);
  gradient('radialGradient', 'fx-topfill', { cx: '.38', cy: '.3', r: '.8' }, [
    ['0', '#3a6df0'],
    ['.55', '#0542cc'],
    ['1', '#0438ad']
  ]);
  gradient('radialGradient', 'fx-raildot', {}, [
    ['0', '#fff'],
    ['.25', '#fff'],
    ['.32', '#0542cc'],
    ['.55', '#0542cc'],
    ['.68', '#0542cc', 0.25],
    ['1', '#0542cc', 0]
  ]);
  gradient('radialGradient', 'fx-fade', {}, [
    ['0', '#fff'],
    ['1', '#000']
  ]);
  const gridMask = el(
    'mask',
    { id: 'fx-gridmask', maskUnits: 'userSpaceOnUse', x: -900, y: -500, width: 1800, height: 1000 },
    defs
  );
  el('ellipse', { cx: 0, cy: 0, rx: 620, ry: 340, fill: 'url(#fx-fade)' }, gridMask);

  const floor = el('g', { mask: 'url(#fx-gridmask)', stroke: 'rgba(5, 66, 204, .08)', 'stroke-width': 1 }, svg);
  for (let line = -720; line <= 720; line += 48) {
    el('path', { d: `M${pt(line, -720, 0)} L${pt(line, 720, 0)}` }, floor);
    el('path', { d: `M${pt(-720, line, 0)} L${pt(720, line, 0)}` }, floor);
  }
  el('ellipse', { cx: 0, cy: 0, rx: 320, ry: 175, fill: 'url(#fx-glow)' }, svg);

  const wireLayer = el('g', {}, svg);
  const wireIds = tiles.map((tile, index) => {
    const startX = tile.x + 36;
    const pullX = startX + (-HUB_R - startX) * 0.55;
    const id = `fx-w${index}`;
    const d = `M${pt(startX, tile.y, 0)} C${pt(pullX, tile.y, 0)} ${pt(-HUB_R - 90, 0, 0)} ${pt(-HUB_R, 0, 0)}`;
    el('path', { id, d, class: 'fx-wire', style: `--i:${index}` }, wireLayer);
    return id;
  });

  const RAIL_START = HUB_R;
  const RAIL_LENGTH = 920;
  const RAIL_DURATION = 3.2;
  el(
    'path',
    { id: 'fx-railpath', d: `M${pt(RAIL_START, 0, 0)} L${pt(RAIL_START + RAIL_LENGTH, 0, 0)}`, class: 'fx-rail' },
    svg
  );

  const PANEL_START = 180;
  const PANEL_GAP = 214;
  const PANEL_W = 172;
  const PANEL_H = 224;
  const panels = [
    { label: 'Course plan', draw: drawPlan },
    { label: 'Lessons and quizzes', draw: drawLessons },
    { label: 'Branded academy', draw: drawAcademy },
    { label: 'Certificates', draw: drawCertificate }
  ];
  const panelLayer = el('g', {}, svg);
  const chipTexts = [];
  for (let index = panels.length - 1; index >= 0; index -= 1) {
    const panel = panels[index];
    const originX = PANEL_START + index * PANEL_GAP;
    const originY = -PANEL_H / 2;
    const lift = 28 + index * 30;
    const travel = ((originX + PANEL_W / 2 - RAIL_START) / RAIL_LENGTH) * RAIL_DURATION;
    const group = el('g', { class: 'fx-p', style: `--i:${index}` }, panelLayer);
    el(
      'rect',
      {
        width: PANEL_W,
        height: PANEL_H,
        rx: 12,
        fill: 'rgba(5, 66, 204, .07)',
        transform: faceMatrix(originX, originY, 0)
      },
      group
    );
    const lifted = el('g', { class: 'fx-pl', style: `--beat:${travel.toFixed(2)}s` }, group);
    el(
      'rect',
      {
        width: PANEL_W,
        height: PANEL_H,
        rx: 12,
        fill: 'rgba(190, 208, 248, .75)',
        transform: faceMatrix(originX, originY, lift - 9)
      },
      lifted
    );
    const card = el('g', { transform: faceMatrix(originX, originY, lift) }, lifted);
    el(
      'rect',
      {
        class: 'fx-card-face',
        width: PANEL_W,
        height: PANEL_H,
        rx: 12,
        fill: '#fff',
        stroke: '#d6e0f7',
        'stroke-width': 1.2
      },
      card
    );
    panel.draw(card);
    const chip = el('rect', { x: 16, y: PANEL_H - 44, height: 28, rx: 8, fill: '#0542cc' }, card);
    const text = el(
      'text',
      {
        x: 26,
        y: PANEL_H - 25.5,
        fill: '#fff',
        'font-size': 13,
        'font-weight': 500,
        'font-family': 'Geist, sans-serif'
      },
      card
    );
    text.textContent = panel.label;
    chipTexts.push({ chip, text, label: panel.label });
  }

  const sizeChips = () => {
    chipTexts.forEach(({ chip, text, label }) => {
      const measured = text.getComputedTextLength();
      const width = measured > 0 ? measured : label.length * 7.2;
      chip.setAttribute('width', (width + 20).toFixed(1));
    });
  };
  sizeChips();
  if (document.fonts) document.fonts.ready.then(sizeChips);

  const tileLayer = el('g', {}, svg);
  tiles.forEach((tile, index) => {
    const x = tile.x - 36;
    const y = tile.y - 36;
    const outer = el(
      'g',
      { class: 'fx-t', style: `--i:${index};--c:${tile.color}`, tabindex: 0, role: 'img', 'aria-label': tile.name },
      tileLayer
    );
    const bob = el('g', { class: 'fx-bob', style: `--i:${index}` }, outer);
    el('rect', { width: 72, height: 72, rx: 16, fill: '#cbd6ef', transform: faceMatrix(x, y, 0) }, bob);
    el('rect', { width: 72, height: 72, rx: 16, fill: '#dfe7f7', transform: faceMatrix(x, y, 6) }, bob);
    const raised = el('g', { class: 'fx-tf' }, bob);
    const face = el('g', { transform: faceMatrix(x, y, 12) }, raised);
    el(
      'rect',
      { class: 'fx-top-face', width: 72, height: 72, rx: 16, fill: '#fff', stroke: '#d9e2f5', 'stroke-width': 1.2 },
      face
    );
    const art = el('g', { transform: 'rotate(45 36 36)' }, face);
    if (tile.img) {
      el('image', { href: tile.img, x: 17, y: 17, width: 38, height: 38, preserveAspectRatio: 'xMidYMid meet' }, art);
    } else {
      art.innerHTML = tile.svg;
      const inner = art.firstElementChild;
      inner.setAttribute('x', 17);
      inner.setAttribute('y', 17);
      inner.setAttribute('width', 38);
      inner.setAttribute('height', 38);
    }

    const showTip = () => {
      const box = face.getBoundingClientRect();
      const host = stage.getBoundingClientRect();
      tip.textContent = tile.name;
      tip.style.left = `${box.left + box.width / 2 - host.left}px`;
      tip.style.top = `${box.top - host.top - 10}px`;
      tip.classList.add('on');
    };
    const hideTip = () => tip.classList.remove('on');
    outer.addEventListener('pointerenter', showTip);
    outer.addEventListener('focus', showTip);
    outer.addEventListener('pointerleave', hideTip);
    outer.addEventListener('blur', hideTip);
  });

  const packetLayer = el('g', { transform: 'translate(0 -8)' }, svg);
  tiles.forEach((tile, index) => {
    [0, 1].forEach((packetIndex) => {
      const duration = `${(2.6 + (index % 3) * 0.35).toFixed(2)}s`;
      const begin = `${(index * 0.42 + packetIndex * 1.7).toFixed(2)}s`;
      const packet = el('circle', { r: 5.5, fill: tile.color, opacity: 0 }, packetLayer);
      const motion = el(
        'animateMotion',
        {
          dur: duration,
          begin,
          repeatCount: 'indefinite',
          calcMode: 'spline',
          keyPoints: '0;1',
          keyTimes: '0;1',
          keySplines: '.45 0 .9 .7'
        },
        packet
      );
      el('mpath', { href: `#${wireIds[index]}` }, motion);
      el(
        'animate',
        {
          attributeName: 'opacity',
          values: '0;1;1;0',
          keyTimes: '0;.08;.88;1',
          dur: duration,
          begin,
          repeatCount: 'indefinite'
        },
        packet
      );
    });
  });

  const ellipseRy = (radius) => (radius * AY * Math.SQRT2).toFixed(1);
  [0, 1, 2].forEach((pulseIndex) => {
    el(
      'ellipse',
      { class: 'fx-pulse', cx: 0, cy: 0, rx: HUB_R, ry: ellipseRy(HUB_R), style: `--d:${pulseIndex}s` },
      svg
    );
  });

  const railDot = el('circle', { r: 20, fill: 'url(#fx-raildot)', opacity: 0 }, svg);
  const railMotion = el('animateMotion', { dur: `${RAIL_DURATION}s`, repeatCount: 'indefinite' }, railDot);
  el('mpath', { href: '#fx-railpath' }, railMotion);
  el(
    'animate',
    {
      attributeName: 'opacity',
      values: '0;1;1;0',
      keyTimes: '0;.06;.92;1',
      dur: `${RAIL_DURATION}s`,
      repeatCount: 'indefinite'
    },
    railDot
  );

  svg.appendChild(panelLayer);

  const topY = -AZ * PUCK_H;
  const puck = el('g', { class: 'fx-puck' }, svg);
  el('ellipse', { cx: 0, cy: 0, rx: HUB_R, ry: ellipseRy(HUB_R), fill: '#0b1233' }, puck);
  el(
    'rect',
    { x: -HUB_R, y: topY.toFixed(1), width: HUB_R * 2, height: (-topY).toFixed(1), fill: 'url(#fx-side)' },
    puck
  );
  el('ellipse', { cx: 0, cy: topY.toFixed(1), rx: HUB_R, ry: ellipseRy(HUB_R), fill: 'url(#fx-topfill)' }, puck);
  const ring = (radius, attrs) =>
    el('ellipse', Object.assign({ cx: 0, cy: topY.toFixed(1), rx: radius, ry: ellipseRy(radius) }, attrs), puck);
  ring(92, { class: 'fx-dash-ring', fill: 'none', stroke: 'rgba(255, 255, 255, .45)', 'stroke-width': 2 });
  ring(66, { fill: 'none', stroke: 'rgba(255, 255, 255, .16)', 'stroke-width': 10 });
  ring(44, { fill: 'rgba(255, 255, 255, .14)', stroke: 'rgba(255, 255, 255, .7)', 'stroke-width': 2 });
  const logo = el('g', { transform: `translate(0 ${topY.toFixed(1)}) scale(1 ${(AY * Math.SQRT2).toFixed(3)})` }, puck);
  el(
    'image',
    { href: '/home/images/logo.svg', x: -30, y: -22, width: 60, height: 44, style: 'filter: brightness(0) invert(1)' },
    logo
  );

  function drawPlan(card) {
    [80, 64, 72, 52].forEach((percent, row) => {
      const y = 18 + row * 26;
      el(
        'circle',
        { cx: 23.5, cy: y + 7.5, r: 6.5, fill: row < 2 ? '#0542cc' : '#fff', stroke: '#0542cc', 'stroke-width': 2 },
        card
      );
      el(
        'rect',
        { x: 38, y: y + 3.5, width: ((PANEL_W - 54) * percent) / 100, height: 8, rx: 4, fill: '#dbe4f8' },
        card
      );
    });
  }

  function drawLessons(card) {
    lessonIcons.forEach((markup, cell) => {
      const x = 16 + (cell % 2) * 74;
      const y = 16 + Math.floor(cell / 2) * 58;
      el('rect', { x, y, width: 66, height: 50, rx: 8, fill: '#eaf0fd' }, card);
      const glyph = el(
        'svg',
        { x: x + 21, y: y + 13, width: 24, height: 24, viewBox: '0 0 20 20', color: '#0542cc' },
        card
      );
      glyph.innerHTML = markup;
    });
  }

  function drawAcademy(card) {
    el('image', { href: '/home/images/logo.svg', x: 16, y: 15, width: 18, height: 13 }, card);
    el('rect', { x: 40, y: 19, width: 26, height: 6, rx: 3, fill: '#dbe4f8' }, card);
    el('rect', { x: 72, y: 19, width: 26, height: 6, rx: 3, fill: '#dbe4f8' }, card);
    el('rect', { x: 132, y: 16, width: 24, height: 12, rx: 4, fill: '#0542cc' }, card);
    el('rect', { x: 16, y: 38, width: 140, height: 46, rx: 8, fill: '#eaf0fd' }, card);
    [0, 1, 2].forEach((column) =>
      el('rect', { x: 16 + column * 48, y: 92, width: 44, height: 34, rx: 6, fill: '#eef1f7' }, card)
    );
  }

  function drawCertificate(card) {
    el(
      'rect',
      { x: 16, y: 16, width: 140, height: 118, rx: 8, fill: 'none', stroke: '#cddcfc', 'stroke-width': 2 },
      card
    );
    el('circle', { cx: 42, cy: 44, r: 13, fill: '#0542cc', stroke: '#cddcfc', 'stroke-width': 4 }, card);
    [70, 46, 58].forEach((percent, line) =>
      el('rect', { x: 28, y: 72 + line * 15, width: (116 * percent) / 100, height: 7, rx: 3.5, fill: '#dbe4f8' }, card)
    );
  }

  const fit = () => {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const scale = Math.min(1, Math.max(0.42, width / 1320));
    const viewWidth = width / scale;
    const viewHeight = height / scale;
    svg.setAttribute(
      'viewBox',
      `${(-0.52 * viewWidth).toFixed(1)} ${(-0.62 * viewHeight).toFixed(1)} ${viewWidth.toFixed(1)} ${viewHeight.toFixed(1)}`
    );
  };
  fit();
  window.addEventListener('resize', fit);

  svg.pauseAnimations();
  new IntersectionObserver(
    (entries) => {
      const visible = entries.some((entry) => entry.isIntersecting);
      const animate = visible && !reduceMotion;
      if (visible) section.classList.add('in');
      section.classList.toggle('fx-playing', animate);
      if (animate) svg.unpauseAnimations();
      else svg.pauseAnimations();
    },
    { rootMargin: '160px 0px' }
  ).observe(stage);
})();
