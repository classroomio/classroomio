/*
 * course-settings.js — the course Settings tab, mirroring routes/(app)/courses/[id]/settings and
 * lib/features/course/pages/settings.svelte (cards: General, Course type, Session email reminders,
 * Content, Public course callout, Access, Template, Delete), with the Page.SettingsActions save bar,
 * UnsavedChanges navigation guard and AttentionHighlight (`?highlight=publish`, `course-type`,
 * `course-completion-deadline`, `course-comments`).
 *
 * It also defines `window.CourseKit` (switch, select, dialog, image picker, rich text editor,
 * icons) that course-landing.js reuses.
 *
 * Fields this page reads and writes on a course in `S.courses` (all optional, defaults in brackets):
 *   title, desc, type ('SELF_PACED' | 'LIVE_CLASS' | 'COMPLIANCE' | 'PUBLIC'), published, visibility,
 *   slug, bannerImage ['' shows the stock image], welcomeEmail (HTML) [''], tagIds [[]],
 *   certRules { deadline: ISO | null, threshold: 100, requiredExerciseId: null, exerciseMinScorePercent: null }
 *     (not `certificate`: the recommended courses already use that name as a boolean),
 *   liveReminderOffsets [[1440, 60] minutes, LIVE_CLASS only], lessonTabsOrder [[3, 1, 2, 4]],
 *   contentGrouping [true], progression ['free' | 'sequential'], comments [true],
 *   callout { title, description, buttonLabel, buttonUrl, animation: 'waves' | 'dotted' | 'none' } | null (PUBLIC only),
 *   selfEnroll [true], lessonDownload [false], markdownExport [false].
 * Read only: a lesson with published === false (or isUnlocked === false) is a locked item; exercise questions
 * ({id, title, type | questionType | questionTypeId}, also under exerciseSections) feed the Public conversion check;
 * course.templateId / templateTitle / templatePulledAt describe the template section; course.landing.{cost, paymentLink}
 * feeds the paid-course validation. Org tags live in `S.tagGroups` [{id, name, description, tags: [{id, name, color, description}]}].
 */
