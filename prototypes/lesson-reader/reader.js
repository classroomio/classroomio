/*
 * reader.js — every lesson-reader interaction for lesson.html, insights.html and
 * public-lesson.html. Pages set window.READER_CONFIG = { surface, view } before
 * loading this file; URL params (?state=returning&ai=off&completion=read&open=…)
 * pick the prototype state.
 */

const CFG = window.READER_CONFIG || {};
const params = new URLSearchParams(location.search);
const isMobile = () => matchMedia('(max-width: 767px)').matches;

const S = {
  surface: CFG.surface || 'course',
  view: CFG.view || 'learner',
  learner: params.get('state') || 'first',
  ai: params.get('ai') !== 'off',
  completion: params.get('completion') || 'manual',
  complete: false,
  furthest: 0,
  current: 0,
  panel: null,
  nbTab: 'all',
  nbScope: 'lesson',
  blocks: [],
  entries: [],
  listen: null,
  briefState: 'idle'
};

const PEN = {
  cobalt: { name: 'Cobalt', value: 'oklch(0.488 0.243 264.376)' },
  vermillion: { name: 'Vermillion', value: 'oklch(0.6 0.2 35)' },
  green: { name: 'Green', value: 'oklch(0.55 0.14 155)' },
  graphite: { name: 'Graphite', value: 'oklch(0.42 0.01 260)' }
};

const HL = {
  yellow: { name: 'Yellow', swatch: 'oklch(0.9 0.15 100)' },
  green: { name: 'Green', swatch: 'oklch(0.86 0.12 150)' },
  blue: { name: 'Blue', swatch: 'oklch(0.84 0.09 245)' },
  pink: { name: 'Pink', swatch: 'oklch(0.85 0.1 350)' }
};

const THEMES = {
  auto: { name: 'Auto', bg: 'linear-gradient(135deg, #fff 50%, oklch(0.2 0 0) 50%)', fg: '#777' },
  paper: { name: 'Paper', bg: '#fdfbf7', fg: '#2a251d' },
  sepia: { name: 'Sepia', bg: '#f4ecd8', fg: '#4a3b28' },
  snow: { name: 'Snow', bg: '#ffffff', fg: '#111' },
  night: { name: 'Night', bg: 'oklch(0.19 0.012 255)', fg: 'oklch(0.88 0.01 85)' }
};

const FACES = {
  sans: { name: 'Sans', stack: "'Geist', ui-sans-serif, system-ui, sans-serif" },
  serif: { name: 'Serif', stack: "'Source Serif 4', Georgia, serif" },
  book: { name: 'Book', stack: "'Literata', Georgia, serif" },
  legible: { name: 'Legible', stack: "'Atkinson Hyperlegible', ui-sans-serif, sans-serif" }
};

const DEFAULT_PREFS = {
  theme: 'auto',
  pen: 'cobalt',
  hl: 'yellow',
  numbers: false,
  map: true,
  face: 'sans',
  size: 16,
  spacing: 'even',
  width: 'even',
  align: 'left',
  paras: 'spaced',
  length: 'brief',
  level: 'standard',
  answersIn: 'margin',
  brief: true
};

const ICON_PATHS = {
  panel: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>',
  sparkles:
    '<path d="M9.94 14.06 8.5 19l-1.44-4.94L2 12.5l5.06-1.44L8.5 6l1.44 5.06L15 12.5z"/><path d="M18 3v4"/><path d="M20 5h-4"/><path d="M19 15v3"/><path d="M20.5 16.5h-3"/>',
  arrowLeft: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  newsFeed:
    '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/>',
  content: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 8h6"/><path d="M12 8v8"/>',
  lesson:
    '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  exercise:
    '<rect x="3" y="5" width="6" height="6" rx="1"/><path d="m3 17 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
  certificates:
    '<path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/>',
  notebook:
    '<path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"/><path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/><path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  circleCheck: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  circleCheckFilled: '<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="m9 12 2 2 4-4" stroke="#fff"/>',
  chevronLeft: '<path d="m15 18-6-6 6-6"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  globe:
    '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  type: '<path d="M12 4v16"/><path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2"/><path d="M9 20h6"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  trash:
    '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  highlighter: '<path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>',
  note: '<path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/><path d="M7 11h10"/><path d="M7 15h6"/><path d="M7 7h8"/>',
  volume:
    '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3" fill="currentColor"/>',
  pause:
    '<rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/><rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/>',
  skipBack: '<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" x2="5" y1="19" y2="5"/>',
  skipForward: '<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/>',
  focus:
    '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="1"/>',
  map: '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/>',
  hash: '<path d="M4 9h16"/><path d="M4 15h16"/><path d="M10 3 8 21"/><path d="M16 3l-2 18"/>',
  headphones:
    '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  send: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  question:
    '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  alert:
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  reset: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
  pencil:
    '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  chart: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  external:
    '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  eyeOff:
    '<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/>',
  bookOpen:
    '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  flask:
    '<path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.52 16h12.96"/>'
};

