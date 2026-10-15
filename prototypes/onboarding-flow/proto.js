/*
 * proto.js — shared state, data and helpers for the onboarding prototype.
 *
 * Product facts are read from the codebase (see README § Where the data comes from):
 * theme names, descriptions, preview images and the free/paid split come from the
 * landing-page theme picker; plans from packages/utils/src/plans; integrations from
 * what the dashboard actually ships. The invented parts — testimonials, starter course
 * copy and the "analysis" — are labelled on screen wherever they appear.
 */

/* A reload anywhere in the app restarts the flow; review pages (index, states, design options) and frames are left alone. */
(function restartOnReload() {
  const page = location.pathname.split('/').pop();
  const reviewPages = ['index.html', 'states.html', 'design-options.html'];
  const navigation = performance.getEntriesByType('navigation')[0];

  if (window.top !== window || reviewPages.includes(page) || navigation?.type !== 'reload') return;

  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('cio'))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    /* storage can be blocked */
  }

  location.replace('/flow.html');
})();

/* ---------- theme ----------
 * The brand defines a light theme only (skills/classroomio-design README: dark tokens are not
 * mapped), so the prototype has no dark mode. Kept as a no-op so callers need not change. */
function initTheme() {
  document.documentElement.classList.remove('dark');
}

/* ---------- toasts ---------- */
function toast(message, { action, onAction, error, timeout = 6000 } = {}) {
  let host = document.querySelector('.toasts');
  if (!host) {
    host = document.createElement('div');
    host.className = 'toasts';
    document.body.appendChild(host);
  }

  const el = document.createElement('div');
  el.className = 'toast' + (error ? ' err' : '');
  el.setAttribute('role', 'status');
  el.innerHTML = '<span style="flex:1"></span>';
  el.firstChild.textContent = message;

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
  close.className = 'toast-x';
  close.setAttribute('aria-label', 'Dismiss');
  close.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  close.addEventListener('click', () => el.remove());
  el.appendChild(close);

  host.appendChild(el);
  setTimeout(() => el.remove(), timeout);
}

/* ---------- onboarding state ----------
 * One object in localStorage. Every page reads and writes it, so Back never loses an
 * answer and the dashboard renders the workspace the user just described.
 */
const STATE_KEY = 'cioOnboardingState';

const DEFAULT_PRIMARY = '#0233bd';

const EMPTY_STATE = {
  stage: 1,
  fullname: '',
  email: '',
  password: '',
  googleSignup: false,
  verified: false,
  verifyRequestedAt: 0,
  role: '',
  company: '',
  website: '',
  siteMode: 'link',
  description: '',
  goals: [],
  companySize: '',
  learningMethod: '',
  source: '',
  sourceOther: '',
  skipped: {},
  siteName: '',
  siteNameTouched: false,
  aiProvider: '',
  aiProviderOther: '',
  skipContext: false,
  pathChoice: '',
  preparedKey: '',
  prepared: false,
  categoryId: '',
  courses: [],
  path: null,
  theme: 'quartz',
  brandName: '',
  logoDataUrl: '',
  primary: DEFAULT_PRIMARY,
  connected: [],
  notify: [],
  plan: 'FREE',
  billing: 'annual',
  landing: null,
  landingSaved: false,
  steps: {},
  checklist: [],
  completedAt: 0
};

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return structuredClone(EMPTY_STATE);

    const saved = JSON.parse(raw);
    const merged = { ...structuredClone(EMPTY_STATE), ...saved };
    if (!LANDING_THEMES.some((theme) => theme.id === merged.theme)) merged.theme = EMPTY_STATE.theme;

    return merged;
  } catch {
    return structuredClone(EMPTY_STATE);
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    /* private mode or full quota — the flow still works, it just will not survive a reload */
  }
}

function resetState() {
  try {
    localStorage.removeItem(STATE_KEY);
  } catch {
    /* nothing to clear */
  }
}

/* ---------- discovery and company questions ----------
 * Values and labels are the production onboarding enums (packages/utils/src/validation/onboarding)
 * and copy (apps/dashboard translations, `onboarding.*`). Ranges use a hyphen, not an en dash. */
const COMPANY_SIZES = [
  { id: 'solo', label: 'Just me' },
  { id: '2-9', label: '2-9 people' },
  { id: '10-50', label: '10-50 people' },
  { id: '51-200', label: '51-200 people' },
  { id: '200-plus', label: '200+ people' }
];

const LEARNING_METHODS = [
  { id: 'self-serve', label: 'They figure it out on their own' },
  { id: 'live-onboarding', label: 'Live onboarding sessions or calls' },
  { id: 'help-docs', label: 'Help docs and support' },
  { id: 'no-training', label: "We don't have training yet" }
];

const SOURCES = [
  { id: 'blog', label: 'Blog or article' },
  { id: 'ai', label: 'AI assistant' },
  { id: 'search-engine', label: 'Search engine' },
  { id: 'github', label: 'GitHub or open source' },
  { id: 'youtube', label: 'YouTube or podcast' },
  { id: 'social-media', label: 'Social media' },
  { id: 'product-hunt', label: 'Product Hunt or a review site' },
  { id: 'friends-family', label: 'Friends, family, or a colleague' },
  { id: 'other', label: 'Other (tell us)' }
];

const AI_PROVIDERS = [
  { id: 'chatgpt', label: 'ChatGPT' },
  { id: 'claude', label: 'Claude' },
  { id: 'gemini', label: 'Gemini' },
  { id: 'grok', label: 'Grok' },
  { id: 'perplexity', label: 'Perplexity' },
  { id: 'other', label: 'Other (tell us)' }
];

