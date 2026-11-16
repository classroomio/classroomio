const TEAM = [
  { id: 'u1', name: 'Ellena Okpani', role: 'Org admin', color: 'oklch(0.55 0.2 265)' },
  { id: 'u2', name: 'Ada Obi', role: 'Tutor', color: 'oklch(0.6 0.15 160)' },
  { id: 'u3', name: 'Tunde Bello', role: 'Tutor', color: 'oklch(0.62 0.17 40)' }
];

const removedIds = [];
const isFormer = (id) => removedIds.includes(id);

const ITEMS = [
  {
    id: 'l1',
    kind: 'Lesson',
    section: 'Pricing basics',
    title: 'Why pricing matters',
    paras: [
      'Pricing is the fastest lever a business has. A one percent price improvement lifts profit far more than a one percent cost cut.',
      'Yet most founders guess their price in an afternoon and never look at it again. In this lesson we will build a simple process to set it with evidence.',
      'We will cover three methods: cost-plus, competitor-based and value-based pricing. By the end you will know which one fits your product.'
    ],
    video: { duration: 312 },
    slides: 5,
    image: true
  },
  {
    id: 'l2',
    kind: 'Lesson',
    section: 'Pricing basics',
    title: 'Value-based pricing',
    paras: [
      'Value-based pricing starts with the customer, not with your costs. Ask what the result is worth to them, then price a fraction of it.',
      'Interview five customers this week and write down the problem they would pay most to remove.'
    ]
  },
  {
    id: 'e1',
    kind: 'Exercise',
    section: 'Practice',
    title: 'Quiz: pick a price',
    paras: ['Answer the questions below to check your understanding.'],
    questions: [
      {
        id: 'q1',
        title: 'Which method starts from what the customer gains?',
        options: ['Cost-plus', 'Competitor-based', 'Value-based']
      }
    ]
  }
];

const ORIGINAL_SENTENCE = 'most founders guess their price in an afternoon and never look at it again.';

function seed() {
  const threads = [
    mk(
      't1',
      {
        type: 'text',
        itemId: 'l1',
        quote: 'A one percent price improvement lifts profit far more than a one percent cost cut'
      },
      [
        c('u2', 'This claim needs a source. @Ellena Okpani can you add one?', '2h ago'),
        c('u1', 'Good catch, I will add the study (https://example.com/pricing-study) tonight.', '1h ago')
      ]
    ),
    mk('t2', { type: 'text', itemId: 'l1', quote: 'most founders guess their price in an afternoon' }, [
      c('u1', 'Feels a bit casual for this course. @Ada Obi can you rewrite it?', '40m ago')
    ]),
    mk('t3', { type: 'video', itemId: 'l1', time: 134, assetId: 'v1' }, [
      c('u3', 'The slide is cut off at this moment. @Ellena Okpani', '3h ago')
    ]),
    mk('t4', { type: 'course', itemId: null }, [
      c('u1', 'Let us agree on one tone of voice for all lessons before we record more.', 'Yesterday')
    ]),
    mk(
      't5',
      { type: 'text', itemId: 'l1', quote: 'three methods' },
      [c('u2', 'Should this be four methods?', 'Yesterday'), c('u1', 'Kept three on purpose. Resolving.', 'Yesterday')],
      'resolved',
      'u1',
      'Yesterday'
    ),
    mk('t6', { type: 'question', itemId: 'e1', questionId: 'q1' }, [
      c('u3', 'The competitor option could also be argued as correct. Can we reword?', '5h ago')
    ]),
    mk('t7', { type: 'lesson', itemId: 'l2' }, [
      c('u2', 'We need a worked example in this lesson. @Tunde Bello can you draft one?', '1d ago')
    ]),
    mk(
      't8',
      { type: 'lesson', itemId: 'l2' },
      [
        c('u3', 'The intro paragraph is too long, can we split it in two?', '10d ago'),
        c('u2', 'Split into two short paragraphs.', '9d ago')
      ],
      'resolved',
      'u3',
      '9d ago'
    ),
    mk(
      't9',
      { type: 'course', itemId: null },
      [
        c('u1', 'Let us rename the section Practice to Try it yourself.', '3w ago'),
        c('u3', 'Agreed, that reads friendlier.', '3w ago')
      ],
      'resolved',
      'u1',
      '3w ago'
    ),
    mk(
      't10',
      { type: 'lesson', itemId: 'l1' },
      [c('u2', 'The lesson summary is missing. Adding one.', '5w ago')],
      'resolved',
      'u2',
      '5w ago'
    ),
    mk('t11', { type: 'slide', itemId: 'l1', slide: 3 }, [
      c('u2', 'This headline is too long for one line. Can we shorten it?', '3h ago')
    ]),
    mk('t12', { type: 'slide', itemId: 'l1', slide: 3 }, [
      c('u3', 'Where does the 12% come from? We need a source. @Ellena Okpani', '5h ago')
    ]),
    mk('t13', { type: 'slide', itemId: 'l1', slide: 4 }, [
      c('u1', 'Value-based is the method we recommend, so highlight it.', '1d ago')
    ]),
    mk('t14', { type: 'image', itemId: 'l1', x: 19, y: 36 }, [
      c('u3', 'Blur the competitor logo before we publish this screenshot.', '2d ago')
    ])
  ];
  return threads;
}

function seedNotifs() {
  return [
    { id: 'n1', userId: 'u1', threadId: 't1', text: 'Ada Obi mentioned you', read: false },
    { id: 'n2', userId: 'u1', threadId: 't3', text: 'Tunde Bello mentioned you', read: false },
    { id: 'n3', userId: 'u2', threadId: 't2', text: 'Ellena Okpani mentioned you', read: false }
  ];
}

function seedSeen() {
  return {
    u1: { t1: 2, t4: 1, t5: 2, t8: 2, t9: 2, t10: 1 },
    u2: { t3: 1, t4: 1, t6: 1, t8: 2, t9: 2, t10: 1 },
    u3: { t1: 1, t3: 1, t5: 2, t6: 1, t7: 1, t8: 2, t9: 2, t10: 1 }
  };
}

const cloneParas = (paras) => JSON.parse(JSON.stringify(paras));

function seedVersions() {
  const current = cloneParas(ITEMS[0].paras);
  const intro = cloneParas(current);
  intro[1] = intro[1].replace('most founders', 'founders');
  const draft = cloneParas(intro);
  draft[0] = 'Pricing is important for every business.';
  draft[2] = 'We will cover two methods: cost-plus and competitor-based pricing.';
  const lessonTwo = cloneParas(ITEMS[1].paras);
  return {
    l1: [
      { id: 'l1-v3', who: 'u1', when: 'Today', label: 'Added the profit example', paras: current },
      { id: 'l1-v2', who: 'u2', when: '2 days ago', label: 'Rewrote the intro', paras: intro },
      { id: 'l1-v1', who: 'u1', when: '1 week ago', label: 'First draft', paras: draft }
    ],
    l2: [
      { id: 'l2-v2', who: 'u3', when: '5 days ago', label: 'Added the interview task', paras: lessonTwo },
      { id: 'l2-v1', who: 'u1', when: '2 weeks ago', label: 'First draft', paras: lessonTwo.slice(0, 1) }
    ],
    e1: [{ id: 'e1-v1', who: 'u1', when: '2 weeks ago', label: 'Created', paras: cloneParas(ITEMS[2].paras) }]
  };
}

function pushVersion(itemId, label) {
  state.versions[itemId].unshift({
    id: 'ver' + cid++,
    who: state.viewer,
    when: 'Just now',
    label,
    paras: cloneParas(itemParas(itemId))
  });
}

let cid = 100;
function c(author, body, when) {
  return { id: 'c' + cid++, author, body, mentions: parseMentions(body), when, edited: false };
}
function mk(id, anchor, comments, status = 'open', resolvedBy = null, resolvedAt = null) {
  const log = comments.map((cm, i) => ({
    who: cm.author,
    text: i === 0 ? 'started this thread' : 'replied',
    when: cm.when
  }));
  if (status === 'resolved') log.push({ who: resolvedBy, text: 'resolved this thread', when: resolvedAt });
  return { id, anchor, comments, status, resolvedBy, resolvedAt, log };
}
function logEvent(thread, who, text, when = 'just now') {
  thread.log.push({ who, text, when });
}
function parseMentions(body) {
  const found = [];
  TEAM.filter((m) => !isFormer(m.id)).forEach((member) => {
    const token = '@' + member.name;
    let from = 0;
    while (true) {
      const at = body.indexOf(token, from);
      if (at === -1) break;
      found.push({ userId: member.id, start: at, end: at + token.length });
      from = at + token.length;
    }
  });
  return found.sort((a, b) => a.start - b.start);
}

const state = {
  threads: seed(),
  paras: JSON.parse(JSON.stringify(ITEMS.map((item) => item.paras))),
  videoAsset: 'v1',
  questionGone: false,
  notifs: seedNotifs(),
  seen: seedSeen(),
  viewer: 'u1',
  itemId: 'l1',
  panelOpen: true,
  fUnread: true,
  fRead: true,
  fResolved: false,
  fPeople: [],
  filterOpen: false,
  blockFilter: null,
  pinMode: false,
  showText: true,
  showVideo: true,
  showPins: true,
  activeId: null,
  versions: seedVersions(),
  verSel: null,
  draft: null,
  editing: null,
  time: 0,
  slide: 3,
  playing: false,
  typing: null
};
const drafts = {};
let timer = null;
let mentionState = null;

const $ = (id) => document.getElementById(id);
const esc = (s) => s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
const member = (id) => TEAM.find((m) => m.id === id);
const isLearner = () => state.viewer === 'learner';
const me = () => member(state.viewer);
const item = (id) => ITEMS.find((it) => it.id === id);
const itemParas = (id) => state.paras[ITEMS.findIndex((it) => it.id === id)];
const fmt = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(Math.floor(s % 60)).padStart(2, '0');

const ICON = {
  comment:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  bell: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
  play: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
  check:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  link: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  clock:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  close:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>'
};

function textRange(thread) {
  if (thread.anchor.type !== 'text') return null;
  const paras = itemParas(thread.anchor.itemId);
  for (let p = 0; p < paras.length; p++) {
    const at = paras[p].indexOf(thread.anchor.quote);
    if (at !== -1) return { para: p, start: at, end: at + thread.anchor.quote.length };
  }
  return null;
}

