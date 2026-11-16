/*
 * flow.js — onboarding stages 1-3 and the workspace preparation.
 *
 * Stages 1 (account) and 2 (verify email) are unchanged from the first prototype.
 * Stage 3 is the business screen, a sentence the user completes; submitting it runs the simulated
 * preparation and hands off to customize.html, where the workspace is customised
 * inside the real dashboard chrome.
 *
 * State lives in one object (proto.loadState) written on every change, so Back never
 * loses an answer and every later page renders what the user described.
 */

const P = window.proto;

/* Opening the flow always starts at sign-up. Only an explicit ?resume=1 (used by Back from the
 * customise screen) keeps saved progress, so a returning visitor never lands mid-journey. */
if (!new URLSearchParams(window.location.search).has('resume')) P.resetState();

const S = P.loadState();

/* ---------- tiny helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = P.escapeHtml;

function commit() {
  P.saveState(S);
}

/* ---------- visual panel (stages 1-2) ----------
 * The panel is the product's onboarding panel (testimonial-panel.svelte) in the brand: a wash
 * and dotfield, the notch, a mono eyebrow, an 800-weight headline with the swipe marker, a
 * Machine (sign-up) or the block loader (verification), and a sand testimonial card. Copy is the
 * product's own (onboarding.testimonials.*).
 */
function renderVisualPanel() {
  $('#visual-copy').innerHTML = `
    <span class="eyebrow m-rise" style="--i:0">From the teams using it</span>
    <h2 id="visual-title" class="m-rise" style="--i:1">Stop training every customer <span class="hl">by hand</span>.</h2>
    <p class="m-rise" style="--i:2">Set it up once, bulk enrol your customers through the API. Then track their progress with analytics.</p>`;

  const visual =
    S.stage === 2
      ? window.visuals.blockLoader({ label: 'Lesson, quiz and certificate blocks stacking into a course' })
      : window.visuals.machine('trainingLine', {
          label: 'A training line that moves lessons, quizzes and assignments'
        });

  window.visuals.mount($('#hero'), visual);
}

/* ---------- testimonial carousel (components/marketing/TestimonialCard) ---------- */
let tIndex = 0;
let tTimer = 0;

const QUOTE_MARK =
  '<svg class="tquote-mark" width="30" height="24" viewBox="0 0 30 24" aria-hidden="true"><path d="M0 24V14C0 6 4 1.5 12 0l1.5 3.5C9 5 7 8 7 11h5v13zm17 0V14c0-8 4-12.5 12-14l1 3.5C26 5 24 8 24 11h5v13z" fill="#adc3ff"/></svg>';

function renderTestimonials() {
  const host = $('#testimonials');
  if (!host) return;

  host.innerHTML =
    P.TESTIMONIALS.map(
      (item, index) => `
      <figure class="tslide${index === tIndex ? ' on' : ''}" data-slide="${index}">
        ${QUOTE_MARK}
        <blockquote class="tquote">${esc(item.quote)}</blockquote>
        <figcaption class="tperson">
          <span class="tavatar">${esc(P.initials(item.name))}</span>
          <span>
            <span class="tname" style="display:block">${esc(item.name)}</span>
            <span class="trole" style="display:block">${esc(item.role)}</span>
          </span>
          <span class="tco">${esc(item.company)}</span>
        </figcaption>
      </figure>`
    ).join('') +
    `<div class="tdots">${P.TESTIMONIALS.map(
      (_, index) =>
        `<button class="tdot${index === tIndex ? ' on' : ''}" data-dot="${index}" aria-label="Testimonial ${index + 1}"></button>`
    ).join('')}</div>`;

  $$('.tdot', host).forEach((dot) =>
    dot.addEventListener('click', () => {
      tIndex = Number(dot.dataset.dot);
      renderTestimonials();
      restartCarousel();
    })
  );
}

function restartCarousel() {
  clearInterval(tTimer);
  tTimer = setInterval(() => {
    tIndex = (tIndex + 1) % P.TESTIMONIALS.length;
    renderTestimonials();
  }, 6500);
}

/* ---------- stage rail ---------- */
function renderRail() {
  const rail = $('#rail');
  if (!rail) return;

  const stage = P.STAGES.find((item) => item.n === S.stage);

  rail.innerHTML = `
    <div class="rail-head">
      <span class="of">Step ${S.stage} of ${P.STAGES.length}</span>
      <span class="now">${esc(stage.label)}</span>
    </div>
    <div class="rail-segs">
      ${P.STAGES.map((item) => `<span class="rail-seg${item.n <= S.stage ? ' done' : ''}"></span>`).join('')}
    </div>`;
}

/* ---------- field helper ---------- */
function fieldError(input, message) {
  const field = input.closest('.field') || input.parentElement;
  let node = field.querySelector('.err-text');

  if (!message) {
    input.classList.remove('bad');
    node?.remove();
    return;
  }

  input.classList.add('bad');
  if (!node) {
    node = document.createElement('p');
    node.className = 'err-text';
    field.appendChild(node);
  }
  node.textContent = message;
}

/* ============================================================
 * Stage 1 — Create your account
 * ============================================================ */