function icon(name, size = 16, extra = '') {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${ICON_PATHS[name] || ''}</svg>`;
}

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (value) =>
  String(value).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);

const STORE_PREFIX = `lr:${S.surface}:${S.learner}`;

function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(`${STORE_PREFIX}:${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStore(key, value) {
  try {
    localStorage.setItem(`${STORE_PREFIX}:${key}`, JSON.stringify(value));
  } catch {
    /* storage can be unavailable on file:// in some browsers */
  }
}

let prefs = { ...DEFAULT_PREFS, ...readPrefs() };

function readPrefs() {
  try {
    return JSON.parse(localStorage.getItem('lr:prefs') || '{}');
  } catch {
    return {};
  }
}

function savePrefs() {
  try {
    localStorage.setItem('lr:prefs', JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

/* ================================================================ shell */

function ring(percent, size = 32, done = false) {
  const radius = size / 2 - 3;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);
  const label = done ? icon('check', 12) : `${Math.round(percent)}%`;
  return `<span class="cs-ring" style="width:${size}px;height:${size}px">
    <svg viewBox="0 0 ${size} ${size}" style="width:${size}px;height:${size}px">
      <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="var(--muted)" stroke-width="3"/>
      <circle class="arc" cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="${done ? 'var(--exercise)' : 'var(--primary)'}" stroke-width="3" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" style="transition:stroke-dashoffset .4s var(--ease-out)"/>
    </svg><span class="lbl" style="color:${done ? 'var(--exercise)' : 'inherit'}">${label}</span></span>`;
}

function renderOutlineRows(withChecks = true) {
  return COURSE.outline
    .map((group) => {
      const done = group.items.filter((item) => item.done).length;
      const rows = group.items
        .map((item) => {
          const typeIcon = icon(item.type, 14, `class="${item.type}-icon"`);
          const check = withChecks && item.done ? `<span class="done">${icon('circleCheckFilled', 15)}</span>` : '';
          const activeCheck = item.active ? '<span class="done" data-active-check></span>' : '';
          return `<li><a class="cs-row ${item.active ? 'active' : ''}" href="${item.active ? '#' : 'lesson.html'}">${typeIcon}<span class="title">${esc(item.title)}</span>${check}${activeCheck}</a></li>`;
        })
        .join('');
      return `<li><div class="sec">${esc(group.section)}<span class="count">${done}/${group.items.length}</span></div><ul style="list-style:none;margin:0;padding:0">${rows}</ul></li>`;
    })
    .join('');
}

function renderCourseSidebar(activeNav = 'content') {
  const progress = COURSE.progress;
  const percent = (progress.completed / progress.total) * 100;
  const isTeacher = S.view === 'teacher';
  const teacherNav = isTeacher
    ? `<a class="cs-nav" href="#">${icon('chart')}<span>Analytics</span></a>
       <a class="cs-nav" href="#">${icon('exercise')}<span>Submissions</span></a>
       <a class="cs-nav" href="#">${icon('newsFeed')}<span>People</span></a>`
    : `<a class="cs-nav ${activeNav === 'notebook' ? 'active' : ''}" href="notebook.html">${icon('notebook')}<span>Notebook</span><span class="tail"><span class="new">New</span></span></a>`;
  return `
  <aside class="cs-side" aria-label="Course navigation">
    <a class="cs-course" href="#">${isTeacher ? `<span class="cs-ring" style="display:grid;place-items:center;width:24px;height:24px;border-radius:6px;background:var(--secondary);font-size:11px;font-weight:600">UT</span>` : ring(percent)}
      <span style="min-width:0"><span class="t" style="display:block">${esc(COURSE.title)}</span>${isTeacher ? '' : `<span class="s">${progress.completed} of ${progress.total} completed</span>`}</span>
    </a>
    <div class="cs-side-scroll">
      <a class="cs-nav" href="home.html">${icon('arrowLeft')}<span>Exit course</span></a>
      <a class="cs-nav" href="#">${icon('newsFeed')}<span>News Feed</span></a>
      <a class="cs-nav ${activeNav === 'content' ? 'active' : ''}" href="lesson.html">${icon('content')}<span>Content</span>
        <span class="tail"><span class="cs-pills"><span class="cs-pill">${icon('lesson', 11, 'style="color:var(--lesson)"')}8</span><span class="cs-pill">${icon('exercise', 11, 'style="color:var(--exercise)"')}4</span></span>${icon('chevronDown', 14, 'style="color:var(--muted-foreground)"')}</span>
      </a>
      <ul class="cs-tree">${renderOutlineRows(!isTeacher)}</ul>
      ${teacherNav}
      <a class="cs-nav" href="#">${icon('certificates')}<span>Certificates</span></a>
    </div>
    <div class="cs-side-foot">
      ${
        isTeacher
          ? ''
          : `<nav class="cs-foot-nav"><button class="btn btn-outline btn-sm">${icon('chevronLeft')}Previous</button><button class="btn btn-primary btn-sm">Next${icon('chevronRight')}</button></nav>
      <div class="cs-foot-meta">Lessons ${progress.lessonsDone}/${progress.lessonsTotal} · Exercises ${progress.exercisesDone}/${progress.exercisesTotal}</div>`
      }
      <div class="cs-powered">Powered by <b>ClassroomIO</b></div>
    </div>
  </aside>`;
}

function renderCourseHeader() {
  const isTeacher = S.view === 'teacher';
  const right = isTeacher
    ? `<span class="btn btn-sm btn-assistant">${icon('sparkles')}<span class="assistant-label">Assistant</span></span>
       <span style="display:inline-flex"><button class="btn btn-outline btn-sm" style="border-top-right-radius:0;border-bottom-right-radius:0">${icon('external')}View course site</button><button class="btn btn-outline btn-sm btn-icon-sm" style="border-top-left-radius:0;border-bottom-left-radius:0;border-left:0">${icon('more')}</button></span>`
    : `<button class="btn btn-sm btn-assistant" data-action="open-assistant">${icon('sparkles')}<span class="assistant-label">Assistant</span></button>`;
  return `
  <header class="cs-head">
    <button class="btn-ghost-icon" aria-label="Toggle sidebar">${icon('panel')}</button>
    <span class="vsep"></span>
    <span class="here">Content</span>
    ${isTeacher ? '<span class="badge badge-success-soft here-badge">Published</span>' : ''}
    <span class="grow"></span>
    ${right}
  </header>`;
}

function renderPageHead() {
  const isTeacher = S.view === 'teacher';
  const minutes = readingMinutes();
  const sections = $$('h2', $('#rd-note')).length;
  const sub = `<p class="pg-sub"><span>${esc(LESSON.section)}</span><span class="sep">·</span><span>${minutes} min read</span><span class="sep">·</span><span>${sections} sections</span><span class="sep" data-left-sep hidden>·</span><span data-left hidden></span></p>`;

  let actions;
  if (isTeacher) {
    actions = `
      <button class="btn btn-outline btn-sm" aria-pressed="true" data-action="toggle-insights">${icon('chart')}Reading insights</button>
      <span class="vsep desktop-only"></span>
      <button class="btn btn-outline btn-icon-sm desktop-only" aria-label="Edit lesson">${icon('pencil')}</button>
      <button class="btn btn-outline btn-icon-sm desktop-only" aria-label="Version history">${icon('history')}</button>
      <button class="btn btn-outline btn-sm lang-btn">${icon('globe')}English</button>`;
  } else {
    const showComplete = S.surface === 'course';
    const completeControl = !showComplete
      ? ''
      : S.completion === 'read'
        ? `<span class="btn btn-secondary btn-sm desktop-only" data-read-progress title="Read to the end to complete this lesson" style="cursor:default">${ring(0, 20)}<span class="text-xs" data-read-label>Read to complete</span></span>`
        : `<button class="btn btn-secondary btn-sm desktop-only" data-action="complete">${icon('circleCheck')}<span class="text-xs">Mark as complete</span></button>`;
    const nav =
      S.surface === 'course'
        ? `<span style="display:inline-flex;gap:4px" class="desktop-only"><button class="btn btn-outline btn-icon-sm" aria-label="Previous">${icon('chevronLeft', 14)}</button><button class="btn btn-outline btn-icon-sm" aria-label="Next">${icon('chevronRight', 14)}</button></span>`
        : '';
    actions = `
      <button class="btn btn-outline btn-icon-sm aa-btn" data-action="settings" aria-label="Reading settings" title="Reading settings" aria-haspopup="dialog">Aa</button>
      <button class="btn btn-outline btn-sm" data-action="notebook" aria-label="Notebook">${icon('notebook')}<span>Notebook</span><span class="count-badge" data-nb-count>0</span></button>
      <span class="vsep desktop-only"></span>
      ${completeControl}
      ${nav}
      <button class="btn btn-outline btn-sm lang-btn">${icon('globe')}English</button>`;
  }
  return `<div class="pg-head"><div style="min-width:0"><h1 class="pg-title">${esc(LESSON.title)}</h1>${sub}</div><div class="pg-actions">${actions}</div></div>`;
}

function renderShell() {
  const page = `
    <div class="pg">
      <div data-pg-head></div>
      <div class="rd-stage" id="rd-stage">
        <div></div><div class="rd-top" data-top></div><div></div>
        <div class="rd-map-col"><div class="rd-map" id="rd-map" aria-label="Lesson map"></div></div>
        <article class="rd-note" id="rd-note">${LESSON_HTML}</article>
        <div class="rd-margin" id="rd-margin"></div>
      </div>
      ${S.surface === 'public' ? renderPublicFooterNav() : ''}
    </div>`;

  const sidePanel = `<aside class="sp" id="sp" aria-label="Side panel"></aside>`;
  const askBar =
    S.surface === 'course' && S.view === 'learner' && S.ai
      ? `<div class="ask-bar"><button class="btn btn-outline" data-action="open-assistant">Ask AI<span class="sep"></span><span style="display:inline-flex;gap:2px;color:var(--muted-foreground);font-weight:400"><span class="kbd">⌘</span><span class="kbd">I</span></span></button></div>`
      : '';
  const mobileNav =
    S.surface === 'course' && S.view === 'learner'
      ? `<nav class="mob-nav"><button class="btn btn-outline btn-icon-sm" aria-label="Previous">${icon('chevronLeft')}</button><button class="mid">${ring(58, 30)}<span style="min-width:0"><span class="t" style="display:block">${LESSON.position}</span><span class="d" style="display:block">${esc(LESSON.title)}</span></span></button><button class="btn btn-secondary btn-icon-sm" data-action="complete" aria-label="Mark as complete">${icon('circleCheck', 18)}</button><button class="btn btn-primary btn-icon-sm" aria-label="Next">${icon('chevronRight')}</button></nav>`
      : '';

  if (S.surface === 'public') {
    document.body.classList.add('surface-public');
    document.body.innerHTML = `
      <header class="pub-head">
        <span class="pub-org"><span class="av">U</span><span class="desktop-only">${esc(COURSE.org)}</span></span>
        <span style="color:var(--muted-foreground);opacity:.6">|</span>
        <span class="pub-course">${esc(COURSE.title)}</span>
        <button class="btn btn-secondary btn-sm">Explore courses</button>
        <button class="btn btn-primary btn-sm desktop-only" data-action="sign-in">Sign in</button>
        <button class="btn-ghost-icon" data-action="app-theme" aria-label="Toggle theme">${icon('sun')}</button>
      </header>
      <div class="cs-app">
        <aside class="pub-side" aria-label="Course outline">${COURSE.outline
          .map(
            (group) =>
              `<div class="sec">${esc(group.section)}</div>${group.items
                .map(
                  (item) =>
                    `<a class="cs-row ${item.active ? 'active' : ''}" href="#">${icon(item.type, 14, `class="${item.type}-icon"`)}<span class="title">${esc(item.title)}</span></a>`
                )
                .join('')}`
          )
          .join('')}<div class="cs-powered" style="margin-top:16px">Powered by <b>ClassroomIO</b></div></aside>
        <main class="cs-main" id="cs-main">${page}</main>
      </div>
      ${sidePanel}<button class="focus-exit" data-action="focus">Exit focus <span class="kbd">Esc</span></button>`;
    return;
  }

  document.body.innerHTML = `
    <div class="cs-app">
      ${renderCourseSidebar('content')}
      <main class="cs-main" id="cs-main">
        ${renderCourseHeader()}
        ${page}
      </main>
    </div>
    ${sidePanel}${askBar}${mobileNav}
    <button class="focus-exit" data-action="focus">Exit focus <span class="kbd">Esc</span></button>`;
}

function renderPublicFooterNav() {
  return `<div class="lesson-col" style="display:flex;justify-content:space-between;gap:12px;margin-top:40px;padding-top:20px;border-top:1px solid var(--border)">
    <a class="btn btn-outline" href="#">${icon('chevronLeft')}Selecting rows and columns</a>
    <a class="btn btn-outline" href="#">Grouping and aggregating${icon('chevronRight')}</a></div>`;
}

/* ============================================================== blocks */

function indexBlocks() {
  const note = $('#rd-note');
  const blocks = [];
  [...note.children].forEach((el) => {
    if (el.tagName === 'UL' || el.tagName === 'OL') {
      [...el.children].forEach((li) => blocks.push({ el: li, type: 'li' }));
      return;
    }

    let type = 'p';
    if (/^H[1-6]$/.test(el.tagName)) type = 'h';
    else if (el.tagName === 'PRE') type = 'code';
    else if (el.tagName === 'TABLE') type = 'table';
    else if (el.classList.contains('cio-callout')) type = 'callout';
    blocks.push({ el, type });
  });

  let section = 'Introduction';
  blocks.forEach((block, index) => {
    if (block.type === 'h') section = block.el.textContent.trim();
    block.section = section;
    block.el.classList.add('rd-blk');
    block.el.dataset.n = index + 1;
    block.el.dataset.b = index;
  });
  S.blocks = blocks;
}

function textNodes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.parentElement?.closest('[data-skip]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
}

function blockText(index) {
  return textNodes(S.blocks[index].el)
    .map((node) => node.data)
    .join('');
}

function blockIndexOf(node) {
  const el = (node.nodeType === 1 ? node : node.parentElement)?.closest('.rd-blk');
  return el ? Number(el.dataset.b) : -1;
}

function offsetIn(blockEl, node, offset) {
  const range = document.createRange();
  range.setStart(blockEl, 0);
  range.setEnd(node, offset);
  let total = 0;
  for (const textNode of textNodes(blockEl)) {
    if (textNode === range.endContainer) {
      total += range.endOffset;
      break;
    }
    if (!range.intersectsNode(textNode)) continue;
    total += textNode.length;
  }
  return total;
}

function positionAt(blockEl, offset) {
  let remaining = offset;
  const nodes = textNodes(blockEl);
  for (const node of nodes) {
    if (remaining <= node.length) return [node, remaining];
    remaining -= node.length;
  }
  const last = nodes[nodes.length - 1];
  return [last, last.length];
}

function anchorFromRange(range) {
  const startBlock = blockIndexOf(range.startContainer);
  const endBlock = blockIndexOf(range.endContainer);
  if (startBlock < 0 || endBlock < 0) return null;

  const start = offsetIn(S.blocks[startBlock].el, range.startContainer, range.startOffset);
  const end = offsetIn(S.blocks[endBlock].el, range.endContainer, range.endOffset);
  const startText = blockText(startBlock);
  let exact;
  if (startBlock === endBlock) {
    exact = startText.slice(start, end);
  } else {
    const middle = [];
    for (let index = startBlock + 1; index < endBlock; index++) middle.push(blockText(index));
    exact = [startText.slice(start), ...middle, blockText(endBlock).slice(0, end)].join(' ');
  }

  const endText = blockText(endBlock);
  return {
    b: startBlock,
    eb: endBlock,
    s: start,
    e: end,
    exact: exact.trim(),
    prefix: startText.slice(Math.max(0, start - 32), start),
    suffix: endText.slice(end, end + 32)
  };
}

function reanchor(entry) {
  if (entry.forceOrphan) {
    entry.orphaned = true;
    return;
  }

  if (
    entry.b !== undefined &&
    entry.b === entry.eb &&
    S.blocks[entry.b] &&
    blockText(entry.b).slice(entry.s, entry.e) === entry.exact
  ) {
    entry.orphaned = false;
    return;
  }

  if (entry.b !== undefined && entry.b !== entry.eb && S.blocks[entry.eb]) {
    entry.orphaned = false;
    return;
  }

  for (let index = 0; index < S.blocks.length; index++) {
    const found = blockText(index).indexOf(entry.exact);
    if (found >= 0) {
      Object.assign(entry, { b: index, eb: index, s: found, e: found + entry.exact.length, orphaned: false });
      return;
    }
  }
  entry.orphaned = true;
}

function rangeOf(entry) {
  if (entry.orphaned || entry.b === undefined) return null;

  const [startNode, startOffset] = positionAt(S.blocks[entry.b].el, entry.s);
  const [endNode, endOffset] = positionAt(S.blocks[entry.eb].el, entry.e);
  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  return range;
}

function readingMinutes() {
  const words = $('#rd-note').textContent.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

/* ========================================================== notebook data */

function loadEntries() {
  const stored = readStore('entries', null);
  if (stored) return stored;

  if (S.learner !== 'returning') return [];

  return SEED_NOTEBOOK.map((seed) => {
    const entry = { ...seed, forceOrphan: Boolean(seed.orphaned) };
    if (entry.kind === 'question') {
      const answer = findAnswer(entry.action, entry.exact, entry.question);
      entry.answer = answer.text;
      entry.key = answer.key;
    }
    return entry;
  });
}

function saveEntries() {
  writeStore(
    'entries',
    S.entries.map(({ streaming, ...rest }) => rest)
  );
}

function entryLabel(entry) {
  return entry.action === 'ask' ? 'Ask' : entry.action === 'define' ? 'Define' : 'Explain';
}

/* =========================================================== painting */

const supportsHighlights = typeof CSS !== 'undefined' && 'highlights' in CSS && typeof Highlight !== 'undefined';

function paintHighlights() {
  S.entries.forEach(reanchor);
  if (!supportsHighlights) return;

  const byColor = { yellow: [], green: [], blue: [], pink: [] };
  const anchors = [];
  S.entries.forEach((entry) => {
    const range = rangeOf(entry);
    if (!range) return;

    if (entry.kind === 'highlight') byColor[entry.color]?.push(range);
    else anchors.push(range);
  });
  Object.entries(byColor).forEach(([color, ranges]) => CSS.highlights.set(`hl-${color}`, new Highlight(...ranges)));
  CSS.highlights.set('q-anchor', new Highlight(...anchors));
  paintQuestionMarks();
  updateCounts();
}

function paintQuestionMarks() {
  $$('.rd-qmark').forEach((el) => el.remove());
  const counts = {};
  S.entries.forEach((entry) => {
    if (entry.kind !== 'question' || entry.orphaned) return;
    counts[entry.b] = (counts[entry.b] || 0) + 1;
  });
  Object.entries(counts).forEach(([blockIndex, count]) => {
    const mark = document.createElement('button');
    mark.className = 'rd-qmark';
    mark.dataset.skip = '';
    mark.dataset.qb = blockIndex;
    mark.setAttribute('aria-label', `${count} question${count > 1 ? 's' : ''} on paragraph ${Number(blockIndex) + 1}`);
    mark.innerHTML = `${icon('question', 10)}<span>${count}</span>`;
    S.blocks[blockIndex].el.prepend(mark);
  });
}

function updateCounts() {
  const total = S.entries.length;
  $$('[data-nb-count]').forEach((el) => {
    el.textContent = total;
    el.hidden = total === 0;
  });
}

/* ================================================================ prefs */

function applyPrefs() {
  if (prefs.theme === 'auto') delete document.body.dataset.theme;
  else document.body.dataset.theme = prefs.theme;

  const root = document.documentElement.style;
  root.setProperty('--pen', PEN[prefs.pen].value);
  root.setProperty('--rd-size', `${prefs.size}px`);
  root.setProperty('--rd-leading', { snug: 1.55, even: 1.75, airy: 2 }[prefs.spacing]);
  root.setProperty('--rd-measure', `${{ narrow: 580, even: 672, wide: 800 }[prefs.width]}px`);
  root.setProperty('--rd-font', FACES[prefs.face].stack);

  const note = $('#rd-note');
  note.classList.toggle('show-numbers', prefs.numbers);
  note.classList.toggle('justify', prefs.align === 'justify');
  note.classList.toggle('indented', prefs.paras === 'indented');
  $('#rd-map').style.display = prefs.map ? '' : 'none';
  requestAnimationFrame(() => {
    layoutCards();
    renderMap();
  });
}

/* ================================================================ map */

function renderMap() {
  const map = $('#rd-map');
  if (!map || !prefs.map || isMobile()) return;

  const note = $('#rd-note');
  const noteRect = note.getBoundingClientRect();
  const noteHeight = note.scrollHeight || 1;
  const mapHeight = map.clientHeight;
  const scale = mapHeight / noteHeight;
  const insights = S.view === 'teacher';
  let html = '';

  S.blocks.forEach((block, index) => {
    const rect = block.el.getBoundingClientRect();
    const top = (rect.top - noteRect.top) * scale;
    const height = Math.max(2, rect.height * scale - 1.5);
    const textLength = block.el.textContent.length;
    const width =
      block.type === 'h'
        ? 60
        : block.type === 'code' || block.type === 'table'
          ? 85
          : Math.min(100, 45 + textLength / 6);
    const typeClass = block.type === 'h' ? 'h' : block.type === 'code' || block.type === 'table' ? 'code' : '';
    const read = index <= S.furthest ? 'read' : '';
    html += `<div class="rd-map-tick ${typeClass} ${read}" data-mb="${index}" style="top:${top}px;height:${height}px;width:${(width / 100) * 16}px"></div>`;

    if (insights && INSIGHTS.blocks[index]) {
      const signal = INSIGHTS.blocks[index];
      const weight = Math.min(1, (signal.hl + signal.q * 1.5) / 30);
      html += `<div class="rd-map-heat" style="top:${top}px;height:${height}px;opacity:${0.15 + weight * 0.75}"></div>`;
    }
  });

  if (!insights) {
    S.entries.forEach((entry) => {
      const range = rangeOf(entry);
      if (!range) return;

      const rect = range.getBoundingClientRect();
      const top = (rect.top - noteRect.top) * scale;
      if (entry.kind === 'highlight') {
        const height = Math.max(3, rect.height * scale);
        html += `<div class="rd-map-hl" style="top:${top}px;height:${height}px;background:${HL[entry.color].swatch}"></div>`;
      } else {
        html += `<div class="rd-map-q" style="top:${top}px"></div>`;
      }
    });
  }

  const viewTop = Math.max(0, -noteRect.top + 56) * scale;
  const viewHeight = Math.min(mapHeight, window.innerHeight * scale);
  html += `<div class="rd-map-view" style="top:${Math.min(viewTop, mapHeight - viewHeight)}px;height:${viewHeight}px"></div>`;
  map.innerHTML = html;
}

function mapScrollTo(clientY) {
  const map = $('#rd-map');
  const note = $('#rd-note');
  const ratio = (clientY - map.getBoundingClientRect().top) / map.clientHeight;
  const noteTop = note.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: noteTop + ratio * note.scrollHeight - window.innerHeight / 2, behavior: 'auto' });
}

function bindMap() {
  const map = $('#rd-map');
  let dragging = false;
  map.addEventListener('pointerdown', (event) => {
    dragging = true;
    map.setPointerCapture(event.pointerId);
    mapScrollTo(event.clientY);
  });
  map.addEventListener('pointermove', (event) => {
    if (dragging) {
      mapScrollTo(event.clientY);
      return;
    }

    const tick = event.target.closest('[data-mb]');
    if (!tick) return hideTip();

    const block = S.blocks[tick.dataset.mb];
    showTip(`¶${Number(tick.dataset.mb) + 1} · ${block.section}`, event.clientX + 14, event.clientY - 10);
  });
  map.addEventListener('pointerup', () => (dragging = false));
  map.addEventListener('pointerleave', hideTip);
}

function showTip(text, x, y) {
  let tip = $('.rd-tip');
  if (!tip) {
    tip = document.createElement('div');
    tip.className = 'rd-tip';
    document.body.append(tip);
  }
  tip.textContent = text;
  tip.style.left = `${x}px`;
  tip.style.top = `${y}px`;
}

function hideTip() {
  $('.rd-tip')?.remove();
}

/* ================================================= scroll + progress */

function onScroll() {
  const line = window.innerHeight * 0.38;
  let current = 0;
  for (let index = 0; index < S.blocks.length; index++) {
    const rect = S.blocks[index].el.getBoundingClientRect();
    if (rect.top <= line) current = index;
    else break;
  }
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 40;
  if (atBottom) current = S.blocks.length - 1;

  if (current !== S.current) {
    S.blocks[S.current]?.el.classList.remove('current');
    S.current = current;
  }
  S.blocks[current].el.classList.add('current');

  if (S.view === 'learner' && current > S.furthest) {
    S.furthest = current;
    writeStore('furthest', S.furthest);
    updateReadProgress();
  }
  renderMap();
}

function updateReadProgress() {
  const percent = Math.round(((S.furthest + 1) / S.blocks.length) * 100);
  const remaining = Math.max(0, Math.round(readingMinutes() * (1 - percent / 100)));
  const left = $('[data-left]');
  if (left && S.view === 'learner') {
    left.hidden = percent < 8;
    $('[data-left-sep]').hidden = percent < 8;
    left.textContent = percent >= 95 ? 'Finished' : `${remaining} min left`;
  }

  const holder = $('[data-read-progress]');
  if (holder && !S.complete) {
    holder.querySelector('.cs-ring').outerHTML = ring(percent, 20);
    holder.querySelector('[data-read-label]').textContent = `${percent}% read`;
    if (percent >= 90) markComplete('read');
  }
}

function markComplete(source) {
  if (S.complete) return;

  S.complete = true;
  const button = $('[data-action="complete"].desktop-only') || $('.pg-actions [data-action="complete"]');
  if (button) {
    button.outerHTML = `<span class="btn btn-secondary btn-sm desktop-only" style="cursor:default;color:var(--exercise)">${icon('circleCheckFilled')}<span class="text-xs">Completed</span></span>`;
  }
  const readHolder = $('[data-read-progress]');
  if (readHolder) {
    readHolder.style.color = 'var(--exercise)';
    readHolder.innerHTML = `${icon('circleCheckFilled', 14)}<span class="text-xs">Completed</span>`;
  }
  const activeCheck = $('[data-active-check]');
  if (activeCheck) activeCheck.innerHTML = icon('circleCheckFilled', 15);
  toast(source === 'read' ? 'Lesson complete. You read to the end.' : 'Lesson marked as complete');
}

/* ======================================================== top: resume + brief */

const CLAIMS = [
  {
    text: 'Run df.info() first. It reveals missing values and wrong types at a glance.',
    find: 'Run df.info() before anything else'
  },
  {
    text: 'Filling missing prices with 0 drags every average down. Prefer the median.',
    find: 'A common mistake is to fill missing prices with zero'
  },
  {
    text: 'errors="coerce" turns failures into NaN, so always compare gap counts before and after.',
    find: 'tells pandas to turn anything it cannot convert'
  },
  {
    text: 'Normalise case and whitespace before grouping, or one store splits into three.',
    find: 'Text typed by people drifts'
  },
  {
    text: 'Keep the raw file untouched and express cleaning as one reviewable chain.',
    find: 'Never overwrite the raw file'
  }
];

function findBlock(snippet) {
  return S.blocks.findIndex((block, index) => blockText(index).includes(snippet));
}

function sectionParts() {
  const parts = [];
  let current = { name: 'Why cleaning matters', start: 0 };
  S.blocks.forEach((block, index) => {
    if (block.type !== 'h') return;

    current.end = index - 1;
    parts.push(current);
    current = { name: block.el.textContent.trim(), start: index };
  });
  current.end = S.blocks.length - 1;
  parts.push(current);
  return parts;
}

function renderTop() {
  const top = $('[data-top]');
  if (S.view === 'teacher') {
    top.innerHTML = renderInsightsTop();
    return;
  }

  let html = '';
  const savedFurthest = readStore('furthest', S.learner === 'returning' ? 15 : 0);
  S.furthest = savedFurthest;
  if (savedFurthest > 2 && !readStore('resumeDismissed', false)) {
    const block = S.blocks[savedFurthest];
    html += `<div class="rd-resume" data-resume>
      <span class="ic">${icon('bookmark')}</span>
      <span class="tx"><span class="t" style="display:block">Continue where you left off</span><span class="d">You stopped at ¶${savedFurthest + 1} in ${esc(block.section)}${S.learner === 'returning' ? ' on Tuesday' : ''}</span></span>
      <button class="btn btn-primary btn-sm" data-action="resume" data-b="${savedFurthest}">Jump to ¶${savedFurthest + 1}</button>
      <button class="btn-ghost-icon" data-action="dismiss-resume" aria-label="Dismiss">${icon('x', 14)}</button>
    </div>`;
  }

  if (S.ai && prefs.brief) html += `<section class="rd-brief" id="rd-brief"></section>`;
  top.innerHTML = html;
  if (S.ai && prefs.brief) renderBrief();
}

function renderBrief() {
  const holder = $('#rd-brief');
  if (!holder) return;

  const cached = S.learner === 'returning' || S.surface === 'public' || readStore('brief', false);
  if (!cached && S.briefState === 'idle') {
    holder.className = 'rd-brief';
    holder.innerHTML = `<div class="rd-brief-run">
      <span class="ic" style="color:var(--pen)">${icon('sparkles')}</span>
      <span class="tx"><span class="t" style="display:block">Brief this lesson</span><span class="d">The gist, the key points and a map of the sections, before you start.</span></span>
      <button class="btn btn-outline btn-sm" data-action="run-brief">Create brief</button></div>`;
    return;
  }

  if (S.briefState === 'running') {
    const words = $('#rd-note').textContent.trim().split(/\s+/).length.toLocaleString();
    holder.innerHTML = `<div class="rd-brief-progress"><div class="t">Reading all ${words} words…</div><div class="rd-bar"><span></span></div></div>`;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => ($('.rd-brief-progress .rd-bar span').style.width = '100%'))
    );
    return;
  }

  const parts = sectionParts();
  const open = S.briefState === 'fresh' || holder.classList.contains('open');
  holder.className = `rd-brief ${open ? 'open' : ''}`;
  holder.innerHTML = `
    <button class="rd-brief-head" data-action="toggle-brief" aria-expanded="${open}">
      <span class="ic">${icon('sparkles')}</span><span class="t">Lesson brief</span><span class="m">${parts.length} parts · ${CLAIMS.length} key points</span>
      <span class="chev">${icon('chevronDown')}</span>
    </button>
    <div class="rd-brief-gist"><span>Clean data in four passes: missing values, data types, inconsistent categories and duplicates. Every fix is a decision about what the data means, so make each one on purpose instead of defaulting to zero or deleting rows.</span></div>
    <div class="rd-brief-body">
      <h4>Key points</h4>
      <ol class="rd-claims">${CLAIMS.map((claim) => {
        const blockIndex = findBlock(claim.find);
        return `<li data-goto="${blockIndex}"><span>${esc(claim.text)}</span><span class="ref">¶${blockIndex + 1}</span></li>`;
      }).join('')}</ol>
      <h4>Map</h4>
      <div class="rd-parts">${parts
        .map(
          (part, index) =>
            `<button data-goto="${part.start}"><span class="n">${index + 1}</span><span class="nm">${esc(part.name)}</span><span class="ref">¶${part.start + 1}–${part.end + 1}</span></button>`
        )
        .join('')}</div>
      <div class="rd-brief-foot">${icon('info', 13)}<span>Generated by AI from this lesson and shared with everyone in the course. It updates when the lesson changes.</span></div>
    </div>`;
}

function runBrief() {
  S.briefState = 'running';
  renderBrief();
  setTimeout(() => {
    S.briefState = 'fresh';
    writeStore('brief', true);
    renderBrief();
    requestAnimationFrame(() => {
      layoutCards();
      renderMap();
    });
  }, 1900);
}

/* ======================================================= selection toolbar */

let savedRange = null;
let toolbar = null;

function selectionInNote() {
  const selection = getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  const note = $('#rd-note');
  if (!note.contains(range.commonAncestorContainer)) return null;
  if (!range.toString().trim()) return null;

  return range;
}

const TB_TIPS = {
  ask: ['Ask', 'Any question about this passage'],
  explain: ['Explain', 'What it means here, and why it is here'],
  define: ['Define', 'A short definition in context'],
  highlight: ['Highlight', 'Saved to your notebook'],
  note: ['Add note', 'Highlight it and write your own note'],
  listen: ['Read aloud', 'Listen from this paragraph'],
  copy: ['Copy', 'Copies the text with its ¶ reference']
};

function showToolbar(range) {
  hideToolbar();
  savedRange = range.cloneRange();
  const aiButtons = S.ai
    ? `<button class="b ask" data-tb="ask">${icon('sparkles')}<span>Ask</span></button>
       <button class="b" data-tb="explain">${icon('info')}<span>Explain</span></button>
       <button class="b" data-tb="define">${icon('bookOpen')}<span>Define</span></button>
       <span class="div"></span>`
    : '';
  toolbar = document.createElement('div');
  toolbar.className = 'rd-tb';
  toolbar.setAttribute('role', 'toolbar');
  toolbar.setAttribute('aria-label', 'Selection actions');
  toolbar.innerHTML = `${aiButtons}
    <span class="hl-group" style="display:flex;align-items:center">
      <button class="b icon hl-btn" data-tb="highlight" aria-label="Highlight">${icon('highlighter')}<span class="bar" style="background:${HL[prefs.hl].swatch}"></span><span class="mlabel">Highlight</span></button>
      <span class="rd-tb-colors" hidden>${Object.entries(HL)
        .map(
          ([key, color]) =>
            `<button data-hl="${key}" aria-label="${color.name}" aria-pressed="${key === prefs.hl}" style="background:${color.swatch}"></button>`
        )
        .join('')}</span>
    </span>
    <button class="b icon" data-tb="note" aria-label="Add note">${icon('note')}<span class="mlabel">Note</span></button>
    <button class="b icon" data-tb="listen" aria-label="Read aloud">${icon('volume')}<span class="mlabel">Listen</span></button>
    <button class="b icon" data-tb="copy" aria-label="Copy">${icon('copy')}<span class="mlabel">Copy</span></button>`;
  document.body.append(toolbar);
  document.body.classList.add('has-tb');
  positionFloating(toolbar, range.getBoundingClientRect());

  toolbar.addEventListener('mousedown', (event) => {
    if (!event.target.closest('input')) event.preventDefault();
  });
  toolbar.addEventListener('mouseover', (event) => {
    const button = event.target.closest('[data-tb]');
    $('.rd-tb-tip', toolbar)?.remove();
    if (!button || toolbar.classList.contains('asking')) return;

    const [title, description] = TB_TIPS[button.dataset.tb];
    const tip = document.createElement('div');
    tip.className = 'rd-tb-tip';
    tip.innerHTML = `<b>${title}</b> <span>${description}</span>`;
    tip.style.left = `${button.offsetLeft}px`;
    toolbar.append(tip);
  });
  toolbar.addEventListener('mouseleave', () => $('.rd-tb-tip', toolbar)?.remove());
  const group = $('.hl-group', toolbar);
  group.addEventListener('mouseenter', () => ($('.rd-tb-colors', toolbar).hidden = false));
  group.addEventListener('mouseleave', () => ($('.rd-tb-colors', toolbar).hidden = true));
  toolbar.addEventListener('click', onToolbarClick);
}

function positionFloating(el, rect) {
  const width = el.offsetWidth;
  const height = el.offsetHeight;
  let left = rect.left + rect.width / 2 - width / 2;
  left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
  let top = rect.top - height - 10;
  if (top < 60) top = rect.bottom + 10;
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

function hideToolbar() {
  if (supportsHighlights) CSS.highlights.delete('pending');
  toolbar?.remove();
  toolbar = null;
  document.body.classList.remove('has-tb');
}

function onToolbarClick(event) {
  const swatch = event.target.closest('[data-hl]');
  if (swatch) {
    prefs.hl = swatch.dataset.hl;
    savePrefs();
    addHighlight(prefs.hl);
    return;
  }

  const chip = event.target.closest('[data-chip]');
  if (chip) {
    submitAsk(chip.dataset.chip);
    return;
  }

  if (event.target.closest('.rd-ask-send')) {
    submitAsk($('input', toolbar).value);
    return;
  }

  const button = event.target.closest('[data-tb]');
  if (!button) return;

  const action = button.dataset.tb;
  if (action === 'highlight') addHighlight(prefs.hl);
  if (action === 'note') addHighlight(prefs.hl, { withNote: true });
  if (action === 'explain' || action === 'define') createQuestion(action);
  if (action === 'ask') openAsk();
  if (action === 'listen') {
    const blockIndex = blockIndexOf(savedRange.startContainer);
    clearSelection();
    startListen(blockIndex);
  }
  if (action === 'copy') {
    const anchor = anchorFromRange(savedRange);
    copyText(`“${anchor.exact}” — ${LESSON.title}, ¶${anchor.b + 1}`);
    toast(`Copied with a link to ¶${anchor.b + 1}`);
    clearSelection();
  }
}

function openAsk() {
  const anchor = anchorFromRange(savedRange);
  if (supportsHighlights) CSS.highlights.set('pending', new Highlight(savedRange.cloneRange()));
  toolbar.classList.add('asking');
  toolbar.innerHTML = `
    <div class="rd-ask-row">
      <span class="rd-ask-quote" title="${esc(anchor.exact)}">“${esc(anchor.exact)}”</span>
      <input type="text" placeholder="Ask about this…" aria-label="Ask about the selected text" />
      <button class="rd-ask-send" aria-label="Ask">${icon('send')}</button>
    </div>
    <div class="rd-chips">
      ${[
        'Explain this in simple terms',
        'Give me an example',
        'Why does this matter?',
        'Difference between dropna and fillna?'
      ]
        .map((chip) => `<button class="rd-chip" data-chip="${esc(chip)}">${chip}</button>`)
        .join('')}
    </div>`;
  const rect = savedRange.getBoundingClientRect();
  positionFloating(toolbar, rect);
  const input = $('input', toolbar);
  input.focus();
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') submitAsk(input.value);
    if (event.key === 'Escape') {
      hideToolbar();
      clearSelection();
    }
  });
}

