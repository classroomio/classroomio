/* proto.js — theme, icons, state picker, menus, dialogs, sheets, toasts and the course/org shells for the scorm-support prototypes. */

(function applyStoredTheme() {
  let stored = null;
  try {
    stored = localStorage.cioTheme;
  } catch (error) {}
  if (stored === 'dark' || (!stored && matchMedia('(prefers-color-scheme: dark)').matches))
    document.documentElement.classList.add('dark');
})();

const I = (paths) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">${paths}</svg>`;
const ICONS = {
  sun: I(
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'
  ),
  chevDown: I('<path d="m6 9 6 6 6-6"/>'),
  chevLeft: I('<path d="m15 18-6-6 6-6"/>'),
  chevRight: I('<path d="m9 18 6-6-6-6"/>'),
  more: I('<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>'),
  search: I('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  lesson: I('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>'),
  exercise: I('<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'),
  scorm: I(
    '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>'
  ),
  section: I('<path d="M3 6h18M3 12h18M3 18h12"/>'),
  lock: I('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
  unlock: I('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>'),
  check: I('<path d="M20 6 9 17l-5-5"/>'),
  checkCircle: I('<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>'),
  circle: I('<circle cx="12" cy="12" r="10"/>'),
  alert: I(
    '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>'
  ),
  xCircle: I('<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>'),
  info: I('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>'),
  x: I('<path d="M18 6 6 18M6 6l12 12"/>'),
  upload: I('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>'),
  zip: I(
    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M10 6h1M10 10h1M10 14h1M10 18v-2h1v2z"/>'
  ),
  refresh: I('<path d="M21 12a9 9 0 0 1-15.5 6.3L3 16M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5M3 21v-5h5"/>'),
  maximize: I(
    '<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/>'
  ),
  ext: I('<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14 21 3"/>'),
  clock: I('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
  user: I('<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 12 0v1"/>'),
  users: I(
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>'
  ),
  download: I('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>'),
  trash: I('<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>'),
  pencil: I('<path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>'),
  save: I(
    '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7M7 3v4a1 1 0 0 0 1 1h7"/>'
  ),
  history: I('<path d="M3 12a9 9 0 1 0 9-9 9.8 9.8 0 0 0-6.7 2.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>'),
  settings: I(
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7.8 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3.8 13.7H3.5a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 5 7.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10.3 3.8V3.5a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 16.2 5l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 .6 2.5"/>'
  ),
  note: I('<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>'),
  chart: I('<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>'),
  eye: I('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  layers: I('<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>'),
  sparkles: I(
    '<path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'
  ),
  sidebar: I('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>'),
  link: I(
    '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'
  ),
  play: I('<path d="m6 3 14 9-14 9z"/>'),
  rotate: I('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'),
  timer: I('<path d="M10 2h4M12 14l3-3"/><circle cx="12" cy="14" r="8"/>'),
  shield: I('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>'),
  book: I(
    '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'
  ),
  award: I('<circle cx="12" cy="8" r="6"/><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5"/>'),
  menu: I('<path d="M4 6h16M4 12h16M4 18h16"/>'),
  copy: I(
    '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'
  ),
  video: I('<path d="m22 8-6 4 6 4V8z"/><rect x="2" y="6" width="14" height="12" rx="2"/>'),
  image: I(
    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>'
  ),
  file: I('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>'),
  database: I('<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5M3 12a9 3 0 0 0 18 0"/>'),
  wifiOff: I(
    '<path d="M12 20h.01M8.5 16.4a5 5 0 0 1 7 0M2 8.8a15 15 0 0 1 4.2-2.6M10.7 5.1A15 15 0 0 1 22 8.8M5 12.9a10 10 0 0 1 5.2-2.7M16.8 13a10 10 0 0 0-1.8-1.3M2 2l20 20"/>'
  )
};

function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((node) => (node.outerHTML = ICONS[node.dataset.icon] || ''));
}

/** The seeded compliance course every page in this prototype uses. */
const COURSE = {
  title: 'HIPAA Awareness 2026',
  type: 'Compliance',
  sections: [
    {
      title: 'Why HIPAA matters',
      items: [
        { kind: 'lesson', title: 'Welcome and course overview', learner: 'done' },
        { kind: 'lesson', title: 'A real breach, in three minutes', learner: 'done' }
      ]
    },
    {
      title: 'Privacy Rule essentials',
      items: [
        {
          kind: 'scorm',
          title: 'Protecting patient information',
          learner: 'current',
          href: 'player.html',
          editHref: 'lesson-editor.html?state=ready'
        },
        { kind: 'lesson', title: 'Minimum necessary, with examples', learner: 'todo' }
      ]
    },
    {
      title: 'Security Rule in practice',
      items: [
        { kind: 'scorm', title: 'Spot the phishing email', learner: 'locked', editHref: '#' },
        { kind: 'exercise', title: 'Quick check: safeguards', learner: 'locked', meta: '5 questions' }
      ]
    },
    {
      title: 'Final assessment',
      items: [
        { kind: 'exercise', title: 'HIPAA final assessment', learner: 'locked', meta: '12 questions' },
        { kind: 'exercise', title: 'Policy attestation', learner: 'locked', meta: '1 question' }
      ]
    }
  ]
};

const ORG = { name: 'Coursera Test', initial: 'C', admin: 'Morgan Reyes', adminInitials: 'MR' };

const ORG_NAV = [
  ['Dashboard', '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', '#'],
  [
    'Courses',
    '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    'add-content.html'
  ],
  ['Programs', '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>', '#'],
  ['Compliance', '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>', '#'],
  ['Community', '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', '#'],
  ['Audience', '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>', '#'],
  [
    'Media',
    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    'media.html'
  ],
  [
    'Settings',
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7.8 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3.8 13.7H3.5a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 5 7.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10.3 3.8V3.5a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 16.2 5l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 .6 2.5"/>',
    '#'
  ]
];

const COURSE_NAV = [
  ['News Feed', '#'],
  ['Content', 'add-content.html'],
  ['Certificates', '#'],
  ['Analytics', '#'],
  ['Submissions', '#'],
  ['Marks', '#'],
  ['Compliance', '#'],
  ['Landing Page', '#'],
  ['People', 'people-learner.html'],
  ['AI Tutor', '#'],
  ['Settings', '#']
];

const ITEM_ICON = { lesson: 'lesson', exercise: 'exercise', scorm: 'scorm' };

function learnerTreeRow(item) {
  const stateIcon =
    item.learner === 'done'
      ? `<span class="tree-state done">${ICONS.checkCircle}</span>`
      : item.learner === 'locked'
        ? `<span class="tree-state">${ICONS.lock}</span>`
        : '';
  const isCurrent = item.learner === 'current';
  return `<a class="tree-row ${isCurrent ? 'current' : ''} ${item.learner === 'locked' ? 'is-locked' : ''}" href="${item.href || '#'}" data-tree-item="${item.title}">${ICONS[ITEM_ICON[item.kind]]}<span class="tree-title">${item.title}</span>${stateIcon}</a>`;
}

function mountShells() {
  const orgSlot = document.querySelector('[data-org-sidebar]');
  if (orgSlot) {
    const active = orgSlot.dataset.active || 'Courses';
    const items = ORG_NAV.map(
      ([label, paths, href]) =>
        `<a class="nav-item ${label === active ? 'active' : ''}" href="${href}">${I(paths)}${label}</a>`
    ).join('');
    orgSlot.outerHTML = `<aside class="sidebar"><div class="brand"><div class="brand-mark">${ORG.initial}</div><div class="brand-name">${ORG.name}</div></div>${items}<div class="sidebar-foot"><div class="avatar">${ORG.adminInitials}</div><div class="who"><div class="nm">${ORG.admin}</div><div class="rl">Admin</div></div></div></aside>`;
  }

  const courseSlot = document.querySelector('[data-course-sidebar]');
  if (!courseSlot) return;

  if (courseSlot.dataset.courseSidebar === 'learner') {
    const tree = COURSE.sections
      .map(
        (section, index) =>
          `<div class="tree-sec"><div class="tree-sec-h">${index + 1}. ${section.title}</div>${section.items.map(learnerTreeRow).join('')}</div>`
      )
      .join('');
    courseSlot.outerHTML = `<aside class="sidebar learner-sidebar">
      <a class="nav-item" href="#" style="margin-bottom:6px">${ICONS.chevLeft}My learning</a>
      <div class="course-id"><div class="nm">${COURSE.title}</div><div class="st">${ICONS.shield}${COURSE.type}</div></div>
      <a class="nav-item" href="#">${ICONS.note}News Feed</a>
      <a class="nav-item active" href="#">${ICONS.book}Content</a>
      <div class="tree">${tree}</div>
      <a class="nav-item" href="#">${ICONS.award}Certificates</a>
      <div class="learner-foot">
        <div class="frow" style="gap:10px"><div class="ring ring-sm" data-course-ring><svg viewBox="0 0 36 36"><circle class="track" cx="18" cy="18" r="15" fill="none" stroke-width="4"/><circle class="arc" cx="18" cy="18" r="15" fill="none" stroke-width="4" stroke-dasharray="94.2" stroke-dashoffset="70.6"/></svg><span class="lbl" data-course-pct>25%</span></div><div><div style="font-size:13px;font-weight:500">Course progress</div><div class="muted" style="font-size:12px" data-course-count>2 of 8 complete</div></div></div>
        <div class="frow" style="gap:6px;margin-top:10px"><button class="btn btn-outline btn-sm grow">${ICONS.chevLeft}Previous</button><button class="btn btn-outline btn-sm grow" data-next-incomplete>Next${ICONS.chevRight}</button></div>
      </div>
    </aside>`;
    return;
  }

  const activeItem = courseSlot.dataset.active || 'Content';
  const items = COURSE_NAV.map(
    ([label, href]) =>
      `<a class="nav-item ${label === activeItem ? 'active' : ''}" href="${href}">${ICONS.lesson}${label}</a>`
  ).join('');
  courseSlot.outerHTML = `<aside class="sidebar"><a class="nav-item" href="#" style="margin-bottom:10px">${ICONS.chevLeft}Courses</a>${items}</aside>`;
}

/** Mirrors features/ui/navigation/app-header.svelte: sidebar trigger | breadcrumbs … Open Academy · Search · theme. */
function mountAppHeader() {
  const slot = document.querySelector('[data-app-header]');
  if (!slot) return;

  const crumbs = slot.dataset.appHeader.split('/').map((crumb) => crumb.trim());
  const trail = crumbs
    .map((crumb, index) =>
      index === crumbs.length - 1 ? `<span class="here">${crumb}</span>` : `<a href="#">${crumb}</a>`
    )
    .join('<span class="sep">/</span>');
  slot.outerHTML = `<header class="app-header">
    <button class="btn btn-ghost btn-sm" aria-label="Toggle sidebar" style="padding:0 6px">${ICONS.sidebar}</button>
    <span class="vsep"></span>
    <nav class="crumbs"><a href="#" class="org-crumb"><span class="brand-mark" style="width:18px;height:18px;font-size:10px;border-radius:5px">${ORG.initial}</span>${ORG.name}</a><span class="sep">/</span>${trail}</nav>
    <span class="grow"></span>
    <a class="btn btn-outline btn-sm" href="#">${ICONS.ext}Open Academy</a>
    <div class="hsearch">${ICONS.search}<span>Search</span><span class="kbd">⌘</span><span class="kbd">K</span></div>
    <button class="icon-btn" data-theme-toggle aria-label="Toggle theme"></button>
  </header>`;
}

/** Wires `.state-bar [data-state]` buttons to `[data-state-view~=name]` blocks. */
function bindStatePicker(initial) {
  const buttons = document.querySelectorAll('.state-bar [data-state]');
  const show = (state) => {
    buttons.forEach((button) => button.classList.toggle('on', button.dataset.state === state));
    document
      .querySelectorAll('[data-state-view]')
      .forEach((view) => view.classList.toggle('shown', view.dataset.stateView.split(' ').includes(state)));
    document.dispatchEvent(new CustomEvent('statechange', { detail: state }));
  };
  buttons.forEach((button) => button.addEventListener('click', () => show(button.dataset.state)));
  show(new URLSearchParams(location.search).get('state') || initial || buttons[0]?.dataset.state);
  return show;
}

/** Toggles `[data-menu-for=id]` popovers from `[data-menu=id]` triggers; closes on outside click and Escape. Safe to call again after re-rendering. */
let menuDocumentBound = false;
function bindMenus() {
  document.querySelectorAll('[data-menu]:not([data-menu-bound])').forEach((trigger) => {
    trigger.dataset.menuBound = 'true';
    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      const menu = document.querySelector(`[data-menu-for="${trigger.dataset.menu}"]`);
      const wasOpen = !menu.hidden;
      document.querySelectorAll('[data-menu-for]').forEach((other) => (other.hidden = true));
      menu.hidden = wasOpen;
    });
  });
  if (menuDocumentBound) return;

  menuDocumentBound = true;
  const closeAll = () => document.querySelectorAll('[data-menu-for]').forEach((menu) => (menu.hidden = true));
  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-menu-for]')) closeAll();
  });
  document.addEventListener('keydown', (event) => event.key === 'Escape' && closeAll());
}

