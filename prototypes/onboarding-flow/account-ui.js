/*
 * account-ui.js — the small component set shared by the account/organisation settings, Audience, Get
 * Started and course People pages (settings-page.js, org-settings-page.js, audience-page.js, setup-page.js,
 * course-people.js). It stands in for the @cio/ui primitives those production pages compose: Dialog,
 * DropdownMenu, Select, Popover, Pagination, Search, Checkbox, Switch, Badge, UploadImage + ImageCropper,
 * the Page.FloatingBar and the upgrade banner. Styles live in account.css (`ac-` prefix).
 *
 * Everything is markup-in, markup-out plus a few imperative helpers (dialog, menu, select, upload); there
 * is no framework, so a page re-renders by rebuilding its own HTML and calling its wire function again.
 *
 * Shared state fields this set (and those pages) read and write on the one prototype state object `S`:
 *   S.fullname, S.username, S.email, S.locale, S.avatarDataUrl   the signed-in profile
 *   S.logoDataUrl, S.brandName, S.company, S.siteName, S.primary the organisation (`primary` is the single
 *                                                                theme value: a preset hex or a custom hex)
 *   S.faviconDataUrl, S.customDomain {hostname,status,connectedAt}  Custom domain settings tab
 *   S.customization {...}, S.lmsLanguage {locale,enforced}       Customize LMS settings tab
 *   S.team [{id,email,fullname,roleId,verified,invitedAt}]        Team settings tab (roleId 1 admin, 2 tutor)
 *   S.audience [{id,name,email,role,status,invitedAt,courseIds,...}]  invited and active learners
 *   S.steps.profile / S.steps.organization                        Get Started flags
 */
