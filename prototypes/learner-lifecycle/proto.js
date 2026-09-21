/*
 * proto.js — behavior for the learner lifecycle prototype.
 *
 * Generates a synthetic org of 2,400 learners so counts, pagination and
 * "select all N matching" behave at realistic scale rather than over 12 fake rows.
 * Every interaction here is the one specified in prd/admin-controls-and-reporting/UX.md.
 */

/* ---------- theme ---------- */
function initTheme() {
  const btn = document.getElementById('theme');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const dark = document.documentElement.classList.toggle('dark');
    localStorage.cioTheme = dark ? 'dark' : 'light';
  });
}

/* ---------- synthetic data ---------- */
const FIRST = [
  'Ada',
  'Tunde',
  'Chiamaka',
  'Kwame',
  'Amara',
  'Sofia',
  'Liam',
  'Noor',
  'Mateo',
  'Yuki',
  'Priya',
  'Omar',
  'Elena',
  'Kofi',
  'Hana',
  'Diego',
  'Zara',
  'Ivan',
  'Leila',
  'Sam',
  'Nia',
  'Rui',
  'Anya',
  'Bo',
  'Farah',
  'Jonas',
  'Mira',
  'Tobi',
  'Iris',
  'Dmitri'
];
const LAST = [
  'Okafor',
  'Adeyemi',
  'Nwosu',
  'Mensah',
  'Diallo',
  'Rossi',
  'Murphy',
  'Haddad',
  'Garcia',
  'Tanaka',
  'Sharma',
  'Aziz',
  'Petrova',
  'Boateng',
  'Sato',
  'Alvarez',
  'Khan',
  'Sokolov',
  'Rahman',
  'Cole',
  'Eze',
  'Silva',
  'Novak',
  'Chen',
  'Nasser',
  'Weber',
  'Patel',
  'Bello',
  'Lindgren',
  'Volkov'
];
const DAY = 86400000;

