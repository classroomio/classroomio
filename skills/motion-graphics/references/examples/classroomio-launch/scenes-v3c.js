/* v3 scenes, part C: the public API, self-hosting and open source, the engineering nod, the hand-off to the end card. */

/* ===================== K. "We also give you an API that you can connect to your existing tools" ===================== */

const API = { in: 76.45, cut: 80.45, typeEnd: 77.45, apiAt: 77.52, connect: 78.65, tools: 79.76 };
const API_COMMAND = [
  { text: '$ curl https://api.classroomio.com/public-api/v1/courses \\', from: 76.55, to: 77.15 },
  { text: '    -H "Authorization: Bearer $CLASSROOMIO_API_KEY"', from: 77.15, to: API.typeEnd }
];
const API_JSON = [
  '{',
  '  <k>"data"</k>: [',
  '    { <k>"title"</k>: <v>"Product 101"</v>, <k>"slug"</k>: <v>"product-101"</v> },',
  '    { <k>"title"</k>: <v>"Admin setup"</v>, <k>"slug"</k>: <v>"admin-setup"</v> },',
  '    { <k>"title"</k>: <v>"Reporting"</v>, <k>"slug"</k>: <v>"reporting"</v> }',
  '  ]',
  '}'
];
const API_TOOLS = [
  { logo: 'hubspot', color: '#FF7A59', rgb: '255,122,89', x: 1520, y: 230 },
  { logo: 'notion', color: '#FFFFFF', rgb: '255,255,255', x: 1680, y: 385 },
  { logo: 'googlesheets', color: '#34A853', rgb: '52,168,83', x: 1730, y: 545 },
  { logo: 'snowflake', color: '#29B5E8', rgb: '41,181,232', x: 1680, y: 705 },
  { logo: 'zapier', color: '#FF4F00', rgb: '255,79,0', x: 1520, y: 860 }
];

