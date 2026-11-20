/*
 * video.js — video-lesson.html. Loads after reader.js (with noInit) and reuses its
 * shell, icons, toast and toolbar styles. Everything here is prefixed `v` / held in
 * `V` so it never collides with reader.js globals.
 *
 * URL params: state=first|returning, source=upload|youtube|drive, enforce=1,
 * view=teacher, ai=off, open=transcript|notebook, t=<seconds>, demo=bookmark|note|ask|select|explain.
 */

Object.assign(ICON_PATHS, {
  captions: '<rect width="18" height="14" x="3" y="5" rx="2" ry="2"/><path d="M7 15h4M15 15h2M7 11h2M13 11h4"/>',
  theatre: '<rect width="20" height="12" x="2" y="6" rx="2"/>',
  maximize:
    '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
  video:
    '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
  locate:
    '<line x1="2" x2="5" y1="12" y2="12"/><line x1="19" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="5"/><line x1="12" x2="12" y1="19" y2="22"/><circle cx="12" cy="12" r="7"/>',
  rewind: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  listPlus: '<path d="M11 12H3"/><path d="M16 6H3"/><path d="M16 18H3"/><path d="M18 9v6"/><path d="M21 12h-6"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'
});

S.view = params.get('view') === 'teacher' ? 'teacher' : 'learner';

const isReturning = S.learner === 'returning';
const V = {
  source: ['upload', 'youtube', 'drive'].includes(params.get('source')) ? params.get('source') : 'upload',
  enforced: params.get('enforce') === '1',
  duration: VIDEO_LESSON.duration,
  t: params.has('t') ? Number(params.get('t')) : isReturning ? 185 : 0,
  furthest: isReturning ? 318 : 0,
  playing: false,
  rate: 1,
  cc: true,
  entries: [],
  panel: null,
  nbTab: 'all',
  follow: true,
  trHover: false,
  tray: null,
  trayCards: [],
  trCards: [],
  lastSeg: -1,
  lastSlide: null,
  resumeAfter: false,
  dragging: false
};
V.furthest = Math.max(V.furthest, V.t);

const knowsTime = () => V.source !== 'drive';
const hasTranscript = () => V.source !== 'drive';
const isTeacher = () => S.view === 'teacher';
const STORE_KEY = `video-entries:${V.source}`;

/* ============================================================ helpers */

