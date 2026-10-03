/* proto.js — shared prototype behavior: theme, state picker, listing data, public shell. */

(function applyStoredTheme() {
  let stored = null;
  try {
    stored = localStorage.cioTheme;
  } catch (error) {}
  const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
  if (stored === 'dark' || (!stored && prefersDark)) document.documentElement.classList.add('dark');
})();

const ICONS = {
  course:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  images:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>',
  skill:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3l1.9 5.8L20 10l-5 3.6L16.2 20 12 16.4 7.8 20 9 13.6 4 10l6.1-1.2z"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>',
  users:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M16 3.1a4 4 0 0 1 0 7.8M21 21v-2a4 4 0 0 0-3-3.9"/></svg>',
  search:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
};

const TYPE_LABEL = { course: 'Course template', images: 'Image pack', doc: 'Doc', skill: 'AI skill' };

const PUBLISHERS = {
  loopwise: { name: 'Loopwise', color: '#1d4ed8', letter: 'L' },
  northwind: { name: 'Northwind Health', color: '#059669', letter: 'N' },
  brightpath: { name: 'Brightpath Labs', color: '#7c3aed', letter: 'B' },
  fernhill: { name: 'Fernhill Studio', color: '#db2777', letter: 'F' },
  kitepost: { name: 'Kitepost', color: '#ea580c', letter: 'K' },
  acadia: { name: 'Acadia Tutors', color: '#0891b2', letter: 'A' }
};

const LISTINGS = [
  {
    id: 'customer-onboarding-academy',
    type: 'course',
    title: 'Customer Onboarding Academy',
    pub: 'loopwise',
    rating: 4.8,
    reviews: 42,
    used: 318,
    colors: ['#1d4ed8', '#60a5fa', '#0f172a'],
    cat: 'Product education',
    href: 'listing-course.html'
  },
  {
    id: 'hipaa-essentials',
    type: 'course',
    title: 'HIPAA Essentials for Clinic Staff',
    pub: 'northwind',
    rating: 4.7,
    reviews: 28,
    used: 204,
    colors: ['#047857', '#34d399', '#022c22'],
    cat: 'Compliance & safety',
    href: 'listing-course.html'
  },
  {
    id: 'new-manager-90-days',
    type: 'course',
    title: 'New Manager: Your First 90 Days',
    pub: 'brightpath',
    rating: 4.9,
    reviews: 17,
    used: 96,
    colors: ['#6d28d9', '#c4b5fd', '#1e1b4b'],
    cat: 'Leadership & management',
    href: 'listing-course.html'
  },
  {
    id: 'course-covers-soft-gradients',
    type: 'images',
    title: 'Soft Gradient Course Covers',
    pub: 'fernhill',
    rating: 4.9,
    reviews: 61,
    used: 1204,
    grid: ['#f472b6', '#fb923c', '#a78bfa', '#38bdf8'],
    cat: 'Creative',
    href: 'listing-other.html?type=images'
  },
  {
    id: 'build-a-product-101-course',
    type: 'skill',
    title: 'Build a Product 101 course from your docs',
    pub: 'loopwise',
    rating: 4.6,
    reviews: 12,
    used: 143,
    code: '# Product 101 builder\nAsk for the product name,\nthe 3 jobs users hire it for,\nand link to the help center.\n\n## Structure\n1. Why it exists\n2. First win in 10 min',
    cat: 'Product education',
    href: 'listing-other.html?type=skill'
  },
  {
    id: 'sales-discovery-playbook',
    type: 'doc',
    title: 'Sales Discovery Call Playbook',
    pub: 'kitepost',
    rating: 4.5,
    reviews: 9,
    used: 77,
    docColor: '#fff7ed',
    cat: 'Sales & customer success',
    href: 'listing-other.html?type=doc'
  },
  {
    id: 'soc2-security-awareness',
    type: 'course',
    title: 'SOC 2 Security Awareness',
    pub: 'northwind',
    rating: 4.6,
    reviews: 33,
    used: 251,
    colors: ['#0f766e', '#5eead4', '#042f2e'],
    cat: 'Compliance & safety',
    href: 'listing-course.html'
  },
  {
    id: 'ielts-writing-task-2',
    type: 'course',
    title: 'IELTS Writing Task 2 in 4 Weeks',
    pub: 'acadia',
    rating: 4.8,
    reviews: 21,
    used: 88,
    colors: ['#0e7490', '#67e8f9', '#083344'],
    cat: 'Language learning',
    href: 'listing-course.html'
  },
  {
    id: 'flat-illustration-headers',
    type: 'images',
    title: 'Flat Illustration Lesson Headers',
    pub: 'fernhill',
    rating: 4.7,
    reviews: 19,
    used: 402,
    grid: ['#fde68a', '#86efac', '#93c5fd', '#fca5a5'],
    cat: 'Creative',
    href: 'listing-other.html?type=images'
  },
  {
    id: 'compliance-course-from-policy',
    type: 'skill',
    title: 'Turn a policy PDF into a compliance course',
    pub: 'northwind',
    rating: 4.4,
    reviews: 8,
    used: 61,
    code: '# Policy to course\nRead the attached policy.\nOne section per policy clause.\nEnd each section with a\n3-question knowledge check.',
    cat: 'Compliance & safety',
    href: 'listing-other.html?type=skill'
  },
  {
    id: 'onboarding-week-one-doc',
    type: 'doc',
    title: 'New Hire Week One Handbook',
    pub: 'brightpath',
    rating: 4.3,
    reviews: 6,
    used: 54,
    docColor: '#eef2ff',
    cat: 'Onboarding',
    href: 'listing-other.html?type=doc'
  },
  {
    id: 'python-for-analysts',
    type: 'course',
    title: 'Python for Analysts: Pandas in Practice',
    pub: 'kitepost',
    rating: 4.7,
    reviews: 26,
    used: 139,
    colors: ['#b45309', '#fcd34d', '#1c1917'],
    cat: 'Software & technology',
    href: 'listing-course.html'
  }
];

