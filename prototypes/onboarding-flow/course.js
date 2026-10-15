/*
 * course.js — the course shell: routes/(app)/courses/[id]/+layout.svelte. A course has its own
 * sidebar (Exit course, the course, its nav items, the content tree) and its own header (active
 * section, publish badges, View course site and the actions menu). Each tab is a module that
 * registers itself on window.COURSE_TABS before this file runs:
 *
 *   window.COURSE_TABS.lessons = {
 *     nav: 'content',            // which sidebar item it highlights
 *     title: 'Content',          // header label
 *     html(ctx) { return '...' }, // page markup
 *     wire(ctx) {}               // listeners, after html is in #page
 *   };
 *
 * ctx = { S, course, params, commit, rerender, say, confirm, $, $$, esc, ic, M, P }
 */
const P = window.proto;
const M = window.model;
const S = P.loadState();

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = P.escapeHtml;
const params = new URLSearchParams(window.location.search);

const ICON = {
  back: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  news: '<path d="M15 18h-5"/><path d="M18 14h-8"/><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="10" y="6" rx="1"/>',
  content:
    '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  certificates:
    '<path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/>',
  analytics: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  marks:
    '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  landingpage:
    '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  people:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  aitutor:
    '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
  settings:
    '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  lesson:
    '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  exercise:
    '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  ext: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  dots: '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
  panel: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>',
  eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
  trash:
    '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  globe:
    '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  check: '<path d="M20 6 9 17l-5-5"/>'
};

function ic(name, size = 16) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:${size}px;height:${size}px;flex-shrink:0">${ICON[name] ?? ''}</svg>`;
}

function commit() {
  P.saveState(S);
}

const course = M.findCourse(S, params.get('id'));
const tabName = params.get('tab') || 'lessons';
const tab = (window.COURSE_TABS ?? {})[tabName] ?? null;

let toastTimer = 0;

function say(message) {
  P.toast(message);
  clearTimeout(toastTimer);
}

/* A confirm dialog in the product's Dialog style; resolves true on the destructive/primary button. */
function confirmDialog({ title, body, confirm, danger = false }) {
  return new Promise((resolve) => {
    const host = $('#modal-host');

    host.innerHTML = `
      <div class="scrim" id="scrim">
        <div class="modal" role="alertdialog" aria-modal="true" style="max-width:440px">
          <h3 style="margin:0 0 6px">${esc(title)}</h3>
          <p style="margin:0">${esc(body)}</p>
          <div class="modal-actions">
            <button class="btn btn-outline btn-sm" id="cf-cancel" type="button">Cancel</button>
            <button class="btn ${danger ? 'btn-destructive' : 'btn-primary'} btn-sm" id="cf-ok" type="button">${esc(confirm)}</button>
          </div>
        </div>
      </div>`;

    const close = (result) => {
      host.innerHTML = '';
      document.removeEventListener('keydown', onKey);
      resolve(result);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') close(false);
    };

    document.addEventListener('keydown', onKey);
    $('#cf-cancel').addEventListener('click', () => close(false));
    $('#cf-ok').addEventListener('click', () => close(true));
    $('#scrim').addEventListener('click', (event) => {
      if (event.target.id === 'scrim') close(false);
    });
    $('#cf-ok').focus();
  });
}

const NAV = [
  { id: 'news', title: 'News Feed', icon: 'news', tab: 'news' },
  { id: 'content', title: 'Content', icon: 'content', tab: 'lessons', tree: true },
  { id: 'certificates', title: 'Certificates', icon: 'certificates', tab: 'certificates' },
  { id: 'analytics', title: 'Analytics', icon: 'analytics', tab: 'analytics' },
  { id: 'marks', title: 'Marks', icon: 'marks', tab: 'marks' },
  { id: 'landingpage', title: 'Landing Page', icon: 'landingpage', tab: 'landingpage' },
  { id: 'people', title: 'People', icon: 'people', tab: 'people' },
  { id: 'aitutor', title: 'AI Tutor', icon: 'aitutor', tab: 'ai-tutor' },
  { id: 'settings', title: 'Settings', icon: 'settings', tab: 'settings' }
];

