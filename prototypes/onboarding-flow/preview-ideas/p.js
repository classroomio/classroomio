/* Builders for the five dashboard-preview ideas. Uses the real proto.js renderers. */
const P = window.proto;
const ic = P.icon;
const esc = P.escapeHtml;

const ST = {
  ...P.EMPTY_STATE,
  company: 'Northbeam',
  brandName: 'Northbeam',
  primary: '#0f766e',
  goals: ['onboard', 'deflect'],
  description: 'We make project management software for agencies.',
  plan: 'FREE',
  theme: 'quartz'
};
const REC = P.recommend(ST);
ST.courses = REC.courses;
ST.path = REC.path;

const vars = (primary) => P.brandVars(primary);

function topbar(extra = '') {
  return `<div class="d2-top"><span class="lockup"><span class="mk" style="background:${ST.primary}">C</span><span class="nm">ClassroomIO</span></span>
  <div class="rail"><div class="rail-head"><span class="of">Step 4 of 4</span><span class="now">Your workspace</span></div><div class="rail-segs">${('<span class="rail-seg done" style="background:' + ST.primary + '"></span>').repeat(4)}</div></div>
  ${extra}<div class="sp"><span class="btn btn-ghost btn-sm">Starter content</span><span class="btn btn-ghost btn-sm">Back</span><span class="btn btn-primary" style="background:${ST.primary}">Done customising ${ic('send', 14)}</span></div></div>`;
}

function dash(state = ST, { primary = state.primary, name = state.brandName, path = true } = {}) {
  const s = { ...state, primary, brandName: name, company: name };
  const cards = state.courses
    .slice(0, 3)
    .map((c, i) => P.courseCardHTML(c, primary, { badge: i === 2 ? 'Matched to your goal' : 'Starter' }))
    .join('');
  return `<div class="d2-dash" style="${vars(primary)}">
    <aside class="sidebar">${P.renderOrgSidebar(s, 'Courses')}</aside>
    <div class="d2-main">
      <div class="d2-dtop"><span class="crumb">${esc(name)} / Courses</span><span style="margin-left:auto;display:flex;gap:8px"><span class="btn btn-outline btn-sm">Take the tour</span><span class="btn btn-primary btn-sm" data-pin="buttons">View portal</span></span></div>
      <div class="d2-dbody"><h2>Courses <span class="badge badge-muted" style="vertical-align:middle">3 starter</span></h2>
        <div class="course-grid">${cards}</div>
        ${path ? `<h2 style="margin:18px 0 10px;font-size:15px">Learning path</h2><article class="path-card" data-pin="path" style="padding:12px 14px"><div class="path-head"><span class="path-ic">${ic('route', 15)}</span><div style="flex:1"><h4>${esc(ST.path.title)}</h4><p>${ST.path.steps.length} steps · 3 courses</p></div><span class="badge badge-muted">Preview</span></div></article>` : ''}
      </div></div></div>`;
}

const tile = (t, on) =>
  `<div class="tile${on ? ' on' : ''}"><img src="${t.preview}" alt="" onerror="this.style.display='none'"><span class="tag ${t.free ? 'tag-free' : 'tag-premium'}">${t.free ? 'Free' : 'Premium'}</span><b>${t.title}</b></div>`;
const swatches = (cur) =>
  P.COLOR_PRESETS.concat([{ hex: '#0f766e' }])
    .map((c) => `<i class="sw${c.hex === cur ? ' on' : ''}" style="--c:${c.hex}"></i>`)
    .join('');

/* A · laptop + phone */
function ideaA() {
  return `<div class="d2" style="${vars(ST.primary)}">${topbar()}
  <div class="d2-body"><div class="a-stage">
    <div class="laptop" style="position:relative"><span class="cap">${ic('dashboard' in P.ICONS ? 'dashboard' : 'layers', 12)} Your dashboard · what you see</span>
      <div class="laptop-screen"><div class="scale" style="transform:scale(.7556)">${dash()}</div></div><div class="laptop-base"></div></div>
    <div style="position:relative"><span class="cap">${ic('globe', 12)} Your portal · what learners see</span>
      <div class="phone"><div class="scale" style="transform:scale(.62);width:390px;height:800px;overflow:hidden">${P.quartzHTML(ST)}</div></div></div>
  </div>
  <div class="bar-dock"><span class="lbl-sm" style="width:92px">Theme</span>${P.LANDING_THEMES.slice(0, 8)
    .map((t, i) => tile(t, i === 0))
    .join('')}
    <div class="pill" style="position:static;margin:0 0 0 auto"><span class="pill-lbl">Brand colour</span><span class="swatches pill-sw">${swatches(ST.primary)}</span></div></div></div></div>`;
}