function anchorState(thread) {
  const a = thread.anchor;
  if (a.type === 'text' && !textRange(thread)) return 'Original text was removed';
  if (a.type === 'video' && a.assetId !== state.videoAsset) return 'Video has changed';
  if (a.type === 'question' && state.questionGone) return 'Question was removed';
  return null;
}

const openCount = (itemId) =>
  state.threads.filter((t) => t.status === 'open' && (itemId === undefined || t.anchor.itemId === itemId)).length;

function unreadCount(thread, userId = state.viewer) {
  if (thread.status !== 'open') return 0;
  const seen = (state.seen[userId] || {})[thread.id] || 0;
  return thread.comments.slice(seen).filter((cm) => cm.author !== userId).length;
}

const hasUnread = (itemId) =>
  !isLearner() && state.threads.some((t) => (itemId === undefined || t.anchor.itemId === itemId) && unreadCount(t) > 0);

function markSeen(thread) {
  if (!state.seen[state.viewer]) state.seen[state.viewer] = {};
  state.seen[state.viewer][thread.id] = thread.comments.length;
}

function threadLink(threadId) {
  return location.href.split('#')[0] + '#thread=' + threadId;
}

function copyLink(threadId) {
  const link = threadLink(threadId);
  const done = () => toast('Link copied. Teammates on this course can open it.');
  try {
    navigator.clipboard.writeText(link).then(done, done);
  } catch (err) {
    done();
  }
}

function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (el.hidden = true), 2600);
}

function notify(userId, threadId, text) {
  if (userId === state.viewer || isFormer(userId)) return;
  state.notifs.unshift({ id: 'n' + cid++, userId, threadId, text, read: false });
}

const COURSE_TITLE = 'Pricing Strategy 101';

const unreadThreadCount = () => (isLearner() ? 0 : state.threads.filter((t) => unreadCount(t) > 0).length);

function renderHeader() {
  const learner = isLearner();
  const unread = unreadThreadCount();
  const staffControls = learner
    ? ''
    : `<button class="btn btn-outline btn-sm" id="openPanel" aria-pressed="${state.panelOpen}" aria-label="Comments and notifications" title="Comments and notifications">${ICON.comment}<span class="count-badge corner-badge">${unread || openCount()}</span></button>`;
  $('head').innerHTML = `
    <button class="btn-ghost-icon" data-act="toggle-sidebar" aria-label="Toggle sidebar">${icon('panel')}</button>
    <span class="vsep"></span>
    <span class="here">Content</span>
    ${learner ? '' : '<span class="badge badge-success-soft here-badge">Published</span>'}
    <span class="grow"></span>
    ${staffControls}
    <span class="btn btn-sm btn-assistant">${icon('sparkles')}<span class="assistant-label">Assistant</span></span>
    ${learner ? '' : `<span class="site-btn" style="display:inline-flex"><button class="btn btn-outline btn-sm" style="border-top-right-radius:0;border-bottom-right-radius:0">${icon('external')}View course site</button><button class="btn btn-outline btn-sm btn-icon-sm" aria-label="More" style="border-top-left-radius:0;border-bottom-left-radius:0;border-left:0">${icon('more')}</button></span>`}`;
}

function threadSummary(threadId) {
  const thread = state.threads.find((t) => t.id === threadId);
  if (!thread) return 'This thread was deleted';
  const text = thread.comments[0].body;
  return text.length > 60 ? text.slice(0, 60) + '…' : text;
}

function renderSidebar() {
  const learner = isLearner();
  const sections = [...new Set(ITEMS.map((it) => it.section))];
  const tree = sections
    .map((section) => {
      const rows = ITEMS.filter((it) => it.section === section)
        .map((it) => {
          const count = learner ? 0 : openCount(it.id);
          const type = it.kind.toLowerCase();
          return `<li><a class="cs-row ${it.id === state.itemId ? 'active' : ''}" href="#" data-item="${it.id}">${icon(type, 14, `class="${type}-icon"`)}<span class="title">${esc(it.title)}</span>${learner || !hasUnread(it.id) ? '' : '<span class="unread-dot" title="New replies you have not seen"></span>'}${count ? `<span class="cmt-count" title="Open comments">${count}</span>` : ''}</a></li>`;
        })
        .join('');
      return `<li><div class="sec">${esc(section)}</div><ul style="list-style:none;margin:0;padding:0">${rows}</ul></li>`;
    })
    .join('');
  const lessons = ITEMS.filter((it) => it.kind === 'Lesson').length;
  const exercises = ITEMS.filter((it) => it.kind === 'Exercise').length;
  const staffNav = learner
    ? ''
    : `<a class="cs-nav" href="#">${icon('chart')}<span>Analytics</span></a>
       <a class="cs-nav" href="#">${icon('exercise')}<span>Submissions</span></a>
       <a class="cs-nav" href="#">${icon('newsFeed')}<span>People</span></a>`;
  $('side').innerHTML = `
    <a class="cs-course" href="#"><span class="cs-ring" style="display:grid;place-items:center;width:24px;height:24px;border-radius:6px;background:var(--secondary);font-size:11px;font-weight:600">PS</span>
      <span style="min-width:0"><span class="t" style="display:block">${COURSE_TITLE}</span></span></a>
    <div class="cs-side-scroll">
      <a class="cs-nav" href="#">${icon('arrowLeft')}<span>Exit course</span></a>
      <a class="cs-nav" href="#">${icon('newsFeed')}<span>News Feed</span></a>
      <a class="cs-nav active" href="#">${icon('content')}<span>Content</span>
        <span class="tail"><span class="cs-pills"><span class="cs-pill">${icon('lesson', 11, 'style="color:var(--lesson)"')}${lessons}</span><span class="cs-pill">${icon('exercise', 11, 'style="color:var(--exercise)"')}${exercises}</span></span>${icon('chevronDown', 14, 'style="color:var(--muted-foreground)"')}</span>
      </a>
      <ul class="cs-tree">${tree}</ul>
      ${staffNav}
      <a class="cs-nav" href="#">${icon('certificates')}<span>Certificates</span></a>
    </div>
    <div class="cs-side-foot"><div class="cs-powered">Powered by <b>ClassroomIO</b></div></div>`;
}

function highlightedParagraph(it, p) {
  const text = itemParas(it.id)[p];
  const ranges = [];
  if (!isLearner()) {
    state.threads.forEach((t) => {
      if (t.status !== 'open' || t.anchor.itemId !== it.id) return;
      if (!state.showText && t.id !== state.activeId) return;
      const r = textRange(t);
      if (r && r.para === p) ranges.push({ ...r, id: t.id });
    });
  }
  if (!ranges.length) return esc(text);
  const cuts = [...new Set([0, text.length, ...ranges.flatMap((r) => [r.start, r.end])])].sort((a, b) => a - b);
  let html = '';
  for (let i = 0; i < cuts.length - 1; i++) {
    const [from, to] = [cuts[i], cuts[i + 1]];
    const ids = ranges.filter((r) => r.start <= from && r.end >= to).map((r) => r.id);
    const chunk = esc(text.slice(from, to));
    html += ids.length
      ? `<mark class="hl ${ids.length > 1 ? 'hl-multi' : ''} ${ids.includes(state.activeId) ? 'flash' : ''}" data-ids="${ids.join(' ')}">${chunk}</mark>`
      : chunk;
  }
  return html;
}

function renderVideo(it) {
  const changed = state.videoAsset !== 'v1';
  const markers = isLearner()
    ? ''
    : state.threads
        .filter(
          (t) =>
            t.anchor.type === 'video' &&
            t.anchor.itemId === it.id &&
            t.status === 'open' &&
            !anchorState(t) &&
            (state.showVideo || t.id === state.activeId)
        )
        .map(
          (t) =>
            `<button class="marker ${t.id === state.activeId ? 'flash' : ''}" style="left:${(t.anchor.time / it.video.duration) * 100}%" data-marker="${t.id}" aria-label="Comment at ${fmt(t.anchor.time)}">${t.comments.length}</button>`
        )
        .join('');
  return `<section class="video" aria-label="Lesson video">
    <div class="video-frame ${changed ? 'changed' : ''}">
      <button class="play" id="play" aria-label="Play or pause">${state.playing ? ICON.pause : ICON.play}</button>
      <span class="video-time" id="vtime">${fmt(state.time)} / ${fmt(it.video.duration)}</span>
    </div>
    ${changed ? '<div class="video-note">A new video was uploaded.</div>' : ''}
    <div class="timeline">
      <div class="track"></div><div class="progress" id="vprog" style="width:${(state.time / it.video.duration) * 100}%"></div>
      ${markers}
      <input class="scrub" id="scrub" type="range" min="0" max="${it.video.duration}" value="${state.time}" aria-label="Video position" />
    </div>
    <div class="video-foot"><span class="muted">${isLearner() ? '' : 'Pause the video where the problem is.'}</span>
      ${isLearner() ? '' : `<button class="btn btn-outline btn-sm" id="videoComment">${ICON.comment} <span id="videoCommentLabel">Comment at ${fmt(state.time)}</span></button>`}
    </div>
  </section>`;
}

const blockThreads = (it, kind) =>
  state.threads.filter((t) => {
    if (t.status !== 'open' || t.anchor.itemId !== it.id) return false;
    const type = t.anchor.type;
    if (kind === 'note') return type === 'text' || type === 'lesson' || (type === 'question' && state.questionGone);
    return type === kind;
  });

const blockKindOf = (thread) => {
  const type = thread.anchor.type;
  if (type === 'text' || type === 'lesson' || type === 'question') return 'note';

  return type;
};

const BLOCK_NAMES = { note: 'Note', video: 'Video', slide: 'Slides', image: 'Image' };

function pinMarkup(thread, number) {
  return `<button class="pin ${thread.id === state.activeId ? 'active' : ''}" style="left:${thread.anchor.x}%;top:${thread.anchor.y}%" data-pin="${thread.id}" aria-label="Comment ${number}"><span><b>${number}</b></span></button>`;
}