function submitAsk(question) {
  if (!question.trim()) return;

  createQuestion('ask', question.trim());
}

function clearSelection() {
  getSelection()?.removeAllRanges();
  hideToolbar();
}

function stamp() {
  return 'just now';
}

function addHighlight(color, { withNote = false } = {}) {
  const anchor = anchorFromRange(savedRange);
  if (!anchor) return;

  const entry = { id: `h${Date.now()}`, kind: 'highlight', color, note: '', when: stamp(), ...anchor };
  S.entries.push(entry);
  saveEntries();
  const rect = savedRange.getBoundingClientRect();
  clearSelection();
  paintHighlights();
  renderMap();
  renderPanel();
  if (withNote) openNoteEditor(entry, rect);
  else toast('Highlighted · saved to your notebook', 'Undo', () => removeEntry(entry.id));
}

function removeEntry(id) {
  S.entries = S.entries.filter((entry) => entry.id !== id);
  saveEntries();
  $(`[data-card="${id}"]`)?.remove();
  paintHighlights();
  layoutCards();
  renderMap();
  renderPanel();
}

function openNoteEditor(entry, rect) {
  closeFloating();
  const pop = document.createElement('div');
  pop.className = 'rd-note-pop';
  pop.innerHTML = `
    <p class="q" style="border-color:${HL[entry.color]?.swatch || 'var(--pen)'}">${esc(entry.exact)}</p>
    <textarea placeholder="Write a note for yourself…" aria-label="Note">${esc(entry.note || '')}</textarea>
    <div class="acts"><button class="btn btn-outline btn-sm" data-act="cancel">Cancel</button><button class="btn btn-primary btn-sm" data-act="save">Save note</button></div>`;
  document.body.append(pop);
  positionFloating(pop, rect);
  const textarea = $('textarea', pop);
  textarea.focus();
  pop.addEventListener('click', (event) => {
    const act = event.target.closest('[data-act]')?.dataset.act;
    if (!act) return;

    if (act === 'save') {
      entry.note = textarea.value.trim();
      saveEntries();
      renderPanel();
      toast(entry.note ? 'Note saved to your notebook' : 'Highlighted · saved to your notebook');
    }
    pop.remove();
  });
  textarea.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) $('[data-act="save"]', pop).click();
    if (event.key === 'Escape') pop.remove();
  });
}