/* ---------- stage metadata ---------- */
const STAGES = [
  { n: 1, id: 'account', label: 'Account' },
  { n: 2, id: 'verify', label: 'Verify' },
  { n: 3, id: 'business', label: 'Your business' },
  { n: 4, id: 'workspace', label: 'Workspace' },
  { n: 5, id: 'customise', label: 'Customise' }
];

/* ---------- testimonials ----------
 * Placeholders. The brand rules say no customer names, logos, testimonials or outcome numbers
 * until approved, so these are short, number-free, and every name and company is invented.
 * The first two quotes are the brand system's own example lines. */
const TESTIMONIALS = [
  {
    quote: 'It looks like our product, not a bolt-on LMS.',
    name: 'Sofia Almeida',
    role: 'Product Operations',
    company: 'Brightdesk'
  },
  {
    quote: 'Our queue is noticeably calmer.',
    name: 'Daniel Okoye',
    role: 'Head of Support',
    company: 'Northwind'
  },
  {
    quote: 'Every release ships with a lesson now. Adoption stopped being a guessing game.',
    name: 'Priya Raman',
    role: 'Customer Education Manager',
    company: 'Lattice'
  }
];

/* ---------- onboarding questions ----------
 * `maps` is the value the current API would receive. Where it reads 'other', the real
 * enum has no home for the option — see README § Enum gaps.
 */
const ROLES = [
  { id: 'founder', label: 'Founder or CEO', maps: 'founder', icon: 'rocket' },
  { id: 'customer-success', label: 'Customer Success', maps: 'cs-education', icon: 'heart' },
  { id: 'customer-education', label: 'Customer Education', maps: 'cs-education', icon: 'book' },
  { id: 'product', label: 'Product', maps: 'product-ops', icon: 'layers' },
  { id: 'marketing', label: 'Marketing or Growth', maps: 'other', icon: 'megaphone' },
  { id: 'support', label: 'Support', maps: 'other', icon: 'lifebuoy' },
  { id: 'operations', label: 'Operations', maps: 'product-ops', icon: 'settings' },
  { id: 'other', label: 'Something else', maps: 'other', icon: 'dots' }
];

/* `yields` is what the goal changes in the prepared workspace — shown on the tile so the
 * value of answering is visible before the user commits. */
const GOALS = [
  {
    id: 'onboard',
    label: 'Onboard new customers',
    yields: 'A New Customer Onboarding path',
    icon: 'rocket',
    maps: 'customer-training'
  },
  {
    id: 'understand',
    label: 'Explain our product',
    yields: 'Core how-to courses',
    icon: 'book',
    maps: 'customer-training'
  },
  {
    id: 'adoption',
    label: 'Increase adoption',
    yields: 'A path past go-live',
    icon: 'layers',
    maps: 'customer-training'
  },
  {
    id: 'deflect',
    label: 'Cut repetitive tickets',
    yields: 'A most-asked-questions course',
    icon: 'lifebuoy',
    maps: 'other'
  },
  {
    id: 'advanced',
    label: 'Teach advanced features',
    yields: 'An advanced features course',
    icon: 'sparkle',
    maps: 'customer-training'
  },
  {
    id: 'hub',
    label: 'Build an education hub',
    yields: 'A welcome course for your portal',
    icon: 'globe',
    maps: 'other'
  },
  {
    id: 'certify',
    label: 'Certify customers',
    yields: 'Certificates on the path',
    icon: 'award',
    maps: 'customer-certification'
  }
];

/* One-tap examples so the description box is never a blank page. */
const EXAMPLES = [
  {
    label: 'Project management',
    text: 'project management software for agencies, where customers set up workspaces, run projects and report progress to clients'
  },
  {
    label: 'Analytics',
    text: 'an analytics platform for SaaS teams, where customers connect data sources, build dashboards and share reports'
  },
  {
    label: 'Fintech',
    text: 'payments and invoicing software for small businesses, where customers verify their account, send payments and manage approvals'
  },
  {
    label: 'Developer tools',
    text: 'a developer API for sending notifications, where customers need keys, a first successful call and a production checklist'
  },
  {
    label: 'HR software',
    text: 'HR software for growing companies, where customers post roles, run hiring pipelines and onboard new employees'
  },
  {
    label: 'Compliance',
    text: 'audit-readiness software for clinics, where staff need compliance policies, role-based procedures and incident reporting training'
  }
];

/* ---------- starter content ----------
 * Matching is a keyword read of what the user typed. No network request is made and no
 * website is fetched — see README § What is simulated. `{co}` is the company name.
 */