function stageHtml(it, kind, learner) {
  const onStage = (t) => t.anchor.type === kind && (kind === 'image' || t.anchor.slide === state.slide);
  const pins =
    learner || kind !== 'image'
      ? []
      : blockThreads(it, kind)
          .filter(onStage)
          .filter((t) => t.anchor.x != null && (state.showPins || t.id === state.activeId));
  const draft = state.draft;
  const draftPin =
    !learner && draft && draft.type === kind && draft.x != null && (kind === 'image' || draft.slide === state.slide)
      ? `<span class="pin draft" style="left:${draft.x}%;top:${draft.y}%"><span><b>+</b></span></span>`
      : '';
  const slideBodies = {
    3: '<h4>A 1% price rise lifts profit by up to 12%</h4><p class="stage-big">+12%</p>',
    4: '<h4>Three pricing methods</h4><ul class="stage-methods"><li>Cost-plus</li><li>Competitor-based</li><li>Value-based</li></ul>'
  };
  const imageBody = `<div class="shot"><div class="shot-bar"><span class="shot-logo">Acme</span><span>Pricing</span><span>Docs</span></div>
      <div class="shot-plans"><div><b>Basic</b><span>$19</span></div><div class="pro"><b>Pro</b><span>$39</span></div><div><b>Team</b><span>$79</span></div></div></div>`;
  const body = kind === 'slide' ? slideBodies[state.slide] || `<h4>Slide ${state.slide}</h4>` : imageBody;
  const label = kind === 'slide' ? `Slide ${state.slide} of ${it.slides}` : 'Screenshot: a competitor pricing page';
  return `<div class="stage stage-${kind}${state.pinMode && state.draft && state.draft.type === kind ? ' pin-mode' : ''}" data-stage="${kind}"><div class="stage-content">${body}</div><span class="stage-label">${label}</span>${pins.map((t, i) => pinMarkup(t, i + 1)).join('')}${draftPin}</div>`;
}

function renderPage() {
  const it = item(state.itemId);
  const learner = isLearner();
  const paras = itemParas(it.id)
    .map((_, p) => `<p data-para="${p}">${highlightedParagraph(it, p)}</p>`)
    .join('');
  const questions = (it.questions || [])
    .filter(() => !state.questionGone)
    .map((q) => {
      const count = state.threads.filter((t) => t.status === 'open' && t.anchor.questionId === q.id).length;
      return `<div class="question" data-q="${q.id}"><div><h3>${esc(q.title)}</h3><ul>${q.options.map((o) => `<li>${esc(o)}</li>`).join('')}</ul></div>
        ${learner ? '' : `<button class="btn btn-secondary btn-sm" data-qcomment="${q.id}" aria-label="Comment on this question">${ICON.comment}${count ? `<span>${count}</span>` : ''}</button>`}</div>`;
    })
    .join('');
  if (learner) {
    $('page').innerHTML = `
    <div class="pg-head"><div style="min-width:0"><h1 class="pg-title">${esc(it.title)}</h1>
      <p class="pg-sub"><span>${esc(it.section)}</span><span class="sep">·</span><span>${it.kind}</span></p></div></div>
    <div class="lesson-col">
      <p class="learner-note">Learner view: comments are not visible here and are not returned by the API.</p>
      <div class="doc" id="doc">${paras}</div>
      ${it.video ? renderVideo(it) : ''}
      ${it.slides ? `<section class="plain-block">${stageHtml(it, 'slide', true)}</section>` : ''}
      ${it.image ? `<section class="plain-block">${stageHtml(it, 'image', true)}</section>` : ''}
      ${questions}
    </div>`;
    return;
  }
  const toolIcon = (name, label) =>
    `<button class="tb-btn" type="button" tabindex="-1" aria-label="${label}" title="${label}">${icon(name, 16)}</button>`;
  const toolbar = `<div class="blk-toolbar" role="toolbar" aria-label="Text formatting">
      ${toolIcon('undo', 'Undo')}${toolIcon('redo', 'Redo')}<span class="tb-sep"></span>
      <button class="tb-btn tb-wide" type="button" tabindex="-1" aria-label="Heading">${icon('heading', 16)}${icon('chevDown', 12)}</button>
      ${toolIcon('link', 'Link')}${toolIcon('pilcrow', 'Paragraph')}${toolIcon('bold', 'Bold')}${toolIcon('italic', 'Italic')}${toolIcon('underline', 'Underline')}${toolIcon('strike', 'Strikethrough')}${toolIcon('quote', 'Quote')}${toolIcon('code', 'Code')}${toolIcon('list', 'Bulleted list')}${toolIcon('listOrdered', 'Numbered list')}${toolIcon('image', 'Image')}
      <span class="grow"></span>
    </div>`;
  const blockHead = (label, extra = '') =>
    `<div class="blk-head"><span class="blk-grip" aria-hidden="true">${icon('grip', 14)}</span><span class="blk-label">${label}</span><span class="grow"></span>${extra}<button class="btn-ghost-icon" type="button" tabindex="-1" aria-label="More options">${icon('more', 16)}</button></div>`;
  const blockBtn = (kind, label) => {
    const count = blockThreads(it, kind).length;
    return `<button class="btn-ghost-icon blk-comment" data-blockc="${kind}" aria-label="${label}" title="${label}">${ICON.comment}${count ? `<span class="count-badge corner-badge">${count}</span>` : ''}</button>`;
  };
  $('page').innerHTML = `
    <div class="ed-head">
      <h1 class="ed-title">${esc(it.title)}</h1>
      <div class="ed-actions">
        <span class="ed-saved">Saved</span>
        <button class="btn btn-secondary btn-icon-sm" type="button" aria-label="Save" title="Save">${icon('save')}</button>
        <button class="btn btn-secondary btn-icon-sm" type="button" aria-label="Settings" title="Settings">${icon('settings')}</button>
        <button class="btn btn-primary btn-sm" id="publish" type="button">Publish</button>
        <div class="ed-mode" role="group" aria-label="Mode"><button type="button" tabindex="-1">${icon('eye', 14)}Preview</button><button type="button" tabindex="-1" aria-pressed="true">${icon('pencil', 14)}Edit</button></div>
      </div>
    </div>
    <div class="ed-col">
      <section class="blk" aria-label="Note block">
        ${blockHead('Note', blockBtn('note', 'Comments on this note'))}
        <div class="blk-card">
          ${toolbar}
          <div class="doc" id="doc">${paras}</div>
        </div>
      </section>
      ${
        it.video
          ? `<section class="blk blk-video" aria-label="Video block">${blockHead('Video', blockBtn('video', 'Comments on this video'))}<div class="blk-card">${renderVideo(it)}</div></section>`
          : ''
      }
      ${it.slides ? `<section class="blk" aria-label="Slides block">${blockHead('Slides', blockBtn('slide', 'Comments on these slides'))}<div class="blk-card blk-pad">${stageHtml(it, 'slide', false)}</div></section>` : ''}
      ${it.image ? `<section class="blk" aria-label="Image block">${blockHead('Image', blockBtn('image', 'Comments on this image'))}<div class="blk-card blk-pad">${stageHtml(it, 'image', false)}</div></section>` : ''}
      ${questions ? `<section class="blk" aria-label="Questions">${blockHead('Questions')}<div class="blk-card blk-pad">${questions}</div></section>` : ''}
      <div class="add-bar" aria-hidden="true"><span class="ab-ai">${icon('sparkles', 14)}Ask AI</span><span class="ab-sep"></span>
        <span>${icon('note', 16)}Note</span><span>${icon('video', 16)}Video</span><span>${icon('slides', 16)}Slides</span><span>${icon('document', 16)}Document</span><span>${icon('image', 16)}Image</span></div>
    </div>`;
}

function anchorChip(a) {
  const kinds = {
    course: ['content', 'Whole course'],
    lesson: ['note', 'Note'],
    text: ['note', 'Note'],
    video: ['video', a.type === 'video' ? `Video · ${fmt(a.time)}` : 'Video'],
    slide: ['slides', `Slide ${a.slide}`],
    image: ['image', 'Image'],
    question: ['exercise', 'Question']
  };
  const [name, label] = kinds[a.type];

  return `<span class="tag-type">${icon(name, 12)}${label}</span>`;
}

function anchorLine(thread) {
  const unread = unreadCount(thread);
  const a = thread.anchor;
  const problem = anchorState(thread);
  const parts = [anchorChip(a)];
  if (problem) parts.push(`<span class="tag tag-warn">${problem}</span>`);
  if (thread.status === 'resolved') parts.push('<span class="tag tag-ok">Resolved</span>');
  if (unread) parts.push(`<span class="tag tag-new">${unread} new</span>`);
  return `<div class="anchor-line">${parts.join('')}<button class="link-btn copy-link" data-act="copy-link" data-thread="${thread.id}" aria-label="Copy link to this thread">${ICON.link} Copy link</button></div>`;
}

function linkify(text) {
  return esc(text).replace(
    /https?:\/\/[^\s<)]+/g,
    (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
  );
}

function bodyHtml(comment) {
  let html = '';
  let at = 0;
  comment.mentions.forEach((m) => {
    html +=
      linkify(comment.body.slice(at, m.start)) +
      `<span class="mention ${isFormer(m.userId) ? 'off' : ''}">@${esc(member(m.userId).name)}</span>`;
    at = m.end;
  });
  return html + linkify(comment.body.slice(at));
}

function canDelete(comment) {
  return comment.author === state.viewer || state.viewer === 'u1';
}

function composer(key, placeholder, button) {
  return `<div class="composer"><textarea data-key="${key}" placeholder="${placeholder}" rows="2">${esc(drafts[key] || '')}</textarea>
    <div class="composer-row"><span class="hint">@ to mention a teammate</span>
    <span>${key === 'draft' ? `<button class="btn-ghost-icon" data-act="cancel-draft" aria-label="Cancel" title="Cancel">${icon('x')}</button>` : ''}${key.startsWith('edit') ? `<button class="btn-ghost-icon" data-act="cancel-edit" aria-label="Cancel" title="Cancel">${icon('x')}</button>` : ''}<button class="btn btn-primary btn-sm" data-act="post" data-key="${key}">${button}</button></span></div></div>`;
}

const formerTag = (id) =>
  isFormer(id)
    ? '<span class="former" title="No longer on this course team. Their comments stay.">Former member</span>'
    : '';

