/*
 * customize.js — stage 5, theme dock layout.
 *
 * A full-width preview of the learning portal sits above a docked strip of the real themes,
 * with a floating pill for brand name, logo and colour. Themes are the real eleven and only
 * Quartz is free (FREE_LANDING_PAGE_THEMES), so a locked tile opens the upgrade popup.
 * Quartz is rendered live from its real tokens; a premium theme can only be previewed as its
 * stock preview image — the preview says so.
 */

const P = window.proto;
const S = P.loadState();

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = P.escapeHtml;

let previewTheme = '';
let colorFormat = 'hex';
let openPop = '';

function commit() {
  P.saveState(S);
}

if (!S.prepared || S.stage < 5) {
  window.location.replace('flow.html');
}

function applyBrand() {
  document.documentElement.style.cssText = P.brandVars(S.primary);
}

function brandName() {
  return P.brandNameOf(S);
}

function paintAll() {
  paintTitle();
  paintPreview();
  paintPill();
  paintDock();
}

function paintRail() {
  $('#rail').innerHTML = `
    <div class="rail-head"><span class="of">Step 5 of ${P.STAGES.length}</span><span class="now">Customise</span></div>
    <div class="rail-segs">${P.STAGES.map(() => '<span class="rail-seg done"></span>').join('')}</div>`;
}

function paintTitle() {
  const shown = P.themeById(previewTheme || S.theme);

  $('#title').innerHTML =
    `<span>${previewTheme && previewTheme !== S.theme ? 'Previewing' : 'Preview'} · <b>${esc(shown.title)}</b></span>
    <span class="badge ${shown.free ? 'badge-success-soft' : 'badge-primary-soft'}">${shown.free ? 'Free' : 'Premium'}</span>`;
}

/* ---------- preview ---------- */
function paintPreview() {
  const shown = P.themeById(previewTheme || S.theme);
  const isPreviewOnly = Boolean(previewTheme) && previewTheme !== S.theme;
  const locked = !P.canUseTheme(shown.id, S.plan);
  const frame = shown.id === 'quartz' ? P.quartzHTML(S) : P.themeShotHTML(shown);

  const banner = isPreviewOnly
    ? `<div class="portal-banner">
        <span>${icon('eye', 14)} Previewing <b>${esc(shown.title)}</b>${shown.free ? '' : ' · Premium'}. Stock preview image, not your content.</span>
        <span style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-sm" id="exit-preview">Back to ${esc(P.themeById(S.theme).title)}</button>
          ${locked ? `<button class="btn btn-primary btn-sm" id="preview-upgrade">${icon('zap', 13)} Use this theme</button>` : '<button class="btn btn-primary btn-sm" id="preview-apply">Apply theme</button>'}
        </span>
      </div>`
    : shown.id === 'quartz'
      ? ''
      : `<div class="portal-banner"><span>${icon('info', 14)} <b>${esc(shown.title)}</b> is applied. This is its stock preview. Your name, colours and courses fill it in when published.</span></div>`;

  $('#preview').innerHTML = `${banner}
    <div class="preview-wrap"><div class="preview-chrome"><span class="shot-dot"></span><span class="shot-dot"></span><span class="shot-dot"></span><span class="preview-url">https://${esc(S.siteName || P.slugify(brandName()) || 'your-academy')}.classroomio.com</span></div>${frame}</div>`;

  $$('[data-premium]', $('#preview')).forEach((node) => {
    const run = () => openPremium(node.dataset.premium, paintPreview);

    node.addEventListener('click', run);
    node.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') run();
    });
  });

  $('#exit-preview')?.addEventListener('click', () => {
    previewTheme = '';
    paintAll();
  });
  $('#preview-upgrade')?.addEventListener('click', () => openUpgradeModal(previewTheme));
  $('#preview-apply')?.addEventListener('click', () => selectTheme(previewTheme));
}