(function () {
  const P = window.proto;
  const esc = P.escapeHtml;

  /* ---------- icons (lucide) ---------- */
  const PATHS = {
    upload:
      '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
    camera:
      '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    pencil:
      '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    'chevron-left': '<path d="m15 18-6-6 6-6"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    minus: '<path d="M5 12h14"/>',
    'badge-check':
      '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>',
    'book-open':
      '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    'user-plus':
      '<path d="M2 21a8 8 0 0 1 13.292-6"/><circle cx="10" cy="8" r="5"/><path d="M19 16v6"/><path d="M22 19h-6"/>',
    users:
      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    globe:
      '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    'file-text':
      '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    'search-x':
      '<path d="m13.5 8.5-5 5"/><path d="m8.5 8.5 5 5"/><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    funnel:
      '<path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"/>',
    'ellipsis-vertical': '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
    ellipsis: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    trash:
      '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
    'arrow-up': '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
    'arrow-down': '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    ext: '<path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/><path d="m21 3-9 9"/><path d="M15 3h6v6"/>',
    clipboard:
      '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
    download:
      '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    sheet:
      '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h2"/><path d="M14 13h2"/><path d="M8 17h2"/><path d="M14 17h2"/>',
    braces:
      '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>',
    code: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    award:
      '<path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/>',
    'circle-check':
      '<path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/>',
    alert:
      '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    rotate: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    shield:
      '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    'arrow-up-right': '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    gem: '<path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>',
    crop: '<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>',
    trash2:
      '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
    updown: '<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>'
  };

  function icon(name, size = 16, cls = '') {
    return `<svg class="ac-ic${cls ? ` ${cls}` : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="${size}" height="${size}" aria-hidden="true">${PATHS[name] ?? ''}</svg>`;
  }

  /* `{name}` placeholders, the way en.json writes them. Callers escape the result when it goes into markup. */
  function fmt(template, params = {}) {
    return String(template).replace(/\{(\w+)\}/g, (match, key) => (key in params ? String(params[key]) : match));
  }

  function plural(count, one, other) {
    return count === 1 ? one : other;
  }

  /* ---------- layers: one host for dialogs, menus and popovers ---------- */
  let layerHost = null;

  function layers() {
    if (layerHost && document.body.contains(layerHost)) return layerHost;

    layerHost = document.createElement('div');
    layerHost.id = 'ac-layers';
    document.body.appendChild(layerHost);

    return layerHost;
  }

  /* ---------- dialog (base/dialog) ---------- */
  const dialogStack = [];

  /**
   * Opens a dialog. `title` is plain text; `description`, `body` and `footer` are trusted markup (escape
   * dynamic values before building them). Returns { el, root, $, $$, close, setFooter }.
   * Escape and the scrim dismiss it unless `dismissible` is false; `onClose` runs once on any close.
   */
  function dialog({ title, description = '', body = '', footer = '', size = 'lg', dismissible = true, onClose, wire }) {
    const scrim = document.createElement('div');
    scrim.className = 'ac-scrim';
    scrim.innerHTML = `
      <div class="ac-dialog ac-d-${size}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        ${dismissible ? `<button type="button" class="ac-dialog-x" data-ac-close aria-label="Close">${icon('x', 16)}</button>` : ''}
        <div class="ac-dialog-h"><h2 class="ac-dialog-t">${esc(title)}</h2>${description ? `<p class="ac-dialog-d">${description}</p>` : ''}</div>
        <div class="ac-dialog-b">${body}</div>
        ${footer ? `<div class="ac-dialog-f">${footer}</div>` : ''}
      </div>`;
    layers().appendChild(scrim);

    const root = scrim.querySelector('.ac-dialog');
    let closed = false;

    const controller = {
      el: scrim,
      root,
      $: (selector) => root.querySelector(selector),
      $$: (selector) => [...root.querySelectorAll(selector)],
      close() {
        if (closed) return;

        closed = true;
        const index = dialogStack.indexOf(controller);
        if (index >= 0) dialogStack.splice(index, 1);
        scrim.remove();
        onClose?.();
      },
      setBody(html) {
        root.querySelector('.ac-dialog-b').innerHTML = html;
      }
    };

    dialogStack.push(controller);

    scrim.addEventListener('mousedown', (event) => {
      if (event.target === scrim && dismissible) controller.close();
    });
    root.querySelector('[data-ac-close]')?.addEventListener('click', () => controller.close());
    wire?.(controller);

    const first = root.querySelector('input:not([type=hidden]), textarea, select');
    (first ?? root.querySelector('button:not([data-ac-close])'))?.focus?.({ preventScroll: true });

    return controller;
  }

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;

    if (openFloating) {
      openFloating.close();
      return;
    }

    const top = dialogStack[dialogStack.length - 1];
    if (top && top.el.querySelector('[data-ac-close]')) top.close();
  });

  /* Resolves true on the confirm button. `danger` makes it the destructive variant. */
  function confirm({ title, body, confirm: confirmLabel, cancel = 'Cancel', danger = false }) {
    return new Promise((resolve) => {
      let answer = false;

      dialog({
        title,
        size: 'md',
        description: body,
        footer: `<button type="button" class="btn btn-outline" data-no>${esc(cancel)}</button><button type="button" class="btn ${danger ? 'btn-destructive' : 'btn-primary'}" data-yes>${esc(confirmLabel)}</button>`,
        onClose: () => resolve(answer),
        wire(ctl) {
          ctl.$('[data-no]').addEventListener('click', () => ctl.close());
          ctl.$('[data-yes]').addEventListener('click', () => {
            answer = true;
            ctl.close();
          });
        }
      });
    });
  }

  /* ---------- floating layers: dropdown menu, popover, select content ---------- */
  let openFloating = null;

  function placeFloating(el, anchor, align, matchWidth) {
    const rect = anchor.getBoundingClientRect();

    if (matchWidth) el.style.minWidth = `${rect.width}px`;

    const width = el.offsetWidth;
    const height = el.offsetHeight;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    let left = align === 'end' ? rect.right - width : rect.left;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));

    let top = rect.bottom + 4;
    if (top + height > window.innerHeight - 8 && rect.top - height - 4 > 8) top = rect.top - height - 4;

    el.style.left = `${left + scrollX}px`;
    el.style.top = `${top + scrollY}px`;
  }

  /**
   * Shows `el` anchored to `anchor` and dismisses it on outside click, Escape, resize or `close()`.
   * Clicking the anchor again toggles it shut. Only one is open at a time.
   */
  function floating(anchor, el, { align = 'start', matchWidth = false, onClose } = {}) {
    const wasOpen = openFloating && openFloating.anchor === anchor;
    openFloating?.close();

    if (wasOpen) return null;

    layers().appendChild(el);
    placeFloating(el, anchor, align, matchWidth);
    anchor.setAttribute('aria-expanded', 'true');

    const onDown = (event) => {
      if (el.contains(event.target) || anchor.contains(event.target)) return;

      handle.close();
    };
    const onResize = () => handle.close();

    const handle = {
      anchor,
      el,
      close() {
        if (openFloating === handle) openFloating = null;

        document.removeEventListener('mousedown', onDown, true);
        window.removeEventListener('resize', onResize);
        anchor.setAttribute('aria-expanded', 'false');
        el.remove();
        onClose?.();
      },
      reposition: () => placeFloating(el, anchor, align, matchWidth)
    };

    document.addEventListener('mousedown', onDown, true);
    window.addEventListener('resize', onResize);
    openFloating = handle;

    return handle;
  }

  /*
   * A dropdown menu. items: { label, icon, onSelect, danger, disabled, check, hint, sep, heading }.
   * `keepOpen` leaves the menu up after a pick (a multi-select); `render()` then rebuilds the rows.
   */
  function menu(anchor, items, { align = 'end', matchWidth = false, keepOpen = false, className = '' } = {}) {
    const el = document.createElement('div');
    el.className = `ac-menu ${className}`.trim();
    el.setAttribute('role', 'menu');

    let current = items;

    const paint = () => {
      el.innerHTML = current
        .map((item, index) => {
          if (item.sep) return '<div class="ac-menu-sep"></div>';
          if (item.heading) return `<div class="ac-menu-label">${esc(item.heading)}</div>`;

          return `<button type="button" role="menuitem" class="ac-menu-item${item.danger ? ' danger' : ''}" data-i="${index}"${item.disabled ? ' disabled' : ''}>${item.icon ? icon(item.icon, 16) : ''}<span class="grow">${item.html ?? esc(item.label)}${item.hint ? `<br><small>${esc(item.hint)}</small>` : ''}</span>${item.check ? icon('check', 16) : ''}</button>`;
        })
        .join('');
    };

    paint();

    const handle = floating(anchor, el, { align, matchWidth });
    if (!handle) return null;

    el.addEventListener('click', (event) => {
      const button = event.target.closest('[data-i]');
      if (!button) return;

      const item = current[Number(button.dataset.i)];
      if (!item || item.disabled) return;

      if (!keepOpen) handle.close();
      item.onSelect?.(item, (next) => {
        current = next;
        paint();
        handle.reposition();
      });
    });

    el.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

      const rows = [...el.querySelectorAll('.ac-menu-item:not([disabled])')];
      const at = rows.indexOf(document.activeElement);
      const next = rows[(at + (event.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length];
      event.preventDefault();
      next?.focus();
    });
    el.querySelector('.ac-menu-item:not([disabled])')?.focus({ preventScroll: true });

    return handle;
  }

  /* A popover with free markup. `wire(el, handle)` runs after it is in the document. */
  function popover(anchor, html, { align = 'end', width = 360, wire, className = '' } = {}) {
    const el = document.createElement('div');
    el.className = `ac-pop ${className}`.trim();
    el.style.width = `min(${width}px, calc(100vw - 16px))`;
    el.innerHTML = html;

    const handle = floating(anchor, el, { align });
    if (handle) wire?.(el, handle);

    return handle;
  }

  /*
   * A select (base/select): the trigger button plus a menu with a check on the picked row. Mounts into
   * `container`. Returns { get, set }.
   */
  function select(container, { value, options, placeholder = '', onChange, disabled = false, small = false, ariaLabel = '', format }) {
    let current = value;

    const label = () => {
      const found = options.find((option) => option.value === current);

      return found ? (format ? format(found) : found.label) : placeholder;
    };

    container.innerHTML = `<button type="button" class="ac-select${small ? ' ac-select-sm' : ''}${found() ? '' : ' ac-ph-empty'}" aria-haspopup="listbox" aria-expanded="false"${ariaLabel ? ` aria-label="${esc(ariaLabel)}"` : ''}${disabled ? ' disabled' : ''}><span></span>${icon('chevron-down', 16)}</button>`;

    const trigger = container.querySelector('button');
    const text = trigger.querySelector('span');

    function found() {
      return options.some((option) => option.value === current);
    }

    const paint = () => {
      text.textContent = label();
      trigger.classList.toggle('ac-ph-empty', !found());
    };

    paint();

    trigger.addEventListener('click', () => {
      menu(
        trigger,
        options.map((option) => ({
          label: option.label,
          check: option.value === current,
          disabled: option.disabled,
          onSelect: () => {
            current = option.value;
            paint();
            onChange?.(option.value);
          }
        })),
        { align: 'start', matchWidth: true }
      );
    });

    return {
      get: () => current,
      set(next) {
        current = next;
        paint();
      }
    };
  }

  /* ---------- small markup builders ---------- */
  function badge(variant, body, extra = '') {
    return `<span class="ac-badge ac-badge-${variant}${extra ? ` ${extra}` : ''}">${body}</span>`;
  }

  function checkbox({ checked = false, indeterminate = false, disabled = false, attrs = '', label = '' }) {
    return `<button type="button" role="checkbox" class="ac-cb" aria-checked="${indeterminate ? 'mixed' : checked}"${disabled ? ' disabled' : ''}${label ? ` aria-label="${esc(label)}"` : ''} ${attrs}>${icon(indeterminate ? 'minus' : 'check', 14)}</button>`;
  }

  function switchHTML({ checked = false, disabled = false, attrs = '', label = '' }) {
    return `<button type="button" role="switch" class="ac-switch" aria-checked="${checked}"${disabled ? ' disabled' : ''}${label ? ` aria-label="${esc(label)}"` : ''} ${attrs}></button>`;
  }

  function searchHTML({ placeholder, value = '', id = 'ac-search', cls = '' }) {
    return `<div class="ac-search ${cls}" data-slot="search">${icon('search', 16, 's')}<input class="ac-input" id="${esc(id)}" type="text" placeholder="${esc(placeholder)}" value="${esc(value)}" autocomplete="off" />${value ? `<button type="button" class="x" data-search-clear aria-label="Clear search">${icon('x', 16)}</button>` : ''}</div>`;
  }

  /* Wires one search box. `onInput(value)` fires on every keystroke; the clear button resets it. */
  function wireSearch(root, onInput) {
    const input = root.querySelector('input');
    if (!input) return;

    const syncClear = () => {
      let clear = root.querySelector('[data-search-clear]');

      if (input.value && !clear) {
        clear = document.createElement('button');
        clear.type = 'button';
        clear.className = 'x';
        clear.setAttribute('data-search-clear', '');
        clear.setAttribute('aria-label', 'Clear search');
        clear.innerHTML = icon('x', 16);
        clear.addEventListener('click', () => {
          input.value = '';
          syncClear();
          onInput('');
          input.focus();
        });
        root.appendChild(clear);
      } else if (!input.value && clear) {
        clear.remove();
      }
    };

    input.addEventListener('input', () => {
      syncClear();
      onInput(input.value);
    });
    root.querySelector('[data-search-clear]')?.addEventListener('click', () => {
      input.value = '';
      syncClear();
      onInput('');
      input.focus();
    });
  }

  function debounce(fn, ms) {
    let timer = 0;
    const wrapped = (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
    wrapped.cancel = () => clearTimeout(timer);
    wrapped.flush = (...args) => {
      clearTimeout(timer);
      fn(...args);
    };

    return wrapped;
  }

  function emptyHTML({ iconName, title, description, actions = '' }) {
    return `<div class="ac-empty"><div class="ac-empty-h">${iconName ? `<span class="ac-empty-m">${icon(iconName, 24)}</span>` : ''}${title ? `<p class="ac-empty-t">${esc(title)}</p>` : ''}${description ? `<p class="ac-empty-d">${esc(description)}</p>` : ''}</div>${actions}</div>`;
  }

  /* Percent ring (custom/percent-ring-progress). */
  function ringHTML(value, large = false) {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const clamped = Math.max(0, Math.min(100, value));

    return `<div class="ac-ring${large ? ' ac-ring-lg' : ''}"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="tr" cx="50" cy="50" r="${radius}" fill="none" stroke-width="8"/><circle class="ar" cx="50" cy="50" r="${radius}" fill="none" stroke-width="8" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference * (1 - clamped / 100)}"/></svg><p>${Math.round(clamped)}%</p></div>`;
  }

  /* base/pagination: Previous, the page numbers with ellipses, Next. */
  function paginationHTML({ count, perPage, page }) {
    const total = Math.max(1, Math.ceil(count / perPage));
    const items = [];

    if (total <= 7) {
      for (let number = 1; number <= total; number += 1) items.push(number);
    } else {
      items.push(1);
      if (page > 3) items.push('…');
      for (let number = Math.max(2, page - 1); number <= Math.min(total - 1, page + 1); number += 1) items.push(number);
      if (page < total - 2) items.push('…');
      items.push(total);
    }

    return `<nav class="ac-pg" aria-label="pagination"><ul>
      <li><button type="button" data-pg="${page - 1}" aria-label="Go to previous page"${page <= 1 ? ' disabled' : ''}>${icon('chevron-left', 16)}<span>Previous</span></button></li>
      ${items
        .map((item) =>
          item === '…'
            ? `<li><span class="el">${icon('ellipsis', 16)}</span></li>`
            : `<li><button type="button" class="num" data-pg="${item}"${item === page ? ' aria-current="page"' : ''} aria-label="Page ${item}">${item}</button></li>`
        )
        .join('')}
      <li><button type="button" data-pg="${page + 1}" aria-label="Go to next page"${page >= total ? ' disabled' : ''}><span>Next</span>${icon('chevron-right', 16)}</button></li>
    </ul></nav>`;
  }

  function wirePagination(root, onPage) {
    root.querySelectorAll('[data-pg]').forEach((button) =>
      button.addEventListener('click', () => {
        if (button.disabled) return;

        onPage(Number(button.dataset.pg));
      })
    );
  }

  /* ---------- plan limits and the upgrade banner ---------- */
  function maxLearners(state) {
    const plan = P.planById(state.plan);
    const parsed = Number(String(plan.learners).replace(/,/g, ''));

    return Number.isFinite(parsed) ? parsed : Infinity;
  }

  function isFreePlan(state) {
    return (state.plan || 'FREE') === 'FREE';
  }

  /* features/ui/upgrade-banner: an outlined Item in the primary colour that opens the pricing card. */
  function upgradeBannerHTML(text, cls = '') {
    return `<button type="button" class="ac-upgrade ${cls}" data-ac-upgrade><span class="ac-item-media">${icon('gem', 20)}</span><b>${esc(text)}</b>${icon('chevron-right', 16)}</button>`;
  }

  function wireUpgrade(root, state, commit, onUpgrade) {
    root.querySelectorAll('[data-ac-upgrade]').forEach((button) =>
      button.addEventListener('click', () => {
        if (!window.pricing) {
          P.toast('Plans and pricing open here in the real product.');
          return;
        }

        window.pricing.open({ state, item: 'general', commit, onUpgrade });
      })
    );
  }

  /* ---------- floating action bar (Page.SettingsActions / selection bar) ---------- */
  function settingsBarHTML({ status, discard, save }) {
    return `<div class="ac-fbar" id="ac-savebar" hidden><div class="ac-fbar-in" role="status"><div class="ac-fbar-s"><span class="ac-fbar-badge" aria-hidden="true">!</span><p>${esc(status)}</p></div><div class="ac-fbar-a"><button type="button" class="btn btn-secondary" data-testid="page-settings-discard" id="ac-discard">${esc(discard)}</button><button type="button" class="btn btn-primary" data-testid="page-settings-save" id="ac-save">${esc(save)}</button></div></div></div>`;
  }

  /* ---------- upload image + cropper (features/ui/upload-image, custom/image-cropper) ---------- */
  const ACCEPT_EXT = ['jpg', 'jpeg', 'png', 'webp'];
  const ACCEPT_TYPE = ['image/jpeg', 'image/png', 'image/webp'];

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('image'));
      image.src = src;
    });
  }

  /* The crop dialog: drag to pan, slider to zoom, Cancel / Crop. Resolves a data URL, or null on cancel. */
  function cropDialog(src, { round }) {
    return new Promise(async (resolve) => {
      let image;

      try {
        image = await loadImage(src);
      } catch {
        resolve(null);

        return;
      }

      const STAGE = 320;
      const minScale = STAGE / Math.min(image.naturalWidth, image.naturalHeight);
      let scale = minScale;
      let offsetX = (STAGE - image.naturalWidth * scale) / 2;
      let offsetY = (STAGE - image.naturalHeight * scale) / 2;
      let result = null;

      const clamp = () => {
        offsetX = Math.min(0, Math.max(STAGE - image.naturalWidth * scale, offsetX));
        offsetY = Math.min(0, Math.max(STAGE - image.naturalHeight * scale, offsetY));
      };

      dialog({
        title: 'Crop image',
        size: 'lg',
        body: `<div class="ac-cropper">
          <div class="ac-crop-stage" id="ac-crop-stage"><img id="ac-crop-img" alt="" src="${esc(src)}" draggable="false" /><span class="ac-crop-mask${round ? ' round' : ''}"></span></div>
          <label class="ac-crop-zoom"><span>Zoom</span><input id="ac-crop-zoom" type="range" min="1" max="3" step="0.01" value="1" aria-label="Zoom" /></label>
        </div>`,
        footer: `<button type="button" class="btn btn-outline btn-sm" id="ac-crop-cancel">${icon('trash2', 15)}<span>Cancel</span></button><button type="button" class="btn btn-primary btn-sm" id="ac-crop-ok">${icon('crop', 15)}<span>Crop</span></button>`,
        onClose: () => resolve(result),
        wire(ctl) {
          const stage = ctl.$('#ac-crop-stage');
          const img = ctl.$('#ac-crop-img');
          const zoom = ctl.$('#ac-crop-zoom');

          const paint = () => {
            clamp();
            img.style.width = `${image.naturalWidth * scale}px`;
            img.style.height = `${image.naturalHeight * scale}px`;
            img.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
          };

          paint();

          let drag = null;

          stage.addEventListener('pointerdown', (event) => {
            drag = { x: event.clientX, y: event.clientY, ox: offsetX, oy: offsetY };
            stage.setPointerCapture(event.pointerId);
            stage.style.cursor = 'grabbing';
          });
          stage.addEventListener('pointermove', (event) => {
            if (!drag) return;

            offsetX = drag.ox + (event.clientX - drag.x);
            offsetY = drag.oy + (event.clientY - drag.y);
            paint();
          });
          stage.addEventListener('pointerup', () => {
            drag = null;
            stage.style.cursor = '';
          });
          zoom.addEventListener('input', () => {
            const next = minScale * Number(zoom.value);
            const centerX = (STAGE / 2 - offsetX) / scale;
            const centerY = (STAGE / 2 - offsetY) / scale;
            scale = next;
            offsetX = STAGE / 2 - centerX * scale;
            offsetY = STAGE / 2 - centerY * scale;
            paint();
          });

          ctl.$('#ac-crop-cancel').addEventListener('click', () => ctl.close());
          ctl.$('#ac-crop-ok').addEventListener('click', () => {
            const size = 512;
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const context = canvas.getContext('2d');
            const ratio = size / STAGE;
            context.drawImage(
              image,
              offsetX * ratio,
              offsetY * ratio,
              image.naturalWidth * scale * ratio,
              image.naturalHeight * scale * ratio
            );
            const webp = canvas.toDataURL('image/webp', 0.9);
            result = webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/png');
            ctl.close();
          });
        }
      });
    });
  }

  /*
   * features/ui/upload-image.svelte: the avatar preview (hover shows a pencil), the camera icon and
   * "Upload Image", the size and type hint and the validation error. A picked file opens the crop dialog;
   * Crop sets the preview and calls onChange(dataUrl). The saved image is only replaced by the page on save.
   */
  function uploadImage(container, { src = '', round = true, size = 'sm', maxMb = 2, row = false, initials = '', onChange }) {
    let preview = src;
    let error = '';

    const paint = () => {
      container.innerHTML = `
        <section class="ac-upload${row ? ' row' : ''}">
          <div class="ac-upload-trigger-wrap" style="display:flex;flex-direction:column;align-items:center">
            <button type="button" class="ac-upload-trigger" id="ac-up-trigger">
              <div class="ac-upload-av ${size}${round ? '' : ' rect'}">${preview ? `<img src="${esc(preview)}" alt="" />` : `<div class="ph">${esc(initials)}</div>`}<div class="hv">${icon('pencil', 16)}</div></div>
              <span class="ac-upload-lbl">${icon('camera', 16)}<span>Upload Image</span></span>
            </button>
          </div>
          <div style="display:flex;flex-direction:column;align-items:center">
            <p class="ac-upload-hint">Max file size: ${maxMb}MB<br />Accepted: jpeg, jpg, png, webp</p>
            ${error ? `<p class="ac-upload-err">${esc(error)}</p>` : ''}
          </div>
          <input type="file" id="ac-up-file" accept=".jpg, .jpeg, .png, .webp" hidden />
        </section>`;

      const input = container.querySelector('#ac-up-file');
      container.querySelector('#ac-up-trigger').addEventListener('click', () => input.click());
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        input.value = '';
        if (!file) return;

        const extension = file.name.split('.').pop().toLowerCase();

        if (file.size > maxMb * 1024 * 1024) {
          error = `File size exceeds the maximum limit: File size exceeds ${maxMb}MB limit`;
          paint();

          return;
        }

        if (!ACCEPT_TYPE.includes(file.type) || !ACCEPT_EXT.includes(extension)) {
          error = `File size exceeds the maximum limit: Unsupported file type: ${file.type || extension}`;
          paint();

          return;
        }

        error = '';
        const cropped = await cropDialog(await readFile(file), { round });

        if (cropped) {
          preview = cropped;
          onChange?.(cropped);
        }

        paint();
      });
    };

    paint();

    return {
      set(next) {
        preview = next;
        error = '';
        paint();
      },
      get: () => preview
    };
  }


  /*
   * features/ui/unsaved-changes.svelte: leaving with unsaved edits asks first (window.confirm in
   * production too). Covers link clicks and a reload or tab close.
   */
  let guardFn = () => false;
  let guardInstalled = false;
  let allowLeave = false;

  function guardUnsaved(isDirty) {
    guardFn = isDirty;

    if (guardInstalled) return;

    guardInstalled = true;
    window.addEventListener('beforeunload', (event) => {
      if (allowLeave || !guardFn()) return;

      event.preventDefault();
      event.returnValue = '';
    });
    document.addEventListener(
      'click',
      (event) => {
        const link = event.target.closest?.('a[href]');
        if (!link || link.target === '_blank' || !guardFn()) return;

        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

        if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
          allowLeave = true;

          return;
        }

        event.preventDefault();
        event.stopPropagation();
      },
      true
    );
  }

  function timeAgo(timestamp) {
    if (!timestamp) return null;

    const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    const units = [
      [31536000, 'year'],
      [2592000, 'month'],
      [86400, 'day'],
      [3600, 'hour'],
      [60, 'minute']
    ];

    for (const [length, name] of units) {
      if (seconds >= length) {
        const value = Math.floor(seconds / length);

        return `${value} ${name}${value === 1 ? '' : 's'} ago`;
      }
    }

    return 'a few seconds ago';
  }

  function shortDate(timestamp) {
    if (!timestamp) return '—';

    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function download(contents, filename, type) {
    const url = URL.createObjectURL(new Blob([contents], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }


  /* course.people = [{personId, role: 'student'|'tutor', enrolledAt}]; personId is an S.audience id (student)
   * or an S.team id (tutor). One place keeps the Audience page and the course People tab in step. */
  function enroll(course, personId, role = 'student') {
    if (!Array.isArray(course.people)) course.people = [];
    if (course.people.some((entry) => entry.personId === personId && entry.role === role)) return false;

    course.people.push({ personId, role, enrolledAt: Date.now() });

    return true;
  }

  function unenroll(course, personId) {
    course.people = (course.people ?? []).filter((entry) => entry.personId !== personId);
  }

  window.AccountUI = {
    enroll,
    unenroll,
    icon,
    fmt,
    plural,
    dialog,
    confirm,
    menu,
    popover,
    select,
    badge,
    checkbox,
    switchHTML,
    searchHTML,
    wireSearch,
    debounce,
    emptyHTML,
    ringHTML,
    paginationHTML,
    wirePagination,
    maxLearners,
    isFreePlan,
    upgradeBannerHTML,
    wireUpgrade,
    settingsBarHTML,
    uploadImage,
    guardUnsaved,
    timeAgo,
    shortDate,
    download,
    esc
  };
})();
