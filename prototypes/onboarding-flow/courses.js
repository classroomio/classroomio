/*
 * courses.js — the Courses page (routes/(app)/org/[slug]/courses), registered on window.PAGES.courses
 * so dashboard.js renders the shell around it.
 *
 * Mirrors +page.svelte and features/course/{pages/courses, components/{template-row, course-list-row,
 * card, card-dropdown, course-context-menu-content, course-filter-popover}}.svelte: the "Create a new
 * course" template row, the "Your courses" bar (search, Filter popover with sort, order, status and
 * type, grid/list toggle, default list), the grid card and the list row, Load more, and both empty
 * states. Filters live in the URL as in production (search, sort, order, type, status, next).
 * Creating a course, cloning, saving as a template and deleting use the dialogs in templates-core.js.
 * Opening a course goes to the real course page (M.R.course); there is no inline editor any more.
 */
(function () {
  const U = window.CIOCourseUI;
  const M = window.model;
  const P = window.proto;
  const { icon, esc } = U;

  const PAGE_SIZE = 20;
  const SORT_OPTIONS = [
    ['date_created', 'Date Created'],
    ['last_updated_at', 'Last Updated At'],
    ['published', 'Published'],
    ['lessons', 'Lessons']
  ];
  const TYPE_OPTIONS = [
    ['SELF_PACED', 'Self Paced'],
    ['LIVE_CLASS', 'Live Class'],
    ['COMPLIANCE', 'Compliance'],
    ['PUBLIC', 'Public']
  ];
  const TYPE_LABELS = { SELF_PACED: 'Self paced', LIVE_CLASS: 'Live class', COMPLIANCE: 'Compliance', PUBLIC: 'Public' };
  const SORT_KEY = 'classroomio_filter_course_sort_key';
  const ORDER_KEY = 'classroomio_filter_course_order_key';

  let S = null;
  let commit = () => {};
  let rerender = () => {};

  const ui = {
    mode: 'list',
    filters: { search: '', sortKey: 'date_created', order: 'desc', courseType: 'all', publishedStatus: 'all' },
    next: 1,
    templatesReady: false,
    popoverOpen: false,
    searchTimer: 0,
    wired: false
  };

  function readStorage(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* the choice still applies for this visit */
    }
  }

  /* ---------- filters <-> URL (utils/course-list-filters.ts) ---------- */
  function parseFilters(params) {
    const sortParam = params.get('sort');
    const orderParam = params.get('order');
    const hasSort = params.has('sort') || params.has('order');
    const sortKey = SORT_OPTIONS.some(([value]) => value === sortParam)
      ? sortParam
      : hasSort
        ? 'date_created'
        : SORT_OPTIONS.some(([value]) => value === readStorage(SORT_KEY))
          ? readStorage(SORT_KEY)
          : 'date_created';
    const order = orderParam === 'asc' || orderParam === 'desc' ? orderParam : hasSort ? 'desc' : readStorage(ORDER_KEY) === 'asc' ? 'asc' : 'desc';
    const type = (params.get('type') ?? '').trim();
    const status = params.get('status');

    return {
      search: (params.get('search') ?? '').trim(),
      sortKey,
      order,
      courseType: TYPE_OPTIONS.some(([value]) => value === type) ? type : 'all',
      publishedStatus: status === 'published' || status === 'unpublished' ? status : 'all'
    };
  }

  function nextFromParams(params) {
    const raw = Number(params.get('next'));

    return Number.isInteger(raw) && raw >= 1 ? Math.min(raw, 50) : 1;
  }

  function searchString() {
    const params = new URLSearchParams(window.location.search);

    ['search', 'sort', 'order', 'type', 'status', 'next'].forEach((key) => params.delete(key));

    const { search, sortKey, order, courseType, publishedStatus } = ui.filters;

    if (search) params.set('search', search);
    if (sortKey !== 'date_created') params.set('sort', sortKey);
    if (order !== 'desc') params.set('order', order);
    if (courseType !== 'all') params.set('type', courseType);
    if (publishedStatus !== 'all') params.set('status', publishedStatus);
    if (ui.next > 1) params.set('next', String(ui.next));

    const text = params.toString();

    return text ? `?${text}` : '';
  }

  function syncUrl({ replace = false } = {}) {
    const url = `${window.location.pathname}${searchString()}`;

    if (url === `${window.location.pathname}${window.location.search}`) return;

    history[replace ? 'replaceState' : 'pushState'](null, '', url);
  }

  function isFilterActive() {
    const { sortKey, order, courseType, publishedStatus } = ui.filters;

    return sortKey !== 'date_created' || order !== 'desc' || courseType !== 'all' || publishedStatus !== 'all';
  }

  function listIsUnfiltered() {
    const { search, courseType, publishedStatus } = ui.filters;

    return !search && courseType === 'all' && publishedStatus === 'all';
  }

  /* ---------- the data the API would return ---------- */
  function createdAt(course, index) {
    return course.createdAt ? Date.parse(course.createdAt) : -index;
  }

  function updatedAt(course, index) {
    return course.updatedAt ? Date.parse(course.updatedAt) : createdAt(course, index);
  }

  function visibleCourses() {
    const { search, sortKey, order, courseType, publishedStatus } = ui.filters;
    const query = search.toLowerCase();
    const rows = M.courses(S)
      .map((course, index) => ({ course, index }))
      .filter(({ course }) => {
        if (query && !`${course.title} ${course.desc ?? ''}`.toLowerCase().includes(query)) return false;
        if (courseType !== 'all' && (course.type ?? 'SELF_PACED') !== courseType) return false;
        if (publishedStatus === 'published' && !course.published) return false;
        if (publishedStatus === 'unpublished' && course.published) return false;

        return true;
      });

    const keyOf = ({ course, index }) => {
      if (sortKey === 'last_updated_at') return updatedAt(course, index);
      if (sortKey === 'published') return course.published ? 1 : 0;
      if (sortKey === 'lessons') return M.counts(course).lessons;

      return createdAt(course, index);
    };

    rows.sort((left, right) => {
      const difference = keyOf(left) - keyOf(right);
      const tieBreak = createdAt(left.course, left.index) - createdAt(right.course, right.index);

      return (order === 'asc' ? 1 : -1) * (difference || tieBreak);
    });

    return rows.map(({ course }) => course);
  }

  /* ---------- markup ---------- */
  function publishBadge(course, variant) {
    const text = course.published ? 'Published' : 'Unpublished';

    return `<span class="cx-badge cx-badge-${variant}">${text}</span>`;
  }

  function menuItems(course, { includeOpen }) {
    const slug = (course.slug ?? '').trim();
    const showPublicLinks = course.published && course.type === 'PUBLIC' && slug.length > 0;
    const id = esc(course.id);
    const item = (action, label, extra = '') => `<button type="button" role="menuitem" class="cx-mi${extra}" data-cx-act="${action}" data-id="${id}">${label}</button>`;
    const parts = [];

    if (course.published) {
      parts.push(item('site', 'View course site'));
      if (showPublicLinks) parts.push(item('copy-url', 'Copy course URL'));
      parts.push('<div class="cx-msep" role="separator"></div>');
    } else {
      parts.push(item('publish', 'Publish course'));
      parts.push('<div class="cx-msep" role="separator"></div>');
    }

    if (includeOpen) parts.push(item('open', 'Open'));

    parts.push(item('clone', 'Clone'));
    parts.push(item('save-template', 'Save as template…'));
    parts.push(item('share', 'Share'));
    parts.push(item('invite', 'Invite'));
    parts.push('<div class="cx-msep" role="separator"></div>');
    parts.push(item('delete', 'Delete', ' cx-mi-danger'));

    return parts.join('');
  }

  function cardHTML(course, index) {
    const counts = M.counts(course);
    const students = U.studentCountOf(course);

    return `
      <article class="cx-card m-rise" style="--i:${Math.min(index, 8)}" data-course-card="${esc(course.id)}">
        <div class="cx-group">
          <div class="cx-menu">
            <button class="cx-dots" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="Course actions" data-menu-button>${icon('dotsv', 16)}</button>
            <div class="cx-pop" role="menu" hidden>${menuItems(course, { includeOpen: false })}</div>
          </div>
          <a class="cx-link" href="${esc(M.R.course(course.id))}">
            <div class="cx-media">
              ${U.bannerImg(course.bannerImage, 'alt="Course banner image"')}
              ${U.typeBadgeHTML(course.type ?? 'SELF_PACED', 'cx-badge-md')}
            </div>
            <div class="cx-content">
              <h3 class="cx-title"><span>${esc(course.title)}</span></h3>
              <p class="cx-desc">${esc(course.desc ?? '')}</p>
              <span class="cx-sep"></span>
              <div class="cx-foot">
                <div class="cx-foot-l"><div class="cx-status">${publishBadge(course, course.published ? 'default' : 'outline')}${sampleBadge(course)}</div></div>
                <div class="cx-foot-r">
                  <p class="nowrap"><span>${counts.lessons} lessons</span> &amp; <span>${U.plural(counts.exercises, 'exercise', 'exercises')}</span></p>
                  <p>${U.plural(students, 'student', 'students')}</p>
                </div>
              </div>
            </div>
          </a>
        </div>
      </article>`;
  }

  function avatarStack(course, students, desktop) {
    const initial = (course.title.trim().charAt(0) || 'C').toUpperCase();
    const shown = Math.min(2, students);
    const circles =
      students === 0
        ? '<span class="cx-av cx-av-empty"></span>'
        : Array.from({ length: shown }, (_, position) => `<span class="cx-av${position ? ' cx-av-over' : ''}">${esc(initial)}</span>`).join('') +
          (students > 2 ? `<span class="cx-av cx-av-over cx-av-more">+${students - 2}</span>` : '');

    return `<div class="cx-stack ${desktop ? 'cx-stack-d' : 'cx-stack-m'}"><div class="cx-stack-av">${circles}</div>${students <= 1 ? `<span class="cx-stack-n">${students}</span>` : ''}</div>`;
  }

  function updatedLabel(course) {
    if (!course.updatedAt) return '';

    const date = new Date(course.updatedAt);

    if (Number.isNaN(date.getTime())) return '';

    return `Updated ${date.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  function sampleBadge(course) {
    return course.origin === 'product' || course.origin === 'goal'
      ? '<span class="cx-badge cx-badge-secondary cx-badge-sm">Sample</span>'
      : '';
  }

  function rowHTML(course) {
    const counts = M.counts(course);
    const students = U.studentCountOf(course);
    const typeLabel = TYPE_LABELS[course.type ?? 'SELF_PACED'] ?? '';
    const updated = updatedLabel(course);
    const published = `<span class="cx-badge cx-badge-${course.published ? 'success' : 'secondary'} cx-badge-sm">${course.published ? 'Published' : 'Unpublished'}</span>`;
    const publicBadge =
      course.type === 'PUBLIC'
        ? `<span class="cx-badge cx-badge-secondary cx-badge-md cx-pubbadge">${icon('globe', 14)}Public</span>`
        : '';
    const subtitle = [typeLabel, updated].filter(Boolean);

    return `
      <div class="cx-row" role="listitem" data-course-card="${esc(course.id)}">
        <a class="cx-rowlink" href="${esc(M.R.course(course.id))}" aria-label="${esc(course.title)}"></a>
        <div class="cx-rowgrid">
          <div class="cx-banner" aria-hidden="true">${U.bannerImg(course.bannerImage)}</div>
          <div class="cx-rowmid">
            <div class="cx-rowtitle">
              <div class="cx-rowtitle-line">
                <p class="cx-rowname">${esc(course.title)}</p>
                ${publicBadge}
                ${sampleBadge(course)}
                <span class="cx-only-m">${published}</span>
              </div>
              ${typeLabel || updated ? `<p class="cx-sub-m">${esc(subtitle.join(' · '))}</p>` : ''}
              <div class="cx-sub-d">
                ${typeLabel ? `<p class="cx-sub-type">${esc(typeLabel)}</p>` : ''}
                ${updated ? `<p class="cx-sub-upd">${esc(updated)}</p>` : ''}
              </div>
            </div>
            <div class="cx-only-d">${published}</div>
            <div class="cx-tags cx-only-d"><span class="cx-dash">—</span></div>
            <div class="cx-metrics">
              <div class="cx-counts">
                <p class="cx-count" aria-label="${U.plural(counts.lessons, 'lesson', 'lessons')}"><span class="cx-ct-lesson">${icon('lesson', 14)}</span><span>${counts.lessons}</span></p>
                <p class="cx-count" aria-label="${U.plural(counts.exercises, 'exercise', 'exercises')}"><span class="cx-ct-exercise">${icon('exercise', 14)}</span><span>${counts.exercises}</span></p>
              </div>
              <div class="cx-studs">${avatarStack(course, students, false)}${avatarStack(course, students, true)}</div>
            </div>
          </div>
          <div class="cx-rowact">
            <div class="cx-menu cx-menu-row">
              <button class="cx-rowdots" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="Course actions" data-menu-button>${icon('dotsv', 16)}</button>
              <div class="cx-pop" role="menu" hidden>${menuItems(course, { includeOpen: true })}</div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function emptyHTML() {
    const unfiltered = listIsUnfiltered() && !ui.filters.search;
    const title = unfiltered ? 'No courses yet' : 'No Courses Created';
    const description = unfiltered
      ? 'Pick a template to see what a great ClassroomIO course looks like, or start from a blank course.'
      : 'Share your knowledge with the world by creating engaging courses for your students.';
    const action = unfiltered
      ? '<a class="btn btn-primary" href="' + esc(M.R.templates) + '">Browse templates</a>'
      : `<button class="btn btn-primary cx-create-text" type="button" data-create>Create Course</button><button class="btn btn-outline btn-icon cx-create-icon" type="button" data-create aria-label="Create Course">${icon('plus', 16)}</button>`;

    return `
      <div class="cx-empty">
        <div class="cx-empty-h">
          <span class="cx-empty-i">${icon('libraryBig', 24)}</span>
          <h3 class="cx-empty-t">${title}</h3>
          <p class="cx-empty-d">${description}</p>
        </div>
        <div class="cx-empty-c">${action}</div>
      </div>`;
  }

  function listBodyHTML() {
    const all = visibleCourses();
    const shown = all.slice(0, ui.next * PAGE_SIZE);

    if (!all.length) return emptyHTML();

    const body =
      ui.mode === 'grid'
        ? `<div class="cx-grid">${shown.map(cardHTML).join('')}</div>`
        : `<div class="cx-listwrap"><div class="cx-list" role="list">${shown.map(rowHTML).join('')}</div></div>`;
    const more = all.length > shown.length ? `<div class="cx-more"><button class="btn btn-secondary" type="button" data-load-more>Load more</button></div>` : '';

    return body + more;
  }

  function templateRowHTML() {
    const { org, global } = U.cards(S);
    const templates = [...org, ...global].slice(0, 5);
    const cards = ui.templatesReady
      ? templates.map((template) => `<div class="cx-tcell">${U.templateCardHTML(template)}</div>`).join('')
      : [0, 1, 2].map(() => `<div class="cx-tcell">${U.skeletonCardHTML()}</div>`).join('');

    return `
      <section class="cx-templates">
        <div class="cx-wrap">
          <div class="cx-th">
            <h2>Create a new course</h2>
            <a href="${esc(M.R.templates)}" data-gallery>Template gallery ${icon('chevronsUpDown', 16)}</a>
          </div>
          <div class="cx-trow">
            <div class="cx-tcell">${U.blankCardHTML()}</div>
            ${cards}
          </div>
        </div>
      </section>`;
  }

  function filterPopoverHTML() {
    const { sortKey, order, courseType, publishedStatus } = ui.filters;
    const chip = (active, attrs, label) => `<button type="button" class="btn btn-sm ${active ? 'btn-secondary' : 'btn-outline'}" ${attrs}>${esc(label)}</button>`;

    return `
      <div class="cx-fpop" role="dialog" aria-label="Filters" ${ui.popoverOpen ? '' : 'hidden'}>
        <div class="cx-fpop-top">
          <p>Filters</p>
          <button type="button" class="cx-linkbtn" data-clear ${isFilterActive() ? '' : 'disabled'}>Clear all</button>
        </div>
        <div class="cx-fgroup">
          <p class="cx-flabel">Sort</p>
          <div class="cx-fchips">${SORT_OPTIONS.map(([value, label]) => chip(sortKey === value, `data-sort="${value}"`, label)).join('')}</div>
        </div>
        <div class="cx-fgroup">
          <p class="cx-flabel">Order</p>
          <div class="cx-toggle" role="group" aria-label="Order">
            <button type="button" class="${order === 'asc' ? 'on' : ''}" data-order="asc" aria-pressed="${order === 'asc'}">Asc</button>
            <button type="button" class="${order === 'desc' ? 'on' : ''}" data-order="desc" aria-pressed="${order === 'desc'}">Desc</button>
          </div>
        </div>
        <div class="cx-fgroup">
          <p class="cx-flabel">Status</p>
          <div class="cx-fchips">
            ${chip(publishedStatus === 'all', 'data-status="all"', 'All')}
            ${chip(publishedStatus === 'published', 'data-status="published"', 'Published')}
            ${chip(publishedStatus === 'unpublished', 'data-status="unpublished"', 'Unpublished')}
          </div>
        </div>
        <div class="cx-fgroup">
          <p class="cx-flabel">Course Type</p>
          <div class="cx-fchips">
            ${chip(courseType === 'all', 'data-type="all"', 'All')}
            ${TYPE_OPTIONS.map(([value, label]) => chip(courseType === value, `data-type="${value}"`, label)).join('')}
          </div>
        </div>
      </div>`;
  }

  function toolbarHTML() {
    return `
      <div class="cx-bar">
        <h2>Your courses</h2>
        <div class="cx-tools">
          <label class="cx-search">
            ${icon('search', 16)}
            <input id="course-search" type="text" autocomplete="off" placeholder="Find Course" value="${esc(ui.filters.search)}" aria-label="Find Course" />
            <button class="cx-search-x" type="button" aria-label="Clear search" ${ui.filters.search ? '' : 'hidden'}>${icon('x', 14)}</button>
          </label>
          <div class="cx-filter">
            <button class="btn btn-outline btn-sm cx-filter-btn" type="button" id="filter-btn" aria-haspopup="dialog" aria-expanded="${ui.popoverOpen}" aria-label="Filter">
              ${icon('filter', 16)}<span class="cx-hide-m">Filter</span>
            </button>
            <span class="cx-filter-dot" ${isFilterActive() ? '' : 'hidden'}></span>
            <div id="filter-host">${filterPopoverHTML()}</div>
          </div>
          <button class="btn btn-secondary btn-icon" type="button" id="view-toggle" aria-label="${ui.mode === 'list' ? 'Switch to grid view' : 'Switch to list view'}">${icon(ui.mode === 'list' ? 'grid' : 'list', 16)}</button>
        </div>
      </div>`;
  }

  function pageHTML() {
    return `
      ${templateRowHTML()}
      <div class="cx-wrap cx-main">
        ${toolbarHTML()}
        <div id="course-list" class="cx-listarea">${listBodyHTML()}</div>
      </div>`;
  }

  /* ---------- behaviour ---------- */
  function refreshList() {
    document.querySelector('#course-list').innerHTML = listBodyHTML();
    document.querySelector('.cx-filter-dot').hidden = !isFilterActive();
    const host = document.querySelector('#filter-host');

    host.innerHTML = filterPopoverHTML();
    wireFilterPopover();
  }

  function setPopover(open) {
    ui.popoverOpen = open;
    const popover = document.querySelector('.cx-fpop');

    if (popover) popover.hidden = !open;
    document.querySelector('#filter-btn')?.setAttribute('aria-expanded', String(open));
  }

  function applyFilterChange() {
    ui.next = 1;
    writeStorage(SORT_KEY, ui.filters.sortKey);
    writeStorage(ORDER_KEY, ui.filters.order);
    syncUrl();
    refreshList();
    setPopover(true);
  }

  function wireFilterPopover() {
    const popover = document.querySelector('.cx-fpop');

    popover.querySelectorAll('[data-sort]').forEach((button) =>
      button.addEventListener('click', () => {
        ui.filters.sortKey = button.dataset.sort;
        applyFilterChange();
      })
    );
    popover.querySelectorAll('[data-order]').forEach((button) =>
      button.addEventListener('click', () => {
        ui.filters.order = button.dataset.order;
        applyFilterChange();
      })
    );
    popover.querySelectorAll('[data-status]').forEach((button) =>
      button.addEventListener('click', () => {
        ui.filters.publishedStatus = button.dataset.status;
        applyFilterChange();
      })
    );
    popover.querySelectorAll('[data-type]').forEach((button) =>
      button.addEventListener('click', () => {
        ui.filters.courseType = button.dataset.type;
        applyFilterChange();
      })
    );
    popover.querySelector('[data-clear]').addEventListener('click', () => {
      ui.filters = { search: ui.filters.search, sortKey: 'date_created', order: 'desc', courseType: 'all', publishedStatus: 'all' };
      applyFilterChange();
    });
  }

  function closeMenus() {
    document.querySelectorAll('.cx-pop').forEach((menu) => {
      menu.hidden = true;
    });
    document.querySelectorAll('[data-menu-button]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
  }

  function goCreate() {
    history.pushState(null, '', `${window.location.pathname}?create=true`);
    openNewCourse();
  }

  function openNewCourse() {
    U.openNewCourseDialog({
      onClose: () => {
        if (new URLSearchParams(window.location.search).get('create') === 'true') {
          history.pushState(null, '', `${window.location.pathname}${searchString()}`);
        }
      },
      onCreated: (fields, dialog) => {
        const course = U.createBlankCourse(S, fields);

        commit();
        dialog.close();
        window.location.href = M.R.course(course.id, 'lessons');
      }
    });
  }

  function deleteCourse(id) {
    const course = M.findCourse(S, id);

    if (!course) return;

    U.confirmDelete({
      onDelete: () => {
        M.deleteCourse(S, id);
        commit();
        P.toast('Course deleted successfully');
        rerender();
      }
    });
  }

  function cloneCourse(id) {
    const source = M.findCourse(S, id);

    if (!source) return;

    U.openCloneDialog({
      course: source,
      onCloned: (fields) => {
        const copy = U.cloneCourse(S, source, fields);

        commit();
        U.flash('Course cloned successfully');
        window.location.href = M.R.course(copy.id);
      }
    });
  }

  function saveAsTemplate(id) {
    const course = M.findCourse(S, id);

    if (!course) return;

    U.openSaveTemplateDialog({
      state: S,
      course,
      goTemplates: () => {
        window.location.href = `${M.R.templates}?scope=org`;
      },
      goUpgrade: () => window.pricing.open({ state: S, item: 'general', commit, onUpgrade: rerender }),
      onSaved: ({ mode, name }) => {
        if (mode === 'convert') {
          U.convertCourseToTemplate(S, course);
          commit();
          P.toast('Course converted to a template');
          rerender();

          return;
        }

        U.saveCourseAsTemplate(S, course, name);
        commit();
        P.toast('Template saved', { action: 'View templates', onAction: () => (window.location.href = `${M.R.templates}?scope=org`) });
        rerender();
      }
    });
  }

  function copyCourseUrl(id) {
    const course = M.findCourse(S, id);

    if (!course?.slug) return;

    const link = `${M.orgInfo(S).url}/course/${course.slug}`;
    const done = () => P.toast('Course URL copied');
    const failed = () => P.toast('Could not copy URL', { error: true });

    if (!navigator.clipboard?.writeText) {
      failed();

      return;
    }

    navigator.clipboard.writeText(link).then(done, failed);
  }

  function runAction(action, id) {
    closeMenus();

    if (action === 'open') window.location.href = M.R.course(id);
    if (action === 'site') window.open(M.R.publicCourse(id), '_blank', 'noopener,noreferrer');
    if (action === 'copy-url') copyCourseUrl(id);
    if (action === 'publish') window.location.href = M.R.courseSettings(id, 'publish');
    if (action === 'share') window.location.href = M.R.courseSettings(id, 'share');
    if (action === 'invite') window.location.href = M.R.course(id, 'people', { add: 'true' });
    if (action === 'clone') cloneCourse(id);
    if (action === 'save-template') saveAsTemplate(id);
    if (action === 'delete') deleteCourse(id);
  }

  function wireListArea() {
    const area = document.querySelector('#course-list');

    area.addEventListener('click', (event) => {
      const target = event.target.closest('button, a');

      if (!target || !area.contains(target)) return;

      if (target.matches('[data-menu-button]')) {
        event.preventDefault();
        event.stopPropagation();

        const menu = target.parentElement.querySelector('.cx-pop');
        const wasHidden = menu.hidden;

        closeMenus();
        menu.hidden = !wasHidden;
        target.setAttribute('aria-expanded', String(wasHidden));

        return;
      }

      if (target.matches('[data-cx-act]')) {
        event.preventDefault();
        event.stopPropagation();
        runAction(target.dataset.cxAct, target.dataset.id);

        return;
      }

      if (target.matches('[data-create]')) goCreate();

      if (target.matches('[data-load-more]')) {
        ui.next += 1;
        syncUrl();
        refreshList();
      }
    });
  }

  function wireToolbar() {
    const search = document.querySelector('#course-search');
    const clear = document.querySelector('.cx-search-x');

    const applySearch = (value, { replace }) => {
      clearTimeout(ui.searchTimer);
      ui.filters.search = value.trim();
      ui.next = 1;
      syncUrl({ replace });
      refreshList();
      setPopover(ui.popoverOpen);
    };

    search.addEventListener('input', () => {
      clear.hidden = !search.value;
      clearTimeout(ui.searchTimer);
      ui.searchTimer = setTimeout(() => applySearch(search.value, { replace: true }), 300);
    });
    clear.addEventListener('click', () => {
      search.value = '';
      clear.hidden = true;
      applySearch('', { replace: true });
      search.focus();
    });

    document.querySelector('#filter-btn').addEventListener('click', (event) => {
      event.stopPropagation();
      setPopover(!ui.popoverOpen);
    });
    document.querySelector('#filter-host').addEventListener('click', (event) => event.stopPropagation());
    wireFilterPopover();

    document.querySelector('#view-toggle').addEventListener('click', () => {
      ui.mode = ui.mode === 'list' ? 'grid' : 'list';
      writeStorage('courseView', ui.mode);
      rerender();
    });
  }

  function wireTemplateRow() {
    const row = document.querySelector('.cx-templates');

    row.addEventListener('click', (event) => {
      const blank = event.target.closest('[data-blank-template]');
      const card = event.target.closest('[data-open-template]');

      if (blank) goCreate();
      if (card) window.location.href = `${M.R.templates}?preview=${encodeURIComponent(card.dataset.openTemplate)}`;
    });
  }

  function onPopState() {
    const params = new URLSearchParams(window.location.search);

    ui.filters = parseFilters(params);
    ui.next = nextFromParams(params);
    rerender();

    if (params.get('create') === 'true') openNewCourse();
    else U.closeDialog();
  }

  function html(state) {
    S = state;

    return pageHTML();
  }

  function wire(state, helpers) {
    S = state;
    commit = helpers.commit;
    rerender = helpers.rerender;

    S.steps = S.steps ?? {};
    S.steps.reviewed = true;
    commit();

    wireToolbar();
    wireListArea();
    wireTemplateRow();

    if (!ui.wired) {
      ui.wired = true;
      document.addEventListener('click', () => {
        closeMenus();
        if (ui.popoverOpen) setPopover(false);
      });
      document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;

        closeMenus();
        if (ui.popoverOpen) setPopover(false);
      });
      window.addEventListener('popstate', onPopState);

      const params = new URLSearchParams(window.location.search);

      if (params.get('create') === 'true') openNewCourse();

      if (!ui.templatesReady) {
        setTimeout(() => {
          ui.templatesReady = true;

          const current = document.querySelector('.cx-templates');

          if (!current) return;

          current.outerHTML = templateRowHTML();
          wireTemplateRow();
        }, 400);
      }
    }
  }

  const initialParams = new URLSearchParams(window.location.search);

  ui.mode = readStorage('courseView') === 'grid' ? 'grid' : 'list';
  ui.filters = parseFilters(initialParams);
  ui.next = nextFromParams(initialParams);

  window.PAGES = window.PAGES || {};
  window.PAGES.courses = { title: 'Courses', html, wire };
})();
