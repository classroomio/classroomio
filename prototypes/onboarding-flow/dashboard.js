/*
 * dashboard.js — the shell shared by dashboard.html and courses.html (sidebar, header), and the Dashboard page.
 *
 * The page replicates routes/(app)/org/[slug]/dash: the shadcn sidebar, the sticky header with the
 * setup ring, the greeting with its actions, three stat cards, and the Top Courses panel. The
 * starter courses are the Top Courses rows; the learning path takes the place of the empty
 * "Recent certifications" panel.
 */

const P = window.proto;
const S = P.loadState();
const PAGE = document.body.dataset.page || 'dashboard';
const REGISTERED = (window.PAGES ?? {})[PAGE] ?? null;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = P.escapeHtml;

function commit() {
  P.saveState(S);
}

/* Lucide shapes the product uses in this chrome that proto.js does not carry. */
const X = {
  panel: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  ext: '<path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/><path d="m21 3-9 9"/><path d="M15 3h6v6"/>',
  updown: '<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',
  refresh:
    '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  circle: '<circle cx="12" cy="12" r="10"/>',
  badge:
    '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>',
  book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  shield:
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  trash:
    '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  filter:
    '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
  grid: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 12h18"/><path d="M12 3v18"/>',
  list: '<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>',
  dotsv: '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>'
};

function ic(name, size = 16) {
  const body = X[name] ?? P.ICONS[name] ?? '';

  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:${size}px;height:${size}px">${body}</svg>`;
}

/* ---------- sidebar: the real groups, order and counts (org-navigation.ts) ---------- */
const NAV = [
  {
    label: null,
    items: [
      ['home', 'Home'],
      ['dashboard', 'Dashboard'],
      ['stats', 'Stats', 'sub']
    ]
  },
  {
    label: 'Create',
    items: [
      ['courses', 'Courses', 'count'],
      ['cohorts', 'Cohorts'],
      ['media', 'Media'],
      ['tags', 'Tags']
    ]
  },
  {
    label: 'Distribute',
    items: [
      ['widgets', 'Widgets'],
      ['landing', 'Landing Page']
    ]
  },
  {
    label: 'People',
    items: [
      ['audience', 'Audience'],
      ['community', 'Community']
    ]
  },
  {
    label: 'Tools',
    items: [
      ['automation', 'Automation', 'sub'],
      ['settings', 'Settings', 'sub']
    ]
  }
];

const NAV_TARGETS = {
  home: window.model.R.home,
  dashboard: window.model.R.dashboard,
  courses: window.model.R.courses(),
  landing: window.model.R.landingEditor(),
  audience: window.model.R.audience,
  settings: window.model.R.accountSettings
};

function navHref(key) {
  return NAV_TARGETS[key] ?? '#';
}

function sidebarHTML() {
  const plan = P.planById(S.plan);
  const isFree = S.plan === 'FREE';
  const first = (S.fullname || 'Ada Okafor').trim();

  return `
    <div class="rd-side-h">
      <div class="rd-brand"><img src="logo-mark.svg" alt="" /><span class="nm">classroomio</span><span class="rd-plan">${esc(plan.name)}</span></div>
    </div>
    <div class="rd-side-c">
      ${NAV.map(
        (group) => `
        <div class="rd-group">
          ${group.label ? `<div class="rd-glabel">${group.label}</div>` : ''}
          ${group.items
            .map(([key, label, kind]) => {
              const active = key === PAGE;
              const count =
                kind === 'count' && S.courses.length ? `<span class="rd-count">${S.courses.length}</span>` : '';
              const chev = kind === 'sub' ? ic('chevron', 16).replace('<svg', '<svg class="chev"') : '';

              return `<a class="rd-item${active ? ' active' : ''}" href="${esc(navHref(key))}" data-nav="${esc(label)}">${P.navIcon(key)}<span>${esc(label)}</span>${count}${chev}</a>`;
            })
            .join('')}
        </div>`
      ).join('')}
    </div>
    <div class="rd-side-f">
      ${
        isFree
          ? `<button class="rd-up" id="upgrade" type="button">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity=".15" stroke-width="3"/></svg>
              <span>Upgrade</span><span class="n">0/${esc(plan.learners)}</span>
            </button>`
          : ''
      }
      <div class="rd-user"><span class="rd-av">${S.avatarDataUrl ? `<img src="${S.avatarDataUrl}" alt="" style="width:100%;height:100%;border-radius:inherit;object-fit:cover" />` : esc(P.initials(first))}</span><span class="tx"><span>${esc(first)}</span><span class="text-muted">Admin</span></span>${ic('updown', 16)}</div>
    </div>`;
}