function commentHtml(thread, comment) {
  const author = member(comment.author);
  const key = `edit:${thread.id}:${comment.id}`;
  const editing = state.editing === key;
  if (editing && drafts[key] === undefined) drafts[key] = comment.body;
  return `<div class="comment"><div class="avatar" style="background:${author.color}">${author.name
    .split(' ')
    .map((w) => w[0])
    .join('')}</div>
    <div class="c-body"><div class="c-meta"><strong>${esc(author.name)}</strong><span>${author.role}</span>${formerTag(author.id)}<span>· ${comment.when}${comment.edited ? ' · edited' : ''}</span></div>
    ${
      editing
        ? composer(key, 'Edit comment', 'Save')
        : `<div class="c-text">${bodyHtml(comment)}</div>
    <div class="c-actions">${comment.author === state.viewer ? `<button class="link-btn" data-act="edit" data-thread="${thread.id}" data-comment="${comment.id}">Edit</button>` : ''}${canDelete(comment) ? `<button class="link-btn" data-act="delete" data-thread="${thread.id}" data-comment="${comment.id}">Delete</button>` : ''}</div>`
    }
    </div></div>`;
}

function threadHtml(thread) {
  const active = thread.id === state.activeId;
  const a = thread.anchor;
  const gone = anchorState(thread) === 'Original text was removed';
  const comments = active ? thread.comments : thread.comments.slice(0, 1);
  const hidden = thread.comments.length - comments.length;
  const resolver = thread.resolvedBy ? member(thread.resolvedBy).name : '';
  const resolverTag = thread.resolvedBy ? formerTag(thread.resolvedBy) : '';
  return `<div class="thread ${active ? 'active' : ''} ${thread.status} ${unreadCount(thread) ? 'unread' : ''}" data-thread="${thread.id}" tabindex="0">
    ${anchorLine(thread)}
    ${a.type === 'text' ? `<blockquote class="quote ${gone ? 'gone' : ''}">${esc(a.quote)}</blockquote>` : ''}
    ${comments.map((cm) => commentHtml(thread, cm)).join('')}
    ${hidden ? `<div class="muted">${hidden} ${hidden === 1 ? 'reply' : 'replies'}</div>` : ''}
    ${state.typing && state.typing.threadId === thread.id ? liveDraftHtml(member(state.typing.userId)) : ''}
    ${active ? `<div class="reply-wrap">${composer('reply:' + thread.id, 'Reply, or @ to mention', 'Reply')}</div>` : ''}
    ${
      active || thread.status === 'resolved'
        ? `<div class="thread-foot">${thread.status === 'resolved' ? `<span class="resolved-by">Resolved by ${esc(resolver)}${resolverTag} · ${esc(thread.resolvedAt || '')}</span>` : ''}
      <button class="btn btn-outline btn-sm" data-act="toggle" data-thread="${thread.id}">${thread.status === 'open' ? ICON.check + ' Resolve' : 'Reopen'}</button></div>`
        : ''
    }
  </div>`;
}

function matchesFilter(thread) {
  if (state.fPeople.length && !thread.comments.some((cm) => state.fPeople.includes(cm.author))) return false;
  if (thread.status === 'resolved') return state.fResolved;

  return unreadCount(thread) > 0 ? state.fUnread : state.fRead;
}

function setStatusFilter(kind) {
  state.fUnread = kind === 'open';
  state.fRead = kind === 'open';
  state.fResolved = kind === 'resolved';
  state.fPeople = [];
}

const filtersActive = () =>
  !(
    state.fUnread &&
    state.fRead &&
    !state.fResolved &&
    !state.fPeople.length &&
    state.showText &&
    state.showVideo &&
    state.showPins
  );

function toggleFilterOption(option) {
  if (option === 'open') {
    const on = state.fUnread || state.fRead;
    state.fUnread = !on;
    state.fRead = !on;
  } else if (option === 'unread') state.fUnread = !state.fUnread;
  else if (option === 'read') state.fRead = !state.fRead;
  else if (option === 'resolved') state.fResolved = !state.fResolved;
  else if (option === 'any') state.fPeople = [];
  else if (option === 'show:text') state.showText = !state.showText;
  else if (option === 'show:video') state.showVideo = !state.showVideo;
  else if (option === 'show:pins') state.showPins = !state.showPins;
  else {
    const id = option.slice(7);
    state.fPeople = state.fPeople.includes(id) ? state.fPeople.filter((p) => p !== id) : [...state.fPeople, id];
  }
}

function filterPopHtml() {
  const box = (option, label, checked, extra = '', cls = '') =>
    `<button class="fo ${cls}" role="checkbox" aria-checked="${checked}" data-fopt="${option}"><span class="cbx">${checked ? ICON.check : ''}</span>${extra}<span>${label}</span></button>`;
  const open = state.fUnread || state.fRead;
  const people = TEAM.filter((m) => !isFormer(m.id))
    .map((m) =>
      box(
        'person:' + m.id,
        esc(m.name) + (m.id === state.viewer ? ' (you)' : ''),
        state.fPeople.includes(m.id),
        `<span class="avatar sm" style="background:${m.color}">${initialsOf(m.name)}</span>`
      )
    )
    .join('');
  return `<div class="filter-pop" role="dialog" aria-label="Filter comments">
    <p class="fo-head">Status</p>
    ${box('open', 'Open', open)}${box('unread', 'Unread', state.fUnread, '', 'sub')}${box('read', 'Read', state.fRead, '', 'sub')}${box('resolved', 'Resolved', state.fResolved)}
    <div class="fo-sep"></div>
    <p class="fo-head">Person</p>
    ${box('any', 'Anyone', !state.fPeople.length)}${people}
    <div class="fo-sep"></div>
    <p class="fo-head">Show on content</p>
    ${box('show:text', 'Text highlights', state.showText)}${box('show:video', 'Video markers', state.showVideo)}${box('show:pins', 'Image pins', state.showPins)}</div>`;
}

function renderPanel() {
  const panel = $('panel');
  const open = state.panelOpen && !isLearner();
  document.body.classList.toggle('sp-open', open);
  if (!open) {
    panel.innerHTML = '';
    return;
  }
  const block = state.blockFilter;
  const inBlock = (t) => !block || (t.anchor.itemId === state.itemId && blockKindOf(t) === block);
  const visible = state.threads.filter((t) => matchesFilter(t) && inBlock(t));
  const groups = [{ title: 'General', list: visible.filter((t) => !t.anchor.itemId) }].concat(
    ITEMS.map((it) => ({ title: it.title, list: visible.filter((t) => t.anchor.itemId === it.id) }))
  );
  const draft = state.draft;
  const canPin = draft && draft.type === 'image';
  const pinButton = canPin
    ? `<button class="btn btn-outline btn-sm pin-spot" data-act="pin-spot" aria-pressed="${state.pinMode}">${icon('mapPin', 14)}${state.pinMode ? `Click the ${draft.type} to place it` : draft.x != null ? 'Move pin' : 'Pin to a spot'}</button>`
    : '';
  const draftHtml = draft
    ? `<div class="new-box"><div class="anchor-line">${anchorChip(draft)}${draft.x != null ? '<span class="tag">Pinned</span>' : ''}</div>${draft.type === 'text' ? `<blockquote class="quote">${esc(draft.quote)}</blockquote>` : ''}
        ${composer('draft', block ? `Comment on ${block === 'slide' ? 'slide ' + state.slide : BLOCK_NAMES[block].toLowerCase()}, @ to mention a teammate` : 'Write a comment, @ to mention a teammate', 'Comment')}${pinButton}</div>`
    : '';
  const blockHead = block
    ? `<div class="block-head"><span>${BLOCK_NAMES[block]} · ${visible.length} ${visible.length === 1 ? 'comment' : 'comments'}</span><button class="link-btn" data-act="show-all">Show all</button></div>`
    : '';
  const body = groups
    .filter((g) => g.list.length)
    .map((g) => `<div class="group-title">${esc(g.title)}</div>${g.list.map((t) => threadHtml(t)).join('')}`)
    .join('');
  const tipBtn = (tip, extra, attrs, svg, dot = '') =>
    `<button class="btn btn-outline btn-icon-sm tip ${extra}" data-tip="${tip}" aria-label="${tip}" ${attrs}>${svg}${dot}</button>`;
  panel.innerHTML = `<div class="sp-head"><div class="sp-title"><div class="t">Comments</div>
      <div class="sp-icons">${tipBtn('New comment', '', 'data-act="new-general"', icon('plus'))}${tipBtn('Filter comments', '', `data-act="toggle-filter" aria-pressed="${state.filterOpen}"`, icon('listFilter'), filtersActive() ? '<span class="unread-dot" aria-hidden="true"></span>' : '')}${tipBtn('Close (Esc)', 'tip-end', 'data-act="close-panel"', icon('x'))}</div></div>
      ${state.filterOpen ? filterPopHtml() : ''}
      <div class="s"><span class="live-pill" title="Comments from teammates appear without refreshing"><i></i>Live</span>${openCount()} open · only admins and tutors see these${hasUnread() ? '<button class="link-btn mark-read" data-act="mark-all-read">Mark all read</button>' : ''}</div></div>
    <div class="panel-body">${blockHead}${draftHtml}${body || (draft ? '' : '<div class="empty">No threads match these filters.</div>')}</div>`;
}

function renderAll() {
  renderHeader();
  renderSidebar();
  renderPage();
  renderPanel();
}

function startDraft(anchor, keepBlock = false) {
  state.draft = anchor;
  state.pinMode = false;
  if (!keepBlock) state.blockFilter = null;
  state.panelOpen = true;
  renderPage();
  renderPanel();
  const box = document.querySelector('.new-box textarea');
  if (box) box.focus();
}

function openBlockComments(kind) {
  const base = { itemId: state.itemId };
  const anchors = {
    note: { type: 'lesson', ...base },
    video: { type: 'video', ...base, time: state.time },
    slide: { type: 'slide', ...base, slide: state.slide },
    image: { type: 'image', ...base }
  };
  if (kind === 'video') setPlaying(false);
  state.blockFilter = kind;
  startDraft(anchors[kind], true);
}

