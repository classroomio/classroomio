/*
 * proto.js — shared behaviour for the mobile-app prototypes.
 *
 * Deliberately tiny: a theme toggle, plus opt-in interactions (segmented
 * controls, in-screen tabs, chips, bottom sheets, switches) that pages get
 * for free by using the right data attribute. No framework, no build step.
 */

(function () {
  // ---- device chrome ------------------------------------------------------
  // <div class="statusbar" data-status="9:41" data-offline></div>
  const SIGNAL =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8"/></svg>';
  const WIFI =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 13a10 10 0 0 1 14 0M8.5 16.5a5 5 0 0 1 7 0M12 20h.01"/></svg>';
  const WIFI_OFF =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M2 2 22 22M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 4-2.4M12 20h.01"/></svg>';
  const BATTERY =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/></svg>';

  document.querySelectorAll('[data-status]').forEach((bar) => {
    const offline = bar.hasAttribute('data-offline');
    bar.innerHTML = `<span>${bar.dataset.status}</span><span class="icons">${offline ? '' : SIGNAL}${
      offline ? WIFI_OFF : WIFI
    }${BATTERY}</span>`;
  });

  // <nav class="tabbar" data-tabbar="home" data-role="tutor"></nav>
  const TAB_ICONS = {
    home: '<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    learn:
      '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    compliance:
      '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    teach:
      '<path d="M21.4 10.9a1 1 0 0 0 0-1.8L12.8 5.2a2 2 0 0 0-1.6 0L2.6 9.1a1 1 0 0 0 0 1.8l8.6 3.9a2 2 0 0 0 1.6 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    community: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/>',
    profile: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
  };
  const LEARNER_TABS = [
    { id: 'home', label: 'Home', href: 'home.html' },
    { id: 'learn', label: 'Learn', href: 'learn.html' },
    { id: 'compliance', label: 'Compliance', href: 'compliance.html' },
    { id: 'community', label: 'Community', href: 'community.html' },
    { id: 'profile', label: 'Profile', href: 'profile.html' }
  ];
  const TUTOR_TABS = [
    { id: 'home', label: 'Home', href: 'home.html' },
    { id: 'learn', label: 'Learn', href: 'learn.html' },
    { id: 'teach', label: 'Teach', href: 'tutor-grading.html' },
    { id: 'community', label: 'Community', href: 'community.html' },
    { id: 'profile', label: 'Profile', href: 'profile.html' }
  ];

  document.querySelectorAll('[data-tabbar]').forEach((bar) => {
    const active = bar.dataset.tabbar;
    const badges = (bar.dataset.badges || '').split(',').filter(Boolean);
    const tabs = bar.dataset.role === 'tutor' ? TUTOR_TABS : LEARNER_TABS;

    bar.innerHTML = tabs
      .map((tab) => {
        const badge = badges.find((entry) => entry.startsWith(`${tab.id}:`));
        const value = badge ? badge.split(':')[1] : '';
        const marker =
          value === 'dot' ? '<span class="dot"></span>' : value ? `<span class="count">${value}</span>` : '';
        return `<a class="tab${tab.id === active ? ' on' : ''}" href="${tab.href}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor">${
          TAB_ICONS[tab.id]
        }</svg>${tab.label}${marker}</a>`;
      })
      .join('');
  });

  // ---- theme toggle -------------------------------------------------------
  const toggle = document.querySelector('.theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const dark = document.documentElement.classList.toggle('dark');
      localStorage.cioTheme = dark ? 'dark' : 'light';
    });
  }

  // ---- exclusive selection groups ----------------------------------------
  // Any container with [data-select] makes its direct children mutually
  // exclusive on click: .segmented, .tabs, .chips, option lists.
  document.querySelectorAll('[data-select]').forEach((group) => {
    const activeClass = group.dataset.select || 'on';
    group.addEventListener('click', (event) => {
      const target = event.target.closest('[data-option]');
      if (!target || !group.contains(target)) return;

      group.querySelectorAll('[data-option]').forEach((option) => option.classList.remove(activeClass));
      target.classList.add(activeClass);
    });
  });

  // ---- bottom sheets ------------------------------------------------------
  // [data-sheet-open="id"] shows #id and its scrim; [data-sheet-close] hides.
  function setSheet(id, open) {
    const sheet = document.getElementById(id);
    if (!sheet) return;

    const scrim = sheet.parentElement.querySelector(`[data-scrim-for="${id}"]`);
    sheet.style.display = open ? 'flex' : 'none';
    if (scrim) scrim.style.display = open ? 'block' : 'none';
  }

  document.querySelectorAll('[data-sheet-open]').forEach((trigger) => {
    trigger.addEventListener('click', () => setSheet(trigger.dataset.sheetOpen, true));
  });

  document.querySelectorAll('[data-sheet-close]').forEach((trigger) => {
    trigger.addEventListener('click', () => setSheet(trigger.dataset.sheetClose, false));
  });

  document.querySelectorAll('[data-scrim-for]').forEach((scrim) => {
    scrim.addEventListener('click', () => setSheet(scrim.dataset.scrimFor, false));
  });
})();
