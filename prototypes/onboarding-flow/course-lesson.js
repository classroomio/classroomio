/*
 * course-lesson.js — the lesson editor and the exercise editor (both the `lesson` tab; branches on item.kind).
 *
 * Mirrors routes/(app)/courses/[id]/lessons/[lessonId] (lib/features/course/pages/lesson.svelte and
 * components/lesson/*: lesson-page-edit-header, note, video/*, slide, document/*, lesson-settings-tab,
 * lesson-version-history, content-navigation-actions) and routes/(app)/courses/[id]/exercises/[exerciseId]
 * (pages/exercise.svelte, components/exercise/*). Data shapes are documented at the top of course-lessons.js.
 *
 * The rich-text note and the exercise Questions tab are the repo's REAL Svelte components (the TipTap based
 * `@cio/ui` Editor and the `ExerciseQuestion` renderers) compiled by tools/editor-bundle into
 * site/editor-bundle.js and shown in editor-frame.html inside an iframe, so the toolbar, bubble menu, slash
 * commands, blocks and all question types are production code. Everything around them is plain JS.
 *
 * Simulated: video upload, media library and Google Drive (no storage or network), slide/video embeds only
 * load if the host allows framing, document upload keeps the file's name and size only, AI buttons, transcripts,
 * "Notify students", language selector (single language), student submissions (no students), and the
 * "passed completion" save guard dialog.
 * Added for review: view mode shows previous/next and "Mark as Complete" (production shows them to learners).
 */