function mulberry(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildLearners(total) {
  const rand = mulberry(20260906);
  const now = Date.now();
  const rows = [];

  for (let i = 0; i < total; i++) {
    const first = FIRST[Math.floor(rand() * FIRST.length)];
    const last = LAST[Math.floor(rand() * LAST.length)];
    const joinedDaysAgo = Math.floor(rand() * 900) + 1;
    const bucket = rand();

    // 26% never logged in, the rest spread across recency bands
    let loginDaysAgo = null;
    if (bucket > 0.26) {
      const band = rand();
      if (band < 0.3) loginDaysAgo = Math.floor(rand() * 30);
      else if (band < 0.55) loginDaysAgo = 30 + Math.floor(rand() * 60);
      else if (band < 0.8) loginDaysAgo = 90 + Math.floor(rand() * 90);
      else loginDaysAgo = 180 + Math.floor(rand() * 400);
      loginDaysAgo = Math.min(loginDaysAgo, joinedDaysAgo);
    }

    const activeDaysAgo = loginDaysAgo === null ? null : Math.max(0, loginDaysAgo - Math.floor(rand() * 3));
    const enrolled = rand() < 0.82 ? 1 + Math.floor(rand() * 6) : 0;
    let completed = 0;
    let progress = 0;

    if (enrolled > 0 && loginDaysAgo !== null) {
      completed = Math.floor(rand() * (enrolled + 1));
      progress = completed === enrolled ? 100 : Math.floor((completed / enrolled) * 100 + rand() * 22);
      progress = Math.min(progress, 100);
    }

    const statusRoll = rand();
    const status = statusRoll > 0.97 ? 'ARCHIVED' : statusRoll > 0.945 ? 'DEACTIVATED' : 'ACTIVE';

    rows.push({
      id: i + 1,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i % 7 === 0 ? i : ''}@example.com`,
      initials: first[0] + last[0],
      joinedAt: now - joinedDaysAgo * DAY,
      lastLoginAt: loginDaysAgo === null ? null : now - loginDaysAgo * DAY,
      lastActiveAt: activeDaysAgo === null ? null : now - activeDaysAgo * DAY,
      enrolled,
      completed,
      progress,
      status,
      // invited but never signed up — checkbox must be disabled for these
      pending: loginDaysAgo === null && rand() < 0.35
    });
  }

  return rows;
}

/* ---------- formatting ---------- */
function relTime(ts) {
  if (ts === null) return null;

  const days = Math.floor((Date.now() - ts) / DAY);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  if (days < 60) return 'Last month';
  if (days < 365) return `${Math.round(days / 30)} months ago`;

  const years = (days / 365).toFixed(1).replace('.0', '');
  return `${years} year${years === '1' ? '' : 's'} ago`;
}

function absTime(ts) {
  if (ts === null) return 'No login recorded';

  return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const nf = new Intl.NumberFormat();
const num = (n) => nf.format(n);

/* ---------- filter model ---------- */
const EMPTY_FILTER = {
  lastLogin: 'any',
  lastActive: 'any',
  enrollment: 'any',
  completion: 'any',
  status: 'ACTIVE',
  search: ''
};

const PRESETS = [
  { id: 'all', label: 'All learners', filter: { ...EMPTY_FILTER } },
  { id: 'never', label: 'Never logged in', filter: { ...EMPTY_FILTER, lastLogin: 'never' } },
  { id: 'i90', label: 'Inactive 90+ days', filter: { ...EMPTY_FILTER, lastActive: '90' } },
  { id: 'i180', label: 'Inactive 180+ days', filter: { ...EMPTY_FILTER, lastActive: '180' } },
  {
    id: 'stalled',
    label: 'Enrolled, never started',
    filter: { ...EMPTY_FILTER, enrollment: 'enrolled', completion: 'not_started' }
  }
];

const WINDOW_LABEL = { any: 'Any', never: 'Never', 30: 'before 30 days', 90: 'before 90 days', 180: 'before 180 days' };

function staleBy(ts, days) {
  if (ts === null) return true;

  return Date.now() - ts >= days * DAY;
}

function matches(row, f) {
  if (f.status !== 'any' && row.status !== f.status) return false;

  if (f.lastLogin === 'never' && row.lastLoginAt !== null) return false;
  if (f.lastLogin !== 'any' && f.lastLogin !== 'never' && !staleBy(row.lastLoginAt, +f.lastLogin)) return false;

  if (f.lastActive === 'never' && row.lastActiveAt !== null) return false;
  if (f.lastActive !== 'any' && f.lastActive !== 'never' && !staleBy(row.lastActiveAt, +f.lastActive)) return false;

  if (f.enrollment === 'enrolled' && row.enrolled === 0) return false;
  if (f.enrollment === 'not_enrolled' && row.enrolled > 0) return false;

  if (f.completion === 'not_started' && !(row.enrolled > 0 && row.progress === 0)) return false;
  if (f.completion === 'in_progress' && !(row.progress > 0 && row.progress < 100)) return false;
  if (f.completion === 'completed' && row.progress !== 100) return false;

  if (f.search) {
    const q = f.search.toLowerCase();
    if (!row.name.toLowerCase().includes(q) && !row.email.toLowerCase().includes(q)) return false;
  }

  return true;
}

function describe(f) {
  const out = [];
  if (f.lastLogin !== 'any') out.push({ key: 'lastLogin', text: `Last login: ${WINDOW_LABEL[f.lastLogin]}` });
  if (f.lastActive !== 'any') out.push({ key: 'lastActive', text: `Last activity: ${WINDOW_LABEL[f.lastActive]}` });
  if (f.enrollment !== 'any')
    out.push({ key: 'enrollment', text: `Enrollment: ${f.enrollment === 'enrolled' ? 'Enrolled' : 'Not enrolled'}` });
  if (f.completion !== 'any') {
    const label = { not_started: 'Not started', in_progress: 'In progress', completed: 'Completed' }[f.completion];
    out.push({ key: 'completion', text: `Completion: ${label}` });
  }
  if (f.status !== 'ACTIVE') {
    const label = { any: 'All statuses', DEACTIVATED: 'Deactivated', ARCHIVED: 'Archived' }[f.status];
    out.push({ key: 'status', text: `Status: ${label}` });
  }
  return out;
}

/* ---------- popovers ---------- */
function closeAllPops(except) {
  document.querySelectorAll('.pop.on').forEach((p) => {
    if (p !== except) p.classList.remove('on');
  });
  const scrim = document.querySelector('.sheet-scrim');
  if (scrim && !document.querySelector('.pop.filter-pop.on')) scrim.classList.remove('on');
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.pop') && !e.target.closest('[data-pop]')) closeAllPops();
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;

  const dlg = document.querySelector('.backdrop.on');
  if (dlg) {
    dlg.classList.remove('on');
    return;
  }
  closeAllPops();
});

/* ---------- toasts ---------- */
function toast(message, { action, onAction, error, timeout = 7000 } = {}) {
  let host = document.querySelector('.toasts');
  if (!host) {
    host = document.createElement('div');
    host.className = 'toasts';
    document.body.appendChild(host);
  }

  const el = document.createElement('div');
  el.className = 'toast' + (error ? ' err' : '');
  el.setAttribute('role', 'status');
  el.innerHTML = `<span style="flex:1">${message}</span>`;

  if (action) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-outline btn-sm';
    btn.textContent = action;
    btn.addEventListener('click', () => {
      onAction?.();
      el.remove();
    });
    el.appendChild(btn);
  }

  const close = document.createElement('button');
  close.className = 'icon-btn';
  close.style.cssText = 'width:26px;height:26px;border:none;background:transparent;box-shadow:none';
  close.setAttribute('aria-label', 'Dismiss');
  close.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  close.addEventListener('click', () => el.remove());
  el.appendChild(close);

  host.appendChild(el);
  setTimeout(() => el.remove(), timeout);
}

window.proto = {
  initTheme,
  buildLearners,
  relTime,
  absTime,
  num,
  matches,
  describe,
  PRESETS,
  EMPTY_FILTER,
  WINDOW_LABEL,
  closeAllPops,
  toast
};
