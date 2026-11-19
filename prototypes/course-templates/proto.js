/* proto.js — theme, state picker, org + course shells for the course-templates prototypes. */

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
  more: I('<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>'),
  search: I('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  filter: I('<path d="M3 6h18M7 12h10M10 18h4"/>'),
  grid: I(
    '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'
  ),
  template: I('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>'),
  copy: I(
    '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'
  ),
  share: I('<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>'),
  invite: I(
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>'
  ),
  trash: I('<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>'),
  ext: I('<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14 21 3"/>'),
  refresh: I('<path d="M21 12a9 9 0 0 1-15.5 6.3L3 16M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5M3 21v-5h5"/>'),
  lesson: I('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>'),
  exercise: I('<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'),
  lock: I('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
  alert: I('<path d="M12 9v4M12 17h.01"/><circle cx="12" cy="12" r="10"/>'),
  sparkles: I(
    '<path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'
  ),
  user: I('<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 12 0v1"/>'),
  x: I('<path d="M18 6 6 18M6 6l12 12"/>'),
  check: I('<path d="M20 6 9 17l-5-5"/>'),
  info: I('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>'),
  sidebar: I('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>'),
  enter: I('<path d="M9 10 4 15l5 5"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/>')
};

function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((node) => (node.outerHTML = ICONS[node.dataset.icon]));
}

const ORG_NAV = [
  ['Dashboard', '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', '#'],
  [
    'Courses',
    '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    'courses.html'
  ],
  ['Programs', '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>', '#'],
  ['Community', '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', '#'],
  ['Audience', '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>', '#'],
  [
    'Media',
    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    '#'
  ],
  [
    'Settings',
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7.8 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3.8 13.7H3.5a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 5 7.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10.3 3.8V3.5a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 16.2 5l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 .6 2.5"/>',
    '#'
  ]
];

const COURSE_NAV = [
  'News Feed',
  'Content',
  'Certificates',
  'Analytics',
  'Submissions',
  'Marks',
  'Landing Page',
  'People',
  'AI Tutor',
  'Settings'
];
const TEMPLATE_HIDDEN = ['Analytics', 'Submissions', 'Marks', 'People'];

function mountShells() {
  const orgSlot = document.querySelector('[data-org-sidebar]');
  if (orgSlot) {
    const items = ORG_NAV.map(
      ([label, paths, href]) =>
        `<a class="nav-item ${label === 'Courses' ? 'active' : ''}" href="${href}">${I(paths)}${label}</a>`
    ).join('');
    orgSlot.outerHTML = `<aside class="sidebar"><div class="brand"><div class="brand-mark">U</div><div class="brand-name">Udemy Test</div></div>${items}<div class="sidebar-foot"><div class="avatar">AT</div><div class="who"><div class="nm">Admin Test</div><div class="rl">Admin</div></div></div></aside>`;
  }

  const courseSlot = document.querySelector('[data-course-sidebar]');
  if (!courseSlot) return;

  const isTemplate = courseSlot.dataset.courseSidebar === 'template';
  const activeItem = courseSlot.dataset.active || 'Content';
  const nav = COURSE_NAV.filter((label) => !isTemplate || !TEMPLATE_HIDDEN.includes(label));
  const items = nav
    .map(
      (label) =>
        `<a class="nav-item ${label === activeItem ? 'active' : ''}" href="${label === 'Content' && !isTemplate ? 'course-content.html' : label === 'Settings' && !isTemplate ? 'course-settings.html' : '#'}">${ICONS.lesson}${label}</a>`
    )
    .join('');
  courseSlot.outerHTML = `<aside class="sidebar"><a class="nav-item" href="courses.html" style="margin-bottom:10px">${ICONS.chevLeft}Courses</a>${items}</aside>`;
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

/** Toggles `[data-menu-for=id]` popovers from `[data-menu=id]` triggers; closes on outside click and Escape. */
function bindMenus() {
  document.querySelectorAll('[data-menu]:not([data-bound])').forEach((trigger) =>
    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      const menu = document.querySelector(`[data-menu-for="${trigger.dataset.menu}"]`);
      const wasOpen = !menu.hidden;
      document.querySelectorAll('[data-menu-for]').forEach((other) => (other.hidden = true));
      menu.hidden = wasOpen;
    })
  );
  const closeAll = () => document.querySelectorAll('[data-menu-for]').forEach((menu) => (menu.hidden = true));
  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-menu-for]')) closeAll();
  });
  document.addEventListener('keydown', (event) => event.key === 'Escape' && closeAll());
}

document.addEventListener('DOMContentLoaded', () => {
  mountShells();
  hydrateIcons();
  bindMenus();
  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.innerHTML = ICONS.sun;
    button.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      try {
        localStorage.cioTheme = isDark ? 'dark' : 'light';
      } catch (error) {}
    });
  });
});