function fmt(seconds) {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

function segIndexAt(seconds) {
  const index = TRANSCRIPT.findIndex((segment) => seconds >= segment.start && seconds < segment.end);
  return index < 0 ? TRANSCRIPT.length - 1 : index;
}

function slideAt(seconds) {
  return SLIDES.find((slide) => seconds >= slide.from && seconds < slide.to) || SLIDES[SLIDES.length - 1];
}

function markerColor(entry) {
  if (entry.kind === 'bookmark') return 'oklch(0.92 0 0)';
  if (entry.kind === 'question') return 'oklch(0.72 0.16 264)';
  return HL[entry.color]?.swatch || HL.yellow.swatch;
}

function kindLabel(entry) {
  if (entry.kind === 'question')
    return { moment: 'Ask', ask: 'Ask', explain: 'Explain', define: 'Define' }[entry.action] || 'Ask';
  return { bookmark: 'Bookmark', note: 'Note', highlight: 'Highlight' }[entry.kind];
}

function lineAt(seconds) {
  return TRANSCRIPT[segIndexAt(seconds)].text;
}

function contextWindow(seconds) {
  const from = Math.max(0, seconds - 45);
  const to = Math.min(V.duration, seconds + 15);
  const lines = TRANSCRIPT.filter((segment) => segment.end > from && segment.start < to);
  return { from, to, lines };
}

function newId() {
  return `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

/* ============================================================ entries */

function seedEntries() {
  if (!isReturning) return [];

  if (V.source === 'drive') {
    return [
      {
        id: 'd1',
        kind: 'note',
        whole: true,
        userT: 410,
        color: 'yellow',
        note: 'Rewatch the transform part before the exercise.',
        when: '2 days ago'
      },
      ...VIDEO_TEXT_SEED
    ];
  }
  return [...VIDEO_SEED.map((entry) => ({ ...entry })), ...VIDEO_TEXT_SEED.map((entry) => ({ ...entry }))];
}

function resolveEntry(entry) {
  if (entry.kind === 'question' && entry.action === 'moment' && entry.from == null && entry.t != null) {
    const span = contextWindow(entry.t);
    return { ...entry, from: span.from, to: span.to };
  }
  if (entry.kind !== 'highlight' || entry.source === 'text' || entry.offA != null) return entry;

  const text = TRANSCRIPT[entry.seg].text;
  const at = text.indexOf(entry.exact);
  return { ...entry, offA: Math.max(0, at), offB: Math.max(0, at) + entry.exact.length };
}

function loadVideoEntries() {
  const stored = readStore(STORE_KEY, null);
  return (stored || seedEntries()).map(resolveEntry);
}

function saveVideoEntries() {
  writeStore(
    STORE_KEY,
    V.entries.map(({ streaming, ...entry }) => entry)
  );
}

function videoEntries() {
  return V.entries.filter((entry) => entry.source !== 'text' && !entry.orphaned);
}

function addEntry(entry) {
  V.entries.push(entry);
  saveVideoEntries();
  refreshEntryViews(entry.id);
}

function removeVideoEntry(id) {
  const entry = V.entries.find((item) => item.id === id);
  V.entries = V.entries.filter((item) => item.id !== id);
  V.trayCards = V.trayCards.filter((cardId) => cardId !== id);
  V.trCards = V.trCards.filter((cardId) => cardId !== id);
  saveVideoEntries();
  refreshEntryViews();
  if (entry)
    toast(`${kindLabel(entry)} deleted`, 'Undo', () => {
      V.entries.push(entry);
      saveVideoEntries();
      refreshEntryViews(entry.id);
    });
}

function refreshEntryViews(highlightId) {
  vRenderMarkers(highlightId);
  vRenderTray();
  vRenderPanel();
  vUpdateCounts();
}

function vUpdateCounts() {
  const count = V.entries.length;
  $$('[data-v-count]').forEach((badge) => {
    badge.textContent = count;
    badge.hidden = count === 0;
  });
}

/* ============================================================ answers */

function defineAnswer(exact) {
  const lower = exact.toLowerCase();
  return DEFINE_ANSWERS.find((answer) => answer.match.some((term) => lower.includes(term)));
}

function answerFor(action, exact, seconds, question = '') {
  const moment = MOMENT_ANSWERS[knowsTime() ? slideAt(seconds).key : 'recap'];
  if (action === 'define') return defineAnswer(exact) || moment;

  if (/example/i.test(question)) {
    return {
      text: `${moment.text} For example, in the sales file this is the step that turns 9,412 order rows into one row per store.`,
      key: moment.key
    };
  }
  if (action === 'ask' || action === 'explain') return defineAnswer(question) || defineAnswer(exact) || moment;

  return moment;
}

function vStream(entry, done) {
  const words = entry.answer.split(' ');
  let shown = 0;
  entry.streaming = true;
  const tick = () => {
    shown += 2;
    const el = $(`[data-answer-for="${entry.id}"]`);
    if (el) el.innerHTML = esc(words.slice(0, shown).join(' '));
    if (shown < words.length) {
      setTimeout(tick, 22);
      return;
    }

    entry.streaming = false;
    if (el) el.innerHTML = markKey(esc(entry.answer), entry.key);
    saveVideoEntries();
    done?.();
  };
  setTimeout(tick, 240);
}

/* ============================================================ page */

function vSetActiveLesson() {
  COURSE.outline.forEach((group) =>
    group.items.forEach((item) => {
      if (item.title === 'Cleaning messy data') {
        item.active = false;
        item.done = true;
      }
      if (item.title === VIDEO_LESSON.title) item.active = true;
    })
  );
}

function vPageHead() {
  const sub = `<p class="pg-sub"><span>${esc(VIDEO_LESSON.section)}</span><span class="sep">·</span><span>${fmt(V.duration)} video</span><span class="sep">·</span><span>Notes below</span></p>`;
  let actions;
  if (isTeacher()) {
    actions = `
      <button class="btn btn-outline btn-sm" aria-pressed="true">${icon('chart')}Viewing insights</button>
      <span class="vsep desktop-only"></span>
      <button class="btn btn-outline btn-icon-sm desktop-only" aria-label="Edit lesson">${icon('pencil')}</button>
      <button class="btn btn-outline btn-icon-sm desktop-only" aria-label="Version history">${icon('history')}</button>
      <button class="btn btn-outline btn-sm lang-btn">${icon('globe')}English</button>`;
  } else {
    actions = `
      <button class="btn btn-outline btn-sm" data-v="notebook" aria-label="Notebook">${icon('notebook')}<span>Notebook</span><span class="count-badge" data-v-count hidden>0</span></button>
      <span class="vsep desktop-only"></span>
      ${
        knowsTime()
          ? `<span class="btn btn-secondary btn-sm desktop-only" title="This lesson completes when you watch enough of the video" style="cursor:default" data-v-watch-btn>${ring(0, 20)}<span class="text-xs">Watch to complete</span></span>`
          : `<button class="btn btn-secondary btn-sm desktop-only">${icon('circleCheck')}<span class="text-xs">Mark as complete</span></button>`
      }
      <span style="display:inline-flex;gap:4px" class="desktop-only"><button class="btn btn-outline btn-icon-sm" aria-label="Previous">${icon('chevronLeft', 14)}</button><button class="btn btn-outline btn-icon-sm" aria-label="Next">${icon('chevronRight', 14)}</button></span>
      <button class="btn btn-outline btn-sm lang-btn">${icon('globe')}English</button>`;
  }
  return `<div class="pg-head"><div style="min-width:0"><h1 class="pg-title">${esc(VIDEO_LESSON.title)}</h1>${sub}</div><div class="pg-actions">${actions}</div></div>`;
}

function vMomentButtons(className = 'vp-btn labeled') {
  if (isTeacher()) return '';

  const ask = S.ai
    ? `<button class="${className} ask" data-v="ask" title="Ask about this moment (A)">${icon('sparkles', 15)}<span>Ask</span></button>`
    : '';
  return `<button class="${className}" data-v="bookmark" title="Bookmark this moment (B)">${icon('bookmark', 15)}<span>Bookmark</span></button>
    <button class="${className}" data-v="note" title="Add a note at this moment (N)">${icon('note', 15)}<span>Note</span></button>${ask}`;
}

function vPlayer() {
  const provider =
    V.source === 'youtube'
      ? `<span class="vp-provider">${icon('video', 13)}YouTube embed</span>`
      : V.source === 'drive'
        ? `<span class="vp-provider">${icon('video', 13)}Google Drive embed</span>`
        : '';
  const ownControls = V.source === 'upload';
  const momentGroup =
    ownControls && !isTeacher()
      ? `<span class="vp-moment-btns">${vMomentButtons()}</span><span class="vp-sep vp-moment-btns"></span>`
      : '';
  const rateAndTheatre = `<button class="vp-btn vp-desk" data-v="rate" title="Playback speed">${V.rate}×</button>
      <button class="vp-btn vp-desk" data-v="theatre" aria-pressed="${document.body.classList.contains('theatre')}" title="Theatre mode">${icon('theatre', 16)}</button>`;
  const ccButton = hasTranscript()
    ? `<button class="vp-btn" data-v="cc" aria-pressed="${V.cc}" title="Captions (C)">${icon('captions', 16)}</button>`
    : '';

  return `
    <div class="vp" id="vp">
      <div class="vp-screen" data-v="screen">
        <div class="vp-slide" data-v-slide></div>
        ${provider}
        <button class="vp-big-play" data-v="play" aria-label="Play">${icon('play', 26)}</button>
        <div class="vp-cc" data-v-cc hidden></div>
        <div class="vp-controls" data-v-controls>
          <div class="vp-track" data-v-track="${ownControls ? 'own' : 'provider'}">
            <span class="rail"></span><span class="watched" data-v-watched></span><span class="fill" data-v-fill></span><span class="knob" data-v-knob></span>
            <span class="vp-marks" data-v-marks></span>
          </div>
          <div class="vp-row">
            <button class="vp-btn" data-v="play" aria-label="Play" data-v-playbtn>${icon('play', 18)}</button>
            ${ownControls ? `<button class="vp-btn vp-desk" data-v="back" title="Back 10 seconds (J)">${icon('skipBack', 16)}</button><button class="vp-btn vp-desk" data-v="fwd" title="Forward 10 seconds (L)">${icon('skipForward', 16)}</button>` : ''}
            <span class="vp-time" data-v-time>0:00 / ${fmt(V.duration)}</span>
            <span class="vp-grow"></span>
            ${momentGroup}
            ${ccButton}
            ${ownControls ? rateAndTheatre : ''}
            <button class="vp-btn" data-v="fullscreen" title="Full screen">${icon('maximize', 16)}</button>
          </div>
        </div>
      </div>
    </div>
    ${vStrip()}
    ${V.source === 'upload' && !isTeacher() ? `<div class="vp-mobile-acts">${vMomentButtons('btn btn-outline btn-sm')}</div>` : ''}`;
}

function vStrip() {
  if (isTeacher() || V.source === 'upload') return '';

  if (V.source === 'drive') {
    return `<div class="vp-strip">
      <p class="note">${icon('info', 14)}<span>Google Drive videos don't tell ClassroomIO where you are in the video, so notes here belong to the whole video. You can type a time if you want one.</span></p>
      <div class="vp-strip-row"><span class="t">Your notes on this video</span><span class="grow"></span>
        <button class="btn btn-outline btn-sm" data-v="note">${icon('note', 14)}Add note</button>
        ${S.ai ? `<button class="btn btn-outline btn-sm" data-v="ask" style="color:var(--pen)">${icon('sparkles', 14)}Ask about this video</button>` : ''}
      </div></div>`;
  }

  return `<div class="vp-strip">
    <div class="vp-strip-row"><span class="t">Your moments</span><span class="grow"></span>${vMomentButtons('btn btn-outline btn-sm')}</div>
    <div class="vp-track" data-v-track="strip"><span class="rail"></span><span class="watched" data-v-watched></span><span class="fill" data-v-fill></span><span class="vp-marks" data-v-marks></span></div>
    <p class="note" style="margin:8px 0 0">${icon('info', 14)}<span>YouTube draws its own controls, so your markers sit on this strip. Click one to jump there.</span></p>
  </div>`;
}

function vActionsRow() {
  const transcript = hasTranscript()
    ? `<button class="btn btn-ghost btn-sm" data-v="transcript">${icon('content', 15)}Transcript</button><span class="bar">|</span>`
    : '';
  const watch = isTeacher()
    ? `<span class="vl-watch">${icon('chart', 14)}${VIDEO_INSIGHTS.learners} learners watched · average 81%</span>`
    : `<span class="vl-watch" data-v-watch-status></span>`;
  return `<div class="vl-actions">${transcript}<button class="btn btn-ghost btn-sm" data-v="summarize">${icon('sparkles', 15)}Summarize lesson</button><span class="grow"></span>${watch}</div>`;
}

function vInsights() {
  if (!isTeacher()) return '';

  const max = Math.max(...VIDEO_INSIGHTS.bins);
  const bars = VIDEO_INSIGHTS.bins
    .map(
      (value) =>
        `<span style="height:${Math.max(4, (value / max) * 100)}%;--a:${Math.round(25 + (value / max) * 75)}%"></span>`
    )
    .join('');
  const peaks = VIDEO_INSIGHTS.moments
    .map((moment) => `<span class="peak" style="left:${(moment.t / V.duration) * 100}%"><b>${fmt(moment.t)}</b></span>`)
    .join('');
  const moments = [...VIDEO_INSIGHTS.moments]
    .sort((a, b) => b.rewinds + b.questions + b.bookmarks - (a.rewinds + a.questions + a.bookmarks))
    .map(
      (moment) => `<div class="vi-moment">
        <button class="vt-chip" data-seek="${moment.t}">${icon('play')}${fmt(moment.t)}</button>
        <div>
          <div class="head">${esc(moment.label)}<span class="stats"><span>${moment.rewinds} rewinds</span><span>${moment.bookmarks} bookmarks</span><span>${moment.questions} questions</span></span></div>
          <p class="q">${esc(moment.top)}</p>
          <p class="sg">${esc(moment.suggestion)}</p>
          <div class="acts">
            <button class="btn btn-outline btn-sm" data-v="draft-note">${icon('sparkles', 14)}Draft a note for the lesson</button>
            <button class="btn btn-outline btn-sm" data-v="chapter">${icon('flag', 14)}Add chapter here</button>
            <button class="btn btn-ghost btn-sm" data-v="all-questions">See all ${moment.questions} questions</button>
          </div>
        </div></div>`
    )
    .join('');
  return `<div class="vi-strip">
      <div class="vi-strip-head"><b>Where learners pause, rewind and ask</b><span class="s">${VIDEO_INSIGHTS.learners} learners · only moments marked by 3 or more learners · nobody is named</span></div>
      <div class="vi-bars" data-v-heat>${bars}${peaks}</div>
      <div class="vi-axis"><span>0:00</span><span>${fmt(V.duration / 4)}</span><span>${fmt(V.duration / 2)}</span><span>${fmt((V.duration * 3) / 4)}</span><span>${fmt(V.duration)}</span></div>
      <div class="vi-legend"><span>Bar height = rewinds + bookmarks + questions in each 12 seconds</span><span>Click to jump there</span></div>
    </div>
    <div class="vi-moments">${moments}</div>`;
}

function vRenderPage() {
  vSetActiveLesson();
  const mobileNav = isTeacher()
    ? ''
    : `<nav class="mob-nav"><button class="btn btn-outline btn-icon-sm" aria-label="Previous">${icon('chevronLeft')}</button><button class="mid">${ring(62, 30)}<span style="min-width:0"><span class="t" style="display:block">${VIDEO_LESSON.position}</span><span class="d" style="display:block">${esc(VIDEO_LESSON.title)}</span></span></button><button class="btn btn-primary btn-icon-sm" aria-label="Next">${icon('chevronRight')}</button></nav>`;

  document.body.innerHTML = `
    <div class="cs-app">
      ${renderCourseSidebar('content')}
      <main class="cs-main" id="cs-main">
        ${renderCourseHeader()}
        <div class="pg">
          ${vPageHead()}
          <div class="vl-col">
            ${vPlayer()}
            ${vActionsRow()}
            <div class="vm-tray" data-v-tray></div>
            ${vInsights()}
            <article class="rd-note vl-notes">${VIDEO_NOTES_HTML}</article>
          </div>
        </div>
      </main>
    </div>
    <aside class="sp" id="sp" aria-label="Side panel"></aside>
    ${mobileNav}`;
}

/* ============================================================ player */

function vMarkerHtml(entry, isNew) {
  const left = (entry.t / V.duration) * 100;
  const color = markerColor(entry);
  if (entry.kind === 'highlight' && entry.tEnd) {
    const width = ((entry.tEnd - entry.t) / V.duration) * 100;
    return `<button class="vp-mark range ${isNew ? 'new' : ''}" data-mark="${entry.id}" style="left:${left}%;width:${width}%;--mk:${color}" aria-label="${kindLabel(entry)} at ${fmt(entry.t)}"></button>`;
  }
  return `<button class="vp-mark ${isNew ? 'new' : ''}" data-mark="${entry.id}" style="left:${left}%;--mk:${color}" aria-label="${kindLabel(entry)} at ${fmt(entry.t)}"></button>`;
}

function vRenderMarkers(newEntryId) {
  const markTarget =
    V.source === 'youtube' ? '[data-v-track="strip"] [data-v-marks]' : '[data-v-track="own"] [data-v-marks]';
  $$('[data-v-marks]').forEach((holder) => (holder.innerHTML = ''));
  if (!knowsTime()) return;

  const holder = $(markTarget);
  if (!holder) return;

  if (isTeacher()) {
    holder.innerHTML = VIDEO_INSIGHTS.moments
      .map(
        (moment) =>
          `<button class="vp-mark" data-peak="${moment.t}" style="left:${(moment.t / V.duration) * 100}%;--mk:oklch(0.72 0.16 264)" aria-label="${esc(moment.label)}"></button>`
      )
      .join('');
    return;
  }
  holder.innerHTML = videoEntries()
    .filter((entry) => entry.t != null)
    .map((entry) => vMarkerHtml(entry, entry.id === newEntryId))
    .join('');
}

function vUpdatePlayer() {
  const percent = (V.t / V.duration) * 100;
  const watchedPercent = (V.furthest / V.duration) * 100;
  $$('[data-v-fill]').forEach((el) => (el.style.width = `${percent}%`));
  $$('[data-v-watched]').forEach((el) => (el.style.width = `${watchedPercent}%`));
  $$('[data-v-knob]').forEach((el) => (el.style.left = `${percent}%`));
  const time = $('[data-v-time]');
  if (time) time.textContent = `${fmt(V.t)} / ${fmt(V.duration)}`;

  const slide = slideAt(V.t);
  if (slide !== V.lastSlide) {
    V.lastSlide = slide;
    $('[data-v-slide]').innerHTML = slide.html;
  }

  const segIndex = segIndexAt(V.t);
  const cc = $('[data-v-cc]');
  if (cc) {
    cc.hidden = !V.cc || !hasTranscript() || (!V.playing && V.t === 0);
    cc.textContent = TRANSCRIPT[segIndex].text;
  }

  if (segIndex !== V.lastSeg) {
    V.lastSeg = segIndex;
    $$('.tr-seg.active').forEach((el) => el.classList.remove('active'));
    const row = $(`.tr-seg[data-seg="${segIndex}"]`);
    if (row) {
      row.classList.add('active');
      if (V.follow && !V.trHover && V.panel === 'transcript')
        row.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }

  vUpdateWatch();
}

function vUpdateWatch() {
  if (isTeacher()) return;

  if (!knowsTime()) {
    const status = $('[data-v-watch-status]');
    if (status && !status.textContent) status.innerHTML = `${icon('info', 14)}Google Drive can't report watch progress`;
    return;
  }

  const watched = Math.round((V.furthest / V.duration) * 100);
  const toThreshold = Math.min(100, (watched / VIDEO_LESSON.watchThreshold) * 100);
  const done = watched >= VIDEO_LESSON.watchThreshold;
  const status = $('[data-v-watch-status]');
  if (status) status.innerHTML = `${icon(done ? 'circleCheck' : 'clock', 14)}Watched ${watched}% of the video content`;
  const button = $('[data-v-watch-btn]');
  if (button && button.dataset.pct !== String(Math.round(toThreshold))) {
    button.dataset.pct = String(Math.round(toThreshold));
    button.innerHTML = `${ring(toThreshold, 20, done)}<span class="text-xs">${done ? 'Completed' : `Watched ${watched}%`}</span>`;
  }
}

