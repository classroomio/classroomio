import { ic } from './ui.mjs';

const PEOPLE = {
  amara: { name: 'Amara Nwosu', role: 'Support lead', team: 'Northwind', caption: 'Finished Admin certification' },
  ada: { name: 'Ada Obi', role: 'Customer admin', team: 'Northwind', caption: 'Finished API basics' },
  tunde: { name: 'Tunde Bello', role: 'Solutions engineer', team: 'Northwind', caption: 'Learning Onboarding 101' },
  kofi: { name: 'Kofi Mensah', role: 'Product specialist', team: 'Northwind', caption: 'Learning API basics' }
};

function face(root, person, cls = 'sn-av') {
  return `<img class="${cls}" src="${root}assets/img/people/${person}-face.jpg" alt="" loading="lazy" width="26" height="26" />`;
}

function avatars(root, people) {
  const items = people.map((entry) =>
    Array.isArray(entry) ? `<i class="sn-av ${entry[1]}">${entry[0]}</i>` : face(root, entry)
  );

  return `<span class="sn-avs">${items.join('')}</span>`;
}

function head(icon, title, badge = '') {
  return `<div class="sn-head"><span class="sn-title"><span class="sn-ico">${ic(icon)}</span>${title}</span>${badge}</div>`;
}

const SNIPPETS = {
  draft: () => `<div class="sn">
    ${head('spark', 'AI course draft', '<span class="sn-pill violet">Drafting</span>')}
    <p class="sn-sub">Getting started with webhooks</p>
    <ol class="sn-steps">
      <li>${ic('check')}What a webhook is</li>
      <li>${ic('check')}Create your first endpoint</li>
      <li>${ic('check')}Test with a sample event</li>
      <li class="pending"><i class="sn-spin"></i>Quiz: check your setup</li>
    </ol>
  </div>`,

  progress: (role, root) => `<div class="sn">
    <div class="sn-head"><span class="sn-title">Onboarding 101</span><span class="sn-meta">128 learners</span></div>
    <div class="sn-bar"><i style="--w:72%"></i></div>
    <div class="sn-row">${avatars(root, ['amara', 'tunde', 'ada', ['+125', 't3']])}<span class="sn-good">72% complete</span></div>
  </div>`,

  cohort: (role, root) => `<div class="sn">
    <div class="sn-head"><span class="sn-title">Spring onboarding cohort</span><span class="sn-pill blue">Week 3 of 6</span></div>
    <div class="sn-bar"><i style="--w:50%"></i></div>
    <div class="sn-row">${avatars(root, ['tunde', 'ada', 'amara', ['RS', 't4']])}<span class="sn-meta">24 learners</span></div>
    <div class="sn-goal">${ic('check')}Goal: first integration live</div>
  </div>`,

  certificate: (role, root) =>
    role === 'anchor'
      ? `<div class="sn sn-cert">
    ${face(root, 'amara', 'sn-cert-photo')}
    <span class="sn-cert-kicker">Certificate of completion</span>
    <b class="sn-cert-name">Amara Nwosu</b>
    <span class="sn-cert-course">Admin certification · Northwind Academy</span>
    <div class="sn-cert-foot"><span>Issued 21 Oct 2026</span><span class="sn-pill green">${ic('check')}Verified</span></div>
  </div>`
      : `<div class="sn sn-toast">
    <span class="sn-face">${face(root, 'ada', 'sn-face-img')}<i>${ic('award')}</i></span>
    <div><b>Certificate issued</b><span>Ada finished API basics</span></div>
    <span class="sn-meta">now</span>
  </div>`,

  dropoff: () => `<div class="sn">
    ${head('chart', 'Where learners stop')}
    <div class="sn-cols">${[100, 88, 80, 42, 38]
      .map(
        (height, index) =>
          `<span class="${index === 3 ? 'hot' : ''}" style="--h:${height}%"><em>L${index + 1}</em></span>`
      )
      .join('')}</div>
    <div class="sn-row"><span class="sn-meta">Lessons 1 to 5</span><span class="sn-hot">38% stop at L4</span></div>
  </div>`,

  domain: () => `<div class="sn">
    <span class="sn-kicker">Custom domain</span>
    <div class="sn-url"><span class="sn-lock">${ic('lock')}</span><span>learn.northwind.example</span></div>
    <div class="sn-row"><span class="sn-swatches"><i style="background:#0233bd"></i><i style="background:#17140f"></i><i style="background:#adc3ff"></i></span><span class="sn-pill green">${ic('check')}Verified</span></div>
  </div>`,

  tutor: (role, root) => `<div class="sn sn-chat">
    ${head('chat', 'AI tutor', '<span class="sn-meta">Lesson 3</span>')}
    <div class="sn-ask"><p class="sn-msg me">How do I rotate my API key?</p>${face(root, 'tunde')}</div>
    <div class="sn-reply"><span class="sn-badge violet">${ic('spark')}</span><p class="sn-msg ai">Open Settings, then API keys. Step 2 of this lesson walks through it.</p></div>
  </div>`,

  webhook: () => `<div class="sn sn-code">
    ${head('plug', 'Webhook', '<span class="sn-pill green">200 OK</span>')}
    <code><span class="k">event</span> <span class="s">course.completed</span></code>
    <code><span class="k">learner</span> ada@northwind.example</code>
    <code><span class="k">course</span> api-basics</code>
  </div>`,

  mcp: () => `<div class="sn sn-term">
    <div class="sn-head"><span class="sn-title"><span class="sn-ico">${ic('terminal')}</span>MCP</span><span class="sn-meta">Claude</span></div>
    <code><span class="p">&gt;</span> add a quiz to lesson 3<i class="sn-caret"></i></code>
    <code class="ok">${ic('check')}5 questions added</code>
  </div>`,

  collab: (role, root) => `<div class="sn">
    ${head('users', 'Course team', '<span class="sn-pill blue">Unlimited</span>')}
    <div class="sn-row">${avatars(root, ['amara', ['CS', 't1'], 'tunde', ['DX', 't4']])}<span class="sn-add">${ic('plus')}</span></div>
    <div class="sn-join">${face(root, 'ada')}<span><b>Ada</b> joined as editor</span></div>
  </div>`,

  capacity: () => `<div class="sn">
    <div class="sn-head"><span class="sn-title">Students</span><span class="sn-meta">Early Adopter · $35</span></div>
    <div class="sn-big">2,340<small>of 10,000</small></div>
    <div class="sn-bar blue"><i style="--w:23%"></i></div>
    <span class="sn-meta">Priced by student capacity</span>
  </div>`
};

