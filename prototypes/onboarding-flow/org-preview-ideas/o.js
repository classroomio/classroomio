const P = window.proto;
const ic = P.icon;
const esc = P.escapeHtml;

const ST = {
  ...P.EMPTY_STATE,
  company: 'Northbeam',
  brandName: 'Northbeam',
  primary: P.DEFAULT_PRIMARY,
  goals: ['onboard', 'deflect'],
  description:
    'We make project management software for agencies. Customers set up workspaces, run projects and report progress to clients.',
  plan: 'FREE',
  theme: 'quartz'
};
const REC = P.recommend(ST);
ST.courses = REC.courses;
ST.path = REC.path;
const vars = () => P.brandVars(ST.primary);

function topbar() {
  return `<div class="o-top"><span class="lockup"><span class="mk">C</span><span class="nm">ClassroomIO</span></span>
  <div class="rail"><div class="rail-head"><span class="of">Step 3 of 4</span><span class="now">Your business</span></div><div class="rail-segs"><span class="rail-seg done"></span><span class="rail-seg done"></span><span class="rail-seg done"></span><span class="rail-seg"></span></div></div>
  <div class="sp"><span class="btn btn-ghost btn-sm">Restart</span></div></div>`;
}

const chip = (l, on, i) => `<span class="chip role-chip" aria-pressed="${on}">${ic(i, 14)}${l}</span>`;
const goal = (g, on) =>
  `<span class="goal" aria-pressed="${on}"><span class="goal-ic">${ic(g.icon, 15)}</span><span class="goal-tx"><span class="goal-t">${g.label}</span><span class="goal-y">${ic('chevron', 11)}${g.yields}</span></span><span class="goal-ck">${ic('check', 11)}</span></span>`;

/* The four real stage-3 cards, statically. only = which cards, focus = card with focus. */
function form({ focus = -1, goals = 6, roles = 5, only = [0, 1, 2, 3] } = {}) {
  const f = (i) => (i === focus ? ' focus' : '');
  const cards = [
    `<section class="biz-card${f(0)}"><header class="biz-card-head"><span class="biz-num">1</span><div><h3>Your company</h3><p>${ic('sparkle', 12)} Names your workspace and learning portal</p></div></header>
     <div class="biz-two"><div class="field"><label class="label">Company name</label><input class="input" value="Northbeam" readonly></div><div class="field"><label class="label">Website <span class="opt-tag">optional</span></label><input class="input" value="https://northbeam.io" readonly></div></div></section>`,
    `<section class="biz-card${f(1)}"><header class="biz-card-head"><span class="biz-num">2</span><div><h3>What does your product do?</h3><p>${ic('sparkle', 12)} Used to draft your starter courses and learning path</p></div></header>
     <textarea class="textarea" rows="2" readonly>${esc(ST.description)}</textarea>
     <div class="ex-row"><span class="text-muted" style="font-size:12px">Try an example</span><span class="ex-chip">Project management</span><span class="ex-chip">Analytics</span><span class="ex-chip">Fintech</span></div></section>`,
    `<section class="biz-card${f(2)}"><header class="biz-card-head"><span class="biz-num">3</span><div><h3>Your role</h3><p>${ic('sparkle', 12)} Saved to your profile to tailor tips</p></div></header>
     <div class="chips">${[
       ['Founder', 'rocket'],
       ['Customer Education', 'book'],
       ['Product', 'layers'],
       ['Support', 'lifebuoy'],
       ['Operations', 'settings']
     ]
       .slice(0, roles)
       .map(([l, i]) => chip(l, l === 'Customer Education', i))
       .join('')}</div></section>`,
    `<section class="biz-card${f(3)}"><header class="biz-card-head"><span class="biz-num">4</span><div><h3>What should customers be able to do?</h3><p>${ic('sparkle', 12)} Shapes your learning path and which courses we add</p></div></header>
     <div class="goal-grid">${P.GOALS.slice(0, goals)
       .map((g) => goal(g, g.id === 'onboard' || g.id === 'deflect'))
       .join('')}</div></section>`
  ];

  return `<div class="biz-form">${only.map((i) => cards[i]).join('')}</div>`;
}