/* ---------- floating pill: brand + colour ---------- */
function paintPill() {
  const current = S.primary.toLowerCase();
  const mark = S.logoDataUrl ? `<img src="${S.logoDataUrl}" alt="" />` : esc(P.initials(brandName()));

  $('#pill').innerHTML = `
    <button type="button" class="pill-btn" data-pop="brand" aria-expanded="${openPop === 'brand'}">
      <span class="pill-mark">${mark}</span><b>${esc(brandName())}</b>${icon('pencil', 12)}
    </button>
    <span class="pill-sep"></span>
    <span class="pill-lbl">Brand colour</span>
    <span class="swatches pill-sw" role="group" aria-label="Brand colour presets">
      ${P.COLOR_PRESETS.map((preset) => `<button type="button" class="swatch" data-hex="${preset.hex}" aria-label="${preset.label}" aria-pressed="${current === preset.hex}" style="--c:${preset.hex}" title="${preset.label}">${icon('check', 11)}</button>`).join('')}
    </span>
    <button type="button" class="pill-btn" data-pop="colour" aria-expanded="${openPop === 'colour'}">
      <i class="pill-dot" style="background:${esc(S.primary)}"></i>Custom
    </button>
    <span class="pill-sep"></span>
    <button type="button" class="pill-btn quiet" id="reset-brand">Reset</button>
    <div class="pop" id="pop" ${openPop ? '' : 'hidden'}></div>`;

  $$('#pill .swatch').forEach((button) => button.addEventListener('click', () => setPrimary(button.dataset.hex)));
  $$('#pill [data-pop]').forEach((button) =>
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      openPop = openPop === button.dataset.pop ? '' : button.dataset.pop;
      paintPill();
    })
  );
  $('#reset-brand').addEventListener('click', resetBrand);

  if (openPop === 'brand') paintBrandPop();
  if (openPop === 'colour') paintColourPop();
}

function resetBrand() {
  S.theme = P.EMPTY_STATE.theme;
  S.primary = P.DEFAULT_PRIMARY;
  S.logoDataUrl = '';
  S.brandName = S.company;
  previewTheme = '';
  openPop = '';
  commit();
  applyBrand();
  paintAll();
  P.toast('Branding reset to defaults.');
}

function paintBrandPop() {
  const pop = $('#pop');

  pop.innerHTML = `
    <div class="field"><label class="label" for="f-brand">Workspace name</label>
      <input class="input" id="f-brand" type="text" value="${esc(S.brandName || S.company)}" placeholder="Northbeam" /></div>
    <div id="logo-slot" style="margin-top:10px"></div>`;

  $('#f-brand').addEventListener('input', (event) => {
    S.brandName = event.target.value;
    commit();
    paintPreview();
    const label = $('#pill .pill-btn[data-pop="brand"] b');
    if (label) label.textContent = brandName();
    const mark = $('#pill .pill-mark');
    if (mark && !S.logoDataUrl) mark.textContent = P.initials(brandName());
  });

  paintLogo();
}

function paintLogo() {
  const slot = $('#logo-slot');
  if (!slot) return;

  if (S.logoDataUrl) {
    slot.innerHTML = `
      <div class="logo-set">
        <img src="${S.logoDataUrl}" alt="Your logo" />
        <div style="flex:1;min-width:0"><div style="font-size:12.5px;font-weight:550">Logo added</div><div class="text-muted" style="font-size:11.5px">Shown on your portal</div></div>
        <button class="btn btn-ghost btn-sm" id="logo-clear">Remove</button>
      </div>`;

    $('#logo-clear').addEventListener('click', () => {
      S.logoDataUrl = '';
      commit();
      paintPreview();
      paintPill();
    });

    return;
  }

  slot.innerHTML = `
    <label class="dropzone" id="dropzone">
      ${icon('upload', 18)}
      <div class="t">Drop your logo here</div>
      <div class="d">or click to choose · PNG, JPG or SVG</div>
      <input type="file" id="logo-input" accept="image/*" hidden />
    </label>`;

  const zone = $('#dropzone');
  const input = $('#logo-input');

  const read = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      P.toast('That file is not an image.', { error: true });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      S.logoDataUrl = String(reader.result);
      commit();
      paintPreview();
      paintPill();
    };
    reader.readAsDataURL(file);
  };

  input.addEventListener('change', () => read(input.files[0]));
  zone.addEventListener('dragover', (event) => {
    event.preventDefault();
    zone.classList.add('over');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('over'));
  zone.addEventListener('drop', (event) => {
    event.preventDefault();
    zone.classList.remove('over');
    read(event.dataTransfer.files[0]);
  });
}