function renderAccount() {
  $('#split-stage').innerHTML = `
    <h1 style="font-size:26px;font-weight:650;letter-spacing:-0.03em;margin:0 0 7px">Create your account</h1>
    <p class="text-muted" style="font-size:14px;margin:0 0 26px;line-height:1.6">
      Launch a branded academy for your customers. Free for your first 20 learners, no card required.
    </p>

    <button class="btn btn-outline" id="google" style="width:100%">
      <svg viewBox="0 0 24 24" style="width:16px;height:16px" aria-hidden="true">
        <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.6Z"/>
        <path fill="#34A853" d="M12 23.5c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3C3.7 20.9 7.6 23.5 12 23.5Z"/>
        <path fill="#FBBC05" d="M5.6 14.2a6.9 6.9 0 0 1 0-4.4v-3H1.8a11.5 11.5 0 0 0 0 10.4l3.8-3Z"/>
        <path fill="#EA4335" d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.3 15.1.3 12 .3 7.6.3 3.7 2.9 1.8 6.8l3.8 3C6.5 7.1 9 4.8 12 4.8Z"/>
      </svg>
      Continue with Google
    </button>
    <div class="or">or</div>

    <div class="field">
      <label class="label" for="f-name">Full name</label>
      <input class="input" id="f-name" type="text" autocomplete="name" placeholder="Joke Silva" value="${esc(S.fullname)}" />
    </div>

    <div class="field">
      <label class="label" for="f-email">Work email</label>
      <input class="input" id="f-email" type="email" autocomplete="email" placeholder="you@yourcompany.com" value="${esc(S.email)}" />
    </div>

    <div class="field">
      <label class="label" for="f-pass">Password</label>
      <input class="input" id="f-pass" type="password" autocomplete="new-password" placeholder="At least 8 characters" value="${esc(S.password)}" />
      <div class="pw-meter" id="pw-meter" aria-hidden="true"><span></span><span></span><span></span></div>
    </div>

    <label class="field" style="display:flex;gap:10px;align-items:flex-start;cursor:pointer;margin-top:14px">
      <input type="checkbox" id="f-terms" style="margin-top:2px;width:15px;height:15px;accent-color:var(--primary)" />
      <span style="font-size:12.5px;line-height:1.5;color:var(--muted-foreground)">
        I agree to the <a href="https://classroomio.com/terms" target="_blank" rel="noopener" class="text-primary">Terms of Service</a>
        and <a href="https://classroomio.com/privacy" target="_blank" rel="noopener" class="text-primary">Privacy Policy</a>.
      </span>
    </label>
    <div id="terms-err"></div>

    <button class="btn btn-primary btn-lg" id="create" style="width:100%;margin-top:18px">Create account</button>

    <p class="text-muted" style="font-size:13px;text-align:center;margin:18px 0 0">
      Already have an account? <a href="#" class="text-primary" id="signin">Sign in</a>
    </p>`;

  const name = $('#f-name');
  const email = $('#f-email');
  const pass = $('#f-pass');
  const terms = $('#f-terms');

  const meter = () => {
    const value = pass.value;
    const score = (value.length >= 8 ? 1 : 0) + (/[^a-zA-Z]/.test(value) ? 1 : 0) + (value.length >= 12 ? 1 : 0);

    $$('#pw-meter span').forEach((bar, index) => {
      bar.className = index < score ? (score === 1 ? 'weak' : 'on') : '';
    });
  };

  name.addEventListener('input', () => {
    S.fullname = name.value;
    fieldError(name, '');
    commit();
  });
  email.addEventListener('input', () => {
    S.email = email.value;
    fieldError(email, '');
    commit();
  });
  pass.addEventListener('input', () => {
    S.password = pass.value;
    fieldError(pass, '');
    meter();
    commit();
  });
  terms.addEventListener('change', () => ($('#terms-err').innerHTML = ''));
  meter();

  $('#google').addEventListener('click', () => {
    S.googleSignup = true;
    S.fullname = S.fullname || 'Ada Okafor';
    S.email = S.email || 'ada@northbeam.io';
    commit();
    P.toast('Simulated Google sign-up. No OAuth request was made.');
    startVerification();
  });

  $('#signin').addEventListener('click', (event) => {
    event.preventDefault();
    P.toast('Sign in is outside this prototype. It already exists at /login.');
  });

  $('#create').addEventListener('click', () => {
    let ok = true;

    if (S.fullname.trim().length < 5) {
      fieldError(name, 'Enter your full name (at least 5 characters).');
      ok = false;
    }
    if (!P.isEmail(S.email)) {
      fieldError(email, 'Enter a valid work email address.');
      ok = false;
    }
    if (S.password.length < 8) {
      fieldError(pass, 'Passwords must be at least 8 characters.');
      ok = false;
    }
    if (!terms.checked) {
      $('#terms-err').innerHTML = '<p class="err-text">Please accept the terms to continue.</p>';
      ok = false;
    }

    if (!ok) return;

    startVerification();
  });
}

function startVerification() {
  S.verifyRequestedAt = Date.now();
  S.stage = 2;
  commit();
  render();
}

/* ============================================================
 * Stage 2 — Verify your email
 *
 * ClassroomIO verifies by LINK, not by code: verify-email-modal.svelte calls
 * authClient.sendVerificationEmail({ callbackURL }) and waits for the click.
 * The brief's six-digit input is therefore deliberately not built — see README.
 * ============================================================ */
const RESEND_SECONDS = 120;
let verifyTimer = 0;

function renderVerify() {
  $('#split-stage').innerHTML = `
    <div style="width:52px;height:52px;border-radius:var(--radius-xl);display:grid;place-items:center;background:color-mix(in oklab,var(--primary) 12%,transparent);color:var(--primary);margin-bottom:20px">
      ${icon('mail', 24)}
    </div>

    <h1 style="font-size:26px;font-weight:650;letter-spacing:-0.03em;margin:0 0 7px">Check your inbox</h1>
    <p class="text-muted" style="font-size:14px;margin:0 0 24px;line-height:1.6">
      We sent a verification link to <b style="color:var(--foreground)">${esc(S.email)}</b>.
      Open it and your workspace setup picks up right where you left off.
    </p>

    <div class="note quiet" style="margin-bottom:22px">
      ${icon('info', 15)}
      <span><b>Link, not a code.</b> ClassroomIO verifies by emailed link today, so there is no six-digit field to fill in here.</span>
    </div>

    <button class="btn btn-primary btn-lg" id="simulate" style="width:100%">Simulate clicking the link</button>
    <p class="text-muted" style="font-size:11.5px;text-align:center;margin:8px 0 0">Prototype control. Stands in for the click in your real inbox.</p>

    <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:22px;font-size:13px">
      <span class="text-muted">Didn't get it?</span>
      <button class="btn btn-ghost btn-sm" id="resend">Resend email</button>
    </div>

    <p class="text-muted" style="font-size:13px;text-align:center;margin:18px 0 0">
      Wrong address? <a href="#" class="text-primary" id="change-email">Use a different email</a>
    </p>`;

  $('#simulate').addEventListener('click', () => {
    S.verified = true;
    S.stage = 3;
    commit();
    clearInterval(verifyTimer);
    render();
    P.toast('Email verified.');
  });

  $('#change-email').addEventListener('click', (event) => {
    event.preventDefault();
    S.stage = 1;
    commit();
    clearInterval(verifyTimer);
    render();
  });

  $('#resend').addEventListener('click', () => {
    S.verifyRequestedAt = Date.now();
    commit();
    P.toast('Verification email sent again (simulated).');
    tickResend();
  });

  tickResend();
}

