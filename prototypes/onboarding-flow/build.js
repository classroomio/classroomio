/*
 * build.js - stage 6, the builder: a chat pane beside a live preview, with the intro video playing over the
 * preview on arrival and docking to its corner when it ends.
 *
 * The conversation is scripted. A starter prompt, or any text, runs the same simulated build: the
 * agent narrates its steps, the preview fills in, and the closing cards point to connecting content,
 * adding features and publishing. No model is called and no course is saved.
 */

(function () {
  const P = window.proto;
  const S = P.loadState();

  if (!S.prepared || S.stage < 5) window.location.replace('flow.html');

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = P.escapeHtml;

  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const BRAND = P.brandNameOf(S);
  const SITE = S.siteName || P.slugify(BRAND) || 'your-academy';
  const INTRO_VIDEO_ID = '-nWB2wG8hOg';
  const INTRO_RETRY_MS = 1500;

  document.documentElement.style.cssText = P.brandVars(S.primary);

  const GRADED = ['Quiz', 'Assignment'];
  const BUILD_REQUEST = /^\s*(build|create|make|turn|plan|generate a course)\b/i;

  const STARTERS = [
    {
      label: 'New customer onboarding',
      prompt: `Build a new customer onboarding course for ${BRAND} that gets a customer to their first win, with a short quiz after the key lessons.`,
      title: `Getting started with ${BRAND}`,
      lessons: [
        ['Welcome and what you will achieve', 'Video', 4],
        ['Set up your account', 'Reading', 6],
        ['Your first project', 'Assignment', 12],
        ['Check your setup', 'Quiz', 5],
        ['Invite your team', 'Reading', 4],
        ['Where to get help', 'Reading', 3],
        ['Final knowledge check', 'Quiz', 6]
      ]
    },
    {
      label: 'Product training for support',
      prompt: `Build a product training course for the ${BRAND} support team that covers the core workflows, with a knowledge check at the end.`,
      title: `${BRAND} product training for support`,
      lessons: [
        ['How the product fits together', 'Video', 8],
        ['The five workflows customers ask about', 'Reading', 10],
        ['Reproduce a customer issue', 'Assignment', 15],
        ['Reading the logs', 'Video', 7],
        ['Escalation and handoff', 'Reading', 5],
        ['Knowledge check', 'Quiz', 8]
      ]
    },
    {
      label: 'Feature adoption mini-course',
      prompt: `Build a short feature adoption course for ${BRAND} that shows customers the three features they use least.`,
      title: `Get more from ${BRAND}`,
      lessons: [
        ['The three features worth five minutes', 'Video', 5],
        ['Feature one in practice', 'Reading', 4],
        ['Feature two in practice', 'Reading', 4],
        ['Feature three in practice', 'Reading', 4],
        ['Try them on your own data', 'Assignment', 10],
        ['Quick check', 'Quiz', 4]
      ]
    },
    {
      label: 'Compliance certification',
      prompt: `Build a compliance training course for ${BRAND} with a final assessment and a certificate.`,
      title: `${BRAND} compliance training`,
      lessons: [
        ['Why this training matters', 'Video', 5],
        ['The policies you need to know', 'Reading', 12],
        ['Handling sensitive data', 'Video', 9],
        ['Scenario review', 'Assignment', 12],
        ['Policy check', 'Quiz', 6],
        ['Final assessment', 'Quiz', 10]
      ]
    }
  ];

  const GENERIC_LESSONS = [
    ['Welcome and goals', 'Video', 4],
    ['The core ideas', 'Reading', 8],
    ['A walkthrough', 'Video', 9],
    ['Practice on your own', 'Assignment', 12],
    ['Knowledge check', 'Quiz', 6],
    ['Next steps', 'Reading', 3]
  ];

  const QUICK_ACTIONS = [
    { id: 'upload', label: 'Upload a document to create a course', prompt: 'Upload a document to create a course' },
    { id: 'draft', label: 'Draft a lesson', prompt: 'Draft a lesson' },
    {
      id: 'questions',
      label: 'Generate questions from this lesson',
      prompt: 'Generate questions from this lesson'
    },
    { id: 'summarize', label: 'Summarize this lesson', prompt: 'Summarize this lesson' },
    { id: 'publish', label: 'Help me publish this course', prompt: 'Help me publish this course' }
  ];

  const MODELS = [
    { id: 'kimi-k2.6', label: 'Kimi K2.6', high: false, locked: false },
    { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite', high: false, locked: false },
    { id: 'gpt-5.4-mini', label: 'GPT-5.4 Mini', high: false, locked: true },
    { id: 'claude-sonnet-3-5', label: 'Claude Sonnet 4.6', high: true, locked: true }
  ];

  const FOLLOW_UPS = {
    connect: ['Connect a website', 'Connect Google Drive', 'Browse integrations'],
    features: ['Add a certificate on completion', 'Add a quiz after each lesson', 'Add a drip schedule']
  };

  const THOUGHTS = [
    'Pondering the question',
    'Reading your brand settings',
    'Outlining the lessons',
    'Drafting lesson content',
    'Writing the quiz',
    'Hang tight, nearly there'
  ];

  const view = {
    working: false,
    course: null,
    features: [],
    courseId: '',
    coach: false,
    messages: [],
    history: [],
    model: 'gemini-3.1-flash-lite',
    attachment: ''
  };

  let run = null;
  let introPlayer = null;
  let introApi = null;
  let introRetry = 0;

  function commit() {
    P.saveState(S);
  }

  function sleep(ms) {
    return new Promise((resolve, reject) => {
      setTimeout(() => (run?.stopped ? reject(new Error('stopped')) : resolve()), REDUCED_MOTION ? ms * 0.2 : ms);
    });
  }

  function titleCase(text) {
    const trimmed = text.trim().replace(/[.!?]+$/, '');

    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }

  function courseFor(prompt) {
    const starter = STARTERS.find((item) => item.prompt === prompt);

    if (starter) return { title: starter.title, lessons: starter.lessons };

    const topic = titleCase(prompt.replace(/^(build|create|make|turn)\s+(me\s+)?(a|an|the)?\s*/i, '')).slice(0, 56);

    return { title: topic || `Your first ${BRAND} course`, lessons: GENERIC_LESSONS };
  }

  function totalMinutes(course) {
    return course.lessons.reduce((sum, lesson) => sum + lesson[2], 0);
  }

  /* ---------- chrome ---------- */
  function paintRail() {
    $('#rail').innerHTML = `
    <div class="rail-head"><span class="of">Step ${P.STAGES.length} of ${P.STAGES.length}</span><span class="now">Build</span></div>
    <div class="rail-segs">${P.STAGES.map(() => '<span class="rail-seg done"></span>').join('')}</div>`;
  }

  function conversationTitle() {
    return view.course && view.messages.length ? view.course.title : '';
  }

  function paintHead() {
    const title = conversationTitle();

    $('#head').innerHTML = `
    <div class="bd-ai-id">
      ${icon('sparkle', 18).replace('<svg', '<svg class="bd-ai-spark"')}
      <div>
        <h3>Assistant</h3>
        ${title ? `<span class="bd-ai-sub">${esc(title)}</span>` : ''}
      </div>
    </div>
    <div class="bd-ai-actions">
      <button class="bd-ai-btn" id="new-chat" aria-label="New chat" title="New chat" ${view.messages.length && !view.working ? '' : 'disabled'}>${icon('plus', 15)}</button>
      <div class="bd-ai-pop-host">
        <button class="bd-ai-btn" id="history" aria-label="Chat history" title="Chat history" aria-expanded="false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
        </button>
        <div class="bd-pop bd-history" id="history-pop" hidden></div>
      </div>
    </div>`;

    $('#new-chat').addEventListener('click', newChat);
    $('#history').addEventListener('click', toggleHistory);
  }

  function newChat() {
    if (!view.messages.length || view.working) return;

    view.history.unshift({ title: conversationTitle() || 'New conversation', messages: view.messages });
    view.messages = [];
    view.attachment = '';
    paintHead();
    paintPane();
    paintComposer();
  }

  function toggleHistory() {
    const pop = $('#history-pop');
    const open = pop.hidden;

    pop.hidden = !open;
    $('#history').setAttribute('aria-expanded', String(open));
    if (!open) return;

    pop.innerHTML = view.history.length
      ? view.history
          .map(
            (item, index) =>
              `<button class="bd-pop-item" data-history="${index}"><span>${esc(item.title)}</span></button>`
          )
          .join('')
      : '<p class="bd-pop-empty">No previous chats yet.</p>';

    $$('[data-history]', pop).forEach((button) =>
      button.addEventListener('click', () => {
        const [item] = view.history.splice(Number(button.dataset.history), 1);

        if (view.messages.length)
          view.history.unshift({ title: conversationTitle() || 'New conversation', messages: view.messages });
        view.messages = item.messages;
        pop.hidden = true;
        paintHead();
        paintPane();
      })
    );
  }

  function paintUrl() {
    const path = view.course ? `/course/${P.slugify(view.course.title)}` : '';

    $('#url').innerHTML = `https://<b>${esc(SITE)}</b>.classroomio.com${esc(path)}`;
  }

  function paintCoach() {
    const host = $('#coach');

    host.hidden = !view.coach;
    if (!view.coach) return;

    host.innerHTML = `
    <div>When you're ready, click Publish. Share the course with your learners and control who has access.</div>
    <button id="coach-ok">Got it</button>`;
    $('#coach-ok').addEventListener('click', () => {
      view.coach = false;
      paintCoach();
    });
  }

  /* ---------- chat pane ---------- */
  function paintPane() {
    paintFeed();
  }

  function paintFeed() {
    const pane = $('#pane');

    if (!view.messages.length && !view.working) {
      pane.innerHTML = `
      <div class="bd-ai-empty m-rise">
        <div class="bd-ai-empty-text">
          ${icon('sparkle', 32).replace('<svg', '<svg class="bd-ai-empty-icon"')}
          <p>Ask me to help with your course content — draft lessons, generate questions, or plan a course from a document.</p>
        </div>
        ${
          view.course
            ? ''
            : `<button class="bd-default" id="default-prompt">
          <span class="bd-default-tag">${icon('rocket', 13)}Suggested for you</span>
          <b>${esc(STARTERS[0].label)}</b>
          <span class="bd-default-text">${esc(STARTERS[0].prompt)}</span>
          <span class="bd-default-go">Use this prompt${icon('chevron', 14)}</span>
        </button>`
        }
        <div class="bd-ai-chips">
          ${QUICK_ACTIONS.map((action) => `<button class="bd-ai-chip" data-quick="${action.id}">${esc(action.label)}</button>`).join('')}
        </div>
      </div>`;
      $('#default-prompt')?.addEventListener('click', () => send(STARTERS[0].prompt));
      $$('[data-quick]').forEach((button) =>
        button.addEventListener('click', () => {
          const action = QUICK_ACTIONS.find((item) => item.id === button.dataset.quick);

          if (action.id === 'upload') {
            $('#attach-input').click();
            return;
          }

          send(action.prompt);
        })
      );
      return;
    }

    pane.innerHTML = '<div id="feed"></div><div id="status"></div>';
    view.messages.forEach((html) => $('#feed').insertAdjacentHTML('beforeend', html));
    wireFeed();
    pane.scrollTop = pane.scrollHeight;
  }

  function wireFeed() {
    $$('[data-suggest]', $('#feed')).forEach((button) => {
      if (button.dataset.wired) return;

      button.dataset.wired = '1';
      button.addEventListener('click', () => setComposer(button.dataset.suggest));
    });

    $$('[data-send]', $('#feed')).forEach((button) => {
      if (button.dataset.wired) return;

      button.dataset.wired = '1';
      button.addEventListener('click', () => send(button.dataset.send));
    });
  }

  function pushMessage(html) {
    view.messages.push(html);

    const feed = $('#feed');
    if (!feed) return;

    feed.insertAdjacentHTML('beforeend', html);
    wireFeed();
    $('#pane').scrollTop = $('#pane').scrollHeight;
  }

  function replaceLastMessage(html) {
    view.messages[view.messages.length - 1] = html;

    const feed = $('#feed');
    if (!feed) return;

    feed.lastElementChild.outerHTML = html;
    wireFeed();
  }

  /* ---------- composer ---------- */
  function currentModel() {
    return MODELS.find((model) => model.id === view.model);
  }

  function costHTML(model) {
    return model.high ? '<span class="bd-cost high">$$$</span>' : '<span class="bd-cost">$</span>';
  }

  function paintComposer() {
    const draft = $('#prompt')?.value ?? '';
    const model = currentModel();

    $('#composer').innerHTML = `
    <div class="bd-mention" id="mention" hidden></div>
    <div class="bd-pop bd-models" id="model-pop" hidden>
      ${MODELS.map(
        (item) => `
        <button class="bd-pop-item" data-model="${item.id}">
          <span>${esc(item.label)}${item.locked ? icon('rocket', 14).replace('<svg', '<svg class="bd-lock"') : ''}</span>
          <span class="bd-pop-end">${costHTML(item)}${item.id === view.model ? icon('check', 13).replace('<svg', '<svg class="bd-tick"') : ''}</span>
        </button>`
      ).join('')}
    </div>
    ${view.attachment ? `<div class="bd-attached">${icon('book', 13)}<span>${esc(view.attachment)}</span><button id="detach" aria-label="Remove document">${icon('x', 12)}</button></div>` : ''}
    <textarea id="prompt" rows="2" placeholder="Ask the AI assistant..." aria-label="Message" ${view.working ? 'disabled' : ''}>${esc(draft)}</textarea>
    <div class="bd-tools">
      <button class="bd-tool" id="attach" aria-label="Attach a document (PDF, DOCX, PPTX, ODT)" title="Attach a document (PDF, DOCX, PPTX, ODT)" ${view.working ? 'disabled' : ''}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><path d="m21.4 11.1-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/></svg>
      </button>
      <span class="bd-grow"></span>
      ${
        view.working
          ? `<button class="bd-stop" id="stop" aria-label="Stop"><svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg></button>`
          : `<button class="bd-model" id="model" aria-expanded="false" aria-label="Choose model"><span>${esc(model.label)}</span>${costHTML(model)}${icon('chevdown', 12)}</button>`
      }
    </div>`;

    wireComposer();
  }

  const MENTION = { open: false, index: 0 };

  function mentionItems() {
    const saved = view.courseId ? savedCourse() : null;

    return saved
      ? saved.sections.flatMap((section) =>
          section.lessons.map((lesson) => ({
            id: lesson.id,
            label: lesson.title,
            type: lesson.kind === 'exercise' ? 'Exercise' : 'Lesson'
          }))
        )
      : [];
  }

  function mentionQuery(textarea) {
    const before = textarea.value.slice(0, textarea.selectionStart);
    const match = before.match(/@([^@\n]*)$/);

    return match ? match[1].toLowerCase() : null;
  }

  function mentionMatches(textarea) {
    const query = mentionQuery(textarea);

    return query === null ? [] : mentionItems().filter((item) => item.label.toLowerCase().includes(query));
  }

  function paintMention(textarea) {
    const host = $('#mention');
    const matches = mentionMatches(textarea);

    MENTION.open = matches.length > 0;
    host.hidden = !MENTION.open;
    if (!MENTION.open) return;

    MENTION.index = Math.min(MENTION.index, matches.length - 1);
    host.innerHTML = matches
      .map(
        (item, index) =>
          `<button class="bd-opt" data-mention="${item.id}" aria-selected="${index === MENTION.index}">${icon(item.type === 'Exercise' ? 'award' : 'book', 14)}<span>${esc(item.label)}</span><em>${item.type}</em></button>`
      )
      .join('');

    $$('[data-mention]', host).forEach((button) =>
      button.addEventListener('mousedown', (event) => {
        event.preventDefault();
        applyMention(
          textarea,
          matches.find((item) => item.id === button.dataset.mention)
        );
      })
    );
  }

  function applyMention(textarea, item) {
    const caret = textarea.selectionStart;
    const before = textarea.value.slice(0, caret).replace(/@[^@\n]*$/, `@${item.label} `);

    textarea.value = before + textarea.value.slice(caret);
    textarea.setSelectionRange(before.length, before.length);
    textarea.focus();
    paintMention(textarea);
  }

  function closeModelPop() {
    const pop = $('#model-pop');

    if (pop) pop.hidden = true;
    $('#model')?.setAttribute('aria-expanded', 'false');
  }

  function wireComposer() {
    const textarea = $('#prompt');

    textarea.addEventListener('input', () => {
      MENTION.index = 0;
      paintMention(textarea);
    });

    textarea.addEventListener('keydown', (event) => {
      if (MENTION.open && ['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(event.key)) {
        const matches = mentionMatches(textarea);

        event.preventDefault();
        if (event.key === 'Escape') {
          MENTION.open = false;
          $('#mention').hidden = true;
        } else if (event.key === 'Enter') {
          applyMention(textarea, matches[MENTION.index]);
        } else {
          MENTION.index = (MENTION.index + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length;
          paintMention(textarea);
        }
        return;
      }

      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        submit();
      }
    });

    $('#attach').addEventListener('click', () => $('#attach-input').click());
    $('#detach')?.addEventListener('click', () => {
      view.attachment = '';
      paintComposer();
    });
    $('#stop')?.addEventListener('click', stop);

    $('#model')?.addEventListener('click', () => {
      const pop = $('#model-pop');
      const open = pop.hidden;

      pop.hidden = !open;
      $('#model').setAttribute('aria-expanded', String(open));
    });

    $$('[data-model]').forEach((button) =>
      button.addEventListener('click', () => {
        const model = MODELS.find((item) => item.id === button.dataset.model);

        if (model.locked) {
          closeModelPop();
          P.toast(`${model.label} is on paid plans. Upgrade to use it (simulated).`);
          return;
        }

        view.model = model.id;
        paintComposer();
      })
    );
  }

  function setComposer(text) {
    const textarea = $('#prompt');

    textarea.value = text;
    textarea.focus();
    textarea.setSelectionRange(text.length, text.length);
  }

  function submit() {
    const textarea = $('#prompt');
    const text = textarea.value.trim();

    if ((!text && !view.attachment) || view.working) return;

    textarea.value = '';
    send(text || `Build a course from ${view.attachment}`);
  }

  function onAttach(event) {
    const file = event.target.files?.[0];

    event.target.value = '';
    if (!file) return;

    view.attachment = file.name;
    paintComposer();
    $('#prompt').focus();
    if (!view.course && !$('#prompt').value) setComposer(`Build a course from ${file.name}`);
  }

  /* ---------- the scripted build ---------- */
  function statusHTML(text) {
    return `<p class="bd-status"><span class="bd-mark run"></span><span>${esc(text)}…</span></p>`;
  }

  function startStatus() {
    let index = 0;

    const paint = () => {
      const host = $('#status');
      if (host) host.innerHTML = statusHTML(THOUGHTS[index % THOUGHTS.length]);
      index += 1;
    };

    paint();

    return setInterval(paint, REDUCED_MOTION ? 400 : 1900);
  }

  function rowHTML(title, bodyHTML) {
    return `
    <details class="bd-row">
      <summary>${icon('check', 13)}<span>${esc(title)}</span>${icon('chevdown', 13).replace('<svg', '<svg class="bd-chev"')}</summary>
      <div class="bd-row-body">${bodyHTML}</div>
    </details>`;
  }

  function editsHTML(items) {
    return `
    <div class="bd-edits">
      <header><h4>Building your course</h4><p>${items.filter((item) => item.done).length} of ${items.length} steps complete</p></header>
      ${items
        .map(
          (item) => `
        <div class="bd-edit">
          <span class="bd-mark${item.done ? '' : ' run'}">${item.done ? icon('check', 10) : ''}</span>
          <div><b>${esc(item.name)}</b><span>${esc(item.note)}</span></div>
        </div>`
        )
        .join('')}
    </div>`;
  }

  function setWorking(on) {
    view.working = on;
    $('#publish').disabled = on || !view.course;
    paintComposer();
    if (!on && $('#status')) $('#status').innerHTML = '';
  }

  async function send(text) {
    if (view.working) return;

    const first = !view.messages.length;
    const course = courseFor(text);
    const attached = view.attachment;

    if (first) {
      $('#pane').innerHTML = '<div id="feed"></div><div id="status"></div>';
    }

    view.attachment = '';
    pushMessage(
      `<div class="bd-msg user"><p>${esc(text)}</p>${attached ? `<span class="bd-msg-file">${icon('book', 12)}${esc(attached)}</span>` : ''}</div>`
    );
    paintHead();
    run = { stopped: false };
    setWorking(true);

    if (view.course) {
      await runFollowUp(text);
      return;
    }

    if (!BUILD_REQUEST.test(text) && !attached) {
      await runNoCourse();
      return;
    }

    await runBuild(course);
  }

  function stop() {
    if (!run) return;

    run.stopped = true;
  }

  async function guarded(task) {
    const ticker = startStatus();

    try {
      await task();
    } catch (error) {
      if (error.message !== 'stopped') throw error;

      pushMessage(
        '<div class="bd-msg"><p>Stopped. Nothing was changed. Send another message when you are ready.</p></div>'
      );
      paintCanvas();
    } finally {
      clearInterval(ticker);
      setWorking(false);
    }
  }

  function runNoCourse() {
    return guarded(async () => {
      await sleep(1100);

      pushMessage(`
      <div class="bd-msg">
        <p>There is no course in this workspace yet, so I have nothing to work on. Tell me what to build, or start from the suggested prompt.</p>
        <div class="bd-ask"><button class="btn btn-primary btn-sm" data-send="${esc(STARTERS[0].prompt)}">Build ${esc(STARTERS[0].label.toLowerCase())}</button></div>
      </div>`);
    });
  }

  function runBuild(course) {
    return guarded(async () => {
      paintCanvas('building');

      pushMessage(
        `<div class="bd-msg"><p>I'll use starter content so you can see it working. Connect your own material after.</p></div>`
      );
      await sleep(1300);

      pushMessage(
        rowHTML(
          'Thought for 4 seconds',
          '<p>The brief names a single audience, so one course with a short outline is enough. I will keep lessons under ten minutes and put the graded items where a learner needs a checkpoint.</p>'
        )
      );
      await sleep(1500);

      pushMessage(
        rowHTML(
          'Read workspace · 3 items',
          `<ul><li>Brand colour ${esc(S.primary)}</li><li>${esc(P.themeById(S.theme).title)} landing page theme</li><li>${S.courses.length} starter ${S.courses.length === 1 ? 'course' : 'courses'}</li></ul>`
        )
      );
      await sleep(1400);

      pushMessage('<div class="bd-msg"><p>Now I\'ll build the course: outline, lessons, then the checks.</p></div>');
      await sleep(1000);

      const graded = course.lessons.filter((lesson) => GRADED.includes(lesson[1])).length;
      const edits = [
        { name: 'outline.md', note: `Course outline with ${course.lessons.length} lessons`, done: false },
        { name: 'lessons/', note: `${course.lessons.length - graded} lesson drafts in your brand voice`, done: false },
        {
          name: 'checks/',
          note: `${graded} graded ${graded === 1 ? 'item' : 'items'} placed after the key lessons`,
          done: false
        }
      ];

      pushMessage(editsHTML([edits[0]]));
      await sleep(1700);
      edits[0].done = true;
      replaceLastMessage(editsHTML(edits.slice(0, 1)));
      await sleep(500);

      replaceLastMessage(editsHTML([edits[0], edits[1]]));
      await sleep(1900);
      edits[1].done = true;
      replaceLastMessage(editsHTML([edits[0], edits[1]]));
      await sleep(500);

      replaceLastMessage(editsHTML(edits));
      await sleep(1700);
      edits[2].done = true;
      replaceLastMessage(editsHTML(edits));
      await sleep(600);

      view.course = course;
      saveCourse(course);
      paintHead();
      paintUrl();
      paintCanvas();

      pushMessage(`
      <div class="bd-msg">
        <p>Your first course is ready. <b>${esc(course.title)}</b> has ${course.lessons.length} lessons across two sections. This is the course page your learners will see.</p>
        <p>It is filled with starter content, so edit it or connect your own material below.</p>
      </div>`);
      pushMessage(rowHTML('Saving draft', '<p>Saved as a draft. Learners cannot see it until you publish.</p>'));
      pushMessage(suggestionCard('Connect your content', FOLLOW_UPS.connect));
      pushMessage(suggestionCard('Add features', FOLLOW_UPS.features));

      view.coach = true;
      paintCoach();
    });
  }

  function suggestionCard(heading, options) {
    return `
    <div class="bd-card">
      <h4>${esc(heading)}</h4>
      <div class="bd-opts">
        ${options.map((option) => `<button class="bd-opt" data-suggest="${esc(option)}">${esc(option)}</button>`).join('')}
      </div>
    </div>`;
  }

  function featureLabel(text) {
    if (/certificate/i.test(text)) return 'Certificate on completion';
    if (/quiz/i.test(text)) return 'Quiz after every lesson';
    if (/drip|schedule/i.test(text)) return 'Weekly drip schedule';

    return '';
  }

  function applyFeature(label) {
    const saved = savedCourse();

    if (/certificate/i.test(label)) saved.certificate = { enabled: true, isDownloadable: true, threshold: 70 };

    if (/quiz/i.test(label)) {
      saved.sections.forEach((section) => {
        const checkId = `${section.id}-check`;

        if (section.lessons.some((item) => item.id === checkId)) return;

        section.lessons.push({
          id: checkId,
          kind: 'exercise',
          title: 'Quick check',
          html: '',
          published: true,
          questions: [],
          sections: [],
          completionPolicy: 'submitted'
        });
      });
    }

    commit();
    reloadPreview();
  }

  function followUpReply(text) {
    if (/publish/i.test(text)) {
      view.coach = true;
      paintCoach();

      return 'Your draft is ready to go live. Click <b>Publish</b> at the top right of the preview, then share the link with your learners.';
    }

    if (/question|quiz/i.test(text))
      return 'I would write questions from the lesson you have open. Open a lesson from the preview, then ask again. (Simulated)';

    if (/summar/i.test(text))
      return 'I would summarise the lesson you have open in a few lines. Open a lesson from the preview, then ask again. (Simulated)';

    if (/draft/i.test(text))
      return 'I would draft the lesson in your brand voice and add it to the right section. (Simulated in this prototype.)';

    return 'Noted. In a real build I would apply that to the draft. This prototype only simulates the first build and a few add-ons.';
  }

  function runFollowUp(text) {
    return guarded(async () => {
      await sleep(1200);

      pushMessage(
        rowHTML(
          'Thought for 2 seconds',
          '<p>This is a small change to the existing draft, so I will edit the course in place.</p>'
        )
      );
      await sleep(1400);

      const label = featureLabel(text);

      if (label && !view.features.includes(label)) {
        view.features.push(label);
        applyFeature(label);
      }

      pushMessage(
        `<div class="bd-msg"><p>${
          label ? `Done. I added <b>${esc(label)}</b> to the draft.` : followUpReply(text)
        }</p></div>`
      );
    });
  }

  /* ---------- preview canvas ---------- */
  function sectionsFor(course) {
    const split = Math.ceil(course.lessons.length / 2);
    const groups = [
      ['Getting started', course.lessons.slice(0, split)],
      ['Put it into practice', course.lessons.slice(split)]
    ].filter(([, items]) => items.length);

    return groups.map(([title, items], sectionIndex) => ({
      id: `${view.courseId}-s${sectionIndex + 1}`,
      title,
      lessons: items.map(([lessonTitle, kind], itemIndex) => ({
        id: `${view.courseId}-s${sectionIndex + 1}-l${itemIndex + 1}`,
        kind: GRADED.includes(kind) ? 'exercise' : 'lesson',
        title: lessonTitle,
        html: '',
        published: true,
        ...(GRADED.includes(kind) ? { questions: [], sections: [], completionPolicy: 'submitted' } : {})
      }))
    }));
  }

  function saveCourse(course) {
    const saved = window.model.createCourse(S, {
      title: course.title,
      desc: `${course.lessons.length} short lessons, about ${totalMinutes(course)} minutes in total.`,
      origin: 'ai'
    });

    view.courseId = saved.id;
    saved.sections = sectionsFor(course);
    commit();
  }

  function savedCourse() {
    return window.model.findCourse(S, view.courseId);
  }

  function previewUrl() {
    return `${window.model.R.publicCourse(view.courseId)}&preview=1`;
  }

  function reloadPreview() {
    const frame = $('#preview-frame');

    if (frame) frame.src = previewUrl();
  }

  function paintCanvas(state) {
    const canvas = $('#canvas');

    canvas.classList.toggle('built', Boolean(view.course) && state !== 'building');

    if (state === 'building') {
      canvas.innerHTML = '<div class="machine-host" id="loader" style="height:100%"></div>';
      window.visuals.mount(
        $('#loader'),
        window.visuals.blockLoader({ label: 'Lesson and quiz blocks stacking into your first course' })
      );
      return;
    }

    if (!view.course) {
      canvas.innerHTML = '<div class="bd-idle"><p>Your course will appear here as soon as you ask for it.</p></div>';
      return;
    }

    canvas.innerHTML = `<iframe class="bd-frame" id="preview-frame" title="Course page preview" src="${previewUrl()}"></iframe>`;
  }

  /* ---------- modals ---------- */
  function closeModal() {
    $('#modal-host').innerHTML = '';
    document.removeEventListener('keydown', onModalKey);
  }

  function onModalKey(event) {
    if (event.key === 'Escape') closeModal();
  }

  function mountScrim(html) {
    $('#modal-host').innerHTML = `<div class="scrim" id="scrim">${html}</div>`;
    $('#scrim').addEventListener('click', (event) => {
      if (event.target.id === 'scrim') closeModal();
    });
    document.addEventListener('keydown', onModalKey);
  }

  /* ---------- intro video ---------- */
  function loadYouTubeApi() {
    if (window.YT?.Player) return Promise.resolve(window.YT);

    introApi ??= new Promise((resolve) => {
      window.onYouTubeIframeAPIReady = () => resolve(window.YT);
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    });

    return introApi;
  }

  /** Moves the intro card between the centre of the preview ("stage") and the corner ("dock"), animating from where it was. */
  function placeIntro(state) {
    const card = $('#intro');
    const before = card.hidden ? null : card.getBoundingClientRect();

    card.hidden = false;
    card.dataset.state = state;
    $('#intro-scrim').hidden = state !== 'stage';
    $('#intro-dock').hidden = state !== 'stage';

    if (!before || REDUCED_MOTION) return;

    const after = card.getBoundingClientRect();
    const offsetX = before.left - after.left;
    const offsetY = before.top - after.top;
    const scale = before.width / after.width;

    card.animate(
      [
        { transformOrigin: 'top left', transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})` },
        { transformOrigin: 'top left', transform: 'none' }
      ],
      { duration: 460, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
    );
  }

  function dockIntro() {
    if ($('#intro').dataset.state === 'stage') placeIntro('dock');
  }

  function closeIntro() {
    introPlayer?.stopVideo();
    $('#intro').hidden = true;
    $('#intro-scrim').hidden = true;
  }

  function onIntroKey(event) {
    if (event.key === 'Escape' && !$('#intro').hidden) dockIntro();
  }

  /**
   * Browsers only autoplay muted video, so the player always starts muted, which plays at once, and then turns the
   * sound on when the page has had a click or key press (every visitor here has, by the time they reach the builder).
   */
  function startIntro() {
    introPlayer.mute();
    introPlayer.playVideo();
    clearTimeout(introRetry);
    introRetry = setTimeout(() => {
      if (introPlayer.getPlayerState() !== window.YT.PlayerState.PLAYING) introPlayer.playVideo();
    }, INTRO_RETRY_MS);
  }

  function enableIntroSound() {
    if (!navigator.userActivation?.hasBeenActive) {
      paintSoundButton();
      return;
    }

    introPlayer.unMute();
    introPlayer.setVolume(100);
    setTimeout(() => {
      if (introPlayer.getPlayerState() !== window.YT.PlayerState.PLAYING) {
        introPlayer.mute();
        introPlayer.playVideo();
      }

      paintSoundButton();
    }, 400);
  }

  function paintSoundButton() {
    const button = $('#intro-sound');
    const muted = introPlayer?.isMuted?.() ?? true;

    button.hidden = !muted;
  }

  async function openIntro() {
    placeIntro('stage');

    if (introPlayer) {
      introPlayer.seekTo(0, true);
      startIntro();
      enableIntroSound();
      return;
    }

    const YT = await loadYouTubeApi();

    introPlayer = new YT.Player('intro-yt', {
      videoId: INTRO_VIDEO_ID,
      host: 'https://www.youtube-nocookie.com',
      playerVars: { autoplay: 1, mute: 1, rel: 0, playsinline: 1, cc_load_policy: 1, origin: window.location.origin },
      events: {
        onReady: () => {
          startIntro();
          enableIntroSound();
        },
        onStateChange: (event) => {
          if (event.data === YT.PlayerState.ENDED) dockIntro();
        }
      }
    });
  }

  /* ---------- publish ---------- */
  function openPublish() {
    mountScrim(`
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="pub-title">
      <h3 id="pub-title">Publish your academy</h3>
      <p>${esc(view.course.title)} goes live at <b>${esc(SITE)}.classroomio.com</b>.</p>
      <div class="field" style="margin-top:16px">
        <label class="label" for="pub-access">Who can enrol</label>
        <select class="input" id="pub-access">
          <option>Anyone with the link</option>
          <option>Invited learners only</option>
        </select>
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" data-close>Not yet</button>
        <button class="btn btn-primary" id="pub-go">Publish</button>
      </div>
    </div>`);

    $('[data-close]').addEventListener('click', closeModal);
    $('#pub-go').addEventListener('click', () => {
      window.model.setPublished(S, view.courseId, true);
      commit();
      closeModal();
      P.toast('Published (simulated). Taking you to your courses.');
      setTimeout(goToCourses, REDUCED_MOTION ? 200 : 1100);
    });
    $('#pub-go').focus();
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
      /* the tour is optional */
    }
    window.location.href = window.model.R.courses();
  }

  function wire() {
    P.initTheme();

    $('#publish').addEventListener('click', openPublish);
    $('#attach-input').addEventListener('change', onAttach);
    document.addEventListener('click', (event) => {
      if (!event.target.closest('#model, #model-pop')) closeModelPop();
      if (!event.target.closest('#history, #history-pop')) $('#history-pop').hidden = true;
    });
    $('#watch-intro').addEventListener('click', openIntro);
    $('#intro-dock').addEventListener('click', dockIntro);
    $('#intro-close').addEventListener('click', closeIntro);
    $('#intro-sound').addEventListener('click', () => {
      introPlayer.unMute();
      introPlayer.setVolume(100);
      paintSoundButton();
    });
    $('#intro-scrim').addEventListener('click', dockIntro);
    document.addEventListener('keydown', onIntroKey);
    $('#skip').addEventListener('click', goToCourses);
    $('#back').addEventListener('click', () => {
      window.location.href = 'customize.html';
    });
  }

  paintRail();
  paintHead();
  paintUrl();
  paintPane();
  paintComposer();
  paintCanvas();
  wire();
  openIntro();
})();