function setPrimary(hex) {
  S.primary = hex;
  commit();
  applyBrand();
  paintPreview();
  paintPill();
  paintDock();
}

function paintColourPop() {
  const pop = $('#pop');
  const swatch = P.parseColor(S.primary) ? P.toHex(P.parseColor(S.primary)) : P.DEFAULT_PRIMARY;

  pop.innerHTML = `
    <div class="field" style="margin:0">
      <label class="label" for="c-primary" style="display:flex;align-items:center;justify-content:space-between">
        <span>Custom colour</span>
        <span class="fmt-toggle" role="group" aria-label="Colour format">
          <button type="button" data-fmt="hex" class="${colorFormat === 'hex' ? 'on' : ''}">HEX</button>
          <button type="button" data-fmt="rgb" class="${colorFormat === 'rgb' ? 'on' : ''}">RGB</button>
        </span>
      </label>
      <div class="color-row">
        <span class="color-swatch" style="background:${swatch}"><input type="color" value="${swatch}" aria-label="Pick a custom colour" /></span>
        <input class="input" id="c-primary" type="text" spellcheck="false" value="${esc(P.formatColor(S.primary, colorFormat))}" placeholder="${colorFormat === 'hex' ? '#1D4ED8' : 'rgb(29, 78, 216)'}" />
      </div>
      <p class="hint">Drives buttons and links on your portal and the page around it.</p>
    </div>
    <div id="contrast-note"></div>`;

  const text = $('#c-primary');
  const picker = $('input[type="color"]', pop);

  $$('.fmt-toggle button', pop).forEach((button) =>
    button.addEventListener('click', () => {
      colorFormat = button.dataset.fmt;
      paintColourPop();
    })
  );

  text.addEventListener('input', () => {
    const parsed = P.parseColor(text.value);
    const field = text.closest('.field');
    let node = field.querySelector('.err-text');

    if (!parsed) {
      text.classList.add('bad');
      if (!node) {
        node = document.createElement('p');
        node.className = 'err-text';
        field.appendChild(node);
      }
      node.textContent = 'Use a HEX value like #5B5FEF or RGB like rgb(91, 95, 239).';
      return;
    }

    text.classList.remove('bad');
    node?.remove();
    S.primary = P.toHex(parsed);
    picker.value = S.primary;
    picker.parentElement.style.background = S.primary;
    commit();
    applyBrand();
    paintPreview();
    refreshPillColour();
    paintContrast();
    paintDock();
  });

  picker.addEventListener('input', () => {
    S.primary = picker.value;
    text.value = P.formatColor(S.primary, colorFormat);
    text.classList.remove('bad');
    picker.parentElement.style.background = S.primary;
    commit();
    applyBrand();
    paintPreview();
    refreshPillColour();
    paintContrast();
  });

  paintContrast();
}

/* Update the swatches and dot without rebuilding the pill, so the open popover keeps focus. */
function refreshPillColour() {
  const current = S.primary.toLowerCase();

  $$('#pill .swatch').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.hex === current)));
  const dot = $('#pill .pill-dot');
  if (dot) dot.style.background = S.primary;
}

function paintContrast() {
  const host = $('#contrast-note');
  if (!host) return;

  const parsed = P.parseColor(S.primary);
  const ratio = parsed ? P.contrastRatio(parsed, { r: 255, g: 255, b: 255 }) : 21;

  host.innerHTML =
    ratio >= 3
      ? ''
      : `<div class="note" style="margin-top:10px">${icon('warn', 15)}<span><b>Low contrast.</b> This colour is close to white (${ratio.toFixed(1)}:1), so links on your portal will be hard to read.</span></div>`;
}