/* The real dashboard at a fixed native size, as the miniature's big sibling. */
function dash({
  welcome = false,
  name = 'Northbeam',
  courses = ST.courses.slice(0, 3),
  path = true,
  ghostPath = false,
  cols = 3
} = {}) {
  const s = { ...ST, brandName: name, company: name };
  const cards = courses
    .map((c, i) => P.courseCardHTML(c, ST.primary, { badge: i === 2 ? 'Matched to your goal' : 'Starter' }))
    .join('');
  return `<div class="d2-dash" style="${vars()}">
    <aside class="sidebar">${P.renderOrgSidebar(s, 'Courses')}</aside>
    <div class="d2-main"><div class="d2-dtop"><span class="crumb">${esc(name)} / Courses</span><span style="margin-left:auto;display:flex;gap:8px"><span class="btn btn-outline btn-sm">Take the tour</span><span class="btn btn-primary btn-sm">View portal</span></span></div>
    <div class="d2-dbody">${welcome ? `<div class="welcome" style="margin-bottom:14px;padding:16px 18px"><h1 style="font-size:20px">Welcome, Ada — ${esc(name)} is ready.</h1><p style="font-size:13px">You told us you want to onboard new customers. We drafted the courses below.</p></div>` : ''}
      <h2>Courses <span class="badge badge-muted" style="vertical-align:middle">${courses.length} starter</span></h2><div class="course-grid" style="grid-template-columns:repeat(${cols},1fr)">${cards}</div>
      ${path ? `<h2 style="margin:16px 0 8px;font-size:15px">Learning path</h2><article class="path-card" style="padding:12px 14px${ghostPath ? ';opacity:.5' : ''}"><div class="path-head"><span class="path-ic">${ic('route', 15)}</span><div style="flex:1"><h4>${esc(ST.path.title)}</h4><p>${ST.path.steps.length} steps · ${courses.length} courses</p></div><span class="badge badge-muted">Preview</span></div></article>` : ''}</div></div></div>`;
}

const frame = (inner, s, w, h, overlay = '') =>
  `<div class="pv" style="width:${w}px;height:${h}px"><div class="scale" style="transform:scale(${s});width:1180px">${inner}</div>${overlay}</div>`;
const wrap = (body) => `<div class="o" style="${vars()}">${topbar()}<div class="o-body">${body}</div></div>`;
const cta = (note = 'Nothing is analysed until you continue') =>
  `<div style="position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:space-between;padding:12px 28px;border-top:1px solid var(--border);background:var(--background);z-index:9"><span class="btn btn-ghost" style="visibility:hidden">Back</span><span style="display:flex;gap:14px;align-items:center"><span class="text-muted" style="font-size:12.5px">${note}</span><span class="btn btn-primary btn-lg">Prepare my workspace ${ic('send', 15)}</span></span></div>`;

/* 1 · focus-linked: the card you are editing lights up the part of the dashboard it changes */
function idea1() {
  return wrap(`<div style="display:grid;grid-template-columns:560px 1fr;gap:26px;padding:22px 28px 0;height:100%">
    <div><h1>Tell us about your business.</h1><p class="lede" style="margin-bottom:14px">Watch your workspace take shape as you answer.</p>${form({ focus: 1, goals: 4 })}</div>
    <div style="position:relative"><div class="k" style="margin:6px 0 10px;display:flex;justify-content:space-between"><span>Your workspace, taking shape</span><span class="badge badge-outline">Sample preview</span></div>
      <div style="position:relative">${frame(dash(), 0.665, 786, 560, '<span class="hl" style="left:158px;top:80px;width:610px;height:140px"></span>')}
        <span class="callout" style="left:430px;top:42px">${ic('sparkle', 13)} Drafted from “What does your product do?”</span></div>
      <p class="text-muted" style="font-size:12px;margin:12px 2px 0;line-height:1.5">The card you're editing lights up the part of your workspace it changes. Matched from the words you type — nothing is analysed yet.</p></div></div>${cta()}`);
}