function tickResend() {
  clearInterval(verifyTimer);

  const paint = () => {
    const button = $('#resend');
    if (!button) {
      clearInterval(verifyTimer);
      return;
    }

    const elapsed = Math.floor((Date.now() - S.verifyRequestedAt) / 1000);
    const left = RESEND_SECONDS - elapsed;

    if (left <= 0) {
      button.disabled = false;
      button.textContent = 'Resend email';
      clearInterval(verifyTimer);
      return;
    }

    button.disabled = true;
    button.textContent = `Resend in ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  };

  paint();
  verifyTimer = setInterval(paint, 1000);
}

/* ============================================================
 * Stage 4 — Workspace
 *
 * The production org-setup step: the name of the organisation and the academy subdomain, with the
 * same rules (5 or more characters, no leading or trailing hyphen, the blocked list, a taken name).
 * The subdomain follows the name until it is edited. A restrained fragment of the academy beside
 * the form shows the address and the name as they are typed. The user's full name was collected at
 * sign-up, so it is not asked again.
 * ============================================================ */
const BLOCKED_SUBDOMAINS = [
  'academy',
  'app',
  'apps',
  'blog',
  'build',
  'campaign',
  'church',
  'cloud',
  'community',
  'conference',
  'course',
  'courses',
  'demo',
  'dev',
  'embed',
  'embeds',
  'forum',
  'group',
  'groups',
  'help',
  'launch',
  'launchweek',
  'mobile',
  'play',
  'prod',
  'production',
  'schools',
  'stage',
  'staging',
  'support',
  'www',
  'mail',
  'api',
  'admin'
];
const TAKEN_SUBDOMAINS = ['northbeam', 'udemy-test', 'coursera-test', 'skillshare-test'];

function siteNameFrom(value) {
  return value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '');
}

function paintWorkspacePreview() {
  const name = S.company.trim();
  const site = S.siteName || 'your-academy';

  $('#ws-url').innerHTML = `https://<b>${esc(site)}</b>.classroomio.com`;
  $('#ws-brand').textContent = name || 'Your academy';
  $('#ws-brand').classList.toggle('ph', !name);
  $('#ws-hero').textContent = name || 'Your academy';
  $('#ws-hero').classList.toggle('ph', !name);
  $('#ws-mark').textContent = (name || 'Y').trim().charAt(0).toUpperCase();
}

function renderWorkspace() {
  if (!S.siteName && S.company) S.siteName = siteNameFrom(S.company);

  $('#setup-stage').innerHTML = `
    <div class="ws">
      <div class="ws-main">
        <p class="eyebrow-mono m-rise" style="--i:0">Your workspace</p>
        <h1 class="ws-title m-rise" style="--i:1">Set up your <span class="swipe">academy</span></h1>
        <p class="ws-sub m-rise" style="--i:2">This is the name and address your customers will see.</p>

        <div class="ws-form m-rise" style="--i:3">
          <div class="field">
            <label class="label" for="ws-name">Name of Organization</label>
            <input class="input" id="ws-name" autocomplete="organization" placeholder="e.g My School Name" value="${esc(S.company)}" />
          </div>
          <div class="field">
            <label class="label" for="ws-site">Academy subdomain</label>
            <div class="ws-addr"><i>https://</i><input id="ws-site" autocomplete="off" spellcheck="false" placeholder="myschool" value="${esc(S.siteName)}" /><span>.classroomio.com</span></div>
          </div>
        </div>
        <p class="ws-who m-rise" style="--i:4">Signed in as <b>${esc(S.fullname || 'you')}</b>${S.email ? `, ${esc(S.email)}` : ''}.</p>
      </div>

      <aside class="ws-side m-fade" aria-label="Your academy, as visitors will see it">
        <div class="ws-brw">
          <div class="ws-bar"><i></i><i></i><i></i><span class="ws-url" id="ws-url"></span></div>
          <div class="ws-nav"><span class="ws-mark" id="ws-mark"></span><b id="ws-brand"></b><em>Courses</em></div>
          <div class="ws-hero"><h2 id="ws-hero"></h2><span class="ws-sk" style="width:62%"></span><span class="ws-sk" style="width:44%"></span><span class="ws-btns"><u></u><u></u></span></div>
          <div class="ws-row"><span class="ws-th"></span><span><span class="ws-sk" style="width:200px"></span><span class="ws-sk soft" style="width:140px"></span></span></div>
        </div>
        <p class="ws-cap">Your academy, as visitors will see it</p>
      </aside>
    </div>`;

  const name = $('#ws-name');
  const site = $('#ws-site');

  name.addEventListener('input', () => {
    S.company = name.value;
    S.brandName = name.value;
    if (!S.siteNameTouched) {
      S.siteName = siteNameFrom(name.value);
      site.value = S.siteName;
    }

    fieldError(name, '');
    fieldError(site.closest('.ws-addr'), '');
    commit();
    paintWorkspacePreview();
  });

  site.addEventListener('input', () => {
    S.siteNameTouched = true;
    S.siteName = siteNameFrom(site.value);
    site.value = S.siteName;
    fieldError(site.closest('.ws-addr'), '');
    commit();
    paintWorkspacePreview();
  });

  [name, site].forEach((input) =>
    input.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;

      event.preventDefault();
      goNext();
    })
  );

  paintWorkspacePreview();
  if (!S.company) name.focus();
}