function vSetPlaying(playing) {
  V.playing = playing && V.t < V.duration;
  $('#vp')?.classList.toggle('playing', V.playing);
  $$('[data-v-playbtn]').forEach((button) => {
    button.innerHTML = icon(V.playing ? 'pause' : 'play', 18);
    button.setAttribute('aria-label', V.playing ? 'Pause' : 'Play');
  });
  vUpdatePlayer();
}

function vSeek(seconds, { force = false } = {}) {
  const target = Math.max(0, Math.min(V.duration, seconds));
  if (V.enforced && !force && target > V.furthest + 0.5) {
    toast('You cannot skip ahead on this video');
    return false;
  }

  V.t = target;
  V.furthest = Math.max(V.furthest, V.t);
  vUpdatePlayer();
  return true;
}

let vLastFrame = 0;

function vLoop(now) {
  const delta = vLastFrame ? (now - vLastFrame) / 1000 : 0;
  vLastFrame = now;
  if (V.playing) {
    V.t = Math.min(V.duration, V.t + delta * V.rate);
    V.furthest = Math.max(V.furthest, V.t);
    if (V.t >= V.duration) vSetPlaying(false);
    vUpdatePlayer();
  }
  requestAnimationFrame(vLoop);
}

/* track: hover preview, click / drag to seek, markers */

function vTrackTime(track, clientX) {
  const rect = track.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  return ratio * V.duration;
}

function vShowHover(track, clientX, markEl) {
  let bubble = $('.vp-hover', track);
  if (!bubble) {
    bubble = document.createElement('div');
    bubble.className = 'vp-hover';
    track.append(bubble);
  }
  const entry = markEl?.dataset.mark ? V.entries.find((item) => item.id === markEl.dataset.mark) : null;
  const peak = markEl?.dataset.peak
    ? VIDEO_INSIGHTS.moments.find((moment) => String(moment.t) === markEl.dataset.peak)
    : null;
  const compact = !entry && !peak;
  const halfWidth = compact ? 40 : 120;
  const rect = track.getBoundingClientRect();
  const x = Math.max(halfWidth, Math.min(rect.width - halfWidth, clientX - rect.left));
  bubble.style.left = `${x}px`;
  bubble.classList.toggle('compact', compact);
  if (entry) {
    const body = entry.note || entry.question || entry.exact || lineAt(entry.t);
    bubble.style.setProperty('--mk', markerColor(entry));
    bubble.innerHTML = `<div class="tm"><span class="k">${kindLabel(entry)}</span>${fmt(entry.t)}</div><div class="tx ${entry.note || entry.question ? '' : 'note'}">${esc(body)}</div>`;
    return;
  }
  if (peak) {
    bubble.innerHTML = `<div class="tm"><span class="k">${esc(peak.label)}</span>${fmt(peak.t)}</div><div class="tx">${peak.rewinds} rewinds · ${peak.bookmarks} bookmarks · ${peak.questions} questions</div>`;
    return;
  }

  const seconds = vTrackTime(track, clientX);
  const blocked = V.enforced && seconds > V.furthest + 0.5;
  bubble.style.removeProperty('--mk');
  bubble.innerHTML = `<div class="tm">${fmt(seconds)}</div>${blocked ? '<div class="blocked">Watch up to here first</div>' : ''}`;
}

function vBindTracks() {
  $$('[data-v-track]').forEach((track) => {
    track.addEventListener('mousemove', (event) => {
      if (V.dragging) vSeek(vTrackTime(track, event.clientX));
      vShowHover(track, event.clientX, event.target.closest('.vp-mark'));
    });
    track.addEventListener('mouseleave', () => $('.vp-hover', track)?.remove());
    track.addEventListener('mousedown', (event) => {
      event.preventDefault();
      const mark = event.target.closest('.vp-mark');
      if (mark?.dataset.mark) {
        const entry = V.entries.find((item) => item.id === mark.dataset.mark);
        if (entry && vSeek(entry.t)) vFlashEntry(entry.id);
        return;
      }
      if (mark?.dataset.peak) {
        vSeek(Number(mark.dataset.peak), { force: true });
        return;
      }

      vSeek(vTrackTime(track, event.clientX));
      V.dragging = true;
    });
  });
  document.addEventListener('mouseup', () => (V.dragging = false));

  $('[data-v-heat]')?.addEventListener('click', (event) => {
    vSeek(vTrackTime(event.currentTarget, event.clientX), { force: true });
    vSetPlaying(true);
  });
}