(function () {
  'use strict';

  const ICON = {
    lesson: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    unlock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
    save: '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
    video: '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
    slide: '<path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/>',
    book: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    dots: '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
    check: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    drive: '<line x1="22" x2="2" y1="12" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    library: '<path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    lock2: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'
  };

  function ic(name, size = 16) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:${size}px;height:${size}px;flex-shrink:0">${ICON[name] ?? ''}</svg>`;
  }

  const THEME_VARS = ['background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground', 'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'muted', 'muted-foreground', 'accent', 'accent-foreground', 'destructive', 'border', 'input', 'ring', 'radius'];

  function syncTheme(frameDocument) {
    const computed = getComputedStyle(document.documentElement);

    THEME_VARS.forEach((name) => frameDocument.documentElement.style.setProperty(`--${name}`, computed.getPropertyValue(`--${name}`).trim()));
  }

  const hasText = (html) => Boolean(html) && (/<svg\b|<img\b|<iframe\b|<video\b/i.test(html) || html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() !== '');

  function cleanHtml(html) {
    const doc = new DOMParser().parseFromString(html || '', 'text/html');

    doc.querySelectorAll('script, style, object, embed').forEach((node) => node.remove());
    doc.querySelectorAll('*').forEach((node) => {
      [...node.attributes].forEach((attribute) => {
        if (/^on/i.test(attribute.name) || /^\s*javascript:/i.test(attribute.value)) node.removeAttribute(attribute.name);
      });
    });

    return doc.body.innerHTML;
  }

  function sizeLabel(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  /* ---------- shared bits ---------- */
  let L = null;
  let X = null;
  let frameResizeBound = false;

  function menuHTML(items) {
    return `<div class="cc-menu"><button class="btn btn-ghost cc-ibtn-sm" type="button" data-menu aria-haspopup="menu" aria-expanded="false" aria-label="Open menu">${ic('dots', 20)}</button><div class="cc-pop" role="menu" hidden>${items.join('')}</div></div>`;
  }

  function wireMenus(root) {
    const closeAll = () => {
      root.querySelectorAll('.cc-pop').forEach((pop) => {
        pop.hidden = true;
      });
    };

    root.addEventListener('click', (event) => {
      const button = event.target.closest('[data-menu]');

      if (!button) return;

      event.stopPropagation();

      const pop = button.nextElementSibling;
      const open = pop.hidden;

      closeAll();
      pop.hidden = !open;
      button.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', closeAll);
  }

  function dialog(html, { wide = false, label = 'Dialog', onClose } = {}) {
    const host = document.getElementById('modal-host');

    host.innerHTML = `<div class="scrim" id="cc-dlg"><div class="modal cc-modal${wide ? ' cc-wide-modal' : ''}" role="dialog" aria-modal="true" aria-label="${label}">${html}<button class="cc-modal-x" type="button" data-close aria-label="Close">${ic('x', 16)}</button></div></div>`;

    const close = () => {
      host.innerHTML = '';
      document.removeEventListener('keydown', onKey);
      onClose?.();
    };
    const onKey = (event) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('keydown', onKey);
    host.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', close));
    host.querySelector('#cc-dlg').addEventListener('click', (event) => {
      if (event.target.id === 'cc-dlg') close();
    });

    return { host, close, root: host.querySelector('.modal') };
  }

  function yesNo(title, body, yes = 'Yes', no = 'No') {
    return new Promise((resolve) => {
      const { host, close } = dialog(`<h2>${title}</h2><p style="font-size:16px;color:var(--foreground);margin:8px 0 0">${body}</p><div class="cc-foot"><button class="btn btn-outline" data-no type="button">${no}</button><button class="btn btn-primary" data-yes type="button">${yes}</button></div>`, { label: title, onClose: () => resolve(false) });

      host.querySelector('[data-yes]').addEventListener('click', () => {
        close();
        resolve(true);
      });
      host.querySelector('[data-no]').addEventListener('click', close);
    });
  }

  function findNeighbours(ctx, id) {
    const flat = ctx.M.lessonsOf(ctx.course);
    const index = flat.findIndex((entry) => entry.id === id);

    return { prev: flat[index - 1] ?? null, next: flat[index + 1] ?? null };
  }

  function navButtons(ctx, id) {
    const { prev, next } = findNeighbours(ctx, id);
    const link = (item, label, icon, tip) => `<a class="btn btn-outline cc-ibtn-sm${item ? '' : ' disabled'}" ${item ? `href="${ctx.esc(ctx.M.R.lesson(ctx.course.id, item.id))}"` : 'aria-disabled="true"'} aria-label="${label}" title="${tip}">${ic(icon, 14)}</a>`;

    return `<div style="display:flex;gap:4px">${link(prev, 'Prev', 'left', 'Previous (←)')}${link(next, 'Next', 'right', 'Next (→)')}</div>`;
  }

  /* ======================================================= LESSON ======================================================= */
  const PLATFORMS = [
    ['google-slides', 'Google Slides', 'docs.google.com', 'File → Share → Publish to web → Embed', ['Open your deck and choose File → Share → Publish to web.', 'Switch to the Embed tab and click Publish.', 'Copy the iframe embed code and paste it here.']],
    ['canva', 'Canva', 'canva.com', 'Share → More → Embed', ['Above the editor, click Share → More.', 'Choose Embed and confirm (this makes the design public).', 'Copy the HTML embed code and paste it here.']],
    ['powerpoint', 'PowerPoint', 'onedrive.live.com', 'PowerPoint for the web → File → Share → Embed', ['Save the deck to OneDrive, then open it in PowerPoint for the web.', 'Choose File → Share → Embed and pick your dimensions.', 'Copy the iframe embed code and paste it here. We size the player ourselves.']],
    ['keynote', 'Keynote', 'icloud.com', 'Collaborate → Copy Link, then embed', ['Click Collaborate and set access to Anyone with the link · View only.', 'Copy the iCloud link, then get the embed code for your website.', 'Paste the iframe embed code here.']],
    ['figma', 'Figma', 'figma.com', 'Share a Figma Slides file and copy the embed', ['Open your Figma Slides file and enable link sharing.', 'Copy the embed code for the /slides or /deck file.', 'Paste the iframe embed code here.']],
    ['prezi', 'Prezi', 'prezi.com', 'Share → Embed', ['From the dashboard, open Share on your presentation.', 'Click Embed and copy the code.', 'Paste the iframe embed code here.']],
    ['pitch', 'Pitch', 'pitch.com', 'Share externally → Copy embed code', ['Click Share → Share externally and create a public link.', 'Open the link Options (⋯) and choose Copy embed code.', 'Paste the iframe embed code here.']],
    ['gamma', 'Gamma', 'gamma.app', 'Share → enable public access → copy iframe', ['Open Share and toggle Allow public access.', 'Copy the generated iframe embed code.', 'Paste the iframe embed code here.']],
    ['slideshare', 'SlideShare', 'slideshare.net', 'Share → Embed under the deck', ['Open the public deck on slideshare.net.', 'Click Share under the viewer and open the Embed tab.', 'Copy the iframe embed code and paste it here.']],
    ['beautiful', 'Beautiful.ai', 'beautiful.ai', 'Sharing Settings → Public → Get Embed Code', ['Open Sharing Settings and switch the deck to Public.', 'Click Get Embed Code.', 'Paste the iframe embed code here.']]
  ];
  const VIDEO_KIND = { youtube: 'YouTube', vimeo: 'Vimeo', upload: 'Upload', google_drive: 'Google Drive', generic: 'Embedded' };
  const POLICIES = {
    manual: ['Manual', 'Students mark the lesson complete themselves.'],
    video_watch: ['Video watch', "The lesson completes automatically after students watch the selected uploaded videos. YouTube and external embeds can't be tracked."],
    none: ['None', 'This lesson does not block course progression.']
  };

  const ytId = (url) => (url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/) ?? [])[1] ?? '';
  const vimeoId = (url) => (url.match(/vimeo\.com\/(?:video\/)?(\d+)/) ?? [])[1] ?? '';

  function normalizeUrl(value) {
    const trimmed = value.trim();

    if (!trimmed) return '';

    try {
      const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);

      return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
    } catch {
      return '';
    }
  }

  function splitLinks(text) {
    return [...new Set(text.split(/[\s,]+/).filter(Boolean))];
  }

  function lessonCounts(lesson) {
    return {
      video: (lesson.videos ?? []).length,
      note: hasText(lesson.html) ? 1 : 0,
      slide: (lesson.slides ?? []).length,
      document: (lesson.documents ?? []).length
    };
  }

  function embedSrc(video) {
    if (video.type === 'youtube') return `https://www.youtube.com/embed/${ytId(video.link)}`;
    if (video.type === 'vimeo') return `https://player.vimeo.com/video/${vimeoId(video.link)}`;
    if (video.type === 'generic') return video.link;

    return '';
  }

  function videoCard(ctx, video, index, edit) {
    const { esc } = ctx;
    const id = video.type === 'youtube' ? ytId(video.link) : '';
    const thumb = id ? `<img src="https://img.youtube.com/vi/${id}/hqdefault.jpg" alt="${esc(video.title)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" loading="lazy" />` : `<div class="cc-vph">${ic('video', 40)}<span>${esc(video.title)}</span></div>`;
    const date = video.createdAt ? new Date(video.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
    const kind = VIDEO_KIND[video.type] ?? 'Embedded';
    const title = video.link && video.type !== 'upload' && video.type !== 'google_drive' ? `<a href="${esc(video.link)}" target="_blank" rel="noopener noreferrer" class="cc-vlink">${esc(video.title)}</a>` : esc(video.title);

    return `
      <div class="cc-vcard${edit ? ' bordered' : ''}">
        <div class="cc-vthumb">${thumb}</div>
        <div class="cc-vbody">
          <div class="cc-vtitle"><span>${title}</span>${edit ? menuHTML([`<button type="button" role="menuitem" class="cc-danger" data-rm-video="${index}">${ic('trash', 14)} Remove video</button>`]) : ''}</div>
          <p class="cc-vmeta">${esc(ctx.course.title)}</p>
          <p class="cc-vmeta">${kind}${date ? ` · ${date}` : ''}</p>
        </div>
      </div>`;
  }

  function lessonHeaderHTML(ctx, lesson) {
    const { esc } = ctx;
    const edit = L.mode === 'edit';
    const lockLabel = lesson.published ? 'Lock' : 'Unlock';

    const title = edit
      ? `<input class="input" id="cc-l-title" style="max-width:36rem" value="${esc(lesson.title)}" placeholder="Lesson Title" aria-label="Lesson Title" />`
      : `<h1 class="cc-title">${esc(lesson.title)}</h1>`;
    const tools = edit
      ? `<button class="btn btn-secondary cc-ibtn" type="button" data-act="lock" aria-label="${lockLabel}" title="${lockLabel}">${ic(lesson.published ? 'unlock' : 'lock', 18)}</button>
         <button class="btn btn-secondary cc-ibtn" type="button" data-act="delete-lesson" aria-label="Delete this lesson" title="Delete this lesson">${ic('trash', 18)}</button>`
      : '';
    const view = !edit
      ? `${navButtons(ctx, lesson.id)}
         <button class="btn btn-secondary btn-sm" type="button" data-act="complete" ${lesson.completionPolicy === 'none' ? 'disabled' : ''}>${ic('check', 14)}<span>${lesson.previewComplete ? 'Mark as Incomplete' : 'Mark as Complete'}</span></button>`
      : '';

    return `
      <div class="cc-ph">
        <div class="cc-ph-main" style="display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap">
          <div style="flex:1;min-width:0">${title}</div>
          <div class="cc-actions">${tools}</div>
        </div>
        <div class="cc-actions">
          ${view}
          ${edit ? `<span class="cc-status" id="cc-status" aria-live="polite">${L.saving ? 'Saving…' : L.dirty ? '' : 'Saved'}</span>` : ''}
          <button class="btn btn-secondary cc-ibtn" type="button" data-act="mode" aria-label="${edit ? 'Save' : 'Edit'}" title="${edit ? 'Save' : 'Edit'}">${ic(edit ? 'save' : 'pencil', 20)}</button>
          <button class="btn btn-secondary cc-ibtn" type="button" data-act="history" aria-label="Version history" title="Version history">${ic('history', 20)}</button>
          <button class="btn btn-ghost cc-ibtn" type="button" data-act="refresh" aria-label="Refresh" title="Refresh">${ic('refresh', 16)}</button>
        </div>
      </div>`;
  }

  function lessonViewHTML(ctx, lesson) {
    const { esc } = ctx;
    const counts = lessonCounts(lesson);
    const empty = Object.values(counts).every((value) => value === 0);

    if (empty) {
      return `<div class="cc-empty"><span class="cc-empty-ic">${ic('video', 20)}</span><h3>No note, video or slide added for this lesson yet</h3><p>Share your knowledge with your students by creating engaging content. Start by clicking on Get Started button.</p><button class="btn btn-primary" type="button" data-act="mode">Get Started</button></div>`;
    }

    const parts = [];

    if (counts.video) {
      parts.push(`<div class="cc-vwrap">${lesson.videos
        .map((video) => {
          const src = embedSrc(video);

          return src ? `<div class="cc-embed"><iframe src="${esc(src)}" title="${esc(video.title)}" allowfullscreen loading="lazy"></iframe></div>` : `<div class="cc-embed cc-embed-ph">${ic('video', 40)}<span>${esc(video.title)}</span><small>${VIDEO_KIND[video.type]} (playback simulated)</small></div>`;
        })
        .join('')}</div>`);
    }

    if (counts.note) parts.push(`<div class="cc-note-view cc-prose">${cleanHtml(lesson.html)}</div>`);

    if (counts.slide) parts.push(`<div class="cc-vwrap">${lesson.slides.map((slide, index) => `<div class="cc-embed"><iframe src="${esc(slide.src)}" title="${esc((PLATFORMS.find((platform) => platform[0] === slide.platform) ?? [])[1] ?? 'Slide')} (${index + 1} of ${lesson.slides.length})" allowfullscreen loading="lazy"></iframe></div>`).join('')}</div>`);

    if (counts.document) {
      parts.push(`<div class="cc-docs">${lesson.documents.map((doc) => `<div class="cc-doc">${ic('file', 20)}<div><b>${esc(doc.name)}</b><small>${esc(doc.type)} · ${sizeLabel(doc.size)}</small></div></div>`).join('')}</div>`);
    }

    return `<div class="cc-view">${parts.join('<hr class="cc-hr" />')}</div>`;
  }

  function tabsHTML(lesson) {
    const counts = lessonCounts(lesson);
    const tabs = [['video', 'Video', 'video'], ['note', 'Note', 'book'], ['slide', 'Slide', 'slide'], ['document', 'Docs', 'file'], ['settings', 'Settings', 'settings']];

    return `<div class="cc-tabs" role="tablist">${tabs.map(([id, label, icon]) => `<button type="button" role="tab" aria-selected="${L.tab === id}" class="cc-tab${L.tab === id ? ' on' : ''}" data-tab="${id}">${ic(icon, 16)}${label}${counts[id] ? `<span class="cc-count">${counts[id]}</span>` : ''}</button>`).join('')}</div>`;
  }

  function videoTabHTML(ctx, lesson) {
    const videos = lesson.videos ?? [];

    return `
      <div style="overflow:hidden"><button class="btn btn-primary" type="button" data-act="add-video" style="float:right;margin:16px 0">Add/Edit Video(s)</button></div>
      ${videos.length ? `<div class="cc-vgrid">${videos.map((video, index) => videoCard(ctx, video, index, true)).join('')}</div>` : `<div class="cc-empty"><span class="cc-empty-ic">${ic('video', 20)}</span><h3>No videos yet</h3><p>Add videos from YouTube, Vimeo, Google Drive, embed links, upload, or your media library</p></div>`}`;
  }

  function slideTabHTML(ctx, lesson) {
    const slides = lesson.slides ?? [];

    return `
      <div style="overflow:hidden"><button class="btn btn-primary" type="button" data-act="add-slide" style="float:right;margin:16px 0">Add slide</button></div>
      ${slides.length ? `<div class="cc-vgrid">${slides.map((slide, index) => `<div class="cc-vcard bordered"><div class="cc-vthumb"><div class="cc-vph">${ic('slide', 40)}<span>${ctx.esc((PLATFORMS.find((platform) => platform[0] === slide.platform) ?? [])[1] ?? slide.platform)}</span></div></div><div class="cc-vbody"><div class="cc-vtitle"><span>${ctx.esc(new URL(slide.src).hostname)}</span>${menuHTML([`<button type="button" role="menuitem" class="cc-danger" data-rm-slide="${index}">${ic('trash', 14)} Remove slide</button>`])}</div></div></div>`).join('')}</div>` : `<div class="cc-empty"><span class="cc-empty-ic">${ic('slide', 20)}</span><h3>No slides yet</h3><p>Embed Google Slides, Canva, PowerPoint, Keynote, Figma, Prezi, Pitch, Gamma, SlideShare, or Beautiful.ai</p></div>`}`;
  }

  function docTabHTML(ctx, lesson) {
    const docs = lesson.documents ?? [];

    return `
      <div style="overflow:hidden"><button class="btn btn-primary" type="button" data-act="add-doc" style="float:right;margin:16px 0">Add Document</button></div>
      ${docs.length ? `<p class="cc-note" style="margin:0 0 8px">Attachments · ${docs.length} ${docs.length === 1 ? 'file' : 'files'}</p><div class="cc-docs">${docs.map((doc, index) => `<div class="cc-doc">${ic('file', 20)}<div style="flex:1;min-width:0"><b>${ctx.esc(doc.name)}</b><small>Type: ${ctx.esc(doc.type)} · Size: ${sizeLabel(doc.size)}</small></div>${menuHTML([`<button type="button" role="menuitem" class="cc-danger" data-rm-doc="${index}">${ic('trash', 14)} Remove document</button>`])}</div>`).join('')}</div>` : `<div class="cc-empty"><span class="cc-empty-ic">${ic('file', 20)}</span><h3>No documents yet</h3><p>Upload documents to share with your students</p></div>`}`;
  }

  function settingsTabHTML(ctx, lesson) {
    const { esc } = ctx;
    const live = ctx.course.type === 'LIVE_CLASS';
    const policy = lesson.completionPolicy ?? 'manual';
    const commentsOn = lesson.commentsEnabled !== false;
    const uploads = (lesson.videos ?? []).map((video, index) => ({ video, index })).filter(({ video }) => video.type === 'upload');
    const session = live
      ? `<fieldset class="cc-fs"><legend>Live session</legend>
          <p class="cc-help">Set the join link and scheduled time for this live class. Students get email reminders before each session. Choose when in Course settings.</p>
          <div class="cc-field"><label class="cc-lab" for="cc-call">Join link (Zoom, Meet, etc.)</label><input class="input" id="cc-call" data-s="callUrl" value="${esc(lesson.callUrl ?? '')}" placeholder="https://zoom.us/j/..." /></div>
          <div class="cc-field"><label class="cc-lab" for="cc-at">Date and time</label><input class="input" type="datetime-local" id="cc-at" data-s="lessonAt" value="${esc(lesson.lessonAt ?? '')}" /></div>
          <div class="cc-field"><label class="cc-lab" for="cc-dur">Expected session length (minutes)</label><input class="input" type="number" min="1" max="480" id="cc-dur" data-s="sessionDurationMinutes" value="${lesson.sessionDurationMinutes ?? 60}" /><p class="cc-help">Used to show when the session is live and when it has ended.</p></div>
          <div class="cc-field"><label class="cc-lab" for="cc-rec">Recording link</label><input class="input" id="cc-rec" data-s="recordingUrl" value="${esc(lesson.recordingUrl ?? '')}" placeholder="https://zoom.us/rec/share/..." /><p class="cc-help">Shown to students after the session ends.</p><p class="cc-err" id="cc-rec-err" hidden>Enter a link that starts with http:// or https://</p></div>
          <button class="btn btn-primary btn-sm" type="button" data-act="save-session">Save session</button>
        </fieldset><hr class="cc-hr" />`
      : '';

    const watch =
      policy === 'video_watch'
        ? `<div class="cc-field"><label class="cc-lab" for="cc-thr">Watch threshold (%)</label><input class="input" type="number" min="1" max="100" id="cc-thr" data-s="videoWatchThreshold" value="${lesson.videoWatchThreshold ?? 95}" style="max-width:140px" /></div>
           <div class="cc-field"><label class="cc-lab">Videos to enforce</label><p class="cc-help">Only uploaded videos can be enforced. YouTube and external embeds cannot be tracked.</p>
           ${uploads.length ? uploads.map(({ video, index }) => `<label class="cc-check"><input type="checkbox" data-watch="${index}" ${video.enforceWatch ? 'checked' : ''} /> ${esc(video.title)}</label>`).join('') : `<div class="cc-warn"><b>No uploaded videos in this lesson</b><span>Video watch only tracks uploaded videos. YouTube and external embeds can't be tracked, so this lesson can't complete automatically and students can't mark it complete. Upload the video in the Video tab, or set the completion rule to Manual.</span></div>`}</div>`
        : '';

    return `
      <div class="cc-settings">
        ${session}
        <fieldset class="cc-fs"><legend>Progression</legend>
          <p class="cc-help">Choose how students complete this lesson and move through the course.</p>
          <p class="cc-help">These rules apply to students only. You can preview and navigate freely while teaching.</p>
          <div class="cc-field" style="margin-top:12px"><label class="cc-lab" for="cc-policy">Completion rule</label>
            <select class="select" id="cc-policy" style="max-width:20rem">${Object.entries(POLICIES).map(([value, [name]]) => `<option value="${value}" ${policy === value ? 'selected' : ''}>${name}</option>`).join('')}</select>
            <p class="cc-help">${POLICIES[policy][1]}</p></div>
          ${watch}
        </fieldset><hr class="cc-hr" />
        <fieldset class="cc-fs"><legend>Lesson comments</legend>
          <p class="cc-help">Choose whether students can view and add comments on this lesson.</p>
          <label class="cc-switchrow"><span class="switch"><input type="checkbox" id="cc-comments" ${commentsOn ? 'checked' : ''} /><span class="track"></span><span class="knob"></span></span><span>${commentsOn ? 'Comments enabled' : 'Comments disabled'}</span></label>
        </fieldset>
      </div>`;
  }

  function lessonPageHTML(ctx, lesson) {
    let body;

    if (L.mode === 'view') body = lessonViewHTML(ctx, lesson);
    else if (L.tab === 'video') body = tabsHTML(lesson) + videoTabHTML(ctx, lesson);
    else if (L.tab === 'note') body = `${tabsHTML(lesson)}<div class="cc-ai"><button class="btn btn-outline btn-sm" type="button" data-act="ai">${ic('help', 14)} AI</button></div><iframe class="cc-frame" id="cc-note-frame" src="editor-frame.html" title="Lesson note editor"></iframe>`;
    else if (L.tab === 'slide') body = tabsHTML(lesson) + slideTabHTML(ctx, lesson);
    else if (L.tab === 'document') body = tabsHTML(lesson) + docTabHTML(ctx, lesson);
    else body = tabsHTML(lesson) + settingsTabHTML(ctx, lesson);

    return `<div class="cc-root cc-wide">${lessonHeaderHTML(ctx, lesson)}<div class="${L.mode === 'edit' ? '' : 'cc-view-col'}">${body}</div></div>`;
  }

  function touch(ctx, lesson, { snapshot = false } = {}) {
    L.dirty = true;
    L.saving = false;
    ctx.commit();
    clearTimeout(L.timer);

    const status = document.getElementById('cc-status');

    if (status) status.textContent = 'Autosaving...';

    L.timer = setTimeout(() => {
      if (snapshot) pushVersion(lesson, 'auto');

      L.dirty = false;
      ctx.commit();

      const node = document.getElementById('cc-status');

      if (node) node.textContent = 'Saved';
    }, 2000);
  }

  function pushVersion(lesson, kind) {
    lesson.versions = lesson.versions ?? [];

    const last = lesson.versions[0];

    if (last && last.html === (lesson.html ?? '') && last.title === lesson.title) return;

    lesson.versions.unshift({ id: `v-${Date.now()}`, at: Date.now(), kind, html: lesson.html ?? '', title: lesson.title, edits: 1 });
    lesson.versions = lesson.versions.slice(0, 30);
  }

  function setMode(ctx, mode) {
    L.mode = mode;

    const url = new URL(window.location.href);

    if (mode === 'edit') url.searchParams.set('mode', 'edit');
    else url.searchParams.delete('mode');

    window.history.replaceState(null, '', url);
  }

  function openVideoDialog(ctx, lesson) {
    const state = { tab: 'youtube', error: '' };
    const TABS = [['youtube', 'Youtube Link', 'video'], ['vimeo', 'Vimeo Link', 'video'], ['generic', 'Embed Link', 'link'], ['upload', 'Upload', 'upload'], ['library', 'Library', 'library'], ['google_drive', 'Google Drive', 'drive']];

    const draw = () => {
      const { esc } = ctx;
      const added = (lesson.videos ?? []).map((video, index) => ({ video, index })).filter(({ video }) => video.type === (state.tab === 'upload' || state.tab === 'library' ? 'upload' : state.tab));
      let form;

      if (state.tab === 'upload') {
        form = `<div class="cc-drop"><p><b>Upload Video</b></p><p class="cc-help">Select file (Mp4, MOV, AVI) to upload to your lesson. (Max 500 MB)</p><input type="file" accept="video/*" id="cc-vfile" /></div>`;
      } else if (state.tab === 'library') {
        const library = ctx.S.courses.flatMap((course) => ctx.M.lessonsOf(course).flatMap((item) => item.videos ?? [])).filter((video) => video.type === 'upload');

        form = library.length ? `<div>${library.map((video, index) => `<div class="cc-libitem"><span>${esc(video.title)}</span><button class="btn btn-outline btn-sm" type="button" data-lib="${index}">Add from library</button></div>`).join('')}</div>` : `<p class="cc-help">No videos available in your media library</p>`;
        state.library = library;
      } else if (state.tab === 'google_drive') {
        form = `<button class="btn btn-outline" type="button" data-gdrive>${ic('drive', 16)} Choose from Google Drive</button><p class="cc-help" style="margin-top:8px">Pick a video from your Google account. Anyone viewing the lesson needs access—set sharing in Drive to “Anyone with the link can view” (or your org’s equivalent).</p>`;
      } else {
        const label = state.tab === 'youtube' ? 'Youtube Link' : state.tab === 'vimeo' ? 'Vimeo Link' : 'Embed Link';

        form = `<form data-vform style="display:flex;gap:16px;align-items:flex-end"><div style="flex:1"><label class="cc-lab" for="cc-vlink">${label}</label><input class="input" id="cc-vlink" placeholder="${state.tab === 'generic' ? 'https://www.videoplayer.com/' : label}" aria-invalid="${Boolean(state.error)}" />${state.error ? `<p class="cc-err">${state.error}</p>` : ''}</div><button class="btn btn-primary" type="submit">Add Video</button></form>`;
      }

      const dlg = dialog(`<h2>Add a Video</h2><div class="cc-tabs" style="margin-top:12px">${TABS.map(([id, label, icon]) => `<button type="button" class="cc-tab${state.tab === id ? ' on' : ''}" data-vtab="${id}">${ic(icon, 16)}${label}</button>`).join('')}</div><div class="cc-modal-body" style="margin-top:12px">${form}${['youtube', 'vimeo', 'generic', 'upload'].includes(state.tab) ? `<p class="cc-help" style="margin-top:16px">Videos Added: <strong>${added.length}</strong></p>${added.map(({ video, index }) => `<div class="cc-added"><span class="cc-pill" title="${esc(video.link || video.fileName || '')}">${esc(video.fileName || video.link)}</span>${video.link ? `<button class="btn btn-secondary cc-ibtn-sm" type="button" data-copy="${esc(video.link)}" aria-label="Copy link">${ic('copy', 16)}</button>` : ''}<button class="btn btn-secondary cc-ibtn-sm" type="button" data-del="${index}" aria-label="Delete">${ic('trash', 16)}</button></div>`).join('')}` : ''}</div>`, { wide: true, label: 'Add a Video', onClose: () => ctx.rerender() });

      dlg.root.querySelectorAll('[data-vtab]').forEach((button) => button.addEventListener('click', () => {
        state.tab = button.dataset.vtab;
        state.error = '';
        draw();
      }));
      dlg.root.querySelector('[data-vform]')?.addEventListener('submit', (event) => {
        event.preventDefault();

        const links = splitLinks(dlg.root.querySelector('#cc-vlink').value);
        const bad = state.tab === 'youtube' ? 'Invalid YouTube link(s)' : state.tab === 'vimeo' ? 'Invalid Vimeo link(s)' : 'Invalid link(s)';
        const ok = links.map(normalizeUrl).filter((link) => link && (state.tab === 'youtube' ? ytId(link) : state.tab === 'vimeo' ? vimeoId(link) : true));

        if (!ok.length || ok.length !== links.length) {
          state.error = bad;
          draw();

          return;
        }

        lesson.videos = lesson.videos ?? [];

        let dupes = 0;

        ok.forEach((link) => {
          if (lesson.videos.some((video) => video.link === link)) {
            dupes += 1;

            return;
          }

          lesson.videos.push({ id: ctx.M.newId('video'), type: state.tab, link, title: state.tab === 'youtube' ? 'YouTube' : state.tab === 'vimeo' ? 'Vimeo' : new URL(link).hostname, createdAt: Date.now() });
        });
        touch(ctx, lesson);
        if (dupes) ctx.say('Duplicate videos were skipped.');

        state.error = '';
        draw();
      });
      dlg.root.querySelector('#cc-vfile')?.addEventListener('change', (event) => {
        const file = event.target.files[0];

        if (!file) return;

        if (file.size > 500 * 1024 * 1024) {
          ctx.say('Sorry we video wasn’t uploaded. The file size is too big, maximum size is 500 MB. Try again!');

          return;
        }

        lesson.videos = lesson.videos ?? [];
        lesson.videos.push({ id: ctx.M.newId('video'), type: 'upload', link: '', fileName: file.name, title: file.name, createdAt: Date.now() });
        touch(ctx, lesson);
        ctx.say('Video added (upload simulated: only the file name is kept).');
        draw();
      });
      dlg.root.querySelectorAll('[data-lib]').forEach((button) => button.addEventListener('click', () => {
        const video = state.library[Number(button.dataset.lib)];

        lesson.videos = lesson.videos ?? [];
        lesson.videos.push({ ...video, id: ctx.M.newId('video'), createdAt: Date.now() });
        touch(ctx, lesson);
        draw();
      }));
      dlg.root.querySelector('[data-gdrive]')?.addEventListener('click', () => ctx.say('Google Drive import is not set up for this deployment. Add PUBLIC_GOOGLE_PICKER_CLIENT_ID and PUBLIC_GOOGLE_PICKER_API_KEY to your environment.'));
      dlg.root.querySelectorAll('[data-copy]').forEach((button) => button.addEventListener('click', () => {
        navigator.clipboard?.writeText(button.dataset.copy).catch(() => {});
        ctx.say('Copied');
      }));
      dlg.root.querySelectorAll('[data-del]').forEach((button) => button.addEventListener('click', () => {
        lesson.videos.splice(Number(button.dataset.del), 1);
        touch(ctx, lesson);
        draw();
      }));
      dlg.root.querySelector('#cc-vlink')?.focus();
    };

    draw();
  }

  function openSlideDialog(ctx, lesson) {
    const state = { platform: '', query: '', code: '', error: '' };

    const draw = () => {
      const { esc } = ctx;
      const platform = PLATFORMS.find((entry) => entry[0] === state.platform);
      const list = PLATFORMS.filter((entry) => entry[1].toLowerCase().includes(state.query.toLowerCase()));
      const src = parseEmbed(state.code, platform);
      const dlg = dialog(`
        <h2>Add a slide</h2>
        <div class="cc-slidegrid">
          <div><input class="input" id="cc-sq" placeholder="Search platforms" value="${esc(state.query)}" />
            <div class="cc-plats">${list.map((entry) => `<button type="button" class="cc-plat${entry[0] === state.platform ? ' on' : ''}" data-plat="${entry[0]}"><b>${entry[1]}</b><small>${esc(entry[3])}</small></button>`).join('')}</div></div>
          <div>${platform ? `<p class="cc-lab">How to embed</p><ol class="cc-steps">${platform[4].map((step) => `<li>${esc(step)}</li>`).join('')}</ol>
            <label class="cc-lab" for="cc-code">Paste embed code</label><textarea class="textarea" id="cc-code" placeholder="Paste the full iframe embed code here" rows="4">${esc(state.code)}</textarea>
            ${state.error ? `<p class="cc-err">${state.error}</p>` : ''}${src ? `<p class="cc-note" style="margin-top:8px">Embed ready</p><div class="cc-embed" style="margin-top:6px"><iframe src="${esc(src)}" title="Preview" loading="lazy"></iframe></div>` : ''}` : `<p class="cc-help">Pick a platform to see step-by-step instructions and paste your embed code.</p>`}</div>
        </div>
        <div class="cc-foot cc-end"><button class="btn btn-primary btn-sm" type="button" data-add ${src ? '' : 'disabled'}>Add slide</button></div>`, { wide: true, label: 'Add a slide', onClose: () => ctx.rerender() });

      dlg.root.querySelector('#cc-sq').addEventListener('input', (event) => {
        state.query = event.target.value;
        draw();
        const input = document.getElementById('cc-sq');

        input.focus();
        input.setSelectionRange(state.query.length, state.query.length);
      });
      dlg.root.querySelectorAll('[data-plat]').forEach((button) => button.addEventListener('click', () => {
        state.platform = button.dataset.plat;
        state.error = '';
        draw();
      }));
      dlg.root.querySelector('#cc-code')?.addEventListener('input', (event) => {
        state.code = event.target.value;

        const ready = parseEmbed(state.code, platform);

        state.error = '';
        dlg.root.querySelector('[data-add]').disabled = !ready;
      });
      dlg.root.querySelector('#cc-code')?.addEventListener('change', () => {
        state.error = state.code.trim() && !parseEmbed(state.code, platform) ? (/<iframe/i.test(state.code) ? 'That embed is from a platform we do not support yet.' : 'Paste the full iframe embed code from this platform.') : '';
        draw();
      });
      dlg.root.querySelector('[data-add]').addEventListener('click', () => {
        if (!src) return;

        lesson.slides = lesson.slides ?? [];
        lesson.slides.push({ id: ctx.M.newId('slide'), platform: state.platform, src });
        touch(ctx, lesson);
        dlg.close();
      });
    };

    function parseEmbed(code, platform) {
      const match = /<iframe[^>]*\ssrc=["']([^"']+)["']/i.exec(code || '');

      if (!match || !platform) return '';

      try {
        const url = new URL(match[1], 'https://x.invalid');

        if (url.protocol !== 'https:') return '';

        return url.hostname.endsWith(platform[2]) || (platform[0] === 'powerpoint' && /office|live|sharepoint/.test(url.hostname)) ? url.href : '';
      } catch {
        return '';
      }
    }

    draw();
  }

  function openDocDialog(ctx, lesson) {
    const dlg = dialog(`<h2>Upload Document</h2><p class="cc-desc">Upload PDF, DOCX, or DOC files. Maximum size: 5MB</p><div class="cc-drop" id="cc-dz"><p>Drag and drop your document here</p><p class="cc-help">or</p><label class="btn btn-outline" for="cc-dfile">Choose File</label><input type="file" id="cc-dfile" accept=".pdf,.doc,.docx" hidden /></div><p class="cc-err" id="cc-derr" hidden></p><div class="cc-foot cc-end"><button class="btn btn-outline btn-sm" data-close type="button">Cancel</button></div>`, { label: 'Upload Document', onClose: () => ctx.rerender() });
    const err = dlg.root.querySelector('#cc-derr');

    const take = (file) => {
      if (!file) return;

      if (!/\.(pdf|docx?)$/i.test(file.name)) {
        err.textContent = 'File type not supported. Please upload PDF, DOCX, or DOC files.';
        err.hidden = false;

        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        err.textContent = 'File size too large. Maximum size is 5 MB.';
        err.hidden = false;

        return;
      }

      lesson.documents = lesson.documents ?? [];
      lesson.documents.push({ id: ctx.M.newId('doc'), name: file.name, size: file.size, type: file.name.split('.').pop().toUpperCase() });
      touch(ctx, lesson);
      ctx.say('Document uploaded successfully! (simulated: only the file name and size are kept)');
      dlg.close();
    };

    dlg.root.querySelector('#cc-dfile').addEventListener('change', (event) => take(event.target.files[0]));
    dlg.root.querySelector('#cc-dz').addEventListener('dragover', (event) => event.preventDefault());
    dlg.root.querySelector('#cc-dz').addEventListener('drop', (event) => {
      event.preventDefault();
      take(event.dataTransfer.files[0]);
    });
  }

  function openHistory(ctx, lesson) {
    const host = document.getElementById('modal-host');
    const versions = lesson.versions ?? [];
    const day = (at) => {
      const diff = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(at).setHours(0, 0, 0, 0)) / 86400000);

      return diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : new Date(at).toLocaleDateString('en-US', { dateStyle: 'medium' });
    };
    let lastDay = '';
    const rows = versions.map((version, index) => {
      const label = day(version.at);
      const head = label !== lastDay ? `<p class="cc-vgroup">${label}</p>` : '';

      lastDay = label;

      return `${head}<div class="cc-ver${index === 0 ? ' cur' : ''}"><div class="cc-ver-t"><span>${new Date(version.at).toLocaleTimeString('en-US', { timeStyle: 'short' })}</span><span class="cc-badge">${{ auto: 'Autosave', manual: 'Saved version', publish: 'Published' }[version.kind] ?? version.kind}</span></div><div class="cc-ver-m">1 edit · by ${ctx.esc(ctx.S.fullname || 'Ada Okafor')}</div>${index === 0 ? '<div class="cc-ver-m">Current version</div>' : `<button class="btn btn-outline btn-sm" type="button" data-restore="${version.id}">Restore this version</button>`}</div>`;
    });

    host.innerHTML = `<div class="cc-sheet-scrim" id="cc-sh"><aside class="cc-sheet" role="dialog" aria-label="Version history"><div class="cc-sheet-h"><h2>Version history</h2><button class="cc-modal-x" style="position:static" data-close type="button" aria-label="Close">${ic('x', 16)}</button></div><div class="cc-sheet-b">${rows.length ? rows.join('') : '<p class="cc-help" style="margin-top:16px">No versions yet</p>'}</div></aside></div>`;

    const close = () => {
      host.innerHTML = '';
    };

    host.querySelector('#cc-sh').addEventListener('click', (event) => {
      if (event.target.id === 'cc-sh') close();
    });
    host.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', close));
    host.querySelectorAll('[data-restore]').forEach((button) => button.addEventListener('click', () => {
      const version = versions.find((entry) => entry.id === button.dataset.restore);

      pushVersion(lesson, 'manual');
      lesson.html = version.html;
      lesson.title = version.title;
      lesson.versions.unshift({ id: `v-${Date.now()}`, at: Date.now(), kind: 'manual', html: version.html, title: version.title, edits: 1 });
      ctx.commit();
      close();
      setMode(ctx, 'view');
      ctx.rerender();
      ctx.say('Version restored sucessfully');
    }));
  }

  function mountNote(ctx, lesson) {
    const frame = document.getElementById('cc-note-frame');

    if (!frame) return;

    const go = () => {
      const win = frame.contentWindow;

      syncTheme(win.document);
      win.CioEditor.render(win.document.getElementById('editor-root'), {
        content: lesson.html ?? '',
        placeholder: 'Write your lesson note here',
        onChange: (html) => {
          if (html === (lesson.html ?? '')) return;

          lesson.html = html;
          touch(ctx, lesson, { snapshot: true });
        }
      });
    };

    frame.addEventListener('load', go);
  }

  function wireLesson(ctx, lesson) {
    const root = document.querySelector('.cc-root');

    wireMenus(root);

    root.addEventListener('click', async (event) => {
      const tab = event.target.closest('[data-tab]');

      if (tab) {
        L.tab = tab.dataset.tab;
        ctx.rerender();

        return;
      }

      const rmVideo = event.target.closest('[data-rm-video]');
      const rmSlide = event.target.closest('[data-rm-slide]');
      const rmDoc = event.target.closest('[data-rm-doc]');

      if (rmVideo || rmSlide || rmDoc) {
        if (!(await yesNo('Delete', 'Are you sure?'))) return;

        if (rmVideo) lesson.videos.splice(Number(rmVideo.dataset.rmVideo), 1);
        if (rmSlide) lesson.slides.splice(Number(rmSlide.dataset.rmSlide), 1);
        if (rmDoc) lesson.documents.splice(Number(rmDoc.dataset.rmDoc), 1);

        touch(ctx, lesson);
        ctx.rerender();

        return;
      }

      const act = event.target.closest('[data-act]')?.dataset.act;

      if (act === 'mode') {
        clearTimeout(L.timer);

        if (L.mode === 'edit') {
          pushVersion(lesson, 'manual');
          L.dirty = false;
          ctx.commit();
          ctx.say('Saved');
        }

        setMode(ctx, L.mode === 'edit' ? 'view' : 'edit');
        ctx.rerender();
      } else if (act === 'history') openHistory(ctx, lesson);
      else if (act === 'refresh') ctx.rerender();
      else if (act === 'lock') {
        lesson.published = !lesson.published;
        touch(ctx, lesson);
        ctx.rerender();
      } else if (act === 'delete-lesson') {
        if (!(await yesNo('Delete', 'Are you sure?'))) return;

        ctx.M.ensureCourse(ctx.course).sections.forEach((section) => {
          section.lessons = section.lessons.filter((entry) => entry.id !== lesson.id);
        });
        ctx.commit();
        ctx.say('Lesson deleted successfully');
        window.location.href = ctx.M.R.course(ctx.course.id, 'lessons');
      } else if (act === 'complete') {
        lesson.previewComplete = !lesson.previewComplete;
        ctx.commit();
        ctx.rerender();
        ctx.say(lesson.previewComplete ? 'Marked as complete' : 'Marked as incomplete');
      } else if (act === 'add-video') openVideoDialog(ctx, lesson);
      else if (act === 'add-slide') openSlideDialog(ctx, lesson);
      else if (act === 'add-doc') openDocDialog(ctx, lesson);
      else if (act === 'ai') ctx.say('AI note generation is not available in the prototype.');
      else if (act === 'save-session') {
        const url = document.getElementById('cc-rec').value.trim();
        const err = document.getElementById('cc-rec-err');

        err.hidden = !url || /^https?:\/\//i.test(url);

        if (!err.hidden) return;

        ['callUrl', 'lessonAt', 'sessionDurationMinutes', 'recordingUrl'].forEach((key) => {
          const input = root.querySelector(`[data-s="${key}"]`);

          lesson[key] = input.type === 'number' ? Number(input.value) : input.value;
        });
        ctx.commit();
        ctx.say('Session saved');
      }
    });

    root.querySelector('#cc-l-title')?.addEventListener('input', (event) => {
      lesson.title = event.target.value;
      touch(ctx, lesson);
    });

    root.querySelector('#cc-policy')?.addEventListener('change', (event) => {
      lesson.completionPolicy = event.target.value;
      touch(ctx, lesson);
      ctx.rerender();
    });
    root.querySelector('#cc-comments')?.addEventListener('change', (event) => {
      lesson.commentsEnabled = event.target.checked;
      touch(ctx, lesson);
      ctx.rerender();
    });
    root.querySelector('#cc-thr')?.addEventListener('input', (event) => {
      lesson.videoWatchThreshold = Math.min(100, Math.max(1, Number(event.target.value) || 95));
      touch(ctx, lesson);
    });
    root.querySelectorAll('[data-watch]').forEach((box) => box.addEventListener('change', () => {
      lesson.videos[Number(box.dataset.watch)].enforceWatch = box.checked;
      touch(ctx, lesson);
    }));

    if (L.mode === 'edit' && L.tab === 'note') mountNote(ctx, lesson);

    if (L.mode === 'view') {
      document.addEventListener('keydown', (event) => {
        if (event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;

        const { prev, next } = findNeighbours(ctx, lesson.id);
        const target = event.key === 'ArrowLeft' ? prev : event.key === 'ArrowRight' ? next : null;

        if (target) window.location.href = ctx.M.R.lesson(ctx.course.id, target.id);
      });
    }
  }

  /* ===================================================== EXERCISE ===================================================== */
  const EXTYPES_NEEDING_OPTIONS = ['RADIO', 'CHECKBOX'];

  function validateQuestions(questions, sections) {
    const errors = {};
    const set = (id, key, message) => {
      errors[id] = { ...(errors[id] ?? {}), [key]: message };
    };

    questions.forEach((question) => {
      if (!question.title.trim()) set(question.id, 'title', 'Question title is required');

      if (!(Number(question.points) >= 1)) set(question.id, 'points', 'Points must be at least 1');

      const options = question.options ?? [];

      if (options.some((option) => !String(option.label ?? '').trim()) && options.length) {
        if (['RADIO', 'CHECKBOX', 'TRUE_FALSE', 'THUMBS'].includes(question.questionType)) set(question.id, 'option', 'Option label is required');
      }

      if (EXTYPES_NEEDING_OPTIONS.includes(question.questionType)) {
        if (options.length < 2) set(question.id, 'option', 'Options must have at least 2 items for RADIO/CHECKBOX questions');
        else if (!options.some((option) => option.isCorrect)) set(question.id, 'option', 'Please mark an option as the correct answer');
      }

      if (question.questionType === 'WORD_BANK') {
        const template = String(question.settings?.template ?? '');
        const blanks = (template.match(/_{3,}/g) ?? []).length;

        if (blanks < 1) set(question.id, 'option', 'Word bank questions need at least one ___ blank in the template');
      }

      if (question.questionType === 'VIDEO_RECORDING') {
        const duration = Number(question.settings?.maxDurationSeconds);

        if (!(duration > 0)) set(question.id, 'option', 'Set a recording duration greater than 0 seconds');
      }
    });

    (sections ?? []).forEach((section) => {
      if (!String(section.title ?? '').trim()) set(section.id, 'title', 'This field is required');
    });

    return errors;
  }

  function exerciseSnapshot(exercise) {
    return JSON.stringify({ title: exercise.title, description: exercise.description ?? '', dueBy: exercise.dueBy ?? '', questions: exercise.questions ?? [], sections: exercise.sections ?? [] });
  }

  function exerciseHeaderHTML(ctx, exercise) {
    const questions = X.draft.questions;
    const types = questions.map((question) => question.questionType);
    const autoTypes = ['RADIO', 'CHECKBOX', 'TRUE_FALSE', 'NUMERIC', 'FILL_BLANK', 'ORDERING', 'WORD_BANK', 'STAR'];
    const badge = types.length === 0 ? '' : types.every((type) => autoTypes.includes(type)) ? '<span class="cc-badge" style="font-size:12px;padding:2px 8px;border-radius:999px">Auto-grade</span>' : '<span class="cc-badge cc-warnb" style="font-size:12px;padding:2px 8px;border-radius:999px">Manual grading required</span>';
    const questionsTab = X.tab === 'questions';

    return `
      <div class="cc-ph">
        <div class="cc-ph-main"><h1 class="cc-title" style="display:flex;flex-direction:column;gap:8px;align-items:flex-start"><span>${ctx.esc(X.draft.title || 'All Exercise')}</span>${badge}</h1></div>
        ${questionsTab ? `<div class="cc-actions">
          <span class="cc-bgroup"><button class="btn btn-outline btn-sm" type="button" data-act="add-question">${ic('plus', 16)} Add question</button><div class="cc-menu"><button class="btn btn-outline btn-sm cc-ibtn-sm" type="button" data-menu aria-label="Add" aria-haspopup="menu">${ic('down', 16)}</button><div class="cc-pop" hidden role="menu"><button type="button" role="menuitem" data-act="add-section">Add section</button></div></div></span>
          <button class="btn btn-outline btn-sm" type="button" data-act="preview">${ic(X.preview ? 'pencil' : 'eye', 16)} ${X.preview ? 'Edit' : 'Preview'}</button>
          <span class="cc-bgroup"><button class="btn btn-primary btn-sm" type="button" data-act="save-ex">Save</button><div class="cc-menu"><button class="btn btn-primary btn-sm cc-ibtn-sm" type="button" data-menu aria-label="Actions" aria-haspopup="menu">${ic('dots', 16)}</button><div class="cc-pop" hidden role="menu">
            <button type="button" role="menuitem" data-act="reorder-q">${X.reorder ? 'Done reordering' : 'Reorder Questions'}</button>
            <button type="button" role="menuitem" data-act="notify">Notify students</button><hr />
            <button type="button" role="menuitem" class="cc-danger" data-act="delete-ex">Delete Exercise</button></div></div></span>
        </div>` : ''}
      </div>`;
  }

  function exerciseSettingsHTML(ctx, exercise) {
    const policy = exercise.completionPolicy ?? 'submitted';

    return `
      <div class="cc-settings" style="max-width:36rem">
        <div class="cc-card cc-rowcard"><div><label class="cc-lab" for="cc-multi" style="margin:0">Allow multiple attempts</label><p class="cc-help">Students can submit more than once and review past attempts on the results screen.</p></div><span class="switch"><input type="checkbox" id="cc-multi" ${exercise.allowMultipleAttempts ? 'checked' : ''} /><span class="track"></span><span class="knob"></span></span></div>
        <div class="cc-card"><label class="cc-lab" for="cc-xpolicy">Completion rule</label>
          <select class="select" id="cc-xpolicy"><option value="submitted" ${policy === 'submitted' ? 'selected' : ''}>Submitted — any submission counts</option><option value="passed" ${policy === 'passed' ? 'selected' : ''}>Passed — minimum score required</option></select>
          ${policy === 'passed' ? `<p class="cc-help" style="margin-top:12px">Students must reach the passing score before this exercise counts as complete.</p><p class="cc-warnt">Manually graded submissions must be graded before they can count as passed.</p>${exercise.allowMultipleAttempts ? '' : '<p class="cc-warnt">With one attempt, failed students need instructor action before they can continue.</p>'}<div class="cc-field" style="margin-top:12px"><label class="cc-lab" for="cc-pass">Pass threshold (%)</label><input class="input" type="number" min="0" max="100" id="cc-pass" value="${exercise.passThreshold ?? 100}" style="max-width:140px" /></div>` : ''}
        </div>
        <button class="btn btn-primary" type="button" data-act="save-settings">Save settings</button>
      </div>`;
  }

  function exercisePageHTML(ctx, exercise) {
    const tabs = [['questions', 'Questions'], ['settings', 'Settings'], ['submissions', 'Submissions']];
    let body;

    if (X.tab === 'questions') body = `<iframe class="cc-frame cc-frame-ex" id="cc-ex-frame" src="editor-frame.html" title="Exercise questions"></iframe>`;
    else if (X.tab === 'settings') body = exerciseSettingsHTML(ctx, exercise);
    else body = `<div class="cc-empty"><span class="cc-empty-ic">${ic('file', 20)}</span><h3>No submissions yet</h3><p>Submissions will appear here when students complete this exercise.</p></div>`;

    return `<div class="cc-root cc-wide">${exerciseHeaderHTML(ctx, exercise)}<div class="cc-tabs" role="tablist" style="margin-bottom:16px">${tabs.map(([id, label]) => `<button type="button" role="tab" aria-selected="${X.tab === id}" class="cc-tab${X.tab === id ? ' on' : ''}" data-xtab="${id}">${label}${id === 'submissions' ? '<span class="cc-count">0</span>' : ''}</button>`).join('')}</div>${body}</div>`;
  }

  function sizeExerciseFrame() {
    const frame = document.getElementById('cc-ex-frame');

    if (!frame) return;

    const top = frame.getBoundingClientRect().top;

    frame.style.height = `${Math.max(480, window.innerHeight - top - 8)}px`;
  }

  function mountExercise(ctx, exercise) {
    const frame = document.getElementById('cc-ex-frame');

    if (!frame) return;

    frame.addEventListener('load', () => {
      const win = frame.contentWindow;

      syncTheme(win.document);
      win.document.getElementById('editor-root').className = '';
      sizeExerciseFrame();

      X.api = win.CioExercise.render(win.document.getElementById('editor-root'), {
        initial: X.draft,
        mode: X.preview ? 'preview' : 'edit',
        isFreePlan: !ctx.S.plan || ctx.S.plan === 'FREE',
        isPublicCourse: false,
        onChange: (snapshot) => {
          X.draft = { ...X.draft, ...snapshot };
          const title = document.querySelector('.cc-title span');

          if (title && title.textContent !== (snapshot.title || 'All Exercise')) title.textContent = snapshot.title || 'All Exercise';
        },
        onUpgrade: () => ctx.say('Upgrade to use this question type (simulated).')
      });

      if (!X.draft.questions.length && !X.preview) X.api.addQuestion();
    });

    if (!frameResizeBound) {
      frameResizeBound = true;
      window.addEventListener('resize', sizeExerciseFrame);
    }
  }

  function saveExercise(ctx, exercise) {
    const questions = X.draft.questions;
    const sections = X.draft.sections ?? [];
    const errors = validateQuestions(questions, sections);

    if (Object.keys(errors).length) {
      X.api?.setErrors(errors);
      ctx.say('Please fix all validation errors before saving.');

      return false;
    }

    const autoTypes = ['RADIO', 'CHECKBOX', 'TRUE_FALSE', 'NUMERIC', 'FILL_BLANK', 'ORDERING', 'WORD_BANK', 'STAR'];
    const allAuto = questions.length > 0 && questions.every((question) => autoTypes.includes(question.questionType));
    const zero = questions.filter((question) => allAuto && Number(question.points) === 0);

    if (zero.length) {
      X.api?.setErrors(Object.fromEntries(zero.map((question) => [question.id, { points: 'Points must be greater than 0 for auto-graded exercises.' }])));
      ctx.say('Set a positive point value for every question before saving.');

      return false;
    }

    if ((exercise.completionPolicy ?? 'submitted') === 'passed' && questions.reduce((total, question) => total + Number(question.points || 0), 0) <= 0) {
      ctx.say('Passed completion needs at least one point available.');

      return false;
    }

    X.api?.setErrors({});
    exercise.title = X.draft.title || exercise.title;
    exercise.description = X.draft.description ?? '';
    exercise.dueBy = X.draft.dueBy ?? '';
    exercise.questions = JSON.parse(JSON.stringify(questions)).map((question) => ({ ...question, options: (question.options ?? []).filter((option) => String(option.label ?? '').trim()) }));
    exercise.sections = JSON.parse(JSON.stringify(sections));
    X.saved = exerciseSnapshot(exercise);
    ctx.commit();
    ctx.say('Saved Successfully');

    return true;
  }

  function wireExercise(ctx, exercise) {
    const root = document.querySelector('.cc-root');

    wireMenus(root);
    mountExercise(ctx, exercise);

    window.onbeforeunload = () => (X && exerciseSnapshot(X.draft) !== X.saved ? 'You have unsaved changes. Are you sure you want to leave?' : undefined);

    root.addEventListener('click', async (event) => {
      const tab = event.target.closest('[data-xtab]');

      if (tab) {
        if (X.tab === 'questions') exercise.__keep = null;

        X.tab = tab.dataset.xtab;
        ctx.rerender();

        return;
      }

      const act = event.target.closest('[data-act]')?.dataset.act;

      if (act === 'add-question') {
        if (X.preview) {
          X.preview = false;
          const toggle = root.querySelector('[data-act="preview"]');

          if (toggle) toggle.innerHTML = `${ic('eye', 16)} Preview`;
        }

        X.api?.addQuestion();
      } else if (act === 'add-section') {
        if (X.preview) {
          X.preview = false;
          const toggle = root.querySelector('[data-act="preview"]');

          if (toggle) toggle.innerHTML = `${ic('eye', 16)} Preview`;
        }

        X.api?.addSection();
      } else if (act === 'preview') {
        X.preview = !X.preview;
        X.api?.setMode(X.preview ? 'preview' : 'edit');
        event.target.closest('[data-act="preview"]').innerHTML = X.preview ? `${ic('pencil', 16)} Edit` : `${ic('eye', 16)} Preview`;
      } else if (act === 'save-ex') saveExercise(ctx, exercise);
      else if (act === 'reorder-q') {
        if (X.api?.isSectioned()) {
          X.reorder = !X.reorder;
          X.api.setReorder(X.reorder);
          const item = root.querySelector('[data-act="reorder-q"]');

          if (item) item.textContent = X.reorder ? 'Done reordering' : 'Reorder Questions';
        } else X.api?.openOrder();
      } else if (act === 'notify') ctx.say('Notified 0 students (simulated: no students are enrolled).');
      else if (act === 'delete-ex') {
        const dlg = await yesNo('Delete Exercise', 'Are you sure you want to delete this exercise?', 'Yes, delete', 'No, cancel');

        if (!dlg) return;

        window.onbeforeunload = null;
        ctx.M.ensureCourse(ctx.course).sections.forEach((section) => {
          section.lessons = section.lessons.filter((entry) => entry.id !== exercise.id);
        });
        ctx.commit();
        ctx.say('Deleted successfully');
        window.location.href = ctx.M.R.course(ctx.course.id, 'lessons');
      } else if (act === 'save-settings') {
        if ((exercise.completionPolicy ?? 'submitted') === 'passed' && X.draft.questions.reduce((total, question) => total + Number(question.points || 0), 0) <= 0) {
          ctx.say('Passed completion needs at least one point available.');

          return;
        }

        ctx.commit();
        ctx.say('Saved Successfully');
      }
    });

    root.querySelector('#cc-multi')?.addEventListener('change', (event) => {
      exercise.allowMultipleAttempts = event.target.checked;
      ctx.rerender();
    });
    root.querySelector('#cc-xpolicy')?.addEventListener('change', (event) => {
      exercise.completionPolicy = event.target.value;
      ctx.rerender();
    });
    root.querySelector('#cc-pass')?.addEventListener('input', (event) => {
      exercise.passThreshold = Math.min(100, Math.max(0, Number(event.target.value) || 0));
    });
  }

  /* ===================================================== TAB ===================================================== */
  window.COURSE_TABS = window.COURSE_TABS || {};
  window.COURSE_TABS.lesson = {
    nav: 'content',
    title: 'Content',
    html(ctx) {
      const id = ctx.params.get('lesson');
      const item = id ? ctx.M.findLesson(ctx.course, id) : null;

      if (!item) {
        return `<div class="cc-root"><div class="cc-empty"><span class="cc-empty-ic">${ic('lesson', 20)}</span><h3>Content not found</h3><p>It may have been deleted.</p><a class="btn btn-outline" href="${ctx.esc(ctx.M.R.course(ctx.course.id, 'lessons'))}">Back to content</a></div></div>`;
      }

      if (item.kind === 'exercise') {
        if (!X || X.id !== item.id) {
          const draft = { title: item.title, description: item.description ?? '', dueBy: item.dueBy ?? '', questions: JSON.parse(JSON.stringify(item.questions ?? [])), sections: JSON.parse(JSON.stringify(item.sections ?? [])), sectionDisplayMode: item.sectionDisplayMode ?? 'one_question' };

          X = { id: item.id, tab: ctx.params.get('tab2') || 'questions', preview: false, reorder: false, draft, saved: exerciseSnapshot({ ...draft }), api: null };
        }

        X.draft.title = X.draft.title || item.title;

        return exercisePageHTML(ctx, item);
      }

      if (!L || L.id !== item.id) {
        L = { id: item.id, mode: ctx.params.get('mode') === 'edit' ? 'edit' : 'view', tab: 'video', dirty: false, saving: false, timer: 0 };

        const counts = lessonCounts(item);

        if (counts.note && !counts.video) L.tab = 'note';
      }

      return lessonPageHTML(ctx, item);
    },
    wire(ctx) {
      const id = ctx.params.get('lesson');
      const item = id ? ctx.M.findLesson(ctx.course, id) : null;

      if (!item) return;

      if (item.kind === 'exercise') wireExercise(ctx, item);
      else wireLesson(ctx, item);
    }
  };
})();