function validateWorkspace() {
  const name = $('#ws-name');
  const addr = $('#ws-site').closest('.ws-addr');
  const orgName = S.company.trim();
  const site = S.siteName;
  const hyphenEnds = (value) => /^-|-$/.test(value);
  let ok = true;

  if (orgName.length < 5) {
    fieldError(name, 'Organization must contain 5 or more characters');
    ok = false;
  } else if (hyphenEnds(orgName)) {
    fieldError(name, 'Organization name cannot start or end with a hyphen');
    ok = false;
  }

  if (BLOCKED_SUBDOMAINS.includes(site)) {
    fieldError(addr, 'Sitename already exists.');
    ok = false;
  } else if (site.length < 5) {
    fieldError(addr, 'Academy subdomain must contain 5 or more characters');
    ok = false;
  } else if (hyphenEnds(site)) {
    fieldError(addr, 'Academy subdomain cannot start or end with a hyphen');
    ok = false;
  } else if (TAKEN_SUBDOMAINS.includes(site)) {
    fieldError(addr, `Site name '${site}' already exists`);
    ok = false;
  }

  if (!ok) ($('.bad', $('#setup-stage')) ?? name).focus?.();

  return ok;
}

/* ============================================================
 * Stage 3 — About your business
 *
 * Five sections in one accordion: first outcome, website or description, team, how customers learn today and how they heard of us (optional).
 * The section that needs an answer opens by itself and a finished one folds to a summary line, so
 * there is never a decision about what to open next. Each answer drops a block into the workspace
 * stack beside it. There is no preview here.
 * ============================================================ */
