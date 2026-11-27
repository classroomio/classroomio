(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const svgNs = 'http://www.w3.org/2000/svg';

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
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeDropdowns();
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

  const icons = {
    globe:
      '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.8 2.6 15.2 0 18M12 3c-2.6 2.8-2.6 15.2 0 18"/></svg>',
    people:
      '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3 19c.8-3.4 3.2-5 6-5s5.2 1.6 6 5M16 5.2a3 3 0 0 1 0 5.6M18 14.4c1.6.7 2.6 2.2 3 4.6"/></svg>',
    calendar:
      '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
    play: '<svg viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="M10 9.2v5.6l4.6-2.8z"/></svg>',
    slides:
      '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="13" rx="2.5"/><path d="M12 17v3M8 20.5h8M7 9h6M7 12.5h10"/></svg>',
    bolt: '<svg viewBox="0 0 24 24"><path d="M13 2.5L4.5 13.5H11l-1 8 8.5-11H12z"/></svg>',
    code: '<svg viewBox="0 0 24 24"><path d="M8.5 7L3.5 12l5 5M15.5 7l5 5-5 5"/></svg>',
    key: '<svg viewBox="0 0 24 24"><circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M15 12v2"/></svg>',
    chat: '<svg viewBox="0 0 24 24"><path d="M4.5 5.5h15v10h-9l-4.5 3.5v-3.5h-1.5z"/></svg>',
    video:
      '<svg viewBox="0 0 24 24"><rect x="2.5" y="6" width="13" height="12" rx="3"/><path d="M15.5 10.5l6-3.5v10l-6-3.5"/></svg>',
    folder:
      '<svg viewBox="0 0 24 24"><path d="M3 7.5a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
    spark:
      '<svg viewBox="0 0 24 24"><path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6zM18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/></svg>',
    cycle:
      '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 13.7-5.6M20 12a8 8 0 0 1-13.7 5.6M17.5 3v3.6h-3.6M6.5 21v-3.6h3.6"/></svg>'
  };

  /**
   * Builds the logo tile for an integration.
   * @param {{ img?: string, icon?: string, letter?: string, tone?: string }} mark
   * @returns {string}
   */
  function markHtml(mark) {
    const tone = mark.tone ? ` ${mark.tone}` : '';
    if (mark.img) return `<span class="mk${tone}"><img src="${mark.img}" alt="" loading="lazy"></span>`;

    if (mark.icon) return `<span class="mk${tone}">${icons[mark.icon]}</span>`;

    return `<span class="mk${tone}">${mark.letter}</span>`;
  }

  /* ---------- hero constellation ---------- */
  const heroNodes = [
    {
      name: 'Claude',
      kind: 'AI assistant',
      mark: { img: 'images/tools/claude-color.svg' },
      flow: 'both',
      text: 'Ask about your courses and learners in plain English, right inside Claude.'
    },
    {
      name: 'Cursor',
      kind: 'AI assistant',
      mark: { img: 'images/tools/cursor.svg' },
      flow: 'both',
      text: 'Draft and update lessons with the AI assistant in Cursor.'
    },
    {
      name: 'Google Workspace',
      kind: 'Sign-in',
      mark: { letter: 'G' },
      flow: 'in',
      text: 'Learners sign in with the Google work account they already have.'
    },
    {
      name: 'Okta',
      kind: 'Sign-in',
      mark: { letter: 'O' },
      flow: 'in',
      text: 'Use the company accounts your IT team already manages in Okta.'
    },
    {
      name: 'Slack',
      kind: 'Through a webhook',
      mark: { icon: 'chat' },
      flow: 'out',
      text: 'Post a message in a channel whenever a learner finishes a course.'
    },
    {
      name: 'Your CRM',
      kind: 'Through a webhook',
      mark: { icon: 'people' },
      flow: 'out',
      text: 'Send new learners and finished courses to your customer list.'
    },
    {
      name: 'Your website',
      kind: 'Course widget',
      mark: { icon: 'globe' },
      flow: 'out',
      text: 'Show your courses on your own website with a widget you copy and paste.'
    },
    {
      name: 'Canva',
      kind: 'Slides',
      mark: { letter: 'C' },
      flow: 'in',
      text: 'Embed a Canva design straight into a lesson.'
    },
    {
      name: 'Google Slides',
      kind: 'Slides',
      mark: { icon: 'slides' },
      flow: 'in',
      text: 'Embed a Google Slides deck so learners can click through it in a lesson.'
    },
    {
      name: 'YouTube',
      kind: 'Video',
      mark: { icon: 'play' },
      flow: 'in',
      text: 'Paste a YouTube link into any lesson.'
    },
    {
      name: 'VS Code',
      kind: 'AI assistant',
      mark: { img: 'images/tools/vscode.svg' },
      flow: 'both',
      text: 'Work on your academy from the AI chat in VS Code.'
    },
    {
      name: 'Codex',
      kind: 'AI assistant',
      mark: { img: 'images/tools/codex-color.svg' },
      flow: 'both',
      text: 'Let Codex build lessons and look up learner progress for you.'
    }
  ];

  const hero = document.getElementById('hero');
  const stage = document.getElementById('ig-stage');
  const wires = document.getElementById('ig-wires');
  const nodesLayer = document.getElementById('ig-nodes');
  const caption = document.getElementById('ig-cap');
  const captionName = document.getElementById('ig-cap-name');
  const captionText = document.getElementById('ig-cap-text');

  requestAnimationFrame(() => hero.classList.add('in'));

  const nodeElements = heroNodes.map((node, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ig-node';
    button.dataset.i = index;
    button.setAttribute('aria-label', `${node.name}: ${node.text}`);
    button.innerHTML = `${markHtml(node.mark)}<span>${node.name}<em>${node.kind}</em></span>`;
    nodesLayer.append(button);
    return button;
  });

  const wirePaths = [];
  const pulses = [];
  heroNodes.forEach((node, index) => {
    const path = document.createElementNS(svgNs, 'path');
    path.setAttribute('class', 'ig-wire');
    path.setAttribute('id', `ig-w${index}`);
    wires.append(path);
    wirePaths.push(path);

    const pulse = document.createElementNS(svgNs, 'circle');
    pulse.setAttribute('r', '3.2');
    pulse.setAttribute('class', 'ig-pulse');
    if (!reduceMotion) {
      const motion = document.createElementNS(svgNs, 'animateMotion');
      motion.setAttribute('dur', `${2.6 + (index % 4) * 0.45}s`);
      motion.setAttribute('repeatCount', 'indefinite');
      motion.setAttribute('begin', `${-(index * 0.37)}s`);
      if (node.flow === 'in') {
        motion.setAttribute('keyPoints', '1;0');
        motion.setAttribute('keyTimes', '0;1');
        motion.setAttribute('calcMode', 'linear');
      }
      if (node.flow === 'both') {
        motion.setAttribute('keyPoints', '0;1;0');
        motion.setAttribute('keyTimes', '0;0.5;1');
        motion.setAttribute('calcMode', 'linear');
        motion.setAttribute('dur', `${5 + (index % 3) * 0.6}s`);
      }
      const mpath = document.createElementNS(svgNs, 'mpath');
      mpath.setAttribute('href', `#ig-w${index}`);
      motion.append(mpath);
      pulse.append(motion);
    } else {
      pulse.setAttribute('opacity', '0');
    }
    wires.append(pulse);
    pulses.push(pulse);
  });

  const nodePositions = [];
  function layoutStage() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (!width || !height) return;

    const narrow = width < 600;
    const centerX = width / 2;
    const centerY = height / 2;
    const radiusX = width * (narrow ? 0.38 : 0.39);
    const radiusY = height * (narrow ? 0.41 : 0.37);
    wires.setAttribute('viewBox', `0 0 ${width} ${height}`);
    heroNodes.forEach((node, index) => {
      const angle = ((index / heroNodes.length) * 360 + 195) * (Math.PI / 180);
      const x = centerX + Math.cos(angle) * radiusX;
      const y = centerY + Math.sin(angle) * radiusY;
      nodePositions[index] = { x, y };
      nodeElements[index].style.setProperty('--x', `${x}px`);
      nodeElements[index].style.setProperty('--y', `${y}px`);
      const bend = (index % 2 ? 1 : -1) * 28;
      const midX = (x + centerX) / 2;
      const midY = (y + centerY) / 2;
      const length = Math.hypot(x - centerX, y - centerY) || 1;
      const controlX = midX + (-(y - centerY) / length) * bend;
      const controlY = midY + ((x - centerX) / length) * bend;
      wirePaths[index].setAttribute('d', `M${centerX},${centerY - 8} Q${controlX},${controlY} ${x},${y}`);
    });
  }

  let activeNode = -1;
  function showNode(index) {
    if (index === activeNode) return;

    activeNode = index;
    nodeElements.forEach((element, elementIndex) => element.classList.toggle('on', elementIndex === index));
    wirePaths.forEach((path, pathIndex) => path.classList.toggle('on', pathIndex === index));
    pulses.forEach((pulse, pulseIndex) => pulse.classList.toggle('on', pulseIndex === index));
    caption.classList.add('swap');
    setTimeout(() => {
      captionName.textContent = heroNodes[index].name;
      captionText.textContent = heroNodes[index].text;
      caption.classList.remove('swap');
    }, 220);
  }

  let cycleTimer = 0;
  let pausedByUser = false;
  function startCycle() {
    clearInterval(cycleTimer);
    if (reduceMotion) return;

    cycleTimer = setInterval(() => {
      if (pausedByUser || document.hidden) return;

      showNode((activeNode + 1) % heroNodes.length);
    }, 2600);
  }

  nodeElements.forEach((element, index) => {
    const take = () => {
      pausedByUser = true;
      showNode(index);
    };
    element.addEventListener('pointerenter', take);
    element.addEventListener('focus', take);
    element.addEventListener('click', take);
  });
  nodesLayer.addEventListener('pointerleave', () => {
    pausedByUser = false;
  });
  nodesLayer.addEventListener('focusout', () => {
    pausedByUser = false;
  });

  if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    stage.addEventListener('pointermove', (event) => {
      const box = stage.getBoundingClientRect();
      if (!box.width || !box.height) return;

      const offsetX = (event.clientX - box.left) / box.width - 0.5;
      const offsetY = (event.clientY - box.top) / box.height - 0.5;
      nodeElements.forEach((element, index) => {
        const depth = 6 + (index % 3) * 5;
        element.style.setProperty('--px', `${-offsetX * depth}px`);
        element.style.setProperty('--py', `${-offsetY * depth}px`);
      });
    });
    stage.addEventListener('pointerleave', () => {
      nodeElements.forEach((element) => {
        element.style.setProperty('--px', '0px');
        element.style.setProperty('--py', '0px');
      });
    });
  }

  layoutStage();
  window.addEventListener('resize', layoutStage);
  window.addEventListener('load', layoutStage);
  showNode(0);
  startCycle();

  /* ---------- automation story ---------- */
  const recipes = [
    {
      avatar: 'images/av-a.jpg',
      who: 'Ada Obi',
      what: 'finished Getting started',
      sendTo: 'to your team chat',
      destination: 'In your team chat',
      output: `<p class="fo-chan"># customer-wins</p>
        <div class="fo-msg fo-muted"><span class="fo-bot"><img src="images/logo.svg" alt=""></span><span><b>ClassroomIO</b>Jide Musa finished Reports and dashboards.</span></div>
        <div class="fo-msg fl-new" style="margin-top:10px"><span class="fo-bot"><img src="images/logo.svg" alt=""></span><span><b>ClassroomIO</b>Ada Obi just finished Getting started. Send a well done!</span></div>`
    },
    {
      avatar: 'images/av-b.jpg',
      who: 'Femi Cole',
      what: 'accepted the invite to Onboarding 101',
      sendTo: 'to your customer list',
      destination: 'In your customer list',
      output: `<div class="fo-row fo-muted"><span><img src="images/av-e.jpg" alt="">Lola Grant</span><span class="fo-tag blue">Customer</span></div>
        <div class="fo-row fo-muted"><span><img src="images/av-f.jpg" alt="">Sam Reed</span><span class="fo-tag blue">Customer</span></div>
        <div class="fo-row fl-new"><span><img src="images/av-b.jpg" alt="">Femi Cole</span><span class="fo-tag">Started onboarding</span></div>`
    },
    {
      avatar: 'images/av-c.jpg',
      who: 'Tunde Ade',
      what: 'earned the Safety basics certificate',
      sendTo: 'to your HR tool',
      destination: 'In your HR tool',
      output: `<p class="fo-chan">Tunde Ade · Warehouse team</p>
        <div class="fo-row fl-new"><span>Safety basics</span><span class="fo-tag">Certified today</span></div>
        <div class="fo-row fo-muted"><span>Forklift basics</span><span class="fo-tag blue">Due next month</span></div>`
    },
    {
      avatar: 'images/av-d.jpg',
      who: 'Kemi Bello',
      what: 'handed in the Week 2 project',
      sendTo: "to your tutor's chat",
      destination: "In your tutor's chat",
      output: `<p class="fo-chan"># marking-queue</p>
        <div class="fo-msg fl-new"><span class="fo-bot"><img src="images/logo.svg" alt=""></span><span><b>ClassroomIO</b>Kemi Bello handed in the Week 2 project. It's ready to mark.</span></div>`
    }
  ];

  const board = document.getElementById('fl-board');
  const recipeButtons = [...document.querySelectorAll('.fl-item')];
  const flowParts = {
    avatar: document.getElementById('fl-av'),
    who: document.getElementById('fl-who'),
    what: document.getElementById('fl-what'),
    time: document.getElementById('fl-time'),
    dotIn: document.getElementById('fl-dot'),
    dotOut: document.getElementById('fl-dot2'),
    send: board.querySelector('.fl-send'),
    sendTitle: document.getElementById('fl-send-t'),
    sendSub: document.getElementById('fl-send-s'),
    destination: document.getElementById('fl-dst-k'),
    output: document.getElementById('fl-out')
  };
  const recipeDuration = 6200;
  let recipeRun = 0;
  let recipeAutoplay = !reduceMotion;

  function restartAnimation(element, className) {
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
  }

  async function playRecipe(index) {
    recipeRun += 1;
    const run = recipeRun;
    const recipe = recipes[index];
    recipeButtons.forEach((button, buttonIndex) => {
      button.setAttribute('aria-pressed', String(buttonIndex === index));
      button.querySelector('.fl-bar i').classList.remove('run');
    });
    if (recipeAutoplay) {
      const bar = recipeButtons[index].querySelector('.fl-bar i');
      bar.style.setProperty('--dur', `${recipeDuration}ms`);
      void bar.offsetWidth;
      bar.classList.add('run');
    }

    flowParts.avatar.src = recipe.avatar;
    flowParts.who.textContent = recipe.who;
    flowParts.what.textContent = recipe.what;
    flowParts.time.textContent = 'Just now';
    flowParts.send.classList.remove('done');
    flowParts.sendTitle.textContent = 'Waiting…';
    flowParts.sendSub.textContent = recipe.sendTo;
    flowParts.destination.textContent = recipe.destination;
    flowParts.output.classList.remove('show');
    flowParts.output.innerHTML = recipe.output;

    if (reduceMotion) {
      flowParts.send.classList.add('done');
      flowParts.sendTitle.textContent = 'Delivered';
      flowParts.output.classList.add('show');
      return;
    }

    await wait(350);
    if (run !== recipeRun) return;

    restartAnimation(board, 'fire');
    restartAnimation(flowParts.dotIn, 'go');
    flowParts.sendTitle.textContent = 'Sending…';
    await wait(800);
    if (run !== recipeRun) return;

    flowParts.send.classList.add('done');
    flowParts.sendTitle.textContent = 'Delivered';
    restartAnimation(flowParts.dotOut, 'go');
    await wait(700);
    if (run !== recipeRun) return;

    flowParts.output.classList.add('show');
    if (!recipeAutoplay) return;

    await wait(recipeDuration - 1850);
    if (run !== recipeRun || !recipeAutoplay) return;

    playRecipe((index + 1) % recipes.length);
  }

  recipeButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      recipeAutoplay = false;
      playRecipe(index);
    });
  });

  new IntersectionObserver(
    (entries, observer) => {
      if (!entries[0].isIntersecting) return;

      observer.disconnect();
      playRecipe(0);
    },
    { threshold: 0.4 }
  ).observe(board);

  /* ---------- showcase ---------- */
  const planNote = 'On Early Adopter and Enterprise plans';
  const catalog = [
    {
      group: 'ai',
      name: 'Claude Code',
      mark: { img: 'images/tools/claude-color.svg' },
      text: 'Ask questions and make changes in your academy by chatting with Claude.'
    },
    {
      group: 'ai',
      name: 'Codex',
      mark: { img: 'images/tools/codex-color.svg' },
      text: 'Let Codex build lessons and look up how learners are doing.'
    },
    {
      group: 'ai',
      name: 'Cursor',
      mark: { img: 'images/tools/cursor.svg' },
      text: 'Draft and update course content with the AI assistant in Cursor.'
    },
    {
      group: 'ai',
      name: 'VS Code',
      mark: { img: 'images/tools/vscode.svg' },
      text: 'Work on your academy from the AI chat inside VS Code.'
    },
    {
      group: 'ai',
      name: 'OpenCode',
      mark: { img: 'https://assets.cdn.clsrio.com/www/home/opencode-logo.svg' },
      text: 'Connect OpenCode and manage courses from your terminal.'
    },
    {
      group: 'ai',
      name: 'Gemini CLI',
      mark: { icon: 'spark' },
      text: 'Use Google’s Gemini command-line assistant with your academy.'
    },
    {
      group: 'signin',
      name: 'Google Workspace',
      mark: { letter: 'G' },
      text: 'Learners and staff sign in with their Google work account.'
    },
    {
      group: 'signin',
      name: 'Okta',
      mark: { letter: 'O' },
      text: 'Use the company accounts your IT team already manages in Okta.'
    },
    {
      group: 'signin',
      name: 'Auth0',
      mark: { letter: 'A' },
      text: 'Connect the Auth0 sign-in you already use to your academy.'
    },
    {
      group: 'signin',
      name: 'Sign in from your app',
      mark: { icon: 'key', tone: 'blue' },
      text: 'People signed in to your product go straight into the academy, with no second password.',
      note: 'Enterprise',
      noteClass: 'plan'
    },
    {
      group: 'auto',
      name: 'Webhooks',
      mark: { icon: 'bolt', tone: 'ink' },
      text: 'Tell your other tools when a learner joins, finishes a course or earns a certificate.',
      foot: planNote
    },
    {
      group: 'auto',
      name: 'Slack',
      mark: { icon: 'chat' },
      text: 'Post a message in a channel when something happens, using a webhook.'
    },
    {
      group: 'auto',
      name: 'Make',
      mark: { icon: 'cycle' },
      text: 'Start a Make scenario whenever a course update comes in, using a webhook.'
    },
    {
      group: 'auto',
      name: 'Zapier',
      mark: { letter: 'Z' },
      text: 'Connect ClassroomIO to thousands of apps without writing code.',
      note: 'Coming soon',
      noteClass: 'soon'
    },
    {
      group: 'auto',
      name: 'Public API',
      mark: { icon: 'code', tone: 'ink' },
      text: 'Let your developers read and update your academy from your own software.',
      foot: planNote
    },
    { group: 'content', name: 'YouTube', mark: { icon: 'play' }, text: 'Paste a YouTube link into any lesson.' },
    {
      group: 'content',
      name: 'Vimeo',
      mark: { icon: 'video' },
      text: 'Add Vimeo videos, including unlisted ones, to your lessons.'
    },
    {
      group: 'content',
      name: 'Google Drive',
      mark: { icon: 'folder' },
      text: 'Pick a video from Google Drive and add it to a lesson.'
    },
    {
      group: 'content',
      name: 'Google Slides',
      mark: { icon: 'slides' },
      text: 'Embed a Google Slides deck so learners can click through it.'
    },
    {
      group: 'content',
      name: 'Canva',
      mark: { letter: 'C' },
      text: 'Embed a Canva design or presentation in a lesson.'
    },
    { group: 'content', name: 'PowerPoint', mark: { letter: 'P' }, text: 'Embed a PowerPoint deck saved to OneDrive.' },
    {
      group: 'content',
      name: 'Figma Slides',
      mark: { letter: 'F' },
      text: 'Embed a Figma Slides presentation in a lesson.'
    },
    {
      group: 'site',
      name: 'Course widgets',
      mark: { icon: 'globe', tone: 'blue' },
      text: 'Show your courses on any website with a short piece of code you copy and paste.'
    },
    {
      group: 'site',
      name: 'Calendar invites',
      mark: { icon: 'calendar' },
      text: 'Learners get a calendar invite with the time and link for each live class.'
    },
    {
      group: 'site',
      name: 'Any meeting tool',
      mark: { icon: 'video' },
      text: 'Run live classes on the video call tool you already use. Just paste the meeting link.'
    }
  ];
  const groupLabels = {
    ai: 'AI assistant',
    signin: 'Sign-in',
    auto: 'Automation',
    content: 'Videos and slides',
    site: 'Your website'
  };

  const grid = document.getElementById('al-grid');
  const count = document.getElementById('al-count');
  const filterButtons = [...document.querySelectorAll('#al-filters button')];

  function renderCatalog(filter) {
    const items = catalog.filter((item) => filter === 'all' || item.group === filter);
    grid.innerHTML = '';
    items.forEach((item, index) => {
      const card = document.createElement('li');
      card.className = 'al-card';
      card.style.setProperty('--n', index);
      const note = item.note ? `<span class="al-note ${item.noteClass}">${item.note}</span>` : '';
      const foot = item.foot ? `<p class="al-foot">${item.foot}</p>` : '';
      card.innerHTML = `<div class="al-top">${markHtml(item.mark)}${note}</div><div><b>${item.name}</b><p>${item.text}</p>${foot}</div><span class="al-tag">${groupLabels[item.group]}</span>`;
      grid.append(card);
    });
    count.textContent = `${items.length} ${items.length === 1 ? 'way' : 'ways'} to connect`;
  }

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      filterButtons.forEach((item) => {
        item.classList.toggle('on', item === button);
        item.setAttribute('aria-pressed', String(item === button));
      });
      renderCatalog(button.dataset.f);
    });
  });
  renderCatalog('all');
})();
