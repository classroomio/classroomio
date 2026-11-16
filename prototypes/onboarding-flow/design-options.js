/*
 * design-options.js — five design directions for each onboarding screen after verification.
 *
 * These are review artefacts, not screens a user sees. Each mock is static markup built on the
 * real tokens and the real dashboard chrome (P.renderOrgSidebar), at a fixed 960×600 canvas that
 * the gallery scales to fit. The same fictional company is used throughout so the options can
 * be compared like for like.
 */

const P = window.proto;
const esc = P.escapeHtml;
const ic = P.icon;

const DEMO = {
  company: 'Northbeam',
  brandName: 'Northbeam',
  logoDataUrl: '',
  primary: P.DEFAULT_PRIMARY,
  website: 'https://northbeam.io',
  description:
    'We make project management software for agencies. Customers set up workspaces, run projects and report progress to clients.',
  goals: ['onboard', 'deflect'],
  skipContext: false
};
const REC = P.recommend(DEMO);
const COURSES = REC.courses;
const PATH = REC.path;
const THEMES = P.LANDING_THEMES;
const themeImg = (id) => `<img src="${P.themeById(id).preview}" alt="" onerror="this.style.display='none'" />`;

/* ---------- building blocks ---------- */
function chrome(main, { active = 'Courses', dim = false } = {}) {
  return `<div class="dm-app${dim ? ' dim' : ''}">
    <aside class="sidebar">${P.renderOrgSidebar(DEMO, active)}</aside>
    <div class="dm-main">${main}</div>
  </div>`;
}

function topbar(left, right = '') {
  return `<div class="dm-top"><span class="crumb">${left}</span><span style="margin-left:auto;display:flex;gap:6px;align-items:center">${right}</span></div>`;
}

function courseGrid(n = 4, cols = 2) {
  return `<div class="dm-cgrid" style="grid-template-columns:repeat(${cols},1fr)">${COURSES.slice(0, n)
    .map(
      (c) =>
        `<div class="dm-c"><span class="dm-cv" style="background:${P.coverFor(c.id, DEMO.primary)}"></span><div class="dm-ct">${esc(c.title)}</div><div class="dm-cd">${esc(c.desc)}</div></div>`
    )
    .join('')}</div>`;
}