/* 2 · a drawer that peeks from the bottom */
function idea2() {
  return wrap(`<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:18px 90px 0">
    <div><h1>Tell us about your business.</h1><p class="lede" style="margin-bottom:12px">Four quick questions. Your workspace builds below as you go.</p>${form({ only: [0, 1] })}</div>
    <div style="padding-top:2px">${form({ only: [2, 3], focus: 3, goals: 4, roles: 4 })}</div></div>
   <div class="drawer"><span class="handle"></span>
     <div class="drawer-h"><b style="font-size:15px">Your workspace so far</b><span class="mine">${ic('check', 11)} Northbeam</span><span class="mine">${ic('check', 11)} 3 courses</span><span class="mine">${ic('check', 11)} 1 learning path</span><span class="text-muted" style="margin-left:auto;font-size:12.5px">Sample preview · tap to expand ${ic('chevdown', 13)}</span></div>
     <div style="padding:0 28px;overflow:hidden;height:262px"><div class="pv" style="height:520px;width:1384px;border-radius:12px 12px 0 0"><div class="scale" style="transform:scale(1.17);width:1180px">${dash({ cols: 4, courses: ST.courses })}</div></div></div></div>`);
}

/* 3 · personalisation meter: generic → yours */
function idea3() {
  const ring = (p) =>
    `<div class="ring"><svg viewBox="0 0 54 54"><circle cx="27" cy="27" r="22" fill="none" stroke="var(--muted)" stroke-width="6"/><circle cx="27" cy="27" r="22" fill="none" stroke="var(--primary)" stroke-width="6" stroke-linecap="round" stroke-dasharray="138" stroke-dashoffset="${138 - 138 * p}" transform="rotate(-90 27 27)"/></svg><b>${Math.round(p * 100)}%</b></div>`;
  return wrap(`<div style="display:grid;grid-template-columns:540px 1fr;gap:26px;padding:22px 28px 0;height:100%">
    <div><h1>Tell us about your business.</h1><p class="lede" style="margin-bottom:14px">Each answer turns a generic placeholder into yours.</p>${form({ focus: 2, goals: 4 })}</div>
    <div><div class="meter" style="margin-bottom:12px">${ring(0.75)}<div style="flex:1"><b style="font-size:15px">Your workspace is 75% personalised</b><div class="text-muted" style="font-size:12.5px;margin-top:2px">Add your role to finish — everything else is already yours.</div></div><span class="badge badge-outline">Sample preview</span></div>
      <div style="position:relative">${frame(dash({ welcome: true }), 0.66, 790, 540)}
        <span class="callout soft" style="left:96px;top:8px"><span class="mine">${ic('check', 10)} Your name</span></span>
        <span class="callout soft" style="left:470px;top:54px;border-style:dashed"><span class="gen">Generic</span> Welcome message — add your role</span>
        <span class="callout soft" style="left:236px;top:112px"><span class="mine">${ic('check', 10)} 3 courses from your product</span></span>
        <span class="callout soft" style="left:236px;top:282px"><span class="mine">${ic('check', 10)} Path from your goals</span></span></div></div></div>${cta()}`);
}

/* 4 · floating picture-in-picture preview */
function idea4() {
  return wrap(`<div style="padding:20px 150px 0"><h1>Tell us about your business.</h1><p class="lede" style="margin-bottom:14px">Answer four quick questions. A small preview follows you down the page.</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start">${form({ only: [0, 1], focus: 1 })}${form({ only: [2, 3], goals: 2, roles: 4 })}</div></div>
   <div class="pip" style="bottom:66px"><div class="pip-h"><b>Your workspace</b><span class="seg2" style="margin-left:6px"><button class="on">Dashboard</button><button>Portal</button><button>Path</button></span><span style="margin-left:auto;display:flex;gap:8px;color:var(--muted-foreground)">${ic('plus', 15)}${ic('x', 15)}</span></div>
     <div style="height:262px;overflow:hidden;position:relative"><div class="scale" style="transform:scale(.397);width:1180px">${dash({ cols: 3 })}</div></div>
     <div style="padding:8px 12px;border-top:1px solid var(--border);font-size:12px;display:flex;justify-content:space-between" class="text-muted"><span>Sample preview · updates as you type</span><span>Expand ${ic('chevron', 12)}</span></div></div>${cta()}`);
}