const treeClosed = new Set();
const treeOpen = { has: (id) => !treeClosed.has(id) };

function sidebarHTML() {
  const active = tab?.nav ?? tabName;

  return `
    <div class="rd-side-h">
      <a class="cs-back" href="${esc(M.R.courses())}">${ic('back', 16)}<span>Exit course</span></a>
    </div>
    <div class="cs-title">
      <span class="cs-mark">${esc(P.initials(course.title).slice(0, 2))}</span>
      <span class="cs-name"><b>${esc(course.title)}</b><small>${esc({ COMPLIANCE: 'Compliance', LIVE_CLASS: 'Live class', PUBLIC: 'Public' }[course.type] ?? 'Self paced')}</small></span>
    </div>
    <div class="rd-side-c">
      <div class="rd-group">
        ${NAV.map((item) => {
          const isActive =
            item.id === active || (item.id === 'content' && ['lessons', 'lesson', 'exercise'].includes(tabName));
          const count = M.counts(course);
          const total = count.lessons + count.exercises;

          return `
          <a class="rd-item${isActive ? ' active' : ''}" href="${esc(M.R.course(course.id, item.tab))}" data-course-nav="${item.id}">
            ${ic(item.icon)}<span>${esc(item.title)}</span>${item.tree && total ? `<span class="rd-count">${total}</span>` : ''}
          </a>
          ${item.tree ? treeHTML() : ''}`;
        }).join('')}
      </div>
    </div>
    <div class="rd-side-f">
      <div class="rd-user"><span class="rd-av">${esc(P.initials(S.fullname || 'Ada Okafor'))}</span><span class="tx"><span>${esc(S.fullname || 'Ada Okafor')}</span><span class="text-muted">Admin</span></span></div>
    </div>`;
}

function treeHTML() {
  const sections = M.ensureCourse(course).sections;

  if (!sections.length) return '';

  return `<div class="cs-tree">
    ${sections
      .map(
        (section) => `
      <div class="cs-sec">
        <button class="cs-sec-h" type="button" data-tree="${esc(section.id)}" aria-expanded="${treeOpen.has(section.id)}">${ic(treeOpen.has(section.id) ? 'down' : 'right', 14)}<span>${esc(section.title)}</span></button>
        ${
          treeOpen.has(section.id)
            ? section.lessons
                .map(
                  (lesson) => `
          <a class="cs-lesson${params.get('lesson') === lesson.id ? ' on' : ''}" href="${esc(M.R.lesson(course.id, lesson.id))}">${ic(lesson.kind === 'exercise' ? 'exercise' : 'lesson', 14)}<span>${esc(lesson.title)}</span></a>`
                )
                .join('')
            : ''
        }
      </div>`
      )
      .join('')}
  </div>`;
}

function headerHTML() {
  const item = NAV.find((entry) => entry.id === (tab?.nav ?? tabName)) ?? NAV[1];
  const published = course.published;

  return `
    <button class="rd-ib" id="side-toggle" aria-label="Toggle sidebar">${ic('panel')}</button>
    <span class="rd-sep"></span>
    <div class="cs-crumb">
      <b>${esc(tab?.title ?? item.title)}</b>
      ${course.visibility === 'public' ? '<span class="cs-badge">Public</span>' : ''}
      <span class="cs-badge ${published ? 'on' : ''}">${published ? 'Published' : 'Unpublished'}</span>
    </div>
    <span class="rd-grow"></span>
    <div class="cs-actions">
      <button class="btn btn-outline btn-sm" id="view-site" type="button">${ic('ext', 14)}<span>View course site</span></button>
      <div class="cs-menu">
        <button class="btn btn-outline btn-sm" id="menu-btn" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="Course actions">${ic('dots', 14)}</button>
        <div class="cs-pop" id="menu-pop" role="menu" hidden>
          <button type="button" role="menuitem" data-act="student">${ic('eye', 14)} View as student</button>
          <button type="button" role="menuitem" data-act="copy">${ic('link', 14)} Copy course link</button>
          <button type="button" role="menuitem" data-act="publish">${ic('globe', 14)} ${published ? 'Unpublish course' : 'Publish course'}</button>
          <button type="button" role="menuitem" class="danger" data-act="delete">${ic('trash', 14)} Delete course</button>
        </div>
      </div>
    </div>`;
}