function snippet(kind, role, root) {
  const make = SNIPPETS[kind];
  if (!make) throw new Error(`Unknown hero snippet: ${kind}`);

  return make(role, root);
}

const ARROW =
  '<svg class="stage-arrow" viewBox="0 0 64 56" aria-hidden="true"><path d="M6 8c2 22 22 34 48 32"/><path d="M46 32l9 8-9 7"/></svg>';

const PATHS = {
  cascade: 'M-10 470C120 490 140 300 300 280S470 80 610 50',
  mirror: 'M610 470C480 490 460 300 300 280S130 80 -10 50',
  column: 'M300 -10C230 150 370 390 300 550',
  ledge: 'M190 250C190 300 130 310 130 340M410 250C410 280 470 290 470 300',
  spotlight: ''
};

const FRAMES = ['window', 'panel', 'bare', 'portrait', 'photo'];

function connector(layout) {
  const path = PATHS[layout];
  if (!path) return '';

  return `<svg class="stage-path" viewBox="0 0 600 540" preserveAspectRatio="none" aria-hidden="true"><path d="${path}"/></svg>`;
}

function portrait(root, person) {
  const { name, caption } = PEOPLE[person];

  return `<figure class="stage-portrait">
    <img src="${root}assets/img/people/${person}.jpg" alt="" width="720" height="900" />
    <figcaption><b>${name}</b><span>${ic('check')}${caption}</span></figcaption>
  </figure>`;
}

const DUO_LINES = `<svg class="duo-lines" viewBox="0 0 600 560" aria-hidden="true">
  <path d="M600 40C520 60 470 130 400 150"/>
  <path d="M600 260C540 250 520 200 470 190C430 182 420 210 420 230"/>
  <path d="M30 420C20 360 70 320 130 310"/>
  <circle cx="470" cy="76" r="4"/><circle cx="560" cy="242" r="4"/><circle cx="96" cy="320" r="4"/>
</svg>`;