/* ---------- theme dock ---------- */
/* The dock repaints on every theme change, so the entrance only plays the first time. */
let dockEntered = false;

function paintDock() {
  const host = $('#dock');
  const entrance = dockEntered ? '' : ' m-rise';

  host.innerHTML = P.LANDING_THEMES.map((theme, index) => {
    const selected = S.theme === theme.id;
    const previewing = previewTheme === theme.id;
    const unlocked = P.canUseTheme(theme.id, S.plan);
    const label = theme.free ? 'Free' : unlocked ? 'Included' : 'Premium';
    const tagClass = theme.free || unlocked ? 'tag-free' : 'tag-premium';

    return `
      <div class="dtile${selected ? ' selected' : ''}${previewing ? ' previewing' : ''}${entrance}" style="--i:${index}" role="option" aria-selected="${selected}">
        <button type="button" class="dtile-img" data-pick="${theme.id}" aria-label="${selected ? 'Selected' : unlocked ? 'Select' : 'Upgrade to use'} ${esc(theme.title)}">
          <img src="${theme.preview}" alt="" loading="lazy" onerror="this.remove()" />
          <span class="tag ${tagClass}">${theme.free || unlocked ? '' : icon('lock', 10)}${label}</span>
          ${selected ? `<span class="tcard-check">${icon('check', 12)}</span>` : ''}
        </button>
        <div class="dtile-foot">
          <b>${esc(theme.title)}</b>
          <button type="button" class="dtile-eye" data-preview="${theme.id}" aria-label="Preview ${esc(theme.title)}" title="Preview">${icon('eye', 13)}</button>
        </div>
      </div>`;
  }).join('');

  $$('[data-pick]', host).forEach((button) => button.addEventListener('click', () => pickTheme(button.dataset.pick)));
  $$('[data-preview]', host).forEach((button) =>
    button.addEventListener('click', () => {
      previewTheme = button.dataset.preview === S.theme ? '' : button.dataset.preview;
      paintAll();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    })
  );

  $('.dtile.selected', host)?.scrollIntoView({ inline: 'center', block: 'nearest' });

  dockEntered = true;
}

function pickTheme(themeId) {
  if (!P.canUseTheme(themeId, S.plan)) {
    openUpgradeModal(themeId);
    return;
  }

  selectTheme(themeId);
}

function selectTheme(themeId) {
  S.theme = themeId;
  previewTheme = '';
  commit();
  paintAll();
}

/* ---------- starter content (rename / remove) ---------- */
function openStarterContent() {
  const paint = () => {
    $('#starter-list').innerHTML = S.courses.length
      ? S.courses
          .map(
            (course) => `
        <div class="starter-row">
          <span class="starter-cv" style="background:${P.coverFor(course.id, S.primary)}"></span>
          <input class="input" value="${esc(course.title)}" data-rename="${esc(course.id)}" aria-label="Course title" />
          <span class="badge badge-muted">Draft</span>
          <button class="btn btn-ghost btn-sm" data-remove="${esc(course.id)}">Remove</button>
        </div>`
          )
          .join('')
      : '<p class="text-muted" style="font-size:13px;margin:6px 0">No starter courses. You can create your own from the dashboard.</p>';

    $('#starter-path').innerHTML = S.path
      ? `<div class="starter-row"><span class="path-ic">${icon('route', 15)}</span><div style="flex:1"><b style="font-size:13.5px">${esc(S.path.title)}</b><div class="text-muted" style="font-size:12px">${S.path.steps.length} steps · Learning path (preview)</div></div><button class="btn btn-ghost btn-sm" data-remove-path>Remove</button></div>`
      : '';

    $$('[data-rename]').forEach((input) =>
      input.addEventListener('input', () => {
        const course = S.courses.find((item) => item.id === input.dataset.rename);
        if (course && input.value.trim()) course.title = input.value.trim();
        commit();
        paintPreview();
      })
    );
    $$('[data-remove]').forEach((button) =>
      button.addEventListener('click', () => {
        const removed = S.courses.find((item) => item.id === button.dataset.remove);
        S.courses = S.courses.filter((item) => item.id !== removed.id);
        commit();
        paint();
        paintPreview();
        P.toast(`Removed "${removed.title}".`, {
          action: 'Undo',
          onAction: () => {
            S.courses.push(removed);
            commit();
            if ($('#starter-list')) paint();
            paintPreview();
          }
        });
      })
    );
    $('[data-remove-path]')?.addEventListener('click', () => {
      S.path = null;
      commit();
      paint();
      paintPreview();
    });
  };

  mountModal(
    `
    <div style="display:flex;gap:12px;align-items:flex-start">
      <div style="flex:1"><h3 style="margin:0 0 4px">Starter content</h3>
      <p>Drafted from what you told us. Simulated, not generated by a model. Rename or remove anything; it all stays a draft until you publish.</p></div>
      <button class="icon-btn" data-close aria-label="Close" style="flex:none">${icon('x', 15)}</button>
    </div>
    <div id="starter-list" style="margin-top:14px;display:grid;gap:8px"></div>
    <div id="starter-path" style="margin-top:10px"></div>
    <div class="modal-actions">
      <button class="btn btn-ghost btn-sm" id="starter-regen">Regenerate</button>
      <button class="btn btn-primary btn-sm" id="starter-done">Done</button>
    </div>`,
    { wide: true }
  );

  paint();
  $('[data-close]', modalHost()).addEventListener('click', closeModal);
  $('#starter-done').addEventListener('click', closeModal);
  $('#starter-regen').addEventListener('click', () => {
    const next = P.recommend(S);

    S.courses = next.courses;
    S.path = next.path;
    commit();
    paint();
    paintPreview();
    P.toast('Starter content regenerated (simulated).');
  });
}