const CATEGORIES = [
  {
    id: 'project',
    label: 'project management software',
    match: ['project', 'task', 'workflow', 'kanban', 'sprint', 'roadmap', 'agenc', 'asana', 'backlog', 'collaborat'],
    courses: [
      [
        'Getting Started with Your Workspace',
        'Create a workspace, learn the layout and find your way around on day one.'
      ],
      ['Creating and Managing Projects', 'Set up a project, break it into tasks and keep ownership clear.'],
      ['Collaborating with Your Team', 'Invite teammates, assign work and keep conversations attached to the task.'],
      ['Understanding Reports and Progress', 'Read the dashboards and share progress with stakeholders.']
    ],
    steps: [
      'Introduction to the product',
      'Setting up a workspace',
      'Creating the first project',
      'Inviting teammates',
      'Completing a first workflow'
    ]
  },
  {
    id: 'fintech',
    label: 'financial software',
    match: [
      'fintech',
      'payment',
      'bank',
      'invoic',
      'payroll',
      'ledger',
      'accounting',
      'transaction',
      'treasury',
      'expense'
    ],
    courses: [
      ['Account Setup and Verification', 'Verify your business and fund your account safely.'],
      ['Making Your First Transaction', 'Send, receive and reconcile your first payment.'],
      ['Managing Cards, Limits and Approvals', 'Set spending controls and approval flows for your team.'],
      ['Security and Compliance Basics', 'The safeguards finance teams are audited on.']
    ],
    steps: [
      'Welcome and account tour',
      'Verify your business',
      'Fund your account',
      'Send a first payment',
      'Set up approvals and roles'
    ]
  },
  {
    id: 'analytics',
    label: 'analytics and reporting software',
    match: [
      'analytic',
      'dashboard',
      'report',
      'metric',
      'data warehouse',
      'insight',
      'chart',
      ' sql',
      'tracking',
      'bi '
    ],
    courses: [
      ['Connecting Your Data Sources', 'Sources, syncs and what to check before you trust a number.'],
      ['Building Your First Dashboard', 'Pick the metric, shape the chart and arrange the view.'],
      ['Creating and Sharing Reports', 'Schedule reports and share them with the right people.'],
      ['Understanding Your Metrics', 'Definitions, filters and the pitfalls behind common charts.']
    ],
    steps: [
      'A tour of the platform',
      'Connect a data source',
      'Build a first dashboard',
      'Share a report',
      'Set up an alert'
    ]
  },
  {
    id: 'devtool',
    label: 'developer tooling',
    match: [
      'api',
      'developer',
      'sdk',
      'deploy',
      'infrastructur',
      'devops',
      'ci/cd',
      'repo',
      'kubernetes',
      'observab',
      'notification'
    ],
    courses: [
      [
        'Quickstart: From Install to First API Call',
        'Keys, environments and a working request inside fifteen minutes.'
      ],
      ['Authentication and Environments', 'Test versus live, scopes and rotating keys safely.'],
      ['Webhooks, Retries and Rate Limits', 'Build integrations that fail gracefully.'],
      ['Production Readiness Checklist', 'Monitoring, alerts and the mistakes that page you at 3am.']
    ],
    steps: ['Install the SDK', 'Make your first call', 'Handle errors and retries', 'Go to production', 'Monitor usage']
  },
  {
    id: 'compliance',
    label: 'compliance and operations software',
    match: [
      'complian',
      'hipaa',
      'soc 2',
      'gdpr',
      'audit',
      'policy',
      'regulat',
      'safety',
      'clinic',
      'hospital',
      'restaurant',
      'hotel'
    ],
    courses: [
      ['Compliance Fundamentals', 'The policies every member of staff is accountable for, in plain language.'],
      ['Role-Based Procedures', 'What your role is responsible for, with real scenarios.'],
      ['Incident Reporting and Escalation', 'What to do, who to tell and how to document it.'],
      ['Annual Refresher and Attestation', 'A short assessment that records who completed it and when.']
    ],
    steps: [
      'Policy overview',
      'Know your role',
      'Handle an incident',
      'Pass the assessment',
      'Receive your certificate'
    ]
  },
  {
    id: 'commerce',
    label: 'commerce software',
    match: [
      'ecommerce',
      'e-commerce',
      'storefront',
      'shop',
      'checkout',
      'merchant',
      'catalog',
      'fulfil',
      'shipping',
      'retail'
    ],
    courses: [
      ['Launching Your Storefront', 'Catalogue, checkout and the settings that decide whether you get paid.'],
      ['Products, Catalogue and Inventory', 'Add products, variants and stock levels.'],
      ['Checkout, Payments and Shipping', 'Take a test order end to end.'],
      ['Growing Repeat Orders', 'Abandoned carts and post-purchase flows.']
    ],
    steps: [
      'A tour of the admin',
      'Add your first product',
      'Set up payments and shipping',
      'Take a test order',
      'Launch the store'
    ]
  },
  {
    id: 'people',
    label: 'HR and people software',
    match: [
      'hr ',
      'human resource',
      'people ops',
      'recruit',
      'hiring',
      'employee',
      'benefit',
      'performance review',
      'payroll'
    ],
    courses: [
      ['Getting Started with {co}', 'A first tour for new admins and managers.'],
      ['Running Your First Hiring Cycle', 'Requisitions, pipelines and the handoffs that lose candidates.'],
      ['Employee Onboarding That Sticks', 'Checklists, documents and the first ninety days.'],
      ['Performance Reviews and Feedback', 'Set up a review cycle and collect useful feedback.']
    ],
    steps: [
      'Meet the platform',
      'Post a role',
      'Move a candidate through the pipeline',
      'Onboard a new hire',
      'Run a review cycle'
    ]
  }
];

const GENERIC = {
  id: 'generic',
  label: 'your product',
  courses: [
    ['Getting Started with {co}', 'Core concepts, first setup and the moment a new customer sees value.'],
    ['Core Workflows, Step by Step', 'The handful of tasks most customers do every week.'],
    ['Collaborating with Your Team', 'Invite colleagues, share work and set permissions.'],
    ['Getting Help and Next Steps', 'Where to find answers and what to learn next.']
  ],
  steps: [
    'Introduction to {co}',
    'Set up your account',
    'Complete a first task',
    'Invite your team',
    'Explore advanced features'
  ]
};

/* Goals swap in extra courses from the end of the list, so different goals really do yield
 * different workspaces rather than the same set with a different label. */
const GOAL_COURSES = [
  [
    'deflect',
    'Answers to Your Most-Asked Questions',
    'The questions your support team answers every week, turned into short lessons.'
  ],
  ['advanced', 'Advanced Features Deep Dive', 'The capabilities most customers never discover on their own.'],
  ['hub', 'Welcome to the Academy', 'The front-door course that orients everyone who lands on your portal.']
];

const PATH_TITLES = [
  ['onboard', 'New Customer Onboarding'],
  ['adoption', 'Driving Adoption After Go-Live'],
  ['advanced', 'Power User Track'],
  ['certify', 'Certification Track'],
  ['understand', 'Product Essentials']
];