/* ============================================================ moments */

function vBookmark() {
  if (!knowsTime()) return;

  const entry = { id: newId(), kind: 'bookmark', t: Math.floor(V.t), when: 'just now' };
  addEntry(entry);
  toast(`Bookmarked ${fmt(entry.t)}`, 'Add note', () => vOpenComposer('note', entry));
}

function vOpenComposer(kind, existing) {
  V.resumeAfter = V.playing;
  vSetPlaying(false);
  V.tray = {
    kind,
    t: existing?.t ?? Math.floor(V.t),
    entryId: existing?.id || null,
    color: existing?.color || prefs.hl
  };
  vRenderTray();
  const field = $('[data-v-tray] textarea, [data-v-tray] input[data-v-ask]');
  field?.focus();
  $('[data-v-tray]').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function vCloseComposer({ resume = false } = {}) {
  V.tray = null;
  vRenderTray();
  if (resume && V.resumeAfter) vSetPlaying(true);
}

function vComposerHtml() {
  const tray = V.tray;
  if (!tray) return '';

  const timeChip = knowsTime()
    ? `<button class="vt-chip" data-seek="${tray.t}">${icon('play')}${fmt(tray.t)}</button>`
    : `<span class="vt-chip static">Whole video</span>`;
  if (tray.kind === 'note') {
    const existing = tray.entryId ? V.entries.find((entry) => entry.id === tray.entryId) : null;
    const context = hasTranscript() ? `<p class="vm-context"><b>${fmt(tray.t)}</b> ${esc(lineAt(tray.t))}</p>` : '';
    const timeInput = knowsTime()
      ? ''
      : `<label class="vm-time-input">${icon('clock', 14)}At <input type="text" placeholder="m:ss" data-v-usert aria-label="Time in the video (optional)" /> optional</label>`;
    return `<div class="vm-composer" data-skip>
      <div class="vm-composer-head">${icon('note', 15)}<span>${knowsTime() ? 'Note at' : 'Note on this video'}</span>${timeChip}<span class="grow"></span><button class="btn-ghost-icon" data-v="tray-cancel" aria-label="Cancel">${icon('x')}</button></div>
      ${context}
      <textarea rows="2" placeholder="What do you want to remember about this moment?" aria-label="Note">${esc(existing?.note || '')}</textarea>
      <div class="row">
        <span class="vm-colors" aria-label="Colour">${Object.entries(HL)
          .map(
            ([key, color]) =>
              `<button data-v-color="${key}" aria-label="${color.name}" aria-pressed="${key === tray.color}" style="background:${color.swatch}"></button>`
          )
          .join('')}</span>
        ${timeInput}
        <span class="grow"></span>
        <span style="font-size:12px;color:var(--muted-foreground)" class="desktop-only"><span class="kbd">⌘</span><span class="kbd">↵</span></span>
        <button class="btn btn-outline btn-sm" data-v="tray-cancel">Cancel</button>
        <button class="btn btn-primary btn-sm" data-v="note-save">${V.resumeAfter ? 'Save and resume' : 'Save note'}</button>
      </div></div>`;
  }

  const span = contextWindow(tray.t);
  const context = hasTranscript()
    ? `<p class="vm-context"><b>${fmt(span.from)}–${fmt(span.to)}</b> ${esc(truncate(span.lines.map((line) => line.text).join(' '), 210))}</p>`
    : `<p class="vm-context">This video has no transcript ClassroomIO can read, so answers use the lesson notes and title.</p>`;
  const chips = ['What did they just say?', 'Explain this step', 'Give me an example', 'Why does this matter?'];
  return `<div class="vm-composer" data-skip>
    <div class="vm-composer-head">${icon('sparkles', 15, 'style="color:var(--pen)"')}<span>${knowsTime() ? 'Ask about this moment' : 'Ask about this video'}</span>${timeChip}<span class="grow"></span><button class="btn-ghost-icon" data-v="tray-cancel" aria-label="Cancel">${icon('x')}</button></div>
    ${context}
    <div class="rd-ask-row" style="padding:0"><input type="text" data-v-ask placeholder="Ask about what you just watched…" aria-label="Ask about this moment" /><button class="rd-ask-send" data-v="ask-send" aria-label="Ask">${icon('send')}</button></div>
    <div class="rd-chips" style="padding:8px 0 0">${chips.map((chip) => `<button class="rd-chip" data-v-chip="${esc(chip)}">${chip}</button>`).join('')}</div>
  </div>`;
}

function vSaveNote() {
  const tray = V.tray;
  const text = $('[data-v-tray] textarea').value.trim();
  const userTRaw = $('[data-v-usert]')?.value.trim();
  const userT =
    userTRaw && /^\d+:\d{2}$/.test(userTRaw)
      ? Number(userTRaw.split(':')[0]) * 60 + Number(userTRaw.split(':')[1])
      : null;
  const existing = tray.entryId ? V.entries.find((entry) => entry.id === tray.entryId) : null;

  if (existing) {
    existing.kind = existing.kind === 'bookmark' ? 'note' : existing.kind;
    existing.note = text;
    existing.color = tray.color;
    saveVideoEntries();
    refreshEntryViews();
  } else {
    const entry = knowsTime()
      ? { id: newId(), kind: 'note', t: tray.t, color: tray.color, note: text, when: 'just now' }
      : { id: newId(), kind: 'note', whole: true, userT, color: tray.color, note: text, when: 'just now' };
    addEntry(entry);
  }
  toast(knowsTime() ? `Note saved at ${fmt(tray.t)}` : 'Note saved to your notebook');
  vCloseComposer({ resume: true });
}

function vSubmitMomentAsk(question) {
  if (!question.trim()) return;

  const t = V.tray.t;
  const span = contextWindow(t);
  const answer = answerFor('moment', '', t, question);
  const entry = {
    id: newId(),
    kind: 'question',
    action: 'moment',
    t: knowsTime() ? t : null,
    whole: !knowsTime(),
    from: span.from,
    to: span.to,
    question: question.trim(),
    answer: answer.text,
    key: answer.key,
    when: 'just now'
  };
  V.tray = null;
  V.trayCards = [entry.id, ...V.trayCards].slice(0, 2);
  addEntry(entry);
  vStream(entry);
}

function vCardHtml(entry) {
  const time =
    entry.t != null
      ? `<button class="vt-chip" data-seek="${entry.t}">${icon('play')}${fmt(entry.t)}</button>`
      : `<span class="vt-chip static">Whole video</span>`;
  const source =
    entry.action === 'moment'
      ? knowsTime()
        ? `From the transcript, ${fmt(entry.from)}–${fmt(entry.to)} · saved to notebook`
        : 'From the lesson notes · saved to notebook'
      : 'From the transcript · saved to notebook';
  const quote = entry.exact ? `<p class="rd-card-quote">“${esc(entry.exact)}”</p>` : '';
  const followUps = (entry.followUps || [])
    .map((item) => `<p class="rd-card-q">${esc(item.q)}</p><p class="rd-card-a">${esc(item.a)}</p>`)
    .join('');
  return `<div class="rd-card-head"><span class="act">${kindLabel(entry)}</span>${time}<span class="when">· ${esc(entry.when)}</span><span class="sp"></span><button class="btn-ghost-icon" data-v-dismiss="${entry.id}" aria-label="Close">${icon('x')}</button></div>
    ${quote}
    ${entry.question ? `<p class="rd-card-q">${esc(entry.question)}</p>` : ''}
    <p class="rd-card-a" data-answer-for="${entry.id}">${entry.streaming ? '' : markKey(esc(entry.answer || ''), entry.key)}</p>
    ${followUps}
    <div class="rd-card-meta">${source}</div>
    <div class="rd-card-foot"><input type="text" placeholder="Ask a follow-up…" aria-label="Ask a follow-up" data-v-follow="${entry.id}" /></div>`;
}

function vRenderTray() {
  const tray = $('[data-v-tray]');
  if (!tray) return;

  const cards = V.trayCards
    .map((id) => V.entries.find((entry) => entry.id === id))
    .filter(Boolean)
    .map((entry) => `<div class="vm-card" data-skip>${vCardHtml(entry)}</div>`)
    .join('');
  tray.innerHTML = vComposerHtml() + cards;
}

function vFollowUp(entry, question) {
  const answer = answerFor('ask', entry.exact || '', entry.t ?? 0, question);
  entry.followUps = [...(entry.followUps || []), { q: question, a: answer.text }];
  saveVideoEntries();
  vRenderTray();
  vRenderPanel();
}

/* ============================================================ transcript */

function vSegmentText(index) {
  const text = TRANSCRIPT[index].text;
  const ranges = V.entries
    .filter(
      (entry) =>
        entry.kind === 'highlight' &&
        entry.source !== 'text' &&
        !entry.orphaned &&
        index >= entry.seg &&
        index <= entry.segEnd
    )
    .map((entry) => ({
      from: index === entry.seg ? entry.offA : 0,
      to: index === entry.segEnd ? entry.offB : text.length,
      color: HL[entry.color]?.swatch || HL.yellow.swatch,
      id: entry.id
    }))
    .sort((a, b) => a.from - b.from);

  let html = '';
  let cursor = 0;
  ranges.forEach((range) => {
    if (range.from < cursor) return;

    html += esc(text.slice(cursor, range.from));
    html += `<span class="tr-hl" data-hl-id="${range.id}" style="background:color-mix(in oklab, ${range.color} 60%, transparent)">${esc(text.slice(range.from, range.to))}</span>`;
    cursor = range.to;
  });
  return html + esc(text.slice(cursor));
}

function vTranscriptPanel() {
  const switcher = vPanelSwitch();
  const sourceLabel = V.source === 'youtube' ? 'YouTube captions' : 'from the uploaded video';
  const head = `<div class="sp-head"><div><div class="t" style="display:flex;align-items:center;gap:6px">${icon('captions', 16, 'style="color:var(--primary)"')}Transcript</div><div class="s">Language: English · ${sourceLabel}</div></div>
    <div class="acts"><button class="btn-ghost-icon" data-v="close-panel" aria-label="Close">${icon('x')}</button></div></div>`;
  if (!hasTranscript()) return `${head}${switcher}<p class="tr-unavail">This video has no transcript.</p>`;

  const segIndex = segIndexAt(V.t);
  const pinsBySeg = {};
  videoEntries()
    .filter((entry) => entry.kind !== 'highlight' && entry.t != null)
    .forEach((entry) => {
      const index = segIndexAt(entry.t);
      pinsBySeg[index] = [...(pinsBySeg[index] || []), entry];
    });
  const cardsBySeg = {};
  V.trCards
    .map((id) => V.entries.find((entry) => entry.id === id))
    .filter(Boolean)
    .forEach((entry) => {
      const index = entry.segEnd ?? segIndexAt(entry.t);
      cardsBySeg[index] = [...(cardsBySeg[index] || []), entry];
    });

  const hasTranscriptHighlights = V.entries.some((entry) => entry.kind === 'highlight' && entry.source !== 'text');
  const hint =
    isTeacher() || hasTranscriptHighlights
      ? ''
      : `<p class="tr-hint">${icon('highlighter', 14)}<span>Select any words to highlight them, add a note${S.ai ? ' or ask about them' : ''}. Click a line to jump there.</span></p>`;
  const rows = TRANSCRIPT.map((segment, index) => {
    const pins = (pinsBySeg[index] || [])
      .map(
        (entry) =>
          `<button class="tr-pin" data-v-pin="${entry.id}" style="--mk:${markerColor(entry)}"><span class="dot"></span><span>${esc(entry.kind === 'bookmark' ? 'Bookmark' : truncate(entry.note || entry.question || '', 44))}</span></button>`
      )
      .join('');
    const cards = (cardsBySeg[index] || [])
      .map((entry) => `<div class="vm-card" style="margin:4px 0 8px 40px" data-skip>${vCardHtml(entry)}</div>`)
      .join('');
    const unwatched = V.enforced && segment.start > V.furthest ? 'unwatched' : '';
    return `<div class="tr-seg ${index === segIndex ? 'active' : ''} ${unwatched}" data-seg="${index}"><span class="ts">${fmt(segment.start)}</span><span class="tx">${vSegmentText(index)}</span>${pins ? `<span class="tr-pins">${pins}</span>` : ''}</div>${cards}`;
  }).join('');

  return `${head}${switcher}
    <div class="tr-head-nav"><button class="tr-follow" data-v="follow" aria-pressed="${V.follow}">${icon('locate', 13)}${V.follow ? 'Following video' : 'Follow video'}</button><span class="grow"></span><span style="font-size:12px;color:var(--muted-foreground)">${TRANSCRIPT.length} lines</span></div>
    <div class="tr-list" data-v-trlist>${hint}${rows}</div>`;
}

function vPanelSwitch() {
  if (isTeacher()) return '';

  return `<div class="sp-switch"><div class="rd-seg sm" style="font-size:12px">${hasTranscript() ? `<button data-v-panel="transcript" aria-pressed="${V.panel === 'transcript'}">Transcript</button>` : ''}<button data-v-panel="notebook" aria-pressed="${V.panel === 'notebook'}">Notebook <span class="count-badge" data-v-count style="margin-left:4px">${V.entries.length}</span></button></div></div>`;
}

/* transcript selection → toolbar */

let vToolbarEl = null;
let vSelection = null;

function vOffsetIn(textEl, node, offset) {
  let total = 0;
  const walker = document.createTreeWalker(textEl, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    if (walker.currentNode === node) return total + offset;
    total += walker.currentNode.textContent.length;
  }
  return node === textEl ? textEl.textContent.length : total;
}

function vReadSelection() {
  const selection = getSelection();
  if (!selection || selection.isCollapsed || !selection.rangeCount) return null;

  const range = selection.getRangeAt(0);
  const list = $('[data-v-trlist]');
  if (!list || !list.contains(range.commonAncestorContainer)) return null;

  const startText = (
    range.startContainer.nodeType === 3 ? range.startContainer.parentElement : range.startContainer
  ).closest('.tx');
  const endText = (range.endContainer.nodeType === 3 ? range.endContainer.parentElement : range.endContainer).closest(
    '.tx'
  );
  if (!startText || !endText) return null;

  const seg = Number(startText.closest('.tr-seg').dataset.seg);
  const segEnd = Number(endText.closest('.tr-seg').dataset.seg);
  const offA = vOffsetIn(startText, range.startContainer, range.startOffset);
  const offB = vOffsetIn(endText, range.endContainer, range.endOffset);
  const exact = range.toString().replace(/\s+/g, ' ').trim();
  if (!exact) return null;

  return { seg, segEnd, offA, offB, exact, rect: range.getBoundingClientRect() };
}

function vShowToolbar(selection) {
  vHideToolbar();
  vSelection = selection;
  const ai = S.ai
    ? `<button class="b ask" data-vtb="ask">${icon('sparkles')}<span>Ask</span></button><button class="b" data-vtb="explain">${icon('info')}<span>Explain</span></button><button class="b" data-vtb="define">${icon('bookOpen')}<span>Define</span></button><span class="div"></span>`
    : '';
  vToolbarEl = document.createElement('div');
  vToolbarEl.className = 'rd-tb';
  vToolbarEl.setAttribute('role', 'toolbar');
  vToolbarEl.innerHTML = `${ai}
    <span class="hl-group" style="display:flex;align-items:center">
      <button class="b icon hl-btn" data-vtb="highlight" aria-label="Highlight">${icon('highlighter')}<span class="bar" style="background:${HL[prefs.hl].swatch}"></span><span class="mlabel">Highlight</span></button>
      <span class="rd-tb-colors" hidden>${Object.entries(HL)
        .map(
          ([key, color]) =>
            `<button data-vhl="${key}" aria-label="${color.name}" aria-pressed="${key === prefs.hl}" style="background:${color.swatch}"></button>`
        )
        .join('')}</span>
    </span>
    <button class="b icon" data-vtb="note" aria-label="Add note">${icon('note')}<span class="mlabel">Note</span></button>
    <button class="b icon" data-vtb="jump" aria-label="Play from here">${icon('play')}<span class="mlabel">Play</span></button>
    <button class="b icon" data-vtb="copy" aria-label="Copy with timestamp">${icon('copy')}<span class="mlabel">Copy</span></button>`;
  document.body.append(vToolbarEl);
  document.body.classList.add('has-tb');
  positionFloating(vToolbarEl, selection.rect);
  vToolbarEl.addEventListener('mousedown', (event) => {
    if (!event.target.closest('input')) event.preventDefault();
  });
  const group = $('.hl-group', vToolbarEl);
  group.addEventListener('mouseenter', () => ($('.rd-tb-colors', vToolbarEl).hidden = false));
  group.addEventListener('mouseleave', () => ($('.rd-tb-colors', vToolbarEl).hidden = true));
  vToolbarEl.addEventListener('click', vOnToolbarClick);
}

function vHideToolbar() {
  vToolbarEl?.remove();
  vToolbarEl = null;
  document.body.classList.remove('has-tb');
}

function vHighlightFromSelection(color) {
  const selection = vSelection;
  const entry = {
    id: newId(),
    kind: 'highlight',
    t: TRANSCRIPT[selection.seg].start,
    tEnd: TRANSCRIPT[selection.segEnd].end,
    seg: selection.seg,
    segEnd: selection.segEnd,
    offA: selection.offA,
    offB: selection.offB,
    exact: selection.exact,
    color,
    when: 'just now'
  };
  getSelection()?.removeAllRanges();
  vHideToolbar();
  addEntry(entry);
  return entry;
}

function vOnToolbarClick(event) {
  const swatch = event.target.closest('[data-vhl]');
  if (swatch) {
    prefs.hl = swatch.dataset.vhl;
    savePrefs();
    vHighlightFromSelection(prefs.hl);
    toast('Highlighted · saved to your notebook');
    return;
  }

  const chip = event.target.closest('[data-vchip]');
  if (chip) {
    vTranscriptQuestion('ask', chip.dataset.vchip);
    return;
  }
  if (event.target.closest('.rd-ask-send')) {
    vTranscriptQuestion('ask', $('input', vToolbarEl).value);
    return;
  }

  const action = event.target.closest('[data-vtb]')?.dataset.vtb;
  if (!action) return;

  if (action === 'highlight') {
    vHighlightFromSelection(prefs.hl);
    toast('Highlighted · saved to your notebook');
  }
  if (action === 'note') {
    const rect = vSelection.rect;
    const entry = vHighlightFromSelection(prefs.hl);
    vOpenNotePop(entry, rect);
  }
  if (action === 'explain' || action === 'define') vTranscriptQuestion(action);
  if (action === 'ask') vOpenToolbarAsk();
  if (action === 'jump') {
    const start = TRANSCRIPT[vSelection.seg].start;
    getSelection()?.removeAllRanges();
    vHideToolbar();
    if (vSeek(start)) vSetPlaying(true);
  }
  if (action === 'copy') {
    const start = TRANSCRIPT[vSelection.seg].start;
    copyText(`“${vSelection.exact}” — ${VIDEO_LESSON.title}, ${fmt(start)}`);
    toast(`Copied with a link to ${fmt(start)}`);
    getSelection()?.removeAllRanges();
    vHideToolbar();
  }
}

function vOpenToolbarAsk() {
  vToolbarEl.classList.add('asking');
  vToolbarEl.innerHTML = `
    <div class="rd-ask-row"><span class="rd-ask-quote" title="${esc(vSelection.exact)}">“${esc(vSelection.exact)}”</span>
      <input type="text" placeholder="Ask about this…" aria-label="Ask about the selected words" />
      <button class="rd-ask-send" aria-label="Ask">${icon('send')}</button></div>
    <div class="rd-chips">${['Explain this in simple terms', 'Give me an example', 'Why does this matter?'].map((chip) => `<button class="rd-chip" data-vchip="${esc(chip)}">${chip}</button>`).join('')}</div>`;
  positionFloating(vToolbarEl, vSelection.rect);
  const input = $('input', vToolbarEl);
  input.focus();
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') vTranscriptQuestion('ask', input.value);
    if (event.key === 'Escape') vHideToolbar();
  });
}