/* B · tool rail + full dashboard */
function ideaB() {
  const tools = [
    ['Brand', 'sparkle'],
    ['Colour', 'eye', true],
    ['Theme', 'layers'],
    ['Content', 'book'],
    ['Tools', 'zap']
  ];
  return `<div class="d2" style="${vars(ST.primary)}">${topbar()}
  <div class="d2-body"><div class="b-wrap">
    <div class="b-rail">${tools.map(([n, i, on]) => `<div class="b-tool${on ? ' on' : ''}">${ic(i, 20)}${n}</div>`).join('')}</div>
    <div class="b-panel"><h3>Colour</h3><p class="text-muted" style="margin:0;font-size:12.5px">Buttons, links, the sidebar highlight and your portal all follow it.</p>
      <div class="lbl-sm">Presets</div><div style="display:flex;gap:10px">${swatches(ST.primary)}</div>
      <div class="field" style="margin:0"><label class="label">Custom <span class="fmt-toggle" style="float:right"><button class="on">HEX</button><button>RGB</button></span></label><div class="color-row"><span class="color-swatch" style="background:${ST.primary}"></span><input class="input" value="#0F766E" readonly></div></div>
      <div class="note quiet" style="margin-top:4px">${ic('check', 15)}<span><b>Good contrast.</b> 5.5:1 against white, so links stay readable.</span></div>
      <div class="lbl-sm" style="margin-top:6px">Where it shows up</div>
      <div style="display:grid;gap:6px;font-size:12.5px">${['Sidebar highlight', 'Primary buttons', 'Links and badges', 'Portal sign-in button'].map((t) => `<div style="display:flex;gap:8px;align-items:center">${ic('check', 13)} ${t}</div>`).join('')}</div></div>
    <div class="b-stage"><div class="frame"><div class="scale" style="transform:scale(.847);">${dash()}</div></div></div>
  </div></div></div>`;
}

/* C · brand across every surface */
function ideaC() {
  const surfaces = [
    ['Dashboard', dash()],
    ['Landing portal', P.quartzHTML(ST)],
    ['Course page', ''],
    ['Certificate', '']
  ];
  return `<div class="d2" style="${vars(ST.primary)}">${topbar(`<span style="display:flex;gap:10px;align-items:center;margin-left:6px"><span class="lbl-sm">Brand</span><span class="pill-mark" style="background:${ST.primary};color:#fff;width:26px;height:26px;border-radius:99px;display:grid;place-items:center;font-size:10.5px;font-weight:700">NB</span><b style="font-size:13px">Northbeam</b><span style="display:flex;gap:6px;margin-left:8px">${swatches(ST.primary)}</span></span>`)}
  <div class="d2-body"><div class="c-wrap"><div class="c-main">
    <div class="c-tabs"><span class="c-tab">Dashboard</span><span class="c-tab">Landing portal</span><span class="c-tab on">Course page</span><span class="c-tab">Certificate</span></div>
    <div class="c-frame"><div class="lesson">
      <div class="lesson-nav"><span class="qz-mark" style="background:${ST.primary};color:#fff;width:24px;height:24px;border-radius:6px;display:grid;place-items:center;font-size:10px;font-weight:700">NB</span><b>Northbeam Academy</b><span class="text-muted">/ Getting Started with Your Workspace</span><span style="margin-left:auto" class="btn btn-primary btn-sm">Mark complete</span></div>
      <div><div class="lesson-video"><span style="display:grid;gap:8px;justify-items:center">${ic('send', 38)}<span style="font-size:13px;opacity:.85">Lesson 1 · Tour of your workspace</span></span></div>
        <div style="padding:0 22px"><h3 style="margin:0 0 6px;font-size:18px;letter-spacing:-.02em">Tour of your workspace</h3><p class="text-muted" style="margin:0;font-size:13.5px;line-height:1.6;max-width:62ch">Create a workspace, learn the layout and find your way around on day one. Progress and the next-lesson button use your brand colour.</p>
        <div style="display:flex;gap:8px;margin-top:14px"><span class="btn btn-primary">Next lesson →</span><span class="btn btn-outline">Download notes</span></div></div></div>
      <div class="lesson-list"><span class="lbl-sm" style="padding:0 10px 6px">Lessons</span>${['Tour of your workspace', 'Setting up a workspace', 'Creating the first project', 'Inviting teammates', 'Completing a first workflow'].map((l, i) => `<div class="${i === 0 ? 'on' : ''}">${ic(i === 0 ? 'send' : 'check', 13)} ${l}</div>`).join('')}</div>
    </div></div></div>
    <div class="c-side"><span class="lbl-sm">Your brand on every surface</span>
      ${[
        ['Dashboard', 0],
        ['Landing portal', 0],
        ['Course page', 1],
        ['Certificate', 0]
      ]
        .map(
          ([n, on], i) =>
            `<div class="c-thumb${on ? ' on' : ''}"><div class="in" style="background:linear-gradient(135deg,color-mix(in oklab,${ST.primary} ${20 + i * 12}%,#fff),#fff)"><div style="height:16px;background:${ST.primary};opacity:.9"></div><div style="padding:8px;display:grid;gap:5px"><i style="height:6px;border-radius:99px;background:var(--border);width:70%"></i><i style="height:6px;border-radius:99px;background:var(--border);width:50%"></i><i style="height:14px;border-radius:5px;background:${ST.primary};width:34%"></i></div></div><b>${n}</b></div>`
        )
        .join('')}
      <div class="note quiet" style="margin-top:2px">${ic('info', 15)}<span>Certificates use your colour from Starter up.</span></div>
    </div></div></div></div>`;
}