const COURSE_TYPES = { SELF_PACED: 'Self-paced', COMPLIANCE: 'Compliance' };

function fill(text, company) {
  return text.replaceAll('{co}', company?.trim() || 'your product');
}

function detectCategory(text) {
  const haystack = ` ${(text || '').toLowerCase()} `;
  if (!haystack.trim()) return GENERIC;

  let best = null;
  let bestScore = 0;

  for (const category of CATEGORIES) {
    const score = category.match.reduce((total, keyword) => (haystack.includes(keyword) ? total + 1 : total), 0);
    if (score > bestScore) {
      bestScore = score;
      best = category;
    }
  }

  return best ?? GENERIC;
}

const PATH_CHOICES = [
  { id: 'saas_academy', label: 'SaaS academy', category: null },
  { id: 'customer_enablement', label: 'Customer enablement', category: null },
  { id: 'compliance_training', label: 'Compliance training', category: 'compliance' }
];

/*
 * Four starter courses and one learning path. Courses are drafted from the product
 * context; the goals reshape which courses appear and what the path is called.
 */
function recommend(state) {
  const text = `${state.company} ${state.website} ${state.description}`;
  const chosen = PATH_CHOICES.find((choice) => choice.id === state.pathChoice)?.category;
  const category = state.skipContext
    ? GENERIC
    : (CATEGORIES.find((item) => item.id === chosen) ?? detectCategory(text));
  const wantsCertificate = state.goals.includes('certify');
  const isCompliance = category.id === 'compliance';

  const slots = category.courses.map(([title, desc], index) => ({
    id: `${category.id}-${index}`,
    title: fill(title, state.company),
    desc: fill(desc, state.company),
    origin: 'product'
  }));

  let slot = slots.length - 1;
  for (const [goal, title, desc] of GOAL_COURSES) {
    if (!state.goals.includes(goal) || slot < 2) continue;

    slots[slot] = { id: `goal-${goal}`, title, desc, origin: 'goal' };
    slot -= 1;
  }

  const courses = slots.map((course, index) => ({
    ...course,
    type: isCompliance ? 'COMPLIANCE' : 'SELF_PACED',
    sections: 3,
    lessons: 9,
    certificate: isCompliance || (wantsCertificate && index === slots.length - 1)
  }));

  const pathTitle = PATH_TITLES.find(([goal]) => state.goals.includes(goal))?.[1] ?? 'New Customer Onboarding';

  return {
    categoryId: category.id,
    categoryLabel: category.label,
    courses,
    path: {
      title: pathTitle,
      steps: category.steps.map((step) => fill(step, state.company)),
      certificate: wantsCertificate,
      courseIds: courses.map((course) => course.id)
    }
  };
}

/* A change to any of these invalidates a previous preparation. */
function inputKey(state) {
  return JSON.stringify([state.company, state.website, state.description, [...state.goals].sort(), state.skipContext, state.pathChoice]);
}

const PREP_PHASES = [
  { label: 'Understanding your product', ms: 1100 },
  { label: 'Preparing your customer education content', ms: 1300 },
  { label: 'Organising your starter learning path', ms: 1200 },
  { label: 'Setting up your workspace', ms: 900 }
];

/* ---------- landing page themes ----------
 * The real eleven, in the real order, with the real titles and descriptions
 * (apps/dashboard/src/lib/utils/translations/en.json → settings.landing_page.theme.cards)
 * and the real preview images the dashboard's theme picker hotlinks. `free` mirrors
 * FREE_LANDING_PAGE_THEMES in packages/utils/src/constants/org.ts.
 */
const THEME_PREVIEW_BASE = 'https://assets.cdn.clsrio.com/templates';
const FREE_THEMES = ['quartz'];

const LANDING_THEMES = [
  { id: 'quartz', title: 'Quartz', description: 'Monochrome hairline grid, ruled course rows, sticky enrolment rail' },
  { id: 'minimal', title: 'Minimal', description: 'Clean, bright, and course-focused' },
  { id: 'bold', title: 'Bold', description: 'High contrast, editorial, and striking' },
  { id: 'classic', title: 'Classic', description: 'Traditional layout with balanced hierarchy' },
  { id: 'saas', title: 'SaaS', description: 'Dotted line frame, soft accents, modern product feel' },
  { id: 'tech', title: 'Tech', description: 'Bold brand band, monospace nav, engineering academy feel' },
  { id: 'studio', title: 'Studio', description: 'Hairline borders, gradient hero glow, product-craft polish' },
  { id: 'corporate', title: 'Corporate', description: 'Sober typography, bordered grids, audit-ready look' },
  { id: 'terminal', title: 'Terminal', description: 'Dark surface, ghosted wordmark, CLI-inspired catalog' },
  { id: 'editorial', title: 'Editorial', description: 'Warm cream palette, painterly hero, refined magazine feel' },
  { id: 'vibrant', title: 'Vibrant', description: 'Bold primary panels, sunset gradient hero, energetic poster look' }
].map((theme) => ({
  ...theme,
  free: FREE_THEMES.includes(theme.id),
  preview: `${THEME_PREVIEW_BASE}/${theme.id}.png`
}));

function themeById(id) {
  return LANDING_THEMES.find((theme) => theme.id === id) ?? LANDING_THEMES[0];
}

/* Themes beyond the free set need a paid plan (PREMIUM_ITEMS.theme). */
function canUseTheme(themeId, planId) {
  return themeById(themeId).free || hasPlan(planId, PREMIUM_ITEMS.theme.min);
}