function closeFloating() {
  $$('.rd-note-pop, .rd-menu').forEach((el) => el.remove());
}

function highlightAt(x, y) {
  let node;
  let offset;
  if (document.caretPositionFromPoint) {
    const position = document.caretPositionFromPoint(x, y);
    if (!position) return null;
    node = position.offsetNode;
    offset = position.offset;
  } else if (document.caretRangeFromPoint) {
    const range = document.caretRangeFromPoint(x, y);
    if (!range) return null;
    node = range.startContainer;
    offset = range.startOffset;
  } else {
    return null;
  }

  return S.entries.find((entry) => {
    const range = rangeOf(entry);
    if (!range) return false;
    try {
      return range.isPointInRange(node, offset) && !(range.endContainer === node && range.endOffset === offset);
    } catch {
      return false;
    }
  });
}

function openEntryMenu(entry, x, y) {
  closeFloating();
  const menu = document.createElement('div');
  menu.className = 'rd-menu';
  const isHighlight = entry.kind === 'highlight';
  menu.innerHTML = isHighlight
    ? `<div class="rd-dots" style="padding:6px 8px 8px">${Object.entries(HL)
        .map(
          ([key, color]) =>
            `<button data-recolor="${key}" aria-label="${color.name}" aria-pressed="${key === entry.color}" style="background:${color.swatch}"></button>`
        )
        .join('')}</div>
       <button data-m="note">${icon('note')}${entry.note ? 'Edit note' : 'Add note'}</button>
       ${S.ai ? `<button data-m="explain">${icon('info')}Explain this</button>` : ''}
       <button data-m="listen">${icon('volume')}Read aloud from here</button>
       <button data-m="remove" class="danger">${icon('trash')}Remove highlight</button>`
    : `<button data-m="card">${icon('question')}Show answer</button>
       <button data-m="remove" class="danger">${icon('trash')}Delete question</button>`;
  document.body.append(menu);
  menu.style.left = `${Math.min(x, window.innerWidth - 210)}px`;
  menu.style.top = `${y + 12}px`;
  menu.addEventListener('click', (event) => {
    const recolor = event.target.closest('[data-recolor]');
    if (recolor) {
      entry.color = recolor.dataset.recolor;
      saveEntries();
      paintHighlights();
      renderMap();
      renderPanel();
      menu.remove();
      return;
    }

    const action = event.target.closest('[data-m]')?.dataset.m;
    if (!action) return;

    menu.remove();
    if (action === 'remove') removeEntry(entry.id);
    if (action === 'note') openNoteEditor(entry, rangeOf(entry).getBoundingClientRect());
    if (action === 'listen') startListen(entry.b);
    if (action === 'card') focusCard(entry.id);
    if (action === 'explain') {
      savedRange = rangeOf(entry);
      createQuestion('explain');
    }
  });
}

/* ============================================================ answers */

function findAnswer(action, exact, question) {
  const lower = exact.toLowerCase();
  if (action === 'ask') {
    const questionLower = (question || '').toLowerCase();
    const askMatch = ASK_ANSWERS.find((answer) => answer.match.some((term) => questionLower.includes(term)));
    if (askMatch) return { text: askMatch.text, key: askMatch.key };

    const termMatch = AI_ANSWERS.find((answer) => answer.match.some((term) => lower.includes(term)));
    if (termMatch) return termMatch.explain;

    return {
      text: `Good question. In this lesson, “${truncate(exact, 60)}” sits in the ${sectionNameFor(exact)} step. The short answer: decide what the data means before you change it, then make the change in one clear line so you can explain it later.`,
      key: 'decide what the data means before you change it'
    };
  }

  const match = AI_ANSWERS.find((answer) => answer.match.some((term) => lower.includes(term)));
  if (match) return match[action];

  if (action === 'define') {
    return {
      text: `“${truncate(exact, 60)}” is used here in its everyday data-cleaning sense. Select a single term, such as NaN, median, object or coerce, for a sharper definition.`,
      key: 'Select a single term'
    };
  }

  return {
    text: `This line is part of the ${sectionNameFor(exact)} step. The lesson is making the point that every cleaning change is a decision about what the data means, so you should be able to say why each row was dropped, filled or rewritten.`,
    key: 'every cleaning change is a decision about what the data means'
  };
}

function sectionNameFor(exact) {
  const blockIndex = S.blocks.findIndex((block, index) => blockText(index).includes(exact.slice(0, 40)));
  return (S.blocks[blockIndex]?.section || 'cleaning').toLowerCase();
}