function vTranscriptQuestion(action, question = '') {
  if (action === 'ask' && !question.trim()) return;

  const selection = vSelection;
  const t = TRANSCRIPT[selection.seg].start;
  const answer = answerFor(action, selection.exact, t, question);
  const entry = {
    id: newId(),
    kind: 'question',
    action,
    t,
    seg: selection.seg,
    segEnd: selection.segEnd,
    exact: selection.exact,
    question:
      action === 'ask'
        ? question.trim()
        : action === 'define'
          ? `Define “${truncate(selection.exact, 40)}”`
          : 'Explain this',
    answer: answer.text,
    key: answer.key,
    when: 'just now'
  };
  getSelection()?.removeAllRanges();
  vHideToolbar();
  V.trCards = [...V.trCards, entry.id];
  addEntry(entry);
  vStream(entry);
}

function vOpenNotePop(entry, rect) {
  $$('.rd-note-pop').forEach((el) => el.remove());
  const pop = document.createElement('div');
  pop.className = 'rd-note-pop';
  pop.innerHTML = `
    <p class="q" style="border-color:${HL[entry.color]?.swatch}">${esc(entry.exact)}</p>
    <textarea placeholder="Write a note for yourself…" aria-label="Note"></textarea>
    <div class="acts"><button class="btn btn-outline btn-sm" data-act="cancel">Cancel</button><button class="btn btn-primary btn-sm" data-act="save">Save note</button></div>`;
  document.body.append(pop);
  positionFloating(pop, rect);
  const textarea = $('textarea', pop);
  textarea.focus();
  pop.addEventListener('click', (event) => {
    const act = event.target.closest('[data-act]')?.dataset.act;
    if (!act) return;

    if (act === 'save') {
      entry.note = textarea.value.trim();
      saveVideoEntries();
      refreshEntryViews();
      toast(entry.note ? `Note saved at ${fmt(entry.t)}` : 'Highlighted · saved to your notebook');
    }
    pop.remove();
  });
  textarea.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) $('[data-act="save"]', pop).click();
    if (event.key === 'Escape') pop.remove();
  });
}