scene({
  id: 'K-public-api',
  in: API.in,
  out: API.cut + 0.3,
  build(root) {
    const handles = cinematicPanel(root, { background: 'radial-gradient(90% 90% at 40% 50%, #0E1A1E 0%, #04080A 72%)' });
    const content = handles.content;
    const view = el('div', 'abs', content);
    css(view, { inset: 0, perspective: '1900px', perspectiveOrigin: '30% 50%' });
    const terminal = el('div', 'abs cine', view);
    css(terminal, { left: '70px', top: '170px', width: '1230px', height: '720px', borderRadius: '26px', background: 'linear-gradient(160deg, rgba(24,38,42,0.95), rgba(8,14,16,0.97))', border: '1px solid rgba(160,230,220,0.28)', boxShadow: '0 50px 120px rgba(0,0,0,0.6), 0 0 90px rgba(80,200,180,0.16)', fontFamily: 'var(--mono)', fontSize: '25px', lineHeight: '1.6', padding: '70px 44px 0 44px', color: '#EAF2F0', whiteSpace: 'pre', overflow: 'hidden' });
    const titleBar = el('div', 'abs', terminal);
    css(titleBar, { left: '24px', right: '24px', top: '20px', display: 'flex', gap: '10px', alignItems: 'center' });
    ['#FF5F57', '#FEBC2E', '#28C840'].forEach((color) => (el('div', '', titleBar).style.cssText = `width:12px;height:12px;border-radius:50%;background:${color};opacity:.85`));
    el('div', '', titleBar, 'CLASSROOMIO PUBLIC API · V1').style.cssText = 'margin-left:auto;font-size:13px;letter-spacing:.24em;opacity:.55';
    const commandLines = API_COMMAND.map(() => el('div', '', terminal));
    const status = el('div', '', terminal, '<span style="background:#3DDC84;color:#04210F;padding:2px 10px;border-radius:6px">HTTP/2 200</span>');
    css(status, { marginTop: '14px' });
    const jsonLines = API_JSON.map((line) => el('div', '', terminal, line.replace(/<k>/g, '<span style="color:#9CC4FF">').replace(/<v>/g, '<span style="color:#FFD39A">').replace(/<\/[kv]>/g, '</span>')));

    const svg = svgLayer(content, 'apiGlow');
    const tools = API_TOOLS.map((tool, index) => {
      const node = el('div', 'glass', content);
      css(node, { left: tool.x - 75 + 'px', top: tool.y - 75 + 'px', width: '150px', height: '150px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' });
      node.innerHTML = brandLogo(tool.logo, 64, tool.color);
      const startY = 540 + (index - 2) * 30;
      const d = `M 1250 ${startY} C 1380 ${startY}, ${tool.x - 230} ${tool.y}, ${tool.x - 80} ${tool.y}`;

      return { ...tool, node, trail: makeTrail(svg, d, tool.color === '#FFFFFF' ? '#DDE6FF' : tool.color, 'apiGlow', 3.5) };
    });
    const toolsLabel = el('div', 'abs cine', content, 'YOUR EXISTING TOOLS');
    css(toolsLabel, { left: '1420px', width: '440px', top: '960px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '18px', letterSpacing: '0.3em' });

    return { handles, terminal, commandLines, status, jsonLines, tools, toolsLabel };
  },
  update({ T, s }) {
    updateCinematic(s.handles, T, { start: API.in, cut: API.cut, inkDuration: 0.4, inks: ['ink2', 'ink6'] });

    const arrive = spring(T, API.in + 0.05, 0.9, 5);
    const drift = prog(T, API.in, API.cut);
    s.terminal.style.transform = `translateZ(${lerp(-900, 0, arrive) - 80 * drift}px) rotateY(${lerp(22, 12, arrive) - 4 * drift}deg) rotateX(${3 - 2 * drift}deg)`;
    s.terminal.style.opacity = clamp(arrive * 1.5);

    API_COMMAND.forEach((line, index) => {
      const shown = typedText(line.text, T, line.from, line.to);
      const typing = T >= line.from && T < line.to + 0.15;
      s.commandLines[index].innerHTML = shown.replace(/^\$/, '<span style="color:#3DDC84">$</span>') + (typing && caretOn(T * 2) ? '▍' : '');
    });
    const statusIn = ep(T, API.apiAt - 0.03, API.apiAt + 0.15);
    s.status.style.opacity = statusIn;
    s.status.style.transform = `scale(${1 + 0.15 * kick(T, API.apiAt, 8)})`;
    s.status.style.transformOrigin = '0 50%';
    s.jsonLines.forEach((line, index) => {
      const at = 77.62 + index * 0.07;
      const lineIn = ep(T, at, at + 0.2);
      line.style.opacity = lineIn;
      line.style.transform = `translateX(${(1 - lineIn) * 40}px)`;
      line.style.filter = `blur(${(1 - lineIn) * 8}px)`;
      const fired = index >= 2 && index <= 4 && T >= API.connect;
      line.style.textShadow = fired ? glow('156,196,255', 0.35 * (1 + kick(T, API.connect, 4))) : 'none';
    });

    s.tools.forEach((tool, index) => {
      const appear = ep(T, 78.2 + index * 0.06, 78.55 + index * 0.06, ease.outBack);
      const start = API.connect + index * 0.11;
      const arrived = updateTrail(tool.trail, T, start, 0.45, { tail: 180, wireOpacity: 0.35, linger: 0.5 });
      const landed = arrived ? kick(T, start + 0.45, 4) : 0;
      const together = kick(T, API.tools, 4);
      const lit = arrived ? ep(T, start + 0.45, start + 0.6) : 0;
      tool.node.style.opacity = clamp(appear * 1.5);
      tool.node.style.transform = `scale(${lerp(0.5, 1, clamp(appear, 0, 1.15)) + 0.12 * (landed + together)})`;
      tool.node.style.filter = `grayscale(${1 - lit}) brightness(${0.6 + 0.4 * lit})`;
      tool.node.style.boxShadow = `0 30px 80px rgba(0,0,0,0.5), 0 0 ${20 + 90 * (landed + together)}px rgba(${tool.rgb},${0.25 + 0.6 * lit}), inset 0 1px 0 rgba(255,255,255,0.25)`;
    });
    s.toolsLabel.style.opacity = ep(T, 79.4, 79.8) * 0.85;
  }
});

/* ===================== L. "self-host it … take the code and run it on your servers because we are open source" ===================== */

const HOST = { in: 83.467, cut: 88.4, servers: 86.52, open: 87.63, racks: 13, spacing: 620 };
const HOST_LINES = [
  { kind: 'type', text: '$ git clone https://github.com/classroomio/classroomio.git', from: 84.3, to: 85.05 },
  { kind: 'out', text: "Cloning into 'classroomio'...", from: 85.12 },
  { kind: 'progress', text: 'Receiving objects: ', from: 85.2, to: 85.55 },
  { kind: 'type', text: '$ cd classroomio && ./classroomio.sh start', from: 85.7, to: 86.25 },
  { kind: 'ok', text: '✓ ClassroomIO is running on your server', from: 86.4 }
];

function rackTexture(lit) {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 1000;
  const context = canvas.getContext('2d');
  const metal = context.createLinearGradient(0, 0, 600, 0);
  metal.addColorStop(0, '#0B0F14');
  metal.addColorStop(0.5, '#151B22');
  metal.addColorStop(1, '#0B0F14');
  context.fillStyle = metal;
  context.fillRect(0, 0, 600, 1000);
  const random = seeded(lit ? 5 : 5);
  for (let unit = 0; unit < 18; unit += 1) {
    const y = 40 + unit * 52;
    context.fillStyle = '#1C232C';
    context.fillRect(30, y, 540, 44);
    context.fillStyle = '#10151B';
    for (let vent = 0; vent < 26; vent += 1) context.fillRect(200 + vent * 13, y + 10, 6, 24);
    for (let led = 0; led < 4; led += 1) {
      const on = lit && random() > 0.2;
      const color = on ? (random() > 0.7 ? '#5EC8FF' : '#3DDC84') : '#2A323C';
      if (on) {
        context.shadowColor = color;
        context.shadowBlur = 14;
      }
      context.fillStyle = color;
      context.beginPath();
      context.arc(52 + led * 26, y + 22, 6, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
    }
    if (lit) {
      context.fillStyle = 'rgba(94,200,255,0.35)';
      context.fillRect(30, y + 42, 540, 2);
    }
  }

  return canvas.toDataURL('image/png');
}

scene({
  id: 'L-self-host',
  in: HOST.in,
  out: HOST.cut + 0.3,
  build(root) {
    const handles = cinematicPanel(root, { background: 'radial-gradient(70% 70% at 50% 45%, #0C1420 0%, #03050A 75%)' });
    const content = handles.content;
    const view = el('div', 'abs', content);
    css(view, { inset: 0, perspective: '900px', perspectiveOrigin: '50% 46%' });
    const world = el('div', 'd3', view);
    css(world, { left: '960px', top: '500px' });
    const offTexture = rackTexture(false);
    const onTexture = rackTexture(true);
    const racks = [];
    for (let index = 0; index < HOST.racks; index += 1) {
      for (const side of [-1, 1]) {
        const rack = el('div', 'abs', world);
        css(rack, { left: '-300px', top: '-500px', width: '600px', height: '1000px', backgroundImage: `url(${offTexture})`, backgroundSize: 'cover' });
        const glowLayer = el('div', 'abs', rack);
        css(glowLayer, { inset: 0, backgroundImage: `url(${onTexture})`, backgroundSize: 'cover', opacity: 0 });
        racks.push({ rack, glowLayer, side, z: -500 - index * HOST.spacing, index });
      }
    }
    const floor = el('div', 'abs', world);
    css(floor, { left: '-700px', top: '-4000px', width: '1400px', height: '8000px', background: 'linear-gradient(rgba(94,200,255,0) 0%, rgba(94,200,255,0.12) 50%, rgba(94,200,255,0) 100%), repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 120px)', transform: 'translate3d(0, 500px, -4000px) rotateX(90deg)' });
    const core = el('div', 'abs', content);
    css(core, { left: '660px', top: '160px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(220,235,255,0.9) 0%, rgba(120,170,255,0.35) 30%, rgba(40,80,200,0) 70%)', mixBlendMode: 'screen', opacity: 0 });

    const terminal = el('div', 'abs cine', content);
    css(terminal, { left: '300px', top: '330px', width: '1320px', height: '330px', borderRadius: '22px', background: 'linear-gradient(160deg, rgba(18,24,34,0.94), rgba(6,8,12,0.97))', border: '1px solid rgba(255,255,255,0.16)', boxShadow: '0 50px 120px rgba(0,0,0,0.6)', fontFamily: 'var(--mono)', fontSize: '24px', lineHeight: '1.7', padding: '34px 44px', whiteSpace: 'pre' });
    const lines = HOST_LINES.map(() => el('div', '', terminal));

    const open = el('div', 'abs cine', content);
    css(open, { left: 0, right: 0, top: '230px', display: 'flex', flexDirection: 'column', alignItems: 'center' });
    const mark = el('div', '', open, brandLogo('github', 200, '#FFFFFF'));
    const word = el('div', 'serif-i', open, 'open source.');
    css(word, { fontSize: '150px', lineHeight: '1', marginTop: '26px', color: '#EEF3FF' });
    const repo = el('div', '', open, 'github.com/classroomio/classroomio');
    css(repo, { fontFamily: 'var(--mono)', fontSize: '22px', letterSpacing: '0.12em', marginTop: '20px', opacity: 0.7 });

    return { handles, world, racks, floor, core, terminal, lines, open, mark, word, repo };
  },
  update({ T, s }) {
    updateCinematic(s.handles, T, { start: HOST.in, cut: HOST.cut, inkDuration: 0 });

    HOST_LINES.forEach((line, index) => {
      const node = s.lines[index];
      if (T < line.from) {
        node.innerHTML = '';
        return;
      }

      if (line.kind === 'type') {
        const shown = typedText(line.text, T, line.from, line.to);
        node.innerHTML = shown.replace(/^\$/, '<span style="color:#3DDC84">$</span>') + (T < line.to + 0.2 && caretOn(T * 2) ? '▍' : '');
      } else if (line.kind === 'progress') {
        const percent = Math.round(100 * prog(T, line.from, line.to));
        const bar = '█'.repeat(Math.round(percent / 5)).padEnd(20, '░');
        node.innerHTML = `<span style="opacity:.6">${line.text}${String(percent).padStart(3)}% ${bar}${percent === 100 ? ', done.' : ''}</span>`;
      } else {
        node.innerHTML = line.kind === 'ok' ? `<span style="color:#3DDC84">${line.text}</span>` : `<span style="opacity:.6">${line.text}</span>`;
      }
    });
    const termIn = ep(T, HOST.in, HOST.in + 0.35);
    const termOut = ep(T, HOST.servers - 0.05, HOST.servers + 0.45, ease.inCubic);
    s.terminal.style.opacity = termIn * (1 - termOut);
    s.terminal.style.transform = `translateY(${(1 - termIn) * 30 - 260 * termOut}px) scale(${1 - 0.45 * termOut})`;
    s.terminal.style.filter = `blur(${(1 - termIn) * 10 + termOut * 8}px)`;

    const enter = ep(T, HOST.servers - 0.1, HOST.servers + 0.3);
    const travel = 3000 * ep(T, HOST.servers - 0.1, HOST.cut + 0.3, ease.outCubic);
    s.racks.forEach((item) => {
      const z = item.z + travel;
      item.rack.style.display = z > 400 || enter <= 0 ? 'none' : 'block';
      item.rack.style.opacity = String(enter);
      item.rack.style.transform = `translate3d(${item.side * 620}px, 0, ${z}px) rotateY(${-item.side * 90}deg)`;
      const onAt = HOST.servers + item.index * 0.055;
      item.glowLayer.style.opacity = ep(T, onAt, onAt + 0.12);
      item.rack.style.filter = `brightness(${(0.35 + 0.9 * clamp(1 + z / 9000)).toFixed(2)})`;
    });
    s.floor.style.opacity = String(enter);
    s.core.style.opacity = 0.6 * ep(T, HOST.servers + 0.3, HOST.open) + 0.4 * kick(T, HOST.open, 2.5);
    s.core.style.transform = `scale(${1 + 0.4 * kick(T, HOST.open, 2.5)})`;

    const openIn = ep(T, HOST.open - 0.05, HOST.open + 0.3, ease.outExpo);
    s.open.style.opacity = openIn;
    s.mark.style.transform = `scale(${lerp(0.4, 1, openIn) + 0.08 * kick(T, HOST.open, 6)})`;
    s.mark.style.filter = `drop-shadow(0 0 ${30 + 60 * kick(T, HOST.open, 3)}px rgba(170,200,255,0.9))`;
    s.word.style.filter = `blur(${(1 - openIn) * 18}px)`;
    s.word.style.textShadow = glow('170,200,255', 0.9);
    s.repo.style.opacity = 0.7 * ep(T, HOST.open + 0.2, HOST.open + 0.5);
  }
});

/* ===================== M. "Trust me, your engineering team will like it" ===================== */

const NOD_ENG = { in: 88.5, out: 90.27, approve: 88.6, lgtm: 89.81 };

scene({
  id: 'M-approved',
  in: NOD_ENG.in,
  out: NOD_ENG.out,
  build(root) {
    const pill = el('div', 'abs', root);
    css(pill, { left: '1250px', top: '250px', display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 28px 14px 14px', borderRadius: '999px', background: '#FFFFFF', color: '#17140F', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', whiteSpace: 'nowrap', transformOrigin: '0 50%' });
    const check = el('div', '', pill, '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>');
    css(check, { width: '56px', height: '56px', borderRadius: '50%', background: '#1F883D', display: 'flex', alignItems: 'center', justifyContent: 'center' });
    el('div', '', pill, '<div style="font-size:32px;font-weight:750;letter-spacing:-.025em;line-height:1">Approved</div><div style="font-family:var(--mono);font-size:14px;letter-spacing:.16em;color:#6B6152;margin-top:6px">ENGINEERING · CODE REVIEW</div>');
    const lgtm = el('div', 'abs', root, 'LGTM 🚀');
    css(lgtm, { left: '1330px', top: '366px', padding: '12px 22px', borderRadius: '999px 999px 999px 10px', background: '#1F883D', color: '#FFFFFF', fontSize: '28px', fontWeight: 700, boxShadow: '0 18px 40px rgba(0,0,0,0.3)', transformOrigin: '0 0' });
    const sparks = Array.from({ length: 10 }, (_, index) => {
      const spark = el('div', 'abs', root);
      const angle = (index / 10) * Math.PI * 2;
      css(spark, { left: '1278px', top: '278px', width: '6px', height: '22px', borderRadius: '3px', background: '#3DDC84', transformOrigin: '3px 11px' });

      return { spark, angle };
    });

    return { pill, lgtm, sparks };
  },
  update({ T, s }) {
    const pop = spring(T, NOD_ENG.approve, 1.5, 6);
    const exit = ep(T, NOD_ENG.out - 0.25, NOD_ENG.out, ease.inCubic);
    s.pill.style.opacity = clamp(pop * 2) * (1 - exit);
    s.pill.style.transform = `translateY(${(1 - clamp(pop)) * 20}px) scale(${lerp(0.5, 1, clamp(pop, 0, 1.15)) * (1 - 0.2 * exit)})`;
    const lgtmPop = spring(T, NOD_ENG.lgtm, 1.6, 6);
    s.lgtm.style.opacity = T >= NOD_ENG.lgtm ? clamp(lgtmPop * 2) * (1 - exit) : 0;
    s.lgtm.style.transform = `scale(${lerp(0.4, 1, clamp(lgtmPop, 0, 1.15))})`;
    const burst = prog(T, NOD_ENG.approve + 0.05, NOD_ENG.approve + 0.5);
    s.sparks.forEach(({ spark, angle }) => {
      const distance = 40 + 70 * ease.outCubic(burst);
      spark.style.opacity = T >= NOD_ENG.approve ? String(1 - burst) : '0';
      spark.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) rotate(${(angle * 180) / Math.PI + 90}deg) scaleY(${1 - burst})`;
    });
  }
});

/* ===================== O. "Visit academy.new to get started. Thank you." → the end card's blank frame ===================== */

const OUTRO = { in: 100.75, out: 104.1, eyebrow: 100.95, typeFrom: 101.28, typeTo: 101.98, enter: 102.21, cta: 102.51, click: 103.2, white: '#F7F7F7', warm: '#FFE2B0', warmRgb: '255,214,160' };
const OUTRO_GRID = { cols: 11, rows: 6, w: 300, h: 196, gap: 44 };
const OUTRO_BAR = { w: 1140, h: 184, x: 960, y: 455 };
const OUTRO_CTA = { x: 960, y: 668 };

scene({
  id: 'O-academy-new',
  in: OUTRO.in,
  out: OUTRO.out,
  build(root) {
    const handles = cinematicPanel(root, { background: 'radial-gradient(85% 70% at 50% 108%, #4A2A12 0%, #1A1014 42%, #06070B 100%)' });
    const content = handles.content;

    const horizon = el('div', 'abs', content);
    css(horizon, { left: '-200px', right: '-200px', top: '560px', height: '700px', background: `radial-gradient(50% 40% at 50% 30%, rgba(${OUTRO.warmRgb},0.32), rgba(${OUTRO.warmRgb},0) 100%)`, mixBlendMode: 'screen', opacity: 0 });

    const floorView = el('div', 'abs', content);
    css(floorView, { inset: 0, perspective: '1300px', perspectiveOrigin: '50% 30%' });
    const plane = el('div', 'd3', floorView);
    css(plane, { left: '960px', top: '1180px' });
    const planeWidth = OUTRO_GRID.cols * (OUTRO_GRID.w + OUTRO_GRID.gap) - OUTRO_GRID.gap;
    const cards = [];
    for (let row = 0; row < OUTRO_GRID.rows; row += 1) {
      for (let col = 0; col < OUTRO_GRID.cols; col += 1) {
        const card = el('div', 'abs', plane);
        const left = -planeWidth / 2 + col * (OUTRO_GRID.w + OUTRO_GRID.gap);
        const top = -row * (OUTRO_GRID.h + OUTRO_GRID.gap) - OUTRO_GRID.h;
        css(card, { left: left + 'px', top: top + 'px', width: OUTRO_GRID.w + 'px', height: OUTRO_GRID.h + 'px', borderRadius: '18px', overflow: 'hidden', background: '#FBFAF7', border: '2px solid rgba(255,226,176,0.35)' });
        const thumb = el('div', 'abs', card);
        css(thumb, { left: 0, right: 0, top: 0, height: '104px', backgroundImage: `url(${asset('room', row * OUTRO_GRID.cols + col)})`, backgroundSize: 'cover', backgroundPosition: 'center' });
        el('div', 'abs', card).style.cssText = `left:18px;top:124px;width:${150 + ((col * 37 + row * 23) % 90)}px;height:16px;border-radius:8px;background:#2A241C`;
        el('div', 'abs', card).style.cssText = 'left:18px;top:154px;width:120px;height:12px;border-radius:6px;background:#D9D3C8';
        const centerX = left + OUTRO_GRID.w / 2;
        const distance = Math.hypot(centerX / 340, row * 1.05);
        cards.push({ card, distance });
      }
    }

    const halo = el('div', 'abs', content);
    css(halo, { left: '160px', top: '180px', width: '1600px', height: '640px', background: 'radial-gradient(closest-side, rgba(5,5,8,0.85), rgba(5,5,8,0) 100%)' });

    const ring = el('div', 'abs', content);
    css(ring, { left: OUTRO_BAR.x - 600 + 'px', top: OUTRO_BAR.y - 200 + 'px', width: '1200px', height: '400px', borderRadius: '50%', border: `3px solid rgba(${OUTRO.warmRgb},0.9)`, boxShadow: `0 0 60px rgba(${OUTRO.warmRgb},0.5), inset 0 0 60px rgba(${OUTRO.warmRgb},0.35)`, opacity: 0 });

    const eyebrow = el('div', 'abs', content);
    css(eyebrow, { left: 0, right: 0, top: '268px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '22px', letterSpacing: '0.42em', color: 'rgba(255,255,255,0.78)' });
    const eyebrowLetters = letters(eyebrow, 'START YOUR ACADEMY');

    const view = el('div', 'abs', content);
    css(view, { inset: 0, perspective: '1800px', perspectiveOrigin: `50% ${OUTRO_BAR.y}px` });
    const rig = el('div', 'd3', view);
    css(rig, { left: OUTRO_BAR.x + 'px', top: OUTRO_BAR.y + 'px' });
    const bar = el('div', 'abs', rig);
    css(bar, { left: -OUTRO_BAR.w / 2 + 'px', top: -OUTRO_BAR.h / 2 + 'px', width: OUTRO_BAR.w + 'px', height: OUTRO_BAR.h + 'px', borderRadius: '999px', background: 'linear-gradient(180deg, rgba(40,35,40,0.97), rgba(18,16,22,0.97))', border: '2px solid rgba(255,255,255,0.24)', boxShadow: '0 50px 120px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', padding: '0 46px 0 72px', boxSizing: 'border-box', color: '#FFFFFF' });
    el('div', '', bar, '<svg width="44" height="52" viewBox="0 0 18 20" style="display:block"><rect x="2" y="8" width="14" height="11" rx="3" fill="rgba(255,255,255,0.85)"/><path d="M5 8 V6 a4 4 0 0 1 8 0 V8" stroke="rgba(255,255,255,0.85)" stroke-width="2.4" fill="none"/></svg>').style.marginRight = '40px';
    const field = el('div', '', bar);
    css(field, { display: 'flex', alignItems: 'baseline', whiteSpace: 'nowrap', flex: '1' });
    const word = el('span', '', field);
    css(word, { fontSize: '128px', fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1 });
    const tld = el('span', 'serif-i', field);
    css(tld, { fontSize: '150px', color: OUTRO.warm, lineHeight: 1, marginLeft: '4px' });
    const typedLetters = [...letters(word, 'academy'), ...letters(tld, '.new')];
    const caret = el('span', '', field);
    css(caret, { display: 'inline-block', width: '6px', height: '108px', marginLeft: '10px', borderRadius: '3px', background: OUTRO.warm, boxShadow: glow(OUTRO.warmRgb, 0.4), alignSelf: 'center' });
    const keycap = el('div', '', bar, '↵');
    css(keycap, { width: '92px', height: '92px', borderRadius: '24px', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '46px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.22)', boxShadow: '0 6px 0 rgba(0,0,0,0.35)' });

    const cta = el('div', 'abs', content);
    css(cta, { left: OUTRO_CTA.x + 'px', top: OUTRO_CTA.y + 'px', padding: '30px 58px', borderRadius: '999px', background: OUTRO.white, color: '#17140F', fontSize: '44px', fontWeight: 650, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', boxShadow: `0 0 0 1px rgba(255,255,255,0.4), 0 30px 80px rgba(0,0,0,0.45), 0 0 90px rgba(${OUTRO.warmRgb},0.35)`, opacity: 0 });
    el('span', '', cta, 'Get started&nbsp;&nbsp;→');
    const shine = el('div', 'abs', cta);
    css(shine, { top: '-40px', bottom: '-40px', width: '120px', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.95), rgba(255,255,255,0))', transform: 'skewX(-20deg)', mixBlendMode: 'overlay' });

    const cursor = el('div', 'abs', content, '<svg width="54" height="64" viewBox="0 0 18 22" style="display:block;filter:drop-shadow(0 6px 10px rgba(0,0,0,0.5))"><path d="M1.5 1.5 L1.5 17.5 L5.6 13.8 L8.4 20.2 L11.2 19 L8.5 12.7 L14 12.7 Z" fill="#111" stroke="#FFF" stroke-width="1.4" stroke-linejoin="round"/></svg>');
    css(cursor, { left: 0, top: 0, opacity: 0 });

    const ripple = el('div', 'abs', root);
    css(ripple, { width: '200px', height: '200px', borderRadius: '50%', background: `radial-gradient(circle, ${OUTRO.white} 0%, ${OUTRO.white} 60%, rgba(255,236,205,0.75) 66%, rgba(255,236,205,0) 71%)`, opacity: 0 });
    ripple.style.zIndex = '40';
    const fill = el('div', 'abs', root);
    css(fill, { inset: 0, background: OUTRO.white, opacity: 0 });
    fill.style.zIndex = '41';

    return { handles, horizon, plane, cards, ring, eyebrowLetters, rig, bar, typedLetters, caret, keycap, cta, shine, cursor, ripple, fill };
  },
  update({ T, s }) {
    updateCinematic(s.handles, T, { start: OUTRO.in, cut: OUTRO.out, inkDuration: 0.45, inks: ['ink1', 'ink2'], hardCut: true });

    lettersIn(s.eyebrowLetters, T, OUTRO.eyebrow, { stagger: 0.018, duration: 0.45, distance: 18, blur: 10 });

    const arrive = spring(T, OUTRO.in + 0.05, 0.75, 4.8);
    const drift = prog(T, OUTRO.in, OUTRO.out);
    const press = kick(T, OUTRO.enter, 10);
    s.rig.style.transform = `translateZ(${lerp(-1400, 0, arrive) + 70 * drift}px) rotateX(${lerp(22, 0, arrive) - 3 * drift}deg) rotateY(${lerp(-10, 0, arrive)}deg) scale(${1 - 0.035 * press})`;
    s.rig.style.opacity = String(ep(T, OUTRO.in + 0.44, OUTRO.in + 0.56));

    const step = (OUTRO.typeTo - OUTRO.typeFrom) / s.typedLetters.length;
    let shown = 0;
    s.typedLetters.forEach((span, index) => {
      const at = OUTRO.typeFrom + index * step;
      const visible = T >= at;
      if (visible) shown = index + 1;
      span.style.display = visible ? 'inline-block' : 'none';
      const pop = ep(T, at, at + 0.16, ease.outBack);
      const flare = kick(T, at, 12);
      span.style.transform = `translateY(${(1 - pop) * 26}px) scale(${lerp(1.35, 1, clamp(pop, 0, 1.2))})`;
      span.style.filter = `blur(${(1 - clamp(pop)) * 8}px)`;
      span.style.textShadow = index >= 7 ? glow(OUTRO.warmRgb, 0.55 + flare) : `0 0 ${30 * flare}px rgba(${OUTRO.warmRgb},${0.9 * flare})`;
    });
    const typing = T >= OUTRO.typeFrom && T < OUTRO.typeTo + 0.05;
    s.caret.style.opacity = T < OUTRO.enter && (typing || caretOn(T)) ? '1' : '0';
    s.caret.style.display = T < OUTRO.enter ? 'inline-block' : 'none';
    if (shown === 0) s.caret.style.marginLeft = '0px';

    const lit = T >= OUTRO.enter;
    s.bar.style.borderColor = lit ? `rgba(${OUTRO.warmRgb},${0.55 + 0.45 * press})` : 'rgba(255,255,255,0.24)';
    s.bar.style.boxShadow = `0 50px 120px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.25), 0 0 ${lit ? 90 + 120 * press : 0}px rgba(${OUTRO.warmRgb},${lit ? 0.35 + 0.4 * press : 0})`;
    s.keycap.style.transform = `translateY(${6 * press}px)`;
    s.keycap.style.boxShadow = `0 ${6 - 6 * press}px 0 rgba(0,0,0,0.35)`;
    s.keycap.style.background = lit ? `rgba(${OUTRO.warmRgb},${0.18 + 0.5 * press})` : 'rgba(255,255,255,0.1)';

    const wave = prog(T, OUTRO.enter, OUTRO.enter + 0.8);
    s.ring.style.opacity = lit ? String(0.9 * (1 - wave)) : '0';
    s.ring.style.transform = `scale(${0.55 + 2.4 * ease.outCubic(wave)})`;

    const reveal = ep(T, OUTRO.in + 0.1, OUTRO.enter);
    s.plane.style.transform = `translateZ(${lerp(-500, -120, ease.outCubic(drift))}px) rotateX(72deg)`;
    s.horizon.style.opacity = String(0.35 * reveal + 0.65 * ep(T, OUTRO.enter, OUTRO.enter + 0.6));
    s.cards.forEach(({ card, distance }) => {
      const at = OUTRO.enter + 0.05 + distance * 0.09;
      const light = ep(T, at, at + 0.35);
      const lift = kick(T, at, 7);
      card.style.opacity = String(0.08 * reveal + 0.92 * light);
      card.style.transform = `translateZ(${40 * lift}px)`;
      card.style.boxShadow = `0 0 ${40 + 60 * lift}px rgba(${OUTRO.warmRgb},${0.15 + 0.5 * lift})`;
      card.style.filter = `brightness(${0.4 + 0.3 * light + 0.45 * lift})`;
    });

    const ctaIn = ep(T, OUTRO.cta, OUTRO.cta + 0.32, ease.outBack);
    const clickPress = kick(T, OUTRO.click, 11);
    s.cta.style.opacity = String(ep(T, OUTRO.cta, OUTRO.cta + 0.1));
    s.cta.style.transform = `translate(-50%, -50%) translateY(${30 * (1 - clamp(ctaIn))}px) scale(${lerp(0.75, 1, clamp(ctaIn, 0, 1.2)) * (1 - 0.06 * clickPress)})`;
    s.shine.style.left = lerp(-200, 560, ep(T, 102.78, 103.1, ease.inOutCubic)) + 'px';

    const glide = ep(T, 102.62, OUTRO.click - 0.04, ease.inOutCubic);
    const cursorX = lerp(1560, OUTRO_CTA.x + 70, glide) + Math.sin(glide * Math.PI) * -60;
    const cursorY = lerp(1040, OUTRO_CTA.y + 8, glide);
    s.cursor.style.opacity = String(ep(T, 102.62, 102.75) * (1 - ep(T, 103.45, 103.6)));
    s.cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) scale(${1 - 0.15 * clickPress})`;

    const spread = ease.inCubic(prog(T, OUTRO.click + 0.02, 103.98));
    const radius = lerp(70, 2100, spread);
    s.ripple.style.opacity = T >= OUTRO.click + 0.02 ? '1' : '0';
    s.ripple.style.transform = `translate(${OUTRO_CTA.x - 100}px, ${OUTRO_CTA.y - 100}px) scale(${radius / 100})`;
    s.fill.style.opacity = String(ep(T, 103.86, 103.98));
  }
});