function goTo(threadId, opts = {}) {
  const thread = state.threads.find((t) => t.id === threadId);
  if (!thread) return;
  state.activeId = threadId;
  state.panelOpen = true;
  markSeen(thread);
  state.notifs.forEach((n) => {
    if (n.userId === state.viewer && n.threadId === thread.id) n.read = true;
  });
  history.replaceState(null, '', '#thread=' + threadId);
  if (thread.anchor.itemId) state.itemId = thread.anchor.itemId;
  if (state.blockFilter && !(thread.anchor.itemId === state.itemId && blockKindOf(thread) === state.blockFilter))
    state.blockFilter = null;
  if (thread.anchor.type === 'slide') state.slide = thread.anchor.slide;
  if (thread.anchor.type === 'video' && thread.anchor.assetId === state.videoAsset) {
    state.time = thread.anchor.time;
  }
  if (!matchesFilter(thread)) {
    state.fPeople = [];
    if (thread.status === 'resolved') state.fResolved = true;
    else {
      state.fUnread = true;
      state.fRead = true;
    }
  }
  renderAll();
  requestAnimationFrame(() => {
    const mark = document.querySelector(`.hl[data-ids~="${threadId}"]`);
    if (mark) mark.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const question = document.querySelector(`.question[data-q="${thread.anchor.questionId}"]`);
    if (question) {
      question.scrollIntoView({ block: 'center', behavior: 'smooth' });
      question.classList.add('flash');
    }
    const card = document.querySelector(`.thread[data-thread="${threadId}"]`);
    const body = card && card.closest('.panel-body');
    if (body) {
      const offset = card.getBoundingClientRect().top - body.getBoundingClientRect().top;
      body.scrollTop += offset - (body.clientHeight - card.offsetHeight) / 2;
    }
  });
}

function toggleThread(thread) {
  if (thread.status === 'open') {
    thread.status = 'resolved';
    thread.resolvedBy = state.viewer;
    thread.resolvedAt = 'just now';
    logEvent(thread, state.viewer, 'resolved this thread');
    notify(thread.comments[0].author, thread.id, `${me().name} resolved your thread`);
    toast('Resolved. The highlight and badge are gone.');
  } else {
    thread.status = 'open';
    thread.resolvedBy = null;
    thread.resolvedAt = null;
    logEvent(thread, state.viewer, 'reopened this thread');
  }
  renderAll();
}

function post(key) {
  const value = (drafts[key] || '').trim();
  if (!value) return;
  const author = state.viewer;
  const mentions = parseMentions(value);
  if (key === 'draft') {
    const thread = mk('t' + cid++, state.draft, [
      { id: 'c' + cid++, author, body: value, mentions, when: 'just now', edited: false }
    ]);
    if (thread.anchor.type === 'video') thread.anchor.assetId = state.videoAsset;
    state.threads.push(thread);
    mentions.forEach((m) => notify(m.userId, thread.id, `${me().name} mentioned you`));
    state.draft = null;
    state.pinMode = false;
    setStatusFilter('open');
    state.activeId = thread.id;
    toastMentions(mentions);
  } else if (key.startsWith('reply:')) {
    const thread = state.threads.find((t) => t.id === key.slice(6));
    thread.comments.push({ id: 'c' + cid++, author, body: value, mentions, when: 'just now', edited: false });
    logEvent(thread, author, 'replied');
    const mentioned = new Set(mentions.map((m) => m.userId));
    mentions.forEach((m) => notify(m.userId, thread.id, `${me().name} mentioned you`));
    const people = new Set(thread.comments.flatMap((cm) => [cm.author, ...cm.mentions.map((m) => m.userId)]));
    people.forEach((userId) => {
      if (!mentioned.has(userId)) notify(userId, thread.id, `${me().name} replied in a thread you are in`);
    });
    if (thread.status === 'resolved') {
      thread.status = 'open';
      thread.resolvedBy = null;
      logEvent(thread, author, 'reopened this thread by replying');
      toast('Replying reopened the thread');
    } else {
      toastMentions(mentions);
    }
  } else {
    const [, threadId, commentId] = key.split(':');
    const editedThread = state.threads.find((t) => t.id === threadId);
    const comment = editedThread.comments.find((cm) => cm.id === commentId);
    logEvent(editedThread, author, 'edited a comment');
    comment.body = value;
    comment.mentions = mentions;
    comment.edited = true;
    state.editing = null;
  }
  const posted = state.threads.find((t) =>
    key.startsWith('reply:') ? t.id === key.slice(6) : t.id === state.activeId
  );
  if (posted) markSeen(posted);
  delete drafts[key];
  renderAll();
}

function toastMentions(mentions) {
  const names = [...new Set(mentions.map((m) => member(m.userId).name).filter((n) => n !== me().name))];
  if (names.length) toast(`Notified ${names.join(', ')}`);
}

function updateVideoUI() {
  const it = item(state.itemId);
  if (!it.video) return;
  const pct = (state.time / it.video.duration) * 100;
  const prog = $('vprog');
  if (!prog) return;
  prog.style.width = pct + '%';
  $('vtime').textContent = `${fmt(state.time)} / ${fmt(it.video.duration)}`;
  $('scrub').value = state.time;
  const label = $('videoCommentLabel');
  if (label) label.textContent = `Comment at ${fmt(state.time)}`;
}

function setPlaying(on) {
  state.playing = on;
  clearInterval(timer);
  if (on) {
    timer = setInterval(() => {
      const duration = item(state.itemId).video.duration;
      state.time = Math.min(duration, state.time + 1);
      if (state.time >= duration) setPlaying(false);
      updateVideoUI();
    }, 1000);
  }
  const btn = $('play');
  if (btn) btn.innerHTML = on ? ICON.pause : ICON.play;
}

function showMentions(textarea) {
  hideMentions();
  const before = textarea.value.slice(0, textarea.selectionStart);
  const match = before.match(/@([A-Za-z ]{0,20})$/);
  if (!match) return;
  const query = match[1].toLowerCase();
  const options = TEAM.filter(
    (m) => m.id !== state.viewer && !isFormer(m.id) && m.name.toLowerCase().includes(query.trim())
  );
  if (!options.length) return;
  mentionState = { textarea, options, sel: 0, start: before.length - match[0].length };
  const list = document.createElement('div');
  list.className = 'mention-list';
  list.innerHTML = options
    .map(
      (m, i) =>
        `<button class="mention-opt ${i === 0 ? 'sel' : ''}" data-mention="${m.id}"><span class="avatar" style="background:${m.color}">${m.name[0]}</span><span>${esc(m.name)} <span class="muted">${m.role}</span></span></button>`
    )
    .join('');
  textarea.parentElement.appendChild(list);
}

function hideMentions() {
  document.querySelectorAll('.mention-list').forEach((el) => el.remove());
  mentionState = null;
}

function pickMention(userId) {
  const { textarea, start } = mentionState;
  const name = member(userId).name;
  const after = textarea.value.slice(textarea.selectionStart);
  textarea.value = textarea.value.slice(0, start) + '@' + name + ' ' + after;
  const caret = start + name.length + 2;
  textarea.setSelectionRange(caret, caret);
  drafts[textarea.dataset.key] = textarea.value;
  hideMentions();
  textarea.focus();
}

$('panel').addEventListener('input', (e) => {
  if (!e.target.dataset.key) return;
  drafts[e.target.dataset.key] = e.target.value;
  showMentions(e.target);
});

$('panel').addEventListener('keydown', (e) => {
  if (e.target.dataset.key) {
    if (mentionState) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const n = mentionState.options.length;
        mentionState.sel = (mentionState.sel + (e.key === 'ArrowDown' ? 1 : n - 1)) % n;
        document
          .querySelectorAll('.mention-opt')
          .forEach((el, i) => el.classList.toggle('sel', i === mentionState.sel));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        pickMention(mentionState.options[mentionState.sel].id);
        return;
      }
      if (e.key === 'Escape') {
        hideMentions();
        return;
      }
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) post(e.target.dataset.key);
    return;
  }
  if (e.key === 'Enter' && e.target.dataset.thread && e.target.classList.contains('thread'))
    goTo(e.target.dataset.thread);
});

$('panel').addEventListener('click', (e) => {
  const mention = e.target.closest('[data-mention]');
  if (mention) return pickMention(mention.dataset.mention);
  const option = e.target.closest('[data-fopt]');
  if (option) {
    toggleFilterOption(option.dataset.fopt);
    if (option.dataset.fopt.startsWith('show:')) renderPage();
    return renderPanel();
  }
  const act = e.target.closest('[data-act]');
  if (act) {
    const { act: name, thread: threadId, comment: commentId, key } = act.dataset;
    const thread = state.threads.find((t) => t.id === threadId);
    if (name === 'post') post(key);
    if (name === 'pin-spot') {
      state.pinMode = !state.pinMode;
      renderPage();
      renderPanel();
    }
    if (name === 'show-all') {
      state.blockFilter = null;
      renderPanel();
    }
    if (name === 'cancel-draft') {
      delete drafts.draft;
      state.draft = null;
      state.pinMode = false;
      renderPage();
      renderPanel();
    }
    if (name === 'cancel-edit') {
      delete drafts[state.editing];
      state.editing = null;
      renderPanel();
    }
    if (name === 'close-panel') {
      state.panelOpen = false;
      renderPanel();
    }
    if (name === 'copy-link') {
      e.stopPropagation();
      return copyLink(threadId);
    }
    if (name === 'mark-all-read') {
      state.threads.forEach(markSeen);
      toast('All threads marked as read');
      return renderAll();
    }
    if (name === 'new-general') startDraft({ type: 'course', itemId: null });
    if (name === 'toggle-filter') {
      state.filterOpen = !state.filterOpen;
      return renderPanel();
    }
    if (name === 'edit') {
      state.editing = `edit:${threadId}:${commentId}`;
      state.activeId = threadId;
      renderAll();
    }
    if (name === 'delete') {
      const first = thread.comments[0].id === commentId;
      const ok = !first || confirm('Deleting the first comment deletes the whole thread. Continue?');
      if (!ok) return;
      if (first) state.threads = state.threads.filter((t) => t.id !== threadId);
      else {
        thread.comments = thread.comments.filter((cm) => cm.id !== commentId);
        logEvent(thread, state.viewer, 'deleted a reply');
      }
      renderAll();
    }
    if (name === 'toggle') toggleThread(thread);
    return;
  }
  const card = e.target.closest('.thread');
  if (card && !e.target.closest('textarea, select, label')) goTo(card.dataset.thread);
});

function hoverThread(threadId, on) {
  document
    .querySelectorAll(`.hl[data-ids~="${threadId}"], .marker[data-marker="${threadId}"]`)
    .forEach((el) => el.classList.toggle('hover', on));
}

