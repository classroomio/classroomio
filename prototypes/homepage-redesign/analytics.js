(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  const nav = document.getElementById('nav');
  const updateNav = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  const dropdowns = [...document.querySelectorAll('.dd')];
  const closeDropdowns = (except) => {
    dropdowns.forEach((dropdown) => {
      if (dropdown === except) return;

      dropdown.querySelector('.dd-btn').setAttribute('aria-expanded', 'false');
      dropdown.querySelector('.dd-menu').hidden = true;
    });
  };
  dropdowns.forEach((dropdown) => {
    const button = dropdown.querySelector('.dd-btn');
    const menu = dropdown.querySelector('.dd-menu');
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const willOpen = menu.hidden;
      closeDropdowns(dropdown);
      menu.hidden = !willOpen;
      button.setAttribute('aria-expanded', String(willOpen));
    });
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.dd')) closeDropdowns();
  });

  const onEnter = new Map();
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
        const callback = onEnter.get(entry.target);
        if (callback) callback();
      });
    },
    { threshold: 0.18, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('[data-rv]').forEach((element) => revealObserver.observe(element));

  /**
   * Animates the text of `element` from its current number to `target`.
   * @param {HTMLElement} element
   * @param {number} target
   * @param {number} duration
   */
  function countTo(element, target, duration = 900) {
    const suffix = element.dataset.suffix || '';
    const start = Number(element.dataset.current || 0);
    element.dataset.current = String(target);
    if (reduceMotion || duration === 0) {
      element.textContent = target.toLocaleString('en-US') + suffix;
      return;
    }

    const began = performance.now();
    const tick = (now) => {
      const progress = clamp((now - began) / duration, 0, 1);
      const value = Math.round(start + (target - start) * easeOut(progress));
      element.textContent = value.toLocaleString('en-US') + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- hero dashboard ---------- */
  const hero = document.getElementById('hero');
  const dash = document.getElementById('an-dash');
  requestAnimationFrame(() => hero.classList.add('in'));

  const ranges = {
    all: {
      loginLabel: 'Logged in today',
      login: 52,
      loginHint: '29% of the cohort',
      progress: 64,
      progressHint: '+6 this week',
      score: 71,
      scoreHint: 'Best attempt per exercise',
      completed: 38,
      completedHint: '21% · 31 certified',
      scores: [78, 74, 66, 72, 61, 70],
      spread: [9, 10, 12, 10, 13, 11]
    },
    7: {
      loginLabel: 'Logged in, last 7 days',
      login: 128,
      loginHint: '71% of the cohort',
      progress: 64,
      progressHint: '+3 in 7 days',
      score: 68,
      scoreHint: 'Attempts in the last 7 days',
      completed: 9,
      completedHint: 'in the last 7 days',
      scores: [74, 70, 61, 69, 57, 66],
      spread: [11, 12, 14, 12, 15, 12]
    },
    30: {
      loginLabel: 'Logged in, last 30 days',
      login: 161,
      loginHint: '89% of the cohort',
      progress: 64,
      progressHint: '+9 in 30 days',
      score: 70,
      scoreHint: 'Attempts in the last 30 days',
      completed: 24,
      completedHint: 'in the last 30 days',
      scores: [77, 73, 64, 71, 59, 69],
      spread: [10, 11, 13, 11, 14, 11]
    },
    90: {
      loginLabel: 'Logged in, last 90 days',
      login: 174,
      loginHint: '97% of the cohort',
      progress: 64,
      progressHint: '+22 in 90 days',
      score: 71,
      scoreHint: 'Attempts in the last 90 days',
      completed: 36,
      completedHint: 'in the last 90 days',
      scores: [78, 74, 66, 72, 60, 70],
      spread: [9, 10, 12, 10, 13, 11]
    }
  };

  const statuses = [
    { key: 'risk', label: 'At risk', value: 22, color: '#e5484d' },
    { key: 'lag', label: 'Lagging', value: 31, color: '#f0a020' },
    { key: 'ok', label: 'On track', value: 89, color: '#0542cc' },
    { key: 'done', label: 'Completed', value: 38, color: '#19a463' }
  ];
  const reasons = [
    { key: 'login', label: 'No login, 2+ days', value: 14 },
    { key: 'lowscore', label: 'Average score under 50%', value: 9 },
    { key: 'overdue', label: 'Overdue', value: 12 },
    { key: 'video', label: 'Video attendance under 60%', value: 17, color: '#f0a020' }
  ];

  const roster = [
    ['Amara Nwosu', 'av-a'],
    ['Tomi Bello', 'av-d'],
    ['Sofia Ruiz', 'av-f'],
    ['Jide Musa', 'av-b'],
    ['Chen Li', 'av-e'],
    ['Kemi Ade', 'av-c'],
    ['Ada Obi', 'av-expert']
  ];
  const drills = {
    overdue: {
      count: 12,
      label: 'Overdue',
      pill: 'risk',
      details: [
        'Goal: Finish module 2 · 3 days late',
        'Goal: Product quiz · 1 day late',
        'Setup checklist · 2 days late',
        'Required exercise · 5 days late',
        'Compliance course · due yesterday',
        'Goal: Finish module 1 · 6 days late',
        'Goal: Final task · 2 days late'
      ]
    },
    completed: {
      count: 38,
      label: 'Completed',
      pill: 'done',
      details: [
        'Finished · certificate issued',
        'Finished 2 days ago',
        'Finished · certificate issued',
        'Finished last week',
        'Finished · certificate issued',
        'Finished yesterday',
        'Finished · certificate issued'
      ]
    },
    risk: {
      count: 22,
      label: 'At risk',
      pill: 'risk',
      details: [
        'No login for 3 days',
        'Average score 44%',
        'Goal 1 day late',
        'No login yet',
        'Average score 47%',
        'No login for 6 days',
        'Goal 3 days late'
      ]
    },
    lag: {
      count: 31,
      label: 'Lagging',
      pill: 'lag',
      details: [
        'Average score 61%',
        'Video attendance 52%',
        'Average score 58%',
        'Video attendance 41%',
        'Average score 63%',
        'Video attendance 55%',
        'Average score 60%'
      ]
    },
    ok: {
      count: 89,
      label: 'On track',
      pill: 'ok',
      details: [
        'Progress 72% · score 84%',
        'Progress 66% · score 79%',
        'Progress 81% · score 91%',
        'Progress 58% · score 76%',
        'Progress 70% · score 88%',
        'Progress 63% · score 81%',
        'Progress 77% · score 86%'
      ]
    },
    done: {
      count: 38,
      label: 'Completed',
      pill: 'done',
      details: [
        'Finished · certificate issued',
        'Finished 2 days ago',
        'Finished · certificate issued',
        'Finished last week',
        'Finished · certificate issued',
        'Finished yesterday',
        'Finished · certificate issued'
      ]
    },
    login: {
      count: 14,
      label: 'No login, 2+ days',
      pill: 'risk',
      details: [
        'Last login 3 days ago',
        'Last login 4 days ago',
        'Never logged in',
        'Last login 6 days ago',
        'Last login 2 days ago',
        'Last login 9 days ago',
        'Last login 5 days ago'
      ]
    },
    lowscore: {
      count: 9,
      label: 'Average score under 50%',
      pill: 'risk',
      details: [
        'Average score 44%',
        'Average score 39%',
        'Average score 47%',
        'Average score 31%',
        'Average score 48%',
        'Average score 42%',
        'Average score 45%'
      ]
    },
    video: {
      count: 17,
      label: 'Video attendance under 60%',
      pill: 'lag',
      details: [
        'Video attendance 52%',
        'Video attendance 41%',
        'Video attendance 57%',
        'Video attendance 33%',
        'Video attendance 49%',
        'Video attendance 55%',
        'Video attendance 38%'
      ]
    }
  };
  const pillText = { risk: 'At risk', lag: 'Lagging', ok: 'On track', done: 'Completed' };

  const sheet = document.getElementById('dz-sheet');
  const sheetTitle = document.getElementById('dz-sheet-title');
  const sheetSub = document.getElementById('dz-sheet-sub');
  const peopleList = document.getElementById('dz-people');
  const hint = document.getElementById('an-hint');

  function openDrill(key) {
    const drill = drills[key];
    sheet.classList.remove('open');
    sheetTitle.textContent = `${drill.count} students`;
    sheetSub.textContent = drill.label;
    peopleList.innerHTML = '';
    roster.forEach(([name, avatar], index) => {
      const row = document.createElement('li');
      row.style.setProperty('--i', index);
      row.innerHTML = `<img src="images/${avatar}.jpg" alt=""><span><b>${name}</b><em>${drill.details[index]}</em></span><i class="pill ${drill.pill}">${pillText[drill.pill]}</i>`;
      peopleList.append(row);
    });
    const more = document.createElement('li');
    more.style.setProperty('--i', roster.length);
    more.innerHTML = `<span><em>and ${drill.count - roster.length} more</em></span>`;
    if (drill.count > roster.length) peopleList.append(more);
    void sheet.offsetWidth;
    sheet.classList.add('open');
    sheet.setAttribute('aria-hidden', 'false');
    hint.style.opacity = '0';
  }

  function closeDrill() {
    sheet.classList.remove('open');
    sheet.setAttribute('aria-hidden', 'true');
  }
  document.getElementById('dz-sheet-x').addEventListener('click', closeDrill);
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;

    closeDropdowns();
    closeDrill();
  });
  dash
    .querySelectorAll('[data-drill]')
    .forEach((element) => element.addEventListener('click', () => openDrill(element.dataset.drill)));

  const ring = document.getElementById('dz-ring');
  const legend = document.getElementById('dz-legend');
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const total = statuses.reduce((sum, status) => sum + status.value, 0);
  const segments = [];
  let cursor = 0;
  statuses.forEach((status) => {
    const length = (status.value / total) * circumference;
    const gap = 2.5;
    const segment = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    segment.setAttribute('cx', '60');
    segment.setAttribute('cy', '60');
    segment.setAttribute('r', String(radius));
    segment.setAttribute('class', 'dz-seg');
    segment.style.stroke = status.color;
    segment.style.strokeDasharray = `0 ${circumference}`;
    segment.style.strokeDashoffset = String(-cursor);
    segment.dataset.full = `${Math.max(length - gap, 0)} ${circumference}`;
    segment.addEventListener('click', () => openDrill(status.key));
    ring.append(segment);
    segments.push(segment);
    cursor += length;

    const item = document.createElement('li');
    item.innerHTML = `<i style="--c:${status.color}"></i>${status.label}<b>${status.value}</b>`;
    item.addEventListener('click', () => openDrill(status.key));
    const highlight = (on) => {
      segment.classList.toggle('hl', on);
      ring.classList.toggle('dim', on);
    };
    item.addEventListener('pointerenter', () => highlight(true));
    item.addEventListener('pointerleave', () => highlight(false));
    segment.addEventListener('pointerenter', () => highlight(true));
    segment.addEventListener('pointerleave', () => highlight(false));
    legend.append(item);
  });

  const barsList = document.getElementById('dz-bars');
  const maxReason = Math.max(...reasons.map((reason) => reason.value));
  const reasonBars = reasons.map((reason) => {
    const item = document.createElement('li');
    item.innerHTML = `<span class="lbl">${reason.label}<b>${reason.value}</b></span><span class="trk"><i style="--c:${reason.color || '#e5484d'}"></i></span>`;
    item.addEventListener('click', () => openDrill(reason.key));
    barsList.append(item);
    return { fill: item.querySelector('.trk i'), width: `${(reason.value / maxReason) * 100}%` };
  });

  const linePath = document.getElementById('dz-path');
  const bandPath = document.getElementById('dz-band');
  const dotsGroup = document.getElementById('dz-dots');
  const chartX = (index) => 12 + index * (376 / 5);
  const chartY = (value) => 140 - ((value - 30) / 70) * 130;
  let shownScores = ranges.all.scores.map(() => 50);
  let shownSpread = ranges.all.spread.map(() => 0);
  const dots = shownScores.map(() => {
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('r', '3.6');
    dotsGroup.append(dot);
    return dot;
  });

  function drawLine(scores, spread) {
    const points = scores.map((value, index) => [chartX(index), chartY(value)]);
    linePath.setAttribute(
      'd',
      points.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
    );
    const upper = scores.map(
      (value, index) => `${chartX(index).toFixed(1)} ${chartY(value + spread[index]).toFixed(1)}`
    );
    const lower = scores
      .map((value, index) => `${chartX(index).toFixed(1)} ${chartY(value - spread[index]).toFixed(1)}`)
      .reverse();
    bandPath.setAttribute('d', `M${upper.join(' L')} L${lower.join(' L')} Z`);
    dots.forEach((dot, index) => {
      dot.setAttribute('cx', points[index][0].toFixed(1));
      dot.setAttribute('cy', points[index][1].toFixed(1));
    });
  }

  function morphLine(targetScores, targetSpread) {
    const fromScores = shownScores.slice();
    const fromSpread = shownSpread.slice();
    if (reduceMotion) {
      shownScores = targetScores.slice();
      shownSpread = targetSpread.slice();
      drawLine(shownScores, shownSpread);
      return;
    }

    const began = performance.now();
    const tick = (now) => {
      const progress = easeOut(clamp((now - began) / 800, 0, 1));
      shownScores = fromScores.map((value, index) => value + (targetScores[index] - value) * progress);
      shownSpread = fromSpread.map((value, index) => value + (targetSpread[index] - value) * progress);
      drawLine(shownScores, shownSpread);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  drawLine(shownScores, shownSpread);

  const valueEl = (key) => dash.querySelector(`[data-v="${key}"]`);
  const hintEl = (key) => dash.querySelector(`[data-h="${key}"]`);
  const loginLabel = dash.querySelector('[data-k="login"]');

  function applyRange(key) {
    const data = ranges[key];
    dash
      .querySelectorAll('.dz-range button')
      .forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.range === key)));
    loginLabel.textContent = data.loginLabel;
    countTo(valueEl('login'), data.login);
    countTo(valueEl('progress'), data.progress);
    countTo(valueEl('score'), data.score);
    countTo(valueEl('overdue'), 12);
    countTo(valueEl('completed'), data.completed);
    hintEl('login').textContent = data.loginHint;
    hintEl('progress').textContent = data.progressHint;
    hintEl('progress').classList.add('up');
    hintEl('score').textContent = data.scoreHint;
    hintEl('completed').textContent = data.completedHint;
    morphLine(data.scores, data.spread);
  }
  dash
    .querySelectorAll('.dz-range button')
    .forEach((button) => button.addEventListener('click', () => applyRange(button.dataset.range)));

  function fillCharts() {
    segments.forEach((segment) => {
      segment.style.strokeDasharray = segment.dataset.full;
    });
    reasonBars.forEach((bar) => {
      bar.fill.style.setProperty('--w', bar.width);
    });
  }

  setTimeout(
    () => {
      applyRange('all');
      fillCharts();
    },
    reduceMotion ? 0 : 700
  );

  let tiltQueued = false;
  function updateTilt() {
    tiltQueued = false;
    const viewport = window.innerHeight || 1;
    const top = dash.getBoundingClientRect().top;
    const progress = reduceMotion ? 1 : clamp((viewport * 0.95 - top) / (viewport * 0.6), 0, 1);
    dash.style.setProperty('--tilt', `${(16 * (1 - progress)).toFixed(2)}deg`);
    dash.style.setProperty('--rise', `${(40 * (1 - progress)).toFixed(1)}px`);
    dash.style.setProperty('--sc', (0.96 + 0.04 * progress).toFixed(4));
  }
  window.addEventListener(
    'scroll',
    () => {
      if (tiltQueued) return;

      tiltQueued = true;
      requestAnimationFrame(updateTilt);
    },
    { passive: true }
  );
  window.addEventListener('resize', updateTilt);
  updateTilt();

  /* ---------- story ---------- */
  const stage = document.getElementById('st-stage');
  const steps = [...document.querySelectorAll('.st-step')];
  const sendButtons = [...stage.querySelectorAll('.st-send:not(.skip)')];
  const remindAll = stage.querySelector('.st-all-btn');
  const toast = stage.querySelector('.st-toast');
  let storyRun = 0;

  function resetReminders() {
    sendButtons.forEach((button) => {
      button.classList.remove('sent');
      button.textContent = 'Send reminder';
    });
    toast.classList.remove('show');
    remindAll.classList.remove('press');
  }

  async function playReminders(id) {
    await wait(900);
    for (const button of sendButtons) {
      if (id !== storyRun) return;

      button.classList.add('sent');
      button.textContent = 'Sent ✓';
      await wait(450);
    }
    if (id !== storyRun) return;

    remindAll.classList.add('press');
    await wait(220);
    remindAll.classList.remove('press');
    toast.classList.add('show');
  }

  function setStory(index) {
    if (Number(stage.dataset.state) === index && stage.classList.contains('is-playing')) return;

    storyRun += 1;
    steps.forEach((step, stepIndex) => step.classList.toggle('on', stepIndex === index));
    stage.dataset.state = String(index);
    stage.classList.remove('is-playing');
    resetReminders();
    void stage.offsetWidth;
    stage.classList.add('is-playing');
    if (index === 2) playReminders(storyRun);
  }

  const stepObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setStory(Number(entry.target.dataset.step));
      });
    },
    { rootMargin: window.matchMedia('(max-width: 860px)').matches ? '-60% 0px -18% 0px' : '-45% 0px -45% 0px' }
  );
  steps.forEach((step) => {
    stepObserver.observe(step);
    step.addEventListener('click', () => {
      setStory(Number(step.dataset.step));
      const behavior = reduceMotion ? 'auto' : 'smooth';
      if (!window.matchMedia('(max-width: 860px)').matches) {
        step.scrollIntoView({ behavior, block: 'center' });
        return;
      }

      const stepTop = step.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: stepTop - window.innerHeight * 0.62, behavior });
    });
  });
  const stageObserver = new IntersectionObserver((entries, observer) => {
    if (!entries[0].isIntersecting) return;

    observer.disconnect();
    if (!stage.classList.contains('is-playing')) setStory(0);
  });
  stageObserver.observe(stage);

  /* ---------- showcase ---------- */
  const dropBars = document.getElementById('sc-drop-bars');
  const dropNote = document.getElementById('sc-drop-note');
  const defaultNote = dropNote.textContent;
  const lessons = [100, 94, 88, 81, 52, 47, 44, 41];
  lessons.forEach((share, index) => {
    const color = share < 50 ? '#e5484d' : share < 75 ? '#f0a020' : '#0542cc';
    const bar = document.createElement('div');
    bar.className = 'sc-db';
    bar.style.setProperty('--h', `${share * 0.78}%`);
    bar.style.setProperty('--c', color);
    bar.style.setProperty('--i', index);
    bar.innerHTML = `<b>${share}% finished</b><i></i><span>L${index + 1}</span>`;
    bar.addEventListener('pointerenter', () => {
      const missing = Math.round(180 * (1 - share / 100));
      dropNote.textContent =
        share === 100
          ? `Lesson ${index + 1}: everyone has finished it.`
          : `Lesson ${index + 1}: ${missing} learners haven't finished it. Click the bar in ClassroomIO to see who.`;
    });
    bar.addEventListener('pointerleave', () => {
      dropNote.textContent = defaultNote;
    });
    dropBars.append(bar);
  });

  const academyTile = document.querySelector('.sc-academy');
  onEnter.set(academyTile, () => {
    academyTile
      .querySelectorAll('[data-count]')
      .forEach((element) => countTo(element, Number(element.dataset.count), 1400));
  });

  const stack = document.getElementById('sc-stack');
  const stackLabel = document.getElementById('sc-stack-l');
  const stackDefault = stackLabel.textContent;
  stack.querySelectorAll('i').forEach((part) => {
    part.addEventListener('pointerenter', () => {
      stack.classList.add('dim');
      part.classList.add('hl');
      stackLabel.textContent = part.dataset.label;
    });
    part.addEventListener('pointerleave', () => {
      stack.classList.remove('dim');
      part.classList.remove('hl');
      stackLabel.textContent = stackDefault;
    });
  });

  const answer = document.getElementById('sc-answer');
  const answerText =
    '12 learners are overdue. 9 of them have an overdue goal, like Amara Nwosu, who is 3 days late on Finish module 2. Want me to send them a reminder?';
  const aiTile = document.querySelector('.sc-ai');
  onEnter.set(aiTile, async () => {
    if (reduceMotion) {
      answer.textContent = answerText;
      return;
    }

    await wait(1100);
    for (const word of answerText.split(' ')) {
      answer.textContent += (answer.textContent ? ' ' : '') + word;
      await wait(55);
    }
  });
})();