/* ---------- header ---------- */
const SETUP_ITEMS = () => window.model.setupSteps(S);

function headerHTML() {
  const name = P.brandNameOf(S);
  const items = SETUP_ITEMS();
  const pct = Math.round((items.filter((item) => item.done).length / items.length) * 100);
  const circ = 2 * Math.PI * 45;
  const orgMark = S.logoDataUrl ? `<img src="${S.logoDataUrl}" alt="" />` : esc(P.initials(name).slice(0, 2));

  return `
    <button class="rd-ib" aria-label="Toggle sidebar">${ic('panel')}</button>
    <span class="rd-sep"></span>
    <div class="rd-crumbs">
      <span class="org"><span class="rd-oav">${orgMark}</span><b>${esc(name)}</b></span>
      <span class="sepc">${ic('chevron', 14)}</span>
      <span>${esc(REGISTERED?.title ?? (PAGE === 'courses' ? 'Courses' : 'Dashboard'))}</span>
    </div>
    <span class="rd-grow"></span>
    ${
      pct < 100
        ? `<div class="rd-setup" id="setup">
            <button class="rd-ring" id="setup-ring" aria-label="Setup" aria-haspopup="true">
              <svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="45" fill="none" stroke="var(--sand-300)" stroke-width="8"/><circle cx="50" cy="50" r="45" fill="none" stroke="var(--blue-700)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${circ * (1 - pct / 100)}"/></svg>
              <span>${pct}%</span>
            </button>
            <div class="rd-pop">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><h4>Your Checklist</h4><button class="rd-ib" style="background:var(--secondary)" aria-label="Refresh">${ic('refresh', 12)}</button></div>
              ${items
                .map((item) =>
                  item.done
                    ? `<div class="row done">${ic('badge', 16)}<span>${esc(item.title)}</span></div>`
                    : `<a class="row" href="${esc(item.href)}">${ic('circle', 16)}<span>${esc(item.title)}</span></a>`
                )
                .join('')}
              <div class="rd-pop-f">
                <a class="text-muted" style="font-size:12px;text-align:center" href="${esc(window.model.R.setup)}">See all steps</a>
                <a class="text-muted" style="font-size:12px;text-align:center" href="flow.html">Prototype: replay onboarding</a>
              </div>
            </div>
          </div>`
        : ''
    }
    <a class="btn btn-outline" href="#" id="view-portal"><span class="lbl">Your Academy</span> ${ic('ext', 16)}</a>
    <div class="rd-search">${ic('search')}<span>Search courses, cohorts, widgets, students, tags, settings...</span><kbd>⌘</kbd><kbd>K</kbd></div>
    <span class="rd-bell">${ic('bell')}</span>`;
}

/* ---------- page ---------- */
function greeting() {
  const hour = new Date().getHours();

  return hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
}

function topCoursesHTML() {
  if (!S.courses.length) {
    return `<div style="flex:1;display:grid;place-items:center;text-align:center"><div><p style="font-weight:500;margin:0 0 4px">Create Your First Course</p><p class="rd-muted" style="margin:0 0 14px">Start creating courses to track course progress</p><button class="btn btn-outline" data-act="Create Course">Create Course</button></div></div>`;
  }

  return `<ul class="rd-list">${S.courses
    .map((course, index) => {
      const rank = index + 1;

      return `<li><a class="rd-row" href="#" data-open-course="${esc(course.id)}">
        <span class="rd-rank${rank <= 3 ? ` r${rank}` : ''}">${rank}</span>
        <div class="main"><p class="nm" style="margin:0"><span class="t">${esc(course.title)}</span></p>
          <div class="sub">${ic('users', 12)}<span>0</span><span>students</span></div></div>
        <div class="rd-metrics">
          <div><div class="l"><span>Completion</span><span>0%</span></div><div class="rd-bar"><i style="width:0"></i></div></div>
          <div><div class="l"><span>Certified</span><span>0%</span></div><div class="rd-bar"><i style="width:0"></i></div></div>
        </div>
        ${ic('chevron', 16).replace('<svg', '<svg class="go"')}
      </a></li>`;
    })
    .join('')}</ul>`;
}