/* ---------- brand colour ----------
 * The org has a single `theme` value: one of five named colours or a custom hex. The five
 * presets are the ones in settings/pages/org.svelte; hexes are the Tailwind steps that
 * app.css maps each name to. There is no secondary/accent colour and no per-org dark mode.
 */
const COLOR_PRESETS = [
  { id: 'blue', label: 'Blue', hex: '#0233bd' },
  { id: 'rose', label: 'Rose', hex: '#e11d48' },
  { id: 'green', label: 'Green', hex: '#65a30d' },
  { id: 'orange', label: 'Orange', hex: '#ea580c' },
  { id: 'purple', label: 'Purple', hex: '#9333ea' }
];

/* ---------- colour helpers ---------- */
function parseColor(input) {
  const value = (input || '').trim();
  if (!value) return null;

  const hex = value.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const digits = hex[1];
    const full =
      digits.length === 3
        ? digits
            .split('')
            .map((char) => char + char)
            .join('')
        : digits;

    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16)
    };
  }

  const rgb = value.match(/^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*(?:[,/]\s*[\d.]+\s*)?\)$/i);
  if (rgb) {
    const channels = [rgb[1], rgb[2], rgb[3]].map(Number);
    if (channels.some((channel) => channel > 255)) return null;

    return { r: channels[0], g: channels[1], b: channels[2] };
  }

  return null;
}

function toHex({ r, g, b }) {
  const pair = (channel) => channel.toString(16).padStart(2, '0');

  return `#${pair(r)}${pair(g)}${pair(b)}`;
}

function toRgbString({ r, g, b }) {
  return `rgb(${r}, ${g}, ${b})`;
}

function formatColor(value, format) {
  const parsed = parseColor(value);
  if (!parsed) return value;

  return format === 'rgb' ? toRgbString(parsed) : toHex(parsed);
}