$('panel').addEventListener('mouseover', (e) => {
  const card = e.target.closest('.thread');
  if (card && !card.contains(e.relatedTarget)) hoverThread(card.dataset.thread, true);
});

$('panel').addEventListener('mouseout', (e) => {
  const card = e.target.closest('.thread');
  if (card && !card.contains(e.relatedTarget)) hoverThread(card.dataset.thread, false);
});

$('page').addEventListener('click', (e) => {
  const mark = e.target.closest('.hl');
  if (mark) {
    const ids = mark.dataset.ids.split(' ');
    const next =
      ids.length > 1 && ids.includes(state.activeId) ? ids[(ids.indexOf(state.activeId) + 1) % ids.length] : ids[0];
    return goTo(next);
  }
  const marker = e.target.closest('[data-marker]');
  if (marker) return goTo(marker.dataset.marker);
  if (e.target.closest('#play')) return setPlaying(!state.playing);
  if (e.target.closest('#videoComment')) {
    setPlaying(false);
    return startDraft({ type: 'video', itemId: state.itemId, time: state.time });
  }
  const pin = e.target.closest('[data-pin]');
  if (pin) return goTo(pin.dataset.pin);
  const thumb = e.target.closest('[data-slide]');
  if (thumb) {
    state.slide = Number(thumb.dataset.slide);
    return renderPage();
  }
  const stage = e.target.closest('[data-stage]');
  if (stage && !isLearner() && stage.dataset.stage === 'image') {
    const kind = stage.dataset.stage;
    if (!state.draft || state.draft.type !== kind)
      return toast('Use the comment icon above this block to add a comment');
    const rect = stage.getBoundingClientRect();
    state.draft.x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    state.draft.y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    state.draft.slide = state.slide;
    state.pinMode = false;
    renderPage();
    return renderPanel();
  }
  const blockBtn = e.target.closest('[data-blockc]');
  if (blockBtn) return openBlockComments(blockBtn.dataset.blockc);
  if (e.target.closest('#publish')) return openPublish();
  const q = e.target.closest('[data-qcomment]');
  if (q) return startDraft({ type: 'question', itemId: state.itemId, questionId: q.dataset.qcomment });
});

$('page').addEventListener('mousedown', (e) => {
  if (e.target.closest('.tb-btn')) e.preventDefault();
});

$('page').addEventListener('input', (e) => {
  if (e.target.id !== 'scrub') return;
  state.time = Number(e.target.value);
  updateVideoUI();
});

$('page').addEventListener('mouseup', () => {
  setTimeout(() => {
    const sel = getSelection();
    const float = $('floatComment');
    if (isLearner() || !sel.rangeCount || sel.isCollapsed) {
      float.hidden = true;
      return;
    }
    const range = sel.getRangeAt(0);
    const para = range.startContainer.parentElement.closest('p[data-para]');
    const endPara = range.endContainer.parentElement.closest('p[data-para]');
    if (!para || para !== endPara) {
      float.hidden = true;
      return;
    }
    const quote = sel.toString().trim();
    if (!quote) {
      float.hidden = true;
      return;
    }
    const rect = range.getBoundingClientRect();
    float.innerHTML = `${ICON.comment} Comment`;
    float.style.left = Math.max(8, rect.left + rect.width / 2 - 45) + 'px';
    float.style.top = Math.max(8, rect.top - 44) + 'px';
    float.hidden = false;
    float.onmousedown = (ev) => ev.preventDefault();
    float.onclick = () => {
      float.hidden = true;
      sel.removeAllRanges();
      startDraft({ type: 'text', itemId: state.itemId, quote });
    };
  }, 0);
});

$('side').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-item]');
  if (!btn) return;
  e.preventDefault();
  setPlaying(false);
  state.itemId = btn.dataset.item;
  state.blockFilter = null;
  state.time = 0;
  state.slide = 3;
  renderAll();
});

$('head').addEventListener('click', (e) => {
  if (e.target.closest('#openPanel')) {
    state.panelOpen = !state.panelOpen;
    renderHeader();
    return renderPanel();
  }
  if (e.target.closest('[data-act="toggle-sidebar"]')) document.body.classList.toggle('side-collapsed');
});

function openPublish() {
  const it = item(state.itemId);
  const open = state.threads.filter((t) => t.status === 'open' && t.anchor.itemId === it.id);
  const rows = open
    .slice(0, 3)
    .map(
      (t) =>
        `<li><strong>${esc(member(t.comments[0].author).name)}</strong><span>${esc(threadSummary(t.id))}</span></li>`
    )
    .join('');
  const more = open.length > 3 ? `<li class="more">and ${open.length - 3} more</li>` : '';
  const dialog = $('dialog');
  dialog.innerHTML = `<div class="dialog-card" role="dialog" aria-modal="true" aria-labelledby="dlgTitle">
    <h2 id="dlgTitle">${open.length ? `${open.length} open ${open.length === 1 ? 'comment' : 'comments'} on this ${it.kind.toLowerCase()}` : `Publish “${esc(it.title)}”?`}</h2>
    <p>${open.length ? 'Your team has not resolved these yet. You can still publish, learners never see comments.' : 'Learners will see your latest changes.'}</p>
    ${open.length ? `<ul class="dlg-list">${rows}${more}</ul>` : ''}
    <div class="dialog-foot">
      ${open.length ? '<button class="btn btn-secondary btn-sm" data-dlg="review">Review comments</button>' : '<span></span>'}
      <span><button class="btn btn-outline btn-sm" data-dlg="cancel">Cancel</button>
      <button class="btn btn-primary btn-sm" data-dlg="publish">${open.length ? 'Publish anyway' : 'Publish'}</button></span>
    </div></div>`;
  dialog.hidden = false;
  dialog.querySelector('[data-dlg="publish"]').focus();
}

function closeDialog() {
  $('dialog').hidden = true;
  $('dialog').innerHTML = '';
}

