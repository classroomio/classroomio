/*
 * tour.js — the product tour on the Courses page, as a spotlight with a glass tip.
 *
 * One step at a time: the page is dimmed except a cut-out around the real control, with a tip beside it.
 * The page stays clickable, so clicking the highlighted link (open a course, Landing Page, Audience)
 * counts as the step done. Done steps are kept under `cioTourState` and the tour resumes on Courses.
 */
(function () {
  const KEY = 'cioTourState';
  const POLL_MS = 250;
  const COMPACT_PX = 640;
  const PAD = 6;
  const GAP = 14;
  const MARGIN = 12;

  const STEPS = [
    {
      target: '#course-list',
      title: 'Explore your courses',
      body: 'Your starter courses live here. They stay as drafts until you publish them.'
    },
    {
      target: '#course-list .cx-list > :first-child, #course-list .cx-grid > :first-child',
      title: 'Open a course',
      body: 'Open the first course to see its lessons and edit them.',
      hint: 'Click the course to open it',
      advanceOnClick: true
    },
    {
      target: '.cx-templates',
      title: 'Create another course',
      body: 'Start from a blank course or pick a template from the gallery.'
    },
    {
      target: '[data-nav="Landing Page"]',
      title: 'Design your landing page',
      body: 'Choose a theme, edit the sections and see the preview change as you type.',
      hint: 'Click Landing Page to open the editor',
      advanceOnClick: true
    },
    {
      target: '[data-nav="Audience"]',
      title: 'Invite your learners',
      body: 'Add students and tutors, and see who has joined.',
      hint: 'Click Audience to open it',
      advanceOnClick: true
    },
    {
      target: '#view-portal',
      title: 'Preview your academy',
      body: 'Open your academy to see what learners see.',
      hint: 'Click Your Academy to preview it',
      advanceOnClick: true
    }
  ];

  function read() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) ?? null;
    } catch {
      return null;
    }
  }

  function write(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      return;
    }
  }

  function start() {
    write({ active: true, seen: [] });
  }

  function sampleTitles() {
    try {
      const saved = JSON.parse(localStorage.getItem('cioOnboardingState'));

      return (saved?.courses ?? []).filter((course) => course.origin !== 'blank').map((course) => course.title);
    } catch {
      return [];
    }
  }

  function welcome(state) {
    const titles = sampleTitles();
    const overlay = document.createElement('div');
    const list = titles.map((title) => `<li>${title.replace(/</g, '&lt;')}</li>`).join('');

    overlay.className = 'tour-welcome';
    overlay.innerHTML = `
      <div class="tour-welcome-card" role="dialog" aria-modal="true" aria-label="Welcome">
        <h3>Welcome to your workspace</h3>
        <p>${titles.length ? 'We added a few sample courses to get you started. Feel free to edit, publish or delete them.' : 'Your workspace is ready. Create a course whenever you like.'}</p>
        ${list ? `<ul>${list}</ul>` : ''}
        <div class="tour-btns">
          <button class="btn btn-ghost btn-sm" data-welcome="later">Later</button>
          <span class="tour-spacer"></span>
          <button class="btn btn-primary btn-sm" data-welcome="tour">Take the tour</button>
        </div>
      </div>`;
    overlay.addEventListener('click', (event) => {
      const action = event.target.closest('[data-welcome]')?.dataset.welcome;

      if (!action) return;

      overlay.remove();
      if (action === 'later') write({ active: false, seen: [] });
      else {
        write({ ...state, welcomed: true });
        init();
      }
    });
    document.body.append(overlay);
  }

  function init() {
    if (new URLSearchParams(window.location.search).get('tour') === '1') start();

    const state = read();

    if (!state?.active) return;

    if (!state.welcomed) {
      welcome(state);

      return;
    }

    state.seen = Array.isArray(state.seen) ? state.seen : [];

    const spot = document.createElement('div');
    const tip = document.createElement('div');
    let current = -1;
    let timer = 0;

    spot.className = 'tour-spot';
    tip.className = 'tour-pop';
    tip.setAttribute('role', 'dialog');
    tip.setAttribute('aria-label', 'Product tour');
    document.body.append(spot, tip);

    const visible = (element) => {
      const rect = element?.getBoundingClientRect();

      return Boolean(rect && rect.width > 0 && rect.height > 0);
    };
    const find = (index) => {
      const element = document.querySelector(STEPS[index].target);

      return visible(element) ? element : null;
    };
    const available = () => STEPS.map((step, index) => index).filter((index) => find(index));
    const isCompact = () => window.innerWidth <= COMPACT_PX;

    function end() {
      clearInterval(timer);
      write({ active: false, seen: state.seen });
      spot.remove();
      tip.remove();
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      document.removeEventListener('click', onDocumentClick, true);
      document.removeEventListener('keydown', onKey);
    }

    function markSeen(index) {
      if (!state.seen.includes(index)) state.seen.push(index);
      write(state);
      render();
    }

    function goBack() {
      const steps = available();
      const previous = [...steps].reverse().find((index) => index < current && state.seen.includes(index));

      if (previous === undefined) return;

      state.seen = state.seen.filter((index) => index < previous);
      write(state);
      render();
    }

    function fill(index, steps) {
      const step = STEPS[index];
      const position = steps.indexOf(index) + 1;
      const last = position === steps.length;

      tip.innerHTML = `
        <div class="tour-count">${position} of ${steps.length}</div>
        <h3>${step.title}</h3>
        <p>${step.body}</p>
        ${step.hint ? `<span class="tour-hint">${step.hint}</span>` : ''}
        <div class="tour-btns">
          <button class="btn btn-ghost btn-sm" data-tour="skip">Skip tour</button>
          <span class="tour-spacer"></span>
          ${position > 1 ? '<button class="btn btn-secondary btn-sm" data-tour="back">Back</button>' : ''}
          <button class="btn btn-primary btn-sm" data-tour="next">${last ? 'Done' : 'Next'}</button>
        </div>`;
    }

    function place() {
      const target = current >= 0 ? find(current) : null;

      if (!target) return;

      const rect = target.getBoundingClientRect();
      const top = Math.max(rect.top - PAD, 4);
      const bottom = Math.min(rect.bottom + PAD, window.innerHeight - 4);
      const left = Math.max(rect.left - PAD, 4);
      const right = Math.min(rect.right + PAD, window.innerWidth - 4);

      spot.style.top = `${top}px`;
      spot.style.left = `${left}px`;
      spot.style.width = `${Math.max(right - left, 0)}px`;
      spot.style.height = `${Math.max(bottom - top, 0)}px`;
      tip.classList.toggle('compact', isCompact());

      if (isCompact()) {
        tip.style.top = 'auto';
        tip.style.left = `${MARGIN}px`;
        tip.style.bottom = `${MARGIN}px`;

        return;
      }

      const tipHeight = tip.offsetHeight;
      const tipWidth = tip.offsetWidth;
      const roomBelow = window.innerHeight - bottom;
      const roomAbove = top;
      let y;

      if (roomBelow >= tipHeight + GAP + MARGIN) y = bottom + GAP;
      else if (roomAbove >= tipHeight + GAP + MARGIN) y = top - tipHeight - GAP;
      else y = window.innerHeight - tipHeight - MARGIN;

      const x = Math.min(Math.max(MARGIN, left), window.innerWidth - tipWidth - MARGIN);

      tip.style.bottom = 'auto';
      tip.style.left = `${x}px`;
      tip.style.top = `${Math.max(MARGIN, y)}px`;
    }

    function render() {
      const steps = available();
      const next = steps.find((index) => !state.seen.includes(index));

      if (next === undefined) {
        end();

        return;
      }

      if (next !== current) {
        current = next;
        fill(current, steps);
        find(current).scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }

      place();
    }

    function onDocumentClick(event) {
      if (tip.contains(event.target) || current < 0) return;

      if (STEPS[current].advanceOnClick && find(current)?.contains(event.target)) markSeen(current);
    }

    function onKey(event) {
      if (event.key === 'Escape') end();
    }

    tip.addEventListener('click', (event) => {
      const action = event.target.closest('[data-tour]')?.dataset.tour;

      if (action === 'next') markSeen(current);
      else if (action === 'back') goBack();
      else if (action === 'skip') end();
    });

    document.addEventListener('click', onDocumentClick, true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    timer = setInterval(render, POLL_MS);
    render();
  }

  window.tour = { start, init };
})();