function truncate(text, length) {
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

function shapeAnswer(answer) {
  let text = answer.text;
  if (prefs.level === 'simple') text = `In short: ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
  if (prefs.length === 'detailed')
    text += ' You will use this directly in “Exercise: Clean the sales data” at the end of this section.';
  return { text, key: answer.key };
}

function createQuestion(action, question) {
  const anchor = anchorFromRange(savedRange);
  if (!anchor) return;

  clearSelection();
  const entry = {
    id: `q${Date.now()}`,
    kind: 'question',
    action,
    question: question || (action === 'define' ? 'Define this' : 'What does this mean here?'),
    when: stamp(),
    streaming: true,
    answer: '',
    ...anchor
  };
  S.entries.push(entry);
  paintHighlights();

  if (S.surface === 'public') {
    entry.locked = true;
    entry.streaming = false;
    renderCard(entry);
    layoutCards();
    return;
  }

  if (prefs.answersIn === 'chat') {
    S.entries = S.entries.filter((item) => item.id !== entry.id);
    paintHighlights();
    openAssistant(entry);
    return;
  }

  renderCard(entry);
  layoutCards();
  renderMap();
  focusCard(entry.id, false);
  const answer = shapeAnswer(findAnswer(action, anchor.exact, entry.question));
  streamInto(entry, answer, () => {
    saveEntries();
    renderPanel();
  });
}

function streamInto(entry, answer, done) {
  const card = $(`[data-card="${entry.id}"]`);
  const target = $('.rd-card-a', card);
  target.innerHTML = '<span class="rd-thinking"><i></i><i></i><i></i></span>';
  const words = answer.text.split(/(\s+)/);
  let index = 0;
  setTimeout(function tick() {
    index = Math.min(words.length, index + 3);
    entry.answer = words.slice(0, index).join('');
    target.innerHTML =
      markKey(esc(entry.answer), answer.key) + (index < words.length ? '<span class="rd-caret"></span>' : '');
    layoutCards();
    if (index < words.length) {
      setTimeout(tick, 28);
      return;
    }

    entry.key = answer.key;
    entry.streaming = false;
    $('.rd-card-meta', card).textContent =
      `${(0.4 + Math.random() * 0.5).toFixed(1)}s · from this lesson · saved to notebook`;
    done?.();
  }, 380);
}

function markKey(html, key) {
  if (!key) return html;

  const safeKey = esc(key);
  const at = html.indexOf(safeKey);
  if (at < 0) return html;

  return `${html.slice(0, at)}<mark>${safeKey}</mark>${html.slice(at + safeKey.length)}`;
}

function cardInner(entry) {
  const label = entryLabel(entry);
  const showQuestion = entry.action === 'ask';
  if (entry.locked) {
    return `
      <div class="rd-card-head"><span class="act">${label}</span><span class="p">¶${entry.b + 1}</span><span class="sp"></span><button class="btn-ghost-icon" data-card-act="delete" aria-label="Dismiss">${icon('x')}</button></div>
      <p class="rd-card-quote">“${esc(entry.exact)}”</p>
      <p class="rd-card-a">Sign in to ask about this lesson. Explain, Define and Ask answer from this lesson's content, and your questions are kept in your notebook.</p>
      <div class="rd-card-foot"><button class="btn btn-primary btn-sm" data-action="sign-in">Sign in</button><span style="font-size:12px;color:var(--muted-foreground)">Free for enrolled learners</span></div>`;
  }

  const followUps = (entry.followUps || [])
    .map((item) => `<p class="rd-card-q">${esc(item.q)}</p><p class="rd-card-a">${markKey(esc(item.a), item.key)}</p>`)
    .join('');
  return `
    <div class="rd-card-head">
      <span class="act">${label}</span><span class="p">¶${entry.b + 1}</span><span class="when">· ${esc(entry.when)}</span><span class="sp"></span>
      <button class="btn-ghost-icon" data-card-act="menu" aria-label="More">${icon('more')}</button>
    </div>
    <p class="rd-card-quote">“${esc(entry.exact)}”</p>
    ${showQuestion ? `<p class="rd-card-q">${esc(entry.question)}</p>` : ''}
    <p class="rd-card-a">${entry.streaming ? '' : markKey(esc(entry.answer || ''), entry.key)}</p>
    ${followUps}
    <div class="rd-card-meta">${entry.streaming ? '' : 'From this lesson · saved to notebook'}</div>
    <div class="rd-card-foot">
      <input type="text" placeholder="Ask a follow-up…" aria-label="Ask a follow-up" data-follow />
      <button class="link" data-card-act="chat">Open in chat ${icon('chevronRight', 12, 'style="vertical-align:-2px"')}</button>
    </div>`;
}

function renderCard(entry) {
  const card = document.createElement('div');
  card.className = 'rd-card';
  card.dataset.card = entry.id;
  card.dataset.skip = '';
  card.innerHTML = cardInner(entry);
  card.addEventListener('click', (event) => onCardClick(event, entry));
  card.addEventListener('keydown', (event) => {
    const input = event.target.closest('[data-follow]');
    if (!input || event.key !== 'Enter' || !input.value.trim()) return;

    askFollowUp(entry, input.value.trim());
    input.value = '';
  });
  card.addEventListener('mouseenter', () => card.classList.add('focus'));
  card.addEventListener('mouseleave', () => card.classList.remove('focus'));
  $('#rd-margin').append(card);
}

function askFollowUp(entry, question) {
  const answer = shapeAnswer(findAnswer('ask', entry.exact, question));
  entry.followUps = entry.followUps || [];
  entry.followUps.push({ q: question, a: answer.text, key: answer.key });
  saveEntries();
  const card = $(`[data-card="${entry.id}"]`);
  card.innerHTML = cardInner(entry);
  layoutCards();
  renderPanel();
}

function onCardClick(event, entry) {
  const action = event.target.closest('[data-card-act]')?.dataset.cardAct;
  if (action === 'delete') removeEntry(entry.id);
  if (action === 'chat') openAssistant(entry);
  if (action === 'menu') {
    closeFloating();
    const rect = event.target.closest('button').getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'rd-menu';
    menu.innerHTML = `<button data-m="chat">${icon('sparkles')}Continue in chat</button><button data-m="copy">${icon('copy')}Copy answer</button><button data-m="listen">${icon('volume')}Read answer aloud</button><button data-m="delete" class="danger">${icon('trash')}Delete</button>`;
    document.body.append(menu);
    menu.style.left = `${Math.min(rect.left - 150, window.innerWidth - 210)}px`;
    menu.style.top = `${rect.bottom + 4}px`;
    menu.addEventListener('click', (menuEvent) => {
      const choice = menuEvent.target.closest('[data-m]')?.dataset.m;
      menu.remove();
      if (choice === 'chat') openAssistant(entry);
      if (choice === 'copy') {
        copyText(entry.answer);
        toast('Answer copied');
      }
      if (choice === 'listen') speakText(entry.answer);
      if (choice === 'delete') removeEntry(entry.id);
    });
    return;
  }

  if (event.target.closest('input, button')) return;

  scrollToBlock(entry.b);
}

function useInlineCards() {
  if (isMobile()) return true;

  const main = $('#cs-main');
  const needed =
    44 + parseInt(getComputedStyle(document.documentElement).getPropertyValue('--rd-measure'), 10) + 300 + 48;
  return main.clientWidth < needed;
}

function layoutCards() {
  if (S.view === 'teacher') return layoutInsights();

  const stage = $('#rd-stage');
  const margin = $('#rd-margin');
  if (!stage || !margin) return;

  const inline = useInlineCards();
  const cards = $$('.rd-card');
  const questions = S.entries.filter((entry) => entry.kind === 'question' && !entry.orphaned);
  stage.classList.toggle('has-margin', !inline && questions.length > 0);

  if (inline) {
    cards.forEach((card) => {
      const entry = S.entries.find((item) => item.id === card.dataset.card);
      if (!entry || entry.orphaned) return card.remove();

      card.classList.add('inline');
      card.style.top = '';
      if (card.dataset.inlineFor === String(entry.eb) && card.parentElement !== margin) return;

      const block = S.blocks[entry.eb].el;
      card.dataset.inlineFor = entry.eb;
      if (block.tagName === 'LI') block.append(card);
      else block.after(card);
    });
    return;
  }

  const noteTop = $('#rd-note').getBoundingClientRect().top;
  let lastBottom = -Infinity;
  const placed = questions
    .map((entry) => {
      const card = $(`[data-card="${entry.id}"]`);
      const range = rangeOf(entry);
      if (!card || !range) return null;

      const rects = range.getClientRects();
      const top = (rects[0] || range.getBoundingClientRect()).top - noteTop - 6;
      return { card, top };
    })
    .filter(Boolean)
    .sort((a, b) => a.top - b.top);

  placed.forEach(({ card, top }) => {
    if (card.parentElement !== margin) margin.append(card);
    delete card.dataset.inlineFor;
    card.classList.remove('inline');
    const finalTop = Math.max(top, lastBottom + 10);
    card.style.top = `${finalTop}px`;
    lastBottom = finalTop + card.offsetHeight;
  });
}

function focusCard(id, scroll = true) {
  const card = $(`[data-card="${id}"]`);
  if (!card) return;

  $$('.rd-card.focus').forEach((el) => el.classList.remove('focus'));
  card.classList.add('focus');
  if (scroll) card.scrollIntoView({ block: 'center', behavior: 'smooth' });
  setTimeout(() => card.classList.remove('focus'), 1800);
}

function renderAllCards() {
  $$('.rd-card').forEach((card) => card.remove());
  S.entries.filter((entry) => entry.kind === 'question' && !entry.orphaned).forEach(renderCard);
  layoutCards();
}

/* ============================================================== panels */

function openPanel(kind) {
  S.panel = kind;
  document.body.classList.add('sp-open');
  renderPanel();
  setTimeout(() => {
    layoutCards();
    renderMap();
  }, 260);
}

function closePanel() {
  S.panel = null;
  document.body.classList.remove('sp-open');
  setTimeout(() => {
    layoutCards();
    renderMap();
  }, 260);
}

function renderPanel() {
  const panel = $('#sp');
  if (!panel || !S.panel) return;

  if (S.panel === 'notebook') panel.innerHTML = notebookPanel();
  if (S.panel === 'assistant') panel.innerHTML = assistantPanel();
}

function lessonEntries() {
  return [...S.entries].sort((a, b) => {
    if (a.orphaned !== b.orphaned) return a.orphaned ? 1 : -1;
    return (a.b ?? 0) - (b.b ?? 0) || (a.s ?? 0) - (b.s ?? 0);
  });
}

function notebookItem(entry, { inLesson = true } = {}) {
  const ref = entry.orphaned ? '' : `<span class="p">¶${(entry.b ?? entry.p - 1) + 1}</span>`;
  const remove = inLesson
    ? `<button class="btn-ghost-icon" data-nb-remove="${entry.id}" aria-label="Delete" style="width:22px;height:22px">${icon('trash', 13)}</button>`
    : '';
  if (entry.kind === 'question') {
    return `<div class="nb-item" data-nb-goto="${inLesson ? entry.id : ''}">
      <div class="nb-meta"><span class="kind q">${entryLabel(entry)}</span>${ref}<span>· ${esc(entry.when)}</span><span class="sp"></span>${remove}</div>
      <p class="nb-q-quote">“${esc(truncate(entry.exact, 90))}”</p>
      <p class="nb-question">${esc(entry.question)}</p>
      <p class="nb-answer">${esc(entry.answer || '…')}</p>
    </div>`;
  }

  const color = HL[entry.color]?.swatch || HL.yellow.swatch;
  const note = entry.note
    ? `<div class="nb-note">${icon('note')}<span>${esc(entry.note)}</span></div>`
    : inLesson && !entry.orphaned
      ? `<button class="nb-add-note" data-nb-note="${entry.id}">+ Add a note</button>`
      : '';
  const orphan = entry.orphaned
    ? `<div class="nb-orphan">${icon('alert')}<span>This passage changed after you highlighted it. Your original text is kept here.</span></div>`
    : '';
  return `<div class="nb-item ${entry.orphaned ? 'orphan' : ''}" data-nb-goto="${inLesson && !entry.orphaned ? entry.id : ''}">
    <div class="nb-meta"><span class="kind">Highlight</span>${ref}<span>· ${esc(entry.when)}</span><span class="sp"></span>${remove}</div>
    <p class="nb-quote"><span style="background:color-mix(in oklab, ${color} 55%, transparent)">${esc(entry.exact)}</span></p>
    ${note}${orphan}
  </div>`;
}

function notebookPanel() {
  const entries = lessonEntries();
  const questions = entries.filter((entry) => entry.kind === 'question');
  const highlights = entries.filter((entry) => entry.kind === 'highlight');
  const visible = S.nbTab === 'questions' ? questions : S.nbTab === 'highlights' ? highlights : entries;
  const subtitle = `${questions.length} question${questions.length === 1 ? '' : 's'} · ${highlights.length} highlight${highlights.length === 1 ? '' : 's'}`;

  let list;
  if (S.nbScope === 'course') {
    const thisLesson = visible.length
      ? `<div class="sp-group">${esc(LESSON.title)} · this lesson</div>${visible.map((entry) => notebookItem(entry)).join('')}`
      : '';
    const others = COURSE_NOTEBOOK.map((group) => {
      const groupEntries = group.entries.filter(
        (entry) =>
          S.nbTab === 'all' || (S.nbTab === 'questions' ? entry.kind === 'question' : entry.kind === 'highlight')
      );
      if (!groupEntries.length) return '';
      return `<div class="sp-group" style="margin-top:16px">${esc(group.lesson)}</div>${groupEntries.map((entry) => notebookItem(entry, { inLesson: false })).join('')}`;
    }).join('');
    list = thisLesson + others;
  } else if (!visible.length) {
    list = `<div class="nb-empty"><span class="ic">${icon('highlighter')}</span><span class="t">${S.nbTab === 'questions' ? 'No questions yet' : 'Nothing saved yet'}</span><span>Select any text in the lesson to highlight it${S.ai ? ', or ask Explain, Define or your own question' : ''}. Everything you save lands here.</span></div>`;
  } else {
    list = visible.map((entry) => notebookItem(entry)).join('');
  }

  const footer =
    S.surface === 'public'
      ? `<div class="sp-foot" style="display:block;line-height:1.45">These live in this browser only. <a href="#" data-action="sign-in" style="margin:0;color:var(--pen)">Sign in</a> to keep them on every device.</div>`
      : `<div class="sp-foot">${icon('lock')}<span>Only you can see your notebook</span><a href="notebook.html">Open full notebook</a></div>`;

  return `
    <div class="sp-head">
      <div><div class="t">Notebook</div><div class="s">${subtitle}</div></div>
      <div class="acts">
        <button class="btn-ghost-icon" data-action="nb-copy" aria-label="Copy as Markdown" title="Copy as Markdown">${icon('copy')}</button>
        <button class="btn-ghost-icon" data-action="nb-download" aria-label="Download Markdown" title="Download .md">${icon('download')}</button>
        <button class="btn-ghost-icon" data-action="close-panel" aria-label="Close">${icon('x')}</button>
      </div>
    </div>
    <div class="sp-tools">
      ${S.surface === 'course' ? `<div class="rd-seg sm" style="font-size:12px"><button data-nb-scope="lesson" aria-pressed="${S.nbScope === 'lesson'}">This lesson</button><button data-nb-scope="course" aria-pressed="${S.nbScope === 'course'}">Whole course</button></div>` : ''}
      <div class="sp-tabs">
        <button data-nb-tab="all" aria-pressed="${S.nbTab === 'all'}">All<span class="n">${entries.length}</span></button>
        <button data-nb-tab="questions" aria-pressed="${S.nbTab === 'questions'}">Questions<span class="n">${questions.length}</span></button>
        <button data-nb-tab="highlights" aria-pressed="${S.nbTab === 'highlights'}">Highlights<span class="n">${highlights.length}</span></button>
      </div>
    </div>
    <div class="sp-list">${list}</div>
    ${footer}`;
}

let chatEntry = null;

function openAssistant(entry) {
  chatEntry = entry || null;
  openPanel('assistant');
}

function assistantPanel() {
  let body;
  if (chatEntry) {
    const answer =
      chatEntry.answer || shapeAnswer(findAnswer(chatEntry.action, chatEntry.exact, chatEntry.question)).text;
    body = `
      <div class="chat-user"><blockquote>“${esc(truncate(chatEntry.exact, 140))}”</blockquote>${esc(chatEntry.question)}</div>
      <div class="chat-ai">${esc(answer)}<br><br>Want me to check your understanding? I can give you a two-question quiz on ${esc(sectionNameFor(chatEntry.exact))} before you move on.<br><span class="src">${icon('lesson', 12)}${esc(LESSON.title)} · ¶${chatEntry.b + 1}</span></div>`;
  } else {
    body = `<div class="chat-empty">Ask me anything about this course: get explanations, quiz yourself, or summarise what you're reading.</div>
      <div style="display:grid;gap:6px">${[
        'Explain this lesson',
        'Quiz me on this',
        'Summarize this section',
        'What should I review next?'
      ]
        .map((label) => `<button class="btn btn-outline btn-sm" style="justify-content:flex-start">${label}</button>`)
        .join('')}</div>`;
  }
  return `
    <div class="sp-head"><div><div class="t" style="display:flex;align-items:center;gap:6px">${icon('sparkles', 15, 'style="color:var(--primary)"')}Assistant</div><div class="s">${COURSE.title}</div></div>
      <div class="acts"><button class="btn-ghost-icon" data-action="close-panel" aria-label="Close">${icon('x')}</button></div></div>
    <div class="chat">${body}</div>
    <div class="chat-input"><textarea rows="1" placeholder="Ask a question…"></textarea><button class="rd-ask-send" aria-label="Send" style="background:var(--primary)">${icon('send')}</button></div>
    <div style="padding:0 16px 12px;font-size:11.5px;color:var(--muted-foreground)">32 of 50 tutor messages left this month</div>`;
}

function notebookMarkdown() {
  const lines = [`# Notebook — ${LESSON.title}`, `_${COURSE.title}_`, ''];
  lessonEntries().forEach((entry) => {
    const ref = entry.orphaned ? '(passage changed)' : `¶${entry.b + 1}`;
    if (entry.kind === 'highlight') {
      lines.push(`> ${entry.exact}`, `— ${ref}${entry.note ? ` · Note: ${entry.note}` : ''}`, '');
    } else {
      lines.push(
        `**${entryLabel(entry)} ${ref}:** “${entry.exact}”`,
        entry.action === 'ask' ? `Q: ${entry.question}` : '',
        `A: ${entry.answer}`,
        ''
      );
    }
  });
  return lines.filter((line, index, all) => !(line === '' && all[index - 1] === '')).join('\n');
}

/* =========================================================== settings */

function openSettings(anchorEl) {
  if ($('.rd-pop')) return closeSettings();

  const pop = document.createElement('div');
  pop.className = 'rd-pop';
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-label', 'Reading settings');
  pop.dataset.tab = 'look';
  document.body.append(pop);
  if (isMobile()) {
    const backdrop = document.createElement('div');
    backdrop.className = 'rd-sheet-backdrop';
    backdrop.addEventListener('click', closeSettings);
    document.body.append(backdrop);
  }
  renderSettings(pop);
  const rect = anchorEl.getBoundingClientRect();
  pop.style.top = `${rect.bottom + 8}px`;
  pop.style.left = `${Math.max(12, Math.min(rect.right - pop.offsetWidth, window.innerWidth - pop.offsetWidth - 12))}px`;
  pop.addEventListener('click', onSettingsClick);
  pop.addEventListener('input', onSettingsInput);
}

function closeSettings() {
  $('.rd-pop')?.remove();
  $('.rd-sheet-backdrop')?.remove();
}

function seg(name, options, small = true) {
  return `<div class="rd-seg ${small ? 'sm' : ''}">${options
    .map(
      ([value, label]) =>
        `<button data-pref="${name}" data-v="${value}" aria-pressed="${prefs[name] === value}">${label}</button>`
    )
    .join('')}</div>`;
}

function renderSettings(pop) {
  const tab = pop.dataset.tab;
  const tabs = [['look', 'Look'], ['text', 'Text'], ...(S.ai ? [['answers', 'Answers']] : [])];
  let body = '';
  if (tab === 'look') {
    body = `
      <div class="rd-field stack"><span class="lbl">Theme</span><div class="rd-themes">${Object.entries(THEMES)
        .map(
          ([key, theme]) =>
            `<button class="rd-theme" data-pref="theme" data-v="${key}" aria-pressed="${prefs.theme === key}"><span class="sw" style="background:${theme.bg};color:${theme.fg}">Aa</span>${theme.name}</button>`
        )
        .join('')}</div></div>
      <div class="rd-field"><span class="lbl">Pen</span><div class="rd-dots">${Object.entries(PEN)
        .map(
          ([key, pen]) =>
            `<button data-pref="pen" data-v="${key}" aria-label="${pen.name}" aria-pressed="${prefs.pen === key}" style="background:${pen.value}"></button>`
        )
        .join('')}<span class="nm">${PEN[prefs.pen].name}</span></div></div>
      <div class="rd-field"><span class="lbl">Highlighter</span><div class="rd-dots">${Object.entries(HL)
        .map(
          ([key, color]) =>
            `<button data-pref="hl" data-v="${key}" aria-label="${color.name}" aria-pressed="${prefs.hl === key}" style="background:${color.swatch}"></button>`
        )
        .join('')}<span class="nm">${HL[prefs.hl].name}</span></div></div>
      <div class="rd-toggles">
        <button class="rd-toggle" data-toggle="numbers" aria-pressed="${prefs.numbers}">${icon('hash')}Numbers</button>
        <button class="rd-toggle desktop-only" data-toggle="map" aria-pressed="${prefs.map}">${icon('map')}Map</button>
        <button class="rd-toggle" data-toggle="focus" aria-pressed="${document.body.classList.contains('focus')}">${icon('focus')}Focus</button>
        <button class="rd-toggle" data-toggle="listen" aria-pressed="${Boolean(S.listen)}">${icon('headphones')}Listen</button>
      </div>`;
  }
  if (tab === 'text') {
    body = `
      <div class="rd-field stack"><span class="lbl">Typeface</span><div class="rd-faces">${Object.entries(FACES)
        .map(
          ([key, face]) =>
            `<button class="rd-face" data-pref="face" data-v="${key}" aria-pressed="${prefs.face === key}" style="font-family:${face.stack}"><span class="ag">Ag</span><span class="nm">${face.name}</span></button>`
        )
        .join('')}</div></div>
      <div class="rd-field"><span class="lbl">Size</span><div class="rd-slider"><button data-size="-1" aria-label="Smaller">−</button><input type="range" min="14" max="24" step="1" value="${prefs.size}" data-range="size" aria-label="Text size" /><button data-size="1" aria-label="Larger">+</button><span class="v">${prefs.size}</span></div></div>
      <div class="rd-field"><span class="lbl">Spacing</span>${seg('spacing', [
        ['snug', 'Snug'],
        ['even', 'Even'],
        ['airy', 'Airy']
      ])}</div>
      <div class="rd-field"><span class="lbl">Width</span>${seg('width', [
        ['narrow', 'Narrow'],
        ['even', 'Even'],
        ['wide', 'Wide']
      ])}</div>
      <div class="rd-field"><span class="lbl">Align</span>${seg('align', [
        ['left', 'Left'],
        ['justify', 'Justified']
      ])}</div>
      <div class="rd-field"><span class="lbl">Paragraphs</span>${seg('paras', [
        ['spaced', 'Spaced'],
        ['indented', 'Indented']
      ])}</div>
      <button class="rd-reset" data-reset-text>${icon('reset')}Reset text settings</button>`;
  }
  if (tab === 'answers') {
    body = `
      <div class="rd-field"><span class="lbl">Length</span>${seg('length', [
        ['brief', 'Brief'],
        ['detailed', 'Detailed']
      ])}</div>
      <div class="rd-field"><span class="lbl">Level</span>${seg('level', [
        ['simple', 'Simple'],
        ['standard', 'Standard'],
        ['expert', 'Expert']
      ])}</div>
      <div class="rd-field"><span class="lbl">Show in</span>${seg('answersIn', [
        ['margin', 'Margin'],
        ['chat', 'Chat panel']
      ])}</div>
      <div class="rd-field"><span class="lbl">Lesson brief</span>${seg('brief', [
        [true, 'Show'],
        [false, 'Hide']
      ])}</div>
      <div class="rd-quota">Explain, Define and Ask use your course's AI Tutor allowance. A question and its follow-ups count once.<div class="rd-bar"><span style="width:36%"></span></div><div style="margin-top:6px">18 of 50 used this month</div></div>`;
  }
  pop.innerHTML = `
    <div class="rd-seg">${tabs.map(([key, label]) => `<button data-tab="${key}" aria-pressed="${tab === key}">${label}</button>`).join('')}</div>
    <div class="rd-pop-body">${body}</div>
    <div class="rd-saved">${S.surface === 'public' ? 'Saved in this browser' : 'Saved to your profile · follows you on every device'}</div>`;
}

function onSettingsClick(event) {
  const pop = $('.rd-pop');
  const tab = event.target.closest('[data-tab]');
  if (tab) {
    pop.dataset.tab = tab.dataset.tab;
    renderSettings(pop);
    return;
  }

  const prefButton = event.target.closest('[data-pref]');
  if (prefButton) {
    const raw = prefButton.dataset.v;
    prefs[prefButton.dataset.pref] = raw === 'true' ? true : raw === 'false' ? false : raw;
    savePrefs();
    applyPrefs();
    if (prefButton.dataset.pref === 'brief') renderTop();
    renderSettings(pop);
    return;
  }

  const toggle = event.target.closest('[data-toggle]');
  if (toggle) {
    const key = toggle.dataset.toggle;
    if (key === 'focus') toggleFocus();
    else if (key === 'listen') S.listen ? stopListen() : startListen(S.current);
    else {
      prefs[key] = !prefs[key];
      savePrefs();
      applyPrefs();
    }
    renderSettings(pop);
    return;
  }

  const sizeStep = event.target.closest('[data-size]');
  if (sizeStep) {
    prefs.size = Math.max(14, Math.min(24, prefs.size + Number(sizeStep.dataset.size)));
    savePrefs();
    applyPrefs();
    renderSettings(pop);
    return;
  }

  if (event.target.closest('[data-reset-text]')) {
    ['face', 'size', 'spacing', 'width', 'align', 'paras'].forEach((key) => (prefs[key] = DEFAULT_PREFS[key]));
    savePrefs();
    applyPrefs();
    renderSettings(pop);
  }
}

function onSettingsInput(event) {
  if (event.target.dataset.range !== 'size') return;

  prefs.size = Number(event.target.value);
  $('.rd-slider .v').textContent = prefs.size;
  savePrefs();
  applyPrefs();
}

/* =============================================================== focus */

function toggleFocus(force) {
  const on = force ?? !document.body.classList.contains('focus');
  document.body.classList.toggle('focus', on);
  if (on) closePanel();
  setTimeout(() => {
    layoutCards();
    renderMap();
  }, 230);
}

/* ============================================================== listen */

function sentencesOf(blockIndex) {
  const block = S.blocks[blockIndex];
  if (block.type === 'code') return [{ text: 'Code example.', start: 0, end: 0, silentRange: true }];
  if (block.type === 'table')
    return [
      { text: 'A table comparing raw store names with their cleaned values.', start: 0, end: 0, silentRange: true }
    ];

  const text = blockText(blockIndex);
  const sentences = [];
  const pattern = /[^.!?]+[.!?]+["”’)]*\s*|[^.!?]+$/g;
  let match;
  while ((match = pattern.exec(text))) {
    const trimmed = match[0].trim();
    if (!trimmed) continue;
    const start = match.index + match[0].indexOf(trimmed);
    sentences.push({ text: trimmed, start, end: start + trimmed.length });
  }
  return sentences;
}

function startListen(fromBlock = 0) {
  stopListen(false);
  S.listen = { block: Math.max(0, fromBlock), sentence: 0, playing: true, rate: 1, token: 0 };
  document.body.classList.add('listening');
  renderPlayer();
  speakCurrent();
}

function speakCurrent() {
  const listen = S.listen;
  if (!listen) return;

  if (listen.block >= S.blocks.length) {
    stopListen();
    toast('Finished reading this lesson aloud');
    return;
  }

  const sentences = sentencesOf(listen.block);
  if (listen.sentence >= sentences.length) {
    listen.block += 1;
    listen.sentence = 0;
    renderPlayer();
    return speakCurrent();
  }

  const sentence = sentences[listen.sentence];
  paintSpoken(listen.block, sentence);
  const token = ++listen.token;
  const next = () => {
    if (!S.listen || token !== S.listen.token || !S.listen.playing) return;
    S.listen.sentence += 1;
    speakCurrent();
  };

  if ('speechSynthesis' in window && !params.has('silent')) {
    const utterance = new SpeechSynthesisUtterance(sentence.text);
    utterance.rate = listen.rate;
    utterance.lang = 'en-GB';
    utterance.onend = next;
    utterance.onerror = () => setTimeout(next, timedDuration(sentence.text));
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  } else {
    setTimeout(next, timedDuration(sentence.text));
  }
}

function timedDuration(text) {
  return (text.split(/\s+/).length / (2.7 * (S.listen?.rate || 1))) * 1000;
}

function paintSpoken(blockIndex, sentence) {
  const el = S.blocks[blockIndex].el;
  const rect = el.getBoundingClientRect();
  if (rect.top < 80 || rect.bottom > window.innerHeight - 120) {
    window.scrollTo({ top: window.scrollY + rect.top - window.innerHeight * 0.3, behavior: 'smooth' });
  }
  if (!supportsHighlights) return;

  if (sentence.silentRange) {
    const range = document.createRange();
    range.selectNodeContents(el);
    CSS.highlights.set('tts', new Highlight(range));
    return;
  }

  const [startNode, startOffset] = positionAt(el, sentence.start);
  const [endNode, endOffset] = positionAt(el, sentence.end);
  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  CSS.highlights.set('tts', new Highlight(range));
  $('.rd-player [data-pl-info]') && updatePlayerInfo();
}

function stopListen(rerender = true) {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  if (S.listen) S.listen.token += 1;
  S.listen = null;
  document.body.classList.remove('listening');
  if (supportsHighlights) CSS.highlights.delete('tts');
  $('.rd-player')?.remove();
  if (rerender && $('.rd-pop')) renderSettings($('.rd-pop'));
}

function renderPlayer() {
  let player = $('.rd-player');
  if (!player) {
    player = document.createElement('div');
    player.className = 'rd-player';
    player.setAttribute('role', 'region');
    player.setAttribute('aria-label', 'Read aloud');
    document.body.append(player);
    player.addEventListener('click', onPlayerClick);
  }
  const listen = S.listen;
  player.innerHTML = `
    <button class="play" data-pl="toggle" aria-label="${listen.playing ? 'Pause' : 'Play'}">${icon(listen.playing ? 'pause' : 'play')}</button>
    <button class="btn-ghost-icon" data-pl="prev" aria-label="Previous paragraph">${icon('skipBack')}</button>
    <button class="btn-ghost-icon" data-pl="next" aria-label="Next paragraph">${icon('skipForward')}</button>
    <div class="info" data-pl-info></div>
    <button class="speed" data-pl="speed" aria-label="Playback speed">${listen.rate}×</button>
    <button class="btn-ghost-icon" data-pl="close" aria-label="Stop reading">${icon('x')}</button>`;
  updatePlayerInfo();
}

function updatePlayerInfo() {
  const info = $('[data-pl-info]');
  if (!info || !S.listen) return;

  const block = S.blocks[Math.min(S.listen.block, S.blocks.length - 1)];
  const percent = ((S.listen.block + 1) / S.blocks.length) * 100;
  const voice =
    'speechSynthesis' in window && !params.has('silent')
      ? 'Device voice · English'
      : 'Timed preview (no voice on this device)';
  info.innerHTML = `<div class="t">¶${S.listen.block + 1} of ${S.blocks.length} · ${esc(block.section)}</div><div class="d">${voice}</div><div class="rd-bar"><span style="width:${percent}%"></span></div>`;
}

function onPlayerClick(event) {
  const action = event.target.closest('[data-pl]')?.dataset.pl;
  const listen = S.listen;
  if (!action || !listen) return;

  if (action === 'close') return stopListen();
  if (action === 'toggle') {
    listen.playing = !listen.playing;
    if (listen.playing) speakCurrent();
    else {
      listen.token += 1;
      if ('speechSynthesis' in window) speechSynthesis.cancel();
    }
  }
  if (action === 'prev' || action === 'next') {
    listen.block = Math.max(0, Math.min(S.blocks.length - 1, listen.block + (action === 'next' ? 1 : -1)));
    listen.sentence = 0;
    if (listen.playing) speakCurrent();
  }
  if (action === 'speed') {
    const rates = [0.8, 1, 1.25, 1.5, 2];
    listen.rate = rates[(rates.indexOf(listen.rate) + 1) % rates.length];
    if (listen.playing) speakCurrent();
  }
  renderPlayer();
}

function speakText(text) {
  if (!('speechSynthesis' in window)) return toast('Read aloud is not available in this browser');

  speechSynthesis.cancel();
  speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

/* ============================================================ insights */

function renderInsightsTop() {
  return `
    <div class="ins-strip">
      <div><div class="k">Learners who opened it</div><div class="v">${INSIGHTS.readers}<span style="font-size:13px;font-weight:400;color:var(--muted-foreground)"> / ${INSIGHTS.learners}</span></div><div class="s">80% of enrolled learners</div></div>
      <div><div class="k">Reached the end</div><div class="v">${INSIGHTS.finishRate}%</div><div class="s">Most drop-off in Fixing data types</div></div>
      <div><div class="k">Typical reading time</div><div class="v">${INSIGHTS.avgRead}</div><div class="s">Estimate: ${readingMinutes()} min</div></div>
      <div><div class="k">Questions asked</div><div class="v">53</div><div class="s">32% in one paragraph (¶13)</div></div>
    </div>
    <div class="ins-legend"><span><span class="sw" style="background:oklch(0.72 0.16 55)"></span>Highlighted often</span><span><span class="sw" style="background:var(--pen)"></span>Asked about often</span><span style="margin-left:auto">Last 30 days</span></div>
    <div class="ins-note">${icon('eyeOff')}<span>Aggregated and anonymous. A passage only appears once 3 or more learners have marked it, and individual learners are never shown.</span></div>`;
}

function renderInsightsMargin() {
  const margin = $('#rd-margin');
  margin.innerHTML = '';
  const maxSignal = Math.max(...Object.values(INSIGHTS.blocks).map((signal) => signal.hl + signal.q * 1.5));
  Object.entries(INSIGHTS.blocks).forEach(([blockIndex, signal]) => {
    const block = S.blocks[blockIndex];
    if (!block) return;

    const heat = (signal.hl + signal.q * 1.5) / maxSignal;
    block.el.dataset.heat = '';
    block.el.style.setProperty('--heat', (0.15 + heat * 0.85).toFixed(2));
    if (signal.q >= 3) {
      const dot = document.createElement('span');
      dot.className = 'ins-qdot';
      dot.dataset.skip = '';
      dot.title = `${signal.q} learners asked about this`;
      block.el.prepend(dot);
    }
  });

  const strongest = Object.entries(INSIGHTS.blocks)
    .filter(([, signal]) => signal.q >= 3 || signal.hl >= 12)
    .sort((a, b) => b[1].q - a[1].q);
  strongest.forEach(([blockIndex, signal]) => {
    const card = document.createElement('div');
    card.className = 'ins-card';
    card.dataset.skip = '';
    card.dataset.insB = blockIndex;
    const top = signal.top ? `<ul>${signal.top.map((question) => `<li>${esc(question)}</li>`).join('')}</ul>` : '';
    const suggestion =
      signal.q >= 9
        ? `<div class="act"><button class="btn btn-outline btn-sm" style="height:28px;font-size:12px">${icon('pencil')}Rewrite with AI</button></div>`
        : '';
    card.innerHTML = `<div class="nums"><span class="hl">${icon('highlighter')}${signal.hl}</span>${signal.q ? `<span class="qq">${icon('question')}${signal.q} questions</span>` : ''}<span style="margin-left:auto;font-weight:400;color:var(--muted-foreground);font-family:'Geist Mono',monospace;font-size:11px">¶${Number(blockIndex) + 1}</span></div>${top}${suggestion}`;
    margin.append(card);
  });
  layoutInsights();
}

function layoutInsights() {
  const stage = $('#rd-stage');
  const inline = useInlineCards();
  stage.classList.toggle('has-margin', !inline);
  const noteTop = $('#rd-note').getBoundingClientRect().top;
  let lastBottom = -Infinity;
  $$('.ins-card')
    .sort((a, b) => a.dataset.insB - b.dataset.insB)
    .forEach((card) => {
      const block = S.blocks[card.dataset.insB].el;
      if (inline) {
        card.classList.add('inline');
        if (block.tagName === 'LI') block.append(card);
        else if (block.nextElementSibling !== card) block.after(card);
        return;
      }

      card.classList.remove('inline');
      if (card.parentElement !== $('#rd-margin')) $('#rd-margin').append(card);
      const top = Math.max(block.getBoundingClientRect().top - noteTop, lastBottom + 10);
      card.style.top = `${top}px`;
      lastBottom = top + card.offsetHeight;
    });
}

/* ============================================================== helpers */

function scrollToBlock(blockIndex) {
  const block = S.blocks[blockIndex];
  if (!block) return;

  const top = block.el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.3;
  window.scrollTo({ top, behavior: 'smooth' });
  block.el.classList.remove('flash');
  void block.el.offsetWidth;
  block.el.classList.add('flash');
  if (isMobile() && S.panel) closePanel();
}

function copyText(text) {
  navigator.clipboard?.writeText(text).catch(() => {
    /* clipboard can be blocked on file:// or without permission */
  });
}

let toastTimer;

function toast(message, actionLabel, onAction) {
  $('.toast')?.remove();
  clearTimeout(toastTimer);
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.innerHTML = `${icon('circleCheck')}<span>${esc(message)}</span>${actionLabel ? `<button class="btn btn-ghost btn-sm" style="height:26px;padding:0 8px;margin-left:4px">${actionLabel}</button>` : ''}`;
  document.body.append(el);
  if (actionLabel) {
    $('button', el).addEventListener('click', () => {
      onAction();
      el.remove();
    });
  }
  toastTimer = setTimeout(() => el.remove(), 3200);
}

/* ======================================================== proto panel */

function renderProto() {
  const wrap = document.createElement('div');
  wrap.className = 'proto';
  const link = (overrides) => {
    const next = new URLSearchParams(location.search);
    Object.entries(overrides).forEach(([key, value]) => (value === null ? next.delete(key) : next.set(key, value)));
    return `?${next.toString()}`;
  };
  const segRow = (label, key, options, current) =>
    `<div class="proto-row"><span class="l">${label}</span><div class="proto-seg">${options
      .map(
        ([value, text]) =>
          `<button aria-pressed="${current === value}" onclick="location.search='${link({ [key]: value })}'">${text}</button>`
      )
      .join('')}</div></div>`;
  const isDark = document.documentElement.classList.contains('dark');
  const learnerRows =
    S.view === 'learner'
      ? `${segRow(
          'Learner',
          'state',
          [
            ['first', 'First visit'],
            ['returning', 'Returning']
          ],
          S.learner
        )}
         ${
           S.surface === 'course'
             ? segRow(
                 'AI in this org',
                 'ai',
                 [
                   ['on', 'On'],
                   ['off', 'Off']
                 ],
                 S.ai ? 'on' : 'off'
               )
             : ''
         }
         ${
           S.surface === 'course'
             ? segRow(
                 'Lesson completion',
                 'completion',
                 [
                   ['manual', 'Manual'],
                   ['read', 'Read to the end']
                 ],
                 S.completion
               )
             : ''
         }`
      : '';
  wrap.innerHTML = `
    <div class="proto-panel" hidden>
      <h5>Lesson reader prototype</h5>
      <p>${S.view === 'teacher' ? 'Teacher view of the same lesson with aggregated reading signals.' : 'Select any text in the lesson. Try Aa for themes and type, Notebook for saved items.'}</p>
      ${learnerRows}
      <div class="proto-row"><span class="l">App theme</span><div class="proto-seg"><button aria-pressed="${!isDark}" data-app-theme="light">Light</button><button aria-pressed="${isDark}" data-app-theme="dark">Dark</button></div></div>
      <div class="proto-links"><a href="index.html">← All screens</a><a href="#" data-reset>Reset saved data</a></div>
    </div>
    <button class="proto-toggle">${icon('flask')}Prototype</button>`;
  document.body.append(wrap);
  $('.proto-toggle', wrap).addEventListener(
    'click',
    () => ($('.proto-panel', wrap).hidden = !$('.proto-panel', wrap).hidden)
  );
  $$('[data-app-theme]', wrap).forEach((button) =>
    button.addEventListener('click', () => {
      const dark = button.dataset.appTheme === 'dark';
      document.documentElement.classList.toggle('dark', dark);
      localStorage.cioTheme = dark ? 'dark' : 'light';
      $$('[data-app-theme]', wrap).forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
    })
  );
  $('[data-reset]', wrap).addEventListener('click', (event) => {
    event.preventDefault();
    Object.keys(localStorage)
      .filter((key) => key.startsWith('lr:'))
      .forEach((key) => localStorage.removeItem(key));
    location.reload();
  });
}

/* ============================================================== events */

function bindEvents() {
  document.addEventListener('click', (event) => {
    const actionEl = event.target.closest('[data-action]');
    const action = actionEl?.dataset.action;

    if (!event.target.closest('.rd-pop, [data-action="settings"]')) closeSettings();
    if (!event.target.closest('.rd-menu, .rd-note-pop')) closeFloating();

    const gotoEl = event.target.closest('[data-goto]');
    if (gotoEl && !event.target.closest('.sp')) scrollToBlock(Number(gotoEl.dataset.goto));

    const qmark = event.target.closest('[data-qb]');
    if (qmark) {
      const entry = S.entries.find((item) => item.kind === 'question' && item.b === Number(qmark.dataset.qb));
      if (entry) focusCard(entry.id);
    }

    const nbGoto = event.target.closest('[data-nb-goto]');
    const nbRemove = event.target.closest('[data-nb-remove]');
    const nbNote = event.target.closest('[data-nb-note]');
    if (nbRemove) {
      removeEntry(nbRemove.dataset.nbRemove);
      return;
    }
    if (nbNote) {
      const entry = S.entries.find((item) => item.id === nbNote.dataset.nbNote);
      openNoteEditor(entry, nbNote.getBoundingClientRect());
      return;
    }
    if (nbGoto && nbGoto.dataset.nbGoto) {
      const entry = S.entries.find((item) => item.id === nbGoto.dataset.nbGoto);
      if (entry) {
        scrollToBlock(entry.b);
        if (entry.kind === 'question') setTimeout(() => focusCard(entry.id, false), 350);
      }
    }

    const tab = event.target.closest('[data-nb-tab]');
    if (tab) {
      S.nbTab = tab.dataset.nbTab;
      renderPanel();
    }
    const scope = event.target.closest('[data-nb-scope]');
    if (scope) {
      S.nbScope = scope.dataset.nbScope;
      renderPanel();
    }

    if (!action) return;

    if (action === 'settings') openSettings(actionEl);
    if (action === 'notebook') S.panel === 'notebook' ? closePanel() : openPanel('notebook');
    if (action === 'open-assistant') S.panel === 'assistant' && !chatEntry ? closePanel() : openAssistant();
    if (action === 'close-panel') closePanel();
    if (action === 'focus') toggleFocus(false);
    if (action === 'complete') markComplete('manual');
    if (action === 'run-brief') runBrief();
    if (action === 'toggle-brief') {
      $('#rd-brief').classList.toggle('open');
      S.briefState = 'cached';
      renderBrief();
      setTimeout(() => {
        layoutCards();
        renderMap();
      }, 30);
    }
    if (action === 'resume') {
      scrollToBlock(Number(actionEl.dataset.b));
      $('[data-resume]')?.remove();
      writeStore('resumeDismissed', true);
    }
    if (action === 'dismiss-resume') {
      $('[data-resume]')?.remove();
      writeStore('resumeDismissed', true);
      setTimeout(layoutCards, 20);
    }
    if (action === 'nb-copy') {
      copyText(notebookMarkdown());
      toast(`Copied ${S.entries.length} items as Markdown`);
    }
    if (action === 'nb-download') {
      const blob = new Blob([notebookMarkdown()], { type: 'text/markdown' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'cleaning-messy-data-notebook.md';
      link.click();
      toast('Downloaded cleaning-messy-data-notebook.md');
    }
    if (action === 'sign-in') {
      event.preventDefault();
      toast('Sign in would open here. Browser highlights move to your account.');
    }
    if (action === 'app-theme') {
      const dark = document.documentElement.classList.toggle('dark');
      localStorage.cioTheme = dark ? 'dark' : 'light';
    }
  });

  const onSelectionEnd = (event) => {
    if (S.view !== 'learner') return;
    if (event.target.closest?.('.rd-tb, .rd-card, .rd-note-pop, .rd-menu, .rd-pop')) return;

    setTimeout(() => {
      const range = selectionInNote();
      if (range) {
        closeFloating();
        showToolbar(range);
        return;
      }

      if (toolbar && !toolbar.classList.contains('asking')) hideToolbar();
      if (toolbar?.classList.contains('asking') && !event.target.closest('.rd-tb')) hideToolbar();
      if (event.type === 'mouseup' && event.target.closest?.('#rd-note')) {
        const entry = highlightAt(event.clientX, event.clientY);
        if (entry) openEntryMenu(entry, event.clientX, event.clientY);
      }
    }, 0);
  };
  document.addEventListener('mouseup', onSelectionEnd);
  document.addEventListener('touchend', onSelectionEnd);
  document.addEventListener('keyup', (event) => {
    if (event.shiftKey && event.key.startsWith('Arrow')) onSelectionEnd(event);
  });

  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'i' && S.surface === 'course' && S.ai) {
      event.preventDefault();
      openAssistant();
      return;
    }

    if (event.key === 'Escape') {
      if ($('.rd-pop')) return closeSettings();
      if (toolbar) return clearSelection();
      if ($('.rd-menu, .rd-note-pop')) return closeFloating();
      if (document.body.classList.contains('focus')) return toggleFocus(false);
      if (S.panel) return closePanel();
    }

    if (!toolbar || toolbar.classList.contains('asking') || event.target.closest('input, textarea')) return;

    const shortcuts = { h: 'highlight', n: 'note', e: 'explain', d: 'define', a: 'ask', l: 'listen' };
    const action = shortcuts[event.key.toLowerCase()];
    const button = action && $(`[data-tb="${action}"]`, toolbar);
    if (button) {
      event.preventDefault();
      button.click();
    }
  });

  let scrollFrame;
  window.addEventListener(
    'scroll',
    () => {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(onScroll);
      if (toolbar && !toolbar.classList.contains('asking') && savedRange)
        positionFloating(toolbar, savedRange.getBoundingClientRect());
    },
    { passive: true }
  );

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (S.view === 'teacher') layoutInsights();
      else layoutCards();
      renderMap();
    }, 80);
  });
}