/* ============================================================ notebook */

function vTimeChip(entry) {
  if (entry.orphaned) return `<span class="vt-chip static">${fmt(entry.t)}</span>`;
  if (entry.whole)
    return entry.userT != null
      ? `<span class="vt-chip static" title="Time you typed">~${fmt(entry.userT)}</span>`
      : `<span class="vt-chip static">Whole video</span>`;
  if (entry.t == null) return '';

  const label = entry.kind === 'highlight' && entry.tEnd ? `${fmt(entry.t)}–${fmt(entry.tEnd)}` : fmt(entry.t);
  return `<button class="vt-chip" data-seek="${entry.t}" title="Play from ${fmt(entry.t)}">${icon('play')}${label}</button>`;
}

function vNotebookItem(entry) {
  const remove = `<button class="btn-ghost-icon" data-v-remove="${entry.id}" aria-label="Delete" style="width:22px;height:22px">${icon('trash', 13)}</button>`;
  const ref = entry.source === 'text' ? `<span class="p">¶${entry.p}</span>` : vTimeChip(entry);
  const meta = `<div class="nb-meta"><span class="kind ${entry.kind === 'question' ? 'q' : entry.kind === 'bookmark' ? 'bm' : ''}">${kindLabel(entry)}</span>${ref}<span>· ${esc(entry.when)}</span><span class="sp"></span>${remove}</div>`;
  const line =
    knowsTime() && entry.t != null && !entry.orphaned && hasTranscript()
      ? `<p class="nb-moment-line">${esc(truncate(lineAt(entry.t), 120))}</p>`
      : '';
  const orphan = entry.orphaned
    ? `<div class="nb-orphan">${icon('alert')}<span>Your teacher replaced this video. Your note and the line you saved are kept.</span></div>`
    : '';
  const seekAttr = entry.t != null && !entry.orphaned && !entry.whole ? `data-v-goto="${entry.id}"` : '';

  if (entry.kind === 'question') {
    const quote = entry.exact
      ? `“${esc(truncate(entry.exact, 90))}”`
      : entry.from != null && knowsTime()
        ? `Transcript ${fmt(entry.from)}–${fmt(entry.to)}`
        : 'Lesson notes';
    return `<div class="nb-item" ${seekAttr}>${meta}<p class="nb-q-quote">${quote}</p><p class="nb-question">${esc(entry.question)}</p><p class="nb-answer">${esc(entry.answer || '…')}</p></div>`;
  }
  if (entry.kind === 'highlight' || entry.exact) {
    const color = HL[entry.color]?.swatch || HL.yellow.swatch;
    const note = entry.note ? `<div class="nb-note">${icon('note')}<span>${esc(entry.note)}</span></div>` : '';
    return `<div class="nb-item ${entry.orphaned ? 'orphan' : ''}" ${seekAttr}>${meta}<p class="nb-quote"><span style="background:color-mix(in oklab, ${color} 55%, transparent)">${esc(entry.exact)}</span></p>${note}${orphan}</div>`;
  }
  if (entry.kind === 'note') {
    const color = HL[entry.color]?.swatch || HL.yellow.swatch;
    return `<div class="nb-item" ${seekAttr}>${meta}<div class="nb-note" style="border-color:${color}">${icon('note')}<span>${esc(entry.note || 'Empty note')}</span></div>${line}</div>`;
  }
  return `<div class="nb-item" ${seekAttr}>${meta}${line || '<p class="nb-moment-line">Bookmarked moment</p>'}<button class="nb-add-note" data-v-addnote="${entry.id}">+ Add a note</button></div>`;
}