const OUTCOME_GOALS = ['onboard', 'understand', 'adoption', 'deflect'];
const QUICK_ROLES = ['founder', 'customer-success', 'customer-education', 'product'];
const SECTIONS = [
  { id: 'outcome', n: '01', title: 'First outcome', missing: 'Choose a first outcome.' },
  { id: 'website', n: '02', title: 'Your business', missing: 'Add your website or describe what you offer.' },
  { id: 'team', n: '03', title: 'Your team', missing: 'Choose your role and company size.' },
  { id: 'today', n: '04', title: 'How customers learn today', missing: 'Choose how customers learn today.' },
  { id: 'source', n: '05', title: 'How did you hear about us?', optional: true, missing: '' }
];
const SHORT_LEARN = {
  'self-serve': 'On their own',
  'live-onboarding': 'Live sessions',
  'help-docs': 'Help docs',
  'no-training': 'No training yet'
};
const ADVANCE_MS = 300;
const SITE_PATTERN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}(?::\d{1,5})?(?:[/?#]\S*)?$/i;
const RESERVED_TLDS = ['test', 'example', 'invalid', 'localhost', 'local'];
const SITE_INVALID = "That link doesn't look right. Check the spelling, or describe your product or service instead.";

function isValidSite(value) {
  const host = value
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '');
  const tld = host.split(/[/?#:]/)[0].split('.').pop().toLowerCase();

  return SITE_PATTERN.test(host) && !RESERVED_TLDS.includes(tld);
}

let openSection = '';
let advanceTimer = 0;
const stackSeen = {};

function goalById(id) {
  return P.GOALS.find((goal) => goal.id === id);
}

function roleById(id) {
  return P.ROLES.find((role) => role.id === id);
}

function optionById(list, id) {
  return list.find((item) => item.id === id);
}

function roleChip(role) {
  return `<button type="button" class="chip ob-role" data-role="${role.id}" aria-pressed="${S.role === role.id}">${esc(role.label)}</button>`;
}

function isSkipped(id) {
  return Boolean(S.skipped?.[id]);
}

function sectionDone(id) {
  if (id === 'outcome') return S.goals.length > 0;
  if (id === 'website') {
    if (S.skipContext) return true;
    if (S.siteMode === 'describe') return S.description.trim().length > 0;

    return S.website.trim().length > 0 && isValidSite(S.website);
  }
  if (id === 'team') return Boolean(S.role && S.companySize);
  if (id === 'source') {
    if (!S.source) return false;
    if (S.source === 'ai')
      return Boolean(S.aiProvider) && (S.aiProvider !== 'other' || S.aiProviderOther.trim().length > 0);
    if (S.source === 'other') return S.sourceOther.trim().length > 0;

    return true;
  }

  return Boolean(S.learningMethod);
}

function sectionSummary(id) {
  if (id === 'outcome') return goalById(S.goals[0])?.label ?? '';
  if (id === 'website' && S.skipContext) return 'Skipped, generic starter set';
  if (id === 'website') return (S.siteMode === 'describe' ? S.description : S.website).trim();
  if (id === 'team')
    return [roleById(S.role)?.label, optionById(P.COMPANY_SIZES, S.companySize)?.label].filter(Boolean).join(', ');

  if (id === 'source') {
    const source = optionById(P.SOURCES, S.source)?.label ?? '';
    const provider = S.source === 'ai' ? optionById(P.AI_PROVIDERS, S.aiProvider)?.label : '';

    return S.source === 'other' ? S.sourceOther.trim() : [source, provider].filter(Boolean).join(', ');
  }

  return optionById(P.LEARNING_METHODS, S.learningMethod)?.label ?? '';
}

function nextSectionAfter(id) {
  const start = SECTIONS.findIndex((section) => section.id === id);
  const ordered = [...SECTIONS.slice(start + 1), ...SECTIONS.slice(0, start + 1)];

  return ordered.find((section) => !sectionDone(section.id) && !(section.optional && isSkipped(section.id)))?.id ?? '';
}

function requiredSections() {
  return SECTIONS.filter((section) => !section.optional);
}

function stackItems() {
  return [
    { key: 'workspace', kind: 'WORKSPACE', tone: 'ink', width: 300, value: S.company.trim(), empty: 'Your academy' },
    {
      key: 'outcome',
      kind: 'FIRST OUTCOME',
      tone: 'blue',
      width: 340,
      value: goalById(S.goals[0])?.label ?? '',
      empty: 'Choose a first outcome'
    },
    {
      key: 'team',
      kind: 'TEAM',
      tone: 'tint',
      width: 300,
      value: optionById(P.COMPANY_SIZES, S.companySize)?.label ?? '',
      empty: 'Choose a size'
    },
    {
      key: 'role',
      kind: 'ROLE',
      tone: 'sand',
      width: 340,
      value: roleById(S.role)?.label ?? '',
      empty: 'Choose a role'
    },
    {
      key: 'today',
      kind: 'TODAY',
      tone: 'sand',
      width: 300,
      value: SHORT_LEARN[S.learningMethod] ?? '',
      empty: 'Choose one'
    }
  ];
}

function stackMarkup() {
  return stackItems()
    .map((item, index) => {
      const filled = Boolean(item.value);

      return `<div class="blk tone-${item.tone}${filled ? '' : ' blk-empty'}" data-stack="${item.key}" style="--w:${item.width}px;--n:${index};z-index:${index + 1}">
        <div class="blk-face${filled ? ' notch-cutout' : ''}"><span class="blk-kind">${esc(item.kind)}</span><b class="blk-title">${esc(item.value || item.empty)}</b></div>
        ${filled && index > 0 ? '<span class="blk-tab" aria-hidden="true"></span>' : ''}
      </div>`;
    })
    .join('');
}

function paintStack() {
  const host = $('#st-stack');
  if (!host) return;

  const items = stackItems();
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!host.children.length) host.innerHTML = stackMarkup();

  const fresh = document.createElement('div');
  fresh.innerHTML = stackMarkup();

  items.forEach((item) => {
    const current = $(`[data-stack="${item.key}"]`, host);
    const next = $(`[data-stack="${item.key}"]`, fresh);

    if (stackSeen[item.key] === item.value && current) return;

    const changed = item.key in stackSeen || Boolean(item.value);
    stackSeen[item.key] = item.value;
    current.replaceWith(next);

    if (item.value && changed && !reduce) {
      next.classList.add('drop');
      next.addEventListener('animationend', () => next.classList.remove('drop'), { once: true });
    }
  });

  const count = items.filter((item) => item.value).length;
  $('#st-count').textContent = `Your workspace, ${count} of ${items.length} blocks`;
}

function paintSections() {
  SECTIONS.forEach((section) => {
    const node = $(`.acc[data-sec="${section.id}"]`);
    const done = sectionDone(section.id);
    const open = openSection === section.id;

    node.classList.toggle('open', open);
    node.classList.toggle('done', done);
    $('.acc-body', node).hidden = !open;
    $('.acc-h', node).setAttribute('aria-expanded', String(open));
    $('.acc-sum', node).textContent = (done || isSkipped(section.id)) && !open ? sectionSummary(section.id) : '';
    $('.acc-state', node).innerHTML = done
      ? `<i class="tick">${icon('check', 11)}</i>`
      : open && !section.optional
        ? '<span class="tag-mono">Now</span>'
        : '';
  });

  paintStack();
}

function openSectionById(id, { focus = true } = {}) {
  clearTimeout(advanceTimer);
  openSection = id;
  $('#st-err').textContent = '';
  paintSections();

  if (!id) return;

  const node = $(`.acc[data-sec="${id}"]`);

  node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  if (focus && id === 'website') (S.siteMode === 'describe' ? $('#f-desc') : $('#f-site')).focus({ preventScroll: true });
}

function advanceFrom(id) {
  clearTimeout(advanceTimer);
  paintSections();
  advanceTimer = setTimeout(() => {
    const next = nextSectionAfter(id);

    openSectionById(next);
    if (!next) $('#next').focus({ preventScroll: true });
  }, ADVANCE_MS);
}

function renderBusiness() {
  const moreRoles = P.ROLES.filter((role) => !QUICK_ROLES.includes(role.id));
  const moreSelected = moreRoles.find((role) => role.id === S.role);

  openSection = requiredSections().find((section) => !sectionDone(section.id))?.id ?? '';
  Object.keys(stackSeen).forEach((key) => delete stackSeen[key]);

  const body = {
    outcome: `
      <div class="st-tiles" id="goals" role="radiogroup" aria-label="First outcome">
        ${OUTCOME_GOALS.map((id, index) => {
          const goal = goalById(id);

          return `
          <button type="button" class="ob-block" role="radio" data-goal="${id}" aria-checked="${S.goals[0] === id}">
            <span class="ob-face notch-cutout">
              <span class="ob-kind">${String(index + 1).padStart(2, '0')}</span>
              <b>${esc(goal.label)}</b>
              <small>${esc(goal.yields)}</small>
            </span>
          </button>`;
        }).join('')}
      </div>`,
    website: `
      <p class="acc-hint">Used to pick a starter category. Nothing is fetched or analysed.</p>
      <div class="seg2" role="group" aria-label="Website or description" id="site-mode">
        <button type="button" data-mode="link" class="${S.siteMode === 'describe' ? '' : 'on'}" aria-pressed="${S.siteMode !== 'describe'}">I have a website</button>
        <button type="button" data-mode="describe" class="${S.siteMode === 'describe' ? 'on' : ''}" aria-pressed="${S.siteMode === 'describe'}">I don't have one</button>
      </div>
      <div class="field" id="site-link-field"${S.siteMode === 'describe' ? ' hidden' : ''}>
        <label class="label" for="f-site">Website</label>
        <input class="input" id="f-site" autocomplete="url" placeholder="northbeam.io" value="${esc(S.website)}" />
      </div>
      <div class="field" id="site-desc-field"${S.siteMode === 'describe' ? '' : ' hidden'}>
        <label class="label" for="f-desc">Describe your product or service</label>
        <textarea class="textarea" id="f-desc" rows="3" maxlength="300" placeholder="What do you offer and who uses it?">${esc(S.description)}</textarea>
      </div>
      <div class="field">
        <span class="label" id="path-label">Starter path <span class="text-muted">(optional)</span></span>
        <div class="ob-roles" role="group" aria-labelledby="path-label" id="paths">
          ${P.PATH_CHOICES.map(
            (choice) =>
              `<button type="button" class="chip" data-path="${choice.id}" aria-pressed="${S.pathChoice === choice.id}">${esc(choice.label)}</button>`
          ).join('')}
        </div>
        <p class="acc-hint" style="margin:6px 0 0">Leave it empty and we choose from what you tell us.</p>
      </div>
      <div class="st-actions">
        <button type="button" class="btn btn-secondary btn-sm" id="website-next">Next</button>
        <button type="button" class="btn btn-ghost btn-sm" id="website-skip">Skip website analysis</button>
      </div>`,
    team: `
      <div class="field">
        <span class="label" id="role-label">You are</span>
        <div class="ob-roles" role="group" aria-labelledby="role-label" id="roles">
          ${P.ROLES.filter((role) => QUICK_ROLES.includes(role.id))
            .map(roleChip)
            .join('')}
          <span class="ob-more">
            <button type="button" class="chip" id="role-more" aria-haspopup="listbox" aria-expanded="false" aria-pressed="${Boolean(moreSelected)}">
              ${esc(moreSelected?.label ?? 'More')} ${icon('chevdown', 12)}
            </button>
            <span class="bz-menu" id="role-menu" role="listbox" hidden>
              ${moreRoles
                .map(
                  (role) =>
                    `<button type="button" role="option" class="bz-opt" data-role="${role.id}" aria-selected="${S.role === role.id}">${icon(role.icon, 16)}<span>${esc(role.label)}</span></button>`
                )
                .join('')}
            </span>
          </span>
        </div>
      </div>
      <div class="field">
        <span class="label" id="size-label">Company size</span>
        <div class="ob-roles" role="group" aria-labelledby="size-label" id="sizes">
          ${P.COMPANY_SIZES.map(
            (item) =>
              `<button type="button" class="chip" data-size="${item.id}" aria-pressed="${S.companySize === item.id}">${esc(item.label)}</button>`
          ).join('')}
        </div>
      </div>`,
    source: `
      <p class="acc-hint">It helps a small team know what's working.</p>
      <div class="ob-roles" role="group" aria-label="How you heard about ClassroomIO" id="sources">
        ${P.SOURCES.map(
          (item) =>
            `<button type="button" class="chip" data-source="${item.id}" aria-pressed="${S.source === item.id}">${esc(item.label)}</button>`
        ).join('')}
      </div>
      <div class="st-extra" id="source-extra" hidden></div>
      <div class="st-actions"><button type="button" class="btn btn-ghost btn-sm" id="source-skip">Skip</button></div>`,
    today: `
      <div class="ob-roles" role="group" aria-label="How customers learn today" id="learning">
        ${P.LEARNING_METHODS.map(
          (item) =>
            `<button type="button" class="chip" data-learn="${item.id}" aria-pressed="${S.learningMethod === item.id}">${esc(item.label)}</button>`
        ).join('')}
      </div>`
  };

  $('#setup-stage').innerHTML = `
    <div class="st">
      <div class="st-main">
        <p class="eyebrow-mono ob-eyebrow m-rise" style="--i:0">About your business</p>
        <h1 class="st-title m-rise" style="--i:1">Tell us about <span class="swipe">your team</span></h1>
        <p class="st-sub m-rise" style="--i:2">Each answer drops a block into your workspace. We use them to name it and draft your starter courses.</p>

        <div class="st-acc m-rise" style="--i:3">
          ${SECTIONS.map(
            (section) => `
          <section class="acc" data-sec="${section.id}">
            <button type="button" class="acc-h" aria-expanded="false" aria-controls="acc-${section.id}">
              <span class="acc-n">${section.n}</span>
              <b>${esc(section.title)}</b>
              ${section.optional ? '<span class="ob-opt">Optional</span>' : ''}
              <span class="acc-state"></span>
              <em class="acc-sum"></em>
            </button>
            <div class="acc-body" id="acc-${section.id}" hidden>${body[section.id]}</div>
          </section>`
          ).join('')}
        </div>
        <p class="bz-err" id="st-err" role="alert"></p>
        <p class="bz-why m-rise" style="--i:4">Nothing is analysed or fetched, and all of it is editable later.</p>
      </div>
      <aside class="st-panel wash" aria-label="Your workspace so far">
        <div class="dotfield"></div>
        <div class="st-panel-in">
          <div class="blocks st-stack" id="st-stack" role="img" aria-label="Your workspace blocks"></div>
          <p class="st-count" id="st-count"></p>
        </div>
      </aside>
    </div>`;

  wireBusiness();
  paintSections();
}

function wireBusiness() {
  const site = $('#f-site');
  const moreButton = $('#role-more');
  const menu = $('#role-menu');

  $$('.acc-h').forEach((header) =>
    header.addEventListener('click', () => {
      const id = header.closest('.acc').dataset.sec;

      openSectionById(openSection === id ? '' : id);
    })
  );

  const desc = $('#f-desc');

  site.addEventListener('input', () => {
    S.website = site.value;
    S.skipContext = false;
    commit();
    paintSections();
  });
  desc.addEventListener('input', () => {
    S.description = desc.value;
    S.skipContext = false;
    commit();
    paintSections();
  });

  $$('#paths .chip').forEach((chip) =>
    chip.addEventListener('click', () => {
      S.pathChoice = S.pathChoice === chip.dataset.path ? '' : chip.dataset.path;
      commit();
      $$('#paths .chip').forEach((other) => other.setAttribute('aria-pressed', String(other.dataset.path === S.pathChoice)));
    })
  );

  $('#website-skip').addEventListener('click', () => {
    S.skipContext = true;
    commit();
    $('#st-err').textContent = '';
    advanceFrom('website');
  });

  $$('#site-mode button').forEach((button) =>
    button.addEventListener('click', () => {
      S.siteMode = button.dataset.mode;
      commit();
      $$('#site-mode button').forEach((other) => {
        other.classList.toggle('on', other === button);
        other.setAttribute('aria-pressed', String(other === button));
      });
      $('#site-link-field').hidden = S.siteMode === 'describe';
      $('#site-desc-field').hidden = S.siteMode !== 'describe';
      (S.siteMode === 'describe' ? desc : site).focus({ preventScroll: true });
    })
  );

  const showSiteError = () => {
    fieldError(site, SITE_INVALID);
    const node = site.closest('.field').querySelector('.err-text');
    const switchButton = document.createElement('button');

    switchButton.type = 'button';
    switchButton.className = 'btn btn-ghost btn-sm err-switch';
    switchButton.textContent = 'Describe it instead';
    switchButton.addEventListener('click', () => $('#site-mode [data-mode="describe"]').click());
    node.appendChild(switchButton);
  };

  const checkSite = () => {
    if (!site.value.trim() || isValidSite(site.value)) {
      fieldError(site, '');

      return true;
    }

    showSiteError();

    return false;
  };

  site.addEventListener('blur', checkSite);
  site.addEventListener('input', () => {
    if (site.classList.contains('bad')) checkSite();
  });

  const submitWebsite = () => {
    if (S.siteMode === 'link' && site.value.trim() && !checkSite()) {
      $('#st-err').textContent = '';

      return;
    }

    if (!sectionDone('website')) {
      $('#st-err').textContent = SECTIONS.find((section) => section.id === 'website').missing;

      return;
    }

    $('#st-err').textContent = '';
    advanceFrom('website');
  };

  site.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;

    event.preventDefault();
    submitWebsite();
  });
  $('#website-next').addEventListener('click', submitWebsite);

  $$('#goals .ob-block').forEach((tile) =>
    tile.addEventListener('click', () => {
      S.goals = [tile.dataset.goal];
      commit();
      $$('#goals .ob-block').forEach((other) => other.setAttribute('aria-checked', String(other === tile)));
      advanceFrom('outcome');
    })
  );

  const choose = (selector, key, dataKey, section) =>
    $$(selector).forEach((chip) =>
      chip.addEventListener('click', () => {
        S[key] = chip.dataset[dataKey];
        commit();
        $$(selector).forEach((other) => other.setAttribute('aria-pressed', String(other === chip)));
        if (sectionDone(section)) advanceFrom(section);
        else paintSections();
      })
    );

  choose('#sizes .chip', 'companySize', 'size', 'team');
  choose('#learning .chip', 'learningMethod', 'learn', 'today');

  wireSource();

  const closeMenu = () => {
    menu.hidden = true;
    moreButton.setAttribute('aria-expanded', 'false');
  };

  const selectRole = (id) => {
    const hiddenRole = P.ROLES.find((role) => role.id === id && !QUICK_ROLES.includes(role.id));

    S.role = id;
    commit();
    $$('.ob-role').forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.role === id)));
    $$('.bz-opt', menu).forEach((option) => option.setAttribute('aria-selected', String(option.dataset.role === id)));
    moreButton.setAttribute('aria-pressed', String(Boolean(hiddenRole)));
    moreButton.firstChild.textContent = `${hiddenRole?.label ?? 'More'} `;
    closeMenu();

    if (sectionDone('team')) advanceFrom('team');
    else paintSections();
  };

  $$('.ob-role').forEach((chip) => chip.addEventListener('click', () => selectRole(chip.dataset.role)));
  $$('.bz-opt', menu).forEach((option) => option.addEventListener('click', () => selectRole(option.dataset.role)));

  moreButton.addEventListener('click', (event) => {
    event.stopPropagation();
    menu.hidden = !menu.hidden;
    moreButton.setAttribute('aria-expanded', String(!menu.hidden));
  });
  document.addEventListener('click', (event) => {
    const path = event.composedPath();
    if (!path.includes(menu) && !path.includes(moreButton)) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
}

function wireSource() {
  const extra = $('#source-extra');

  const finish = () => {
    S.skipped.source = false;
    commit();
    advanceFrom('source');
  };

  const paintExtra = () => {
    const isAi = S.source === 'ai';
    const isOther = S.source === 'other';
    const isProviderOther = isAi && S.aiProvider === 'other';

    extra.hidden = !(isAi || isOther);
    if (extra.hidden) {
      extra.innerHTML = '';
      return;
    }

    extra.innerHTML = isOther
      ? `<label class="label" for="source-other">Where did you find us?</label>
         <input class="input" id="source-other" placeholder="Tell us more" value="${esc(S.sourceOther)}" />`
      : `<span class="label" id="provider-label">Which one recommended us?</span>
         <div class="ob-roles" role="group" aria-labelledby="provider-label">
           ${P.AI_PROVIDERS.map(
             (item) =>
               `<button type="button" class="chip" data-provider="${item.id}" aria-pressed="${S.aiProvider === item.id}">${esc(item.label)}</button>`
           ).join('')}
         </div>
         ${isProviderOther ? `<input class="input" id="provider-other" placeholder="Tell us more" value="${esc(S.aiProviderOther)}" />` : ''}`;

    const textInput = $('#source-other') ?? $('#provider-other');

    textInput?.addEventListener('input', () => {
      if (textInput.id === 'source-other') S.sourceOther = textInput.value;
      else S.aiProviderOther = textInput.value;
      commit();
    });
    textInput?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || !textInput.value.trim()) return;

      event.preventDefault();
      finish();
    });
    $$('[data-provider]', extra).forEach((chip) =>
      chip.addEventListener('click', () => {
        S.aiProvider = chip.dataset.provider;
        if (S.aiProvider !== 'other') S.aiProviderOther = '';
        commit();
        paintExtra();
        if (sectionDone('source')) finish();
        else $('#provider-other')?.focus();
      })
    );
  };

  $$('#sources .chip').forEach((chip) =>
    chip.addEventListener('click', () => {
      S.source = chip.dataset.source;
      if (S.source !== 'other') S.sourceOther = '';
      if (S.source !== 'ai') {
        S.aiProvider = '';
        S.aiProviderOther = '';
      }
      commit();
      $$('#sources .chip').forEach((other) => other.setAttribute('aria-pressed', String(other === chip)));
      paintExtra();

      if (sectionDone('source')) finish();
      else $('#source-other')?.focus();
    })
  );

  $('#source-skip').addEventListener('click', () => {
    S.skipped.source = true;
    commit();
    openSectionById('');
    $('#next').focus({ preventScroll: true });
  });

  paintExtra();
}