/* ================================================================ demo */

function runDemo(kind) {
  const terms = {
    select: 'NaN',
    explain: 'object',
    ask: 'fill missing prices with zero',
    highlight: 'Text typed by people drifts.'
  };
  const term = terms[kind];
  if (!term) return;

  const blockIndex = S.blocks.findIndex((block, index) => blockText(index).includes(term));
  if (blockIndex < 0) return;

  const start = blockText(blockIndex).indexOf(term);
  const [startNode, startOffset] = positionAt(S.blocks[blockIndex].el, start);
  const [endNode, endOffset] = positionAt(S.blocks[blockIndex].el, start + term.length);
  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  S.blocks[blockIndex].el.scrollIntoView({ block: 'center' });
  getSelection().removeAllRanges();
  getSelection().addRange(range);
  setTimeout(() => {
    showToolbar(range);
    if (kind === 'explain') createQuestion('explain');
    if (kind === 'ask') openAsk();
  }, 120);
}

/* ================================================================ init */

function init() {
  renderShell();
  indexBlocks();
  $('[data-pg-head]').innerHTML = renderPageHead();

  if (S.view === 'teacher') {
    prefs = { ...prefs, numbers: true };
    applyPrefs();
    renderTop();
    renderInsightsMargin();
  } else {
    S.entries = loadEntries();
    applyPrefs();
    renderTop();
    paintHighlights();
    renderAllCards();
    updateReadProgress();
  }

  bindMap();
  bindEvents();
  renderProto();
  onScroll();

  const open = params.get('open');
  if (open === 'notebook') openPanel('notebook');
  if (open === 'assistant') openAssistant(S.entries.find((entry) => entry.kind === 'question'));
  if (open === 'settings') setTimeout(() => openSettings($('[data-action="settings"]')), 60);
  if (params.get('focus') === '1') {
    toggleFocus(true);
    setTimeout(() => scrollToBlock(8), 300);
  }
  const demo = params.get('demo');
  if (demo) setTimeout(() => runDemo(demo), 500);
  const hashBlock = location.hash.match(/^#p(\d+)$/);
  if (hashBlock) setTimeout(() => scrollToBlock(Number(hashBlock[1]) - 1), 300);
  if (params.get('listen') === '1') setTimeout(() => startListen(4), 400);
  if (params.has('theme')) {
    prefs.theme = params.get('theme');
    if (params.has('face')) prefs.face = params.get('face');
    applyPrefs();
  }

  document.fonts?.ready.then(() => {
    layoutCards();
    renderMap();
  });
}

if (!CFG.noInit) init();