function vNotebookPanel() {
  const matchesTab = (entry) =>
    V.nbTab === 'all' ||
    (V.nbTab === 'moments' && (entry.kind === 'bookmark' || entry.kind === 'note')) ||
    (V.nbTab === 'highlights' && entry.kind === 'highlight') ||
    (V.nbTab === 'questions' && entry.kind === 'question');
  const video = V.entries
    .filter((entry) => entry.source !== 'text' && !entry.orphaned)
    .sort((a, b) => (a.t ?? a.userT ?? 0) - (b.t ?? b.userT ?? 0));
  const text = V.entries.filter((entry) => entry.source === 'text');
  const orphans = V.entries.filter((entry) => entry.orphaned);
  const all = [...video, ...text, ...orphans];
  const count = (predicate) => all.filter(predicate).length;
  const moments = count((entry) => entry.kind === 'bookmark' || entry.kind === 'note');
  const highlights = count((entry) => entry.kind === 'highlight');
  const questions = count((entry) => entry.kind === 'question');

  const group = (title, entries, subtitle = '') => {
    const visible = entries.filter(matchesTab);
    if (!visible.length) return '';
    return `<div class="sp-group" style="margin-top:12px">${title}${subtitle ? ` <span style="font-weight:400;text-transform:none;letter-spacing:0">· ${subtitle}</span>` : ''}</div>${visible.map(vNotebookItem).join('')}`;
  };
  const list =
    group(`Video`, video, `${esc(VIDEO_LESSON.videoTitle)} · ${fmt(V.duration)}`) +
    group('Lesson notes', text) +
    group('Earlier version of this video', orphans, esc(orphans[0]?.videoTitle || ''));
  const empty = `<div class="nb-empty"><span class="ic">${icon('bookmark')}</span><span class="t">Nothing saved yet</span><span>${knowsTime() ? 'Press B while watching to bookmark a moment, N to add a note' : 'Add a note on this video'}${S.ai ? ', or ask about what you just watched' : ''}. ${hasTranscript() ? 'You can also select words in the transcript.' : ''}</span></div>`;

  return `
    <div class="sp-head"><div><div class="t">Notebook</div><div class="s">${moments} moment${moments === 1 ? '' : 's'} · ${highlights} highlight${highlights === 1 ? '' : 's'} · ${questions} question${questions === 1 ? '' : 's'}</div></div>
      <div class="acts"><button class="btn-ghost-icon" data-v="nb-copy" aria-label="Copy as Markdown" title="Copy as Markdown">${icon('copy')}</button><button class="btn-ghost-icon" data-v="close-panel" aria-label="Close">${icon('x')}</button></div></div>
    ${vPanelSwitch()}
    <div class="sp-tools"><div class="sp-tabs">
      <button data-v-tab="all" aria-pressed="${V.nbTab === 'all'}">All<span class="n">${all.length}</span></button>
      <button data-v-tab="moments" aria-pressed="${V.nbTab === 'moments'}">Moments<span class="n">${moments}</span></button>
      <button data-v-tab="highlights" aria-pressed="${V.nbTab === 'highlights'}">Highlights<span class="n">${highlights}</span></button>
      <button data-v-tab="questions" aria-pressed="${V.nbTab === 'questions'}">Questions<span class="n">${questions}</span></button>
    </div></div>
    <div class="sp-list">${all.length ? list || '<div class="nb-empty"><span class="t">Nothing in this tab</span></div>' : empty}</div>
    <div class="sp-foot">${icon('lock')}<span>Only you can see your notebook</span><a href="notebook.html">Open full notebook</a></div>`;
}

function vNotebookMarkdown() {
  const lines = [`# Notebook — ${VIDEO_LESSON.title}`, `_${COURSE.title}_`, ''];
  V.entries.forEach((entry) => {
    const ref =
      entry.source === 'text'
        ? `¶${entry.p}`
        : entry.orphaned
          ? '(earlier video)'
          : entry.whole
            ? 'whole video'
            : fmt(entry.t);
    if (entry.kind === 'question') lines.push(`**[${ref}]** Q: ${entry.question}`, `A: ${entry.answer}`, '');
    else if (entry.exact) lines.push(`> ${entry.exact}`, `— ${ref}${entry.note ? ` · ${entry.note}` : ''}`, '');
    else lines.push(`- **[${ref}]** ${entry.note || `Bookmark: “${lineAt(entry.t)}”`}`);
  });
  return lines.join('\n');
}

/* ============================================================ panels */

function vOpenPanel(kind) {
  V.panel = kind;
  document.body.classList.add('sp-open');
  vRenderPanel();
  if (kind === 'transcript') setTimeout(() => $('.tr-seg.active')?.scrollIntoView({ block: 'center' }), 60);
}

function vClosePanel() {
  V.panel = null;
  document.body.classList.remove('sp-open');
}

function vRenderPanel() {
  const panel = $('#sp');
  if (!panel || !V.panel) return;

  const scroller = $('.tr-list, .sp-list', panel);
  const scrollTop = scroller?.scrollTop;
  panel.innerHTML = V.panel === 'transcript' ? vTranscriptPanel() : vNotebookPanel();
  const nextScroller = $('.tr-list, .sp-list', panel);
  if (scrollTop != null && nextScroller) nextScroller.scrollTop = scrollTop;
  V.lastSeg = -1;
  const list = $('[data-v-trlist]', panel);
  if (list) {
    list.addEventListener('mouseenter', () => (V.trHover = true));
    list.addEventListener('mouseleave', () => (V.trHover = false));
  }
  vUpdateCounts();
}

function vFlashEntry(id) {
  const item = $(`[data-v-goto="${id}"]`);
  if (!item) return;

  item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  item.style.background = 'color-mix(in oklab, var(--pen) 8%, transparent)';
  setTimeout(() => (item.style.background = ''), 900);
}

/* ============================================================ events */

function vBindEvents() {
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.rd-note-pop') && !event.target.closest('[data-vtb]'))
      $$('.rd-note-pop').forEach((el) => el.remove());

    const seek = event.target.closest('[data-seek]');
    if (seek) {
      if (vSeek(Number(seek.dataset.seek), { force: isTeacher() })) vSetPlaying(true);
      return;
    }

    const goto = event.target.closest('[data-v-goto]');
    if (goto && !event.target.closest('button')) {
      const entry = V.entries.find((item) => item.id === goto.dataset.vGoto);
      if (entry && vSeek(entry.t)) vSetPlaying(true);
      return;
    }

    const pin = event.target.closest('[data-v-pin]');
    if (pin) {
      const entry = V.entries.find((item) => item.id === pin.dataset.vPin);
      if (entry) vSeek(entry.t);
      return;
    }

    const remove = event.target.closest('[data-v-remove]');
    if (remove) {
      removeVideoEntry(remove.dataset.vRemove);
      return;
    }

    const addNote = event.target.closest('[data-v-addnote]');
    if (addNote) {
      vOpenComposer(
        'note',
        V.entries.find((item) => item.id === addNote.dataset.vAddnote)
      );
      return;
    }

    const dismiss = event.target.closest('[data-v-dismiss]');
    if (dismiss) {
      V.trayCards = V.trayCards.filter((id) => id !== dismiss.dataset.vDismiss);
      V.trCards = V.trCards.filter((id) => id !== dismiss.dataset.vDismiss);
      vRenderTray();
      vRenderPanel();
      return;
    }

    const color = event.target.closest('[data-v-color]');
    if (color) {
      V.tray.color = color.dataset.vColor;
      prefs.hl = V.tray.color;
      savePrefs();
      $$('[data-v-color]').forEach((button) => button.setAttribute('aria-pressed', String(button === color)));
      return;
    }

    const chip = event.target.closest('[data-v-chip]');
    if (chip) {
      vSubmitMomentAsk(chip.dataset.vChip);
      return;
    }

    const panelSwitch = event.target.closest('[data-v-panel]');
    if (panelSwitch) {
      vOpenPanel(panelSwitch.dataset.vPanel);
      return;
    }

    const tab = event.target.closest('[data-v-tab]');
    if (tab) {
      V.nbTab = tab.dataset.vTab;
      vRenderPanel();
      return;
    }

    const segRow = event.target.closest('.tr-seg');
    if (segRow && !event.target.closest('.tr-pin') && getSelection()?.isCollapsed !== false) {
      if (vSeek(TRANSCRIPT[Number(segRow.dataset.seg)].start)) vSetPlaying(true);
      return;
    }

    const action = event.target.closest('[data-v]')?.dataset.v;
    if (!action) return;
    if (action === 'screen' && event.target.closest('[data-v-controls], .vp-provider')) return;

    vRunAction(action);
  });

  document.addEventListener('mouseup', (event) => {
    if (event.target.closest('.rd-tb, .rd-note-pop')) return;

    setTimeout(() => {
      const selection = vReadSelection();
      if (selection && !isTeacher()) vShowToolbar(selection);
      else if (!event.target.closest('.rd-tb')) vHideToolbar();
    }, 0);
  });

  document.addEventListener('keydown', (event) => {
    const typing = event.target.closest('input, textarea');
    if (typing) {
      if (event.target.matches('[data-v-ask]') && event.key === 'Enter') vSubmitMomentAsk(event.target.value);
      if (event.target.matches('[data-v-follow]') && event.key === 'Enter' && event.target.value.trim()) {
        const entry = V.entries.find((item) => item.id === event.target.dataset.vFollow);
        if (entry) vFollowUp(entry, event.target.value.trim());
      }
      if (
        event.target.closest('[data-v-tray]') &&
        event.key === 'Enter' &&
        (event.metaKey || event.ctrlKey) &&
        V.tray?.kind === 'note'
      )
        vSaveNote();
      if (event.key === 'Escape' && event.target.closest('[data-v-tray]')) vCloseComposer({ resume: true });
      return;
    }
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    const key = event.key.toLowerCase();
    if (key === ' ' || key === 'k') {
      event.preventDefault();
      vSetPlaying(!V.playing);
    }
    if (key === 'arrowleft' || key === 'j') vSeek(V.t - (key === 'j' ? 10 : 5));
    if (key === 'arrowright' || key === 'l') vSeek(V.t + (key === 'l' ? 10 : 5));
    if (isTeacher()) return;

    if (key === 'b') vBookmark();
    if (key === 'n') {
      event.preventDefault();
      vOpenComposer('note');
    }
    if (key === 'a' && S.ai) {
      event.preventDefault();
      vOpenComposer('ask');
    }
    if (key === 'c') vRunAction('cc');
    if (key === 't' && hasTranscript()) V.panel === 'transcript' ? vClosePanel() : vOpenPanel('transcript');
    if (key === 'escape') {
      vHideToolbar();
      if (V.tray) vCloseComposer();
      else if (V.panel) vClosePanel();
    }
  });
}

