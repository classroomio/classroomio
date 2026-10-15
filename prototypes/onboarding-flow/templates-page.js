/*
 * templates-page.js — the Template gallery (routes/(app)/org/[slug]/courses/templates).
 *
 * Mirrors +page.svelte and features/course/components/template-preview-dialog.svelte: back link,
 * title and subtitle, a scope select (All templates / My templates / ClassroomIO), search, the blank
 * card then the template cards (org templates get an Open / Duplicate / Delete menu), skeletons while
 * the list loads, the empty and no-match messages, and the preview dialog that opens from ?preview=.
 * The templates are the real launch templates (templates-data.js); "My templates" are the courses the
 * user saved as templates. The query string carries q, scope and preview as in production.
 */
(function () {
  const U = window.CIOCourseUI;
  const M = window.model;
  const P = window.proto;
  const { icon, esc } = U;

  const SCOPES = [
    ['all', 'All templates'],
    ['org', 'My templates'],
    ['global', 'ClassroomIO']
  ];

  let S = null;
  let commit = () => {};
  let ready = false;
  let wired = false;
  let selectOpen = false;

  const params = new URLSearchParams(window.location.search);
  const ui = { query: params.get('q') ?? '', scope: params.get('scope') ?? 'all', preview: params.get('preview') };

  if (!SCOPES.some(([value]) => value === ui.scope)) ui.scope = 'all';

  function syncUrl(key, value, { replace = true } = {}) {
    const next = new URLSearchParams(window.location.search);

    if (value) next.set(key, value);
    else next.delete(key);

    const text = next.toString();
    const url = `${window.location.pathname}${text ? `?${text}` : ''}`;

    history[replace ? 'replaceState' : 'pushState'](null, '', url);
  }

  function visibleTemplates() {
    const { org, global } = U.cards(S);
    const owned = ui.scope === 'global' ? [] : org;
    const shared = ui.scope === 'org' ? [] : global;
    const query = ui.query.trim().toLowerCase();
    const all = [...owned, ...shared];

    return query ? all.filter((template) => template.title.toLowerCase().includes(query)) : all;
  }

  function cardMenu(template) {
    const id = esc(template.id);

    return `
      <div class="tc-menu">
        <button class="tc-dots" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="Course actions" data-menu-button>${icon('dotsv', 16)}</button>
        <div class="cx-pop" role="menu" hidden>
          <button type="button" role="menuitem" class="cx-mi" data-cx-act="open" data-id="${id}">Open</button>
          <button type="button" role="menuitem" class="cx-mi" data-cx-act="duplicate" data-id="${id}">Duplicate</button>
          <div class="cx-msep" role="separator"></div>
          <button type="button" role="menuitem" class="cx-mi cx-mi-danger" data-cx-act="delete" data-id="${id}">Delete</button>
        </div>
      </div>`;
  }

  function gridHTML() {
    const query = ui.query.trim();
    const templates = visibleTemplates();
    const orgCount = U.orgTemplates(S).length;
    const showBlank = !query;
    const showOrgEmpty = ui.scope === 'org' && !query && orgCount === 0 && ready;
    const showNoResults = ready && templates.length === 0 && (query.length > 0 || ui.scope === 'global');
    const cards = !ready
      ? [0, 1, 2, 3].map(() => U.skeletonCardHTML()).join('')
      : templates.map((template) => U.templateCardHTML(template, { overlay: template.global ? '' : cardMenu(template) })).join('');
    const grid = showBlank || templates.length > 0 || !ready ? `<div class="tg-grid">${showBlank ? U.blankCardHTML() : ''}${cards}</div>` : '';
    const note = showOrgEmpty
      ? '<p class="tg-note">You haven’t made any templates yet. Save any course as a template from its ⋯ menu.</p>'
      : showNoResults
        ? `<p class="tg-note">${query ? `No templates match “${esc(query)}”.` : 'No ClassroomIO templates yet.'}</p>`
        : '';

    return grid + note;
  }

  function selectHTML() {
    const label = SCOPES.find(([value]) => value === ui.scope)[1];

    return `
      <div class="cx-select">
        <button class="cx-select-btn" type="button" id="scope-btn" aria-haspopup="listbox" aria-expanded="${selectOpen}" aria-label="All templates">
          <span>${esc(label)}</span>${icon('chevronsUpDown', 16)}
        </button>
        <div class="cx-selpop" role="listbox" ${selectOpen ? '' : 'hidden'}>
          ${SCOPES.map(
            ([value, text]) =>
              `<button type="button" role="option" class="cx-selopt" aria-selected="${ui.scope === value}" data-scope="${value}"><span>${esc(text)}</span>${ui.scope === value ? `<span class="cx-selck">${icon('check', 16)}</span>` : ''}</button>`
          ).join('')}
        </div>
      </div>`;
  }

  function pageHTML() {
    return `
      <div class="cx-wrap tg-page">
        <div class="tg-head">
          <a class="tg-back" href="${esc(M.R.courses())}">${icon('arrowLeft', 16)}<span>All courses</span></a>
          <h1 class="tg-title">Template gallery</h1>
          <p class="tg-sub">Start a course from one of your templates or one built by ClassroomIO.</p>
        </div>
        <div class="tg-bar">
          ${selectHTML()}
          <label class="cx-search">
            ${icon('search', 16)}
            <input id="tpl-search" type="text" autocomplete="off" placeholder="Find template" value="${esc(ui.query)}" aria-label="Find template" />
            <button class="cx-search-x" type="button" aria-label="Clear search" ${ui.query ? '' : 'hidden'}>${icon('x', 14)}</button>
          </label>
        </div>
        <div id="tpl-grid">${gridHTML()}</div>
      </div>`;
  }

  /* ---------- preview dialog ---------- */
  function outlineHTML(template) {
    return template.outline
      .map(
        (section) => `
        <div class="pv-section">
          ${section.title ? `<p class="pv-stitle">${esc(section.title)}</p>` : ''}
          ${section.lessons.map((lesson) => `<p class="pv-item"><span class="pv-ic">${icon('bookOpen', 14)}</span><span class="pv-it">${esc(lesson.title)}</span></p>`).join('')}
          ${section.exercises
            .map(
              (exercise) =>
                `<p class="pv-item"><span class="pv-ic">${icon('listChecks', 14)}</span><span class="pv-it">${esc(exercise.title)}</span><span class="pv-q">${U.plural(exercise.questionCount, 'question', 'questions')}</span></p>`
            )
            .join('')}
        </div>`
      )
      .join('');
  }

  function openPreview(id) {
    const template = U.findTemplate(S, id);

    if (!template) {
      ui.preview = null;
      syncUrl('preview', null);

      return;
    }

    ui.preview = id;
    syncUrl('preview', id);

    const form = { name: template.title, creating: false };
    const counts = U.countsOf(template);
    const settings = U.settingRows(template.settings);
    const badge = U.typeBadge(template.type);

    U.openDialog({
      label: template.title,
      className: 'cx-dialog-prev',
      onClose: () => {
        if (ui.preview === id) {
          ui.preview = null;
          syncUrl('preview', null);
        }
      },
      render: () => `
        <div class="pv-grid">
          <div class="pv-left">
            ${U.bannerImg(template.bannerImage, 'class="pv-banner"')}
            ${outlineHTML(template)}
          </div>
          <div class="pv-right">
            <div class="pv-scroll">
              <div class="pv-meta">
                ${badge ? U.typeBadgeHTML(template.type) : ''}
                <span class="pv-curated">${template.curated || template.global ? 'Curated template' : 'Your template'}</span>
              </div>
              <h2 class="pv-title">${esc(template.title)}</h2>
              ${template.description ? `<p class="pv-desc">${esc(template.description)}</p>` : ''}
              <p class="pv-counts">${counts.sections} sections · ${counts.lessons} lessons · ${counts.exercises} exercises</p>
              <a class="pv-inspect" href="${esc(M.R.template(template.id))}">Inspect lessons and exercises ${icon('ext', 14)}</a>
              ${
                settings.length
                  ? `<p class="pv-h">Settings</p><ul class="pv-list">${settings.map((row) => `<li>${icon('check', 16)}<span>${esc(row)}</span></li>`).join('')}</ul>`
                  : ''
              }
              ${
                template.highlights.length
                  ? `<p class="pv-h">Shows off</p><ul class="pv-list">${template.highlights
                      .map((highlight) => `<li>${icon('check', 16)}<span><b>${esc(highlight.title)}</b><small>${esc(highlight.description)}</small></span></li>`)
                      .join('')}</ul>`
                  : ''
              }
            </div>
            <div class="pv-foot">
              ${
                form.creating
                  ? `<p class="pv-copying"><span class="cx-spin cx-spin-dark"></span>Copying ${U.plural(counts.sections, 'section', 'sections')}, ${U.plural(counts.lessons, 'lesson', 'lessons')}…</p>`
                  : `
                <div class="cx-field">
                  <label class="cx-label" for="pv-name">Course name</label>
                  <input class="input" id="pv-name" autocomplete="off" value="${esc(form.name)}" />
                </div>
                <div class="pv-actions">
                  <button class="btn btn-outline btn-sm" type="button" data-cancel>Cancel</button>
                  ${template.global ? '' : '<button class="btn btn-secondary btn-sm" type="button" data-open-template-page>Open template</button>'}
                  <button class="btn btn-primary btn-sm" type="button" data-use ${form.name.trim() ? '' : 'disabled'}>Use template</button>
                </div>`
              }
            </div>
          </div>
        </div>`,
      wire: (root, api) => {
        const name = root.querySelector('#pv-name');

        if (!name) return;

        name.addEventListener('input', () => {
          form.name = name.value;
          root.querySelector('[data-use]').disabled = !form.name.trim();
        });
        name.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' && form.name.trim()) root.querySelector('[data-use]').click();
        });
        root.querySelector('[data-cancel]').addEventListener('click', api.close);
        root.querySelector('[data-open-template-page]')?.addEventListener('click', () => {
          window.location.href = M.R.template(template.id);
        });
        root.querySelector('[data-use]').addEventListener('click', () => {
          if (!form.name.trim() || form.creating) return;

          U.useTemplate(S, template, form.name, {
            onBusy: () => {
              form.creating = true;
              api.rerender();
            }
          });
        });
      }
    });
  }

  /* ---------- page behaviour ---------- */
  function refreshGrid() {
    document.querySelector('#tpl-grid').innerHTML = gridHTML();
  }

  function closeMenus() {
    document.querySelectorAll('.tc-menu .cx-pop').forEach((menu) => {
      menu.hidden = true;
    });
    document.querySelectorAll('[data-menu-button]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
  }

  function setSelect(open) {
    selectOpen = open;
    const pop = document.querySelector('.cx-selpop');

    if (pop) pop.hidden = !open;
    document.querySelector('#scope-btn')?.setAttribute('aria-expanded', String(open));
  }

  function duplicate(id) {
    const template = U.findTemplate(S, id);

    if (!template) return;

    if (U.templateAtLimit(S)) {
      P.toast(`Your plan includes ${U.plural(U.templateLimit(S), 'template', 'templates')}`, {
        error: true,
        action: 'Upgrade',
        onAction: () => window.pricing.open({ state: S, item: 'general', commit, onUpgrade: () => window.location.reload() })
      });

      return;
    }

    U.duplicateTemplate(S, template);
    P.toast('Template duplicated');
    refreshGrid();
  }

  function remove(id) {
    U.confirmDelete({
      onDelete: () => {
        U.deleteTemplate(S, id);
        P.toast('Template deleted');
        refreshGrid();
      }
    });
  }

  function wireGrid() {
    document.querySelector('#tpl-grid').addEventListener('click', (event) => {
      const target = event.target.closest('button');

      if (!target) return;

      if (target.matches('[data-menu-button]')) {
        event.stopPropagation();

        const menu = target.parentElement.querySelector('.cx-pop');
        const wasHidden = menu.hidden;

        closeMenus();
        menu.hidden = !wasHidden;
        target.setAttribute('aria-expanded', String(wasHidden));

        return;
      }

      if (target.matches('[data-cx-act]')) {
        event.stopPropagation();
        closeMenus();

        const { cxAct: act, id } = target.dataset;

        if (act === 'open') window.location.href = M.R.template(id);
        if (act === 'duplicate') duplicate(id);
        if (act === 'delete') remove(id);

        return;
      }

      if (target.matches('[data-blank-template]')) window.location.href = M.R.courseCreate;
      if (target.matches('[data-open-template]')) openPreview(target.dataset.openTemplate);
    });
  }

  function wireBar() {
    const search = document.querySelector('#tpl-search');
    const clear = document.querySelector('.cx-search-x');
    let timer = 0;

    const apply = (value) => {
      ui.query = value.trim();
      syncUrl('q', ui.query);
      refreshGrid();
    };

    search.addEventListener('input', () => {
      clear.hidden = !search.value;
      clearTimeout(timer);
      timer = setTimeout(() => apply(search.value), 200);
    });
    clear.addEventListener('click', () => {
      search.value = '';
      clear.hidden = true;
      apply('');
      search.focus();
    });

    document.querySelector('#scope-btn').addEventListener('click', (event) => {
      event.stopPropagation();
      setSelect(!selectOpen);
    });
    document.querySelectorAll('[data-scope]').forEach((option) =>
      option.addEventListener('click', (event) => {
        event.stopPropagation();
        ui.scope = option.dataset.scope;
        syncUrl('scope', ui.scope === 'all' ? '' : ui.scope);
        selectOpen = false;
        document.querySelector('.cx-select').outerHTML = selectHTML();
        wireBar();
        refreshGrid();
      })
    );
  }

  function html(state) {
    S = state;

    return pageHTML();
  }

  function wire(state, helpers) {
    S = state;
    commit = helpers.commit;

    wireBar();
    wireGrid();

    if (wired) return;

    wired = true;
    document.addEventListener('click', () => {
      closeMenus();
      if (selectOpen) setSelect(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;

      closeMenus();
      if (selectOpen) setSelect(false);
    });

    setTimeout(() => {
      ready = true;
      refreshGrid();

      if (ui.preview) openPreview(ui.preview);
    }, 400);
  }

  window.PAGES = window.PAGES || {};
  window.PAGES.courses = { title: 'Template gallery', html, wire };
})();