/* The real dash puts Recent certifications here, empty until a student earns one. */
function certificationsHTML() {
  return `
    <div class="rd-panel rd-panel-plain">
      <h3 class="rd-panel-t2">Recent certifications</h3>
      <div class="rd-panel-b">
        <div class="rd-empty">
          <span class="rd-empty-ic">${ic('award', 24)}</span>
          <p class="rd-empty-t">No certificates earned yet</p>
          <p class="rd-empty-d">When students complete a course and earn a certificate, they will appear here</p>
          <button class="btn btn-outline" type="button" id="view-courses">View courses</button>
        </div>
      </div>
    </div>`;
}

function dashboardPageHTML(first) {
  return `
    <div class="rd-ph m-rise" style="--i:0">
      <h1 class="rd-title">${greeting()} ${esc(first)}!</h1>
      <div class="rd-actions">
        <button class="btn btn-outline" data-act="Create Course">Create Course</button>
        <a class="btn btn-default btn-primary" href="#" id="visit-site">Your Academy ${ic('ext', 16)}</a>
      </div>
    </div>

    <div class="rd-stats m-rise" style="--i:1">
      ${[
        ['award', 'Certificates issued', 0, 'Total certificates issued to students in your organization'],
        ['book', 'Number of courses', S.courses.length, 'Courses created within this organization'],
        ['users', 'Total students', 0, 'Based on student enrollments']
      ]
        .map(
          ([name, title, value, description]) =>
            `<div class="rd-stat"><span class="rd-stat-ic">${ic(name, 24)}</span><div><p class="t">${title}</p><p class="v">${value}</p><p class="d">${description}</p></div></div>`
        )
        .join('')}
    </div>

    <div class="rd-grid m-rise" style="--i:2">
      <div class="rd-panel"><div class="rd-panel-h"><h3>Top Courses</h3></div>${topCoursesHTML()}</div>
      ${certificationsHTML()}
    </div>

    <div class="rd-panel rd-chart m-rise" style="--i:3">
      <div style="margin-bottom:16px"><h3>Student Login Activity</h3><p class="rd-muted">Most active days of the week (last 90 days)</p></div>
      <div class="empty">No login activity yet</div>
    </div>`;
}

function renderPage() {
  const first = (S.fullname || 'there').trim().split(/\s+/)[0];

  document.documentElement.style.cssText = P.brandVars(S.primary);
  $('#side').innerHTML = sidebarHTML();
  $('#header').innerHTML = headerHTML();

  $('#page').innerHTML = REGISTERED
    ? REGISTERED.html(S)
    : PAGE === 'courses'
      ? coursesPageHTML()
      : dashboardPageHTML(first);

  wirePage();
  if (REGISTERED) REGISTERED.wire?.(S, { commit, rerender: renderPage });
  else if (PAGE === 'courses') {
    S.steps.reviewed = true;
    commit();
    wireCourses();
  }
}

function wirePage() {
  $$('[data-nav]').forEach((link) =>
    link.addEventListener('click', (event) => {
      if (link.getAttribute('href') !== '#') return;

      event.preventDefault();
      P.toast(`"${link.dataset.nav}" is part of the real dashboard and outside this prototype.`);
    })
  );

  $$('[data-open-course]').forEach((row) =>
    row.addEventListener('click', (event) => {
      event.preventDefault();
      window.location.href = window.model.R.course(row.dataset.openCourse);
    })
  );
  $$('[data-act]').forEach((button) =>
    button.addEventListener('click', () => P.toast(`"${button.dataset.act}" is outside this prototype.`))
  );

  const open = (event) => {
    event.preventDefault();
    openPortal();
  };
  $('#view-portal')?.addEventListener('click', open);
  $('#visit-site')?.addEventListener('click', open);

  $('#upgrade')?.addEventListener('click', () =>
    window.pricing.open({ state: S, item: 'general', commit, onUpgrade: renderPage })
  );

  $('#view-courses')?.addEventListener('click', () => (window.location.href = 'courses.html'));

  $('#setup-ring')?.addEventListener('click', () => $('#setup')?.classList.toggle('open'));
}

/* ---------- your academy ---------- */
function openPortal() {
  window.location.href = window.model.R.home;
}

function wireChrome() {
  P.initTheme();
}

renderPage();
wireChrome();
if (PAGE === 'courses') window.tour?.init();

if (!S.completedAt) {
  P.toast('No onboarding data found. Showing defaults.', {
    action: 'Run the flow',
    onAction: () => (window.location.href = 'flow.html')
  });
}