function relativeLuminance({ r, g, b }) {
  const channel = (raw) => {
    const srgb = raw / 255;

    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(a, b) {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);

  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

function readableOn(color) {
  const parsed = parseColor(color);
  if (!parsed) return '#ffffff';

  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };

  return contrastRatio(parsed, white) >= contrastRatio(parsed, black) ? '#ffffff' : '#111111';
}

function mix(color, target, amount) {
  const base = parseColor(color);
  const other = parseColor(target);
  if (!base || !other) return color;

  const blend = (a, b) => Math.round(a + (b - a) * amount);

  return toHex({ r: blend(base.r, other.r), g: blend(base.g, other.g), b: blend(base.b, other.b) });
}

/* The same thing injectCustomTheme() does for a real org whose `theme` is a hex. */
function brandVars(primary) {
  const color = parseColor(primary) ? primary : DEFAULT_PRIMARY;

  return `--primary:${color};--primary-foreground:${readableOn(color)};--sidebar-primary:${color};--ring:${mix(color, '#ffffff', 0.4)};`;
}

/* ---------- integrations ----------
 * `status` is the honest field.
 *   live     — the dashboard ships it and it works today
 *   plan     — shipped, gated behind a plan
 *   soon     — a page exists in the dashboard but says "coming soon"
 *   planned  — specified in a PRD, not built
 *   none     — does not exist; would need one of the planned items first
 * Sources: README § Integration status.
 */
const INTEGRATIONS = [
  {
    id: 'mcp',
    name: 'MCP',
    status: 'live',
    blurb: 'Author and manage courses from Claude Code, Codex, Cursor or OpenCode.',
    where: 'Automation → MCP',
    color: '#7c3aed',
    mark: 'M',
    clients: ['Claude Code', 'Codex', 'Cursor', 'OpenCode']
  },
  {
    id: 'api',
    name: 'Public API',
    status: 'plan',
    needs: 'Growth',
    blurb: 'API keys for courses and audience from your own backend.',
    where: 'Automation → API',
    color: '#0f172a',
    mark: 'A',
    clients: ['curl', 'JavaScript', 'Python', 'Go']
  },
  {
    id: 'sso',
    name: 'SAML / OIDC SSO',
    status: 'plan',
    needs: 'Enterprise',
    blurb: 'Let customers sign in with their own identity provider.',
    where: 'Settings → Auth → SSO',
    color: '#0ea5e9',
    mark: 'S'
  },
  {
    id: 'zapier',
    name: 'Zapier',
    status: 'soon',
    blurb: 'Trigger Zaps on enrolment and completion. The page exists; the Zapier app does not yet.',
    where: 'Automation → Zapier',
    color: '#ff4f00',
    mark: 'Z'
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    status: 'planned',
    blurb: 'Send enrolment and completion events to a CRM, Slack or your own backend. Specified, not built.',
    where: 'Settings → Integrations',
    color: '#475569',
    mark: 'W'
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    status: 'planned',
    blurb: 'Sync course completion onto the HubSpot contact. Not built yet; it would ride on webhooks.',
    where: 'Settings → Integrations',
    color: '#ff7a59',
    mark: 'H'
  },
  {
    id: 'slack',
    name: 'Slack',
    status: 'none',
    blurb: 'Post when a customer finishes a path. Needs Zapier or webhooks first.',
    where: 'Not available',
    color: '#4a154b',
    mark: 'S'
  }
];

const ZAPIER_APPS = [
  { id: 'slack', name: 'Slack', color: '#4a154b', mark: 'S', use: 'Post when a learner finishes a course' },
  { id: 'gmail', name: 'Gmail', color: '#ea4335', mark: 'G', use: 'Email your team on new enrolments' },
  { id: 'sheets', name: 'Google Sheets', color: '#0f9d58', mark: 'Sh', use: 'Log every completion in a sheet' },
  { id: 'hubspot', name: 'HubSpot', color: '#ff7a59', mark: 'H', use: 'Update the contact when they finish' },
  { id: 'salesforce', name: 'Salesforce', color: '#00a1e0', mark: 'Sf', use: 'Sync learners to leads and contacts' },
  { id: 'notion', name: 'Notion', color: '#17140f', mark: 'N', use: 'Add progress to a Notion database' },
  { id: 'mailchimp', name: 'Mailchimp', color: '#ffe01b', ink: '#17140f', mark: 'Mc', use: 'Add new students to an audience' },
  { id: 'airtable', name: 'Airtable', color: '#18bfff', mark: 'At', use: 'Track learners in a base' },
  { id: 'trello', name: 'Trello', color: '#0079bf', mark: 'T', use: 'Create a card for each new learner' },
  { id: 'zoom', name: 'Zoom', color: '#2d8cff', mark: 'Z', use: 'Register learners for live sessions' }
];

const ONBOARDING_INTEGRATIONS = ['mcp', 'api', 'webhooks', 'hubspot'];
const INTEGRATION_STATUS = {
  live: { label: 'Available now', cls: 'badge-success-soft' },
  plan: { label: 'Paid plan', cls: 'badge-primary-soft' },
  soon: { label: 'Coming soon', cls: 'badge-muted' },
  planned: { label: 'Planned', cls: 'badge-muted' },
  none: { label: 'Not available', cls: 'badge-outline' }
};

/* ---------- plans ----------
 * The five-plan pricing supplied by the product owner for this prototype. It is a PROPOSAL:
 * it differs from the pricing the product ships today (packages/utils/src/plans/data.ts has
 * Basic / Early Adopters / Enterprise). Currency is assumed to be USD. `annual` is the
 * per-month price billed annually; `monthly` is the per-month price billed monthly.
 */
const PLANS = [
  {
    id: 'FREE',
    name: 'Free',
    annual: '0',
    monthly: '0',
    seats: '1',
    learners: '50',
    tokens: '500K',
    features: [
      'Up to 3 courses, 50 learners, 1 admin',
      'Videos, PDFs, text lessons',
      'Quizzes: multiple choice and true/false only',
      'Assignments, sequential progression',
      'Basic completion certificates (ClassroomIO branded)',
      '1 course template, cohort-based delivery',
      'MCP server access, 500K AI token quota',
      'Community support'
    ]
  },
  {
    id: 'STARTER',
    name: 'Starter',
    annual: '29',
    monthly: '35',
    seats: '2',
    learners: '500',
    tokens: '3M',
    features: [
      'Unlimited courses, 500 learners, 2 admins',
      'Custom branding, branded certificates',
      'All quiz question types',
      'Unlimited course templates',
      'Video transcription and AI assistant (3M tokens)',
      'CSV bulk import (up to 1,000)',
      'Basic analytics, email support'
    ]
  },
  {
    id: 'GROWTH',
    name: 'Growth',
    annual: '69',
    monthly: '85',
    seats: '5',
    learners: '5,000',
    tokens: '3M',
    popular: true,
    features: [
      '5,000 learners, 5 admins',
      'Custom domain with SSL, full branding removal',
      'Verifiable certificates with expiry and renewal',
      'Learning paths with prerequisites',
      'REST API (read and write), webhooks, Zapier',
      'Organisation-level enrolment',
      'Advanced analytics, priority email support'
    ]
  },
  {
    id: 'SCALE',
    name: 'Scale',
    annual: '139',
    monthly: '169',
    seats: '15',
    learners: '25,000',
    tokens: '10M',
    features: [
      '25,000 learners, 15 admins, 10M AI tokens',
      'Multi-language, multiple academies',
      'Advanced certification programmes',
      'Higher API rate limits, webhook delivery log',
      'Native CRM integration, sandbox environment',
      'Named contact'
    ]
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    annual: 'Custom',
    monthly: 'Custom',
    seats: 'Unlimited',
    learners: 'Unlimited',
    tokens: 'Custom',
    features: [
      'SSO (SAML and OIDC), SCIM',
      'Audit logs, SLA, custom data residency',
      'SCORM and xAPI if needed',
      'Security review support, DPA, custom contract'
    ]
  }
];

const PLAN_RANK = { FREE: 0, STARTER: 1, GROWTH: 2, SCALE: 3, ENTERPRISE: 4 };

function planById(id) {
  return PLANS.find((plan) => plan.id === id) ?? PLANS[0];
}

function hasPlan(current, minimum) {
  return (PLAN_RANK[current] ?? 0) >= (PLAN_RANK[minimum] ?? 0);
}

/*
 * Every premium item in the prototype and the lowest plan that includes it, read from the
 * tier breakdown. `theme` is an ASSUMPTION: the tier list does not mention landing themes, so
 * they unlock on the first paid plan, matching how the product gates them today.
 */
const PREMIUM_ITEMS = {
  theme: { min: 'STARTER', label: 'Premium themes', assumed: true },
  api: { min: 'GROWTH', label: 'REST API (read and write)' },
  paths: { min: 'GROWTH', label: 'Learning paths with prerequisites' },
  branding: { min: 'GROWTH', label: 'Full branding removal' },
  sso: { min: 'ENTERPRISE', label: 'SSO (SAML and OIDC)' },
  general: { min: 'STARTER', label: 'More from ClassroomIO' }
};

/* ---------- org shell (mirrors org-navigation.ts) ---------- */
const NAV_ICONS = {
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  dashboard:
    '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>',
  stats: '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
  courses: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  paths:
    '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  cohorts:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  media:
    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  tags: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z"/><path d="M7 7h.01"/>',
  widgets:
    '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  landing: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
  audience: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 12 0v1"/>',
  community: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  automation: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>'
};

/* Same groups and order as GROUP_ORDER in org-navigation.ts. The Learning paths item is
 * not in the product — learning paths are specced and prototyped — so it is tagged. */
const ORG_NAV = [
  {
    group: null,
    items: [
      ['home', 'Home'],
      ['dashboard', 'Dashboard'],
      ['stats', 'Stats']
    ]
  },
  {
    group: 'Create',
    items: [
      ['courses', 'Courses'],
      ['paths', 'Learning paths', 'Preview'],
      ['cohorts', 'Cohorts'],
      ['media', 'Media'],
      ['tags', 'Tags']
    ]
  },
  {
    group: 'Distribute',
    items: [
      ['widgets', 'Widgets'],
      ['landing', 'Landing page']
    ]
  },
  {
    group: 'People',
    items: [
      ['audience', 'Audience'],
      ['community', 'Community']
    ]
  },
  {
    group: 'Tools',
    items: [
      ['automation', 'Automation'],
      ['settings', 'Settings']
    ]
  }
];

function navIcon(key) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px">${NAV_ICONS[key] || ''}</svg>`;
}