/* D · before / after */
function ideaD() {
  const before = dash(ST, { primary: P.DEFAULT_PRIMARY, name: 'Your Academy' });
  const after = dash(ST, { primary: ST.primary, name: 'Northbeam' });
  return `<div class="d2" style="${vars(ST.primary)}">${topbar()}
  <div class="d2-body"><div class="d-stage">
    <div class="d-frame"><div class="d-layer"><span class="d-chip" style="left:306px">Default ClassroomIO</span><div class="scale">${before}</div></div>
      <div class="d-layer d-after"><span class="d-chip" style="right:14px;background:${ST.primary}">Your academy</span><div class="scale">${after}</div></div>
      <div class="d-handle"><i>${ic('chevron', 18)}</i></div></div>
    <div class="bar-dock" style="position:absolute"><span class="lbl-sm" style="width:92px">Theme</span>${P.LANDING_THEMES.slice(
      0,
      7
    )
      .map((t, i) => tile(t, i === 0))
      .join('')}
      <div class="pill" style="position:static;margin:0 0 0 auto"><span class="pill-lbl">Brand colour</span><span class="swatches pill-sw">${swatches(ST.primary)}</span></div></div>
  </div></div></div>`;
}

/* E · hotspots */
function ideaE() {
  const items = [
    ['Logo and name', 1],
    ['Sidebar highlight', 1],
    ['Buttons and links', 0, true],
    ['Course covers', 0],
    ['Learning path', 0]
  ];
  return `<div class="d2" style="${vars(ST.primary)}">${topbar()}
  <div class="d2-body"><div class="e-stage">
    <div class="e-frame"><div class="scale" style="transform:scale(.927);width:1180px;">${dash()}</div>
      <span class="pin done" style="left:8px;top:14px">1</span>
      <span class="pin done" style="left:190px;top:183px">2</span>
      <span class="pin live" style="left:1068px;top:4px">3</span>
      <span class="pin" style="left:226px;top:122px">4</span>
      <span class="pin" style="left:1068px;top:348px">5</span>
      <div class="hotpop" style="right:14px;top:50px"><b>Buttons and links</b><span class="text-muted" style="font-size:12.5px;margin-top:-6px">Used in 14 places, including the portal sign-in.</span>
        <div style="display:flex;gap:9px">${swatches(ST.primary)}</div>
        <div class="color-row"><span class="color-swatch" style="background:${ST.primary}"></span><input class="input" value="#0F766E" readonly><span class="fmt-toggle"><button class="on">HEX</button><button>RGB</button></span></div></div>
    </div>
    <div class="e-list"><span class="lbl-sm" style="margin-bottom:2px">Tap a pin to customise it</span>
      ${items.map(([n, d, on], i) => `<div class="e-item${d ? ' done' : ''}${on ? ' on' : ''}"><i>${d ? '✓' : i + 1}</i><span>${n}</span></div>`).join('')}
      <div class="note quiet" style="margin-top:6px">${ic('info', 15)}<span>2 of 5 customised. All optional — defaults are fine.</span></div>
      <div class="lbl-sm" style="margin-top:10px">Theme</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${P.LANDING_THEMES.slice(
        0,
        4
      )
        .map((t, i) => {
          const x = tile(t, i === 0);
          return x.replace('width:118px', '');
        })
        .join('')}</div>
    </div></div></div></div>`;
}