function publisherAvatar(key, size = '') {
  const publisher = PUBLISHERS[key];
  return `<span class="pub-av ${size}" style="background:${publisher.color}">${publisher.letter}</span>`;
}

function coverHtml(listing) {
  const badge = `<span class="type-badge">${ICONS[listing.type]}${TYPE_LABEL[listing.type]}</span>`;
  if (listing.type === 'images')
    return `<div class="cover cover-grid">${badge}${listing.grid.map((color) => `<i style="--c:${color}"></i>`).join('')}</div>`;
  if (listing.type === 'skill') return `<div class="cover cover-skill">${badge}<pre>${listing.code}</pre></div>`;
  if (listing.type === 'doc')
    return `<div class="cover cover-doc" style="--c1:${listing.docColor}">${badge}<div class="page"><b>${listing.title}</b><i style="width:90%"></i><i style="width:70%"></i><i style="width:82%"></i><i style="width:60%"></i></div></div>`;
  const [c1, c2, c3] = listing.colors;
  return `<div class="cover" style="--c1:${c1};--c2:${c2};--c3:${c3}">${badge}<span class="shape"></span><span class="glyph">${listing.title}</span></div>`;
}

function listingCard(listing) {
  const publisher = PUBLISHERS[listing.pub];
  const rating =
    listing.reviews >= 3
      ? `<span><span class="stars">${ICONS.star}</span>${listing.rating.toFixed(1)} (${listing.reviews})</span>`
      : '';
  const used = listing.used >= 5 ? `<span>${ICONS.users}Used by ${listing.used.toLocaleString()} orgs</span>` : '';
  return `<a class="lcard" href="${listing.href}">${coverHtml(listing)}<div class="ttl">${listing.title}</div><div class="by">${publisherAvatar(listing.pub)}${publisher.name}</div><div class="meta">${rating}${used}</div></a>`;
}

function renderCards(selector, filter) {
  document.querySelectorAll(selector).forEach((container) => {
    const items = LISTINGS.filter(filter || (() => true));
    const limit = Number(container.dataset.limit || items.length);
    container.innerHTML = items.slice(0, limit).map(listingCard).join('');
  });
}