function validateBusiness() {
  const missing = requiredSections().find((section) => !sectionDone(section.id));

  if (!missing) return true;

  openSectionById(missing.id);
  $('#st-err').textContent = missing.missing;

  if (missing.id === 'website' && S.siteMode === 'link' && S.website.trim() && !isValidSite(S.website)) {
    $('#st-err').textContent = '';
    $('#f-site').dispatchEvent(new Event('blur'));
  }

  return false;
}

/* ============================================================
 * Workspace preparation (simulated)
 *
 * A full-bleed dark scene shows one phase at a time in large type while the starter courses
 * fan in and the learning path appears. A timer drives it: no website is fetched and no model
 * is called, and the scene says so. With reduced motion it shows the finished state.
 * ============================================================ */
const PREP_TITLES = [
  ['Reading your ', 'business'],
  ['Drafting your ', 'courses'],
  ['Shaping your ', 'learning path'],
  ['Setting up your ', 'workspace']
];

/* Each prepared course and the path drop in as blocks, the way the brand's loader does. The blocks
 * are the user's real draft content; nothing is analysed or generated, and the scene says so. */
function runPreparation() {
  const result = P.recommend(S);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const overlay = document.createElement('div');
  const tones = ['sand', 'tint', 'sand', 'tint'];

  const blocks = [
    ...result.courses.map((course, index) => ({
      kind: 'COURSE',
      title: course.title,
      tone: tones[index % tones.length],
      width: 340 - (index % 2) * 40,
      phase: 1
    })),
    { kind: 'PATH', title: `${result.path.title}`, tone: 'blue', width: 320, phase: 2 },
    { kind: 'WORKSPACE', title: S.company.trim() || 'Your academy', tone: 'ink', width: 280, phase: 3 }
  ];

  overlay.className = 'pp';
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-live', 'polite');
  overlay.innerHTML = `
    <div class="pp-left">
      <a class="lockup pp-top" href="index.html"><img class="mk" src="logo-mark.svg" alt="" /><span class="nm">classroomio</span></a>
      <p class="pp-count" id="pp-count"></p>
      <h2 id="pp-title"></h2>
      <p class="pp-sub">Building the first draft of ${esc(S.company.trim() || 'your academy')}. Starting from ${esc(result.categoryLabel)}.</p>
      <ul class="pp-steps">
        ${P.PREP_PHASES.map(
          (phase) => `<li class="pp-step"><i>${icon('check', 11)}</i><span>${esc(phase.label)}</span><em></em></li>`
        ).join('')}
      </ul>
      <p class="pp-note">Simulated. No website was fetched and no model was called.</p>
    </div>
    <div class="pp-right">
      <div class="blocks" role="img" aria-label="The drafted courses, path and workspace stacking up">
        ${blocks
          .map((item, index) =>
            window.visuals.block({ ...item, tab: index > 0, index, extra: `data-drop data-phase="${item.phase}"` })
          )
          .join('')}
      </div>
    </div>`;

  document.body.appendChild(overlay);

  const reveal = (phase, instant) => {
    $$(`.blk[data-drop]`, overlay).forEach((item, order) => {
      if (Number(item.dataset.phase) > phase || item.classList.contains('in')) return;

      if (instant) {
        item.style.opacity = '1';
        item.classList.add('in');
        item.style.animation = 'none';
        return;
      }

      item.style.animationDelay = `${(order % 4) * 140}ms`;
      item.classList.add('in');
    });
  };

  const show = (phase, instant = false) => {
    const [lead, highlight] = PREP_TITLES[phase];

    $('#pp-count').textContent = `Step ${phase + 1} of ${P.PREP_PHASES.length}`;
    $('#pp-title').innerHTML = `${esc(lead)}<span class="swipe">${esc(highlight)}</span>`;
    $$('.pp-step', overlay).forEach((step, index) => {
      const state = index < phase ? 'done' : index === phase ? 'now' : 'wait';

      step.className = `pp-step ${state}`;
      $('em', step).textContent = state === 'done' ? 'Done' : state === 'now' ? 'Working' : '';
    });
    reveal(phase, instant);
  };

  const finish = () => {
    S.courses = result.courses;
    S.path = result.path;
    S.categoryId = result.categoryId;
    S.prepared = true;
    S.preparedKey = P.inputKey(S);
    S.brandName = S.brandName || S.company;
    S.stage = 5;
    commit();
    window.location.href = 'customize.html';
  };

  if (reduce) {
    show(P.PREP_PHASES.length - 1, true);
    $$('.pp-step', overlay).forEach((step) => {
      step.className = 'pp-step done';
      $('em', step).textContent = 'Done';
    });
    setTimeout(finish, 1400);
    return;
  }

  let index = 0;

  const advance = () => {
    if (index >= P.PREP_PHASES.length) {
      setTimeout(finish, 700);
      return;
    }

    show(index);
    setTimeout(advance, P.PREP_PHASES[index].ms + 250);
    index += 1;
  };

  advance();
}