/** Opens `[data-layer=id]` dialogs and sheets from `[data-open=id]`; `[data-close]` and Escape close the top one. */
function openLayer(id) {
  const layer = document.querySelector(`[data-layer="${id}"]`);
  if (layer) layer.hidden = false;
}

function closeLayers() {
  document.querySelectorAll('[data-layer]').forEach((layer) => (layer.hidden = true));
}

let layerDocumentBound = false;
function bindLayers() {
  document.querySelectorAll('[data-open]:not([data-open-bound])').forEach((trigger) => {
    trigger.dataset.openBound = 'true';
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      openLayer(trigger.dataset.open);
    });
  });
  document.querySelectorAll('[data-close]:not([data-close-bound])').forEach((button) => {
    button.dataset.closeBound = 'true';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      button.closest('[data-layer]').hidden = true;
    });
  });
  document.querySelectorAll('[data-layer]:not([data-layer-bound])').forEach((layer) => {
    layer.dataset.layerBound = 'true';
    layer.addEventListener('click', (event) => {
      if (event.target === layer || event.target.classList.contains('sheet-scrim')) layer.hidden = true;
    });
  });
  if (layerDocumentBound) return;

  layerDocumentBound = true;
  document.addEventListener('keydown', (event) => event.key === 'Escape' && closeLayers());
}

let toastTimer = null;
function toast(message) {
  document.querySelector('.toast')?.remove();
  const node = document.createElement('div');
  node.className = 'toast';
  node.setAttribute('role', 'status');
  node.innerHTML = message;
  document.body.appendChild(node);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.remove(), 3200);
}

function bindThemeToggles() {
  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.innerHTML = ICONS.sun;
    button.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      try {
        localStorage.cioTheme = isDark ? 'dark' : 'light';
      } catch (error) {}
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  mountShells();
  mountAppHeader();
  hydrateIcons();
  bindMenus();
  bindLayers();
  bindThemeToggles();
});