(function () {
  'use strict';

  const P = window.proto;
  const M = window.model;
  const esc = P.escapeHtml;

  /* ============================ kit ============================ */

  const ICONS = {
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    rotate: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    refresh:
      '<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/>',
    out: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    grip: '<circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    left: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
    trash:
      '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H8c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    save: '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    upload:
      '<path d="M12 13v8"/><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="m8 17 4-4 4 4"/>',
    alert:
      '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    gem: '<path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
    bold: '<path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"/>',
    italic: '<line x1="19" x2="10" y1="4" y2="4"/><line x1="14" x2="5" y1="20" y2="20"/><line x1="15" x2="9" y1="4" y2="20"/>',
    underline: '<path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" x2="20" y1="20" y2="20"/>',
    strike: '<path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" x2="20" y1="12" y2="12"/>',
    list: '<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>',
    olist:
      '<path d="M11 5h10"/><path d="M11 12h10"/><path d="M11 19h10"/><path d="M4 4h1v5"/><path d="M4 9h2"/><path d="M6.5 20H3.4c0-1 2.6-1.925 2.6-3.5a1.5 1.5 0 0 0-2.6-1.02"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>',
    redo: '<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>',
    quote:
      '<path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/>',
    code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>'
  };

  function ic(name, size = 16, cls = '') {
    return `<svg class="ck-ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="${size}" height="${size}" aria-hidden="true">${ICONS[name] ?? ''}</svg>`;
  }

  function sw(id, on, attrs = '') {
    return `<button type="button" role="switch" id="${id}" class="ck-sw" aria-checked="${on ? 'true' : 'false'}" ${attrs}><i></i></button>`;
  }

  function btn(label, { variant = 'default', size = '', act = '', id = '', cls = '', attrs = '', icon = '' } = {}) {
    return `<button type="button" class="ck-btn ${variant} ${size} ${cls}" ${id ? `id="${id}"` : ''} ${act ? `data-act="${act}"` : ''} ${attrs}>${icon ? ic(icon) : ''}${label ? esc(label) : ''}</button>`;
  }

  function iconBtn(icon, { tip = '', act = '', attrs = '', variant = 'secondary', size = 'icon', below = false } = {}) {
    return `<button type="button" class="ck-btn ${variant} ${size} ${tip ? 'ck-tip' : ''} ${below ? 'below' : ''}" ${tip ? `data-tip="${esc(tip)}" aria-label="${esc(tip)}"` : ''} ${act ? `data-act="${act}"` : ''} ${attrs}>${ic(icon)}</button>`;
  }

  /* ---- select (base/select): a trigger and a listbox ---- */
  function selectHtml({ id, value, options, width = '', ariaLabel = '' }) {
    const current = options.find((option) => option.value === value);

    return `<div class="ck-sel" data-sel="${esc(id)}" ${width ? `style="width:${width}"` : ''}>
      <button type="button" class="ck-sel-t" aria-haspopup="listbox" aria-expanded="false" ${ariaLabel ? `aria-label="${esc(ariaLabel)}"` : ''}><span>${esc(current ? current.label : '')}</span>${ic('down')}</button>
      <ul class="ck-sel-l" role="listbox" hidden>
        ${options
          .map(
            (option) =>
              `<li role="option" data-v="${esc(option.value)}" aria-selected="${option.value === value}"><span>${esc(option.label)}</span>${option.value === value ? ic('check', 14) : ''}</li>`
          )
          .join('')}
      </ul>
    </div>`;
  }

  /* One delegated listener per root; onPick(selectId, value). Safe to call once per root. */
  function wireSelects(root, onPick) {
    const closeAll = (except) =>
      root.querySelectorAll('.ck-sel-l:not([hidden])').forEach((list) => {
        if (list === except) return;

        list.hidden = true;
        list.parentElement.querySelector('.ck-sel-t')?.setAttribute('aria-expanded', 'false');
      });

    root.addEventListener('click', (event) => {
      const trigger = event.target.closest('.ck-sel-t');
      const option = event.target.closest('.ck-sel-l li');

      if (trigger && root.contains(trigger)) {
        const list = trigger.parentElement.querySelector('.ck-sel-l');

        closeAll(list);
        list.hidden = !list.hidden;
        trigger.setAttribute('aria-expanded', String(!list.hidden));
        if (!list.hidden) list.querySelector('[aria-selected=true]')?.scrollIntoView({ block: 'nearest' });
        event.stopPropagation();
        return;
      }

      if (option && root.contains(option)) {
        const wrap = option.closest('.ck-sel');

        closeAll();
        onPick(wrap.dataset.sel, option.dataset.v);
        event.stopPropagation();
      }
    });

    root.addEventListener('keydown', (event) => {
      const trigger = event.target.closest?.('.ck-sel-t');

      if (!trigger) return;

      const list = trigger.parentElement.querySelector('.ck-sel-l');
      const items = [...list.querySelectorAll('li')];

      if (event.key === 'Escape' && !list.hidden) {
        list.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
        event.stopPropagation();
        return;
      }

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (list.hidden) {
          trigger.click();
          return;
        }

        const index = items.findIndex((item) => item.classList.contains('on'));
        const next = items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length];

        items.forEach((item) => item.classList.remove('on'));
        next.classList.add('on');
        next.scrollIntoView({ block: 'nearest' });
        return;
      }

      if (event.key === 'Enter' && !list.hidden) {
        const active = items.find((item) => item.classList.contains('on'));

        if (active) {
          event.preventDefault();
          active.click();
        }
      }
    });

    document.addEventListener('click', (event) => {
      if (!root.isConnected) return;
      if (event.target.closest?.('.ck-sel')) return;

      closeAll();
    });
  }

  /* ---- dialog (base/dialog) ---- */
  function openDialog({ host, title, description = '', body = '', footer = '', size = '', z = 80, label = '' }) {
    const target = host ?? document.getElementById('modal-host') ?? document.body;
    const scrim = document.createElement('div');

    scrim.className = 'scrim';
    scrim.style.zIndex = String(z);
    scrim.innerHTML = `<div class="ck-dlg ${size}" role="dialog" aria-modal="true" aria-label="${esc(label || title)}">
      <header><h2>${esc(title)}</h2>${description ? `<p>${esc(description)}</p>` : ''}</header>
      ${body}
      ${footer ? `<footer>${footer}</footer>` : ''}
    </div>`;
    target.appendChild(scrim);

    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        close();
      }
    };
    const close = () => {
      document.removeEventListener('keydown', onKey, true);
      scrim.remove();
    };

    scrim.addEventListener('mousedown', (event) => {
      if (event.target === scrim) close();
    });
    document.addEventListener('keydown', onKey, true);

    return { el: scrim, close, $: (selector) => scrim.querySelector(selector) };
  }

  /* ---- images: no upload service, so a picked file becomes a small data URL ---- */
  function fileToDataUrl(file, { aspect = 0, maxWidth = 1200, type = 'image/jpeg', quality = 0.82 } = {}) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onerror = () => reject(new Error('read'));
      reader.onload = () => {
        const image = new Image();

        image.onerror = () => reject(new Error('decode'));
        image.onload = () => {
          let sx = 0;
          let sy = 0;
          let sw = image.naturalWidth;
          let sh = image.naturalHeight;

          if (aspect) {
            const current = sw / sh;

            if (current > aspect) {
              const next = Math.round(sh * aspect);

              sx = Math.round((sw - next) / 2);
              sw = next;
            } else {
              const next = Math.round(sw / aspect);

              sy = Math.round((sh - next) / 2);
              sh = next;
            }
          }

          const scale = Math.min(1, maxWidth / sw);
          const canvas = document.createElement('canvas');

          canvas.width = Math.max(1, Math.round(sw * scale));
          canvas.height = Math.max(1, Math.round(sh * scale));
          canvas.getContext('2d').drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL(type, quality));
        };
        image.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }

  const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  /* ImageUploadModal (packages/ui/src/custom/editor): "Insert image" with Upload and Link tabs.
   * Unsplash search needs the network, so that tab is left out; the crop dialog is a centre crop. */
  function imageDialog({ host, z = 80, aspect = 0, maxBytes = 0, maxWidth = 1200, onPick, say }) {
    let tab = 'upload';
    const dialog = openDialog({
      host,
      z,
      title: 'Insert image',
      size: '',
      body: `<div class="ck-tabs" role="tablist">
          <button type="button" role="tab" data-tab="upload" aria-selected="true">Upload</button>
          <button type="button" role="tab" data-tab="link" aria-selected="false">Link</button>
        </div>
        <div data-pane="upload">
          <button type="button" class="ck-drop" data-drop>
            ${ic('upload', 28)}
            <p>Drag and drop an image here, or click to select</p>
            <small>Accepted: jpeg, jpg, png, webp</small>
          </button>
          <input type="file" accept=".jpg,.jpeg,.png,.webp" hidden data-file />
        </div>
        <div data-pane="link" hidden>
          <div class="ck-link-row">
            <input class="input" data-url placeholder="https://example.com/image.png" aria-label="Image URL" />
            <p class="cst-error" data-url-err hidden></p>
            ${btn('Insert', { act: 'insert' })}
          </div>
        </div>`
    });
    const drop = dialog.$('[data-drop]');
    const input = dialog.$('[data-file]');

    const pick = async (file) => {
      if (!file) return;

      if (!IMAGE_TYPES.includes(file.type)) {
        say?.(`Unsupported image: ${file.type || 'unknown'}`, true);
        return;
      }

      if (maxBytes && file.size > maxBytes) {
        say?.('File Size must not be greater than 500kb', true);
        return;
      }

      drop.innerHTML = `${ic('refresh', 24, 'ck-spin')}<p>Uploading…</p>`;

      try {
        const url = await fileToDataUrl(file, { aspect, maxWidth });

        dialog.close();
        onPick(url);
      } catch {
        say?.('Failed to upload image. Please try again.', true);
        dialog.close();
      }
    };

    dialog.el.querySelectorAll('[data-tab]').forEach((button) =>
      button.addEventListener('click', () => {
        tab = button.dataset.tab;
        dialog.el.querySelectorAll('[data-tab]').forEach((item) => item.setAttribute('aria-selected', String(item === button)));
        dialog.el.querySelectorAll('[data-pane]').forEach((pane) => {
          pane.hidden = pane.dataset.pane !== tab;
        });
        if (tab === 'link') dialog.$('[data-url]').focus();
      })
    );
    drop.addEventListener('click', () => input.click());
    drop.addEventListener('dragover', (event) => {
      event.preventDefault();
      drop.classList.add('over');
    });
    drop.addEventListener('dragleave', () => drop.classList.remove('over'));
    drop.addEventListener('drop', (event) => {
      event.preventDefault();
      drop.classList.remove('over');
      pick(event.dataTransfer.files[0]);
    });
    input.addEventListener('change', () => pick(input.files[0]));

    const insert = () => {
      const value = dialog.$('[data-url]').value.trim();
      const error = dialog.$('[data-url-err]');

      if (!/^https?:\/\/\S+$/i.test(value)) {
        error.hidden = false;
        error.textContent = 'Enter a valid image URL that starts with http:// or https://';
        return;
      }

      dialog.close();
      onPick(value);
    };

    dialog.$('[data-act=insert]').addEventListener('click', insert);
    dialog.$('[data-url]').addEventListener('keydown', (event) => {
      if (event.key === 'Enter') insert();
    });

    return dialog;
  }

  /* ---- rich text (features/ui/text-editor, TipTap): the formatting a course page needs ---- */
  const RT_TOOLS = [
    ['undo', 'undo', 'Undo'],
    ['redo', 'redo', 'Redo'],
    null,
    ['h1', 'H1', 'Heading 1'],
    ['h2', 'H2', 'Heading 2'],
    ['h3', 'H3', 'Heading 3'],
    null,
    ['bold', 'bold', 'Bold'],
    ['italic', 'italic', 'Italic'],
    ['underline', 'underline', 'Underline'],
    ['strikeThrough', 'strike', 'Strikethrough'],
    null,
    ['insertUnorderedList', 'list', 'Bullet list'],
    ['insertOrderedList', 'olist', 'Ordered list'],
    ['blockquote', 'quote', 'Quote'],
    ['link', 'link', 'Link']
  ];

  function richHtml({ id, value = '', placeholder = '', minHeight = 120, maxHeight = 260 }) {
    return `<div class="ck-rt" data-rt="${esc(id)}">
      <div class="ck-rt-bar" role="toolbar" aria-label="Text formatting">
        ${RT_TOOLS.map((tool) =>
          tool
            ? `<button type="button" data-cmd="${tool[0]}" title="${esc(tool[2])}" aria-label="${esc(tool[2])}">${ICONS[tool[1]] ? ic(tool[1]) : esc(tool[1])}</button>`
            : '<i></i>'
        ).join('')}
      </div>
      <div class="ck-rt-body ${value ? '' : 'empty'}" contenteditable="true" role="textbox" aria-multiline="true" aria-label="${esc(placeholder || 'Text')}" data-placeholder="${esc(placeholder)}" style="min-height:${minHeight}px;max-height:${maxHeight}px">${value}</div>
    </div>`;
  }

  function cleanRich(html) {
    const text = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

    return text || /<(img|iframe|video)\b/i.test(html) ? html : '';
  }

  function wireRich(root, onChange, hostForDialogs) {
    root.querySelectorAll('.ck-rt').forEach((editor) => {
      const body = editor.querySelector('.ck-rt-body');
      let saved = null;

      const emit = () => {
        const html = cleanRich(body.innerHTML);

        body.classList.toggle('empty', !html);
        onChange(editor.dataset.rt, html);
      };

      editor.querySelector('.ck-rt-bar').addEventListener('mousedown', (event) => event.preventDefault());
      editor.querySelector('.ck-rt-bar').addEventListener('click', (event) => {
        const button = event.target.closest('[data-cmd]');

        if (!button) return;

        body.focus();
        const cmd = button.dataset.cmd;

        if (cmd === 'link') {
          const selection = window.getSelection();

          saved = selection.rangeCount ? selection.getRangeAt(0).cloneRange() : null;

          const dialog = openDialog({
            host: hostForDialogs,
            z: 400,
            title: 'Link',
            size: 'ck-dlg-xs',
            body: '<input class="input" data-link placeholder="https://example.com" aria-label="Link URL" />',
            footer: `${btn('Cancel', { variant: 'outline', act: 'cancel' })}${btn('Apply', { act: 'apply' })}`
          });
          const apply = () => {
            const href = dialog.$('[data-link]').value.trim();

            dialog.close();
            body.focus();
            if (saved) {
              selection.removeAllRanges();
              selection.addRange(saved);
            }
            if (/^(https?:|mailto:|tel:|\/|#)/i.test(href)) document.execCommand('createLink', false, href);
            emit();
          };

          dialog.$('[data-act=cancel]').addEventListener('click', dialog.close);
          dialog.$('[data-act=apply]').addEventListener('click', apply);
          dialog.$('[data-link]').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') apply();
          });
          dialog.$('[data-link]').focus();
          return;
        }

        if (/^h[1-3]$/.test(cmd)) document.execCommand('formatBlock', false, cmd);
        else if (cmd === 'blockquote') document.execCommand('formatBlock', false, 'blockquote');
        else document.execCommand(cmd, false, null);

        emit();
      });
      body.addEventListener('input', emit);
      body.addEventListener('paste', (event) => {
        event.preventDefault();
        document.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
      });
      body.addEventListener('focus', () => document.execCommand('defaultParagraphSeparator', false, 'p'), { once: true });
    });
  }

  /* NumberField (custom/number-field): typing applies live when valid, blur/Enter clamps. */
  function wireNumber(input, { min, max, integer = true, onValue }) {
    let baseline = input.value;

    const parse = (text) => {
      if (text.trim() === '') return undefined;

      const number = Number(text);

      if (!Number.isFinite(number)) return undefined;
      if (integer && !Number.isInteger(number)) return undefined;
      if (min !== undefined && number < min) return undefined;
      if (max !== undefined && number > max) return undefined;

      return number;
    };
    const commit = () => {
      const number = parse(input.value);

      if (number !== undefined) {
        baseline = String(number);
        return;
      }

      const raw = Number(input.value);

      if (input.value.trim() !== '' && Number.isFinite(raw)) {
        let next = integer ? Math.round(raw) : raw;

        if (min !== undefined) next = Math.max(min, next);
        if (max !== undefined) next = Math.min(max, next);
        input.value = String(next);
        baseline = String(next);
        onValue(next);
        return;
      }

      input.value = baseline;
      const restored = parse(baseline);

      if (restored !== undefined) onValue(restored);
    };

    input.addEventListener('focus', () => {
      baseline = input.value;
    });
    input.addEventListener('input', () => {
      const number = parse(input.value);

      if (number !== undefined) onValue(number);
    });
    input.addEventListener('change', commit);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') commit();
    });
  }

  window.CourseKit = {
    ic,
    ICONS,
    sw,
    btn,
    iconBtn,
    selectHtml,
    wireSelects,
    openDialog,
    imageDialog,
    fileToDataUrl,
    richHtml,
    wireRich,
    wireNumber,
    cleanRich
  };

  /* ============================ settings page ============================ */

  const DEFAULT_COVER = 'course-banner.jpg';
  const TAB_NAMES = { 3: 'Video', 1: 'Note', 2: 'Slide', 4: 'Docs' };
  const DEFAULT_TABS = [3, 1, 2, 4];
  const REMINDER_MIN = 15;
  const REMINDER_MAX = 7 * 24 * 60;
  const REMINDER_MAX_COUNT = 5;
  const REMINDER_PRESETS = [1440, 360, 60, 30];
  const UNIT_MINUTES = { days: 1440, hours: 60, minutes: 1 };
  const TYPES = [
    { value: 'SELF_PACED', label: 'Self paced' },
    { value: 'LIVE_CLASS', label: 'Live class' },
    { value: 'COMPLIANCE', label: 'Compliance' },
    { value: 'PUBLIC', label: 'Public' }
  ];
  const TAG_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E', '#14B8A6', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899'];
  const MANUAL_QUESTION_TYPES = {
    TEXTAREA: 'Paragraph',
    SHORT_ANSWER: 'Short answer',
    FILE_UPLOAD: 'File upload',
    LINK: 'Links',
    VIDEO_RECORDING: 'Video recording',
    THUMBS: 'Thumbs up/down'
  };
  const UNSAVED_MESSAGE = 'You have unsaved changes. Are you sure you want to leave?';

  const st = { id: null, draft: null, base: null, errors: {}, conv: null, logs: null, tpl: null };

  let rowSeed = 0;

  function newRowId() {
    rowSeed += 1;

    return `rem-${Date.now().toString(36)}-${rowSeed}`;
  }

  function splitOffset(minutes) {
    const unit = ['days', 'hours', 'minutes'].find((candidate) => minutes % UNIT_MINUTES[candidate] === 0) ?? 'minutes';

    return { amount: minutes / UNIT_MINUTES[unit], unit };
  }

  function reminderRow(minutes) {
    return { id: newRowId(), ...splitOffset(minutes) };
  }

  function rowMinutes(row) {
    return row.amount * UNIT_MINUTES[row.unit];
  }

  function rowErrors(rows) {
    const errors = {};
    const seen = new Set();

    rows.forEach((row) => {
      const minutes = rowMinutes(row);

      if (!Number.isInteger(row.amount) || row.amount < 1) errors[row.id] = 'amount';
      else if (minutes < REMINDER_MIN) errors[row.id] = 'min';
      else if (minutes > REMINDER_MAX) errors[row.id] = 'max';
      else if (seen.has(minutes)) errors[row.id] = 'duplicate';

      seen.add(minutes);
    });

    return errors;
  }

  const REMINDER_ERRORS = {
    amount: 'Enter a whole number of 1 or more.',
    min: 'Reminders must be at least 15 minutes before the session.',
    max: 'Reminders can be at most 7 days before the session.',
    duplicate: 'You already have a reminder at this time.'
  };

  function durationText(minutes) {
    const { amount, unit } = splitOffset(minutes);
    const word = unit === 'days' ? 'day' : unit === 'hours' ? 'hour' : 'minute';

    return `${amount} ${word}${amount === 1 ? '' : 's'}`;
  }

  function lessonsOf(course) {
    return M.lessonsOf(course);
  }

  function exercisesOf(course) {
    return lessonsOf(course).filter((lesson) => lesson.kind === 'exercise');
  }

  /* The lesson editor locks with `published: false`; production's flag is isUnlocked, so both count. */
  function lockedItems(course) {
    return lessonsOf(course).filter((lesson) => lesson.published === false || lesson.isUnlocked === false);
  }

  const QUESTION_TYPE_BY_ID = {
    1: 'RADIO',
    2: 'CHECKBOX',
    3: 'TEXTAREA',
    4: 'TRUE_FALSE',
    5: 'SHORT_ANSWER',
    6: 'NUMERIC',
    7: 'FILL_BLANK',
    8: 'FILE_UPLOAD',
    9: 'ORDERING',
    10: 'LINK',
    11: 'WORD_BANK',
    12: 'STAR',
    13: 'VIDEO_RECORDING',
    14: 'THUMBS',
    15: 'MATCHING',
    16: 'HOTSPOT'
  };

  function questionKey(question) {
    const raw = question.questionType ?? question.type;
    const key = typeof raw === 'object' && raw ? raw.key : raw;

    return String(key ?? QUESTION_TYPE_BY_ID[question.questionTypeId] ?? '').toUpperCase();
  }

  function manualOffenders(course) {
    const offenders = [];

    exercisesOf(course).forEach((exercise) => {
      const questions = [
        ...(exercise.questions ?? []),
        ...(exercise.exerciseSections ?? exercise.sections ?? []).flatMap((section) => section.questions ?? [])
      ];

      questions.forEach((question, index) => {
        const key = questionKey(question);

        if (MANUAL_QUESTION_TYPES[key] && !question.deletedAt) {
          offenders.push({
            exerciseId: exercise.id,
            exerciseTitle: exercise.title,
            questionId: question.id ?? `q${index + 1}`,
            questionTitle: String(question.title ?? '').replace(/<[^>]*>/g, ''),
            typeKey: key
          });
        }
      });
    });

    return offenders;
  }

  function normalizeCallout(value) {
    if (!value || typeof value !== 'object') return null;
    if (['title', 'description', 'buttonLabel', 'buttonUrl'].some((key) => typeof value[key] !== 'string')) return null;

    return {
      title: value.title,
      description: value.description,
      buttonLabel: value.buttonLabel,
      buttonUrl: value.buttonUrl,
      animation: ['dotted', 'none', 'waves'].includes(value.animation) ? value.animation : 'waves'
    };
  }

  function fromCourse(course) {
    const cert = course.certRules ?? {};
    const requiredExerciseId = cert.requiredExerciseId ?? null;
    const offsets = Array.isArray(course.liveReminderOffsets) ? course.liveReminderOffsets : [1440, 60];

    return {
      bannerImage: course.bannerImage || '',
      title: course.title ?? '',
      description: course.desc ?? '',
      welcomeEmail: course.welcomeEmail ?? '',
      tagIds: [...new Set(course.tagIds ?? [])],
      type: course.type || 'SELF_PACED',
      deadline: cert.deadline ?? null,
      threshold: typeof cert.threshold === 'number' ? cert.threshold : 100,
      requiredExerciseId,
      minScore:
        typeof cert.exerciseMinScorePercent === 'number' ? cert.exerciseMinScorePercent : requiredExerciseId ? 100 : null,
      reminders: offsets.map(reminderRow),
      tabs: [...(course.lessonTabsOrder ?? DEFAULT_TABS)],
      grouping: course.contentGrouping ?? true,
      progression: course.progression ?? 'free',
      comments: course.comments ?? true,
      callout: normalizeCallout(course.callout),
      selfEnroll: course.selfEnroll ?? true,
      published: Boolean(course.published),
      lessonDownload: Boolean(course.lessonDownload),
      markdown: Boolean(course.markdownExport)
    };
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isDirty() {
    return st.draft && JSON.stringify(st.draft) !== JSON.stringify(st.base);
  }

  function courseLink(ctx) {
    return `${M.orgInfo(ctx.S).url}/course/${ctx.course.slug}`;
  }

  function newSlug(title) {
    return `${P.slugify(title) || 'course'}-${Date.now().toString(36)}`;
  }

  /* ---- markup ---- */

  function fieldLabel(hash, text, { right = '', req = false } = {}) {
    return `<label class="cst-label ${right ? 'between' : ''}"><a href="#${hash}">${esc(text)}</a>${req ? '<span class="req">*</span>' : ''}${right}</label>`;
  }

  function card({ id, hash = id, title, description = '', body, attn = '' }) {
    const inner = `<section ${id ? `id="${id}"` : ''} class="cst-card">
      <header>
        <h2>${hash ? `<a href="#${hash}">${esc(title)}</a>` : `<span>${esc(title)}</span>`}</h2>
        ${description ? `<p>${description}</p>` : ''}
      </header>
      <div class="cst-card-body">${body}</div>
    </section>`;

    return attn ? `<div class="cst-attn" data-attn="${attn}" id="${attn}">${inner}</div>` : inner;
  }

  function sepHtml() {
    return '<div class="cst-sep" role="separator"></div>';
  }

  function switchField({ id, hash, title, desc, on, attn = '' }) {
    const field = `<div class="cst-field h" ${hash ? `id="${hash}"` : ''}>
      <div class="cst-content">
        <label class="cst-label" for="${id}"><a href="#${hash ?? id}">${esc(title)}</a></label>
        <p class="cst-desc">${desc}</p>
      </div>
      ${sw(id, on)}
    </div>`;

    return attn ? `<div class="cst-attn" data-attn="${attn}">${field}</div>` : field;
  }

  function tagChips(ctx) {
    const groups = ctx.S.tagGroups ?? [];
    const all = groups.flatMap((group) => group.tags.map((tag) => ({ ...tag, category: group.name })));
    const selected = st.draft.tagIds.map((id) => all.find((tag) => tag.id === id)).filter(Boolean);
    const hasAny = all.length > 0;

    if (!selected.length) {
      return `<p>${hasAny ? 'No tags selected' : 'No tags created yet'}</p>`;
    }

    return selected
      .map(
        (tag) =>
          `<span class="ck-badge"><span class="ck-badge-dot" style="background:${esc(tag.color)}" aria-hidden="true"></span><span>${esc(tag.name)}</span>
          <button type="button" class="ck-btn ghost icon-xs" data-act="tag-remove" data-id="${esc(tag.id)}" aria-label="Remove ${esc(tag.name)}" style="width:20px;height:20px">${ic('x', 12)}</button></span>`
      )
      .join('');
  }

  function tagListHtml(ctx) {
    const groups = ctx.S.tagGroups ?? [];
    const query = (st.tagQuery ?? '').trim().toLowerCase();
    const filtered = groups
      .map((group) => ({ ...group, tags: query ? group.tags.filter((tag) => tag.name.toLowerCase().includes(query)) : group.tags }))
      .filter((group) => group.tags.length > 0);
    const hasNoTags = groups.length > 0 && groups.every((group) => group.tags.length === 0);
    let content;

    if (!groups.length) content = '<p class="cst-pop-note sm">No tags available yet</p>';
    else if (hasNoTags) content = '<p class="cst-pop-note">No tags created yet</p>';
    else if (query && !filtered.length) content = '<p class="cst-pop-note">No tags found</p>';
    else {
      content = filtered
        .map(
          (group) => `<p class="cst-pop-gh">${esc(group.name)}</p>
          <div class="cst-pop-tags">${group.tags
            .map(
              (tag) =>
                `<button type="button" class="ck-btn ${st.draft.tagIds.includes(tag.id) ? 'secondary' : 'outline'} xs" data-act="tag-toggle" data-id="${esc(tag.id)}">${ic('plus', 14)}<span>${esc(tag.name)}</span></button>`
            )
            .join('')}</div>`
        )
        .join('');
    }

    return content;
  }

  function tagPopover(ctx) {
    return `<div class="cst-pop-wrap">
      <button type="button" class="ck-btn secondary icon" data-act="tag-pop" aria-label="Create Tag" aria-expanded="${Boolean(st.tagOpen)}">${ic('plus')}</button>
      <div class="cst-pop" id="cst-tag-pop" ${st.tagOpen ? '' : 'hidden'}>
        <div class="cst-pop-body">
          <input class="input" id="cst-tag-q" placeholder="Search tags..." value="${esc(st.tagQuery ?? '')}" aria-label="Search tags" />
          <div class="cst-pop-scroll" id="cst-tag-list">${tagListHtml(ctx)}</div>
        </div>
        <div class="cst-pop-foot">${btn('Create Tag', { act: 'tag-create' })}</div>
      </div>
    </div>`;
  }

  function generalCard(ctx) {
    const { course } = ctx;
    const d = st.draft;
    const hasSlug = Boolean(course.slug);

    const cover = `<div class="cst-field" id="cover-image">
      <div class="cst-cover">
        <img alt="Cover Image" src="${esc(d.bannerImage || DEFAULT_COVER)}" id="cst-cover-img" />
        <div>
          <label class="cst-label"><a href="#cover-image">Cover Image</a></label>
          <p class="cst-desc">This optional image will show up on your welcome page. If you include one, it should be at least 280 x 200</p>
          <div class="cst-row">${btn('Replace', { variant: 'secondary', act: 'cover-replace' })}${btn('Remove', { variant: 'outline', act: 'cover-remove' })}</div>
        </div>
      </div>
    </div>`;

    const title = `<div class="cst-field" id="course-title">
      <label class="cst-label" for="cst-title">Course title<span class="req">*</span></label>
      <input class="input" id="cst-title" data-k="title" placeholder="Write the course title here" value="${esc(d.title)}" ${st.errors.title ? 'aria-invalid="true"' : ''} autocomplete="off" />
      <p class="cst-error" data-err="title" ${st.errors.title ? '' : 'hidden'} role="alert">${esc(st.errors.title ?? '')}</p>
    </div>`;

    const description = `<div class="cst-field" id="course-description">
      <label class="cst-label" for="cst-desc">Course Description<span class="req">*</span></label>
      <textarea class="textarea" id="cst-desc" data-k="description" rows="3" placeholder="Write your course description here" ${st.errors.description ? 'aria-invalid="true"' : ''}>${esc(d.description)}</textarea>
      <p class="cst-error" data-err="description" ${st.errors.description ? '' : 'hidden'} role="alert">${esc(st.errors.description ?? '')}</p>
    </div>`;

    const link = `<div class="cst-field" id="share">
      ${fieldLabel(
        'share',
        'Course Link',
        hasSlug
          ? {
              right: `<span class="cst-row" style="gap:4px">${iconBtn('rotate', { tip: 'Generate new link', act: 'link-gen', variant: 'secondary', size: 'icon' })}${iconBtn('out', { tip: 'Open link in new tab', act: 'link-open', variant: 'secondary', size: 'icon' })}</span>`
            }
          : {}
      )}
      ${
        hasSlug
          ? `<div class="cst-linkbox"><p id="cst-link">${esc(courseLink(ctx))}</p>${iconBtn('copy', { tip: 'Copy link', act: 'link-copy', variant: 'secondary', size: 'icon' })}</div>`
          : `<p class="cst-desc">Setup landing page to get course link</p>
             <a class="ck-btn secondary fit" href="${esc(M.R.course(course.id, 'landingpage'))}">Set up landing page</a>`
      }
    </div>`;

    const tags = `<div class="cst-field" id="tags">
      ${fieldLabel('tags', 'Tags')}
      <p class="cst-desc">Assign tags so students can discover this course with filters.</p>
      <div class="cst-tags"><span class="cst-tags" id="cst-tag-chips" style="display:contents">${tagChips(ctx)}</span>${tagPopover(ctx)}</div>
    </div>`;

    const welcome = `<div class="cst-field" id="welcome-email">
      ${fieldLabel('welcome-email', 'Welcome email')}
      <p class="cst-desc">Customize the email students receive after they enroll. Add a personal note, instructions, or a live session link.</p>
      ${richHtml({ id: 'welcomeEmail', value: d.welcomeEmail, placeholder: 'Write the welcome message students get when they enroll…', minHeight: 120, maxHeight: 200 })}
    </div>`;

    return card({
      id: 'general',
      title: 'General',
      body: `<div class="cst-group">${cover}${title}${description}${link}${tags}${sepHtml()}${welcome}</div>`
    });
  }

  function offendersCard(ctx) {
    const offenders = st.conv?.offenders ?? [];
    const groups = [];

    offenders.forEach((offender) => {
      let group = groups.find((item) => item.exerciseId === offender.exerciseId);

      if (!group) {
        group = { exerciseId: offender.exerciseId, title: offender.exerciseTitle, questions: [] };
        groups.push(group);
      }
      group.questions.push(offender);
    });

    const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;
    const locked = isDirty();

    return `<div class="cst-conv" role="alert">
      <div class="cst-conv-h">
        ${ic('alert', 20)}
        <div style="flex:1;min-width:0">
          <div class="cst-conv-top">
            <h4>Public courses require only auto-gradable questions.</h4>
            <div class="cst-conv-badges"><span class="d">${plural(offenders.length, 'question')}</span><span>${plural(groups.length, 'exercise')}</span></div>
          </div>
          <p>Exercises in a public course are graded automatically in the browser which is why we only support auto-gradable questions. Remove or replace the following questions before converting this course to Public:</p>
          ${locked ? '<p class="warn">Save your unsaved changes before navigating to fix questions.</p>' : ''}
        </div>
      </div>
      ${groups
        .map(
          (group) => `<div class="cst-conv-grp">
          <div class="cst-conv-gh">
            <span style="display:flex;align-items:center;gap:8px;min-width:0"><b title="${esc(group.title)}">${esc(group.title)}</b><span class="ck-badge" style="padding:0 8px;font-size:11px">${plural(group.questions.length, 'question')}</span></span>
            <button type="button" class="ck-btn outline xs" data-act="conv-fix" data-ex="${esc(group.exerciseId)}" data-q="${esc(group.questions[0].questionId)}" ${locked ? 'disabled' : ''}>Fix in exercise ${ic('right', 14)}</button>
          </div>
          ${group.questions
            .map(
              (question, index) => `<button type="button" class="cst-conv-q" data-act="conv-fix" data-ex="${esc(group.exerciseId)}" data-q="${esc(question.questionId)}" ${locked ? 'disabled' : ''}>
              <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(question.questionTitle || `Question ${index + 1}`)}</span>
              <span class="t">${esc(MANUAL_QUESTION_TYPES[question.typeKey])}</span></button>`
            )
            .join('')}
        </div>`
        )
        .join('')}
      <div class="cst-conv-foot">${btn('Cancel conversion', { variant: 'ghost', size: 'sm', act: 'conv-cancel' })}</div>
    </div>`;
  }

  function typeCard(ctx) {
    const d = st.draft;
    const exercises = exercisesOf(ctx.course);
    const showConversion = st.conv && st.conv.courseId === ctx.course.id && st.conv.offenders.length > 0;
    const deadlineLocal = (() => {
      if (!d.deadline) return '';

      const date = new Date(d.deadline);

      if (Number.isNaN(date.getTime())) return '';

      const pad = (n) => String(n).padStart(2, '0');

      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    })();

    const body = `<div class="cst-group">
      <div class="cst-field">
        ${selectHtml({ id: 'type', value: d.type, options: TYPES, ariaLabel: 'Course type' })}
      </div>
      ${showConversion ? offendersCard(ctx) : st.errors.type ? `<p class="cst-error" style="margin-top:8px">${esc(st.errors.type)}</p>` : ''}

      <div class="cst-attn" data-attn="course-completion-deadline" id="course-completion-deadline">
        <div class="cst-field">
          <label class="cst-label" for="course-completion-deadline-input"><a href="#course-completion-deadline">Course Completion Deadline</a></label>
          <input class="input" id="course-completion-deadline-input" type="datetime-local" value="${esc(deadlineLocal)}" ${st.errors.deadline ? 'aria-invalid="true"' : ''} />
          <p class="cst-desc">Students must meet the completion percentage before this datetime (local time). Leave empty for no deadline.</p>
          ${st.errors.deadline ? `<p class="cst-error" role="alert">${esc(st.errors.deadline)}</p>` : ''}
        </div>
      </div>

      <div class="cst-field" id="completion-threshold">
        <label class="cst-label" for="course-completion-threshold"><a href="#completion-threshold">Minimum completion (%)</a></label>
        <input class="input" id="course-completion-threshold" type="number" min="0" max="100" step="1" value="${d.threshold}" />
        <p class="cst-desc">Combined lesson and exercise progress required to earn the certificate (0–100). Default is 100%.</p>
      </div>

      <div class="cst-field" id="final-exercise">
        <label class="cst-label"><a href="#final-exercise">Final exercise (optional)</a></label>
        ${selectHtml({
          id: 'finalExercise',
          value: d.requiredExerciseId ?? 'none',
          options: [{ value: 'none', label: 'none' }, ...exercises.map((item) => ({ value: item.id, label: item.title }))],
          ariaLabel: 'Final exercise'
        })}
        <p class="cst-desc">When set, students must reach at least the minimum score on this exercise (best attempt counts) in addition to the completion percentage above.</p>
        <p class="cst-desc">Students will be allowed unlimited attempts on the selected exercise.</p>
      </div>

      ${
        d.requiredExerciseId
          ? `<div class="cst-field" id="min-exercise-score">
        <label class="cst-label" for="course-min-exercise-score"><a href="#min-exercise-score">Minimum score on final exercise (%)</a></label>
        <input class="input" id="course-min-exercise-score" type="number" min="0" max="100" step="1" value="${d.minScore ?? 100}" />
        <p class="cst-desc">Score is a percentage of the total points possible on that exercise (0–100).</p>
      </div>`
          : ''
      }
    </div>`;

    return card({
      id: undefined,
      hash: 'course-type',
      title: 'Course type',
      description: `Update the course type for a more personalized experience. <a href="https://classroomio.com/help/create-and-deliver/course-types" target="_blank" rel="noopener noreferrer">Learn more</a>`,
      body,
      attn: 'course-type'
    });
  }

  function reminderRows() {
    const rows = st.draft.reminders;
    const errors = rowErrors(rows);
    const configured = new Set(rows.map(rowMinutes));
    const canAdd = rows.length < REMINDER_MAX_COUNT;

    return `<div class="cst-rem" id="cst-rem">
      ${rows.length === 0 ? `<p class="cst-desc" id="cst-rem-empty">No reminders. Students won't get emails before live sessions.</p>` : ''}
      ${rows
        .map(
          (row) => `<div class="cst-field" style="gap:0" data-row="${row.id}" ${errors[row.id] ? 'data-invalid="true"' : ''}>
          <div class="cst-rem-row">
            <input class="input amt" type="number" min="1" step="1" value="${row.amount}" data-rem-amt="${row.id}" aria-label="Amount" placeholder="1" />
            ${selectHtml({
              id: `unit:${row.id}`,
              value: row.unit,
              options: [
                { value: 'days', label: 'Days' },
                { value: 'hours', label: 'Hours' },
                { value: 'minutes', label: 'Minutes' }
              ],
              width: '128px',
              ariaLabel: 'Unit'
            })}
            <span class="cst-rem-note" data-rem-note="${row.id}">${errors[row.id] ? '' : `${esc(durationText(rowMinutes(row)))} before each session`}</span>
            <button type="button" class="ck-btn secondary icon ck-tip" data-tip="Remove reminder" aria-label="Remove reminder" data-act="rem-remove" data-id="${row.id}">${ic('x')}</button>
          </div>
          <p class="cst-rem-err" data-rem-err="${row.id}" ${errors[row.id] ? '' : 'hidden'} role="alert">${errors[row.id] ? esc(REMINDER_ERRORS[errors[row.id]]) : ''}</p>
        </div>`
        )
        .join('')}
      <div class="cst-row wrap">
        <button type="button" class="ck-btn outline sm" data-act="rem-add" ${canAdd ? '' : 'disabled'}>${ic('plus')}Add reminder</button>
        <span class="cst-desc" style="font-size:14px">Quick add:</span>
        ${REMINDER_PRESETS.map(
          (minutes) =>
            `<button type="button" class="ck-btn secondary cst-pill" data-act="rem-preset" data-min="${minutes}" ${!canAdd || configured.has(minutes) ? 'disabled' : ''}>${esc(durationText(minutes))}</button>`
        ).join('')}
      </div>
      <p class="cst-desc" id="cst-rem-max" ${canAdd ? 'hidden' : ''}>You can add up to ${REMINDER_MAX_COUNT} reminders.</p>
    </div>`;
  }

  function remindersCard() {
    return card({
      id: 'live-session-reminders',
      title: 'Session email reminders',
      description: 'Choose when enrolled students get an email with the join link before each live session.',
      body: `<div class="cst-group">
        ${reminderRows()}
        ${sepHtml()}
        <div class="cst-field h">
          <div class="cst-content">
            <label class="cst-label">Delivery log</label>
            <p class="cst-desc">Reminder emails for sessions in the last 30 days and upcoming sessions.</p>
          </div>
          ${btn('View logs', { variant: 'secondary', size: 'sm', act: 'logs-open', })}
        </div>
      </div>`
    });
  }

  function contentCard() {
    const d = st.draft;

    return card({
      id: 'content',
      title: 'Content',
      body: `<div class="cst-group">
        <div class="cst-field" id="lesson-tabs">
          ${fieldLabel('lesson-tabs', 'Order Lessons Tab')}
          <p class="cst-desc">Drag and drop the labels to re-order your material tabs</p>
          <section class="cst-reorder" id="cst-tabs" aria-label="Order Lessons Tab">
            ${d.tabs.map((id) => `<div class="cst-tab" data-tab="${id}" tabindex="0" role="button" aria-label="${esc(TAB_NAMES[id])}. Use arrow keys to move.">${ic('grip')}${esc(TAB_NAMES[id])}</div>`).join('')}
          </section>
        </div>
        ${sepHtml()}
        ${switchField({ id: 'content-grouping', title: 'Content grouping', desc: 'Group lessons and exercises by section in the content list.', on: d.grouping })}
        ${sepHtml()}
        <div class="cst-field" id="progression-mode">
          ${fieldLabel('progression-mode', 'Student progression')}
          <p class="cst-desc">Control whether students can access all unlocked content or must complete items in order. Video watch completion only tracks uploaded videos.</p>
          <div class="cst-radios" role="radiogroup" aria-label="Student progression">
            <label class="cst-radio" for="progression-free"><input type="radio" name="progression" id="progression-free" value="free" ${d.progression === 'free' ? 'checked' : ''} />Free — unlocked content is accessible</label>
            <label class="cst-radio" for="progression-sequential"><input type="radio" name="progression" id="progression-sequential" value="sequential" ${d.progression === 'sequential' ? 'checked' : ''} />Sequential — complete prior items to unlock next</label>
          </div>
        </div>
        ${sepHtml()}
        <div class="cst-attn" data-attn="course-comments" id="course-comments">
          <div class="cst-field h">
            <div class="cst-content">
              <label class="cst-label" for="course-comments-sw"><a href="#course-comments">Lesson comments</a></label>
              <p class="cst-desc">Allow students to view and add comments across lessons in this course. Individual lessons can still disable comments.</p>
            </div>
            ${sw('course-comments-sw', d.comments)}
          </div>
        </div>
      </div>`
    });
  }

  function calloutCard() {
    const callout = st.draft.callout;

    if (st.draft.type !== 'PUBLIC' || !callout) return '';

    const animations = [
      ['waves', 'Waves'],
      ['dotted', 'Dotted'],
      ['none', 'None']
    ];

    return card({
      id: 'callout',
      title: 'Public course callout',
      description: 'Shown at the bottom of each lesson and in place of locked items. Use it to drive students to your site or a paid course.',
      body: `<div class="cst-group">
        <div class="cst-field"><label class="cst-label" for="cst-co-title">Title</label>
          <input class="input" id="cst-co-title" data-co="title" placeholder="Want to go deeper on this?" value="${esc(callout.title)}" /></div>
        <div class="cst-field"><label class="cst-label" for="cst-co-desc">Description</label>
          <textarea class="textarea" id="cst-co-desc" data-co="description" rows="3" placeholder="Join the full cohort to ship a production-grade project in 4 weeks.">${esc(callout.description)}</textarea></div>
        <div class="cst-field"><label class="cst-label" for="cst-co-label">Button label</label>
          <input class="input" id="cst-co-label" data-co="buttonLabel" placeholder="Read more on my site" value="${esc(callout.buttonLabel)}" /></div>
        <div class="cst-field"><label class="cst-label" for="cst-co-url">Button URL</label>
          <input class="input" id="cst-co-url" type="url" data-co="buttonUrl" placeholder="https://example.com" value="${esc(callout.buttonUrl)}" /></div>
        <div class="cst-field">
          <label class="cst-label">Background animation</label>
          <p class="cst-desc">Choose the motion that plays behind the callout card.</p>
          <div class="cst-radios tight" role="radiogroup" aria-label="Background animation">
            ${animations
              .map(
                ([value, label]) =>
                  `<label class="cst-radio" for="callout-animation-${value}"><input type="radio" name="callout-animation" id="callout-animation-${value}" value="${value}" ${callout.animation === value ? 'checked' : ''} />${label}</label>`
              )
              .join('')}
          </div>
        </div>
        <div class="cst-field">${btn('Clear callout', { variant: 'outline', size: 'sm', act: 'callout-clear', cls: 'fit' })}</div>
      </div>`
    });
  }

  function accessCard(ctx) {
    const { course, S } = ctx;
    const d = st.draft;
    const isTemplate = Boolean(course.isTemplate);
    const free = (S.plan ?? 'FREE') === 'FREE';
    const locked = lockedItems(course);
    const live = d.type === 'LIVE_CLASS';
    const parts = 'When off, students can only join through an invite link or by being added from {people}.'.split('{people}');
    const upgrade = (text) =>
      `<button type="button" class="cst-upgrade" data-act="upgrade">${ic('gem', 20)}<span>${esc(text)}</span>${ic('right')}</button>`;
    const parts2 = [];

    if (!isTemplate) {
      parts2.push(`<fieldset id="self-enrollment" style="border:0;padding:0;margin:0;min-width:0;scroll-margin-top:96px">
        <div class="cst-field h">
          <div class="cst-content">
            <label class="cst-label" for="allow-self-enrollment"><a href="#self-enrollment">Students can enroll themselves</a></label>
            <p class="cst-desc">${esc(parts[0])}<a href="${esc(M.R.course(course.id, 'people'))}" data-testid="course-settings-people-link">People</a>${esc(parts[1] ?? '')}</p>
          </div>
          ${sw('allow-self-enrollment', d.selfEnroll)}
        </div>
      </fieldset>`);
      parts2.push(sepHtml());
      parts2.push(`<fieldset id="publish" style="border:0;padding:0;margin:0;min-width:0;display:flex;flex-direction:column;gap:24px;scroll-margin-top:96px">
        <div class="cst-attn" data-attn="publish">
          <div class="cst-field h">
            <div class="cst-content">
              <label class="cst-label" for="is-published"><a href="#publish">Publish Course</a></label>
              <p class="cst-desc">This determines if your course displays on your landing page</p>
            </div>
            ${sw('is-published', d.published)}
          </div>
        </div>
        ${
          d.published && locked.length
            ? `<div class="cst-alert ${live ? 'information' : 'warning'}" role="alert">
            ${ic('lock')}
            <div class="at">${locked.length} course item(s) are locked</div>
            <div class="ad">${live ? "Locked lessons and exercises stay hidden from students until you unlock them — useful if you release content week by week." : "Enrolled students won't be able to take locked lessons or exercises until you unlock them."}
              ${btn('Unlock all', { variant: 'outline', size: 'sm', act: 'unlock-all', cls: 'fit' })}</div>
          </div>`
            : ''
        }
      </fieldset>`);
      parts2.push(sepHtml());
    }

    parts2.push(
      free
        ? upgrade('Upgrade to download lessons')
        : `<div class="cst-field h" id="lesson-download">
        <div class="cst-content">
          <label class="cst-label" for="lesson-download-sw"><a href="#lesson-download">Lesson download</a></label>
          <p class="cst-desc">Let registered students download lessons as PDF.</p>
        </div>
        ${sw('lesson-download-sw', d.lessonDownload)}
      </div>`
    );
    parts2.push(sepHtml());
    parts2.push(
      free
        ? upgrade('Upgrade to download course')
        : `<div class="cst-field h" id="course-download">
        <div class="cst-content">
          <label class="cst-label"><a href="#course-download">Course download</a></label>
          <p class="cst-desc">Download a copy of this course.</p>
        </div>
        ${btn('Download', { variant: 'outline', act: 'download' })}
      </div>`
    );
    parts2.push(sepHtml());
    parts2.push(`<div class="cst-field h" id="markdown-export">
        <div class="cst-content">
          <label class="cst-label" for="allow-markdown-export"><a href="#markdown-export">Allow learners to copy lesson pages as Markdown</a></label>
          <p class="cst-desc">When enabled, public lesson pages show a Copy Page button that exports the lesson content (excluding videos) as Markdown. This also publishes a public Markdown URL for each unlocked lesson.</p>
        </div>
        ${sw('allow-markdown-export', d.markdown)}
      </div>`);

    return card({ id: 'access', title: 'Access', body: `<div class="cst-group">${parts2.join('')}</div>` });
  }

  function templateCard(ctx) {
    const { course } = ctx;

    if (!course.templateId || course.isTemplate) return '';

    const title = course.templateTitle ?? 'Template';
    const pulled = new Date(course.templatePulledAt ?? course.createdAt ?? Date.now()).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    return card({
      id: 'template',
      title: 'Template',
      description: 'This course was created from a template. Pull its changes when you want them — nothing changes on its own.',
      body: `<div class="cst-tpl">
        <img src="${esc(course.bannerImage || DEFAULT_COVER)}" alt="" />
        <div style="min-width:0;flex:1">
          <a href="${esc(M.R.template(course.templateId))}">${esc(title)}</a>
          <p>Last pulled ${esc(pulled)}</p>
        </div>
      </div>
      <p class="cst-uptodate">Up to date with the template.</p>`
    });
  }

  function deleteCard() {
    return card({
      id: 'delete',
      title: 'Delete Course',
      description: 'Delete this course,this action cannot be undone',
      body: btn('Delete Course', { variant: 'destructive', act: 'delete-open', cls: 'fit' })
    });
  }

  function bodyHtml(ctx) {
    return [generalCard(ctx), typeCard(ctx), st.draft.type === 'LIVE_CLASS' ? remindersCard() : '', contentCard(), calloutCard(), accessCard(ctx), templateCard(ctx), deleteCard()].join('');
  }

  function pageHtml(ctx) {
    return `<div class="cst" id="cst-root" data-page="course-settings">
      <div class="cst-head">
        <h1>Settings</h1>
        <button type="button" class="ck-btn secondary icon ck-tip below" id="cst-refresh" data-tip="Refresh" aria-label="Refresh">${ic('refresh')}</button>
      </div>
      <div class="cst-body" id="cst-body">${bodyHtml(ctx)}</div>
      <div class="cst-barhost" id="cst-barhost" hidden></div>
    </div>`;
  }

  /* ---- behaviour ---- */

  let ctxRef = null;
  let guardsInstalled = false;
  let leaving = false;
  let highlightDone = false;

  function say(message, error = false) {
    P.toast(message, { error });
  }

  function paintBar() {
    const host = document.getElementById('cst-barhost');

    if (!host) return;

    const dirty = Boolean(isDirty());

    if (dirty && host.hidden) {
      host.hidden = false;
      host.innerHTML = `<div class="cst-bar" data-testid="page-floating-bar" role="region" aria-label="Unsaved changes">
        <div class="cst-bar-s"><i aria-hidden="true">!</i><p>Unsaved changes</p></div>
        <div class="cst-bar-a">
          <button type="button" class="ck-btn secondary xs discard" data-act="discard" data-testid="page-settings-discard">Discard</button>
          <button type="button" class="ck-btn default xs" data-act="save" data-testid="page-settings-save">Save changes</button>
        </div>
      </div>`;
    } else if (!dirty && !host.hidden) {
      host.hidden = true;
      host.innerHTML = '';
    }
  }

  function repaint() {
    const body = document.getElementById('cst-body');

    if (!body || !ctxRef) return;

    const scroll = window.scrollY;
    const scroller = document.querySelector('.rd-main');
    const innerScroll = scroller ? scroller.scrollTop : 0;

    body.innerHTML = bodyHtml(ctxRef);
    wireBody();
    paintBar();
    window.scrollTo(0, scroll);
    if (scroller) scroller.scrollTop = innerScroll;
  }

  function clearFieldError(key) {
    st.errors[key] = '';

    const input = document.querySelector(`[data-k="${key}"]`);
    const error = document.querySelector(`[data-err="${key}"]`);

    input?.removeAttribute('aria-invalid');
    if (error) {
      error.hidden = true;
      error.textContent = '';
    }
  }

  function paintReminderNotes() {
    const rows = st.draft.reminders;
    const errors = rowErrors(rows);
    const configured = new Set(rows.map(rowMinutes));
    const canAdd = rows.length < REMINDER_MAX_COUNT;

    rows.forEach((row) => {
      const note = document.querySelector(`[data-rem-note="${row.id}"]`);
      const error = document.querySelector(`[data-rem-err="${row.id}"]`);
      const wrap = document.querySelector(`[data-row="${row.id}"]`);

      if (note) note.textContent = errors[row.id] ? '' : `${durationText(rowMinutes(row))} before each session`;
      if (error) {
        error.hidden = !errors[row.id];
        error.textContent = errors[row.id] ? REMINDER_ERRORS[errors[row.id]] : '';
      }
      if (wrap) {
        if (errors[row.id]) wrap.setAttribute('data-invalid', 'true');
        else wrap.removeAttribute('data-invalid');
      }
    });
    document.querySelectorAll('[data-act=rem-preset]').forEach((button) => {
      button.disabled = !canAdd || configured.has(Number(button.dataset.min));
    });
    const add = document.querySelector('[data-act=rem-add]');

    if (add) add.disabled = !canAdd;
  }

  function pulse(element) {
    if (!element) return;

    element.classList.add('on');
    setTimeout(() => {
      requestAnimationFrame(() => element.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    }, 100);
    setTimeout(() => {
      element.classList.remove('on');
      const url = new URL(window.location.href);

      if (url.searchParams.get('highlight')) {
        url.searchParams.delete('highlight');
        history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
      }
    }, 3000);
  }

  function applyHighlight() {
    if (highlightDone) return;

    highlightDone = true;

    const params = new URLSearchParams(window.location.search);
    const target = params.get('highlight') || window.location.hash.replace('#', '').trim();

    if (!target) return;

    const element = document.querySelector(`[data-attn="${CSS.escape(target)}"]`);

    if (element) {
      pulse(element);
      return;
    }

    const section = document.getElementById(target);

    if (section) setTimeout(() => section.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }

  function installGuards() {
    if (guardsInstalled) return;

    guardsInstalled = true;

    window.addEventListener('beforeunload', (event) => {
      if (leaving || !isDirty()) return;

      event.preventDefault();
      event.returnValue = '';
    });
    document.addEventListener(
      'click',
      (event) => {
        if (!isDirty() || leaving) return;

        const link = event.target.closest?.('a[href]');

        if (!link || link.target === '_blank' || event.defaultPrevented) return;

        const href = link.getAttribute('href');

        if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) return;

        if (!window.confirm(UNSAVED_MESSAGE)) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        leaving = true;
      },
      true
    );
  }

  function deleteDialog() {
    const dialog = openDialog({
      title: 'Delete',
      size: 'ck-dlg-xs',
      body: `<p style="margin:0;text-align:center;font-size:20px">Are you sure?</p>`,
      footer: `<div style="display:flex;justify-content:space-between;width:100%;margin-top:16px">${btn('No', { variant: 'outline', act: 'no' })}${btn('Yes', { variant: 'destructive', act: 'yes' })}</div>`
    });

    dialog.$('[data-act=no]').addEventListener('click', dialog.close);
    dialog.$('[data-act=yes]').addEventListener('click', () => {
      leaving = true;
      M.deleteCourse(ctxRef.S, ctxRef.course.id);
      ctxRef.commit();
      window.location.href = M.R.courses();
    });
    dialog.$('[data-act=no]').focus();
  }

  function deadlineDialog() {
    const dialog = openDialog({
      title: 'Set Certificate Deadline First',
      description: 'Compliance courses require a certificate deadline before students can be enrolled. Please set a deadline in the course settings before publishing.',
      size: 'ck-dlg-sm',
      footer: `${btn('Cancel', { variant: 'outline', act: 'cancel' })}${btn('Go to Completion Deadline', { act: 'go' })}`
    });

    dialog.$('[data-act=cancel]').addEventListener('click', dialog.close);
    dialog.$('[data-act=go]').addEventListener('click', () => {
      dialog.close();
      const element = document.querySelector('[data-attn="course-completion-deadline"]');

      pulse(element);
    });
  }

  function logsSheet() {
    const root = document.createElement('div');

    root.innerHTML = `<div class="cst-sheet-scrim" data-close></div>
      <aside class="cst-sheet" role="dialog" aria-modal="true" aria-label="Delivery log" data-testid="live-session-reminders-log">
        <header>
          <div>
            <h2>Delivery log</h2>
            <p>Reminder emails for sessions in the last 30 days and upcoming sessions.</p>
          </div>
          <button type="button" class="ck-btn secondary icon-sm ck-tip below" data-tip="Refresh" aria-label="Refresh" data-refresh style="margin-right:8px">${ic('refresh')}</button>
          <button type="button" class="cst-sheet-x" data-close aria-label="Close">${ic('x')}</button>
        </header>
        <div class="cst-sheet-body">
          <table class="cst-table">
            <thead><tr><th>Session</th><th>Student</th><th>Reminder</th><th>Status</th><th style="width:40px"><span style="position:absolute;width:1px;height:1px;overflow:hidden">Detail</span></th></tr></thead>
            <tbody data-rows></tbody>
          </table>
        </div>
      </aside>`;
    document.body.appendChild(root);

    const rows = root.querySelector('[data-rows]');
    let timer = 0;
    const load = () => {
      rows.innerHTML = [0, 1, 2]
        .map(() => `<tr>${[0, 1, 2, 3, 4].map(() => '<td><span class="cst-skel"></span></td>').join('')}</tr>`)
        .join('');
      clearTimeout(timer);
      timer = setTimeout(() => {
        rows.innerHTML = '<tr><td class="empty" colspan="5">No reminders yet. They appear here as sessions get close.</td></tr>';
      }, 700);
    };
    const close = () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', onKey, true);
      root.remove();
    };
    const onKey = (event) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('keydown', onKey, true);
    root.querySelectorAll('[data-close]').forEach((element) => element.addEventListener('click', close));
    root.querySelector('[data-refresh]').addEventListener('click', load);
    load();
  }

  function tagDialog(ctx, onDone) {
    const groups = (ctx.S.tagGroups = ctx.S.tagGroups ?? []);
    const draft = { name: '', description: '', groupId: '', color: TAG_COLORS[0] };
    let host = null;

    const paint = () => {
      const group = groups.find((item) => item.id === draft.groupId);

      host.$('[data-body]').innerHTML = `
        <div class="cst-field"><label class="cst-label" for="tg-name">Tag Name</label><input class="input" id="tg-name" value="${esc(draft.name)}" autocomplete="off" /><p class="cst-error" data-err-name hidden role="alert"></p></div>
        <div class="cst-field"><label class="cst-label" for="tg-desc">Description</label><textarea class="textarea" id="tg-desc" rows="2" placeholder="Optional description">${esc(draft.description)}</textarea></div>
        <div class="cst-field"><label class="cst-label">Category</label>
          ${selectHtml({ id: 'group', value: draft.groupId, options: groups.map((item) => ({ value: item.id, label: item.name })), ariaLabel: 'Category' }).replace('<span></span>', `<span>${esc(group ? group.name : 'Select a category')}</span>`)}
          ${groups.length ? '' : '<p class="cst-desc">Create a tag group before creating tags</p>'}
          <button type="button" class="ck-btn ghost sm fit" data-act="new-group" style="padding:0 4px;color:var(--primary)">Create Tag Group</button>
        </div>
        <div class="cst-field"><label class="cst-label">Color</label>
          <div class="cst-row wrap" role="radiogroup" aria-label="Color">${TAG_COLORS.map((color) => `<button type="button" class="ck-btn icon-xs" data-color="${color}" aria-label="${color}" aria-pressed="${draft.color === color}" style="width:24px;height:24px;border-radius:999px;background:${color};${draft.color === color ? 'box-shadow:0 0 0 2px var(--background),0 0 0 4px ' + color : ''}"></button>`).join('')}</div>
          <p class="cst-desc" style="font-size:12px">Pick one of 10 colors</p>
        </div>`;
      host.$('[data-save]').disabled = !draft.groupId;

      host.$('#tg-name').addEventListener('input', (event) => {
        draft.name = event.target.value;
      });
      host.$('#tg-desc').addEventListener('input', (event) => {
        draft.description = event.target.value;
      });
      host.el.querySelectorAll('[data-color]').forEach((button) =>
        button.addEventListener('click', () => {
          draft.color = button.dataset.color;
          paint();
        })
      );
      host.$('[data-act=new-group]').addEventListener('click', groupDialog);
    };

    const groupDialog = () => {
      const sub = openDialog({
        z: 90,
        title: 'Create Tag Group',
        size: 'ck-dlg-sm',
        body: `<div class="cst-field"><label class="cst-label" for="gp-name">Group Name</label><input class="input" id="gp-name" autocomplete="off" /><p class="cst-error" data-err hidden role="alert"></p></div>
          <div class="cst-field"><label class="cst-label" for="gp-desc">Description</label><textarea class="textarea" id="gp-desc" rows="2" placeholder="Optional description"></textarea></div>`,
        footer: `${btn('Cancel', { variant: 'outline', act: 'cancel' })}${btn('Save', { act: 'save' })}`
      });

      sub.$('#gp-name').focus();
      sub.$('[data-act=cancel]').addEventListener('click', sub.close);
      sub.$('[data-act=save]').addEventListener('click', () => {
        const name = sub.$('#gp-name').value.trim();

        if (!name) {
          const error = sub.$('[data-err]');

          error.hidden = false;
          error.textContent = 'Name is required';
          return;
        }

        const group = { id: M.newId('tg'), name, description: sub.$('#gp-desc').value.trim(), tags: [] };

        groups.push(group);
        draft.groupId = group.id;
        ctx.commit();
        sub.close();
        paint();
      });
    };

    host = openDialog({
      title: 'Create Tag',
      body: '<div style="display:grid;gap:16px" data-body></div>',
      footer: `${btn('Cancel', { variant: 'outline', act: 'cancel' })}<button type="button" class="ck-btn default" data-save>Save</button>`
    });
    wireSelects(host.el, (id, value) => {
      if (id !== 'group') return;

      draft.groupId = value;
      paint();
    });
    host.$('[data-act=cancel]').addEventListener('click', host.close);
    host.$('[data-save]').addEventListener('click', () => {
      const name = draft.name.trim();

      if (!name) {
        const error = host.$('[data-err-name]');

        error.hidden = false;
        error.textContent = 'Name is required';
        return;
      }

      const group = groups.find((item) => item.id === draft.groupId);

      if (!group) return;

      const tag = { id: M.newId('tag'), name, description: draft.description.trim(), color: draft.color, groupId: group.id };

      group.tags.push(tag);
      ctx.commit();
      host.close();
      onDone(tag);
    });
    paint();
    host.$('#tg-name')?.focus();
  }

  function startConversion(ctx, offenders) {
    st.conv = { courseId: ctx.course.id, offenders };
    try {
      sessionStorage.setItem(`cio_public_conversion_${ctx.course.id}`, JSON.stringify({ offenders }));
    } catch {
      /* session storage is optional */
    }
  }

  function endConversion(ctx) {
    st.conv = null;
    try {
      sessionStorage.removeItem(`cio_public_conversion_${ctx.course.id}`);
    } catch {
      /* session storage is optional */
    }
  }

  /* Resets the draft in place: handlers keep a reference to st.draft. */
  function resetDraft(course, { type } = {}) {
    const next = fromCourse(course);

    if (type) next.type = type;

    Object.keys(st.draft).forEach((key) => delete st.draft[key]);
    Object.assign(st.draft, next);
    st.base = clone(st.draft);
  }

  function save(ctx) {
    const d = st.draft;
    const { course } = ctx;

    if (!d.title.trim()) {
      st.errors.title = 'title cannot be empty';
      repaint();
      return;
    }

    if (!d.description.trim()) {
      st.errors.description = 'description cannot be empty';
      repaint();
      return;
    }

    if (d.type === 'LIVE_CLASS' && Object.keys(rowErrors(d.reminders)).length) {
      say('Fix the session reminder errors before saving.', true);
      return;
    }

    const cost = Number(course.landing?.cost ?? course.cost ?? 0);

    if (cost > 0 && !String(course.landing?.paymentLink ?? course.metadata?.paymentLink ?? '').trim()) {
      say('A payment link is required for paid courses', true);
      return;
    }

    if (d.type === 'COMPLIANCE' && d.published && !d.deadline) {
      deadlineDialog();
      return;
    }

    const blocked = d.type === 'PUBLIC' && course.type !== 'PUBLIC' ? manualOffenders(course) : [];
    const nextType = blocked.length ? course.type || 'SELF_PACED' : d.type;

    course.title = d.title;
    course.desc = d.description;
    course.type = nextType;
    course.bannerImage = d.bannerImage;
    course.welcomeEmail = d.welcomeEmail.trim() ? d.welcomeEmail : '';
    course.tagIds = [...new Set(d.tagIds)];
    course.certRules = {
      ...(course.certRules ?? {}),
      deadline: d.deadline,
      threshold: d.threshold,
      requiredExerciseId: d.requiredExerciseId,
      exerciseMinScorePercent: d.requiredExerciseId ? d.minScore : null
    };
    if (course.certificate && typeof course.certificate === 'object') Object.assign(course.certificate, course.certRules);
    if (d.type === 'LIVE_CLASS') course.liveReminderOffsets = d.reminders.map(rowMinutes).sort((a, b) => b - a);
    course.lessonTabsOrder = [...d.tabs];
    course.contentGrouping = d.grouping;
    course.progression = d.progression;
    course.comments = d.comments;
    course.callout = d.type === 'PUBLIC' ? sanitizeCallout(d.callout) : null;
    course.selfEnroll = d.selfEnroll;
    course.lessonDownload = d.lessonDownload;
    course.markdownExport = d.markdown;
    M.setPublished(ctx.S, course.id, d.published);
    if (d.published && !course.slug) course.slug = newSlug(d.title);

    st.errors = {};
    st.seenPublished = Boolean(course.published);
    ctx.commit();

    if (blocked.length) {
      startConversion(ctx, blocked);
      resetDraft(course, { type: 'PUBLIC' });
      say('Fix the questions below to complete conversion to Public.');
    } else {
      if (nextType !== 'PUBLIC') endConversion(ctx);
      resetDraft(course);
      say('Update successful');
    }

    ctx.rerender();
  }

  function sanitizeCallout(value) {
    if (!value) return null;

    const title = value.title.trim();
    const description = value.description.trim();
    const buttonLabel = value.buttonLabel.trim();
    const buttonUrl = value.buttonUrl.trim();

    if (!title && !description && !buttonLabel && !buttonUrl) return null;

    return { title, description, buttonLabel, buttonUrl, animation: value.animation ?? 'waves' };
  }

  function discard(ctx) {
    const converting = st.conv && st.conv.courseId === ctx.course.id;

    st.errors = {};
    st.tagOpen = false;
    resetDraft(ctx.course, converting ? { type: 'PUBLIC' } : {});
    repaint();
  }

  function onPublishToggle(ctx, checked) {
    const d = st.draft;

    if (!checked) {
      d.published = false;
      repaint();
      return;
    }

    if (d.type === 'COMPLIANCE' && !d.deadline) {
      repaint();
      deadlineDialog();
      return;
    }

    d.published = true;
    d.selfEnroll = true;
    repaint();
  }

  function pickSelect(ctx, id, value) {
    const d = st.draft;

    if (id === 'type') {
      if (!value) return;

      d.type = value;
      if (value !== 'PUBLIC') {
        st.errors.type = '';
        endConversion(ctx);
      } else if (!d.callout) {
        d.callout = { title: '', description: '', buttonLabel: '', buttonUrl: '', animation: 'waves' };
      }
      repaint();
      return;
    }

    if (id === 'finalExercise') {
      d.requiredExerciseId = value && value !== 'none' ? value : null;
      if (!d.requiredExerciseId) d.minScore = null;
      else if (typeof d.minScore !== 'number') d.minScore = 100;
      repaint();
      return;
    }

    if (id.startsWith('unit:')) {
      const row = d.reminders.find((item) => item.id === id.slice(5));

      if (!row) return;

      row.unit = value;
      repaint();
    }
  }

  function wireTabs() {
    const list = document.getElementById('cst-tabs');

    if (!list) return;

    const commitOrder = () => {
      st.draft.tabs = [...list.querySelectorAll('.cst-tab')].map((item) => Number(item.dataset.tab));
      paintBar();
    };

    list.addEventListener('pointerdown', (event) => {
      const tab = event.target.closest('.cst-tab');

      if (!tab || event.button > 0) return;

      tab.setPointerCapture(event.pointerId);
      tab.classList.add('dragging');
      list.classList.add('drag');

      const move = (moveEvent) => {
        const siblings = [...list.querySelectorAll('.cst-tab')].filter((item) => item !== tab);
        let before = null;

        for (const sibling of siblings) {
          const box = sibling.getBoundingClientRect();

          if (moveEvent.clientX < box.left + box.width / 2) {
            before = sibling;
            break;
          }
        }

        if (before) {
          if (tab.nextElementSibling !== before) list.insertBefore(tab, before);
        } else if (list.lastElementChild !== tab) {
          list.appendChild(tab);
        }
      };
      const up = () => {
        tab.removeEventListener('pointermove', move);
        tab.removeEventListener('pointerup', up);
        tab.removeEventListener('pointercancel', up);
        tab.classList.remove('dragging');
        list.classList.remove('drag');
        commitOrder();
      };

      tab.addEventListener('pointermove', move);
      tab.addEventListener('pointerup', up);
      tab.addEventListener('pointercancel', up);
    });
    list.addEventListener('keydown', (event) => {
      const tab = event.target.closest('.cst-tab');

      if (!tab || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;

      event.preventDefault();
      const target = event.key === 'ArrowLeft' ? tab.previousElementSibling : tab.nextElementSibling;

      if (!target) return;

      if (event.key === 'ArrowLeft') list.insertBefore(tab, target);
      else list.insertBefore(target, tab);

      tab.focus();
      commitOrder();
    });
  }

  function wireBody() {
    const ctx = ctxRef;
    const d = st.draft;

    wireRich(document.getElementById('cst-body'), (id, html) => {
      if (id === 'welcomeEmail') d.welcomeEmail = html;
      paintBar();
    });
    wireTabs();

    const threshold = document.getElementById('course-completion-threshold');
    const minScore = document.getElementById('course-min-exercise-score');

    if (threshold)
      wireNumber(threshold, {
        min: 0,
        max: 100,
        onValue: (value) => {
          d.threshold = value;
          paintBar();
        }
      });
    if (minScore)
      wireNumber(minScore, {
        min: 0,
        max: 100,
        onValue: (value) => {
          d.minScore = value;
          paintBar();
        }
      });
    document.querySelectorAll('[data-rem-amt]').forEach((input) =>
      wireNumber(input, {
        min: 1,
        onValue: (value) => {
          const row = d.reminders.find((item) => item.id === input.dataset.remAmt);

          if (row) row.amount = value;
          paintReminderNotes();
          paintBar();
        }
      })
    );
    document.getElementById('course-completion-deadline-input')?.addEventListener('change', (event) => {
      d.deadline = event.target.value ? new Date(event.target.value).toISOString() : null;
      st.errors.deadline = '';
      paintBar();
    });

  }

  function wire(ctx) {
    ctxRef = ctx;
    installGuards();

    const root = document.getElementById('cst-root');

    if (!root) return;

    const d = st.draft;

    wireBody();
    wireSelects(root, (id, value) => pickSelect(ctx, id, value));
    paintBar();

    root.addEventListener('input', (event) => {
      const target = event.target;

      if (target.dataset.k) {
        d[target.dataset.k] = target.value;
        clearFieldError(target.dataset.k);
        paintBar();
        return;
      }

      if (target.dataset.co && d.callout) {
        d.callout[target.dataset.co] = target.value;
        paintBar();
        return;
      }

      if (target.id === 'cst-tag-q') {
        st.tagQuery = target.value;
        document.getElementById('cst-tag-list').innerHTML = tagListHtml(ctx);
      }
    });

    root.addEventListener('change', (event) => {
      const target = event.target;

      if (target.name === 'progression') {
        d.progression = target.value;
        paintBar();
      }

      if (target.name === 'callout-animation' && d.callout) {
        d.callout.animation = target.value;
        paintBar();
      }
    });

    root.addEventListener('click', (event) => {
      const toggle = event.target.closest('[role=switch]');

      if (toggle) {
        const next = toggle.getAttribute('aria-checked') !== 'true';
        const map = {
          'content-grouping': 'grouping',
          'course-comments-sw': 'comments',
          'allow-self-enrollment': 'selfEnroll',
          'lesson-download-sw': 'lessonDownload',
          'allow-markdown-export': 'markdown'
        };

        if (toggle.id === 'is-published') {
          onPublishToggle(ctx, next);
          return;
        }

        if (map[toggle.id]) {
          d[map[toggle.id]] = next;
          toggle.setAttribute('aria-checked', String(next));
          paintBar();
        }

        return;
      }

      const target = event.target.closest('[data-act]');

      if (!target) return;

      const act = target.dataset.act;

      if (act === 'save') save(ctx);
      else if (act === 'discard') discard(ctx);
      else if (act === 'cover-replace')
        imageDialog({
          aspect: 280 / 200,
          maxBytes: 500 * 1024,
          maxWidth: 1200,
          say,
          onPick: (url) => {
            d.bannerImage = url;
            document.getElementById('cst-cover-img').src = url;
            paintBar();
            say('Complete :)');
          }
        });
      else if (act === 'cover-remove') {
        d.bannerImage = '';
        document.getElementById('cst-cover-img').src = DEFAULT_COVER;
        paintBar();
      } else if (act === 'link-gen') {
        ctx.course.slug = newSlug(ctx.course.title);
        ctx.commit();
        document.getElementById('cst-link').textContent = courseLink(ctx);
        say('Course link updated successfully');
      } else if (act === 'link-open') window.open(M.R.publicCourse(ctx.course.id), '_blank', 'noopener');
      else if (act === 'link-copy') {
        navigator.clipboard?.writeText(courseLink(ctx)).then(
          () => say('Copied to clipboard'),
          () => say('Failed to copy link', true)
        );
        if (!navigator.clipboard) say('Failed to copy link', true);
      } else if (act === 'tag-pop') {
        st.tagOpen = !st.tagOpen;
        const pop = document.getElementById('cst-tag-pop');

        pop.hidden = !st.tagOpen;
        if (st.tagOpen) document.getElementById('cst-tag-q').focus();
        else st.tagQuery = '';
        event.stopPropagation();
      } else if (act === 'tag-toggle') {
        const id = target.dataset.id;

        d.tagIds = d.tagIds.includes(id) ? d.tagIds.filter((item) => item !== id) : [...d.tagIds, id];
        refreshTags(ctx);
      } else if (act === 'tag-remove') {
        d.tagIds = d.tagIds.filter((id) => id !== target.dataset.id);
        refreshTags(ctx);
      } else if (act === 'tag-create') {
        st.tagOpen = false;
        st.tagQuery = '';
        refreshTags(ctx);
        tagDialog(ctx, (tag) => {
          d.tagIds = [...new Set([...d.tagIds, tag.id])];
          refreshTags(ctx);
        });
      } else if (act === 'rem-add') {
        if (d.reminders.length >= REMINDER_MAX_COUNT) return;

        d.reminders.push(reminderRow(60));
        repaint();
      } else if (act === 'rem-preset') {
        const minutes = Number(target.dataset.min);

        if (d.reminders.length >= REMINDER_MAX_COUNT || d.reminders.some((row) => rowMinutes(row) === minutes)) return;

        d.reminders.push(reminderRow(minutes));
        repaint();
      } else if (act === 'rem-remove') {
        d.reminders = d.reminders.filter((row) => row.id !== target.dataset.id);
        repaint();
      } else if (act === 'logs-open') logsSheet();
      else if (act === 'callout-clear') {
        d.callout = null;
        repaint();
      } else if (act === 'unlock-all') {
        const items = lockedItems(ctx.course);

        items.forEach((lesson) => {
          lesson.published = true;
          lesson.isUnlocked = true;
        });
        ctx.commit();
        say('All course items unlocked');
        repaint();
      } else if (act === 'upgrade') {
        window.pricing.open({
          state: ctx.S,
          item: 'general',
          commit: ctx.commit,
          onUpgrade: () => repaint()
        });
      } else if (act === 'download') say('Coming soon');
      else if (act === 'delete-open') deleteDialog();
      else if (act === 'conv-fix') {
        if (isDirty()) return;

        leaving = true;
        window.location.href = M.R.lesson(ctx.course.id, target.dataset.ex, {
          highlight: `exercise-question-${target.dataset.q}`
        });
      } else if (act === 'conv-cancel') {
        d.type = ctx.course.type || 'SELF_PACED';
        endConversion(ctx);
        st.errors.type = '';
        repaint();
      }
    });

    document.addEventListener('click', (event) => {
      if (!root.isConnected || !st.tagOpen) return;
      if (event.target.closest?.('.cst-pop-wrap')) return;

      st.tagOpen = false;
      st.tagQuery = '';
      const pop = document.getElementById('cst-tag-pop');

      if (pop) pop.hidden = true;
    });

    document.getElementById('cst-refresh').addEventListener('click', () => {
      const fresh = P.loadState();
      const freshCourse = (fresh.courses ?? []).find((item) => item.id === ctx.course.id);

      if (freshCourse) Object.assign(ctx.course, freshCourse);
      ctx.S.tagGroups = fresh.tagGroups ?? ctx.S.tagGroups;
      ctx.S.plan = fresh.plan ?? ctx.S.plan;
      say('Refreshed');
      ctx.rerender();
    });

    applyHighlight();

  }

  function refreshTags(ctx) {
    const chips = document.getElementById('cst-tag-chips');
    const wrap = document.querySelector('.cst-pop-wrap');

    if (chips) chips.innerHTML = tagChips(ctx);
    if (wrap) wrap.outerHTML = tagPopover(ctx);
    paintBar();
  }

  function init(ctx) {
    const { course } = ctx;

    if (st.id !== course.id) {
      st.id = course.id;
      st.draft = {};
      st.errors = {};
      st.tagOpen = false;
      st.tagQuery = '';
      st.seenPublished = Boolean(course.published);
      st.conv = null;
      highlightDone = false;
      resetDraft(course);

      let active = false;

      try {
        active = Boolean(sessionStorage.getItem(`cio_public_conversion_${course.id}`));
      } catch {
        /* session storage is optional */
      }

      if (active) {
        const offenders = manualOffenders(course);

        if (offenders.length) {
          startConversion(ctx, offenders);
          resetDraft(course, { type: 'PUBLIC' });
        } else {
          endConversion(ctx);
          course.type = 'PUBLIC';
          ctx.commit();
          resetDraft(course);
          say('Course successfully converted to Public');
        }
      }

      return;
    }

    /* The header menu publishes and unpublishes outside this page; keep the draft in step. */
    if (Boolean(course.published) !== st.seenPublished) {
      st.seenPublished = Boolean(course.published);
      st.draft.published = Boolean(course.published);
      st.base.published = Boolean(course.published);
    }
  }

  window.COURSE_TABS = window.COURSE_TABS || {};
  window.COURSE_TABS.settings = {
    nav: 'settings',
    title: 'Settings',
    html: (ctx) => {
      init(ctx);

      return pageHtml(ctx);
    },
    wire
  };

})();