const TEMPLATES = [
  {
    id: 'org-onboarding',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c',
    scope: 'org',
    title: 'Onboarding Academy (Udemy Test)',
    sub: 'Self paced',
    type: 'Self paced',
    colors: ['#1e3a8a', '#60a5fa'],
    lastUsed: 'Used Sep 20',
    counts: '4 sections · 15 lessons · 5 exercises',
    description: 'Our house version of customer onboarding, with Udemy Test screenshots and support links.',
    outline: [
      [
        'Welcome aboard',
        ['Why you’re here', 'How this academy works', 'Meet your success team'],
        ['Quick check · 4 questions']
      ],
      ['Set up your account', ['Create your workspace', 'Connect your data'], ['Setup checklist · 6 questions']]
    ]
  },
  {
    id: 'onboarding',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
    scope: 'global',
    group: 'Customer education',
    title: 'Customer Onboarding Academy',
    sub: 'by ClassroomIO',
    type: 'Self paced',
    colors: ['#1d4ed8', '#93c5fd'],
    art: 'Onboarding',
    counts: '4 sections · 11 lessons · 6 exercises',
    description:
      'Take new customers from sign-up to their first real win. Swap in your product’s screenshots and help links and it’s ready to publish.',
    highlights: [
      ['Sequential progression', 'Learners unlock each lesson in order.'],
      ['AI tutor, hint-only', 'Helps during exercises without giving answers away.'],
      ['Proof-of-work answers', 'Learners paste a link to the first thing they built.'],
      ['Certificate rules', 'Issued at 100% completion with an 80% final score.']
    ],
    outline: [
      [
        'Welcome aboard',
        ['Why you’re here, in two minutes', 'How this academy works', 'Meet your success team'],
        ['Quick check · 4 questions']
      ],
      [
        'Set up your account',
        ['Create your workspace', 'Connect your data', 'Roles and permissions'],
        ['Setup checklist · 5 questions']
      ],
      [
        'Your first workflow',
        ['The core loop', 'Shortcuts that save hours', 'Common mistakes'],
        ['Scenario quiz · 8 questions', 'Prove it · 1 question']
      ],
      [
        'Bring your team',
        ['Inviting teammates', 'Where to get help'],
        ['Final review · 10 questions', 'How did we do? · 2 questions']
      ]
    ]
  },
  {
    id: 'product',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
    scope: 'global',
    group: 'Customer education',
    title: 'Product Training: Power User Path',
    sub: 'by ClassroomIO',
    type: 'Self paced',
    colors: ['#6d28d9', '#c4b5fd'],
    art: 'Power user',
    counts: '4 sections · 7 lessons · 5 exercises · EN, FR',
    description:
      'Go deeper than onboarding: learners pick an Admin or Analyst path and finish by recording a walkthrough.',
    highlights: [
      ['Branching exercises', 'The first exercise sends learners down the Admin or Analyst track.'],
      ['Two languages', 'Every lesson in English and French.'],
      ['Video-recording answers', 'A 90-second walkthrough, graded by a tutor.'],
      ['Hotspot questions', 'Click the right spot on a real screenshot.']
    ],
    outline: [
      ['Pick your path', [], ['Which describes you? · branches']],
      ['Admin track', ['Permissions at scale', 'Single sign-on and provisioning', 'Audit logs'], ['Find it · hotspot']],
      ['Analyst track', ['Building advanced reports', 'Automations'], ['Crunch the numbers · 6 questions']],
      ['Show what you know', [], ['Record a walkthrough · video', 'Case study · tutor-graded']]
    ]
  },
  {
    id: 'leadgen',
    image: 'https://images.unsplash.com/photo-1516414447565-b14be0adf13e',
    scope: 'global',
    group: 'Customer education',
    title: 'Customer Education 101',
    sub: 'by ClassroomIO · Free course',
    type: 'Public',
    colors: ['#c2410c', '#fdba74'],
    art: 'Free course',
    counts: '5 lessons · 5 quizzes',
    description: 'A free, no-signup mini course that brings prospects in and ends with a “Book a demo” call to action.',
    highlights: [
      ['Public course', 'No signup; every lesson is an SEO-indexable page.'],
      ['Callout CTA', 'A “Book a demo” button at the end of the course.'],
      ['Copy as Markdown', 'Readers can copy any lesson.'],
      ['Embeddable', 'Drop the course onto your website with the widget.']
    ],
    outline: [
      [
        'Lessons',
        [
          'Why customers stop using products',
          'Map the first-week journey',
          'Write lessons people finish',
          'Measure what matters',
          'Turn learners into advocates'
        ],
        ['5 quizzes · 3 questions each']
      ]
    ]
  },
  {
    id: 'compliance',
    image: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7',
    scope: 'global',
    group: 'Compliance',
    title: 'Annual Security & Privacy Awareness',
    sub: 'by ClassroomIO',
    type: 'Compliance',
    colors: ['#047857', '#6ee7b7'],
    art: 'Security 2026',
    counts: '6 sections · 5 lessons · 6 exercises',
    description:
      'The yearly security training every employee needs, with renewals, deadlines and a policy attestation built in.',
    highlights: [
      ['Renews every 12 months', 'Learners are re-assigned automatically.'],
      ['Deadlines and reminders', 'Due 30 days after assignment, with nudges.'],
      ['Policy attestation', 'Learners confirm they’ve read the policy.'],
      ['Audit-ready certificates', 'Each certificate shows its renewal date.']
    ],
    outline: [
      ['Why this matters', ['A real incident, in three minutes'], []],
      ['Spotting phishing', ['What phishing looks like now'], ['Spot the red flags · hotspot']],
      ['Passwords and MFA', ['Passwords and multi-factor authentication'], ['Quick check · 3 questions']],
      ['Handling customer data', ['Handling customer data'], ['Classify it · matching']],
      ['Reporting an incident', ['Who to tell, and when'], ['Put it in order · ordering']],
      ['Final assessment', [], ['Final assessment · 10 questions', 'Policy attestation']]
    ]
  }
];

