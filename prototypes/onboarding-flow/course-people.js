/*
 * course-people.js — the course People tab: routes/(app)/courses/[id]/people with
 * lib/features/course/pages/people.svelte and components/people/{invitation-modal, delete-confirmation} and
 * lib/features/people/components.
 *
 * Page: title "People" with Add (opens "Invite people"), search, the Filter popover (sort, role, progress, certificate,
 * last login, joined within), the table (Student, Progress, Stage, Last Login At, Enrolled At, row menu), pagination
 * and the delete-profile confirmation. "Invite people" has the production tabs: Invite Tutors (team members), Add
 * Students (existing audience learners to grant access, and new emails to invite) and Invite link.
 *
 * Persisted on the course: course.people = [{ personId, role: 'student'|'tutor', enrolledAt }] where personId is an
 * S.audience id (student) or S.team id (tutor); invited learners are added to S.audience as pending. The per-course
 * invite link is course.inviteLink = { token, revoked, joinCount }. Simulated: no emails are sent; the learner profile
 * page behind "View" is outside the prototype.
 */
(function () {
  if (!window.AccountUI) document.write('<script src="account-ui.js"><\/script>');

  const DAY = 86400000;
  const query = { page: 1, sortBy: 'name', sortOrder: 'asc', roleId: undefined, progress: undefined, certificateEarned: undefined, lastLoginBefore: undefined, enrolledWithin: undefined, search: '' };
  const PAGE_SIZE = 20;
  let openAdd = new URLSearchParams(window.location.search).get('add') === 'true';

  function rowsFor(ctx) {
    const { S, course } = ctx;
    const audience = S.audience ?? [];
    const team = S.team ?? [];

    return (course.people ?? [])
      .map((entry) => {
        if (entry.role === 'tutor') {
          const member = team.find((m) => m.id === entry.personId);

          return member ? { id: member.id, kind: 'tutor', roleId: 2, name: member.fullname || member.email, email: member.email, pending: !member.verified, enrolledAt: entry.enrolledAt, lastLoginAt: member.lastLoginAt ?? null, self: member.self } : null;
        }

        const person = audience.find((p) => p.id === entry.personId);

        return person ? { id: person.id, kind: 'student', roleId: 3, name: person.name, email: person.email, pending: person.status !== 'active', enrolledAt: entry.enrolledAt, lastLoginAt: person.lastLoginAt ?? null, progress: 0 } : null;
      })
      .filter(Boolean);
  }

  function visibleRows(ctx) {
    const search = query.search.trim().toLowerCase();
    const direction = query.sortOrder === 'asc' ? 1 : -1;
    const withinMs = { '7d': 7, '30d': 30, '90d': 90, '180d': 180 };

    return rowsFor(ctx)
      .filter((row) => {
        if (search && !`${row.name} ${row.email}`.toLowerCase().includes(search)) return false;
        if (query.roleId && row.roleId !== query.roleId) return false;
        if (query.progress && (row.kind !== 'student' || query.progress !== 'not_started')) return false;
        if (query.certificateEarned === true) return false;
        if (query.certificateEarned === false && row.kind !== 'student') return false;
        if (query.lastLoginBefore) {
          if (query.lastLoginBefore === 'never' ? row.lastLoginAt : row.lastLoginAt && Date.now() - row.lastLoginAt <= withinMs[query.lastLoginBefore] * DAY) return false;
        }
        if (query.enrolledWithin && Date.now() - (row.enrolledAt ?? 0) > withinMs[query.enrolledWithin] * DAY) return false;

        return true;
      })
      .sort((a, b) => {
        const key = { name: 'name', role: 'roleId', progress: 'progress', lastLogin: 'lastLoginAt', enrolledAt: 'enrolledAt', certificate: 'name' }[query.sortBy];
        const left = a[key] ?? 0;
        const right = b[key] ?? 0;

        return (typeof left === 'string' ? left.localeCompare(String(right)) : left - right) * direction;
      });
  }

  function obscure(email) {
    const [user, domain] = (email || '').split('@');
    if (!user || !domain) return email || '';

    return user.length <= 2 ? `${user[0]}*@${domain}` : `${user[0]}${'*'.repeat(user.length - 2)}${user[user.length - 1]}@${domain}`;
  }

  function limitReached(ctx) {
    return (ctx.S.audience ?? []).length >= ctx.U.maxLearners(ctx.S);
  }

  function filterHTML(ctx) {
    const { U } = ctx;
    const chips = (label, options, selectedFn) =>
      `<div class="ac-stack8"><p class="ac-eyebrow">${label}</p><div class="ac-chips">${options.map(([text, patch]) => `<button type="button" class="btn btn-sm ${selectedFn(patch) ? 'btn-secondary' : 'btn-outline'}" data-patch='${JSON.stringify(patch)}'>${text}</button>`).join('')}</div></div>`;
    const is = (patch) => Object.entries(patch).every(([k, v]) => query[k] === v);
    const windows = [['7 days', '7d'], ['30 days', '30d'], ['90 days', '90d'], ['180 days', '180d']];
    const sorts = [['name', 'Name'], ['role', 'Role'], ['progress', 'Progress'], ['lastLogin', 'Last Login At'], ['enrolledAt', 'Enrolled At'], ['certificate', 'Certificate earned']];
    const active = ['roleId', 'progress', 'certificateEarned', 'lastLoginBefore', 'enrolledWithin'].some((k) => query[k] !== undefined);

    return `<div class="ac-pop-stack">
      <div class="ac-pop-head"><p>Filter people</p><button type="button" class="ac-btn-link" data-clear${active ? '' : ' disabled'}>Clear all</button></div>
      <div class="ac-stack8"><p class="ac-eyebrow">Sort</p><div class="ac-chips">${sorts.map(([v, l]) => `<button type="button" class="btn btn-sm ${query.sortBy === v ? 'btn-secondary' : 'btn-outline'}" data-sort="${v}">${l}</button>`).join('')}</div></div>
      <div class="ac-stack8"><p class="ac-eyebrow">Order</p><div class="ac-togglegroup"><button type="button" data-order="asc" aria-pressed="${query.sortOrder === 'asc'}">Asc</button><button type="button" data-order="desc" aria-pressed="${query.sortOrder === 'desc'}">Desc</button></div></div>
      ${chips('Role', [['All roles', { roleId: undefined }], ['Admin', { roleId: 1 }], ['Tutor', { roleId: 2 }], ['Student', { roleId: 3 }]], is)}
      ${chips('Progress', [['Not started', { progress: 'not_started' }], ['In progress', { progress: 'in_progress' }], ['Completed', { progress: 'completed' }]], is)}
      ${chips('Certificate', [['Earned', { certificateEarned: true }], ['Not earned', { certificateEarned: false }]], is)}
      ${chips('No login since', [...windows, ['Never', 'never']].map(([l, v]) => [l, { lastLoginBefore: v }]), is)}
      ${chips('Joined within', windows.map(([l, v]) => [l, { enrolledWithin: v }]), is)}
    </div>`;
  }

  function html(ctx) {
    const { U, esc } = ctx;
    const rows = visibleRows(ctx);
    const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    query.page = Math.min(query.page, pages);
    const slice = rows.slice((query.page - 1) * PAGE_SIZE, query.page * PAGE_SIZE);
    const arrow = (key) => (query.sortBy === key ? U.icon(query.sortOrder === 'asc' ? 'arrow-up' : 'arrow-down', 14) : '');
    const head = (label, key) => `<th aria-sort="${query.sortBy === key ? (query.sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}"><button type="button" class="ac-sortbtn" data-hsort="${key}">${label}${arrow(key)}</button></th>`;
    const filtered = ['roleId', 'progress', 'certificateEarned', 'lastLoginBefore', 'enrolledWithin'].some((k) => query[k] !== undefined);

    const body = slice.length
      ? slice.map((row) => {
          const student = row.kind === 'student';
          const nameCell = row.pending
            ? `<div class="ac-pname"><span class="av">${U.icon('user', 16)}</span><div class="meta"><a class="ac-link" href="mailto:${esc(row.email)}" style="text-decoration:none;color:var(--primary)">${esc(row.email)}</a>${U.badge('yellow', 'Pending')}</div></div>`
            : `<div class="ac-pname"><span class="av">${U.icon('user', 16)}</span><div class="meta"><div><p class="nm">${esc(row.name)}</p><span class="em">${esc(obscure(row.email))}</span></div><button type="button" class="ac-iconbtn sec" data-copy="${esc(row.email)}" aria-label="Copy email">${U.icon('copy', 16)}</button>${row.self ? U.badge('default', 'You') : ''}</div></div>`;

          return `<tr data-id="${esc(row.id)}" class="${row.pending ? '' : 'nav'}">
            <td style="min-width:220px">${nameCell}</td>
            <td>${student && !row.pending ? `<div style="display:flex;align-items:center;gap:12px"><div class="ac-bar"><i style="width:${row.progress}%"></i></div><span class="ac-text-sm ac-medium">${row.progress}%</span></div>` : '<span class="ac-muted ac-text-sm">—</span>'}</td>
            <td>${student && !row.pending ? U.badge('outline', 'Not started', 'ac-muted') : '<span class="ac-muted ac-text-sm">—</span>'}</td>
            <td><span class="ac-muted ac-text-sm">${student && !row.pending ? esc(U.shortDate(row.lastLoginAt)) : '—'}</span></td>
            <td><span class="ac-muted ac-text-sm">${esc(U.shortDate(row.enrolledAt))}</span></td>
            <td class="ac-sticky">${row.self ? '' : `<button type="button" class="ac-iconbtn" data-menu="${esc(row.id)}" aria-label="Open actions">${U.icon('ellipsis-vertical', 16)}</button>`}</td></tr>`;
        }).join('')
      : `<tr class="ac-people-empty"><td colspan="6">No results found</td></tr>`;

    return `<div class="cp2-page"><div class="ac-page ac-w5xl" style="min-height:0">
      <div class="ac-ph"><div class="ac-ph-row"><div class="ac-ph-c"><h1 class="ac-title">People</h1></div>
        <div class="ac-act"><button type="button" class="btn btn-primary" id="pp-add">Add</button></div></div></div>
      <div class="ac-body"><section class="ac-people">
        ${limitReached(ctx) ? U.upgradeBannerHTML("You've reached your plan's student limit. Upgrade to invite more students.") : ''}
        <div class="ac-people-bar">${U.searchHTML({ placeholder: 'Search people', value: query.search, id: 'pp-search' })}
          <div class="ac-relative"><button type="button" class="btn btn-outline btn-sm" id="pp-filter" aria-label="Filter">${U.icon('funnel', 16)}<span>Filter</span></button>${filtered ? '<span class="ac-filter-dot"></span>' : ''}</div></div>
        <div class="ac-tablewrap"><table class="ac-table ac-people-tbl"><thead><tr>${head('Student', 'name')}${head('Progress', 'progress')}<th>Stage</th>${head('Last Login At', 'lastLogin')}${head('Enrolled At', 'enrolledAt')}<th class="ac-sticky"></th></tr></thead><tbody>${body}</tbody></table></div>
        ${rows.length > PAGE_SIZE ? `<div style="padding-top:16px" id="pp-pg">${U.paginationHTML({ count: rows.length, perPage: PAGE_SIZE, page: query.page })}</div>` : ''}
      </section></div></div></div>`;
  }

  function wire(ctx) {
    const { U, S, course, $, $$, esc, commit, rerender, say, M } = ctx;

    U.wireUpgrade(document, S, commit, rerender);
    $('#pp-add').addEventListener('click', () => inviteDialog(ctx));

    U.wireSearch($('.ac-search'), U.debounce((value) => {
      query.search = value;
      query.page = 1;
      const caret = value.length;
      rerender();
      const input = $('#pp-search');
      input.focus();
      input.setSelectionRange(caret, caret);
    }, 250));

    $('#pp-filter').addEventListener('click', (event) =>
      U.popover(event.currentTarget, filterHTML(ctx), {
        width: 360,
        wire(el, handle) {
          const done = () => { handle.close(); query.page = 1; rerender(); };
          el.querySelectorAll('[data-sort]').forEach((b) => b.addEventListener('click', () => { query.sortBy = b.dataset.sort; done(); }));
          el.querySelectorAll('[data-order]').forEach((b) => b.addEventListener('click', () => { query.sortOrder = b.dataset.order; done(); }));
          el.querySelectorAll('[data-patch]').forEach((b) => b.addEventListener('click', () => {
            const patch = JSON.parse(b.dataset.patch);
            const on = Object.entries(patch).every(([k, v]) => query[k] === v);
            Object.keys(patch).forEach((k) => (query[k] = on ? undefined : patch[k]));
            done();
          }));
          el.querySelector('[data-clear]')?.addEventListener('click', () => {
            ['roleId', 'progress', 'certificateEarned', 'lastLoginBefore', 'enrolledWithin'].forEach((k) => (query[k] = undefined));
            done();
          });
        }
      })
    );

    $$('[data-hsort]').forEach((b) => b.addEventListener('click', () => {
      const key = b.dataset.hsort;
      query.sortOrder = query.sortBy === key && query.sortOrder === 'asc' ? 'desc' : 'asc';
      query.sortBy = key;
      query.page = 1;
      rerender();
    }));

    const pager = $('#pp-pg');
    if (pager) U.wirePagination(pager, (page) => { query.page = page; rerender(); });

    $$('[data-copy]').forEach((b) => b.addEventListener('click', (event) => {
      event.stopPropagation();
      navigator.clipboard?.writeText(b.dataset.copy).catch(() => {});
      say('Copied Email to clipboard');
    }));

    $$('tr.nav').forEach((row) => row.addEventListener('click', (event) => {
      if (event.target.closest('button, a')) return;
      say('The student profile page is outside this prototype.');
    }));

    $$('[data-menu]').forEach((button) => button.addEventListener('click', (event) => {
      event.stopPropagation();
      const row = rowsFor(ctx).find((r) => r.id === button.dataset.menu);
      const items = [];

      if (!row.pending) items.push({ label: 'View', icon: 'eye', onSelect: () => say('The student profile page is outside this prototype.') });
      items.push({
        label: 'Delete profile',
        icon: 'trash',
        danger: true,
        onSelect: async () => {
          const ok = await U.confirm({ title: 'Delete', body: `Are you sure you want to delete <strong>${esc(row.email)}</strong>?`, confirm: 'Yes', cancel: 'No' });
          if (!ok) return;

          U.unenroll(course, row.id);
          commit();
          rerender();
          say('Deleted successfully');
        }
      });
      U.menu(button, items, { align: 'end' });
    }));

    if (openAdd) {
      openAdd = false;
      inviteDialog(ctx);
    }
    void M;
  }

  function inviteDialog(ctx) {
    const { U, S, course, esc, commit, rerender, say, M } = ctx;
    const team = (S.team ?? []).filter((m) => m.verified && !m.self && !(course.people ?? []).some((e) => e.personId === m.id && e.role === 'tutor'));
    const pickedTutors = new Set();
    const pickedStudents = new Set();
    let tab = 'students';
    let search = '';
    let mailExisting = true;
    let mailNew = true;

    const ctl = U.dialog({
      title: 'Invite people',
      size: '3xl',
      body: '<div id="iv-tabs"></div><div id="iv-pane"></div>',
      wire(c) {
        const paint = () => {
          c.$('#iv-tabs').innerHTML = `<div class="ac-tabs" role="tablist">${[['tutors', 'Invite Tutors'], ['students', 'Add Students'], ['link', 'Invite link']].map(([v, l]) => `<button type="button" class="ac-tab" role="tab" aria-selected="${tab === v}" data-t="${v}">${l}</button>`).join('')}</div>`;
          c.$$('[data-t]').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.t; paint(); }));
          const pane = c.$('#iv-pane');

          if (tab === 'tutors') paintTutors(pane);
          else if (tab === 'students') paintStudents(pane);
          else paintLink(pane);
        };

        const paintTutors = (pane) => {
          const chosen = team.filter((m) => pickedTutors.has(m.id));
          pane.innerHTML = `<div class="ac-stack12" style="margin-top:12px"><div class="ac-tutorbox"><p>Invite Tutors</p>
            <button type="button" class="ac-select" id="iv-tsel" aria-haspopup="listbox" aria-expanded="false"><span>${chosen.length ? `<span class="ac-selbadges">${chosen.map((m) => U.badge('secondary', esc(m.fullname || m.email))).join('')}</span>` : 'Select tutors in organization...'}</span>${U.icon('chevron-down', 16)}</button>
            <span class="hl">To add tutor to your organization, <a class="ac-link" href="${esc(M.R.orgSettings)}?tab=teams">go to organization settings</a></span></div>
            <div class="ac-flexrev"><button type="button" class="btn btn-secondary" id="iv-finish">Finish</button></div></div>`;
          pane.querySelector('#iv-tsel').addEventListener('click', (event) => {
            const items = () => team.map((m) => ({ label: m.fullname || m.email, check: pickedTutors.has(m.id), onSelect: (item, update) => { if (pickedTutors.has(m.id)) pickedTutors.delete(m.id); else pickedTutors.add(m.id); paintTutors(pane); update(items()); } }));
            U.menu(event.currentTarget, items(), { align: 'start', matchWidth: true, keepOpen: true });
            if (!team.length) say('No verified team members are available. Invite tutors from organization settings.');
          });
          pane.querySelector('#iv-finish').addEventListener('click', () => {
            pickedTutors.forEach((id) => U.enroll(course, id, 'tutor'));
            commit();
            c.close();
            rerender();
          });
        };

        const paintStudents = (pane) => {
          const enrolled = new Set((course.people ?? []).filter((e) => e.role === 'student').map((e) => e.personId));
          const available = (S.audience ?? []).filter((p) => p.status === 'active' && !enrolled.has(p.id)).sort((a, b) => a.name.localeCompare(b.name));
          const shown = available.filter((p) => `${p.name} ${p.email}`.toLowerCase().includes(search.trim().toLowerCase()));
          const limit = limitReached(ctx);

          pane.innerHTML = `<div class="ac-stack" style="gap:24px;padding:12px 0 0">
            <div class="ac-stack8"><div class="ac-msl-box"><div class="ac-msl-head"><p>Add existing org students (${shown.length})${pickedStudents.size ? ` <span class="ac-muted ac-text-xs">${pickedStudents.size} selected</span>` : ''}</p>${U.searchHTML({ placeholder: 'Search organization students', value: search, id: 'iv-search' })}</div>
              ${shown.length ? `<div class="ac-msl-list">${shown.map((p) => `<label class="ac-msl-item">${U.checkbox({ checked: pickedStudents.has(p.id), attrs: `data-s="${esc(p.id)}"` })}<span>${esc(p.name)}</span><small>${esc(p.email)}</small></label>`).join('')}</div>` : `<p class="ac-msl-empty">${search.trim() ? 'No organization students match your search.' : 'No organization students are available to add.'}</p>`}</div>
              <label class="ac-checkrow">${U.checkbox({ checked: mailExisting, attrs: 'data-mail-ex' })}<span>Send course access email</span></label>
              <div><button type="button" class="btn btn-secondary" id="iv-grant">Grant Access</button></div></div>
            ${limit ? U.upgradeBannerHTML("You've reached your plan's student limit. Upgrade to invite more students.") : ''}
            <fieldset class="ac-fs ac-fs-tight"><legend class="ac-legend">Invite new students</legend><p class="ac-desc">Invite new people into your organization and pre-assign them to this course. They will create an account, accept the invite, and get access.</p>
              <div class="ac-field"><label class="ac-label" for="iv-emails">Email Addresses</label><textarea class="ac-textarea" id="iv-emails" rows="4"${limit ? ' disabled' : ''} placeholder="Enter emails separated by commas, newlines, or semicolons\ne.g. alice@example.com, bob@example.com"></textarea></div>
              <label class="ac-checkrow">${U.checkbox({ checked: mailNew, disabled: limit, attrs: 'data-mail-new' })}<span>Send invitation email to imported users</span></label>
              <div><button type="button" class="btn btn-secondary" id="iv-invite"${limit ? ' disabled' : ''}>Invite Students</button></div></fieldset></div>`;

          U.wireSearch(pane.querySelector('.ac-search'), U.debounce((value) => { search = value; paintStudents(pane); const i = pane.querySelector('#iv-search'); i.focus(); i.setSelectionRange(value.length, value.length); }, 250));
          U.wireUpgrade(pane, S, commit, () => { c.close(); rerender(); });
          pane.querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => { const id = b.dataset.s; if (pickedStudents.has(id)) pickedStudents.delete(id); else pickedStudents.add(id); b.setAttribute('aria-checked', String(pickedStudents.has(id))); }));
          const mailEx = pane.querySelector('[data-mail-ex]');
          mailEx.addEventListener('click', () => { mailExisting = !mailExisting; mailEx.setAttribute('aria-checked', String(mailExisting)); });
          const mailN = pane.querySelector('[data-mail-new]');
          mailN.addEventListener('click', () => { mailNew = !mailNew; mailN.setAttribute('aria-checked', String(mailNew)); });

          pane.querySelector('#iv-grant').addEventListener('click', () => {
            if (!pickedStudents.size) { P().toast('Select at least one existing student', { error: true }); return; }

            let assigned = 0;
            pickedStudents.forEach((id) => { if (U.enroll(course, id)) { assigned += 1; const p = S.audience.find((x) => x.id === id); p.courseIds = [...new Set([...(p.courseIds ?? []), course.id])]; } });
            commit();
            say(`Assigned ${assigned} users (0 already had access, ${mailExisting ? assigned : 0} emails sent)`);
            c.close();
            rerender();
          });

          pane.querySelector('#iv-invite')?.addEventListener('click', () => {
            const text = pane.querySelector('#iv-emails').value;
            if (!text.trim()) { P().toast('Please enter at least one email address', { error: true }); return; }

            const emails = [...new Set(text.split(/[,;\n\s]+/).map((e) => e.trim().toLowerCase()).filter(Boolean))].filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
            S.audience = S.audience ?? [];
            let imported = 0;
            let assigned = 0;
            const staff = new Set([(S.email || '').toLowerCase(), ...(S.team ?? []).map((m) => m.email.toLowerCase())]);

            emails.forEach((email) => {
              if (staff.has(email)) return;

              let person = S.audience.find((p) => p.email.toLowerCase() === email);

              if (!person) {
                if (S.audience.length >= U.maxLearners(S)) return;

                person = { id: M.newId('learner'), name: email.split('@')[0], email, role: 'student', status: 'pending', memberStatus: 'ACTIVE', invitedAt: Date.now(), courseIds: [], lastLoginAt: null, lastActiveAt: null };
                S.audience.push(person);
                imported += 1;
              } else assigned += 1;

              if (U.enroll(course, person.id)) person.courseIds = [...new Set([...(person.courseIds ?? []), course.id])];
            });
            commit();
            say(`${imported} new invites, ${assigned} existing students given access, 0 pending invites renewed (${mailNew ? imported : 0} emails sent, simulated)`);
            c.close();
            rerender();
          });
        };

        const paintLink = (pane) => {
          const link = course.inviteLink;
          const url = link ? `${M.orgInfo(S).url}/invite/link/${encodeURIComponent(link.token)}` : '';

          pane.innerHTML = `<div class="ac-stack" style="padding:12px 0 0"><fieldset class="ac-fs ac-fs-tight"><legend class="ac-legend">Invite link</legend><p class="ac-desc">Anyone with this link can join this course as a student. Share it instead of entering emails one by one.</p>
            ${link ? `<div class="ac-fg" style="max-width:none;padding:0"><div class="ac-copyfield"><input class="ac-input" readonly value="${esc(url)}" aria-label="Invite link" /><button type="button" class="btn btn-secondary ac-btn-icon" id="iv-copy" aria-label="Copy invite link">${U.icon('copy', 16)}</button></div>
              <div class="ac-field ac-row">${U.switchHTML({ checked: !link.revoked, attrs: 'id="iv-toggle"', label: 'Link is active' })}<label class="ac-label">Link is active</label></div>
              ${link.revoked ? '<p class="ac-desc" style="color:var(--destructive)">This link is disabled. Nobody can join with it until you turn it back on.</p>' : `<p class="ac-desc">${link.joinCount} people have joined with this link</p>`}</div>` : '<div><button type="button" class="btn btn-secondary" id="iv-gen">Create invite link</button></div>'}
            ${limitReached(ctx) ? U.upgradeBannerHTML("You've reached your plan's student limit. Upgrade to invite more students.") : ''}</fieldset></div>`;
          U.wireUpgrade(pane, S, commit, () => { c.close(); rerender(); });
          pane.querySelector('#iv-gen')?.addEventListener('click', () => { course.inviteLink = { token: `crs_${Math.random().toString(36).slice(2, 12)}`, revoked: false, joinCount: 0 }; commit(); paintLink(pane); });
          pane.querySelector('#iv-copy')?.addEventListener('click', () => { navigator.clipboard?.writeText(url).catch(() => {}); say('Invite link copied'); });
          pane.querySelector('#iv-toggle')?.addEventListener('click', () => { link.revoked = !link.revoked; commit(); say(link.revoked ? 'Invite link disabled' : 'Invite link enabled'); paintLink(pane); });
        };

        paint();
      }
    });

    void ctl;
  }

  const P = () => window.proto;

  window.COURSE_TABS = window.COURSE_TABS || {};
  window.COURSE_TABS.people = {
    nav: 'people',
    title: 'People',
    html: (ctx) => html({ ...ctx, U: window.AccountUI }),
    wire: (ctx) => wire({ ...ctx, U: window.AccountUI })
  };
})();