function renderOrgSidebar(state, active = 'Courses') {
  const name = state.brandName || state.company || 'Your Academy';
  const mark = state.logoDataUrl
    ? `<img src="${state.logoDataUrl}" alt="" style="width:100%;height:100%;object-fit:contain;border-radius:inherit" />`
    : escapeHtml(initials(name));

  return `
    <div class="brand">
      <span class="brand-mark">${mark}</span>
      <span class="brand-name" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(name)}</span>
    </div>
    ${ORG_NAV.map(
      (section) => `
      ${section.group ? `<div class="nav-label">${escapeHtml(section.group)}</div>` : ''}
      ${section.items
        .map(
          ([key, label, tag]) =>
            `<a class="nav-item${label === active ? ' active' : ''}" href="#" data-nav="${escapeHtml(label)}">${navIcon(key)}${escapeHtml(label)}${tag ? `<span class="nav-tag">${escapeHtml(tag)}</span>` : ''}</a>`
        )
        .join('')}`
    ).join('')}`;
}

/* ---------- small helpers ---------- */
function initials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'A';

  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
  });
}

function slugify(value) {
  return (value || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '');
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((value || '').trim());
}

/* Deterministic cover art so a course tile looks the same on every reload. */
function coverFor(id, accent) {
  let hash = 0;
  for (const char of String(id)) hash = (hash * 31 + char.charCodeAt(0)) % 360;

  const tint = mix(accent || DEFAULT_PRIMARY, '#ffffff', 0.55);
  const deep = mix(accent || DEFAULT_PRIMARY, '#000000', 0.2);

  return `linear-gradient(${hash}deg, ${deep}, ${tint})`;
}

const ICONS = {
  rocket:
    '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2a2.12 2.12 0 1 0-3-3Z"/><path d="M12 15 9 12a11 11 0 0 1 8-8c2 0 3 1 3 3a11 11 0 0 1-8 8Z"/>',
  heart:
    '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
  layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
  megaphone: '<path d="m3 11 18-5v12L3 13Z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  lifebuoy:
    '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="m4.9 4.9 4.2 4.2M14.9 14.9l4.2 4.2M14.9 9.1l4.2-4.2M4.9 19.1l4.2-4.2"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  dots: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  sparkle:
    '<path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M12 3v13M7 8l5-5 5 5"/>',
  warn: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  chevdown: '<path d="m6 9 6 6 6-6"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  users:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>',
  pencil: '<path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 22M12 2a15 15 0 0 0 0 22"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
  route:
    '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>'
};

