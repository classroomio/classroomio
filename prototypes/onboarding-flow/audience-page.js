/*
 * audience-page.js — routes/(app)/org/[slug]/audience (+ /import) with lib/features/audience/**.
 *
 * List: title with the "(n / max)" plan counter, Export menu, Import Users, the toolbar (student count, view
 * switcher, search, Filter popover with sort and filters), the table (select, name, email, status, enrollment,
 * progress, last login, last activity, date joined, row actions), pagination, the empty states, the floating
 * selection bar (Copy, Export, Actions: assign to courses, archive, deactivate, reactivate, unarchive, delete),
 * resend / revoke invite, delete confirmation and the bulk-confirm dialog with undo.
 * Import (`audience.html?view=import`): upload a CSV or paste emails, review, course access, result.
 * Learners are invited here by import (production has no other audience invite); the link and email invites for a
 * single course live in the course People tab.
 *
 * Persisted on S.audience = [{ id, name, email, role: 'student', status: 'pending'|'active'|'expired'|'revoked',
 *   memberStatus: 'ACTIVE'|'DEACTIVATED'|'ARCHIVED', invitedAt, joinedAt, lastLoginAt, lastActiveAt, courseIds: [] }].
 * Course membership is mirrored on course.people through AccountUI.enroll. Simulated: emails are not sent, and a
 * pending invite can be accepted from its row menu ("Simulate accepted invite") so the learner becomes usable in courses.
 */