function wordDiff(before, after) {
  const from = before.match(/\S+\s*/g) || [];
  const to = after.match(/\S+\s*/g) || [];
  const same = (a, b) => a.trim() === b.trim();
  const table = Array.from({ length: from.length + 1 }, () => new Array(to.length + 1).fill(0));
  for (let i = from.length - 1; i >= 0; i--) {
    for (let j = to.length - 1; j >= 0; j--) {
      table[i][j] = same(from[i], to[j]) ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  let html = '';
  let i = 0;
  let j = 0;
  while (i < from.length || j < to.length) {
    if (i < from.length && j < to.length && same(from[i], to[j])) {
      html += esc(to[j]);
      i++;
      j++;
    } else if (j < to.length && (i === from.length || table[i][j + 1] >= table[i + 1][j])) {
      html += `<ins>${esc(to[j])}</ins>`;
      j++;
    } else {
      html += `<del>${esc(from[i])}</del>`;
      i++;
    }
  }
  return html.replaceAll('</ins><ins>', '').replaceAll('</del><del>', '');
}

function lostByRestore(itemId, paras) {
  return state.threads.filter(
    (t) =>
      t.status === 'open' &&
      t.anchor.type === 'text' &&
      t.anchor.itemId === itemId &&
      textRange(t) &&
      !paras.some((p) => p.includes(t.anchor.quote))
  );
}

function versionsHtml() {
  const it = item(state.itemId);
  const list = state.versions[it.id];
  const index = Math.max(
    0,
    list.findIndex((v) => v.id === state.verSel)
  );
  const selected = list[index];
  const older = list[index + 1];
  const rows = list
    .map((v, n) => {
      const who = member(v.who);
      return `<button class="ver-row" data-dlg="ver" data-id="${v.id}" aria-pressed="${n === index}">
        <span class="avatar sm" style="background:${who.color}">${initialsOf(who.name)}</span>
        <span class="ver-meta"><strong>${esc(v.label)}</strong>${n === 0 ? '<span class="tag tag-ok">Current</span>' : ''}<span class="muted">${esc(who.name)}${formerTag(who.id)} · ${esc(v.when)}</span></span></button>`;
    })
    .join('');
  const count = Math.max(selected.paras.length, older ? older.paras.length : 0);
  const preview = Array.from({ length: count }, (_, p) => {
    const after = selected.paras[p] || '';
    const before = older ? older.paras[p] || '' : after;
    return `<p>${before === after ? esc(after) : wordDiff(before, after)}</p>`;
  }).join('');
  const lost = index === 0 ? [] : lostByRestore(it.id, selected.paras);
  const note =
    index === 0
      ? 'This is the version learners and the team see now.'
      : lost.length
        ? `Restoring keeps all comments but ${lost.length} open ${lost.length === 1 ? 'thread' : 'threads'} will say “Original text was removed”.`
        : 'Restoring keeps all comments, and every open one still matches the text.';
  return `<div class="dialog-card dialog-wide ver-card" role="dialog" aria-modal="true" aria-labelledby="dlgTitle">
    <h2 id="dlgTitle">Version history · ${esc(it.title)}</h2>
    <p>Comments are not part of a version. Restoring never deletes or rolls back a comment.</p>
    <div class="ver-grid"><div class="ver-list">${rows}</div>
      <div class="ver-preview"><div class="ver-legend">${older ? 'Changes compared with the version before: <ins>added</ins> <del>removed</del>' : 'First version, nothing to compare with.'}</div>${preview}</div></div>
    <div class="dialog-foot"><span class="muted">${note}</span>
      <span><button class="btn btn-outline btn-sm" data-dlg="close">Close</button>
      <button class="btn btn-primary btn-sm" data-dlg="restore" ${index === 0 ? 'disabled' : ''}>Restore this version</button></span></div></div>`;
}

function openVersions(fresh) {
  if (fresh) state.verSel = state.versions[state.itemId][0].id;
  $('dialog').innerHTML = versionsHtml();
  $('dialog').hidden = false;
}

function restoreVersion() {
  const list = state.versions[state.itemId];
  const selected = list.find((v) => v.id === state.verSel);
  const lost = lostByRestore(state.itemId, selected.paras);
  state.paras[ITEMS.findIndex((it) => it.id === state.itemId)] = cloneParas(selected.paras);
  pushVersion(state.itemId, `Restored “${selected.label}”`);
  closeDialog();
  setStatusFilter('open');
  renderAll();
  toast(
    lost.length
      ? `Restored. ${lost.length} open ${lost.length === 1 ? 'comment now says' : 'comments now say'} “Original text was removed”.`
      : 'Restored. All comments are still in place.'
  );
}

$('dialog').addEventListener('click', (e) => {
  const action = e.target.closest('[data-dlg]');
  if (!action && e.target.id !== 'dialog') return;
  const name = action ? action.dataset.dlg : 'cancel';
  if (name === 'ver') {
    state.verSel = action.dataset.id;
    return openVersions();
  }
  if (name === 'restore') return restoreVersion();
  const open = state.threads.filter((t) => t.status === 'open' && t.anchor.itemId === state.itemId);
  closeDialog();
  if (name === 'publish') toast(open.length ? `Published with ${open.length} open comments` : 'Published');
  if (name === 'review') {
    setStatusFilter('open');
    goTo(open[0].id);
  }
});

document.addEventListener('click', (e) => {
  if (!state.filterOpen || e.target.closest('.filter-pop, [data-act="toggle-filter"]')) return;
  state.filterOpen = false;
  renderPanel();
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!$('dialog').hidden) return closeDialog();
  if (state.filterOpen) {
    state.filterOpen = false;
    return renderPanel();
  }
  if (state.panelOpen && !mentionState && !e.target.closest?.('textarea')) {
    state.panelOpen = false;
    renderPanel();
  }
});

function removeMember(userId) {
  const person = member(userId);
  if (isFormer(userId)) {
    removedIds.splice(removedIds.indexOf(userId), 1);
    state.threads.forEach((t) => {
      if (t.comments.some((cm) => cm.author === userId))
        logEvent(t, 'u1', `added ${person.name} back to the course team`);
    });
    toast(`${person.name} is back on the course team.`);
  } else {
    removedIds.push(userId);
    state.threads.forEach((t) => {
      if (t.comments.some((cm) => cm.author === userId))
        logEvent(t, 'u1', `removed ${person.name} from the course team`);
    });
    if (state.viewer === userId) setViewer('u1');
    setStatusFilter('open');
    toast(`${person.name} was removed. Their comments stay, tagged "Former member".`);
  }
  renderAll();
}

function setViewer(userId) {
  state.viewer = userId;
  state.draft = null;
  state.editing = null;
  state.activeId = null;
  renderAll();
}

function deleteSentence() {
  const idx = ITEMS.findIndex((it) => it.id === 'l1');
  const before = state.paras[idx][1];
  state.paras[idx][1] = before.replace(ORIGINAL_SENTENCE + ' ', '');
  if (state.paras[idx][1] !== before) pushVersion('l1', 'Deleted a sentence');
  toast('Sentence deleted. The thread stays and shows the original quote.');
  state.itemId = 'l1';
  setStatusFilter('open');
  renderAll();
}

const LIVE_LINES = [
  'Just checked this on mobile and it reads fine there.',
  'Agreed. Can we also add a short example below it?',
  'I can take this one this afternoon.',
  'Looks good to me now. Resolving soon.'
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const initialsOf = (name) =>
  name
    .split(' ')
    .map((word) => word[0])
    .join('');

function makeCursor(person) {
  const el = document.createElement('div');
  el.className = 'lcur';
  el.style.setProperty('--c', person.color);
  el.style.transform = `translate(${window.innerWidth + 30}px, ${window.innerHeight * 0.45}px)`;
  el.innerHTML = `<svg width="18" height="20" viewBox="0 0 18 20"><path d="M1.5 1.5l5.2 15.8 3-6.6 6.8-2.9z" fill="var(--c)" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg><div class="tag"><span class="ini">${initialsOf(person.name)}</span>${person.name}</div>`;
  document.body.appendChild(el);
  el.getBoundingClientRect();
  return el;
}

async function moveCursor(el, x, y, ms = 950) {
  el.style.transitionDuration = ms + 'ms';
  el.classList.toggle('flip', x > document.documentElement.clientWidth - 260);
  el.style.transform = `translate(${x}px, ${y}px)`;
  await wait(ms + 80);
}

function pointOn(selector, fx = 0.5, fy = 0.5) {
  const rect = document.querySelector(selector)?.getBoundingClientRect();
  if (!rect) return null;
  const x = Math.min(Math.max(rect.left + rect.width * fx, 20), document.documentElement.clientWidth - 120);
  const y = Math.min(Math.max(rect.top + rect.height * fy, 80), window.innerHeight - 80);
  return { x, y };
}

function liveDraftHtml(person) {
  return `<div class="live-draft" style="--c:${person.color}">
    <span class="ini">${initialsOf(person.name)}</span>
    <div class="ld-main"><div class="ld-name">${esc(person.name)} is typing…</div><div class="ld-text"><span class="ld-t"></span><i class="caret"></i></div></div>
  </div>`;
}

async function showBubble(el, person, text) {
  const tag = el.querySelector('.tag');
  tag.outerHTML = `<div class="bubble"><span class="ini">${initialsOf(person.name)}</span><span class="bt"></span><i class="caret"></i></div>`;
  const out = el.querySelector('.bt');
  for (let n = 1; n <= text.length; n++) {
    out.textContent = text.slice(0, n);
    const mirror = document.querySelector('.live-draft .ld-t');
    if (mirror) mirror.textContent = text.slice(0, n);
    await wait(34);
  }
  await wait(350);
}

async function wander(el, stops, follow) {
  for (const [selector, fx, fy] of stops) {
    if (follow) {
      document.querySelector(selector)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      await wait(700);
    }
    const target = pointOn(selector, fx, fy);
    if (!target) continue;
    await moveCursor(el, target.x, target.y, 1100);
    await wait(250);
  }
}

async function liveComment(authorId, threadId) {
  if (isLearner()) return toast('Switch to a team member first. Learners never get comments.');
  const others = TEAM.filter((m) => m.id !== state.viewer && !isFormer(m.id));
  const author = others.find((m) => m.id === authorId) || others[Math.floor(Math.random() * others.length)];
  const bystander = others.find((m) => m.id !== author.id);
  const thread =
    state.threads.find((t) => t.id === threadId && t.status === 'open') ||
    state.threads.find((t) => t.id === state.activeId && t.status === 'open') ||
    state.threads.find((t) => t.status === 'open' && t.anchor.itemId === state.itemId) ||
    state.threads.find((t) => t.status === 'open');
  if (!thread) return;
  state.panelOpen = true;
  renderPanel();
  const threadSelector = `.thread[data-thread="${thread.id}"]`;
  document.querySelector(threadSelector)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  await wait(300);

  const authorCursor = makeCursor(author);
  const bystanderCursor = bystander ? makeCursor(bystander) : null;
  const body = LIVE_LINES[Math.floor(Math.random() * LIVE_LINES.length)];
  const cursors = [authorCursor, bystanderCursor].filter(Boolean);

  if (bystanderCursor) {
    wander(
      bystanderCursor,
      [
        ['.cs-main p', 0.7, 0.4],
        ['.cs-main p', 0.2, 0.8],
        ['.video', 0.3, 0.6]
      ],
      false
    );
  }

  await wander(
    authorCursor,
    [
      ['.cs-main p', 0.35, 0.5],
      ['.video', 0.6, 0.85],
      [threadSelector, 0.8, 0.9]
    ],
    true
  );
  state.typing = { threadId: thread.id, userId: author.id };
  renderPanel();
  await showBubble(authorCursor, author, body);

  thread.comments.push({ id: 'c' + cid++, author: author.id, body, mentions: [], when: 'just now', edited: false });
  logEvent(thread, author.id, 'replied');
  state.typing = null;
  if (new Set(thread.comments.map((cm) => cm.author)).has(state.viewer)) {
    state.notifs.unshift({
      id: 'n' + cid++,
      userId: state.viewer,
      threadId: thread.id,
      text: `${author.name} replied in a thread you are in`,
      read: false
    });
  }
  renderAll();
  toast(`${author.name} replied. It appeared without a refresh.`);
  cursors.forEach((el) => (el.style.opacity = '0'));
  await wait(400);
  cursors.forEach((el) => el.remove());
}

function resetAll() {
  setPlaying(false);
  state.questionGone = false;
  removedIds.length = 0;
  state.versions = seedVersions();
  state.threads = seed();
  state.notifs = seedNotifs();
  state.seen = seedSeen();
  state.paras = JSON.parse(JSON.stringify(ITEMS.map((it) => it.paras)));
  state.videoAsset = 'v1';
  state.draft = null;
  state.editing = null;
  state.activeId = null;
  state.itemId = 'l1';
  state.panelOpen = true;
  state.time = 0;
  state.slide = 3;
  state.typing = null;
  setStatusFilter('open');
  Object.keys(drafts).forEach((k) => delete drafts[k]);
  history.replaceState(null, '', location.pathname);
  renderAll();
}

const sleep = (ms) =>
  new Promise((resolve, reject) => setTimeout(() => (story.on ? resolve() : reject(new Error('story stopped'))), ms));

async function typeInto(selector, text) {
  const box = document.querySelector(selector);
  if (!box) return;
  const key = box.dataset.key;
  box.focus();
  for (let n = 1; n <= text.length; n++) {
    box.value = text.slice(0, n);
    drafts[key] = box.value;
    await sleep(22);
  }
}

function spot(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.classList.add('spot');
  setTimeout(() => el.classList.remove('spot'), 2600);
}

const story = { on: false, running: false, i: -1, textId: null, videoId: null, imageId: null };

const STORY = [
  {
    title: 'Meet Ellena',
    say: 'Ellena is an org admin reviewing the lesson "Why pricing matters". The Comments panel on the right is only for admins and tutors.',
    run: async () => {
      resetAll();
      setViewer('u1');
      await sleep(300);
      spot('#panel');
    }
  },
  {
    title: 'Comment on a sentence',
    say: 'Ellena selects a sentence, clicks Comment and writes a note. Typing @ lets her pick a teammate to mention.',
    run: async () => {
      startDraft({
        type: 'text',
        itemId: 'l1',
        quote: 'we will build a simple process to set it with evidence'
      });
      await typeInto('.new-box textarea', 'Can we show a real example of "evidence" here? @Ada Obi');
    }
  },
  {
    title: 'Post it',
    say: 'The sentence is now highlighted in the lesson and the thread sits in the panel. Ada is notified because she was mentioned.',
    run: async () => {
      post('draft');
      story.textId = state.activeId;
      await sleep(200);
      spot('.hl.flash');
    }
  },
  {
    title: 'Comment on a video moment',
    say: 'Comments can also point at a moment in the video. A marker appears on the timeline, and clicking the thread jumps the video there.',
    run: async () => {
      state.time = 200;
      renderAll();
      document.querySelector('.video').scrollIntoView({ block: 'center', behavior: 'smooth' });
      await sleep(600);
      startDraft({ type: 'video', itemId: 'l1', time: 200 });
      await typeInto('.new-box textarea', 'The audio drops out here. @Tunde Bello can you re-record this part?');
      await sleep(500);
      post('draft');
      story.videoId = state.activeId;
      await sleep(200);
      spot('.marker.flash');
    }
  },
  {
    title: 'Comment on a slide',
    say: 'Slides get comments per slide. Ellena clicks the comment icon on the Slides block and writes her note. It is tagged with the slide on screen. Each content block shows how many comments it has, so nobody has to open the panel to find out.',
    run: async () => {
      state.slide = 3;
      renderPage();
      document.querySelector('.stage-slide').scrollIntoView({ block: 'center', behavior: 'smooth' });
      await sleep(600);
      openBlockComments('slide');
      await typeInto('.new-box textarea', 'Add the date of this data in a footnote.');
      await sleep(500);
      post('draft');
      await sleep(300);
      spot('.stage-slide');
    }
  },
  {
    title: 'Pin a comment on an image',
    say: 'Images work the same way, with one extra. Ellena clicks the comment icon on the Image block, writes her note, then presses "Pin to a spot" and clicks the image. A numbered red pin lands there and the red count on the block goes up.',
    run: async () => {
      document.querySelector('.stage-image').scrollIntoView({ block: 'center', behavior: 'smooth' });
      await sleep(600);
      openBlockComments('image');
      await typeInto('.new-box textarea', 'The Team price is out of date. It is $89 now.');
      await sleep(400);
      document.querySelector('[data-act="pin-spot"]').click();
      await sleep(700);
      Object.assign(state.draft, { x: 82, y: 62 });
      state.pinMode = false;
      renderPage();
      renderPanel();
      await sleep(700);
      post('draft');
      story.imageId = state.activeId;
      await sleep(300);
      spot('.stage-image .pin.active');
    }
  },
  {
    title: 'Resolve it and the red count goes',
    say: 'Once the image is fixed, Ellena resolves that comment. Its pin leaves the image and the red count on the Image block drops. The same happens on notes, videos and slides: a resolved comment takes its highlight, marker or count with it, and it stays gone unless someone replies.',
    run: async () => {
      goTo(story.imageId);
      await sleep(1000);
      toggleThread(state.threads.find((t) => t.id === story.imageId));
      await sleep(300);
      spot('[data-blockc="image"]');
    }
  },
  {
    title: 'Switch to Ada',
    say: 'Now we are Ada, a tutor. Her comments button shows a red number for threads she has not read, and the lesson in the sidebar has a blue dot.',
    run: async () => {
      setViewer('u2');
      state.panelOpen = true;
      renderAll();
      await sleep(300);
      spot('#openPanel');
    }
  },
  {
    title: 'Ada opens the thread',
    say: 'Clicking the notification jumps straight to the highlighted sentence and opens the thread. The blue dot goes away because she has read it.',
    run: async () => {
      const notif = state.notifs.find((n) => n.userId === 'u2' && n.threadId === story.textId);
      notif.read = true;
      goTo(story.textId);
      await sleep(900);
    }
  },
  {
    title: 'Ada replies',
    say: 'Ada answers in the thread and mentions Ellena back. Everyone who is in the thread gets notified of replies.',
    run: async () => {
      await typeInto(
        '.thread.active textarea[data-key^="reply:"]',
        "Added a worked example from last month's customer interviews. Please check, @Ellena Okpani"
      );
      await sleep(500);
      post('reply:' + story.textId);
    }
  },
  {
    title: 'Back to Ellena',
    say: 'Ellena has new threads: the reply from Ada and, from earlier, a mention from Tunde. Each has a blue new tag, and opening it clears it.',
    run: async () => {
      setViewer('u1');
      setStatusFilter('open');
      renderAll();
      await sleep(300);
      spot('#openPanel');
    }
  },
  {
    title: 'Resolve the thread',
    say: 'The feedback is handled, so Ellena resolves it. The highlight and the count badge disappear, but the thread is kept and can be reopened.',
    run: async () => {
      goTo(story.textId);
      await sleep(1000);
      toggleThread(state.threads.find((t) => t.id === story.textId));
      setStatusFilter('resolved');
      renderPanel();
    }
  },
  {
    title: 'A teammate replies live',
    say: 'Teammates show up like in Figma: a coloured cursor with their name and initials. Watch Ada and Tunde move around the lesson, then Ada types a reply in the thread and it lands with no refresh.',
    run: async () => {
      setStatusFilter('open');
      goTo(story.videoId);
      await sleep(800);
      await liveComment('u2', story.videoId);
      await sleep(500);
    }
  },
  {
    title: 'The course gets edited',
    say: 'Someone deletes a sentence that had a comment on it. The comment is not lost: it stays, marked "Original text was removed", with the quote as it was.',
    run: async () => {
      setStatusFilter('open');
      deleteSentence();
      await sleep(300);
      goTo('t2');
      await sleep(500);
      spot('.thread.active .tag-warn');
    }
  },
  {
    title: 'Publishing with open comments',
    say: 'Before publishing, Ellena is warned about threads still open on this page. She can review them, cancel, or publish anyway. Learners never see the comments either way.',
    run: async () => {
      setStatusFilter('open');
      renderAll();
      openPublish();
      await sleep(900);
    }
  },
  {
    title: 'Restore an earlier version',
    say: 'Version history lists every change to the lesson and who made it. Restoring a version never deletes comments: any thread whose quoted text is gone says "Original text was removed".',
    run: async () => {
      closeDialog();
      openVersions(true);
      await sleep(900);
    }
  },
  {
    title: 'A teammate leaves the course',
    say: 'Tunde is removed from the course team. His comments and history stay, tagged "Former member". He can no longer be mentioned.',
    run: async () => {
      closeDialog();
      if (!isFormer('u3')) removeMember('u3');
      goTo(story.videoId);
      await sleep(700);
      spot('.former');
    }
  },
  {
    title: 'What a learner sees',
    say: 'Learners never see comments: not the panel, not the highlights, not the badges. The API refuses to return them too.',
    run: async () => {
      setViewer('learner');
      await sleep(300);
    }
  },
  {
    title: 'Your turn',
    say: 'That is the whole flow. Everything is live now, so try it yourself: select a sentence, use the comment icon on a slide, or drop a pin on the image, and mention someone.',
    run: async () => {
      closeDialog();
      if (isFormer('u3')) removeMember('u3');
      setViewer('u1');
      setStatusFilter('open');
      renderAll();
    }
  }
];

function renderCoach() {
  const coach = $('coach');
  coach.hidden = !story.on;
  if (!story.on) return;
  const intro = story.i < 0;
  const current = STORY[story.i];
  const next = STORY[story.i + 1];
  const last = story.i === STORY.length - 1;
  const dots = STORY.map((_, n) => `<span class="${n <= story.i ? 'done' : ''}"></span>`).join('');
  coach.innerHTML = `
    <div class="coach-top"><span>${intro ? 'Guided story' : `Step ${story.i + 1} of ${STORY.length}`}</span>
      <button class="btn-ghost-icon" data-coach="exit" aria-label="Close the story">${icon('x')}</button></div>
    <h3>${intro ? 'See the whole feature in about 3 minutes' : esc(current.title)}</h3>
    <p>${intro ? 'Press Start and the prototype acts out a real review. Ellena comments and mentions Ada, Ada gets notified and replies, the thread is resolved, then the course changes and a teammate leaves. You only press Next.' : esc(current.say)}</p>
    <div class="coach-dots">${dots}</div>
    <div class="coach-foot">
      <span class="muted">${next && !intro ? 'Up next: ' + esc(next.title) : ''}</span>
      <button class="btn btn-primary btn-sm" data-coach="next" ${story.running ? 'disabled' : ''}>${story.running ? 'Playing…' : intro ? 'Start' : last ? 'Finish' : 'Next'}</button>
    </div>`;
}

async function storyNext() {
  if (story.running) return;
  story.i++;
  if (story.i >= STORY.length) return stopStory();
  story.running = true;
  renderCoach();
  try {
    await STORY[story.i].run();
  } catch (err) {
    if (story.on) throw err;
  }
  story.running = false;
  renderCoach();
}

function startStory() {
  story.on = true;
  story.running = false;
  story.i = -1;
  renderCoach();
}

function stopStory() {
  story.on = false;
  story.running = false;
  story.i = -1;
  renderCoach();
}

$('coach').addEventListener('click', (e) => {
  const action = e.target.closest('[data-coach]');
  if (!action) return;
  if (action.dataset.coach === 'next') storyNext();
  if (action.dataset.coach === 'exit') stopStory();
});

$('story').addEventListener('click', startStory);

renderAll();
const linked = location.hash.match(/^#thread=(\w+)/);
if (linked) goTo(linked[1]);

const protoBar = document.querySelector('.proto-bar');
const syncBarHeight = () => document.documentElement.style.setProperty('--proto-h', protoBar.offsetHeight + 'px');
new ResizeObserver(syncBarHeight).observe(protoBar);
syncBarHeight();

const spResize = $('spResize');
const SP_MIN = 300;
const spMax = () => Math.max(SP_MIN, Math.min(760, window.innerWidth - $('side').offsetWidth - 380));

spResize.addEventListener('pointerdown', (e) => {
  spResize.setPointerCapture(e.pointerId);
  document.body.classList.add('sp-dragging');
});

spResize.addEventListener('pointermove', (e) => {
  if (!spResize.hasPointerCapture(e.pointerId)) return;
  const width = Math.min(spMax(), Math.max(SP_MIN, window.innerWidth - e.clientX));
  document.documentElement.style.setProperty('--sp-w', width + 'px');
});

spResize.addEventListener('pointerup', (e) => {
  spResize.releasePointerCapture(e.pointerId);
  document.body.classList.remove('sp-dragging');
});

spResize.addEventListener('dblclick', () => document.documentElement.style.removeProperty('--sp-w'));