/* 5 · numbered pairing: each card's number matches a pin on the dashboard */
function idea5() {
  const pin = (n, l, t, c = '') =>
    `<span class="tagc ${c}" style="left:${l}px;top:${t}px;width:26px;height:26px;border-radius:99px;display:grid;place-items:center;padding:0;font-size:12px;box-shadow:0 0 0 4px rgb(255 255 255 / .9)">${n}</span>`;
  const legend = [
    ['1', 'Names your workspace and portal'],
    ['2', 'Drafts 3 starter courses'],
    ['3', 'Tailors the welcome message'],
    ['4', 'Shapes the learning path']
  ];
  return wrap(`<div style="display:grid;grid-template-columns:500px 1fr;gap:28px;padding:22px 28px 0;height:100%"><div><h1 style="font-size:27px">Tell us about your business.</h1><p class="lede" style="margin-bottom:12px;font-size:13.5px">Each numbered answer shapes the matching part of your workspace.</p>${form({ goals: 4 })}</div>
    <div><div class="k" style="margin:6px 0 10px;display:flex;justify-content:space-between"><span>What each answer changes</span><span class="badge badge-outline">Sample preview</span></div>
      <div style="position:relative">${frame(dash({ welcome: true }), 0.7, 828, 560)}${pin(1, 104, 12)}${pin(2, 230, 119)}${pin(3, 700, 72)}${pin(4, 252, 301)}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 18px;margin-top:14px">${legend.map(([n, t]) => `<div style="display:flex;gap:9px;align-items:center;font-size:13px"><span class="tagc" style="position:static;width:22px;height:22px;border-radius:99px;display:grid;place-items:center;padding:0">${n}</span>${t}</div>`).join('')}</div></div></div>${cta()}`);
}

/* 6 · org details as one calm, single-column step (no preview) */
function idea6() {
  return wrap(`<div style="display:flex;justify-content:center;padding:26px 0 0"><div style="width:720px">
    <div class="k" style="color:var(--primary);margin-bottom:6px">Step 3 · Your business</div><h1>Tell us about your business.</h1><p class="lede" style="margin-bottom:16px">Four quick answers. We use them to prepare your courses and learning path, so you never start from a blank page.</p>
    ${form({ goals: 4, roles: 4 })}</div></div>${cta('Takes about a minute · everything is editable later')}`);
}

/* 7 · after customising: calm "your workspace is ready" preview */
function idea7() {
  ST.primary = '#0f766e';
  const rows = [
    ['Northbeam', 'Workspace and portal name'],
    ['Project management software', '3 starter courses'],
    ['Customer Education', 'Your welcome message'],
    ['Onboarding · fewer tickets', 'New Customer Onboarding path']
  ];
  const body = `<div style="display:grid;grid-template-columns:960px 360px;gap:32px;padding:26px 32px 0;height:100%">
    <div style="position:relative">${frame(dash({ welcome: true }), 0.8, 960, 700, '<span class="hl" style="left:186px;top:142px;width:760px;height:204px;box-shadow:0 0 0 2px var(--primary),0 0 0 9999px rgb(255 255 255 / .5)"></span>')}</div>
    <div style="padding-top:30px"><div class="k" style="color:var(--primary);margin-bottom:8px">Step 4 · Done</div><h1 style="font-size:28px;margin-bottom:8px">Your workspace is ready.</h1>
      <p class="lede" style="margin-bottom:22px">Built from your answers. Everything is a draft you can edit.</p>
      <div style="display:grid;gap:2px">${rows.map(([a, b], i) => `<div style="display:grid;gap:2px;padding:12px 14px;border-radius:12px;${i === 1 ? 'background:color-mix(in oklab,var(--primary) 7%,transparent);box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--primary) 35%,transparent)' : ''}"><span style="font-size:12px;color:var(--muted-foreground)">${a}</span><b style="font-size:14.5px;font-weight:600;display:flex;align-items:center;gap:8px;color:${i === 1 ? 'var(--primary)' : 'inherit'}">${ic('chevron', 13)} ${b}</b></div>`).join('')}</div>
      <div style="margin-top:26px;display:grid;gap:10px"><span class="btn btn-primary btn-lg" style="width:100%;background:${ST.primary}">Open my dashboard ${ic('send', 15)}</span><span class="btn btn-ghost" style="width:100%">Connect your tools first</span></div></div></div>`;
  return `<div class="o" style="${vars()}">${topbar().replace('Step 3 of 4', 'Step 4 of 4').replace('Your business', 'Your workspace').replace('<span class="rail-seg"></span>', '<span class="rail-seg done"></span>')}<div class="o-body">${body}</div></div>`;
}