function icon(name, size) {
  const px = size || 16;

  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="width:${px}px;height:${px}px">${ICONS[name] || ''}</svg>`;
}

/* A starter-course card shared by the live preview, the customise stage and the dashboard. */
function courseCardHTML(course, accent, { badge = 'Starter', actions = '' } = {}) {
  return `
    <article class="course" data-course="${escapeHtml(course.id)}">
      <div class="course-cover" style="background:${coverFor(course.id, accent)}">
        <span class="origin badge">${escapeHtml(badge)}</span>
      </div>
      <div class="course-pad">
        <h4>${escapeHtml(course.title)}</h4>
        <p>${escapeHtml(course.desc)}</p>
        <div class="course-meta">
          <span class="badge badge-muted">Draft</span>
          ${course.certificate ? '<span class="badge badge-success-soft">Certificate</span>' : ''}
          <span class="text-muted" style="font-size:11.5px;margin-left:auto">${course.lessons} lessons</span>
        </div>
        ${actions}
      </div>
    </article>`;
}

/* ---------- portal renderers (shared by customize.html and dashboard.html) ---------- */
function brandNameOf(state) {
  return state.brandName.trim() || state.company.trim() || 'Your Academy';
}

function markHTML(state) {
  return state.logoDataUrl ? `<img src="${state.logoDataUrl}" alt="" />` : escapeHtml(initials(brandNameOf(state)));
}

/* A premium theme can only be shown as its stock preview image: rendering it live would
 * need the real Svelte components. The preview image is the asset the real theme picker uses. */
function themeShotHTML(theme) {
  return `<div class="theme-shot"><img src="${theme.preview}" alt="${escapeHtml(theme.title)} theme preview" loading="lazy" onerror="this.closest('.theme-shot').classList.add('broken')" /><div class="theme-shot-fallback">${icon('globe', 22)}<b>${escapeHtml(theme.title)}</b><span>${escapeHtml(theme.description)}</span><span class="text-muted" style="font-size:11.5px">Preview image unavailable offline</span></div></div>`;
}

/* Quartz rendered from packages/ui/src/custom/org-landing-page/quartz/vars.ts. */
function quartzHTML(state) {
  const name = brandNameOf(state);
  const accent = state.primary;

  const cells = state.courses
    .map(
      (course) => `
      <div class="qz-cell">
        <span class="qz-dot" style="background:${coverFor(course.id, accent)}"></span>
        <h3>${escapeHtml(course.title)}</h3>
        <p>${escapeHtml(course.desc)}</p>
        <div class="qz-cell-foot"><span>${course.lessons} lessons${course.certificate ? ' · Certificate' : ''}</span><span class="qz-link">Enrol &rarr;</span></div>
      </div>`
    )
    .join('');

  return `
    <div class="qz" style="--qz-accent:${accent};--qz-accent-fg:${readableOn(accent)}">
      <nav class="qz-nav">
        <span class="qz-logo"><span class="qz-mark">${markHTML(state)}</span>${escapeHtml(name)}</span>
        <span class="qz-links"><span>Courses</span><span>Paths</span><span>Help</span></span>
        <span class="qz-btn">Sign in</span>
      </nav>
      <header class="qz-hero">
        <p class="qz-kicker">${escapeHtml(name)}${/academy$/i.test(name.trim()) ? '' : ' Academy'}</p>
        <h1>Learn ${escapeHtml(name)} <span>at your own pace</span></h1>
        <p class="qz-lede">Short, practical courses that take your team from first login to confident every day.</p>
        <div class="qz-actions"><span class="qz-btn">Browse courses</span>${state.path ? `<span class="qz-btn line">Start: ${escapeHtml(state.path.title)}</span>` : ''}</div>
      </header>
      <div class="qz-toolbar">
        <div class="qz-chips"><span class="on">All</span><span>Self-paced</span><span>Certificate</span></div>
        <div class="qz-search">${icon('search', 13)} Search courses</div>
      </div>
      <div class="qz-label">Courses</div>
      ${cells ? `<div class="qz-cells">${cells}</div>` : '<div class="qz-empty">No courses published yet.</div>'}
      <footer class="qz-foot"><span>&copy; ${new Date().getFullYear()} ${escapeHtml(name)}</span>${hasPlan(state.plan, PREMIUM_ITEMS.branding.min) ? '' : '<span class="qz-brand" data-premium="branding" role="button" tabindex="0" title="Remove ClassroomIO branding (Growth)">Powered by ClassroomIO</span>'}</footer>
    </div>`;
}

window.proto = {
  initTheme,
  toast,
  loadState,
  saveState,
  resetState,
  EMPTY_STATE,
  DEFAULT_PRIMARY,
  STAGES,
  TESTIMONIALS,
  ROLES,
  COMPANY_SIZES,
  LEARNING_METHODS,
  SOURCES,
  AI_PROVIDERS,
  GOALS,
  PATH_CHOICES,
  EXAMPLES,
  CATEGORIES,
  GENERIC,
  COURSE_TYPES,
  PREP_PHASES,
  detectCategory,
  recommend,
  inputKey,
  LANDING_THEMES,
  FREE_THEMES,
  themeById,
  canUseTheme,
  COLOR_PRESETS,
  parseColor,
  toHex,
  toRgbString,
  formatColor,
  contrastRatio,
  readableOn,
  mix,
  brandVars,
  INTEGRATIONS,
  INTEGRATION_STATUS,
  ONBOARDING_INTEGRATIONS,
  ZAPIER_APPS,
  PLANS,
  PLAN_RANK,
  planById,
  hasPlan,
  PREMIUM_ITEMS,
  ORG_NAV,
  navIcon,
  renderOrgSidebar,
  initials,
  escapeHtml,
  slugify,
  isEmail,
  coverFor,
  ICONS,
  icon,
  courseCardHTML,
  brandNameOf,
  markHTML,
  themeShotHTML,
  quartzHTML
};

/* One-shot message left by a page before it navigates (sessionStorage.cioFlash), shown on the next page. */
try { const flashMessage = sessionStorage.getItem("cioFlash"); if (flashMessage) { sessionStorage.removeItem("cioFlash"); document.addEventListener("DOMContentLoaded", () => toast(flashMessage)); } } catch { /* storage can be blocked */ }

/* Show the production route in the address bar. The server maps each one back to its page. */
window.addEventListener("load", function showProductionRoute() {
  try {
    const page = location.pathname.split("/").pop();
    const params = new URLSearchParams(location.search);
    const state = JSON.parse(localStorage.getItem("cioOnboardingState") || "{}");
    const slug = slugify(brandNameOf(state)) || "your-academy";
    const org = `/org/${slug}`;
    const tab = params.get("tab") || "lessons";
    const paths = {
      "site.html": "/",
      "dashboard.html": `${org}/dash`,
      "setup.html": `${org}/setup`,
      "courses.html": `${org}/courses`,
      "templates.html": `${org}/courses/templates`,
      "landing-editor.html": `${org}/landingpage/edit`,
      "settings.html": `${org}/settings`,
      "org-settings.html": `${org}/settings/org`,
      "audience.html": `${org}/audience`,
      "public-courses.html": "/courses",
      "public-course.html": `/course/${params.get("course")}`,
      "enroll.html": `/course/${params.get("course")}/enroll`,
      "learn.html": `/course/${params.get("course")}/lesson/${params.get("item")}`,
      "course.html": params.get("lesson")
        ? `/courses/${params.get("id")}/lessons/${params.get("lesson")}`
        : `/courses/${params.get("id")}/${tab}`
    };
    const target = paths[page];
    if (!target || params.has("embed")) return;
    const rest = new URLSearchParams(params);
    ["id", "tab", "lesson", "course", "item"].forEach((key) => rest.delete(key));
    const query = rest.toString();
    history.replaceState(null, "", target + (query ? `?${query}` : ""));
  } catch { /* the address bar is cosmetic */ }
});
