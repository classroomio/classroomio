(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function splitWords(heading) {
    let wordIndex = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const fragment = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;

            if (/^\s+$/.test(part)) {
              fragment.append(part);
              return;
            }

            const word = document.createElement('span');
            word.className = 'ag-word';
            word.style.setProperty('--w', wordIndex++);
            word.textContent = part;
            fragment.append(word);
          });
          child.replaceWith(fragment);
          return;
        }

        walk(child);
      });
    };
    walk(heading);
  }

  document.querySelectorAll('[data-words]').forEach(splitWords);

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
  document.querySelectorAll('[data-rv], [data-words]').forEach((element) => revealObserver.observe(element));

  function whenVisible(element, callback) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;

        observer.disconnect();
        callback();
      },
      { threshold: 0.3 }
    );
    observer.observe(element);
  }

  const hero = document.getElementById('hero');
  if (hero) {
    const toggle = hero.querySelector('.ag-switch');
    const askText = hero.querySelector('.ag-q-text');
    const done = hero.querySelector('.ag-done');
    const doneTool = done.querySelector('b');
    const doneMessage = done.querySelector('span');
    const asks = [
      {
        prompt: 'Turn our setup guide into a 4-lesson onboarding course',
        tool: 'create_course',
        result: 'Draft ready, still unpublished'
      },
      {
        prompt: 'Invite the March sales hires to Product Onboarding',
        tool: 'invite_students_to_cohort',
        result: '18 invites sent'
      },
      {
        prompt: 'How many learners finished SOC 2 this month?',
        tool: 'get_course_analytics',
        result: '87% have finished'
      },
      {
        prompt: 'Add a 5-question quiz to the security lesson',
        tool: 'add_exercise_question',
        result: '5 questions added'
      }
    ];

    const setConnected = (connected) => {
      hero.classList.toggle('on', connected);
      toggle.setAttribute('aria-checked', String(connected));
      if (!connected) return;

      hero.classList.remove('ripple');
      void hero.offsetWidth;
      hero.classList.add('ripple');
    };
    toggle.addEventListener('click', () => setConnected(!hero.classList.contains('on')));

    if (finePointer && !reduceMotion) {
      hero.addEventListener('pointermove', (event) => {
        const bounds = hero.getBoundingClientRect();
        hero.style.setProperty('--px', (((event.clientX - bounds.left) / bounds.width - 0.5) * 2).toFixed(3));
        hero.style.setProperty('--py', (((event.clientY - bounds.top) / bounds.height - 0.5) * 2).toFixed(3));
      });
      hero.addEventListener('pointerleave', () => {
        hero.style.setProperty('--px', '0');
        hero.style.setProperty('--py', '0');
      });
    }

    const playAsks = async () => {
      for (let index = 0; ; index = (index + 1) % asks.length) {
        const ask = asks[index];
        done.classList.remove('show');
        while (!hero.classList.contains('on')) await wait(300);

        if (reduceMotion) {
          askText.textContent = ask.prompt;
        } else {
          askText.textContent = '';
          await wait(400);
          for (const character of ask.prompt) {
            askText.textContent += character;
            await wait(34);
          }
        }
        await wait(600);
        doneTool.textContent = ask.tool;
        doneMessage.textContent = ask.result;
        done.classList.add('show');
        await wait(3200);
      }
    };

    whenVisible(hero, () => {
      setTimeout(() => setConnected(true), reduceMotion ? 0 : 1100);
      playAsks();
    });
  }

  if (finePointer && !reduceMotion) {
    document.querySelectorAll('[data-tilt]').forEach((element) => {
      const maxTilt = 5;
      element.addEventListener('pointermove', (event) => {
        const bounds = element.getBoundingClientRect();
        const ratioX = (event.clientX - bounds.left) / bounds.width;
        const ratioY = (event.clientY - bounds.top) / bounds.height;
        element.classList.add('is-tilting');
        element.style.setProperty('--ty', `${(ratioX - 0.5) * maxTilt * 2}deg`);
        element.style.setProperty('--tx', `${(0.5 - ratioY) * maxTilt * 2}deg`);
        element.style.setProperty('--gx', `${ratioX * 100}%`);
        element.style.setProperty('--gy', `${ratioY * 100}%`);
      });
      element.addEventListener('pointerleave', () => {
        element.classList.remove('is-tilting');
        element.style.setProperty('--tx', '0deg');
        element.style.setProperty('--ty', '0deg');
      });
    });
  }

  const scenarios = [
    {
      prompt: 'Turn our setup guide into a 4-lesson onboarding course.',
      tools: ['create_course', 'create_course_section', 'create_lesson × 4'],
      icon: '▤',
      title: 'Admin Onboarding',
      detail: '4 lessons · Unpublished draft'
    },
    {
      prompt: 'Add a 5-question quiz at the end of lesson 4.',
      tools: ['create_course_exercise', 'add_exercise_question × 5'],
      icon: '?',
      title: 'Lesson 4 quiz',
      detail: '5 questions · Ready to review'
    },
    {
      prompt: 'Create a March cohort and invite these 32 new admins.',
      tools: ['create_cohort', 'invite_students_to_cohort'],
      icon: '◎',
      title: 'March cohort',
      detail: '32 invites sent'
    },
    {
      prompt: 'Who has not finished SOC 2 Security Basics yet?',
      tools: ['get_course_analytics', 'list_course_analytics_students'],
      icon: '◔',
      title: '23 learners in progress',
      detail: 'Most are in Sales · List ready'
    },
    {
      prompt: 'Looks good. Publish the onboarding course.',
      tools: ['publish_course'],
      icon: '✓',
      title: 'Admin Onboarding is live',
      detail: 'Published to your academy'
    }
  ];

  const capsule = document.getElementById('ag-capsule');
  const windowBody = document.getElementById('ag-win');
  if (capsule && windowBody) {
    const chips = [...capsule.querySelectorAll('.ag-chip')];
    const typed = windowBody.querySelector('.ag-typed');
    const toolList = windowBody.querySelector('.ag-tools');
    const result = windowBody.querySelector('.ag-result');
    let runId = 0;
    let current = 0;
    let hovering = false;
    let autoTimer = null;

    const play = async (index) => {
      const myRun = ++runId;
      const alive = () => myRun === runId;
      const scenario = scenarios[index];
      current = index;
      clearTimeout(autoTimer);
      chips.forEach((chip, chipIndex) => chip.setAttribute('aria-selected', String(chipIndex === index)));
      typed.textContent = '';
      toolList.innerHTML = '';
      result.hidden = true;

      if (reduceMotion) {
        typed.textContent = scenario.prompt;
      } else {
        for (const character of scenario.prompt) {
          if (!alive()) return;

          typed.textContent += character;
          await wait(22 + Math.random() * 26);
        }
      }

      await wait(350);
      for (const toolName of scenario.tools) {
        if (!alive()) return;

        const row = document.createElement('li');
        row.innerHTML = '<span class="st"></span><span>classroomio · <b></b></span>';
        row.querySelector('b').textContent = toolName;
        toolList.append(row);
        await wait(reduceMotion ? 0 : 650);
        row.classList.add('done');
      }

      if (!alive()) return;

      await wait(250);
      result.querySelector('.ag-res-ic').textContent = scenario.icon;
      result.querySelector('b').textContent = scenario.title;
      result.querySelector('em').textContent = scenario.detail;
      result.hidden = false;
      scheduleNext();
    };

    const scheduleNext = () => {
      clearTimeout(autoTimer);
      if (reduceMotion) return;

      autoTimer = setTimeout(() => {
        if (hovering) {
          scheduleNext();
          return;
        }

        play((current + 1) % scenarios.length);
      }, 3200);
    };

    chips.forEach((chip, index) => chip.addEventListener('click', () => play(index)));
    capsule.addEventListener('pointerenter', () => (hovering = true));
    capsule.addEventListener('pointerleave', () => (hovering = false));
    whenVisible(capsule, () => play(0));
  }

  const phone = document.getElementById('ag-phone');
  if (phone) {
    const messages = [...phone.querySelectorAll('.ag-pm')];
    const delays = [500, 1000, 1300, 1600, 900];
    const runPhone = async () => {
      for (;;) {
        messages.forEach((message) => message.classList.remove('show'));
        for (let index = 0; index < messages.length; index++) {
          await wait(delays[index]);
          messages[index].classList.add('show');
        }
        await wait(6000);
      }
    };
    if (reduceMotion) {
      messages.forEach((message) => message.classList.add('show'));
    } else {
      whenVisible(phone, runPhone);
    }
  }

  const courses = [
    { name: 'SOC 2 Security Basics', pct: 87, done: 359, open: 23 },
    { name: 'HIPAA Awareness 2026', pct: 72, done: 214, open: 61 },
    { name: 'Product Onboarding', pct: 94, done: 528, open: 9 }
  ];
  const ringValue = document.getElementById('ag-ring-val');
  if (ringValue) {
    const pctLabel = document.getElementById('ag-ring-pct');
    const nameLabel = document.getElementById('ag-ring-name');
    const finishedLabel = document.getElementById('ag-call-a');
    const openLabel = document.getElementById('ag-call-b');
    const tabs = [...document.querySelectorAll('.ag-tabs button')];
    const shown = { pct: 0, done: 0, open: 0 };
    let frame = 0;

    const countTo = (course) => {
      cancelAnimationFrame(frame);
      const start = { ...shown };
      const startTime = performance.now();
      const duration = reduceMotion ? 1 : 1500;
      const step = (now) => {
        const progress = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        shown.pct = start.pct + (course.pct - start.pct) * eased;
        shown.done = start.done + (course.done - start.done) * eased;
        shown.open = start.open + (course.open - start.open) * eased;
        pctLabel.textContent = `${Math.round(shown.pct)}%`;
        finishedLabel.textContent = Math.round(shown.done);
        openLabel.textContent = Math.round(shown.open);
        if (progress < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };

    const selectCourse = (index) => {
      const course = courses[index];
      tabs.forEach((tab, tabIndex) => tab.setAttribute('aria-selected', String(tabIndex === index)));
      nameLabel.textContent = course.name;
      ringValue.style.strokeDasharray = `${course.pct} 100`;
      countTo(course);
    };

    tabs.forEach((tab, index) => tab.addEventListener('click', () => selectCourse(index)));
    whenVisible(ringValue.closest('.ag-ring-panel'), () => selectCourse(0));
  }

  const commands = {
    claude: 'claude mcp add --transport http classroomio https://mcp.classroomio.com',
    codex: 'codex mcp add classroomio --url https://mcp.classroomio.com',
    cursor: '{ "mcpServers": { "classroomio": { "url": "https://mcp.classroomio.com" } } }'
  };
  const codeBlock = document.getElementById('ag-code-pre');
  if (codeBlock) {
    const codeTabs = [...document.querySelectorAll('.ag-code-tabs button')];
    const copyButton = document.getElementById('ag-copy');
    const showCommand = (key) => {
      codeTabs.forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.k === key)));
      codeBlock.textContent = commands[key];
    };
    codeTabs.forEach((tab) =>
      tab.addEventListener('click', (event) => {
        event.stopPropagation();
        showCommand(tab.dataset.k);
      })
    );
    copyButton.addEventListener('click', async (event) => {
      event.stopPropagation();
      try {
        await navigator.clipboard.writeText(codeBlock.textContent);
        copyButton.textContent = 'Copied';
      } catch {
        copyButton.textContent = 'Select to copy';
      }
      setTimeout(() => (copyButton.textContent = 'Copy'), 1600);
    });
    showCommand('claude');
  }

  const howGrid = document.getElementById('hw');
  if (howGrid) {
    const steps = [...howGrid.querySelectorAll('.hw-steps li')];
    const panels = [...howGrid.querySelectorAll('.hw-panel')];
    const pill = document.getElementById('hw-pill');
    const labels = ['Connect your assistant', 'Approve the connection', 'Start working with your academy'];
    const stepMs = 5000;

    const activate = (index) => {
      steps.forEach((step, stepIndex) => {
        step.classList.remove('on');
        step.classList.toggle('done', stepIndex < index);
      });
      void howGrid.offsetWidth;
      steps[index].classList.add('on');
      panels.forEach((panel, panelIndex) => panel.classList.toggle('on', panelIndex === index));
      pill.textContent = labels[index];
    };

    steps.forEach((step, index) => {
      step.style.setProperty('--dur', `${stepMs}ms`);
      step.addEventListener('animationend', () => {
        if (step.classList.contains('on')) activate((index + 1) % steps.length);
      });
      step.addEventListener('click', () => activate(index));
      step.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate(index);
        }
      });
      step.addEventListener('pointerenter', () => step.classList.add('paused'));
      step.addEventListener('pointerleave', () => step.classList.remove('paused'));
    });

    if (reduceMotion) {
      steps.forEach((step) => step.classList.remove('on'));
      activate(0);
    } else {
      steps.forEach((step) => step.classList.remove('on'));
      whenVisible(howGrid, () => activate(0));
    }
  }

  function countUp(element, from, to, duration, suffix = '') {
    if (reduceMotion || duration <= 0) {
      element.textContent = `${to}${suffix}`;
      return;
    }

    const start = performance.now();
    const step = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = `${Math.round(from + (to - from) * eased)}${suffix}`;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const opsBoard = document.getElementById('ops-board');
  if (opsBoard) {
    const svgNS = 'http://www.w3.org/2000/svg';
    const doneCounter = document.getElementById('ops-done');
    const ticksSvg = document.getElementById('ops-ticks');
    const percentLabel = document.getElementById('ops-g-pct');
    const gaugeName = document.getElementById('ops-g-name');
    const gaugeDue = document.getElementById('ops-g-due');
    const gaugeSub = document.getElementById('ops-g-sub');
    const toast = document.getElementById('ops-toast');
    const autoToggle = document.getElementById('ops-auto');
    const gaugeTabs = [...opsBoard.querySelectorAll('[data-g]')];
    const rowList = document.getElementById('ops-rows');
    const refreshButton = document.getElementById('ops-refresh');
    const tiles = [...opsBoard.querySelectorAll('.ops-tile')];
    const domainText = opsBoard.querySelector('.ops-type');
    const seeAllButton = document.getElementById('ops-see');
    const extraList = document.getElementById('ops-extra');
    const widgets = [...opsBoard.querySelectorAll('.ops-w')];
    const cohorts = [
      { name: 'Product Onboarding cohort', percent: 72, goal: 80, due: 'Due in 12 days', reminders: 6 },
      { name: 'Advanced Training cohort', percent: 91, goal: 90, due: 'Due in 3 days', reminders: 2 },
      { name: 'Certification cohort', percent: 54, goal: 75, due: 'Due in 20 days', reminders: 9 }
    ];
    const tickCount = 46;
    const centerX = 160;
    const centerY = 166;
    let doneTotal = 0;
    let shownPercent = 0;
    let activeCohort = 0;
    let toastTimer;
    let typeTimer;

    const bumpDone = (change) => {
      doneTotal = Math.max(0, doneTotal + change);
      doneCounter.textContent = doneTotal;
      doneCounter.classList.remove('bump');
      void doneCounter.offsetWidth;
      doneCounter.classList.add('bump');
    };

    const mix = (from, to, amount) => Math.round(from + (to - from) * amount);
    const ticks = [];
    for (let index = 0; index < tickCount; index++) {
      const share = index / (tickCount - 1);
      const angle = Math.PI + share * Math.PI;
      const tick = document.createElementNS(svgNS, 'line');
      tick.setAttribute('x1', (centerX + Math.cos(angle) * 124).toFixed(1));
      tick.setAttribute('y1', (centerY + Math.sin(angle) * 124).toFixed(1));
      tick.setAttribute('x2', (centerX + Math.cos(angle) * 150).toFixed(1));
      tick.setAttribute('y2', (centerY + Math.sin(angle) * 150).toFixed(1));
      tick.style.setProperty('--c', `rgb(${mix(190, 5, share)}, ${mix(207, 66, share)}, ${mix(255, 204, share)})`);
      tick.style.setProperty('--k', index);
      ticksSvg.append(tick);
      ticks.push(tick);
    }
    for (let degrees = 180; degrees <= 360; degrees += 6) {
      const angle = (degrees * Math.PI) / 180;
      const dot = document.createElementNS(svgNS, 'circle');
      dot.setAttribute('class', 'dot');
      dot.setAttribute('cx', (centerX + Math.cos(angle) * 108).toFixed(1));
      dot.setAttribute('cy', (centerY + Math.sin(angle) * 108).toFixed(1));
      dot.setAttribute('r', degrees % 30 === 0 ? 1.8 : 1.1);
      ticksSvg.append(dot);
    }
    const progressMarker = document.createElementNS(svgNS, 'g');
    progressMarker.setAttribute('class', 'ops-progress-marker');
    progressMarker.innerHTML = `<line x1="${centerX - 116}" y1="${centerY}" x2="${centerX - 154}" y2="${centerY}"/><circle cx="${centerX - 158}" cy="${centerY}" r="5"/>`;
    ticksSvg.append(progressMarker);

    const showToast = (message) => {
      toast.textContent = message;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
    };

    const setGauge = (index) => {
      const cohort = cohorts[index];
      const litCount = Math.round((cohort.percent / 100) * tickCount);
      const previousLit = ticks.filter((tick) => tick.classList.contains('on')).length;
      ticksSvg.classList.remove('alive');
      ticks.forEach((tick, tickIndex) => {
        const lit = tickIndex < litCount;
        const order = lit ? tickIndex - previousLit : previousLit - 1 - tickIndex;
        tick.style.transitionDelay = reduceMotion ? '0ms' : `${Math.max(0, order) * 22}ms`;
        tick.classList.toggle('on', lit);
        tick.classList.toggle('head', tickIndex === litCount - 1);
      });
      progressMarker.style.transform = `rotate(${(cohort.percent / 100) * 180}deg)`;
      gaugeName.textContent = cohort.name;
      gaugeDue.textContent = cohort.due;
      gaugeSub.textContent =
        cohort.percent >= cohort.goal ? `goal met · target ${cohort.goal}%` : `on track · target ${cohort.goal}%`;
      countUp(percentLabel, shownPercent, cohort.percent, 1100, '%');
      shownPercent = cohort.percent;
      setTimeout(() => ticksSvg.classList.add('alive'), reduceMotion ? 0 : Math.abs(litCount - previousLit) * 22 + 600);
    };

    gaugeTabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        if (index === activeCohort) return;

        activeCohort = index;
        gaugeTabs.forEach((other, otherIndex) => other.setAttribute('aria-selected', String(otherIndex === index)));
        setGauge(index);
      });
    });

    autoToggle.addEventListener('click', () => {
      const enabled = autoToggle.getAttribute('aria-checked') !== 'true';
      autoToggle.setAttribute('aria-checked', String(enabled));
      if (enabled) {
        showToast(`${cohorts[activeCohort].reminders} reminders sent`);
        bumpDone(1);
        return;
      }

      showToast('Auto-remind paused');
    });

    rowList.querySelectorAll('button').forEach((row) => {
      const action = row.querySelector('.ops-act');
      if (!action) return;
      row.addEventListener('click', () => {
        const sent = row.getAttribute('aria-pressed') !== 'true';
        row.setAttribute('aria-pressed', String(sent));
        action.textContent = sent ? 'Reminder sent' : 'Remind';
        bumpDone(sent ? 1 : -1);
      });
    });

    const runRows = () => {
      rowList.classList.remove('run');
      void rowList.offsetWidth;
      rowList.classList.add('run');
    };
    refreshButton.addEventListener('click', () => {
      refreshButton.classList.remove('spin');
      void refreshButton.offsetWidth;
      refreshButton.classList.add('spin');
      runRows();
    });

    const typeDomain = () => {
      const fullText = domainText.dataset.text;
      clearInterval(typeTimer);
      if (reduceMotion) {
        domainText.textContent = fullText;
        return;
      }

      let typed = 0;
      domainText.textContent = '';
      domainText.classList.add('typing');
      typeTimer = setInterval(() => {
        typed += 1;
        domainText.textContent = fullText.slice(0, typed);
        if (typed < fullText.length) return;

        clearInterval(typeTimer);
        setTimeout(() => domainText.classList.remove('typing'), 900);
      }, 60);
    };

    tiles.forEach((tile, index) => {
      tile.addEventListener('click', () => {
        if (tile.classList.contains('on')) return;

        tiles.forEach((other) => {
          const active = other === tile;
          other.classList.toggle('on', active);
          other.setAttribute('aria-pressed', String(active));
        });
        if (index === 0) typeDomain();
        bumpDone(1);
      });
    });

    seeAllButton.addEventListener('click', () => {
      const open = extraList.hidden;
      extraList.hidden = !open;
      seeAllButton.setAttribute('aria-expanded', String(open));
      seeAllButton.textContent = open ? 'Show less' : 'See all';
    });

    if (!reduceMotion) domainText.textContent = '';

    const startBoard = () => {
      opsBoard.classList.add('in');
      if (reduceMotion) {
        rowList.classList.add('run');
        setGauge(0);
        typeDomain();
        doneTotal = 3;
        doneCounter.textContent = doneTotal;
        return;
      }

      setTimeout(runRows, 700);
      setTimeout(() => bumpDone(1), 1500);
      setTimeout(() => setGauge(0), 1000);
      setTimeout(() => bumpDone(1), 2200);
      setTimeout(typeDomain, 1300);
      setTimeout(() => bumpDone(1), 2600);
    };
    const boardObserver = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;

        boardObserver.disconnect();
        startBoard();
      },
      { threshold: 0.12 }
    );
    boardObserver.observe(opsBoard);

    const parallaxLayout = window.matchMedia('(min-width: 861px)');
    if (!reduceMotion) {
      const depths = widgets.map((widget) => parseFloat(widget.style.getPropertyValue('--depth')) || 0);
      let frameRequested = false;
      const updateParallax = () => {
        frameRequested = false;
        if (!parallaxLayout.matches) {
          widgets.forEach((widget) => widget.style.setProperty('--pt', '0px'));
          return;
        }

        const bounds = opsBoard.getBoundingClientRect();
        const progress = Math.max(
          -1,
          Math.min(1, (bounds.top + bounds.height / 2 - window.innerHeight / 2) / window.innerHeight)
        );
        widgets.forEach((widget, index) =>
          widget.style.setProperty('--pt', `${(progress * depths[index]).toFixed(1)}px`)
        );
      };
      const requestParallax = () => {
        if (frameRequested) return;

        frameRequested = true;
        requestAnimationFrame(updateParallax);
      };
      window.addEventListener('scroll', requestParallax, { passive: true });
      window.addEventListener('resize', requestParallax);
      updateParallax();
    }
  }
})();