function pathCard(compact = false) {
  return `<div class="dm-path"><div class="dm-path-h">${ic('route', 14)}<b>${esc(PATH.title)}</b><span class="badge badge-muted">Learning path</span></div>${
    compact ? '' : `<ol>${PATH.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>`
  }</div>`;
}

const chip = (label, on, icon = '') =>
  `<span class="chip dm-chip" aria-pressed="${on}">${icon ? ic(icon, 13) : ''}${esc(label)}</span>`;
const btn = (label, kind = 'primary', extra = '') => `<span class="btn btn-${kind}${extra}">${label}</span>`;
const step = (n, total) =>
  `<div class="dm-steps">${Array.from({ length: total }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</div>`;
const whyTag = (text) => `<span class="dm-why">${ic('sparkle', 11)} ${esc(text)}</span>`;

/* ============================================================
 * 1 · Business information (the redesign priority)
 * ============================================================ */
const BUSINESS = [
  {
    id: 'b1',
    title: 'Editorial sentence',
    concept: 'The form is one sentence you complete. Whitespace and type do the work; the "why" lives in the margin.',
    good: 'Least form-like of the five; reads as a conversation in a single glance.',
    watch: 'Inline pickers are harder to make accessible and to localise; long descriptions break the sentence.',
    html: `<div class="dm-page dm-editorial">
      ${step(3, 4)}
      <div class="dm-ed-wrap">
        <p class="dm-eyebrow">Tell us about your business</p>
        <h2 class="dm-ed-h">I'm in <u>Customer Education</u> at <u>Northbeam</u>, which makes <u>project management software</u> for agencies.</h2>
        <h2 class="dm-ed-h light">Our customers need to <u>get onboarded</u> and <u>stop filing the same tickets</u>.</h2>
        <div class="dm-ed-chips">${chip('Onboard new customers', true)}${chip('Cut repetitive tickets', true)}${chip('Increase adoption', false)}${chip('Teach advanced features', false)}${chip('Certify customers', false)}</div>
        <div style="margin-top:34px;display:flex;gap:10px;align-items:center">${btn('Prepare my workspace →', 'primary', ' btn-lg')}<span class="text-muted" style="font-size:12.5px">northbeam.io added · you can change everything later</span></div>
      </div>
      <aside class="dm-margin">
        <div>${whyTag('Names your workspace')}<small>Company</small></div>
        <div>${whyTag('Drafts 4 starter courses')}<small>What you make</small></div>
        <div>${whyTag('Shapes your learning path')}<small>What customers need</small></div>
      </aside>
    </div>`
  },
  {
    id: 'b2',
    title: 'Illustrated cards',
    concept:
      'Big, friendly goal and role cards with illustration, next to a "what you will get" stack of course cards.',
    good: 'Most scannable; goals feel like choosing outcomes rather than filling fields.',
    watch: 'Illustration work for every goal and role; the right column is static until submit.',
    html: `<div class="dm-page">
      <div class="dm-2col" style="grid-template-columns:1.3fr 1fr;gap:24px">
        <div>
          ${step(3, 4)}
          <h2 class="dm-h">What should your customers be able to do?</h2>
          <div class="dm-bigcards">
            ${[
              ['Onboard new customers', 'rocket', true],
              ['Cut repetitive tickets', 'lifebuoy', true],
              ['Increase adoption', 'layers', false],
              ['Teach advanced features', 'sparkle', false]
            ]
              .map(
                ([t, i, on]) =>
                  `<div class="dm-big${on ? ' on' : ''}"><span class="dm-art" style="--h:${t.length * 13}">${ic(i, 26)}</span><b>${t}</b><small>${on ? 'Selected' : 'Tap to add'}</small></div>`
              )
              .join('')}
          </div>
          <div class="dm-row" style="margin-top:14px"><div class="field" style="flex:1"><label class="label">Company</label><input class="input" value="Northbeam" readonly /></div><div class="field" style="flex:1"><label class="label">Website</label><input class="input" value="northbeam.io" readonly /></div></div>
          <div class="chips" style="margin-top:6px">${chip('Customer Education', true, 'book')}${chip('Founder', false, 'rocket')}${chip('Support', false, 'lifebuoy')}${chip('Product', false, 'layers')}</div>
        </div>
        <div class="dm-side-card">
          <p class="dm-eyebrow">You'll start with</p>
          ${COURSES.slice(0, 3)
            .map(
              (c) =>
                `<div class="dm-mini-c"><span style="background:${P.coverFor(c.id, DEMO.primary)}"></span><b>${esc(c.title)}</b></div>`
            )
            .join('')}
          ${pathCard(true)}
          <p class="text-muted" style="font-size:11.5px;margin:10px 0 0">Starter drafts you can edit or delete.</p>
        </div>
      </div>
    </div>`
  },
  {
    id: 'b3',
    title: 'Live workspace preview (superseded)',
    concept:
      'Four short cards on the left; on the right, the real dashboard builds itself as you type. Every card says what it is used for.',
    good: 'Makes the value of answering immediate and previews the next screen, so the journey feels continuous.',
    watch: 'Two columns need a stacked layout on phones; the preview must never imply analysis it has not done.',
    html: `<div class="dm-page">
      ${step(3, 4)}
      <h2 class="dm-h">Tell us about your business.</h2>
      <div class="dm-2col" style="grid-template-columns:1fr 360px;gap:20px">
        <div class="dm-stack">
          <div class="dm-card"><b>1 · Your company</b>${whyTag('Names your workspace and portal')}<div class="dm-row"><input class="input" value="Northbeam" readonly /><input class="input" value="https://northbeam.io" readonly /></div></div>
          <div class="dm-card"><b>2 · What does your product do?</b>${whyTag('Drafts your courses and path')}<textarea class="textarea" rows="2" readonly>We make project management software for agencies…</textarea><div class="dm-exrow"><span class="ex-chip">Project management</span><span class="ex-chip">Analytics</span><span class="ex-chip">Fintech</span></div></div>
          <div class="dm-card"><b>3 · Your role</b><div class="chips">${chip('Customer Education', true, 'book')}${chip('Founder', false, 'rocket')}${chip('Support', false, 'lifebuoy')}</div></div>
          <div class="dm-card"><b>4 · What should customers do?</b>${whyTag('Shapes your learning path')}<div class="dm-goalrow">${['Onboard new customers', 'Cut repetitive tickets'].map((g) => `<span class="dm-goal on">${ic('check', 11)}${g}</span>`).join('')}<span class="dm-goal">Increase adoption</span></div></div>
        </div>
        <div>
          <p class="dm-eyebrow">Your workspace, taking shape</p>
          <div class="dm-miniapp"><div class="dm-ms"><b>Northbeam</b><i></i><i class="on"></i><i></i><i></i></div><div class="dm-mm">${courseGrid(4, 2)}${pathCard(true)}</div></div>
          <p class="text-muted" style="font-size:11.5px">1 workspace · 4 starter courses · 1 learning path</p>
        </div>
      </div>
    </div>`
  },
  {
    id: 'b4',
    title: 'Conversational guide',
    concept:
      'A guide asks one question at a time and answers arrive as quick replies. A side panel keeps a running summary of what it has learnt.',
    good: 'Warmest tone; one decision per screen; natural for the AI-prepared framing.',
    watch:
      'Slowest to complete and the hardest to go back and edit; chat can feel like a gimmick if the model is not real.',
    html: `<div class="dm-page" style="padding:0">
      <div class="dm-2col" style="grid-template-columns:1fr 280px;height:100%">
        <div class="dm-chat">
          <div class="dm-bubble bot">${ic('sparkle', 14)} Hi Ada — I'll set up Northbeam's academy. What does your product do?</div>
          <div class="dm-bubble me">Project management software for agencies.</div>
          <div class="dm-bubble bot">${ic('sparkle', 14)} Got it. What should customers be able to do after they sign up?</div>
          <div class="dm-replies">${chip('Onboard themselves', true)}${chip('Cut repetitive tickets', true)}${chip('Adopt more features', false)}${chip('Get certified', false)}</div>
          <div class="dm-compose"><span class="text-muted">Type a reply, or paste your website…</span><span class="btn btn-primary btn-sm">Send</span></div>
        </div>
        <aside class="dm-summary"><p class="dm-eyebrow">What I've learned</p>
          <dl><dt>Company</dt><dd>Northbeam</dd><dt>Reads as</dt><dd>Project management software</dd><dt>Role</dt><dd>Customer Education</dd><dt>Goals</dt><dd>Onboarding · Fewer tickets</dd></dl>
          <p class="dm-eyebrow" style="margin-top:14px">I'll prepare</p><p style="font-size:12.5px;margin:0">4 courses · 1 learning path</p>
        </aside>
      </div>
    </div>`
  },
  {
    id: 'b5',
    title: 'Immersive and premium',
    concept:
      'Dark, full-bleed canvas with oversized type, glass step cards and a floating dashboard that fills in underneath.',
    good: 'Strongest first impression and hierarchy; feels like a flagship product.',
    watch: 'Departs most from the existing light UI; needs more effort to keep contrast and focus states accessible.',
    html: `<div class="dm-page dark">
      ${step(3, 4)}
      <p class="dm-eyebrow" style="color:#a5b4fc">Step 3 · Your business</p>
      <h2 class="dm-h xl">Let's build <span>Northbeam's</span> academy.</h2>
      <div class="dm-glass-row">
        <div class="dm-glass"><small>Company</small><b>Northbeam</b><span>northbeam.io</span></div>
        <div class="dm-glass on"><small>Product</small><b>Project management</b><span>for agencies</span></div>
        <div class="dm-glass"><small>Role</small><b>Customer Education</b><span>Edit</span></div>
        <div class="dm-glass"><small>Goals</small><b>2 selected</b><span>Onboarding · Fewer tickets</span></div>
      </div>
      <div class="dm-float"><div class="dm-miniapp"><div class="dm-ms"><b>Northbeam</b><i></i><i class="on"></i><i></i></div><div class="dm-mm">${courseGrid(3, 3)}</div></div></div>
      <span class="btn btn-primary btn-lg" style="position:absolute;right:36px;bottom:30px">Prepare my workspace →</span>
    </div>`
  }
];

/* ============================================================
 * 2 · Preparation
 * ============================================================ */
const PREP = [
  {
    id: 'p1',
    title: 'Checklist',
    concept: 'Four named phases tick off one by one beside a progress bar.',
    good: 'Simplest to build and to make accessible; clear and honest.',
    watch: 'Looks like every other loading screen; shows no result until the end.',
    html: `<div class="dm-page dm-center"><div class="dm-prep1"><div class="prep-orb">${ic('sparkle', 24)}</div><h2 class="dm-h">Setting up Northbeam</h2>${[
      'Understanding your product',
      'Preparing your customer education content',
      'Organising your starter learning path',
      'Setting up your workspace'
    ]
      .map(
        (l, i) =>
          `<div class="prep-step ${i < 2 ? 'done' : i === 2 ? 'active' : ''}"><span class="prep-mark">${ic('check', 10)}</span>${l}</div>`
      )
      .join('')}<div class="prog" style="margin-top:14px"><span style="width:62%"></span></div></div></div>`
  },
  {
    id: 'p2',
    title: 'Ring with findings log',
    concept: 'A progress ring beside a streaming log of what is being read and decided.',
    good: 'Feels intelligent and gives the user something to read.',
    watch: 'A log invites the claim that real analysis happened. Only safe if it is real.',
    html: `<div class="dm-page dm-center"><div class="dm-2col" style="grid-template-columns:200px 1fr;gap:34px;align-items:center;max-width:720px"><div class="dm-ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="var(--muted)" stroke-width="9"/><circle cx="60" cy="60" r="52" fill="none" stroke="var(--primary)" stroke-width="9" stroke-linecap="round" stroke-dasharray="326" stroke-dashoffset="120" transform="rotate(-90 60 60)"/></svg><b>62%</b></div>
      <div class="dm-log"><p class="dm-eyebrow">Working on it</p>${['Product described as project management software', 'Customers: agencies running client projects', 'Goal: onboarding and fewer repeat tickets', 'Drafting 4 courses…', 'Ordering a 5-step learning path…'].map((l, i) => `<div class="${i < 3 ? 'ok' : ''}">${ic(i < 3 ? 'check' : 'chevron', 12)} ${l}</div>`).join('')}</div></div></div>`
  },
  {
    id: 'p3',
    title: 'Workspace assembles',
    concept:
      'The real dashboard builds on screen as each phase finishes: sidebar, then course cards, then the learning path.',
    good: 'The wait shows the thing being made and leads straight into the customise screen.',
    watch: 'Needs a reduced-motion variant that simply shows the finished workspace.',
    selected: true,
    html: `<div class="dm-page"><div class="dm-2col" style="grid-template-columns:260px 1fr;gap:28px;align-items:center;height:100%"><div><div class="prep-orb" style="margin:0 0 14px">${ic('sparkle', 22)}</div><h2 class="dm-h" style="font-size:21px">Setting up Northbeam</h2>${['Understanding your product', 'Preparing your customer education content', 'Organising your starter learning path', 'Setting up your workspace'].map((l, i) => `<div class="prep-step ${i < 2 ? 'done' : i === 2 ? 'active' : ''}"><span class="prep-mark">${ic('check', 10)}</span>${l}</div>`).join('')}</div>
      <div class="dm-miniapp big"><div class="dm-ms"><b>Northbeam</b><i></i><i class="on"></i><i></i><i></i></div><div class="dm-mm">${courseGrid(4, 2)}<div style="opacity:.35">${pathCard(true)}</div></div></div></div></div>`
  },
  {
    id: 'p4',
    title: 'Narrated by the guide',
    concept: 'The conversational guide narrates each step as short chat lines while skeleton cards fill in.',
    good: 'Consistent if the business screen was conversational.',
    watch: 'Adds reading to a moment people want to be brief.',
    html: `<div class="dm-page dm-center"><div class="dm-chat" style="max-width:520px;width:100%"><div class="dm-bubble bot">${ic('sparkle', 14)} Reading what you told me about Northbeam…</div><div class="dm-bubble bot">${ic('sparkle', 14)} Drafting four courses for agencies using project software.</div><div class="dm-bubble bot typing">${ic('sparkle', 14)} Ordering them into a New Customer Onboarding path<span class="dots"><i></i><i></i><i></i></span></div><div class="dm-skels"><i></i><i></i><i></i></div></div></div>`
  },
  {
    id: 'p5',
    title: 'Cinematic',
    concept: 'Dark full-bleed scene with one large phase title at a time and a cover-flow of the courses arriving.',
    good: 'Memorable and high-end.',
    watch:
      'Highest motion; most likely to feel slow on repeat use and costly to localise. Built with a reduced-motion variant that shows the finished state.',
    selected: true,
    html: `<div class="dm-page dark dm-center" style="text-align:center"><p class="dm-eyebrow" style="color:#a5b4fc">3 of 4</p><h2 class="dm-h xl" style="margin-bottom:6px">Organising your <span>learning path</span></h2><p style="color:#a1a1aa;font-size:14px;margin:0 0 28px">Northbeam · project management for agencies</p><div class="dm-flow">${COURSES.map((c, i) => `<div class="dm-flowc" style="transform:rotate(${(i - 1.5) * 4}deg) translateY(${Math.abs(i - 1.5) * 6}px);background:${P.coverFor(c.id, '#6366f1')}"><b>${esc(c.title)}</b></div>`).join('')}</div></div>`
  }
];

/* ============================================================
 * 3 · Workspace customisation
 * ============================================================ */
const swatches = P.COLOR_PRESETS.map((c, i) => `<i class="sw${i === 0 ? ' on' : ''}" style="--c:${c.hex}"></i>`).join(
  ''
);
const themeTile = (t, sel) =>
  `<div class="dm-theme${sel ? ' on' : ''}">${themeImg(t.id)}<span class="tag ${t.free ? 'tag-free' : 'tag-premium'}">${t.free ? 'Free' : 'Premium'}</span><b>${t.title}</b></div>`;

const CUSTOM = [
  {
    id: 'c1',
    title: 'Real dashboard + inspector',
    concept:
      'The actual dashboard on the left; a right-hand inspector holds brand, colour and the real theme gallery. Colour changes re-tint the whole page.',
    good: 'Customising happens inside the product, so the result is never abstract. Matches the editor pattern users already know.',
    watch: 'Needs a bottom-sheet variant below 1100px; the dashboard view and the portal view must both stay legible.',
    html: chrome(`${topbar('Northbeam / Courses', `<span class="seg2"><button class="on">Your dashboard</button><button>Learning portal</button></span>`)}
      <div class="dm-body" style="padding:14px 18px;display:grid;grid-template-columns:1fr 250px;gap:14px;height:calc(100% - 44px);overflow:hidden">
        <div><h3 class="dm-h" style="font-size:16px;margin-bottom:8px">Courses</h3>${courseGrid(4, 2)}${pathCard(true)}</div>
        <div class="dm-insp"><b>Make it yours</b><small>Brand</small><input class="input" value="Northbeam" readonly /><small>Brand colour</small><div class="sw-row">${swatches}</div><small>Theme</small><div class="dm-theme-grid">${themeTile(THEMES[0], true)}${themeTile(THEMES[9], false)}${themeTile(THEMES[5], false)}${themeTile(THEMES[2], false)}</div><span class="btn btn-primary" style="width:100%;margin-top:8px">Done customising</span></div>
      </div>`)
  },
  {
    id: 'c2',
    title: 'Theme dock',
    concept: 'A full-width portal preview with a horizontal strip of themes docked beneath and a floating colour pill.',
    good: 'Theme browsing is fast and visual; the preview is as large as it can be.',
    watch:
      'Drops the real dashboard chrome, so the continuity with the product is weaker. A horizontal strip hides the Free/Premium split.',
    html: `<div class="dm-page" style="padding:0;display:flex;flex-direction:column"><div class="dm-top"><span class="crumb">Preview · Quartz</span><span style="margin-left:auto">${btn('Done', 'primary', ' btn-sm')}</span></div>
      <div class="dm-shot" style="flex:1;margin:10px 16px 0;border-radius:10px 10px 0 0">${themeImg('quartz')}<div class="dm-pill">${swatches}<span>Brand colour</span></div></div>
      <div class="dm-dock">${THEMES.slice(0, 7)
        .map((t, i) => themeTile(t, i === 0))
        .join('')}</div></div>`
  },
  {
    id: 'c3',
    title: 'Split with tabs',
    concept:
      'Large portal preview left; Brand, Colour and Theme as tabs on the right so only one group is on screen at a time.',
    good: 'Calmest controls; one focus at a time; easiest to make responsive.',
    watch: 'Hides themes behind a tab, which weakens the paid-theme discovery moment.',
    html: `<div class="dm-page" style="padding:14px"><div class="dm-2col" style="grid-template-columns:1fr 280px;gap:14px;height:100%"><div class="dm-shot" style="border-radius:10px">${themeImg('quartz')}</div><div class="dm-insp"><div class="seg2" style="margin-bottom:12px"><button>Brand</button><button>Colour</button><button class="on">Theme</button></div><div class="dm-theme-grid">${THEMES.slice(
      0,
      6
    )
      .map((t, i) => themeTile(t, i === 0))
      .join(
        ''
      )}</div><span class="btn btn-primary" style="width:100%;margin-top:10px">Continue</span></div></div></div>`
  },
  {
    id: 'c4',
    title: 'Guided coach marks',
    concept:
      'A floating coach card walks Brand → Colour → Theme, spotlighting the part of the preview each choice changes.',
    good: 'Hand-held and impossible to miss anything; teaches where things live.',
    watch: 'Slower for confident users and easy to feel patronising; needs a clear skip.',
    html: chrome(
      `${topbar('Northbeam / Learning portal')}<div class="dm-body dm-spot" style="padding:16px"><div class="dm-shot" style="height:100%;border-radius:10px">${themeImg('quartz')}<span class="dm-hole"></span></div><div class="dm-coach"><small>Step 2 of 3</small><b>Pick a brand colour</b><p>Buttons, links and your sidebar all follow it.</p><div class="sw-row">${swatches}</div><div style="display:flex;justify-content:space-between;margin-top:10px"><span class="btn btn-ghost btn-sm">Skip</span><span class="btn btn-primary btn-sm">Next</span></div></div></div>`
    )
  },
  {
    id: 'c5',
    title: 'Theme-first gallery',
    concept:
      'A full-screen gallery of all eleven themes first; picking one opens a slide-over for name, logo and colour.',
    good: 'Themes get maximum space, so the free-versus-premium choice is the star.',
    watch: 'Puts the biggest decision before the simplest ones and pushes branding out of sight.',
    html: `<div class="dm-page"><h2 class="dm-h" style="margin-bottom:4px">Choose a look</h2><p class="text-muted" style="font-size:12.5px;margin:0 0 12px">Quartz is free. Premium themes need a paid plan.</p><div class="dm-gal">${THEMES.slice(
      0,
      8
    )
      .map((t, i) => themeTile(t, i === 0))
      .join(
        ''
      )}</div><div class="dm-slide"><b>Northbeam</b><small>Name</small><input class="input" value="Northbeam" readonly /><small>Logo</small><div class="dropzone" style="padding:10px">Drop a logo</div><small>Colour</small><div class="sw-row">${swatches}</div></div></div>`
  }
];

/* ============================================================
 * 4 · Integrations moment
 * ============================================================ */
const int3 = ['MCP', 'Public API', 'Zapier'];
const intCards = (n = 3) =>
  P.INTEGRATIONS.slice(0, n)
    .map(
      (i) =>
        `<div class="dm-int"><span class="int-mark" style="background:${i.color}">${i.mark}</span><div><b>${i.name}</b><small>${P.INTEGRATION_STATUS[i.status].label}</small></div><span class="btn btn-outline btn-sm">${i.status === 'live' ? 'Connect' : i.status === 'plan' ? 'Paid plan' : 'Notify me'}</span></div>`
    )
    .join('');

const INTEG = [
  {
    id: 'i1',
    title: 'Centered modal',
    concept:
      'After customising, one dismissible modal: the headline, cards grouped by real availability, Skip for now.',
    good: 'The clearest "decide now or skip" moment; easy to dismiss without losing work.',
    watch: 'Interrupts the flow, so it must appear once only and never block the workspace.',
    selected: true,
    html:
      chrome(`<div class="dm-body" style="padding:16px">${courseGrid(2, 2)}</div>`, { dim: true }) +
      `<div class="dm-modal"><b>Connect ClassroomIO to the tools your team already uses.</b><p>Bring customer education closer to your existing workflows.</p><div class="dm-ints">${intCards(4)}</div><div class="dm-modal-f"><span class="text-muted">Connect any time from Automation</span><span class="btn btn-outline">Skip for now</span></div></div>`
  },
  {
    id: 'i2',
    title: 'Side sheet',
    concept: 'A slide-over from the right keeps the dashboard visible and interactive behind it.',
    good: 'Least disruptive; the workspace is still in view.',
    watch: 'A sheet reads as optional, so fewer people will engage; competes with the inspector panel.',
    html:
      chrome(`<div class="dm-body" style="padding:16px">${courseGrid(4, 2)}</div>`) +
      `<aside class="dm-sheet"><b>Connect your tools</b><p>Bring learning closer to existing workflows.</p>${intCards(4)}<span class="btn btn-ghost" style="margin-top:8px">Skip for now</span></aside>`
  },
  {
    id: 'i3',
    title: 'In-dashboard banner',
    concept: 'No modal. A banner and a "Connect a tool" checklist item appear on the dashboard itself.',
    good: 'Never interrupts; lives where the user will return to it.',
    watch: 'Easy to ignore, so the integration story may never be seen. Works best paired with the tour step.',
    html: chrome(
      `${topbar('Northbeam / Courses')}<div class="dm-body" style="padding:16px"><div class="dm-banner">${ic('zap', 16)}<div><b>Connect ClassroomIO to your tools</b><small>MCP and the Public API are available now.</small></div><span class="btn btn-outline btn-sm">Connect</span><span class="btn btn-ghost btn-sm">Later</span></div>${courseGrid(4, 2)}</div>`
    )
  },
  {
    id: 'i4',
    title: 'Command palette',
    concept: 'A searchable palette: type a tool name, see its honest status, connect from the keyboard.',
    good: 'Fast for people who already know what they want.',
    watch: 'Offers no discovery for people who do not; a poor fit for a first-run moment.',
    html:
      chrome(`<div class="dm-body" style="padding:16px">${courseGrid(2, 2)}</div>`, { dim: true }) +
      `<div class="dm-cmd"><div class="dm-cmd-in">${ic('search', 14)} Search tools…<span class="kbd">⌘K</span></div>${P.INTEGRATIONS.slice(
        0,
        5
      )
        .map(
          (i, k) =>
            `<div class="dm-cmd-r${k === 0 ? ' on' : ''}"><span class="int-mark" style="background:${i.color};width:22px;height:22px;font-size:10px">${i.mark}</span><b>${i.name}</b><small>${P.INTEGRATION_STATUS[i.status].label}</small></div>`
        )
        .join('')}</div>`
  },
  {
    id: 'i5',
    title: 'Suggestion toast',
    concept: 'A small card appears bottom-right suggesting one tool at a time, with Connect and Dismiss.',
    good: 'Gentle and contextual; easy to dismiss.',
    watch: 'Only ever shows one tool, so the full picture of what is supported is missing.',
    html:
      chrome(`${topbar('Northbeam / Courses')}<div class="dm-body" style="padding:16px">${courseGrid(4, 2)}</div>`) +
      `<div class="dm-toast">${ic('zap', 15)}<div><b>Create courses from Claude Code</b><small>MCP is available on your plan.</small></div><span class="btn btn-primary btn-sm">Connect</span><span class="btn btn-ghost btn-sm">Not now</span></div>`
  }
];

/* ============================================================
 * 5 · Dashboard + product tour
 * ============================================================ */
const dashBase = (extra = '') =>
  `${topbar('Northbeam / Courses', `<span class="btn btn-outline btn-sm">Take the tour</span><span class="btn btn-primary btn-sm">View portal</span>`)}<div class="dm-body" style="padding:14px 18px"><div class="dm-welcome"><b>Welcome, Ada — Northbeam is ready.</b><small>4 starter courses and a learning path, drafted from your answers.</small></div>${courseGrid(4, 2)}${extra}</div>`;

const TOUR = [
  {
    id: 't1',
    title: 'Spotlight + checklist',
    concept:
      'A dimmed spotlight on the real element with a short popover; afterwards a "Getting started" checklist stays on the dashboard.',
    good: 'Teaches on the real interface, leaves the page clickable, and the checklist outlives the tour.',
    watch: 'Spotlights must skip targets that are hidden at small widths.',
    selected: true,
    html:
      chrome(dashBase()) +
      `<div class="dm-ring" style="position:absolute;left:226px;top:190px;width:340px;height:36px;border-radius:8px;box-shadow:0 0 0 2px var(--primary),0 0 0 9999px rgba(0,0,0,.45);background:none"></div><div class="dm-tourpop"><small>Step 2 of 5</small><b>Edit a starter course</b><p>Open any course to rewrite lessons. It stays a draft until you publish.</p><div style="display:flex;justify-content:space-between"><span class="btn btn-ghost btn-sm">Skip tour</span><span class="btn btn-primary btn-sm">Next</span></div></div>`
  },
  {
    id: 't2',
    title: 'Checklist drawer',
    concept: 'No overlay. A persistent "Getting started" panel with progress and one action per item.',
    good: 'Lowest friction; users work at their own pace.',
    watch: 'Teaches by listing rather than pointing, so it is easier to ignore.',
    html:
      chrome(dashBase()) +
      `<aside class="dm-check"><b>Getting started</b><div class="prog"><span style="width:45%"></span></div>${['Workspace prepared', 'Customise your first course', 'Preview your portal', 'Review your learning path', 'Connect a tool'].map((l, i) => `<div class="${i === 0 ? 'done' : ''}">${ic(i === 0 ? 'check' : 'chevron', 13)} ${l}</div>`).join('')}</aside>`
  },
  {
    id: 't3',
    title: 'Hotspot beacons',
    concept: 'Pulsing beacons sit on the five key elements; hovering one explains it. No steps, no overlay.',
    good: 'Non-linear and non-blocking; people explore what interests them.',
    watch: 'Nothing says what to do first, which cuts against the "edit a course" goal. Poor on touch.',
    html:
      chrome(dashBase()) +
      [
        [250, 60],
        [290, 250],
        [520, 120],
        [800, 36],
        [20, 440]
      ]
        .map(([x, y]) => `<i class="dm-beacon" style="left:${x}px;top:${y}px"></i>`)
        .join('') +
      `<div class="dm-tip" style="left:300px;top:268px">Edit a starter course</div>`
  },
  {
    id: 't4',
    title: 'Docked guide bar',
    concept:
      'A slim bar at the bottom walks through the steps with text and dots while the dashboard stays fully visible.',
    good: 'Does not cover anything; works well on phones.',
    watch: 'Does not point at the element, so users must find it themselves.',
    html:
      chrome(dashBase()) +
      `<div class="dm-bar"><div><small>Step 2 of 5</small><b>Edit a starter course</b></div><p>Open any course to rewrite lessons. It stays a draft until you publish.</p><div class="dm-dots"><i></i><i class="on"></i><i></i><i></i><i></i></div><span class="btn btn-ghost btn-sm">Skip</span><span class="btn btn-primary btn-sm">Next</span></div>`
  },
  {
    id: 't5',
    title: 'Assistant guide',
    concept: 'A guide bubble bottom-right recommends the single best next action and offers to show more on request.',
    good: 'One clear next step; the lightest touch.',
    watch: 'Reads as a chat widget users have learnt to dismiss; no orientation of the full interface.',
    html:
      chrome(dashBase()) +
      `<div class="dm-assist"><div class="dm-bubble bot">${ic('sparkle', 14)} Nice work — Northbeam is set up. The fastest win: edit <b>Getting Started with Your Workspace</b>.</div><div class="dm-replies">${btn('Open the editor', 'primary', ' btn-sm')}${btn('Show me around', 'outline', ' btn-sm')}${btn('Later', 'ghost', ' btn-sm')}</div></div>`
  }
];

const SECTIONS = [
  {
    id: 'business',
    title: 'Business information',
    sub: 'The screen that replaces the old questionnaire. Pick the direction that makes answering feel worthwhile.',
    why: "None of these five is built. The product owner asked for org details as one calm flow with no preview, so the built screen is a custom sentence composer: the questions are a sentence completed in place, followed by goal tiles. It borrows the editorial option's idea (option 1) and goes further. The live-preview option (3) was dropped because the dashboard is revealed after customising instead.",
    options: BUSINESS
  },
  {
    id: 'prep',
    title: 'Workspace preparation',
    sub: 'The short wait between submitting and customising.',
    why: 'Chosen by the product owner: option 5. It is the most memorable moment in the flow and shows the real starter courses arriving, then the path, with the simulation disclosed on screen. Option 3 was the earlier recommendation and is the safer, lower-motion alternative.',
    options: PREP
  },
  {
    id: 'custom',
    title: 'Workspace customisation',
    sub: 'Brand, colour and the real theme gallery.',
    why: 'Chosen by the product owner: option 2. A full-width portal preview is the largest view of the result, and browsing all eleven real themes is one horizontal swipe. The trade-off is that the real dashboard chrome is gone from this screen, so the Starter content button keeps rename and remove one click away. Option 1 (real dashboard + inspector) was the earlier recommendation.',
    options: CUSTOM
  },
  {
    id: 'integ',
    title: 'Integrations moment',
    sub: 'Introduced once, after customising, using only what really exists.',
    why: 'Option 1 is the clearest "decide now or skip" and is dismissible. It is paired with the dashboard checklist item and tour step, which is option 3\'s idea, so people who skip it still meet it again.',
    options: INTEG
  },
  {
    id: 'tour',
    title: 'Dashboard and product tour',
    sub: 'What happens after "Open my workspace".',
    why: 'Option 1 teaches on the real interface and puts "edit a starter course" first; the checklist (option 2) keeps working after the spotlight ends. Options 3 and 5 do not push toward the first edit.',
    options: TOUR
  }
];

function render() {
  const host = document.getElementById('sections');

  host.innerHTML = SECTIONS.map(
    (section, sIndex) => `
    <section class="do-sec" id="${section.id}">
      <header>
        <span class="do-num">${sIndex + 1}</span>
        <div><h2>${section.title}</h2><p>${section.sub}</p></div>
      </header>
      <div class="do-why"><b>Selected direction.</b> ${section.why}</div>
      <div class="do-grid">
        ${section.options
          .map(
            (opt, oIndex) => `
          <article class="do-card${opt.selected ? ' selected' : ''}">
            <div class="do-meta">
              <span class="do-n">Option ${oIndex + 1}</span>
              ${opt.selected ? '<span class="badge badge-default">Selected · built in the prototype</span>' : ''}
            </div>
            <h3>${opt.title}</h3>
            <p class="do-concept">${opt.concept}</p>
            <div class="do-frame" data-frame><div class="do-canvas dm">${opt.html}</div></div>
            <div class="do-notes"><p><b>Good for</b> ${opt.good}</p><p><b>Watch for</b> ${opt.watch}</p></div>
          </article>`
          )
          .join('')}
      </div>
    </section>`
  ).join('');

  fit();
}

/* Scale every 960×600 canvas to its frame's width. */
function fit() {
  document.querySelectorAll('[data-frame]').forEach((frame) => {
    const canvas = frame.firstElementChild;
    const scale = frame.clientWidth / 960;

    canvas.style.transform = `scale(${scale})`;
    frame.style.height = `${600 * scale}px`;
  });
}

render();
window.addEventListener('resize', fit);
if ('ResizeObserver' in window) new ResizeObserver(fit).observe(document.body);
P.initTheme();
