/* cohorts.js — shared data, shells and components for the course-cohorts prototype. */

(function applyStoredTheme() {
  let stored = null;
  try {
    stored = localStorage.cioTheme;
  } catch (error) {}
  if (stored === 'dark' || (!stored && matchMedia('(prefers-color-scheme: dark)').matches))
    document.documentElement.classList.add('dark');
})();

const svg = (paths) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">${paths}</svg>`;
const ICONS = {
  sun: svg(
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'
  ),
  chevDown: svg('<path d="m6 9 6 6 6-6"/>'),
  chevRight: svg('<path d="m9 18 6-6-6-6"/>'),
  chevLeft: svg('<path d="m15 18-6-6 6-6"/>'),
  chevUpDown: svg('<path d="m7 15 5 5 5-5M7 9l5-5 5 5"/>'),
  arrowLeft: svg('<path d="M19 12H5M12 19l-7-7 7-7"/>'),
  arrowRight: svg('<path d="M5 12h14M12 5l7 7-7 7"/>'),
  more: svg('<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  filter: svg('<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>'),
  grid: svg(
    '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'
  ),
  copy: svg(
    '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'
  ),
  share: svg('<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>'),
  invite: svg(
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>'
  ),
  trash: svg('<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>'),
  ext: svg('<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14 21 3"/>'),
  refresh: svg('<path d="M21 12a9 9 0 0 1-15.5 6.3L3 16M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5M3 21v-5h5"/>'),
  lesson: svg(
    '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>'
  ),
  exercise: svg('<path d="m3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8"/>'),
  live: svg('<path d="m22 8-6 4 6 4V8z"/><rect x="2" y="6" width="14" height="12" rx="2"/>'),
  lock: svg('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
  unlock: svg('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>'),
  alert: svg(
    '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3z"/><path d="M12 9v4M12 17h.01"/>'
  ),
  sparkles: svg(
    '<path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'
  ),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 12 0v1"/>'),
  users: svg(
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'
  ),
  x: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
  check: svg('<path d="M20 6 9 17l-5-5"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  info: svg('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>'),
  sidebar: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>'),
  newsfeed: svg('<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/>'),
  content: svg('<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>'),
  certificate: svg('<circle cx="12" cy="8" r="6"/><path d="M15.5 12.9 17 22l-5-3-5 3 1.5-9.1"/>'),
  analytics: svg('<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>'),
  submissions: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 7v7M12 7v4M16 7v9"/>'),
  marks: svg(
    '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>'
  ),
  attendance: svg('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4"/>'),
  landing: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>'),
  bot: svg(
    '<rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 16h.01M16 16h.01"/>'
  ),
  settings: svg(
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'
  ),
  merge: svg('<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>'),
  undo: svg('<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>'),
  calendar: svg('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
  clock: svg('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
  link: svg(
    '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'
  ),
  video: svg('<path d="m22 8-6 4 6 4V8z"/><rect x="2" y="6" width="14" height="12" rx="2"/>'),
  history: svg('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>'),
  eye: svg('<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  pencil: svg('<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>'),
  home: svg('<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
  layers: svg('<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>'),
  globe: svg(
    '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'
  ),
  download: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>'),
  heart: svg(
    '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>'
  ),
  message: svg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
  send: svg('<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>'),
  bell: svg('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>')
};

function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((node) => (node.outerHTML = ICONS[node.dataset.icon] || ''));
}

/* ------------------------------------------------------------------ data */

const TODAY = new Date('2026-11-16T09:00:00');
const COURSE = { id: 'data-analysis', title: 'Data Analysis', type: 'Live class' };

/** Cohorts linked to Data Analysis after the merge (one per former copy). */
const COHORTS = [
  { id: 'c1', name: 'Cohort 1 · Jul 12', status: 'archived', starts: '2026-07-12', ends: '2026-09-20', students: 15 },
  { id: 'c2', name: 'Cohort 2 · Aug 23', status: 'archived', starts: '2026-08-23', ends: '2026-10-31', students: 17 },
  { id: 'c3', name: 'Cohort 3 · Sep 5', status: 'inactive', starts: '2026-09-05', ends: '2026-11-14', students: 19 },
  { id: 'c4', name: 'Cohort 4 · Sep 26', status: 'active', starts: '2026-09-26', ends: '2026-12-05', students: 18 },
  { id: 'c5', name: 'Cohort 5 · Oct 10', status: 'active', starts: '2026-10-10', ends: '2026-12-19', students: 20 },
  { id: 'c6', name: 'Cohort 6 · Oct 24', status: 'active', starts: '2026-10-24', ends: '2027-01-02', students: 19 },
  { id: 'c7', name: 'Cohort 7 · Nov 8', status: 'active', starts: '2026-11-08', ends: '2027-01-16', students: 15 }
];
const DIRECT = { id: 'direct', name: 'Direct', status: 'direct', students: 3 };
const STATUS_LABEL = { active: 'Active', inactive: 'Inactive', archived: 'Archived', direct: 'No cohort' };
const TOTAL_STUDENTS = COHORTS.reduce((sum, cohort) => sum + cohort.students, 0) + DIRECT.students;

/** One shared content tree. `week` drives per-cohort dates; live lessons and exercises are schedulable. */
const CONTENT = [
  {
    title: 'Week 1 · Foundations',
    items: [
      { id: 'l11', kind: 'lesson', title: 'Welcome to Data Analysis' },
      { id: 'l12', kind: 'lesson', title: 'How analysts think' },
      { id: 'l13', kind: 'live', title: 'Live session: Kickoff', week: 0, day: 2 },
      { id: 'e1', kind: 'exercise', title: 'Week 1 quiz', week: 0, questions: 6 }
    ]
  },
  {
    title: 'Week 2 · Spreadsheets',
    items: [
      { id: 'l21', kind: 'lesson', title: 'Cleaning data in Sheets' },
      { id: 'l22', kind: 'lesson', title: 'Pivot tables' },
      { id: 'l23', kind: 'live', title: 'Live session: Spreadsheet clinic', week: 1, day: 2 },
      { id: 'e2', kind: 'exercise', title: 'Spreadsheet assignment', week: 1, questions: 4 }
    ]
  },
  {
    title: 'Week 3 · SQL',
    items: [
      { id: 'l31', kind: 'lesson', title: 'SELECT, WHERE and ORDER BY' },
      { id: 'l32', kind: 'lesson', title: 'Joins without tears' },
      { id: 'l33', kind: 'live', title: 'Live session: SQL joins', week: 2, day: 2 },
      { id: 'e3', kind: 'exercise', title: 'SQL quiz', week: 2, questions: 10 }
    ]
  },
  {
    title: 'Week 4 · Visualization',
    items: [
      { id: 'l41', kind: 'lesson', title: 'Choosing the right chart' },
      { id: 'l42', kind: 'lesson', title: 'Dashboards in Looker Studio' },
      { id: 'l43', kind: 'live', title: 'Live session: Dashboard review', week: 3, day: 2 },
      { id: 'e4', kind: 'exercise', title: 'Week 4 project', week: 3, questions: 1 }
    ]
  },
  {
    title: 'Week 5 · Python for analysts',
    items: [
      { id: 'l51', kind: 'lesson', title: 'Notebooks and pandas' },
      { id: 'l52', kind: 'lesson', title: 'Grouping and aggregating' },
      { id: 'l53', kind: 'live', title: 'Live session: pandas lab', week: 4, day: 2 },
      { id: 'e5', kind: 'exercise', title: 'Python notebook', week: 4, questions: 5 }
    ]
  },
  {
    title: 'Week 6 · Capstone',
    items: [
      { id: 'l61', kind: 'lesson', title: 'Capstone brief' },
      { id: 'l62', kind: 'live', title: 'Live session: Demo day', week: 5, day: 4 },
      { id: 'e6', kind: 'exercise', title: 'Capstone project', week: 5, questions: 2 },
      { id: 'e7', kind: 'exercise', title: 'Course feedback', week: 5, questions: 3 }
    ]
  }
];
const ALL_ITEMS = CONTENT.flatMap((section) => section.items);
const LESSON_COUNT = ALL_ITEMS.filter((item) => item.kind !== 'exercise').length;
const EXERCISE_COUNT = ALL_ITEMS.filter((item) => item.kind === 'exercise').length;
const findItem = (id) => ALL_ITEMS.find((item) => item.id === id);

/* dates */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const toDate = (iso) => new Date(`${iso}T00:00:00`);
const addDays = (date, days) => new Date(date.getTime() + days * 86400000);
const fmtDay = (date) => `${MONTHS[date.getMonth()]} ${date.getDate()}`;
const fmtDate = (date) => `${DAYS[date.getDay()]}, ${fmtDay(date)}`;
const fmtYear = (date) => `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
const isoDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const cohortRange = (cohort) => `${fmtDay(toDate(cohort.starts))} – ${fmtDay(toDate(cohort.ends))}`;
const cohortById = (id) => COHORTS.find((cohort) => cohort.id === id) || (id === 'direct' ? DIRECT : null);
const weeksIn = (cohort) => Math.max(0, Math.floor((TODAY - toDate(cohort.starts)) / (7 * 86400000)));

/** Base (course) schedule values — what a cohort inherits when it has no override. */
const BASE_SCHEDULE = {
  l33: {
    lessonAt: '2026-10-13T18:00',
    callUrl: 'meet.google.com/sql-joins',
    recordingUrl: 'youtu.be/da-sql-joins',
    duration: 60,
    locked: false,
    unlockAt: ''
  },
  e4: { dueBy: '2026-10-27T23:59', locked: false, unlockAt: '' }
};

/**
 * Per-cohort overrides for the two showcase items. Each field is inherit | set | cleared.
 * Other items get generated values from the cohort start date.
 */
const OVERRIDES = {
  l33: {
    c1: { lessonAt: ['set', '2026-07-28T18:00'], recordingUrl: ['set', 'youtu.be/da-c1-sql'] },
    c2: { lessonAt: ['set', '2026-09-08T18:00'], recordingUrl: ['set', 'youtu.be/da-c2-sql'] },
    c3: { lessonAt: ['set', '2026-09-22T18:00'], recordingUrl: ['cleared'] },
    c4: { lessonAt: ['set', '2026-10-13T18:00'] },
    c5: { lessonAt: ['set', '2026-10-27T18:00'], callUrl: ['set', 'zoom.us/j/884 2210 7731'] },
    c6: { lessonAt: ['set', '2026-11-10T18:00'] },
    c7: { lessonAt: ['set', '2026-11-24T18:00'], locked: ['set', true], unlockAt: ['set', '2026-11-22T09:00'] },
    direct: {}
  },
  e4: {
    c1: { dueBy: ['set', '2026-08-09T23:59'] },
    c2: { dueBy: ['cleared'], locked: ['set', true] },
    c3: { dueBy: ['cleared'], locked: ['set', true] },
    c4: { dueBy: ['set', '2026-10-25T23:59'] },
    c5: { dueBy: ['set', '2026-11-08T23:59'] },
    c6: { dueBy: ['set', '2026-11-22T23:59'] },
    c7: { dueBy: ['set', '2026-12-06T23:59'], locked: ['set', true], unlockAt: ['set', '2026-11-29T09:00'] },
    direct: {}
  }
};

/** Resolution rule from the PRD: cleared → null, else override if set, else base. */
function resolveField(itemId, cohortId, field) {
  const override = OVERRIDES[itemId]?.[cohortId]?.[field];
  if (override?.[0] === 'cleared') return { state: 'cleared', value: null };
  if (override?.[0] === 'set') return { state: 'set', value: override[1] };

  return { state: 'inherit', value: BASE_SCHEDULE[itemId]?.[field] ?? null };
}

/** Generated schedule for non-showcase items: week offset from the cohort start. */
function generatedDate(item, cohort) {
  const start = cohort.id === 'direct' ? toDate('2026-09-26') : toDate(cohort.starts);
  return addDays(start, item.week * 7 + (item.day ?? 6));
}

function fmtDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${fmtDate(date)} · ${((hours + 11) % 12) + 1}:${minutes} ${suffix}`;
}

/* people */
const FIRST = [
  'Amara',
  'Chidi',
  'Ingrid',
  'Rosa',
  'Mei',
  'Yusuf',
  'Hiro',
  'Diego',
  'Fatima',
  'Nadia',
  'Kwame',
  'Sofia',
  'Tomás',
  'Aoife',
  'Liam',
  'Zara',
  'Omar',
  'Priya',
  'Lena',
  'Mateo',
  'Ada',
  'Jonas',
  'Ifeoma',
  'Kenji',
  'Elena',
  'Sami',
  'Noor',
  'Lucas',
  'Grace',
  'Tunde'
];
const LAST = [
  'Okafor',
  'Nakamura',
  'Kowalski',
  'Mbeki',
  'Jensen',
  'Rossi',
  'Fernandez',
  'Haddad',
  'Novak',
  'Ahmed',
  'Silva',
  'Kaur',
  'Andersson',
  'Chen',
  'Brooks',
  'Patel',
  'Osei',
  'Müller',
  'Garcia',
  'Adeyemi'
];

function seeded(seed) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function buildStudents() {
  const students = [];
  let index = 0;
  [...COHORTS, DIRECT].forEach((cohort, cohortIndex) => {
    const random = seeded(cohortIndex * 31 + 7);
    const totalWeeks = cohort.id === 'direct' ? 4 : Math.min(6, weeksIn(cohort) + 1);
    for (let n = 0; n < cohort.students; n += 1) {
      const first = FIRST[(index * 7 + 3) % FIRST.length];
      const last = LAST[(index * 11 + cohortIndex) % LAST.length];
      const progress = Math.max(0, Math.min(100, Math.round((totalWeeks / 6) * 100 - random() * 45)));
      const startDate =
        cohort.id === 'direct' ? addDays(toDate('2026-09-20'), Math.floor(random() * 40)) : toDate(cohort.starts);
      students.push({
        id: `s${index}`,
        name: `${first} ${last}`,
        initials: `${first[0]}${last[0]}`,
        email: `${first.toLowerCase()[0]}${'*'.repeat(8)}@udemy-test.demo`,
        cohortId: cohort.id,
        progress,
        enrolled: fmtDay(addDays(startDate, -Math.floor(random() * 6))),
        lastLogin: fmtDay(addDays(TODAY, -Math.floor(random() * 20))),
        attendance: Math.round(60 + random() * 40),
        grades: ALL_ITEMS.filter((item) => item.kind === 'exercise').map((item) =>
          item.week < totalWeeks - (random() > 0.75 ? 1 : 0) ? Math.round(55 + random() * 45) : null
        )
      });
      index += 1;
    }
  });
  return students;
}
const STUDENTS = buildStudents();
/** All cohorts lists newest cohorts first, interleaved, the way a recent-activity sort reads. */
const STUDENTS_INTERLEAVED = (() => {
  const buckets = [...COHORTS]
    .reverse()
    .concat([DIRECT])
    .map((cohort) => STUDENTS.filter((student) => student.cohortId === cohort.id));
  const longest = Math.max(...buckets.map((bucket) => bucket.length));
  const merged = [];
  for (let row = 0; row < longest; row += 1) buckets.forEach((bucket) => bucket[row] && merged.push(bucket[row]));
  return merged;
})();
const studentsIn = (cohortId) =>
  cohortId === 'all' ? STUDENTS_INTERLEAVED : STUDENTS.filter((student) => student.cohortId === cohortId);

const POSTS = [
  {
    id: 'p6',
    author: 'Admin Test',
    audience: 'all',
    when: 'Nov 16',
    body: 'This course is now called Data Analysis. Your progress, grades and comments are exactly where you left them, and your old link still works.',
    likes: 40,
    comments: 7
  },
  {
    id: 'p1',
    author: 'Admin Test',
    audience: 'all',
    when: 'Nov 15',
    body: 'The Week 4 project brief now includes a sample dashboard. Same rubric, clearer examples.',
    likes: 18,
    comments: 4
  },
  {
    id: 'p2',
    author: 'Kemi Adebayo',
    audience: 'c7',
    when: 'Nov 9',
    body: 'Welcome, Cohort 7! Kickoff was great. Next live session is the Spreadsheet clinic on Tuesday at 6pm.',
    likes: 11,
    comments: 3
  },
  {
    id: 'p3',
    author: 'Kemi Adebayo',
    audience: 'c6',
    when: 'Nov 8',
    body: 'Heads up: this week’s SQL joins session moves to Tuesday Nov 10 at 6pm. Same link.',
    likes: 9,
    comments: 2
  },
  {
    id: 'p4',
    author: 'Daniel Osei',
    audience: 'c5',
    when: 'Oct 30',
    body: 'The Dashboard review recording is up on the lesson page. Projects are due Nov 8.',
    likes: 14,
    comments: 6
  },
  {
    id: 'p5',
    author: 'Admin Test',
    audience: 'direct',
    when: 'Oct 22',
    body: 'Self-paced learners: office hours run every Friday at noon. The link is pinned in the Week 1 lesson.',
    likes: 2,
    comments: 0
  }
];
const postVisibleIn = (post, cohortId) => cohortId === 'all' || post.audience === 'all' || post.audience === cohortId;

/** Copies found by merge detection (Academy A shape). */
const COPIES = [
  {
    id: 'k7',
    title: 'Data Analysis - 08th November 2026',
    students: 18,
    lessons: 17,
    exercises: 7,
    direct: 3,
    rosterAdds: 0,
    created: 'Nov 1, 2026',
    edited: 'Nov 14',
    cohort: 'c7',
    image: 'photo-1551288049-bebda4e38f71'
  },
  {
    id: 'k6',
    title: 'Data Analysis - 24th October',
    students: 19,
    lessons: 17,
    exercises: 7,
    rosterAdds: 0,
    created: 'Oct 18, 2026',
    edited: 'Nov 2',
    cohort: 'c6',
    image: 'photo-1551288049-bebda4e38f71'
  },
  {
    id: 'k5',
    title: 'Data Analysis - 10th October',
    students: 20,
    lessons: 17,
    exercises: 7,
    rosterAdds: 1,
    created: 'Oct 3, 2026',
    edited: 'Oct 20',
    cohort: 'c5',
    image: 'photo-1551288049-bebda4e38f71',
    rebuilt: true
  },
  {
    id: 'k4',
    title: 'Data Analysis - 26th September',
    students: 18,
    lessons: 17,
    exercises: 7,
    rosterAdds: 0,
    created: 'Sep 20, 2026',
    edited: 'Oct 4',
    cohort: 'c4',
    image: 'photo-1551288049-bebda4e38f71',
    rebuilt: true
  },
  {
    id: 'k3',
    title: 'Data Analysis - 05th September',
    students: 19,
    lessons: 14,
    exercises: 6,
    rosterAdds: 10,
    created: 'Aug 30, 2026',
    edited: 'Sep 12',
    cohort: 'c3',
    image: 'photo-1551288049-bebda4e38f71',
    missingWeek4: true
  },
  {
    id: 'k2',
    title: 'Data Analysis - 23rd August',
    students: 17,
    lessons: 14,
    exercises: 6,
    rosterAdds: 1,
    created: 'Aug 17, 2026',
    edited: 'Aug 30',
    cohort: 'c2',
    image: 'photo-1551288049-bebda4e38f71',
    missingWeek4: true
  },
  {
    id: 'k1',
    title: 'Data Analysis - 12th July',
    students: 15,
    lessons: 17,
    exercises: 7,
    rosterAdds: 15,
    created: 'Jul 5, 2026',
    edited: 'Jul 30',
    cohort: null,
    image: 'photo-1551288049-bebda4e38f71'
  }
];
const unsplash = (id, width = 480) => `https://images.unsplash.com/${id}?w=${width}&q=70&auto=format&fit=crop`;

/* ---------------------------------------------------------------- url state */

const params = new URLSearchParams(location.search);
function setParam(key, value) {
  const next = new URLSearchParams(location.search);
  if (value === null || value === undefined || value === '') next.delete(key);
  else next.set(key, value);
  history.replaceState(null, '', `${location.pathname}${next.toString() ? `?${next}` : ''}${location.hash}`);
}
const currentCohortId = () => new URLSearchParams(location.search).get('cohortId') || 'all';

/* ------------------------------------------------------------------ shells */

const ORG_NAV = [
  ['Dashboard', 'home', '#'],
  ['Courses', 'content', 'courses.html'],
  ['Cohorts', 'users', 'cohort.html'],
  ['Community', 'message', '#'],
  ['Audience', 'invite', '#'],
  ['Settings', 'settings', '#']
];

function mountOrgShell(active) {
  const slot = document.querySelector('[data-org-sidebar]');
  if (!slot) return;

  const items = ORG_NAV.map(
    ([label, icon, href]) =>
      `<a class="nav-item ${label === active ? 'active' : ''}" href="${href}">${ICONS[icon]}${label}</a>`
  ).join('');
  slot.outerHTML = `<aside class="sidebar"><div class="brand"><div class="brand-mark">U</div><div class="brand-name">Udemy Test</div></div>${items}<div class="sidebar-foot"><div class="avatar">AT</div><div class="who"><div class="nm">Admin Test</div><div class="rl" style="font-size:12px;color:var(--muted-foreground)">Admin</div></div></div></aside>`;
}

function mountAppHeader() {
  const slot = document.querySelector('[data-app-header]');
  if (!slot) return;

  const crumbs = slot.dataset.appHeader.split('/').map((crumb) => crumb.trim());
  const trail = crumbs
    .map((crumb, index) =>
      index === crumbs.length - 1 ? `<span class="here">${crumb}</span>` : `<a href="courses.html">${crumb}</a>`
    )
    .join('<span class="sep">›</span>');
  slot.outerHTML = `<header class="app-header">
    <button class="btn btn-ghost btn-sm" aria-label="Toggle sidebar" style="padding:0 6px">${ICONS.sidebar}</button>
    <span class="vsep"></span>
    <nav class="crumbs"><a href="#" class="org-crumb"><span class="brand-mark" style="width:18px;height:18px;font-size:10px;border-radius:5px">U</span>Udemy Test</a><span class="sep">›</span>${trail}</nav>
    <span class="grow"></span>
    <a class="btn btn-outline btn-sm" href="#">Your Academy ${ICONS.ext}</a>
    <div class="hsearch">${ICONS.search}<span>Search</span><span class="kbd">⌘</span><span class="kbd">K</span></div>
    <button class="btn btn-secondary btn-sm" aria-label="Notifications" style="padding:0 8px">${ICONS.bell}</button>
    <button class="icon-btn" data-theme-toggle aria-label="Toggle theme"></button>
  </header>`;
}

const TEACHER_NAV = [
  ['News Feed', 'newsfeed', 'newsfeed'],
  ['Content', 'content', 'content'],
  ['Attendance', 'attendance', 'attendance'],
  ['Certificates', 'certificate', null],
  ['Analytics', 'analytics', 'analytics'],
  ['Submissions', 'submissions', 'submissions'],
  ['Marks', 'marks', 'marks'],
  ['Landing Page', 'landing', null],
  ['People', 'users', 'people'],
  ['AI Tutor', 'bot', null],
  ['Settings', 'settings', 'settings']
];
const STUDENT_NAV = [
  ['News Feed', 'newsfeed', 'newsfeed'],
  ['Content', 'content', 'content'],
  ['Certificates', 'certificate', null]
];
/** Course pages where learner data is listed, so the cohort filter shows. */
const FILTER_PAGES = ['newsfeed', 'attendance', 'analytics', 'submissions', 'marks', 'people'];

function coursePageHref(page) {
  const cohortId = currentCohortId();
  const query = new URLSearchParams({ page });
  if (cohortId !== 'all') query.set('cohortId', cohortId);
  return `course.html?${query}`;
}

function contentTree(activeItemId, hrefFor) {
  return CONTENT.map(
    (section) =>
      `<div class="sec">${ICONS.chevDown}${section.title}<span class="n">${section.items.length}</span></div>${section.items
        .map(
          (item) =>
            `<a class="${item.kind === 'exercise' ? 'ex' : ''} ${item.id === activeItemId ? 'on' : ''}" href="${hrefFor(item)}">${ICONS[item.kind === 'exercise' ? 'exercise' : item.kind === 'live' ? 'live' : 'lesson']}<span>${item.title}</span></a>`
        )
        .join('')}`
  ).join('');
}

/**
 * Course shell: course-sidebar.svelte + course-header.svelte.
 * `filter` mounts the cohort Combobox in the header (staff list pages only).
 */
function mountCourseShell({
  active,
  label,
  filter = false,
  student = false,
  treeOpen = false,
  activeItemId = null,
  title = COURSE.title,
  headerExtra = ''
}) {
  const sideSlot = document.querySelector('[data-course-sidebar]');
  const headSlot = document.querySelector('[data-course-header]');
  const nav = student ? STUDENT_NAV : TEACHER_NAV;
  const hrefFor = (item) =>
    student
      ? `student.html?item=${item.id}${location.search.includes('persona=retake') ? '&persona=retake' : ''}`
      : `lesson.html?item=${item.id}`;

  if (sideSlot) {
    const items = nav
      .map(([navLabel, icon, page]) => {
        const href = page
          ? student
            ? `student.html?page=${page}${location.search.includes('persona=retake') ? '&persona=retake' : ''}`
            : coursePageHref(page)
          : '#';
        const counts =
          navLabel === 'Content'
            ? `<span class="counts"><span>${LESSON_COUNT}</span><span>${EXERCISE_COUNT}</span></span>`
            : '';
        const row = `<a class="nav-item ${navLabel === active ? 'active' : ''}" href="${href}">${ICONS[icon]}${navLabel}${counts}</a>`;
        return navLabel === 'Content' && treeOpen
          ? `${row}<div class="ctree">${contentTree(activeItemId, hrefFor)}</div>`
          : row;
      })
      .join('');
    sideSlot.outerHTML = `<aside class="sidebar cside"><div class="clogo"><span class="mark"></span><span>${title}</span></div><a class="exit" href="${student ? '#' : 'courses.html?state=after'}">${ICONS.arrowLeft}Exit this course</a>${items}<div class="powered">Powered by ClassroomIO</div></aside>`;
  }

  if (headSlot) {
    const filterSlot = filter ? '<span class="vsep"></span><div class="combo" id="cohort-filter"></div>' : '';
    const staffActions = student
      ? ''
      : `<button class="btn btn-sm btn-assistant">${ICONS.sparkles}Assistant</button><div class="bgroup"><button class="btn btn-outline btn-sm">${ICONS.ext}View Course Site</button><button class="btn btn-outline btn-sm" aria-label="More">${ICONS.more}</button></div>`;
    headSlot.outerHTML = `<header class="chead"><button class="btn btn-ghost btn-sm" aria-label="Toggle sidebar" style="padding:0 6px">${ICONS.sidebar}</button><span class="vsep"></span><span class="here">${label}</span>${student ? '' : '<span class="badge badge-published">Published</span>'}${filterSlot}<span class="grow"></span>${headerExtra}${staffActions}<button class="icon-btn" data-theme-toggle aria-label="Toggle theme"></button></header>`;
  }

  if (filter) mountCohortFilter(document.getElementById('cohort-filter'));
}

/* ------------------------------------------------- cohort filter (Combobox) */

function cohortOption(cohort, selectedId) {
  const sub =
    cohort.id === 'direct' ? 'Enrolled without a cohort' : `${STATUS_LABEL[cohort.status]} · ${cohortRange(cohort)}`;
  return `<button class="cmd-item ${selectedId === cohort.id ? 'on' : ''}" data-cohort="${cohort.id}" data-search="${cohort.name.toLowerCase()}">${ICONS.check.replace('<svg', '<svg class="ck"')}<span class="sdot ${cohort.status}"></span><span>${cohort.name}<span class="sub">${sub}</span></span><span class="ct">${cohort.students}</span></button>`;
}

/** shadcn-svelte Combobox: trigger Button (outline) + Popover + Command list. Keeps the choice in ?cohortId=. */
function mountCohortFilter(root, { onChange } = {}) {
  const render = () => {
    const selectedId = currentCohortId();
    const selected = selectedId === 'all' ? null : cohortById(selectedId);
    const triggerLabel = selected
      ? `<span class="sdot ${selected.status}"></span><span class="nm">${selected.name}</span><span class="ct">${selected.students}</span>`
      : `${ICONS.users}<span class="nm">All cohorts</span><span class="ct">${TOTAL_STUDENTS}</span>`;
    root.innerHTML = `<button class="btn btn-outline btn-sm combo-trigger" aria-haspopup="listbox" data-testid="course-cohort-filter">${triggerLabel}${ICONS.chevUpDown}</button>
      <div class="combo-pop" hidden>
        <div class="cmd-input">${ICONS.search}<input placeholder="Search cohorts…" /></div>
        <div class="cmd-list">
          <button class="cmd-item ${selectedId === 'all' ? 'on' : ''}" data-cohort="all" data-search="all cohorts">${ICONS.check.replace('<svg', '<svg class="ck"')}${ICONS.users}<span>All cohorts</span><span class="ct">${TOTAL_STUDENTS}</span></button>
          ${cohortOption(DIRECT, selectedId)}
          <div class="cmd-sep"></div>
          <div class="cmd-group">Cohorts on this course</div>
          ${COHORTS.slice()
            .reverse()
            .map((cohort) => cohortOption(cohort, selectedId))
            .join('')}
          <div class="cmd-empty" hidden>No cohort found.</div>
          <div class="cmd-sep"></div>
          <button class="cmd-item" data-run-cohort>${ICONS.plus}<span>Run a new cohort</span></button>
        </div>
      </div>`;
    const trigger = root.querySelector('.combo-trigger');
    const pop = root.querySelector('.combo-pop');
    const input = pop.querySelector('input');
    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      pop.hidden = !pop.hidden;
      if (!pop.hidden) input.focus();
    });
    pop.addEventListener('click', (event) => event.stopPropagation());
    input.addEventListener('input', () => {
      const query = input.value.trim().toLowerCase();
      let shown = 0;
      pop.querySelectorAll('[data-search]').forEach((item) => {
        const match = !query || item.dataset.search.includes(query);
        item.hidden = !match;
        shown += match ? 1 : 0;
      });
      pop.querySelector('.cmd-empty').hidden = shown > 0;
    });
    pop.querySelectorAll('[data-cohort]').forEach((item) =>
      item.addEventListener('click', () => {
        const value = item.dataset.cohort;
        setParam('cohortId', value === 'all' ? null : value);
        pop.hidden = true;
        render();
        refreshCourseNavLinks();
        document.dispatchEvent(new CustomEvent('cohortchange', { detail: value }));
        onChange?.(value);
      })
    );
    pop.querySelector('[data-run-cohort]').addEventListener('click', () => {
      pop.hidden = true;
      openRunCohortDialog();
    });
  };
  document.addEventListener(
    'click',
    () => root.querySelector('.combo-pop') && (root.querySelector('.combo-pop').hidden = true)
  );
  document.addEventListener(
    'keydown',
    (event) =>
      event.key === 'Escape' && root.querySelector('.combo-pop') && (root.querySelector('.combo-pop').hidden = true)
  );
  render();
}

function refreshCourseNavLinks() {
  document.querySelectorAll('.cside .nav-item').forEach((link) => {
    const page = new URL(link.href, location.href).searchParams.get('page');
    if (page && link.href.includes('course.html')) link.href = coursePageHref(page);
  });
}

/* --------------------------------------------------------------- dialogs */

function openDialog(html, { wide = false, onMount } = {}) {
  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  scrim.innerHTML = `<div class="dialog" role="dialog" style="${wide ? 'max-width:620px' : ''}">${html}</div>`;
  document.body.appendChild(scrim);
  const close = () => scrim.remove();
  scrim.addEventListener('click', (event) => event.target === scrim && close());
  scrim.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', close));
  const onKey = (event) => {
    if (event.key !== 'Escape') return;

    close();
    document.removeEventListener('keydown', onKey);
  };
  document.addEventListener('keydown', onKey);
  onMount?.(scrim, close);
  return close;
}

function openSheet(html, { width = 520, onMount } = {}) {
  const scrim = document.createElement('div');
  scrim.className = 'sheet-scrim';
  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  sheet.style.width = `min(${width}px, 100vw)`;
  sheet.innerHTML = html;
  document.body.append(scrim, sheet);
  const close = () => {
    scrim.remove();
    sheet.remove();
  };
  scrim.addEventListener('click', close);
  sheet.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', close));
  onMount?.(sheet, close);
  return close;
}

function toast(message) {
  document.querySelectorAll('.toast').forEach((node) => node.remove());
  const node = document.createElement('div');
  node.className = 'toast';
  node.innerHTML = message;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 3200);
}

/** "Run a new cohort" — reached from the cohort filter and from Duplicate on a cohort-linked course. */
function openRunCohortDialog({ fromDuplicate = false } = {}) {
  const latest = COHORTS[COHORTS.length - 1];
  const nextStart = addDays(toDate(latest.starts), 14);
  const options = COHORTS.slice()
    .reverse()
    .map((cohort) => `<option value="${cohort.id}">${cohort.name} (starts ${fmtDay(toDate(cohort.starts))})</option>`)
    .join('');
  openDialog(
    `<div class="dialog-head"><h2 class="dialog-title">Run a new cohort</h2><p class="dialog-desc">${COURSE.title} keeps one copy of its content. The new cohort gets its own students, submissions, attendance and schedule.</p></div>
    <div class="dialog-body">
      <div class="field"><label class="label">Cohort</label>
        <select class="select" id="rc-mode"><option value="new">Create a new cohort</option><option value="existing">Add to an existing cohort…</option></select></div>
      <div id="rc-new" style="margin-bottom:18px">
        <div class="field"><label class="label">Cohort name</label><input class="input" value="Cohort 8 · Nov 22" /></div>
        <div class="grid2 field"><div><label class="label">Starts</label><input class="input" type="date" id="rc-start" value="${isoDate(nextStart)}" /></div><div><label class="label">Ends</label><input class="input" type="date" value="${isoDate(addDays(nextStart, 70))}" /></div></div>
      </div>
      <div class="field" id="rc-existing" hidden><label class="label">Existing cohort</label><select class="select"><option>Product Analytics Fellowship (no courses yet)</option><option>Spring 2027 waitlist</option></select></div>
      <div class="field"><label class="label">Schedule</label>
        <select class="select" id="rc-copy"><option value="">Start with the course schedule</option>${options.replace(`value="${latest.id}"`, `value="${latest.id}" selected`)}</select>
        <p class="hint" id="rc-shift">Copies ${latest.name}’s dates, links and locks, shifted by <b>14 days</b> (the gap between the two start dates). You can edit any date after.</p></div>
    </div>
    <div class="dialog-foot">${fromDuplicate ? '<button class="btn btn-secondary btn-sm" data-dup-anyway style="margin-right:auto">Duplicate anyway</button>' : ''}<button class="btn btn-outline btn-sm" data-close>Cancel</button><button class="btn btn-primary btn-sm" data-create data-testid="course-run-cohort-submit">Create cohort</button></div>`,
    {
      onMount(root, close) {
        const mode = root.querySelector('#rc-mode');
        mode.addEventListener('change', () => {
          root.querySelector('#rc-new').hidden = mode.value !== 'new';
          root.querySelector('#rc-existing').hidden = mode.value === 'new';
        });
        const copy = root.querySelector('#rc-copy');
        const start = root.querySelector('#rc-start');
        const updateShift = () => {
          const source = cohortById(copy.value);
          const hint = root.querySelector('#rc-shift');
          if (!source) {
            hint.textContent =
              'Every live session, due date and lock uses the course’s base values until you set them for this cohort.';
            return;
          }

          const days = Math.round((toDate(start.value) - toDate(source.starts)) / 86400000);
          hint.innerHTML = `Copies ${source.name}’s dates, links and locks, shifted by <b>${days} days</b> (the gap between the two start dates). You can edit any date after.`;
        };
        copy.addEventListener('change', updateShift);
        start.addEventListener('change', updateShift);
        root.querySelector('[data-dup-anyway]')?.addEventListener('click', () => {
          close();
          toast(`Duplicated as “${COURSE.title} (copy)” · lineage recorded, due dates kept`);
        });
        root.querySelector('[data-create]').addEventListener('click', () => {
          close();
          location.href = 'cohort.html?state=created';
        });
      }
    }
  );
}

/* --------------------------------------------------------------- state bar */

/** Wires `.state-bar [data-state]` buttons to `[data-state-view~=name]` blocks. */
function bindStatePicker(initial) {
  const buttons = document.querySelectorAll('.state-bar [data-state]');
  const show = (state) => {
    buttons.forEach((button) => button.classList.toggle('on', button.dataset.state === state));
    document
      .querySelectorAll('[data-state-view]')
      .forEach((view) => view.classList.toggle('shown', view.dataset.stateView.split(' ').includes(state)));
    setParam('state', state === initial ? null : state);
    document.dispatchEvent(new CustomEvent('statechange', { detail: state }));
  };
  buttons.forEach((button) => button.addEventListener('click', () => show(button.dataset.state)));
  show(params.get('state') || initial || buttons[0]?.dataset.state);
  return show;
}

/** Toggles `[data-menu-for=id]` popovers from `[data-menu=id]` triggers. */
function bindMenus(root = document) {
  root.querySelectorAll('[data-menu]').forEach((trigger) =>
    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      const menu = document.querySelector(`[data-menu-for="${trigger.dataset.menu}"]`);
      const wasOpen = !menu.hidden;
      document.querySelectorAll('[data-menu-for]').forEach((other) => (other.hidden = true));
      menu.hidden = wasOpen;
    })
  );
}
document.addEventListener('click', (event) => {
  if (!event.target.closest('[data-menu-for]'))
    document.querySelectorAll('[data-menu-for]').forEach((menu) => (menu.hidden = true));
});

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

/** Call once per page after mounting shells. */
function finishMount() {
  mountAppHeader();
  hydrateIcons();
  bindMenus();
  bindThemeToggles();
}

/* ------------------------------------------------------------ small views */

const cohortCell = (cohortId) => {
  const cohort = cohortById(cohortId);
  return `<span class="cohort-cell"><span class="sdot ${cohort.status}"></span>${cohort.name}</span>`;
};
const audienceBadge = (audience) =>
  audience === 'all'
    ? `<span class="badge badge-outline">${ICONS.globe}Everyone</span>`
    : `<span class="badge badge-secondary"><span class="sdot ${cohortById(audience).status}"></span>${cohortById(audience).name}</span>`;
const plural = (count, word) => `${count.toLocaleString()} ${word}${count === 1 ? '' : 's'}`;