function vRunAction(action) {
  if (action === 'screen' || action === 'play') vSetPlaying(!V.playing);
  if (action === 'back') vSeek(V.t - 10);
  if (action === 'fwd') vSeek(V.t + 10);
  if (action === 'bookmark') vBookmark();
  if (action === 'note') vOpenComposer('note');
  if (action === 'ask') vOpenComposer('ask');
  if (action === 'tray-cancel') vCloseComposer({ resume: true });
  if (action === 'note-save') vSaveNote();
  if (action === 'ask-send') vSubmitMomentAsk($('[data-v-ask]').value);
  if (action === 'cc') {
    V.cc = !V.cc;
    $$('[data-v="cc"]').forEach((button) => button.setAttribute('aria-pressed', String(V.cc)));
    vUpdatePlayer();
  }
  if (action === 'rate') {
    const rates = [1, 1.25, 1.5, 2, 0.75];
    V.rate = rates[(rates.indexOf(V.rate) + 1) % rates.length];
    $('[data-v="rate"]').textContent = `${V.rate}×`;
  }
  if (action === 'theatre') {
    const on = !document.body.classList.contains('theatre');
    document.body.classList.toggle('theatre', on);
    $('[data-v="theatre"]').setAttribute('aria-pressed', String(on));
  }
  if (action === 'fullscreen') toast('Full screen keeps your markers and the B, N and A shortcuts');
  if (action === 'transcript') V.panel === 'transcript' ? vClosePanel() : vOpenPanel('transcript');
  if (action === 'notebook') V.panel === 'notebook' ? vClosePanel() : vOpenPanel('notebook');
  if (action === 'close-panel') vClosePanel();
  if (action === 'follow') {
    V.follow = !V.follow;
    vRenderPanel();
    if (V.follow) $('.tr-seg.active')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  if (action === 'nb-copy') {
    copyText(vNotebookMarkdown());
    toast(`Copied ${V.entries.length} items as Markdown`);
  }
  if (action === 'summarize') toast('Summarize uses the transcript and the lesson notes');
  if (action === 'draft-note') toast('Draft added to the lesson notes as a suggestion');
  if (action === 'chapter') toast('Chapter marker added at this time');
  if (action === 'all-questions') toast('Questions are listed without learner names');
}

/* ============================================================ proto panel */

function vRenderProto() {
  const wrap = document.createElement('div');
  wrap.className = 'proto';
  const link = (overrides) => {
    const next = new URLSearchParams(location.search);
    Object.entries(overrides).forEach(([key, value]) => (value === null ? next.delete(key) : next.set(key, value)));
    ['demo', 'open', 't'].forEach((key) => next.delete(key));
    return `?${next.toString()}`;
  };
  const row = (label, key, options, current) =>
    `<div class="proto-row"><span class="l">${label}</span><div class="proto-seg">${options
      .map(
        ([value, text]) =>
          `<button aria-pressed="${current === value}" onclick="location.search='${link({ [key]: value })}'">${text}</button>`
      )
      .join('')}</div></div>`;
  const isDark = document.documentElement.classList.contains('dark');
  wrap.innerHTML = `
    <div class="proto-panel" hidden>
      <h5>Video notebook prototype</h5>
      <p>${isTeacher() ? 'Teacher view: where learners pause, rewind and ask, aggregated.' : 'Press B to bookmark, N for a note, A to ask about the moment. Open Transcript and select some words.'}</p>
      ${row(
        'View',
        'view',
        [
          ['learner', 'Learner'],
          ['teacher', 'Teacher']
        ],
        S.view
      )}
      ${
        isTeacher()
          ? ''
          : row(
              'Learner',
              'state',
              [
                ['first', 'First visit'],
                ['returning', 'Returning']
              ],
              S.learner
            )
      }
      ${row(
        'Video source',
        'source',
        [
          ['upload', 'Upload'],
          ['youtube', 'YouTube'],
          ['drive', 'Drive']
        ],
        V.source
      )}
      ${
        isTeacher()
          ? ''
          : row(
              'Skipping ahead',
              'enforce',
              [
                ['0', 'Allowed'],
                ['1', 'Blocked']
              ],
              V.enforced ? '1' : '0'
            )
      }
      ${
        isTeacher()
          ? ''
          : row(
              'AI in this org',
              'ai',
              [
                ['on', 'On'],
                ['off', 'Off']
              ],
              S.ai ? 'on' : 'off'
            )
      }
      <div class="proto-row"><span class="l">App theme</span><div class="proto-seg"><button aria-pressed="${!isDark}" data-app-theme="light">Light</button><button aria-pressed="${isDark}" data-app-theme="dark">Dark</button></div></div>
      <div class="proto-links"><a href="index.html">← All screens</a><a href="#" data-reset>Reset saved data</a></div>
    </div>
    <button class="proto-toggle">${icon('flask')}Prototype</button>`;
  document.body.append(wrap);
  $('.proto-toggle', wrap).addEventListener(
    'click',
    () => ($('.proto-panel', wrap).hidden = !$('.proto-panel', wrap).hidden)
  );
  $$('[data-app-theme]', wrap).forEach((button) =>
    button.addEventListener('click', () => {
      const dark = button.dataset.appTheme === 'dark';
      document.documentElement.classList.toggle('dark', dark);
      localStorage.cioTheme = dark ? 'dark' : 'light';
      $$('[data-app-theme]', wrap).forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
    })
  );
  $('[data-reset]', wrap).addEventListener('click', (event) => {
    event.preventDefault();
    Object.keys(localStorage)
      .filter((key) => key.startsWith('lr:'))
      .forEach((key) => localStorage.removeItem(key));
    location.reload();
  });
}

/* ============================================================ demos */

function vSelectWords(segIndex, phrase) {
  const textEl = $(`.tr-seg[data-seg="${segIndex}"] .tx`);
  const node = textEl.firstChild;
  const at = node.textContent.indexOf(phrase);
  const range = document.createRange();
  range.setStart(node, at);
  range.setEnd(node, at + phrase.length);
  getSelection().removeAllRanges();
  getSelection().addRange(range);
  return vReadSelection();
}

function vRunDemo(kind) {
  if (kind === 'bookmark') {
    vSeek(203, { force: true });
    vBookmark();
  }
  if (kind === 'note') {
    vSeek(236, { force: true });
    vOpenComposer('note');
    $('[data-v-tray] textarea').value = 'agg takes a list of function names. Try it on the sales file.';
  }
  if (kind === 'ask') {
    vSeek(342, { force: true });
    vOpenComposer('ask');
    vSubmitMomentAsk('Why not just group by order_date?');
  }
  if (kind === 'select' || kind === 'explain') {
    vSeek(176, { force: true });
    vOpenPanel('transcript');
    setTimeout(() => {
      const row = $('.tr-seg[data-seg="14"]');
      row.scrollIntoView({ block: 'center' });
      setTimeout(() => {
        vSelection = vSelectWords(14, 'pass as_index equals False to groupby');
        if (kind === 'select') vShowToolbar(vSelection);
        else vTranscriptQuestion('explain');
      }, 120);
    }, 120);
  }
}

/* ============================================================ init */

function vInit() {
  vRenderPage();
  V.entries = isTeacher() ? [] : loadVideoEntries();
  vBindTracks();
  vBindEvents();
  vRenderMarkers();
  vRenderTray();
  vUpdateCounts();
  vUpdatePlayer();
  vRenderProto();
  requestAnimationFrame(vLoop);

  const open = params.get('open');
  if (open === 'transcript' || open === 'notebook') vOpenPanel(open);
  const demo = params.get('demo');
  if (demo) setTimeout(() => vRunDemo(demo), 300);
  else if (isReturning && !isTeacher() && knowsTime() && !params.has('silent'))
    setTimeout(() => toast(`Picked up where you left off at ${fmt(V.t)}`), 400);
}

vInit();