(function () {
  const P = window.proto;
  const M = window.model;
  const U = window.AccountUI;
  const esc = P.escapeHtml;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const IMPORT_MAX_ROWS = 1000;
  const TEMPLATE = 'email,name,courses\nada@example.com,Ada Lovelace,"Intro to React,Data Basics"\n';
  const ROW_STATUS = {
    ready: 'Ready',
    already_member: 'Already in audience',
    invalid_email: 'Invalid email',
    duplicate_in_file: 'Duplicate in file',
    is_staff: 'Staff, not a student',
    over_seat_limit: 'No seats left',
    missing_email: 'No email'
  };
  const VIEWS = {
    all: ['All students', {}],
    never_logged_in: ['Never logged in', { lastLoginBefore: 'never' }],
    inactive_90d: ['Inactive 90+ days', { lastActiveBefore: '90d' }],
    inactive_180d: ['Inactive 180+ days', { lastActiveBefore: '180d' }],
    enrolled_not_started: ['Enrolled, never started', { enrollment: 'enrolled', completion: 'not_started' }],
    archived: ['Archived', { status: 'ARCHIVED' }]
  };
  const WINDOWS = [['7d', '7 days'], ['30d', '30 days'], ['90d', '90 days'], ['180d', '180 days'], ['never', 'Never']];
  const DAY = 86400000;
  const PAGE_SIZE = 20;

  const DEFAULT_QUERY = { page: 1, sortBy: 'createdAt', sortOrder: 'desc', status: 'ACTIVE', excludeRecentJoiners: true };
  let query = { ...DEFAULT_QUERY };
  let selected = new Set();
  let allMatching = false;
  let undo = null;
  let S;
  let commit;
  let rerender;

  /* ---------- data ---------- */
  const learners = () => (S.audience = Array.isArray(S.audience) ? S.audience : []);
  const courseList = () => M.courses(S);
  const maxLearners = () => U.maxLearners(S);
  const isEnterprise = () => S.plan === 'ENTERPRISE';

  function enrolledCount(person) {
    return courseList().filter((course) => (course.people ?? []).some((entry) => entry.personId === person.id && entry.role === 'student')).length;
  }

  function matches(person) {
    const search = (query.search ?? '').trim().toLowerCase();
    if (search && !`${person.name} ${person.email}`.toLowerCase().includes(search)) return false;
    if ((person.memberStatus || 'ACTIVE') !== query.status) return false;
    if (query.inviteStatus && person.status !== query.inviteStatus) return false;

    const enrolled = enrolledCount(person);
    if (query.enrollment === 'enrolled' && enrolled === 0) return false;
    if (query.enrollment === 'not_enrolled' && enrolled > 0) return false;
    if (query.completion === 'not_started' && (enrolled === 0 || person.lastActiveAt)) return false;
    if (query.completion === 'in_progress' && !person.lastActiveAt) return false;
    if (query.completion === 'completed') return false;

    const stale = (field, window) => {
      if (!window) return true;
      if (window === 'never') return !person[field];

      const days = Number(window.replace('d', ''));
      const recent = query.excludeRecentJoiners && person.invitedAt && Date.now() - person.invitedAt < days * DAY;

      return !recent && (!person[field] || Date.now() - person[field] > days * DAY);
    };

    return stale('lastLoginAt', query.lastLoginBefore) && stale('lastActiveAt', query.lastActiveBefore);
  }

  function visible() {
    const key = { createdAt: 'invitedAt', name: 'name', email: 'email', lastLoginAt: 'lastLoginAt', lastActiveAt: 'lastActiveAt' }[query.sortBy];
    const direction = query.sortOrder === 'asc' ? 1 : -1;

    return learners()
      .filter(matches)
      .sort((a, b) => {
        const left = a[key] ?? '';
        const right = b[key] ?? '';

        return (typeof left === 'number' || typeof right === 'number' ? (left || 0) - (right || 0) : String(left).localeCompare(String(right))) * direction;
      });
  }

  function activeView() {
    return Object.keys(VIEWS).find((id) => {
      const filters = { ...DEFAULT_QUERY, ...VIEWS[id][1] };

      return ['status', 'inviteStatus', 'enrollment', 'completion', 'lastLoginBefore', 'lastActiveBefore'].every((key) => filters[key] === query[key]);
    });
  }

  function activeFilterCount() {
    return ['inviteStatus', 'enrollment', 'completion', 'lastLoginBefore', 'lastActiveBefore'].filter((key) => query[key]).length + (query.status !== 'ACTIVE' ? 1 : 0);
  }

  /* ---------- import parsing (packages/utils audience-import) ---------- */
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const ALIASES = { email: 'email', 'email address': 'email', 'e-mail': 'email', mail: 'email', name: 'name', 'full name': 'name', fullname: 'name', student: 'name', courses: 'courses', course: 'courses' };

  function splitLine(line) {
    const cells = [];
    let current = '';
    let quoted = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];

      if (char === '"') {
        if (quoted && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else quoted = !quoted;
      } else if (char === ',' && !quoted) {
        cells.push(current);
        current = '';
      } else current += char;
    }

    cells.push(current);

    return cells.map((cell) => cell.trim());
  }

  function parseImport(text) {
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!lines.length) return { rows: [], unknown: [], truncated: 0 };

    const first = splitLine(lines[0]);
    const header = first.some((cell) => ALIASES[cell.toLowerCase()]) && !first.some((cell) => EMAIL.test(cell.toLowerCase()));
    const unknown = [];
    let columns = ['email'];

    if (header) {
      columns = first.map((cell) => {
        if (!ALIASES[cell.toLowerCase()]) unknown.push(cell);

        return ALIASES[cell.toLowerCase()] ?? null;
      });
    }

    const data = header ? lines.slice(1) : lines;
    const seen = new Set();
    const rows = [];
    let truncated = 0;

    for (let index = 0; index < data.length; index += 1) {
      if (rows.length >= IMPORT_MAX_ROWS) {
        truncated = data.length - index;
        break;
      }

      const cells = splitLine(data[index]);
      const candidates = header ? [cells[columns.indexOf('email')] ?? ''] : cells.filter(Boolean);

      for (const raw of candidates.length ? candidates : ['']) {
        if (rows.length >= IMPORT_MAX_ROWS) break;

        const email = raw.trim().toLowerCase();
        const line = header ? index + 2 : index + 1;
        const nameAt = columns.indexOf('name');
        const name = nameAt >= 0 ? cells[nameAt]?.trim() || undefined : undefined;
        const coursesAt = columns.indexOf('courses');
        const courses = coursesAt >= 0 ? (cells[coursesAt] ?? '').split(',').map((v) => v.trim()).filter(Boolean) : [];

        if (!email) rows.push({ line, email: '', courses: [], status: 'missing_email' });
        else if (!EMAIL.test(email)) rows.push({ line, email, courses: [], status: 'invalid_email' });
        else if (seen.has(email)) rows.push({ line, email, name, courses, status: 'duplicate_in_file' });
        else {
          seen.add(email);
          rows.push({ line, email, name, courses, status: 'ready' });
        }
      }
    }

    return { rows, unknown, truncated };
  }

  /* The server-side checks the preview cannot know: existing members, staff and the seat limit. */
  function classify(rows) {
    const known = new Set(learners().map((person) => person.email.toLowerCase()));
    const staff = new Set([(S.email || '').toLowerCase(), ...(S.team ?? []).map((member) => member.email.toLowerCase())]);
    let seats = maxLearners() - learners().length;

    return rows.map((row) => {
      if (row.status !== 'ready') return row;
      if (staff.has(row.email)) return { ...row, status: 'is_staff' };
      if (known.has(row.email)) return { ...row, status: 'already_member' };
      if (seats <= 0) return { ...row, status: 'over_seat_limit' };

      seats -= 1;

      return row;
    });
  }

  function summarise(rows) {
    const out = { ready: 0, listed: 0, invalid: 0 };

    rows.forEach((row) => {
      if (row.status === 'ready') out.ready += 1;
      else if (row.status === 'already_member' || row.status === 'duplicate_in_file') out.listed += 1;
      else out.invalid += 1;
    });

    return out;
  }

  /* ---------- html ---------- */
  function html() {
    return new URLSearchParams(window.location.search).get('view') === 'import' ? '<div id="au-root"></div>' : '<div id="au-root"></div>';
  }

  function statusBadge(person) {
    if ((person.memberStatus || 'ACTIVE') !== 'ACTIVE') {
      return person.memberStatus === 'DEACTIVATED' ? U.badge('destructive', 'Deactivated') : U.badge('outline', 'Archived');
    }

    const label = { active: 'Active', pending: 'Pending', expired: 'Expired', revoked: 'Revoked' }[person.status] ?? 'Pending';
    const variant = { active: 'secondary', pending: 'outline', expired: 'destructive', revoked: 'destructive' }[person.status] ?? 'outline';

    return U.badge(variant, label);
  }

  function rowHTML(person, canDelete) {
    const enrolled = enrolledCount(person);
    const muted = (person.memberStatus || 'ACTIVE') !== 'ACTIVE';
    const joined = person.status === 'active';
    const actions = person.status === 'pending' || person.status === 'expired' || person.status === 'revoked' || canDelete;

    return `<tr class="${muted ? 'ac-muted' : ''}" data-row="${esc(person.id)}">
      <td class="ac-w10">${U.checkbox({ checked: allMatching || selected.has(person.id), disabled: !joined, attrs: `data-sel="${esc(person.id)}"`, label: `Select ${person.name}` })}</td>
      <td><span style="display:flex;align-items:center;gap:8px"><span class="ac-avatar">${esc(P.initials(person.name).slice(0, 2))}</span>${esc(person.name)}</span></td>
      <td>${esc(person.email)}</td>
      <td>${statusBadge(person)}</td>
      <td>${0 === enrolled ? '0 / 0' : `0 / ${enrolled}`}</td>
      <td>${U.ringHTML(0)}</td>
      <td title="">${U.timeAgo(person.lastLoginAt) ?? 'Never'}</td>
      <td>${U.timeAgo(person.lastActiveAt) ?? 'Never'}</td>
      <td>${esc(U.shortDate(person.invitedAt))}</td>
      <td class="ac-w12">${actions ? `<button type="button" class="ac-iconbtn" data-actions="${esc(person.id)}" aria-label="Open actions" aria-haspopup="menu">${U.icon('ellipsis-vertical', 16)}</button>` : ''}</td>
    </tr>`;
  }

  function filterPopoverHTML() {
    const chips = (key, options) =>
      `<div class="ac-chips">${options.map(([value, label]) => `<button type="button" class="btn btn-sm ${query[key] === value ? 'btn-secondary' : 'btn-outline'}" data-f="${key}" data-v="${value}">${label}</button>`).join('')}</div>`;
    const sorts = [['createdAt', 'Date Joined'], ['name', 'Name'], ['email', 'Email'], ['lastLoginAt', 'Last login'], ['lastActiveAt', 'Last activity']];
    const active = activeFilterCount() > 0;

    return `<div class="ac-pop-stack">
      <div class="ac-pop-head"><p>Filters</p><button type="button" class="ac-btn-link" data-f-clear${active ? '' : ' disabled'}>Clear all</button></div>
      <div class="ac-stack8"><p class="ac-eyebrow">Sort</p><div class="ac-chips">${sorts.map(([value, label]) => `<button type="button" class="btn btn-sm ${query.sortBy === value ? 'btn-secondary' : 'btn-outline'}" data-sort="${value}">${label}</button>`).join('')}</div></div>
      <div class="ac-stack8"><p class="ac-eyebrow">Order</p><div class="ac-togglegroup"><button type="button" data-order="asc" aria-pressed="${query.sortOrder === 'asc'}">Asc</button><button type="button" data-order="desc" aria-pressed="${query.sortOrder === 'desc'}">Desc</button></div></div>
      <div class="ac-stack8"><p class="ac-eyebrow">Member status</p>${chips('status', [['ACTIVE', 'Active'], ['DEACTIVATED', 'Deactivated'], ['ARCHIVED', 'Archived']])}</div>
      <div class="ac-stack8"><p class="ac-eyebrow">No login in</p>${chips('lastLoginBefore', WINDOWS)}</div>
      <div class="ac-stack8"><p class="ac-eyebrow">No activity in</p>${chips('lastActiveBefore', WINDOWS)}</div>
      ${query.lastLoginBefore || query.lastActiveBefore ? `<label class="ac-exrecent">${U.checkbox({ checked: query.excludeRecentJoiners, attrs: 'data-f-recent' })}<span><span>Exclude recent joiners</span><span>Leaves out students who joined too recently to be judged inactive.</span></span></label>` : ''}
      <div class="ac-stack8"><p class="ac-eyebrow">Invite status</p>${chips('inviteStatus', [['active', 'Active'], ['pending', 'Pending'], ['expired', 'Expired'], ['revoked', 'Revoked']])}</div>
      <div class="ac-stack8"><p class="ac-eyebrow">Enrollment</p>${chips('enrollment', [['enrolled', 'Enrolled'], ['not_enrolled', 'Not enrolled']])}</div>
      <div class="ac-stack8"><p class="ac-eyebrow">Completion</p>${chips('completion', [['not_started', 'Not started'], ['in_progress', 'In progress'], ['completed', 'Completed']])}</div>
    </div>`;
  }

  function listHTML() {
    const all = learners();
    const rows = visible();
    const total = rows.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    query.page = Math.min(query.page, pages);
    const slice = rows.slice((query.page - 1) * PAGE_SIZE, query.page * PAGE_SIZE);
    const view = activeView();
    const filtered = activeFilterCount() > 0 || Boolean(query.search);
    const limitReached = all.length >= maxLearners();
    const selectable = slice.filter((person) => person.status === 'active');
    const allPage = allMatching || (selectable.length > 0 && selectable.every((person) => selected.has(person.id)));
    const somePage = !allMatching && !allPage && selectable.some((person) => selected.has(person.id));
    const effective = allMatching ? total : selected.size;

    const header = `
      <div class="ac-ph"><div class="ac-ph-row">
        <div class="ac-ph-c"><h1 class="ac-title">Audience${isEnterprise() ? '' : `<small>(${all.length} / ${maxLearners() === Infinity ? 'Unlimited' : maxLearners().toLocaleString()})</small>`}</h1>
          <p class="ac-sub">See who belongs to your org, who is learning, who is invited, and how to reach them.</p></div>
        <div class="ac-act">
          <button type="button" class="btn btn-outline" id="au-export"${all.length === 0 ? ' disabled' : ''}>${U.icon('download', 16)}Export${U.icon('chevron-down', 16)}</button>
          <button type="button" class="btn btn-secondary" id="au-import"${limitReached ? " disabled title=\"You've reached your plan's student limit. Upgrade to import more students.\"" : ''}>Import Users</button>
        </div></div></div>`;

    const toolbar = `
      <div class="ac-toolbar">
        <p class="ac-count">${total} students</p>
        <button type="button" class="btn btn-ghost ac-ghost-sm" id="au-views" aria-haspopup="menu" aria-expanded="false">${view ? VIEWS[view][0] : 'Custom filters'}${U.icon('chevron-down', 16)}</button>
        <div style="width:100%;max-width:20rem">${U.searchHTML({ placeholder: 'Search…', value: query.search ?? '', id: 'au-search' })}</div>
        <div class="ac-relative"><button type="button" class="btn btn-outline btn-sm" id="au-filter" aria-label="Filter" aria-haspopup="dialog" aria-expanded="false">${U.icon('funnel', 16)}<span>Filter</span></button>${activeFilterCount() > 0 || query.sortBy !== 'createdAt' || query.sortOrder !== 'desc' ? '<span class="ac-filter-dot"></span>' : ''}</div>
      </div>`;

    let body;

    if (total > 0) {
      body = `<div class="ac-stack12"><div class="ac-tablewrap"><table class="ac-table"><thead><tr>
        <th class="ac-w10">${U.checkbox({ checked: allPage, indeterminate: somePage, attrs: 'data-sel-all', label: 'Select all' })}</th>
        ${['Name', 'Email', 'Status', 'Enrollment', 'Progress', 'Last login', 'Last activity', 'Date Joined'].map((label) => `<th>${label}</th>`).join('')}
        <th class="ac-w12"><span style="position:absolute;left:-9999px">Open actions</span></th></tr></thead><tbody>${slice.map((person) => rowHTML(person, true)).join('')}</tbody></table></div>
        ${total > PAGE_SIZE ? `<div id="au-pg">${U.paginationHTML({ count: total, perPage: PAGE_SIZE, page: query.page })}</div>` : ''}</div>`;
    } else if (filtered) {
      body = U.emptyHTML({ iconName: 'search-x', title: 'No students match these filters', description: 'Try widening the date range or clearing a filter.', actions: '<button type="button" class="btn btn-secondary" id="au-clear">Clear filters</button>' });
    } else {
      body = U.emptyHTML({ iconName: 'users', title: 'No audience to manage', description: 'Manage all your students here and stay connected with them' });
    }

    const bar = effective > 0 ? selectionBarHTML(effective, total) : '';

    return `<div class="ac-page ac-w6xl">${header}<div class="ac-body">
      ${limitReached ? U.upgradeBannerHTML('Upgrade your plan to invite more students') : ''}
      ${toolbar}
      ${undo ? '<div class="ac-undo"><span>Applied. You can still undo this.</span><button type="button" class="btn btn-secondary btn-sm" id="au-undo">Undo</button><button type="button" class="ac-iconbtn" id="au-undo-x" title="Dismiss" aria-label="Dismiss">' + U.icon('x', 16) + '</button></div>' : ''}
      ${body}</div>${bar}</div>`;
  }

  function selectionBarHTML(effective, total) {
    const status = allMatching ? `All ${total} matching students selected` : `${selected.size} selected`;
    const canAll = !allMatching && total > selected.size;

    return `<div class="ac-fbar" data-testid="audience-bulk-bar"><div class="ac-fbar-in" role="status"><div class="ac-fbar-s"><p>${status}</p></div><div class="ac-fbar-a">
      ${canAll ? `<button type="button" class="btn btn-secondary" id="au-all-matching">Select all ${total} matching</button>` : ''}
      <button type="button" class="btn btn-secondary" id="au-copy">${U.icon('clipboard', 16)}Copy${U.icon('chevron-down', 16)}</button>
      <button type="button" class="btn btn-secondary" id="au-bexport">${U.icon('download', 16)}Export${U.icon('chevron-down', 16)}</button>
      <button type="button" class="btn btn-primary" id="au-bulk">Actions${U.icon('chevron-down', 16)}</button>
      <span class="ac-vsep" aria-hidden="true"></span><button type="button" class="ac-clear" id="au-clear-sel">Clear</button></div></div></div>`;
  }

  /* ---------- export ---------- */
  function exportRows(onlySelected) {
    const rows = onlySelected && (selected.size || allMatching) ? (allMatching ? visible() : learners().filter((p) => selected.has(p.id))) : visible();

    return rows.map((p) => [p.name, p.email, p.memberStatus || 'ACTIVE', p.status, p.invitedAt ? new Date(p.invitedAt).toISOString() : '', p.lastLoginAt ? new Date(p.lastLoginAt).toISOString() : '', p.lastActiveAt ? new Date(p.lastActiveAt).toISOString() : '', `0 / ${enrolledCount(p)}`, '0%']);
  }

  const EXPORT_HEAD = ['Name', 'Email', 'Member status', 'Status', 'Date Joined', 'Last login', 'Last activity', 'Enrolled', 'Progress'];

  function csv(rows) {
    return [EXPORT_HEAD, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  }

  function runExport(format, onlySelected, copy) {
    const rows = exportRows(onlySelected);

    if (!rows.length) {
      P.toast('There is nothing to export', { error: true });

      return;
    }

    if (copy) {
      const text = format === 'json' ? JSON.stringify(rows.map((r) => Object.fromEntries(EXPORT_HEAD.map((h, i) => [h, r[i]]))), null, 2) : format === 'html' ? `<table>${[EXPORT_HEAD, ...rows].map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table>` : csv(rows);
      navigator.clipboard?.writeText(text).catch(() => {});
      P.toast('Copied to clipboard');

      return;
    }

    if (format === 'csv') U.download(csv(rows), 'audience.csv', 'text/csv;charset=utf-8;');
    else if (format === 'html') U.download(`<table>${[EXPORT_HEAD, ...rows].map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table>`, 'audience.html', 'text/html');
    else P.toast(`${format.toUpperCase()} export is simulated here. CSV and HTML download for real.`);
  }

  function exportMenu(anchor, onlySelected, copy) {
    const items = copy
      ? [['csv', 'CSV', 'sheet'], ['json', 'JSON', 'braces'], ['html', 'HTML', 'code']]
      : [['csv', 'CSV', 'sheet'], ['xlsx', 'Excel', 'sheet'], ['pdf', 'PDF', 'file-text'], ['html', 'HTML', 'code']];

    U.menu(anchor, items.map(([id, label, ic]) => ({ label, icon: ic, onSelect: () => runExport(id, onlySelected, copy) })), { align: 'end' });
  }

  /* ---------- wiring: list ---------- */
  function go(patch, resetSelection = true) {
    query = { ...query, ...patch };
    if (resetSelection) {
      selected.clear();
      allMatching = false;
    }

    draw();
  }

  function draw() {
    const keepSearch = document.activeElement?.id === 'au-search';
    const caret = keepSearch ? document.activeElement.selectionStart : 0;
    $('#au-root').innerHTML = listHTML();
    wireList();

    if (keepSearch) {
      const input = $('#au-search');
      input.focus();
      input.setSelectionRange(caret, caret);
    }
  }

  function wireList() {
    U.wireUpgrade(document, S, commit, rerender);
    $('#au-export')?.addEventListener('click', (event) => exportMenu(event.currentTarget, false, false));
    $('#au-import')?.addEventListener('click', () => {
      window.location.href = `${M.R.audience}?view=import`;
    });

    $('#au-views').addEventListener('click', (event) =>
      U.menu(event.currentTarget, Object.keys(VIEWS).map((id) => ({ label: VIEWS[id][0], onSelect: () => go({ ...DEFAULT_QUERY, search: query.search, sortBy: query.sortBy, sortOrder: query.sortOrder, ...VIEWS[id][1], page: 1 }) })), { align: 'start', className: 'w-56' })
    );

    const searchBox = $('.ac-search');
    const apply = U.debounce((value) => go({ search: value || undefined, page: 1 }), 250);
    U.wireSearch(searchBox, apply);

    $('#au-filter').addEventListener('click', (event) => {
      const anchor = event.currentTarget;
      const bind = (el, handle) => {
        el.querySelectorAll('[data-sort]').forEach((b) => b.addEventListener('click', () => { handle.close(); go({ sortBy: b.dataset.sort, page: 1 }); }));
        el.querySelectorAll('[data-order]').forEach((b) => b.addEventListener('click', () => { handle.close(); go({ sortOrder: b.dataset.order, page: 1 }); }));
        el.querySelectorAll('[data-f]').forEach((b) =>
          b.addEventListener('click', () => {
            const key = b.dataset.f;
            const value = b.dataset.v;
            handle.close();
            go({ [key]: key === 'status' ? value : query[key] === value ? undefined : value, page: 1 });
          })
        );
        el.querySelector('[data-f-clear]')?.addEventListener('click', () => { handle.close(); go({ ...DEFAULT_QUERY, search: query.search, sortBy: query.sortBy, sortOrder: query.sortOrder }); });
        el.querySelector('[data-f-recent]')?.addEventListener('click', () => { handle.close(); go({ excludeRecentJoiners: !query.excludeRecentJoiners, page: 1 }); });
      };

      U.popover(anchor, filterPopoverHTML(), { width: 360, wire: bind });
    });

    $('#au-clear')?.addEventListener('click', () => go({ ...DEFAULT_QUERY, sortBy: query.sortBy, sortOrder: query.sortOrder }));
    $('#au-undo')?.addEventListener('click', () => {
      undo.revert();
      undo = null;
      commit();
      P.toast('Reverted');
      draw();
    });
    $('#au-undo-x')?.addEventListener('click', () => {
      undo = null;
      draw();
    });

    const pager = $('#au-pg');
    if (pager) U.wirePagination(pager, (page) => go({ page }, true));

    const pageRows = visible().slice((query.page - 1) * PAGE_SIZE, query.page * PAGE_SIZE);
    const pageIds = pageRows.filter((p) => p.status === 'active').map((p) => p.id);

    $('[data-sel-all]')?.addEventListener('click', () => {
      if (allMatching) {
        selected.clear();
        allMatching = false;
      } else if (pageIds.every((id) => selected.has(id))) pageIds.forEach((id) => selected.delete(id));
      else pageIds.forEach((id) => selected.add(id));

      draw();
    });
    $$('[data-sel]').forEach((box) =>
      box.addEventListener('click', () => {
        if (allMatching) {
          allMatching = false;
          pageIds.forEach((id) => selected.add(id));
        }

        const id = box.dataset.sel;
        if (selected.has(id)) selected.delete(id);
        else selected.add(id);
        draw();
      })
    );

    $$('[data-actions]').forEach((button) =>
      button.addEventListener('click', () => {
        const person = learners().find((p) => p.id === button.dataset.actions);
        const items = [];

        if (person.status === 'pending') items.push({ label: 'Simulate accepted invite', hint: 'Prototype only', onSelect: () => acceptInvite(person) });
        if (person.status !== 'active') items.push({ label: 'Resend invite', onSelect: () => resend(person) });
        if (person.status === 'pending') items.push({ label: 'Revoke pending invite', danger: true, onSelect: () => revoke(person) });
        items.push({ label: 'Delete', danger: true, onSelect: () => confirmDelete(person) });
        U.menu(button, items, { align: 'end' });
      })
    );

    $('#au-all-matching')?.addEventListener('click', () => { allMatching = true; draw(); });
    $('#au-clear-sel')?.addEventListener('click', () => { selected.clear(); allMatching = false; draw(); });
    $('#au-copy')?.addEventListener('click', (event) => exportMenu(event.currentTarget, true, true));
    $('#au-bexport')?.addEventListener('click', (event) => exportMenu(event.currentTarget, true, false));
    $('#au-bulk')?.addEventListener('click', (event) => {
      const count = allMatching ? visible().length : selected.size;
      const label = (action) => `${{ archive: 'Archive', deactivate: 'Deactivate', reactivate: 'Reactivate', unarchive: 'Unarchive', delete: 'Delete' }[action]} ${count} students`;

      U.menu(event.currentTarget, [
        { label: 'Assign to Courses', disabled: allMatching, onSelect: assignDialog },
        { sep: true },
        ...['archive', 'deactivate', 'reactivate', 'unarchive'].map((action) => ({ label: label(action), onSelect: () => bulkDialog(action, count) })),
        { sep: true },
        { label: label('delete'), danger: true, onSelect: () => bulkDialog('delete', count) }
      ], { align: 'end' });
    });
  }

  function acceptInvite(person) {
    person.status = 'active';
    person.joinedAt = Date.now();
    commit();
    P.toast('Invite accepted (prototype simulation)');
    draw();
  }

  function resend(person) {
    person.status = 'pending';
    person.invitedAt = Date.now();
    commit();
    P.toast('Invitation email sent (simulated)');
    draw();
  }

  function revoke(person) {
    person.status = 'revoked';
    commit();
    P.toast('Pending invitation revoked');
    draw();
  }

  async function confirmDelete(person) {
    const ok = await U.confirm({
      title: 'Delete member',
      body: `This removes the member from your organization and revokes their access to all assigned courses and cohorts.<br><br>Are you sure you want to delete ${esc(person.name)} (${esc(person.email)})? This action cannot be undone.`,
      confirm: 'Delete',
      danger: true
    });

    if (!ok) return;

    removePeople([person.id]);
    P.toast('Member deleted');
    draw();
  }

  function removePeople(ids) {
    S.audience = learners().filter((p) => !ids.includes(p.id));
    courseList().forEach((course) => ids.forEach((id) => U.unenroll(course, id)));
    ids.forEach((id) => selected.delete(id));
    commit();
  }

  function assignDialog() {
    const picked = new Set();
    const ids = [...selected];
    const courses = courseList();

    U.dialog({
      title: 'Assign to Courses',
      size: 'md',
      description: 'Give the selected users access to courses and optionally notify them by email.',
      body: `<div class="ac-msl-box"><div class="ac-msl-head"><p>Select courses (${courses.length})</p></div>${courses.length ? `<div class="ac-msl-list">${courses.map((c) => `<label class="ac-msl-item">${U.checkbox({ attrs: `data-c="${esc(c.id)}"` })}<span>${esc(c.title)}</span></label>`).join('')}</div>` : '<p class="ac-msl-empty">Choose courses...</p>'}</div>
        <label class="ac-checkrow">${U.checkbox({ checked: true, attrs: 'data-mail' })}<span>Send notification email</span></label>`,
      footer: '<button type="button" class="btn btn-outline" data-no>Cancel</button><button type="button" class="btn btn-primary" data-yes disabled>Assign</button>',
      wire(ctl) {
        let mail = true;
        ctl.$$('[data-c]').forEach((box) => box.addEventListener('click', () => {
          const id = box.dataset.c;
          if (picked.has(id)) picked.delete(id); else picked.add(id);
          box.setAttribute('aria-checked', String(picked.has(id)));
          ctl.$('[data-yes]').disabled = picked.size === 0;
        }));
        const mailBox = ctl.$('[data-mail]');
        mailBox.addEventListener('click', () => { mail = !mail; mailBox.setAttribute('aria-checked', String(mail)); });
        ctl.$('[data-no]').addEventListener('click', () => ctl.close());
        ctl.$('[data-yes]').addEventListener('click', () => {
          let assigned = 0;
          let already = 0;

          ids.forEach((id) => {
            const person = learners().find((p) => p.id === id);
            picked.forEach((courseId) => {
              const course = M.findCourse(S, courseId);
              if (U.enroll(course, id)) { assigned += 1; person.courseIds = [...new Set([...(person.courseIds ?? []), courseId])]; } else already += 1;
            });
          });
          commit();
          ctl.close();
          selected.clear();
          P.toast(`Assigned ${ids.length} users (${already} already had access, ${mail ? ids.length : 0} emails sent)`);
          draw();
        });
      }
    });
  }

  const BULK = {
    archive: ['Archive', 'They lose access and free up a seat on your plan. You can unarchive them at any time.', 'Archive', 'ARCHIVED'],
    deactivate: ['Deactivate', 'They lose access but keep their seat on your plan. You can reactivate them at any time.', 'Deactivate', 'DEACTIVATED'],
    reactivate: ['Reactivate', 'They regain access to your organization and its courses.', 'Reactivate', 'ACTIVE'],
    unarchive: ['Unarchive', 'They regain access and take a seat on your plan again.', 'Unarchive', 'ACTIVE'],
    delete: ['Permanently remove', 'This removes them from this organization and cannot be undone. Their account, submissions and results are kept.', 'Delete permanently', null]
  };

  function bulkDialog(action, count) {
    const [verb, body, confirmLabel, next] = BULK[action];
    const targets = allMatching ? visible().map((p) => p.id) : [...selected];
    const archivedBlock = action === 'delete' ? targets.filter((id) => learners().find((p) => p.id === id)?.memberStatus !== 'ARCHIVED').length : 0;

    U.dialog({
      title: `${verb} ${count} students${action === 'delete' ? '' : ''}?`,
      size: 'lg',
      description: body,
      body: `${archivedBlock ? `<p class="ac-warn-text">${archivedBlock} of these students are not archived. Archive them first.</p>` : ''}
        <div class="ac-field"><label class="ac-label" for="bk-reason">Reason (optional)</label><textarea class="ac-textarea" id="bk-reason" rows="2"></textarea><p class="ac-desc">Recorded on the audit trail so this is answerable later.</p></div>
        ${action === 'delete' ? `<div class="ac-field"><label class="ac-label" for="bk-type">Type ${count} to confirm</label><input class="ac-input" id="bk-type" /><p class="ac-desc">Deleting cannot be undone.</p></div>` : ''}`,
      footer: `<button type="button" class="btn btn-outline" data-no>Cancel</button><button type="button" class="btn ${action === 'delete' ? 'btn-destructive' : 'btn-primary'}" data-yes${action === 'delete' ? ' disabled' : ''}>${confirmLabel}</button>`,
      wire(ctl) {
        const typed = ctl.$('#bk-type');
        const yes = ctl.$('[data-yes]');
        const gate = () => { yes.disabled = archivedBlock > 0 || (typed && typed.value.trim() !== String(count)); };
        typed?.addEventListener('input', gate);
        if (archivedBlock) yes.disabled = true;
        ctl.$('[data-no]').addEventListener('click', () => ctl.close());
        yes.addEventListener('click', () => {
          const before = structuredClone(learners());
          const beforeCourses = courseList().map((c) => structuredClone(c.people ?? []));

          if (action === 'delete') removePeople(targets);
          else learners().forEach((p) => { if (targets.includes(p.id)) p.memberStatus = next; });

          undo = action === 'delete' ? null : { revert: () => { S.audience = before; courseList().forEach((c, i) => (c.people = beforeCourses[i])); } };
          selected.clear();
          allMatching = false;
          commit();
          ctl.close();
          P.toast('Students updated');
          draw();
        });
      }
    });
  }

  /* ---------- import view ---------- */
  function importView() {
    const root = $('#au-root');
    const state = { step: 'upload', text: '', source: null, rows: [], truncated: 0, unknown: [], courseMode: 'none', cohortMode: 'none', courses: new Set(), sendEmail: true, result: [], imported: 0 };

    const header = (actions) => `<div class="ac-ph"><div class="ac-ph-row"><div class="ac-ph-c">
      <a class="ac-back" href="${esc(M.R.audience)}">${U.icon('chevron-left', 16)}Back</a><h1 class="ac-title">Import Users</h1>
      <p class="ac-sub">Add many people at once by email, then assign courses or cohorts if you like.</p></div>${actions ? `<div class="ac-act">${actions}</div>` : ''}</div></div>`;

    const table = (rows, withName) => `<div class="ac-msl"><table class="ac-table"><thead><tr><th>Email</th>${withName ? '<th>Name</th>' : ''}<th>Status</th></tr></thead><tbody>${rows.map((row) => `<tr class="${row.status === 'ready' ? '' : 'ac-muted'}"><td>${esc(row.email || '—')}</td>${withName ? `<td>${esc(row.name ?? '—')}</td>` : ''}<td>${U.badge(row.status === 'ready' ? 'secondary' : 'outline', ROW_STATUS[row.status])}</td></tr>`).join('')}</tbody></table></div>`;

    const radios = (key, name, labels) => `<div class="ac-stack12"><label class="ac-label">${name}</label><div class="ac-radios" role="radiogroup">${['none', 'all', 'select'].map((value, i) => `<label><button type="button" class="ac-radio" role="radio" aria-checked="${state[key] === value}" data-radio="${key}" data-v="${value}"></button>${labels[i]}</label>`).join('')}</div></div>`;

    function draw() {
      const summary = summarise(state.rows);
      let main;
      let actions = '';

      if (state.step === 'upload') {
        main = `<div class="ac-import"><p class="ac-sub">Add students to your organization by entering their email addresses. Optionally assign them to courses or cohorts and send invitation emails.</p>
          <button type="button" class="ac-dropzone" id="im-drop"><span style="display:flex;color:var(--muted-foreground)">${U.icon('upload', 24)}</span><b>Drop a CSV here, or click to choose one</b><small>UTF-8 CSV with an email column. Up to ${IMPORT_MAX_ROWS} rows, 5 MB.</small></button><input type="file" id="im-file" accept=".csv,text/csv" hidden />
          <div><button type="button" class="ac-btn-link" id="im-template">Download the template</button></div>
          <div class="ac-sep" role="separator"></div>
          <div class="ac-field"><label class="ac-label" for="im-paste">Email Addresses</label><textarea class="ac-textarea" id="im-paste" rows="6" placeholder="Enter emails separated by commas, newlines, or semicolons\ne.g. alice@example.com, bob@example.com">${esc(state.text)}</textarea><p class="ac-desc">One address per line, or comma separated.</p></div>
          <div><button type="button" class="btn btn-primary" id="im-review"${state.text.trim() ? '' : ' disabled'}>Review</button></div></div>`;
      } else if (state.step === 'preview') {
        actions = `<button type="button" class="btn btn-secondary" id="im-over">Choose a different file</button><button type="button" class="btn btn-primary" id="im-submit"${summary.ready === 0 ? ' disabled' : ''}>Import ${summary.ready} students</button>`;
        const courses = courseList();
        main = `<div class="ac-import"><div class="ac-import-sum">${state.source ? `<span class="nm">${esc(state.source)}</span>` : ''}${U.badge('secondary', `${summary.ready} ready`)}${summary.listed ? U.badge('outline', `${summary.listed} already listed`) : ''}${summary.invalid ? U.badge('warn', `${summary.invalid} need attention`, 'ac-badge-outline') : ''}</div>
          ${state.truncated ? `<p class="ac-warn-text">${state.truncated} rows past the ${IMPORT_MAX_ROWS}-row limit were left out. Split the file and import the rest.</p>` : ''}
          ${state.unknown.length ? `<p class="ac-sub">Ignored unrecognised columns: ${esc(state.unknown.join(', '))}</p>` : ''}
          ${table(state.rows, true)}
          ${radios('courseMode', 'Course Access', ['No course assignment', 'All courses', 'Select specific courses'])}
          ${state.courseMode === 'select' ? `<div class="ac-msl-box ac-indent"><div class="ac-msl-head"><p>Select courses (${courses.length})</p></div>${courses.length ? `<div class="ac-msl-list">${courses.map((c) => `<label class="ac-msl-item">${U.checkbox({ checked: state.courses.has(c.id), attrs: `data-ic="${esc(c.id)}"` })}<span>${esc(c.title)}</span></label>`).join('')}</div>` : '<p class="ac-msl-empty">Choose courses...</p>'}</div>` : ''}
          ${radios('cohortMode', 'Cohort Access', ['No cohort assignment', 'All cohorts', 'Select specific cohorts'])}
          ${state.cohortMode === 'select' ? '<div class="ac-msl-box ac-indent"><div class="ac-msl-head"><p>Select cohorts (0)</p></div><p class="ac-msl-empty">Choose cohorts...</p></div>' : ''}
          <label class="ac-checkrow">${U.checkbox({ checked: state.sendEmail, attrs: 'data-send' })}<span>Send invitation email to imported users</span></label></div>`;
      } else {
        main = `<div class="ac-import"><p class="ac-medium ac-text-sm">${state.imported} students imported</p>${table(state.result, false)}
          <div class="ac-wrap">${state.result.some((r) => r.status !== 'ready') ? '<button type="button" class="btn btn-outline" id="im-errors">Download the rows that failed</button>' : ''}<a class="btn btn-primary" href="${esc(M.R.audience)}">Done</a></div></div>`;
      }

      root.innerHTML = `<div class="ac-page ac-w4xl">${header(actions)}<div class="ac-body">${main}</div></div>`;
      wire();
    }

    function parseInto(text, name) {
      const parsed = parseImport(text);

      if (!parsed.rows.length) {
        P.toast('Please enter at least one email address', { error: true });

        return;
      }

      Object.assign(state, { text, source: name, rows: classify(parsed.rows), truncated: parsed.truncated, unknown: parsed.unknown, step: 'preview' });
      draw();
    }

    function wire() {
      const file = $('#im-file');
      const drop = $('#im-drop');
      drop?.addEventListener('click', () => file.click());
      const take = async (picked) => {
        if (!picked) return;
        if (picked.size > 5 * 1024 * 1024 || !/\.csv$/i.test(picked.name)) {
          P.toast('File type not accepted or file too large (CSV, 5 MB).', { error: true });

          return;
        }

        parseInto(await picked.text(), picked.name);
      };
      file?.addEventListener('change', () => take(file.files?.[0]));
      drop?.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
      drop?.addEventListener('dragleave', () => drop.classList.remove('over'));
      drop?.addEventListener('drop', (e) => { e.preventDefault(); take(e.dataTransfer?.files?.[0]); });
      $('#im-template')?.addEventListener('click', () => U.download(TEMPLATE, 'audience-template.csv', 'text/csv;charset=utf-8;'));
      const paste = $('#im-paste');
      paste?.addEventListener('input', () => { state.text = paste.value; $('#im-review').disabled = !paste.value.trim(); });
      $('#im-review')?.addEventListener('click', () => parseInto(state.text, null));
      $('#im-over')?.addEventListener('click', () => Object.assign(state, { step: 'upload', text: '', rows: [], source: null }) && draw());
      $$('[data-radio]').forEach((r) => r.addEventListener('click', () => { state[r.dataset.radio] = r.dataset.v; draw(); }));
      $$('[data-ic]').forEach((box) => box.addEventListener('click', () => { const id = box.dataset.ic; if (state.courses.has(id)) state.courses.delete(id); else state.courses.add(id); draw(); }));
      $('[data-send]')?.addEventListener('click', () => { state.sendEmail = !state.sendEmail; draw(); });
      $('#im-errors')?.addEventListener('click', () => U.download(`email,name,reason\r\n${state.result.filter((r) => r.status !== 'ready').map((r) => [r.email, r.name ?? '', r.status].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n')}\r\n`, 'audience-import-errors.csv', 'text/csv;charset=utf-8;'));

      $('#im-submit')?.addEventListener('click', () => {
        const courseIds = state.courseMode === 'all' ? courseList().map((c) => c.id) : state.courseMode === 'select' ? [...state.courses] : [];
        const recheck = classify(state.rows.map((r) => (r.status === 'ready' ? r : r)));
        let imported = 0;

        state.result = recheck.map((row) => {
          if (row.status !== 'ready') return row;

          const person = { id: M.newId('learner'), name: row.name || row.email.split('@')[0], email: row.email, role: 'student', status: 'pending', memberStatus: 'ACTIVE', invitedAt: Date.now(), courseIds: [...courseIds], lastLoginAt: null, lastActiveAt: null };
          row.courses.forEach((title) => { const match = courseList().find((c) => c.title.toLowerCase() === title.toLowerCase() || c.id === title); if (match && !person.courseIds.includes(match.id)) person.courseIds.push(match.id); });
          learners().push(person);
          person.courseIds.forEach((id) => U.enroll(M.findCourse(S, id), person.id));
          imported += 1;

          return row;
        });
        state.imported = imported;
        commit();
        P.toast(`${imported} new invites, 0 existing students given access, 0 pending invites renewed (${state.sendEmail ? imported : 0} emails sent, simulated)`);
        state.step = 'result';
        draw();
      });
    }

    draw();
  }

  function wire(state, ctx) {
    S = state;
    commit = ctx.commit;
    rerender = ctx.rerender;
    learners();

    if (new URLSearchParams(window.location.search).get('view') === 'import') importView();
    else draw();
  }

  window.PAGES = window.PAGES || {};
  window.PAGES.audience = { title: 'Audience', html, wire };
})();