function personCard(root, person, extra = '') {
  const { name, role, team } = PEOPLE[person];

  return `<div class="duo-card duo-person">
    <img src="${root}assets/img/people/${person}-face.jpg" alt="" width="40" height="40" />
    <div><b>${name}</b><span>${role}</span><small>${team}</small></div>
    ${extra}
  </div>`;
}

/**
 * Renders the two-portrait people stage: learner photos with person, course and time cards.
 * @param {{ people: [string, string], course: string, lessons: number, lesson: string, tone?: 'mint' | 'lavender' | 'sky' }} duo
 * @param {string} root
 */
function peopleStage({ people, course, lessons, lesson, tone = 'mint' }, root) {
  const [first, second] = people;

  return `<div class="stage f-photo" role="img" aria-label="Illustrative ClassroomIO learners and course cards">
    <div class="stage-bar"><i></i><i></i><i></i></div>
    <div class="stage-canvas duo tone-${tone}">
      ${DUO_LINES}
      <figure class="duo-photo one"><img src="${root}assets/img/people/${first}.jpg" alt="" width="720" height="900" /></figure>
      <figure class="duo-photo two"><img src="${root}assets/img/people/${second}.jpg" alt="" width="720" height="900" /></figure>
      <div class="duo-slot p1">${personCard(root, first)}</div>
      <div class="duo-slot course"><div class="duo-card duo-tag"><b>${course}</b><span><i class="blue">${ic('book')}${lessons} lessons</i><i class="coral">${ic('award')}Certified</i></span></div></div>
      <div class="duo-slot p2">${personCard(root, second, `<i class="duo-pill violet">${ic('users')}Cohort 3</i>`)}</div>
      <div class="duo-slot timer"><div class="duo-card duo-timer"><div><b>Time in lesson</b><strong>6:42</strong></div><span>${ic('book')}<em>${lesson}</em></span></div></div>
      <span class="duo-expand" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7"/></svg></span>
    </div>
  </div>`;
}

/**
 * Renders the hero stage. `frame: 'photo'` draws the two-portrait people stage; the other frames draw
 * one anchor snippet and two floating snippets on a browser window, a tinted panel, nothing, or one learner portrait.
 * @param {{ anchor?: string, floats?: [string, string], layout?: 'cascade' | 'mirror' | 'column' | 'ledge' | 'spotlight', canvas?: 'grid' | 'dots' | 'rings' | 'glow' | 'lines', frame?: 'window' | 'panel' | 'bare' | 'portrait' | 'photo', person?: string, people?: [string, string], tone?: 'mint' | 'lavender' | 'sky', course?: string, lessons?: number, lesson?: string, path?: string, note?: string }} stage
 * @param {string} root Relative path from the page to the site root.
 */
export function heroStage(stage, root) {
  const { frame = 'window' } = stage;
  if (!FRAMES.includes(frame)) throw new Error(`Unknown hero frame: ${frame}`);
  if (frame === 'photo') return peopleStage(stage, root);

  const { anchor, floats, layout = 'cascade', canvas = 'grid', person = 'amara', path = '', note = '' } = stage;
  if (!(layout in PATHS)) throw new Error(`Unknown hero layout: ${layout}`);

  const [first, second] = floats;
  const bar =
    frame === 'window'
      ? `<div class="stage-bar"><i></i><i></i><i></i><span class="stage-url">${ic('lock')}learn.northwind.example${path}</span></div>`
      : '';
  const noteMarkup = note ? `<div class="stage-note"><span>${note}</span>${ARROW}</div>` : '';

  return `<div class="stage f-${frame} l-${layout} bg-${canvas}" role="img" aria-label="Illustrative ClassroomIO product snippets">
    ${bar}
    <div class="stage-canvas">
      ${frame === 'portrait' ? portrait(root, person) : connector(layout)}
      <div class="stage-slot anchor">${snippet(anchor, 'anchor', root)}</div>
      <div class="stage-slot f1">${snippet(first, 'float', root)}</div>
      <div class="stage-slot f2">${snippet(second, 'float', root)}</div>
      ${noteMarkup}
    </div>
  </div>`;
}
