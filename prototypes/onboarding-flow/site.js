/*
 * site.js — the org academy exactly as a visitor sees it: the production landing page, nothing
 * layered on top. The one addition is a floating "Edit landing page" button that opens the
 * landing editor, which only the org's admin would see.
 */
const P = window.proto;
const M = window.siteModel;
const S = P.loadState();
const isEmbed = new URLSearchParams(window.location.search).get('embed') === '1';

const $ = (selector, root = document) => root.querySelector(selector);
const esc = P.escapeHtml;

let toastTimer = 0;

function say(message) {
  const node = $('#ad-toast');

  node.textContent = message;
  node.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('on'), 3200);
}

function paintEditCta() {
  const link = document.createElement('a');

  link.className = 'ad-edit-cta';
  link.href = window.model.R.landingEditor();
  link.textContent = 'Edit landing page';
  document.body.appendChild(link);
}

function paintSite() {
  M.mount($('#site-root'), S, { includeDrafts: true });
}

document.addEventListener('click', (event) => {
  const link = event.target.closest?.('#site-root a');

  if (!link) return;

  const href = link.getAttribute('href') ?? '';
  const routes = window.model.R;

  if (isEmbed) {
    event.preventDefault();
    return;
  }

  const courseMatch = href.match(/^\/course\/([^/?#]+)/);

  if (courseMatch) {
    event.preventDefault();
    window.location.href = routes.publicCourse(courseMatch[1]);
    return;
  }

  if (href === '/courses') {
    event.preventDefault();
    window.location.href = routes.publicCatalog;
    return;
  }

  if (href.startsWith('/') || href === '#') {
    event.preventDefault();
    say('Visitors would open that page. It is outside this prototype.');
  }
});

const hasWorkspace = Boolean(S.company && S.siteName);

if (!hasWorkspace) {
  $('#site-root').innerHTML = `
    <div class="ad-none">
      <p class="ad-eyebrow">Your academy</p>
      <h1>You do not have a workspace yet</h1>
      <p>An academy lives at the address you choose when you create your workspace. Nothing is created for you until you do.</p>
      <a class="ad-btn ad-primary" href="${esc(window.model.R.onboarding)}">Create your workspace</a>
    </div>`;
} else if (isEmbed) {
  document.documentElement.classList.add('ad-embed');
  const LABELS = {
    navigation: 'Navigation',
    hero: 'Hero',
    courses: 'Courses',
    links: 'Links',
    embed: 'Embed',
    callout: 'Callout',
    footer: 'Footer'
  };
  const handle = M.mount($('#site-root'), S, {
    includeDrafts: true,
    edit: {
      onSelect: (key) => window.parent.postMessage({ type: 'landing-select', key }, '*'),
      labelFor: (key) => LABELS[key] ?? key
    }
  });

  window.addEventListener('message', (event) => {
    if (event.data?.type === 'landing-select-set') handle.select(event.data.key);
    if (event.data?.type !== 'landing-draft') return;

    handle.update(M.propsOf(S, { settings: event.data.settings, includeDrafts: true }));
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-landing-section]')) window.parent.postMessage({ type: 'landing-select', key: null }, '*');
  });
} else {
  paintSite();
  paintEditCta();
}