/* ---------- modals ---------- */
const modalHost = () => $('#modal-host');

function closeModal() {
  modalHost().innerHTML = '';
  document.removeEventListener('keydown', onModalKey);
}

function onModalKey(event) {
  if (event.key === 'Escape') closeModal();
}

function mountModal(html, { wide = false } = {}) {
  modalHost().innerHTML = `
    <div class="scrim" id="scrim">
      <div class="modal${wide ? ' modal-wide' : ''}" role="dialog" aria-modal="true">${html}</div>
    </div>`;

  $('#scrim').addEventListener('click', (event) => {
    if (event.target.id === 'scrim') closeModal();
  });
  document.addEventListener('keydown', onModalKey);
  $('[data-close]', modalHost())?.focus();
}

/* Every premium click opens the same pricing card (pricing.js). */
function openPremium(item, onUpgrade) {
  window.pricing.open({ state: S, item, commit, onUpgrade });
}

function openUpgradeModal(themeId) {
  window.pricing.open({
    state: S,
    item: 'theme',
    themeId,
    commit,
    onUpgrade: () => selectTheme(themeId),
    onFree: () => {
      previewTheme = '';
      paintAll();
    },
    onPreview: () => {
      previewTheme = themeId;
      paintAll();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

/* ---------- navigation ---------- */
function finishOnboarding() {
  S.completedAt = Date.now();
  S.stage = 6;
  commit();
}

function goToCourses() {
  finishOnboarding();
  try {
    localStorage.setItem('cioTourState', JSON.stringify({ active: true, step: 0 }));
  } catch {
    // the tour is optional
  }
  window.location.href = window.model.R.courses();
}

function goToAcademy() {
  finishOnboarding();
  window.location.href = window.model.R.home;
}

function wire() {
  P.initTheme();

  $('#done').addEventListener('click', goToCourses);
  $('#skip-all').addEventListener('click', goToAcademy);
  $('#starter').addEventListener('click', openStarterContent);
  $('#back').addEventListener('click', () => {
    S.stage = 4;
    commit();
    window.location.href = 'flow.html?resume=1';
  });

  document.addEventListener('click', (event) => {
    if (!openPop || event.composedPath().some((node) => node.id === 'pill')) return;

    openPop = '';
    paintPill();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !openPop) return;

    openPop = '';
    paintPill();
  });
}

applyBrand();
paintRail();
paintAll();
wire();