const TYPE_BADGE_ICON = {
  'Self paced': ICONS.user,
  'Live class': '<span class="tdot" style="background:#ef4444"></span>',
  Compliance: I('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>').replace(
    '<svg',
    '<svg style="color:#059669"'
  ),
  Public: I(
    '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'
  )
};

/** Course-type badge, same as course cards (bottom-left of the image). */
function typeBadge(type) {
  return `<span class="badge badge-secondary ttype">${TYPE_BADGE_ICON[type] || ''}${type}</span>`;
}

/** Unsplash image URL sized for the slot it fills. */
function unsplash(url, width) {
  return `${url}?w=${width}&q=70&auto=format&fit=crop`;
}

function templateThumb(template, width = 420) {
  if (!template) return '<div class="tthumb tthumb-blank"><span class="plus"></span></div>';

  const [from, to] = template.colors;
  return `<div class="tthumb" style="--t1:${from};--t2:${to}"><img src="${unsplash(template.image, width)}" alt="" loading="lazy" />${typeBadge(template.type)}</div>`;
}

function templateCard(template, { menu = false } = {}) {
  if (!template)
    return `<a class="tcard" href="#" data-blank>${templateThumb()}<span class="tt">Blank course</span><span class="ts">Start from scratch</span></a>`;

  const more = menu
    ? `<button class="icon-btn tmore" aria-label="Template actions" data-menu="t-${template.id}">${ICONS.more}</button><div class="menu" data-menu-for="t-${template.id}" hidden style="top:34px;right:6px"><a class="menu-item" href="template.html">${ICONS.ext}Open</a><button class="menu-item">${ICONS.copy}Duplicate</button><div class="menu-sep"></div><button class="menu-item" style="color:var(--destructive)">${ICONS.trash}Delete</button></div>`
    : '';
  return `<div class="tcard-wrap"><a class="tcard" href="templates.html?preview=${template.id}" data-preview="${template.id}">${templateThumb(template)}<span class="tt">${template.title}</span><span class="ts">${template.sub}</span></a>${more}</div>`;
}

/** Mirrors features/ui/navigation/app-header.svelte: sidebar trigger | breadcrumbs … setup · Open Academy · Search ⌘K · notifications. */
function mountAppHeader() {
  const slot = document.querySelector('[data-app-header]');
  if (!slot) return;

  const crumbs = slot.dataset.appHeader.split('/').map((crumb) => crumb.trim());
  const trail = crumbs
    .map((crumb, index) =>
      index === crumbs.length - 1
        ? `<span class="here">${crumb}</span>`
        : `<a href="${index === 0 ? 'courses.html' : '#'}">${crumb}</a>`
    )
    .join('<span class="sep">/</span>');
  const bell = I('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>');
  slot.outerHTML = `<header class="app-header">
    <button class="btn btn-ghost btn-sm" aria-label="Toggle sidebar" style="padding:0 6px">${ICONS.sidebar}</button>
    <span class="vsep"></span>
    <nav class="crumbs"><a href="#" class="org-crumb"><span class="brand-mark" style="width:18px;height:18px;font-size:10px;border-radius:5px">U</span>Udemy Test</a><span class="sep">/</span>${trail}</nav>
    <span class="grow"></span>
    <a class="setup-ring" href="#" aria-label="Setup checklist"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" fill="none" stroke="var(--muted)" stroke-width="4"/><circle cx="18" cy="18" r="15" fill="none" stroke="var(--primary)" stroke-width="4" stroke-dasharray="94.2" stroke-dashoffset="37.7" transform="rotate(-90 18 18)"/></svg></a>
    <a class="btn btn-outline btn-sm" href="#">${ICONS.ext}Open Academy</a>
    <div class="hsearch">${ICONS.search}<span>Search</span><span class="kbd">⌘</span><span class="kbd">K</span></div>
    <span style="position:relative"><button class="btn btn-secondary btn-sm" aria-label="Notifications" style="padding:0 8px">${bell}</button><span class="ncount">3</span></span>
    <button class="icon-btn" data-theme-toggle aria-label="Toggle theme"></button>
  </header>`;
}

document.addEventListener('DOMContentLoaded', () => {
  mountAppHeader();
  const toggle = document.querySelector('.app-header [data-theme-toggle]');
  if (!toggle) return;

  toggle.innerHTML = ICONS.sun;
  toggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    try {
      localStorage.cioTheme = isDark ? 'dark' : 'light';
    } catch (error) {}
  });
});