function mountPublicShell(active) {
  const nav = document.querySelector('[data-site-nav]');
  if (nav) {
    nav.outerHTML = `<header class="site-nav"><div class="container">
      <a class="logo" href="discover.html"><i>C</i>ClassroomIO</a>
      <nav class="site-links"><a href="#">Product</a><a href="#">Solutions</a><a href="discover.html" class="${active === 'discover' ? 'active' : ''}">Discover</a><a href="#">Pricing</a><a href="#">Blog</a></nav>
      <div class="cta"><button class="icon-btn" data-theme-toggle aria-label="Toggle theme">${ICONS.sun}</button><a class="btn btn-ghost btn-sm" href="import.html">Log in</a><a class="btn btn-primary btn-sm" href="import.html">Get started →</a></div>
    </div></header>`;
  }
  const foot = document.querySelector('[data-site-foot]');
  if (foot) {
    foot.outerHTML = `<footer class="site-foot"><div class="container"><div class="cols">
      <div><a class="logo" href="discover.html" style="margin-bottom:10px"><i>C</i>ClassroomIO</a><p style="margin:0;max-width:280px">The customer and employee training platform for teams that ship.</p></div>
      <div><h4>Discover</h4><a href="discover-browse.html?type=course">Course templates</a><a href="discover-browse.html?type=images">Images</a><a href="discover-browse.html?type=doc">Docs</a><a href="discover-browse.html?type=skill">AI skills</a></div>
      <div><h4>Publish</h4><a href="marketplace-listings.html">Publish your own</a><a href="#">Listing guidelines</a><a href="#">Licenses explained</a></div>
      <div><h4>Company</h4><a href="#">About</a><a href="#">Help center</a><a href="#">Terms</a></div>
    </div><p style="margin:28px 0 0">© 2026 ClassroomIO</p></div></footer>`;
  }
}

function bindThemeToggles() {
  document.querySelectorAll('[data-theme-toggle]').forEach((button) =>
    button.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      try {
        localStorage.cioTheme = isDark ? 'dark' : 'light';
      } catch (error) {}
    })
  );
}

/** Wires a `.state-bar` of `[data-state]` buttons to `[data-state-view~=name]` blocks. */
function bindStatePicker(initial) {
  const buttons = document.querySelectorAll('.state-bar [data-state]');
  if (!buttons.length) return;

  const show = (state) => {
    buttons.forEach((button) => button.classList.toggle('on', button.dataset.state === state));
    document
      .querySelectorAll('[data-state-view]')
      .forEach((view) => view.classList.toggle('shown', view.dataset.stateView.split(' ').includes(state)));
    document.dispatchEvent(new CustomEvent('statechange', { detail: state }));
  };
  buttons.forEach((button) => button.addEventListener('click', () => show(button.dataset.state)));
  const fromUrl = new URLSearchParams(location.search).get('state');
  show(fromUrl || initial || buttons[0].dataset.state);
}

document.addEventListener('DOMContentLoaded', () => {
  mountPublicShell(document.body.dataset.active);
  bindThemeToggles();
});

const APP_NAV = [
  { label: 'Workspace' },
  {
    key: 'dashboard',
    text: 'Dashboard',
    href: '#',
    icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'
  },
  {
    key: 'courses',
    text: 'Courses',
    href: 'imported-template.html',
    icon: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'
  },
  {
    key: 'docs',
    text: 'Docs',
    href: '#',
    icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>'
  },
  {
    key: 'media',
    text: 'Media',
    href: '#',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>'
  },
  {
    key: 'marketplace',
    text: 'Marketplace',
    href: 'marketplace-listings.html',
    icon: '<path d="M3 9h18l-1.5-5h-15z"/><path d="M4 9v11h16V9M9 20v-6h6v6"/>'
  },
  {
    key: 'people',
    text: 'People',
    href: '#',
    icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>'
  },
  { label: 'Settings' },
  { key: 'landing', text: 'Landing page', href: '#', icon: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/>' },
  {
    key: 'ai',
    text: 'AI skills',
    href: 'ai-skills.html',
    icon: '<path d="M12 3l1.9 5.8L20 10l-5 3.6L16.2 20 12 16.4 7.8 20 9 13.6 4 10l6.1-1.2z"/>'
  },
  {
    key: 'billing',
    text: 'Billing',
    href: '#',
    icon: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>'
  }
];

function mountAppSidebar() {
  const slot = document.querySelector('[data-app-sidebar]');
  if (!slot) return;

  const active = slot.dataset.appSidebar;
  const orgName = slot.dataset.org || 'Acadia Tutors';
  const items = APP_NAV.map((item) =>
    item.label
      ? `<div class="nav-label">${item.label}</div>`
      : `<a class="nav-item ${item.key === active ? 'active' : ''}" href="${item.href}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor">${item.icon}</svg>${item.text}</a>`
  ).join('');
  slot.outerHTML = `<aside class="sidebar"><div class="brand"><div class="brand-mark" style="background:#0891b2">${orgName[0]}</div><div class="brand-name">${orgName}</div></div>${items}<div class="sidebar-foot"><div class="avatar">PS</div><div class="who"><div class="nm">Priya Shah</div><div class="rl">Admin</div></div></div></aside>`;
}

document.addEventListener('DOMContentLoaded', mountAppSidebar);
