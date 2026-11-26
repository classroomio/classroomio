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
  if (finePointer && hero) {
    hero.addEventListener('pointermove', (event) => {
      const bounds = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', `${event.clientX - bounds.left}px`);
      hero.style.setProperty('--my', `${event.clientY - bounds.top}px`);
    });
  }

  if (finePointer && !reduceMotion) {
    document.querySelectorAll('[data-tilt]').forEach((element) => {
      const maxTilt = element.classList.contains('ag-card') ? 7 : 5;
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

  const cubes = document.getElementById('ag-cubes');
  if (cubes) {
    const cubeSpecs = [
      { x: -44, y: 44, z: 44, kind: '', glyph: '/mcp' },
      { x: 44, y: 44, z: 44, kind: 'glass', glyph: '✦' },
      { x: -44, y: -44, z: 44, kind: 'grid', glyph: '' },
      { x: -44, y: 44, z: -44, kind: '', glyph: '{ }' },
      { x: 44, y: 44, z: -44, kind: 'grid', glyph: '' }
    ];
    cubeSpecs.forEach((spec, index) => {
      const cube = document.createElement('div');
      cube.className = `ag-cube ${spec.kind}`;
      cube.style.cssText = `--x:${spec.x}px;--y:${spec.y}px;--z:${spec.z}px;--d:${index * -1.1}s`;
      cube.innerHTML = '<i></i>'.repeat(6);
      cube.querySelectorAll('i').forEach((face) => (face.textContent = spec.glyph));
      cubes.append(cube);
    });

    const card = cubes.closest('.ag-card');
    let pointerYaw = 0;
    let pointerPitch = 0;
    let spin = 0;
    if (finePointer) {
      card.addEventListener('pointermove', (event) => {
        const bounds = card.getBoundingClientRect();
        pointerYaw = ((event.clientX - bounds.left) / bounds.width - 0.5) * 50;
        pointerPitch = ((event.clientY - bounds.top) / bounds.height - 0.5) * -24;
      });
      card.addEventListener('pointerleave', () => {
        pointerYaw = 0;
        pointerPitch = 0;
      });
    }
    let currentYaw = -36;
    let currentPitch = -24;
    const animateCubes = () => {
      if (!reduceMotion) spin += 0.12;
      const targetYaw = -36 + Math.sin(spin / 40) * 14 + pointerYaw;
      const targetPitch = -24 + pointerPitch;
      currentYaw += (targetYaw - currentYaw) * 0.06;
      currentPitch += (targetPitch - currentPitch) * 0.06;
      cubes.style.setProperty('--ry', `${currentYaw}deg`);
      cubes.style.setProperty('--rx', `${currentPitch}deg`);
      requestAnimationFrame(animateCubes);
    };
    animateCubes();
  }

  const plateCard = document.querySelector('.ag-plates')?.closest('.ag-card');
  if (plateCard) {
    const steps = [...plateCard.querySelectorAll('.ag-plate-key li')];
    const topPlate = plateCard.querySelector('.ag-plate.p1');
    let activeStep = 0;
    const tick = () => {
      steps.forEach((step, index) => step.classList.toggle('on', index <= activeStep));
      topPlate.classList.toggle('ok', activeStep === steps.length - 1);
      activeStep = (activeStep + 1) % (steps.length + 1);
      if (activeStep === steps.length) {
        setTimeout(() => {
          activeStep = 0;
          steps.forEach((step) => step.classList.remove('on'));
          topPlate.classList.remove('ok');
        }, 1600);
      }
    };
    whenVisible(plateCard, () => {
      tick();
      setInterval(() => {
        if (activeStep < steps.length) tick();
      }, 1100);
    });
  }

  const heroChat = document.getElementById('ag-hero-chat');
  if (heroChat) {
    const [question, typing, answer] = heroChat.querySelectorAll('.ag-bub');
    const playChat = async () => {
      for (;;) {
        [question, typing, answer].forEach((bubble) => bubble.classList.remove('show'));
        await wait(700);
        question.classList.add('show');
        await wait(900);
        typing.classList.add('show');
        await wait(1500);
        typing.classList.remove('show');
        answer.classList.add('show');
        await wait(5200);
      }
    };
    if (reduceMotion) {
      question.classList.add('show');
      answer.classList.add('show');
    } else {
      whenVisible(heroChat.closest('.ag-card'), playChat);
    }
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

  const storyRow = document.getElementById('ag-stories');
  if (storyRow) {
    const stories = [...storyRow.querySelectorAll('.ag-story')];
    const segmentMs = 1800;
    let active = 0;

    const activate = (index) => {
      active = index;
      stories.forEach((story, storyIndex) => {
        story.classList.toggle('on', storyIndex === index);
        story.classList.toggle('done', storyIndex < index);
        story.classList.remove('approved');
      });
      if (index === 1) setTimeout(() => stories[1].classList.add('approved'), 1500);
      if (window.innerWidth <= 900 && storyRow.scrollWidth > storyRow.clientWidth) {
        const target = stories[index];
        storyRow.scrollTo({
          left: target.offsetLeft - (storyRow.clientWidth - target.offsetWidth) / 2,
          behavior: 'smooth'
        });
      }
    };

    stories.forEach((story, index) => {
      story.style.setProperty('--dur', `${segmentMs}ms`);
      const lastBar = story.querySelector('.ag-bars i:last-child');
      lastBar.addEventListener('animationend', () => {
        if (story.classList.contains('on')) activate((index + 1) % stories.length);
      });
      story.addEventListener('click', () => activate(index));
      story.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate(index);
        }
      });
      story.addEventListener('pointerenter', () => story.classList.add('paused'));
      story.addEventListener('pointerleave', () => story.classList.remove('paused'));
    });

    stories.forEach((story) => story.classList.remove('on'));
    if (reduceMotion) {
      stories.forEach((story) => story.classList.add('done'));
    } else {
      whenVisible(storyRow, () => activate(0));
    }
  }
})();