/* ============================================================
 * Router
 * ============================================================ */
let mounted = '';

function render() {
  if (S.stage >= 5) {
    window.location.replace('customize.html');
    return;
  }

  const isSplit = S.stage <= 2;

  $('#split-shell').hidden = !isSplit;
  $('#setup-shell').hidden = isSplit;

  const key = String(S.stage);
  if (key === mounted) return;
  mounted = key;

  if (isSplit) {
    clearInterval(verifyTimer);
    renderVisualPanel();
    renderTestimonials();
    restartCarousel();
    if (S.stage === 1) renderAccount();
    else renderVerify();

    window.scrollTo({ top: 0 });
    return;
  }

  clearInterval(tTimer);
  renderRail();

  $('#setup-foot').hidden = false;
  $('#setup-shell').classList.add('biz');
  $('#setup-body').classList.add('wide');
  $('#skip').hidden = true;
  $('#back').style.visibility = S.stage === 4 ? 'visible' : 'hidden';

  if (S.stage === 3) {
    $('#next-label').textContent = 'Continue';
    renderBusiness();
  } else {
    $('#next-label').textContent = 'Create workspace';
    renderWorkspace();
  }

  window.scrollTo({ top: 0 });
}

function goNext() {
  if (S.stage === 3) {
    if (!validateBusiness()) return;

    S.stage = 4;
    commit();
    render();
    return;
  }

  if (S.stage !== 4) return;
  if (!validateWorkspace()) return;

  if (S.prepared && S.preparedKey === P.inputKey(S)) {
    S.stage = 5;
    commit();
    window.location.href = 'customize.html';
    return;
  }

  runPreparation();
}

function wire() {
  P.initTheme();

  $('#next').addEventListener('click', goNext);

  $('#back').addEventListener('click', () => {
    if (S.stage !== 4) return;

    S.stage = 3;
    commit();
    render();
  });

  $('#restart').addEventListener('click', () => {
    P.resetState();
    window.location.reload();
  });
}

wire();
render();