const ctx = {
  S,
  course,
  params,
  M,
  P,
  $,
  $$,
  esc,
  ic,
  commit,
  say,
  confirm: confirmDialog,
  rerender: () => render(),
  publish: (value) => {
    M.setPublished(S, course.id, value);
    commit();
    render();
    say(value ? 'Course published (simulated). It now shows on your landing page.' : 'Course unpublished.');
  },
  remove: async () => {
    const ok = await confirmDialog({
      title: 'Delete course',
      body: `"${course.title}" and its lessons will be removed. This cannot be undone.`,
      confirm: 'Delete course',
      danger: true
    });

    if (!ok) return;

    M.deleteCourse(S, course.id);
    commit();
    window.location.href = M.R.courses();
  }
};

function wireChrome() {
  $$('[data-tree]').forEach((button) =>
    button.addEventListener('click', () => {
      const id = button.dataset.tree;

      if (treeClosed.has(id)) treeClosed.delete(id);
      else treeClosed.add(id);
      $('#side').innerHTML = sidebarHTML();
      wireChrome();
    })
  );

  $('#side-toggle')?.addEventListener('click', () => document.querySelector('.rd').classList.toggle('cs-collapsed'));

  $('#view-site').addEventListener('click', async () => {
    if (course.published) {
      window.location.href = M.R.publicCourse(course.id);
      return;
    }

    const ok = await confirmDialog({
      title: 'This course is not published',
      body: 'Visitors cannot open it yet. Publish it first, or view it as a student to see what they will see.',
      confirm: 'Publish course'
    });

    if (ok) ctx.publish(true);
  });

  const menu = $('#menu-pop');

  $('#menu-btn').addEventListener('click', (event) => {
    event.stopPropagation();
    menu.hidden = !menu.hidden;
    $('#menu-btn').setAttribute('aria-expanded', String(!menu.hidden));
  });
  document.addEventListener('click', () => {
    menu.hidden = true;
  });
  $$('[data-act]', menu).forEach((button) =>
    button.addEventListener('click', () => {
      menu.hidden = true;

      if (button.dataset.act === 'student') window.location.href = M.R.learn(course.id);
      if (button.dataset.act === 'publish') ctx.publish(!course.published);
      if (button.dataset.act === 'delete') ctx.remove();
      if (button.dataset.act === 'copy') {
        navigator.clipboard?.writeText(`${M.orgInfo(S).url}/course/${course.slug}`).catch(() => {});
        say('Course link copied.');
      }
    })
  );
}

function render() {
  document.documentElement.style.cssText = P.brandVars(S.primary);

  if (!course) {
    $('#side').innerHTML = '';
    $('#header').innerHTML = '';
    $('#page').innerHTML =
      `<div class="cs-empty"><h1>Course not found</h1><p>It may have been deleted.</p><a class="btn btn-primary" href="${esc(M.R.courses())}">Back to courses</a></div>`;

    return;
  }

  $('#side').innerHTML = sidebarHTML();
  $('#header').innerHTML = headerHTML();
  document.title = `${course.title} - ClassroomIO`;

  $('#page').innerHTML = tab
    ? tab.html(ctx)
    : `<div class="cs-empty"><h1>${esc(NAV.find((item) => item.tab === tabName)?.title ?? tabName)}</h1><p>This part of the course is not built in the prototype yet.</p><a class="btn btn-outline" href="${esc(M.R.course(course.id, 'lessons'))}">Back to content</a></div>`;

  wireChrome();
  tab?.wire?.(ctx);
}

render();
