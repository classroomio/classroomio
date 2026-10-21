/*
 * landing-editor.js — the landing page editor at /org/[slug]/landingpage/edit
 * (routes/(app)/org/[slug]/landingpage/edit + settings/pages/landingpage-editor). A full-screen layer: a collapsible
 * sidebar with the Page Builder list and one form per section, beside the real landing page, where each section
 * can also be clicked to select it. Edits go to a draft, show in the preview as you type and are saved with Save.
 */
const P = window.proto;
const M = window.siteModel;
const S = P.loadState();

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = P.escapeHtml;

const SVG = (paths) => `<svg viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
const IC = {
  back: SVG('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>'),
  x: SVG('<path d="M18 6 6 18M6 6l12 12"/>'),
  chev: SVG('<path d="m9 18 6-6-6-6"/>'),
  trash: SVG('<path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'),
  plus: SVG('<path d="M12 5v14M5 12h14"/>'),
  panel: SVG('<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>'),
  grip: SVG('<circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>'),
  navigation: SVG('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"/>'),
  hero: SVG('<path d="M4 12h8M4 18V6M12 18V6M17 12l3-2v8"/>'),
  courses: SVG('<path d="M12 7v14M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>'),
  links: SVG('<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/>'),
  embed: SVG('<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'),
  callout: SVG('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'),
  footer: SVG('<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>')
};

const SECTIONS = [
  { key: 'navigation', title: 'Navigation' },
  { key: 'hero', title: 'Hero' },
  { key: 'courses', title: 'Courses' },
  { key: 'links', title: 'Links' },
  { key: 'embed', title: 'Embed' },
  { key: 'callout', title: 'Callout' },
  { key: 'footer', title: 'Footer' }
];
const LINK_ICONS = {
  'help-circle': 'Help & support',
  'life-buoy': 'Support',
  'book-open': 'Documentation',
  video: 'Video / webinars',
  users: 'Community',
  'message-circle': 'Chat',
  newspaper: 'News',
  rocket: 'Get started',
  calendar: 'Events',
  mail: 'Email'
};
const PLATFORMS = {
  instagram: 'Instagram',
  x: 'X',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  youtube: 'YouTube',
  github: 'GitHub',
  tiktok: 'TikTok',
  website: 'Website'
};
const MAX_STATS = 4;
const MAX_COURSES = 6;

const query = new URLSearchParams(window.location.search);
let selected = SECTIONS.some((section) => section.key === query.get('section')) ? query.get('section') : null;
let draft = structuredClone(M.settingsOf(S));
draft.footer ??= structuredClone(window.academy.footerOf(S));
draft.footer.brand ??= { socials: [] };
draft.footer.brand.socials ??= [];
draft.footer.columns ??= [];
draft.footer.bottom ??= { text: '', links: [] };
let baseline = JSON.stringify(draft);
let previewTimer = 0;
let coursePopover = false;
let courseSearch = '';
let collapsed = false;

function say(message) {
  const node = $('#le-toast');

  node.textContent = message;
  node.classList.add('on');
  setTimeout(() => node.classList.remove('on'), 2600);
}

const isDirty = () => JSON.stringify(draft) !== baseline;

function frame() {
  return $('#le-frame').contentWindow;
}

function pushPreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => frame()?.postMessage({ type: 'landing-draft', settings: draft }, '*'), 100);
}

function touch() {
  pushPreview();
}

function save() {
  S.landing = structuredClone(draft);
  S.landingSaved = true;
  P.saveState(S);
  baseline = JSON.stringify(draft);
  say('Landing page saved');
}

function getPath(path) {
  return path.split('.').reduce((node, key) => node?.[key], draft);
}

function setPath(path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((node, key) => node[key], draft);

  target[last] = value;
}

/* ---------- field helpers ---------- */
const input = (path, { value, placeholder = '', area = false, attrs = '' } = {}) => {
  const current = value ?? getPath(path) ?? '';

  return area
    ? `<textarea class="textarea" data-bind="${path}" placeholder="${esc(placeholder)}" ${attrs}>${esc(current)}</textarea>`
    : `<input class="input" data-bind="${path}" value="${esc(current)}" placeholder="${esc(placeholder)}" ${attrs} />`;
};

const field = (label, control, desc = '') =>
  `<div class="le-field"><label class="label">${esc(label)}</label>${desc ? `<p class="le-desc">${esc(desc)}</p>` : ''}${control}</div>`;

const toggle = (id, label, on) =>
  `<div class="le-row start"><span class="switch"><input type="checkbox" id="${id}" ${on ? 'checked' : ''} /><span class="track"></span><span class="knob"></span></span><label class="label" for="${id}" style="margin:0">${esc(label)}</label></div>`;

const buttonLink = (base, labelText, hrefText, extra = {}) =>
  `${field(labelText, input(`${base}.label`, extra.label))}${field(hrefText, input(`${base}.href`, extra.href))}`;

const legend = (text) => `<h2 class="le-legend">${esc(text)}</h2>`;
const delButton = (attr, label) =>
  `<button class="btn btn-secondary btn-icon le-del" type="button" ${attr} aria-label="${esc(label)}">${IC.trash}</button>`;

/* ---------- section forms ---------- */
function heroForm() {
  const hero = draft.hero;
  const stats = hero.stats ?? [];

  return `<div class="le-stack">
    ${legend('Hero')}
    ${field('Eyebrow', input('hero.eyebrow', { placeholder: '// engineering academy' }), 'Optional label above the heading (used by templates that support it, e.g. Tech). Leave blank to hide.')}
    ${field('Heading', input('hero.heading'))}
    ${field('Subheading', input('hero.subheading', { area: true }))}
    ${buttonLink('hero.primaryAction', 'Primary Button Label', 'Primary Button Link')}
    ${toggle('secondary-on', 'Show secondary action', Boolean(hero.secondaryAction))}
    ${hero.secondaryAction ? buttonLink('hero.secondaryAction', 'Secondary Button Label', 'Secondary Button Link') : ''}
    <div class="le-field">
      <div class="le-row"><label class="label">Stats</label>
        <button class="btn btn-ghost btn-sm" type="button" id="add-stat" ${stats.length >= MAX_STATS ? 'disabled' : ''}>${IC.plus} Add stat</button></div>
      <p class="le-desc">Optional stats displayed alongside the hero (used by templates that support it, e.g. Corporate).</p>
      ${stats
        .map(
          (stat, index) => `<div class="le-row" style="align-items:flex-end">
          <div style="flex:1"><label class="label" style="font-size:12px;color:var(--muted-foreground)">Label</label>${input(`hero.stats.${index}.label`, { placeholder: 'Active students' })}</div>
          <div style="width:128px"><label class="label" style="font-size:12px;color:var(--muted-foreground)">Value</label>${input(`hero.stats.${index}.value`, { placeholder: '1,200' })}</div>
          <button class="btn btn-ghost btn-icon" type="button" data-del-stat="${index}" aria-label="Remove stat">${IC.trash}</button></div>`
        )
        .join('')}
    </div>
    <div class="le-field">
      <label class="label">Hero Image</label>
      ${hero.image ? `<img class="le-img" src="${esc(hero.image)}" alt="" />` : ''}
      <div class="le-actions">
        <button class="btn btn-outline" type="button" id="upload-hero">Upload Image</button>
        <button class="btn btn-ghost" type="button" id="clear-hero">Clear Image</button>
        <input type="file" id="hero-file" accept="image/*" hidden />
      </div>
    </div>
  </div>`;
}

function navForm() {
  return `<div class="le-stack" style="gap:28px">
    ${legend('Navigation')}
    ${draft.navItems
      .map(
        (item, index) => `<div class="le-card">
        ${delButton(`data-del-nav="${index}"`, 'Remove navigation link')}
        ${field('Link label', input(`navItems.${index}.label`))}
        ${field('Link URL', input(`navItems.${index}.href`))}
      </div>`
      )
      .join('')}
    <div><button class="btn btn-outline" type="button" id="add-nav">Add Navigation Link</button></div>
  </div>`;
}

function courseList() {
  return S.courses.map((course) => ({ id: course.id, title: course.title, published: course.published }));
}

function chosenCourses() {
  const all = courseList();

  if (!draft.courseIds) return all;

  return draft.courseIds.map((id) => all.find((course) => course.id === id)).filter(Boolean);
}

function coursesForm() {
  const chosen = chosenCourses();
  const query = courseSearch.trim().toLowerCase();
  const options = courseList().filter((course) => course.title.toLowerCase().includes(query));
  const ids = new Set(chosen.map((course) => course.id));

  return `<div class="le-stack" style="gap:16px">
    <div class="le-row">${legend('Courses').replace('margin', 'margin')}
      <button class="btn btn-secondary" type="button" id="course-add">${IC.plus} Add</button></div>
    ${
      coursePopover
        ? `<div class="le-pop">
        <p>Select courses <span class="text-muted" style="font-weight:400">(${chosen.length}/${MAX_COURSES})</span></p>
        <div style="padding:0 16px 8px"><input class="input" id="course-search" placeholder="Search courses..." value="${esc(courseSearch)}" style="height:32px;font-size:12px" /></div>
        <div style="max-height:256px;overflow-y:auto">
          ${
            courseList().length === 0
              ? '<p class="le-desc" style="text-align:center">No published courses available.</p>'
              : options.length === 0
                ? '<p class="le-desc" style="text-align:center">No courses match your search.</p>'
                : options
                    .map(
                      (course) => `<label><span>${esc(course.title)}</span>
                <input type="checkbox" data-pick="${esc(course.id)}" ${ids.has(course.id) ? 'checked' : ''} ${!ids.has(course.id) && chosen.length >= MAX_COURSES ? 'disabled' : ''} /></label>`
                    )
                    .join('')
          }
        </div></div>`
        : ''
    }
    <p class="le-desc">Drag to set the order of published courses on the landing page.</p>
    <p class="le-desc">Drag to reorder the courses shown on your landing page.</p>
    ${
      chosen.length === 0
        ? '<p class="le-desc">No courses selected.</p>'
        : `<div style="display:flex;flex-direction:column;gap:8px" id="course-list">${chosen
            .map(
              (course, index) => `<div class="le-course" draggable="true" data-course="${esc(course.id)}">
            <span class="n">${index + 1}</span><img src="course-banner.jpg" alt="" /><b>${esc(course.title)}</b>
            <span class="text-muted">${IC.grip}</span></div>`
            )
            .join('')}</div>`
    }
  </div>`;
}

function linksForm() {
  const links = draft.links;

  return `<div class="le-stack">
    <div>${legend('Links')}<p class="le-desc">Optional block of external links (help center, community, webinars) shown after courses.</p></div>
    ${toggle('links-on', 'Show links section', links.enabled)}
    ${
      links.enabled
        ? `${field('Section heading', input('links.heading', { placeholder: 'Explore more' }))}
    ${field('Description', input('links.description', { area: true, placeholder: 'Optional description' }))}
    ${field('Bold theme — button label', input('links.boldVisitLabel', { placeholder: 'Visit' }))}
    ${field('Classic theme — link label', input('links.classicLearnMoreLabel', { placeholder: 'Learn more' }))}
    ${links.cards
      .map(
        (card, index) => `<div class="le-card">
        ${links.cards.length > 1 ? delButton(`data-del-card="${index}"`, 'Remove card') : ''}
        ${field(
          'Icon',
          `<select class="select" data-bind="links.cards.${index}.icon">${Object.entries(LINK_ICONS)
            .map(([value, label]) => `<option value="${value}" ${card.icon === value ? 'selected' : ''}>${label}</option>`)
            .join('')}</select>`
        )}
        ${field('Card title', input(`links.cards.${index}.title`, { placeholder: 'e.g. Help Center' }))}
        ${field('Card description', input(`links.cards.${index}.description`, { area: true, placeholder: 'e.g. Browse guides and FAQs' }))}
        ${field('Link URL', input(`links.cards.${index}.href`, { placeholder: 'https://...' }))}
      </div>`
      )
      .join('')}
    <div><button class="btn btn-outline" type="button" id="add-card" ${links.cards.length >= 3 ? 'disabled' : ''}>Add link card</button></div>
    ${links.cards.length >= 3 ? '<p class="le-desc">Up to 3 cards</p>' : ''}`
        : ''
    }
  </div>`;
}

function embedForm() {
  const embed = draft.embed;

  return `<div class="le-stack">
    ${legend('Embed')}
    ${toggle('embed-on', 'Show embed section', embed.enabled)}
    ${
      embed.enabled
        ? `${field('Section title', input('embed.title', { placeholder: 'Section title' }))}
    ${field('Description', input('embed.description', { area: true, placeholder: 'Optional description' }))}
    ${field('Embed code', input('embed.code', { area: true, placeholder: 'Paste embed code here' }), 'Paste the full embed snippet or iframe code.')}
    ${field('Secondary Button Label', input('embed.secondaryAction.label', { value: embed.secondaryAction?.label ?? '', placeholder: 'Secondary Button Label' }))}
    ${field('Secondary Button Link', input('embed.secondaryAction.href', { value: embed.secondaryAction?.href ?? '', placeholder: 'Secondary Button Link' }))}`
        : ''
    }
  </div>`;
}

function calloutForm() {
  const callout = draft.callout;

  return `<div class="le-stack">
    ${legend('Callout')}
    ${toggle('callout-on', 'Show callout section', callout.enabled)}
    ${
      callout.enabled
        ? `${field('Heading', input('callout.heading', { placeholder: 'Enter a heading' }))}
    ${field('Description', input('callout.description', { area: true, placeholder: 'Add a short description or leave empty' }))}
    ${field('Button label', input('callout.action.label', { placeholder: 'Button text' }))}
    ${field('Button link', input('callout.action.href', { placeholder: 'https://...' }))}`
        : ''
    }
  </div>`;
}

function footerForm() {
  const footer = draft.footer;

  return `<div class="le-stack" style="gap:28px">
    ${legend('Footer')}
    <div class="le-stack" style="gap:16px">
      <div><h3 class="le-sub">Brand</h3><p class="le-desc">Your organization logo and name always appear here (from organization settings). Add optional details below.</p></div>
      ${field('Tagline', input('footer.brand.tagline', { placeholder: 'Small line under your brand' }))}
      ${field('Copyright', input('footer.brand.copyright', { placeholder: '© 2026 Your Organization' }))}
      <label class="label" style="margin:0">Social links</label>
      ${footer.brand.socials
        .map(
          (social, index) => `<div class="le-card">
          ${delButton(`data-del-social="${index}"`, 'Remove social link')}
          ${field(
            'Platform',
            `<select class="select" data-bind="footer.brand.socials.${index}.platform">${Object.entries(PLATFORMS)
              .map(([value, label]) => `<option value="${value}" ${social.platform === value ? 'selected' : ''}>${label}</option>`)
              .join('')}</select>`
          )}
          ${field('Profile URL', input(`footer.brand.socials.${index}.url`))}</div>`
        )
        .join('')}
      <div><button class="btn btn-outline" type="button" id="add-social">Add social link</button></div>
    </div>
    <div class="le-stack" style="gap:16px">
      <div><h3 class="le-sub">Link columns</h3><p class="le-desc">Add grouped links (like Company or Resources). Enables a multi-column footer layout.</p></div>
      ${footer.columns.length === 0 ? '<p class="le-desc">No columns yet — add one to show a multi-column footer beside your brand.</p>' : ''}
      ${footer.columns
        .map(
          (column, index) => `<div class="le-card col">
          ${delButton(`data-del-col="${index}"`, 'Remove column')}
          ${field('Column heading', input(`footer.columns.${index}.heading`, { placeholder: 'e.g. Company' }))}
          ${(column.links ?? [])
            .map(
              (link, linkIndex) => `<div class="le-two">
              ${input(`footer.columns.${index}.links.${linkIndex}.label`, { placeholder: 'Link label' })}
              <div class="le-row">${input(`footer.columns.${index}.links.${linkIndex}.href`, { placeholder: 'Link URL' })}
              <button class="btn btn-ghost btn-icon" type="button" data-del-link="${index}.${linkIndex}" aria-label="Remove link">${IC.trash}</button></div></div>`
            )
            .join('')}
          <div><button class="btn btn-outline btn-sm" type="button" data-add-link="${index}" ${(column.links ?? []).length >= 10 ? 'disabled' : ''}>Add link</button></div>
        </div>`
        )
        .join('')}
      <div><button class="btn btn-outline" type="button" id="add-col" ${footer.columns.length >= 6 ? 'disabled' : ''}>Add column</button></div>
    </div>
    <div class="le-stack" style="gap:16px">
      <h3 class="le-sub">Bottom row</h3>
      ${field('Footer text', input('footer.bottom.text'))}
      ${footer.bottom.links
        .map(
          (link, index) => `<div class="le-card">
          ${delButton(`data-del-bottom="${index}"`, 'Remove footer link')}
          ${field('Link label', input(`footer.bottom.links.${index}.label`))}
          ${field('Link URL', input(`footer.bottom.links.${index}.href`))}</div>`
        )
        .join('')}
      <div><button class="btn btn-outline" type="button" id="add-bottom">Add bottom link</button></div>
    </div>
  </div>`;
}

const FORMS = {
  hero: heroForm,
  navigation: navForm,
  courses: coursesForm,
  links: linksForm,
  embed: embedForm,
  callout: calloutForm,
  footer: footerForm
};

/* ---------- shell ---------- */
function paintSide() {
  const side = $('#le-side');
  const section = SECTIONS.find((item) => item.key === selected);
  const saveButton = `<button class="btn btn-outline" type="button" id="le-save">Save</button>`;
  const head = !section
    ? collapsed
      ? `<button class="btn btn-secondary btn-icon" type="button" id="le-close" aria-label="Close">${IC.x}</button>`
      : `<button class="btn btn-secondary btn-icon" type="button" id="le-close" aria-label="Close">${IC.x}</button>${saveButton}`
    : collapsed
      ? `<button class="btn btn-secondary btn-icon" type="button" id="le-back" aria-label="${esc(section.title)}">${IC.back}</button>`
      : `<div class="le-back"><button class="btn btn-secondary btn-icon" type="button" id="le-back" aria-label="Back">${IC.back}</button><h3>${esc(section.title)}</h3></div>${saveButton}`;

  side.innerHTML = `<div class="le-head">${head}</div>
    <div class="le-body">
      ${
        section
          ? `<div class="le-form" id="le-form">${FORMS[section.key]()}</div>`
          : ''
      }
      ${
        section && !collapsed
          ? ''
          : `<div class="le-group"><div class="le-group-label">Page Builder</div><ul class="le-menu">${SECTIONS.map(
              (item) =>
                `<li><button class="le-item" type="button" data-open="${item.key}" title="${esc(item.title)}">${IC[item.key]}<span>${esc(item.title)}</span><i class="chev">${IC.chev}</i></button></li>`
            ).join('')}</ul></div>`
      }
    </div>`;
  if (section && collapsed) $('.le-group', side)?.remove();
  wire(side);
}

function select(key) {
  selected = key;
  coursePopover = false;
  paintSide();
  frame()?.postMessage({ type: 'landing-select-set', key }, '*');
}

function rerender() {
  const scroll = $('.le-body')?.scrollTop ?? 0;

  paintSide();
  $('.le-body').scrollTop = scroll;
  touch();
}

function wire(side) {
  $('#le-close')?.addEventListener('click', () => {
    if (isDirty() && !window.confirm('You have unsaved changes. Are you sure you want to leave?')) return;

    window.location.href = window.model.R.home;
  });
  $('#le-back')?.addEventListener('click', () => select(null));
  $('#le-save')?.addEventListener('click', save);
  $$('[data-open]', side).forEach((button) => button.addEventListener('click', () => select(button.dataset.open)));
  $$('[data-bind]', side).forEach((control) => {
    const handler = () => {
      setPath(control.dataset.bind, control.value);
      touch();
    };

    control.addEventListener('input', handler);
    control.addEventListener('change', handler);
  });
  wireSection(side);
}

function removeAt(list, index) {
  list.splice(index, 1);
  rerender();
}

function wireSection(side) {
  const on = (selector, event, handler) =>
    $$(selector, side).forEach((node) => node.addEventListener(event, () => handler(node)));

  /* hero */
  on('#secondary-on', 'change', (node) => {
    draft.hero.secondaryAction = node.checked
      ? (JSON.parse(baseline).hero.secondaryAction ?? { label: 'Browse', href: '/courses' })
      : undefined;
    rerender();
  });
  on('#add-stat', 'click', () => {
    draft.hero.stats = [...(draft.hero.stats ?? []), { label: '', value: '' }];
    rerender();
  });
  on('[data-del-stat]', 'click', (node) => {
    draft.hero.stats.splice(Number(node.dataset.delStat), 1);
    if (!draft.hero.stats.length) draft.hero.stats = undefined;
    rerender();
  });
  on('#upload-hero', 'click', () => $('#hero-file').click());
  on('#clear-hero', 'click', () => {
    draft.hero.image = '';
    rerender();
  });
  on('#hero-file', 'change', (node) => {
    const file = node.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      draft.hero.image = reader.result;
      rerender();
    };
    reader.readAsDataURL(file);
  });

  /* navigation */
  on('#add-nav', 'click', () => {
    draft.navItems.push({ label: 'New link', href: '#' });
    rerender();
  });
  on('[data-del-nav]', 'click', (node) => removeAt(draft.navItems, Number(node.dataset.delNav)));

  /* courses */
  on('#course-add', 'click', () => {
    coursePopover = !coursePopover;
    paintSide();
  });
  on('#course-search', 'input', (node) => {
    courseSearch = node.value;
    paintSide();
    const box = $('#course-search');

    box.focus();
    box.setSelectionRange(box.value.length, box.value.length);
  });
  on('[data-pick]', 'change', (node) => {
    const ids = chosenCourses().map((course) => course.id);

    draft.courseIds = node.checked ? [...ids, node.dataset.pick] : ids.filter((id) => id !== node.dataset.pick);
    rerender();
  });
  let dragged = '';

  $$('.le-course', side).forEach((row) => {
    row.addEventListener('dragstart', () => (dragged = row.dataset.course));
    row.addEventListener('dragover', (event) => {
      event.preventDefault();
      row.classList.add('over');
    });
    row.addEventListener('dragleave', () => row.classList.remove('over'));
    row.addEventListener('drop', (event) => {
      event.preventDefault();

      const ids = chosenCourses().map((course) => course.id);
      const from = ids.indexOf(dragged);
      const to = ids.indexOf(row.dataset.course);

      if (from < 0 || to < 0) return;

      ids.splice(to, 0, ids.splice(from, 1)[0]);
      draft.courseIds = ids;
      rerender();
    });
  });

  /* links */
  on('#links-on', 'change', (node) => {
    draft.links.enabled = node.checked;
    if (node.checked && !draft.links.cards.length) {
      draft.links.cards = [{ icon: 'help-circle', title: '', description: '', href: '' }];
    }
    rerender();
  });
  on('#add-card', 'click', () => {
    draft.links.cards.push({ icon: 'help-circle', title: '', description: '', href: '' });
    rerender();
  });
  on('[data-del-card]', 'click', (node) => removeAt(draft.links.cards, Number(node.dataset.delCard)));

  /* embed + callout */
  on('#embed-on', 'change', (node) => {
    draft.embed.enabled = node.checked;
    if (node.checked && !draft.embed.title) draft.embed.title = 'Section title';
    rerender();
  });
  on('#callout-on', 'change', (node) => {
    draft.callout.enabled = node.checked;
    rerender();
  });

  /* footer */
  on('#add-social', 'click', () => {
    draft.footer.brand.socials.push({ id: M_id(), platform: 'website', url: '' });
    rerender();
  });
  on('[data-del-social]', 'click', (node) => removeAt(draft.footer.brand.socials, Number(node.dataset.delSocial)));
  on('#add-col', 'click', () => {
    draft.footer.columns.push({ id: M_id(), heading: '', links: [] });
    rerender();
  });
  on('[data-del-col]', 'click', (node) => removeAt(draft.footer.columns, Number(node.dataset.delCol)));
  on('[data-add-link]', 'click', (node) => {
    const column = draft.footer.columns[Number(node.dataset.addLink)];

    column.links = [...(column.links ?? []), { id: M_id(), label: '', href: '' }];
    rerender();
  });
  on('[data-del-link]', 'click', (node) => {
    const [column, link] = node.dataset.delLink.split('.').map(Number);

    removeAt(draft.footer.columns[column].links, link);
  });
  on('#add-bottom', 'click', () => {
    draft.footer.bottom.links.push({ id: M_id(), label: '', href: '' });
    rerender();
  });
  on('[data-del-bottom]', 'click', (node) => removeAt(draft.footer.bottom.links, Number(node.dataset.delBottom)));
}

function M_id() {
  return `l${Math.random().toString(36).slice(2, 8)}`;
}

$('#le-trigger').innerHTML = IC.panel;
$('#le-trigger').addEventListener('click', () => {
  collapsed = !collapsed;
  $('#le').classList.toggle('is-collapsed', collapsed);
  paintSide();
});
window.addEventListener('message', (event) => {
  if (event.data?.type === 'landing-select' && event.data.key !== selected) {
    selected = event.data.key;
    coursePopover = false;
    paintSide();
  }
});
$('#le-frame').addEventListener('load', () => {
  frame().postMessage({ type: 'landing-draft', settings: draft }, '*');
  if (selected) frame().postMessage({ type: 'landing-select-set', key: selected }, '*');
});
window.addEventListener('beforeunload', (event) => {
  if (isDirty()) event.preventDefault();
});

paintSide();
