(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

  const brands = [
    {
      name: 'Northwind',
      word: 'Northwind',
      tag: 'There’s learning. And there’s learning inside your product.',
      use: 'Customer education',
      domain: 'learn.northwind.io',
      mark: 'm-nw',
      palette: { deep: '#0c4f47', soft: '#d9f3ec', acc: '#18c9ac', rib: '#9ff0dd' },
      card: { kick: 'Course', title: 'Get more out of Northwind', meta: '8 lessons · 40 min', button: 'Continue' },
      text: 'A software company teaching customers how to use its product. The academy sits on Northwind’s own web address, in its logo and colours, and customers sign in straight from the Northwind app without a second password.',
      chips: ['Your own web address', 'Sign in from your app', 'Brand colours']
    },
    {
      name: 'Fieldline',
      word: 'Fieldline',
      tag: 'There’s safety training. And there’s training your crews finish.',
      use: 'Safety training',
      domain: 'academy.fieldline.co',
      mark: 'm-fl',
      palette: { deep: '#5a1f04', soft: '#f6e2d3', acc: '#ff6a1a', rib: '#ffc49f' },
      card: { kick: 'Certificate', title: 'Forklift basics', meta: 'Passed · 96%', button: 'Download' },
      text: 'A manufacturer training crews on site safety. Every worker who passes gets a certificate with Fieldline’s logo and colours on it, ready to show a site inspector.',
      chips: ['Branded certificates', 'Your logo', 'Pass marks']
    },
    {
      name: 'Peakline',
      word: 'Peakline',
      tag: 'There’s certifying. And there’s certifying under your name.',
      use: 'Partner certification',
      domain: 'partners.peakline.com',
      mark: 'm-pk',
      palette: { deep: '#0f3d24', soft: '#dcefe1', acc: '#1fb85a', rib: '#a6ecc0' },
      card: {
        kick: 'Partner programme',
        title: 'Certified partner 2026',
        meta: '3 of 3 courses done',
        button: 'View badge'
      },
      text: 'A company certifying the resellers who sell its product. Partners see Peakline’s brand from the first invite email to the final certificate, and never see ours.',
      chips: ['Branded emails', 'Certificates', 'Your own web address']
    },
    {
      name: 'Bloom Kitchen',
      word: 'Bloom',
      tag: 'There’s a class. And there’s a class that feels like home.',
      use: 'Paid courses',
      domain: 'school.bloomkitchen.com',
      mark: 'm-bl',
      palette: { deep: '#6a2e4b', soft: '#bfa594', acc: '#e8577e', rib: '#e6c3f5' },
      card: { kick: 'Paid course', title: 'Sourdough at home', meta: '★ 4.9 · 12 lessons', button: 'Enrol · $49' },
      text: 'A baker selling online classes. Her course pages show prices, reviews and lessons in her own colours, so her school feels like part of her bakery.',
      chips: ['Course pages', 'Prices and reviews', 'Ready-made themes']
    },
    {
      name: 'Kora Health',
      word: 'Kora',
      tag: 'There’s onboarding. And there’s onboarding that welcomes.',
      use: 'Staff onboarding',
      domain: 'learn.korahealth.org',
      mark: 'm-ko',
      palette: { deep: '#0542cc', soft: '#eaf0fd', acc: '#5b8af5', rib: '#c3d4ff' },
      card: {
        kick: 'Sign in',
        title: 'Welcome to Kora Learning',
        meta: 'Use your Kora work account',
        button: 'Continue'
      },
      text: 'A clinic onboarding new nurses. Staff sign in with their Kora work account and land on a welcome banner, in the language Kora chose for them.',
      chips: ['Work account sign-in', 'Welcome banner', 'Learner language']
    },
    {
      name: 'Lumen Studio',
      word: 'Lumen',
      tag: 'There’s a cohort. And there’s a community around it.',
      use: 'Cohort programmes',
      domain: 'learn.lumen.studio',
      mark: 'm-lu',
      palette: { deep: '#3d2c00', soft: '#f6ecc8', acc: '#e0a800', rib: '#ffe07a' },
      card: { kick: 'Cohort', title: 'Cohort 4 starts Thursday', meta: 'Live · Thu 6pm', button: 'Join' },
      text: 'A design studio running live cohorts. Lumen switched on the community tab so learners can share work, and hid the tabs this group doesn’t need.',
      chips: ['Community', 'Show or hide tabs', 'Live lessons']
    }
  ];

  const hero = document.getElementById('hero');
  const heroStage = document.getElementById('stage');
  const caption = document.getElementById('ba-cap');
  const badge = hero.querySelector('.ba-badge');
  const badgeUse = badge.querySelector('use');
  const picksRow = document.getElementById('st-picks-row');
  const posterCards = [...heroStage.querySelectorAll('.tc')];
  const markUses = [...heroStage.querySelectorAll('.t-mark')];
  const posterParts = {
    use: [document.getElementById('t-use'), document.getElementById('t-use2')],
    domain: [document.getElementById('t-dom'), document.getElementById('t-dom2')],
    tag: [document.getElementById('t-tag'), document.getElementById('t-tag2')],
    word: document.getElementById('t-word')
  };
  const captionParts = {
    count: document.getElementById('cap-count'),
    use: document.getElementById('cap-use'),
    name: document.getElementById('cap-name'),
    domain: document.getElementById('cap-domain'),
    text: document.getElementById('cap-text'),
    chips: document.getElementById('cap-chips')
  };
  const autoplayDelay = 5200;

  const pickButtons = brands.map((brand, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'st-pick';
    button.setAttribute('aria-label', `Show ${brand.name}`);
    button.innerHTML = `<svg aria-hidden="true"><use href="#${brand.mark}"/></svg><svg class="ring" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" pathLength="1"/></svg>`;
    button.addEventListener('click', () => {
      heroStage.classList.add('manual');
      showBrand(index);
      scheduleNext(autoplayDelay * 2);
    });
    picksRow.append(button);

    return button;
  });

  function restartClass(element, className) {
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
  }

  function renderCaption(brand, index) {
    captionParts.count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(brands.length).padStart(2, '0')}`;
    captionParts.use.textContent = brand.use;
    captionParts.name.textContent = brand.name;
    captionParts.domain.textContent = brand.domain;
    captionParts.text.textContent = brand.text;
    captionParts.chips.innerHTML = '';
    brand.chips.forEach((label) => {
      const chip = document.createElement('li');
      chip.textContent = label;
      captionParts.chips.append(chip);
    });
    caption.classList.remove('swap');
  }

  function renderPosters(brand) {
    posterParts.use.forEach((element) => (element.textContent = brand.use));
    posterParts.domain.forEach((element) => (element.textContent = brand.domain));
    posterParts.tag.forEach((element) => (element.textContent = brand.tag));
    posterParts.word.textContent = brand.word;
    markUses.forEach((use) => use.setAttribute('href', `#${brand.mark}`));
    heroStage.classList.remove('swap');
  }

  const waveColors = { from: '#5b8af5', to: '#eaf0fd' };
  let activeIndex = -1;
  function showBrand(index) {
    if (index === activeIndex) return;

    const firstRender = activeIndex === -1;
    activeIndex = index;
    const brand = brands[index];
    pickButtons.forEach((button, buttonIndex) => {
      const isActive = buttonIndex === index;
      button.classList.toggle('on', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
    pickButtons[index].style.setProperty('--dur', `${autoplayDelay}ms`);
    restartClass(pickButtons[index], 'on');

    if (firstRender) {
      badgeUse.setAttribute('href', `#${brand.mark}`);
      renderPosters(brand);
      renderCaption(brand, index);
      return;
    }

    restartClass(badge, 'spin');
    setTimeout(() => badgeUse.setAttribute('href', `#${brand.mark}`), 300);
    heroStage.classList.add('swap');
    caption.classList.add('swap');
    setTimeout(() => renderPosters(brand), 300);
    setTimeout(() => renderCaption(brand, index), 260);
  }

  let autoplayTimer = null;
  let stageHovered = false;
  let heroVisible = true;
  function scheduleNext(delay = autoplayDelay) {
    clearTimeout(autoplayTimer);
    if (reduceMotion) return;

    autoplayTimer = setTimeout(() => {
      if (heroStage.classList.contains('manual') && stageHovered) {
        scheduleNext(1200);
        return;
      }
      if (stageHovered || !heroVisible) {
        scheduleNext(1200);
        return;
      }

      heroStage.classList.remove('manual');
      showBrand((activeIndex + 1) % brands.length);
      scheduleNext();
    }, delay);
  }

  function step(direction) {
    heroStage.classList.add('manual');
    showBrand((activeIndex + direction + brands.length) % brands.length);
    scheduleNext(autoplayDelay * 2);
  }

  document.getElementById('reel-next').addEventListener('click', () => step(1));
  document.getElementById('reel-prev').addEventListener('click', () => step(-1));
  heroStage.addEventListener('pointerenter', () => {
    stageHovered = true;
    heroStage.classList.add('paused');
  });
  heroStage.addEventListener('pointerleave', () => {
    stageHovered = false;
    heroStage.classList.remove('paused');
  });

  const wave = document.getElementById('wave');
  const waveContext = wave.getContext('2d');
  const wavePointer = { x: 0.5, y: 0.5, active: 0 };
  let waveWidth = 0;
  let waveHeight = 0;
  function sizeWave() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    waveWidth = wave.clientWidth;
    waveHeight = wave.clientHeight;
    wave.width = Math.max(1, Math.round(waveWidth * ratio));
    wave.height = Math.max(1, Math.round(waveHeight * ratio));
    waveContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  function mixHex(from, to, amount) {
    const parse = (hex) => [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
    const [r1, g1, b1] = parse(from);
    const [r2, g2, b2] = parse(to);

    return `rgb(${Math.round(r1 + (r2 - r1) * amount)},${Math.round(g1 + (g2 - g1) * amount)},${Math.round(b1 + (b2 - b1) * amount)})`;
  }
  function drawWave(time) {
    if (waveWidth <= 0 || waveHeight <= 0) return;

    waveContext.clearRect(0, 0, waveWidth, waveHeight);
    const rows = 18;
    const columns = 15;
    const seconds = time / 1000;
    for (let row = 0; row < rows; row++) {
      const depth = row / (rows - 1);
      const rowY = waveHeight * (0.04 + depth * depth * 0.98);
      const size = 2.2 + depth * 8.5;
      const spacing = waveWidth / columns;
      const color = mixHex(waveColors.from, waveColors.to, Math.min(1, depth * 1.1));
      waveContext.fillStyle = color;
      for (let column = -1; column <= columns; column++) {
        const baseX = column * spacing + (row % 2 ? spacing / 2 : 0);
        const dx = baseX / waveWidth - wavePointer.x;
        const dy = rowY / waveHeight - wavePointer.y;
        const pull = Math.exp(-(dx * dx + dy * dy) * 14) * 18 * wavePointer.active;
        const swell = Math.sin(baseX * 0.018 + seconds * 1.4 + row * 0.55) * (3 + depth * 7);
        const x = baseX;
        const y = rowY + swell - pull;
        const grow = 1 + (pull / 18) * 0.9;
        waveContext.beginPath();
        waveContext.moveTo(x - size * grow * 0.5, y);
        waveContext.lineTo(x + size * grow * 0.5, y);
        waveContext.lineTo(x, y + size * grow * 0.85);
        waveContext.closePath();
        waveContext.fill();
      }
    }
  }
  function waveFrame(time) {
    if (heroVisible) drawWave(time);
    if (!reduceMotion) requestAnimationFrame(waveFrame);
  }
  wave.addEventListener('pointermove', (event) => {
    const box = wave.getBoundingClientRect();
    if (!box.width || !box.height) return;

    wavePointer.x = (event.clientX - box.left) / box.width;
    wavePointer.y = (event.clientY - box.top) / box.height;
    wavePointer.active = 1;
  });
  wave.addEventListener('pointerleave', () => {
    wavePointer.active = 0;
  });
  new ResizeObserver(() => {
    sizeWave();
    drawWave(performance.now());
  }).observe(wave);

  new IntersectionObserver((entries) => {
    heroVisible = entries[0].isIntersecting;
  }).observe(heroStage);

  showBrand(0);
  sizeWave();
  requestAnimationFrame(waveFrame);
  requestAnimationFrame(() => hero.classList.add('in'));
  scheduleNext(autoplayDelay + 1800);

  /* ---------- guided customiser ---------- */
  const win = document.getElementById('cz-win');
  const cursor = document.getElementById('cz-cursor');
  const preview = document.getElementById('pv');
  const previewSite = preview.querySelector('.pv-site');
  const previewUrl = document.getElementById('pv-url');
  const previewName = document.getElementById('pv-name');
  const orgBadge = document.getElementById('cz-org');
  const stepButtons = [...document.querySelectorAll('.cz-step')];
  const tabButtons = [...document.querySelectorAll('.cz-tabs [role="tab"]')];
  const groups = [...document.querySelectorAll('.cz-group')];
  const themeButtons = [...document.querySelectorAll('.cz-theme')];
  const swatches = [...document.querySelectorAll('#cz-sw button')];
  const hexLabel = document.getElementById('cz-hex');
  const uploadButton = document.getElementById('cz-upload');
  const domainField = document.getElementById('cz-domain-field');
  const domainInput = document.getElementById('cz-domain-in');
  const connectButton = document.getElementById('cz-connect');
  const domainStatus = document.getElementById('cz-status');
  const toggles = [...document.querySelectorAll('.cz-tg [role="switch"]')];
  const languageButtons = [...document.querySelectorAll('#cz-lang button')];
  const defaultDomain = 'northwind.classroomio.com';
  const brandDomain = 'learn.northwind.io';
  const stepDuration = 6500;

  function selectTab(index) {
    tabButtons.forEach((tab, tabIndex) => tab.setAttribute('aria-selected', String(tabIndex === index)));
    groups.forEach((group, groupIndex) => group.classList.toggle('on', groupIndex === index));
  }

  function setTheme(theme) {
    themeButtons.forEach((button) => button.classList.toggle('on', button.dataset.theme === theme));
    if (preview.dataset.theme === theme) return;

    preview.dataset.theme = theme;
    previewSite.classList.remove('swap');
    void previewSite.offsetWidth;
    previewSite.classList.add('swap');
  }

  function setColor(color) {
    swatches.forEach((swatch) => swatch.classList.toggle('on', swatch.dataset.color === color));
    preview.style.setProperty('--pc', color);
    hexLabel.textContent = color.toUpperCase();
    if (preview.classList.contains('logo')) orgBadge.style.background = color;
  }

  function setLogo(on) {
    preview.classList.toggle('logo', on);
    uploadButton.classList.toggle('done', on);
    previewName.textContent = on ? 'Northwind Academy' : 'Your academy';
    uploadButton.querySelector('#cz-up-t').textContent = on ? 'northwind-logo.svg' : 'Upload logo';
    uploadButton.querySelector('#cz-up-ic').innerHTML = on ? '<svg><use href="#m-nw"/></svg>' : '↑';
    orgBadge.innerHTML = on ? '<svg><use href="#m-nw"/></svg>' : 'Y';
    orgBadge.style.background = on ? preview.style.getPropertyValue('--pc') : '';
  }

  function setDomain(value, verified) {
    domainInput.textContent = value;
    previewUrl.textContent = verified ? value : defaultDomain;
    domainStatus.className = `cz-status${verified ? ' ok' : ''}`;
    domainStatus.querySelector('span').textContent = verified ? `Live at ${value}` : `Using ${defaultDomain}`;
  }

  async function connectDomain() {
    const value = domainInput.textContent.trim() || brandDomain;
    domainInput.textContent = value;
    domainStatus.className = 'cz-status wait';
    domainStatus.querySelector('span').textContent = 'Checking your address…';
    await wait(900);
    setDomain(value, true);
    previewUrl.classList.remove('flash');
    void previewUrl.offsetWidth;
    previewUrl.classList.add('flash');
  }

  function setToggle(name, on) {
    const toggle = toggles.find((item) => item.dataset.toggle === name);
    toggle.setAttribute('aria-checked', String(on));
    if (name === 'banner') {
      preview.classList.toggle('banner', on);
      return;
    }

    preview.querySelector(`[data-tabname="${name}"]`).classList.toggle('off', !on);
  }

  function setLanguage(language) {
    languageButtons.forEach((button) => button.classList.toggle('on', button.dataset.lang === language));
    preview.querySelectorAll('[data-en]').forEach((element) => {
      element.textContent = element.dataset[language];
    });
  }

  function resetState() {
    setTheme('classic');
    setLogo(false);
    setColor('#0542cc');
    setDomain('', false);
    setToggle('community', true);
    setToggle('exercises', true);
    setToggle('banner', false);
    setLanguage('en');
  }

  const finalState = [
    () => setTheme('editorial'),
    () => {
      setLogo(true);
      setColor('#0f8f7e');
    },
    () => setDomain(brandDomain, true),
    () => {
      setToggle('exercises', false);
      setToggle('banner', true);
      setLanguage('fr');
    }
  ];

  let runId = 0;
  let autoplay = !reduceMotion;
  let currentStep = 0;

  async function pointAt(element, id) {
    if (id !== runId) return false;

    const winBox = win.getBoundingClientRect();
    const box = element.getBoundingClientRect();
    const x = box.left - winBox.left + Math.min(box.width * 0.5, 40);
    const y = box.top - winBox.top + box.height * 0.55;
    cursor.classList.add('show');
    cursor.style.transform = `translate(${x}px, ${y}px)`;
    await wait(800);
    if (id !== runId) return false;

    cursor.classList.remove('press');
    void cursor.offsetWidth;
    cursor.classList.add('press');
    await wait(180);

    return id === runId;
  }

  async function typeDomain(id) {
    domainField.classList.add('focus');
    domainInput.textContent = '';
    for (const letter of brandDomain) {
      if (id !== runId) return false;

      domainInput.textContent += letter;
      await wait(55);
    }
    domainField.classList.remove('focus');

    return true;
  }

  const guided = [
    async (id) => {
      const target = themeButtons.find((button) => button.dataset.theme === 'editorial');
      if (await pointAt(target, id)) setTheme('editorial');
    },
    async (id) => {
      if (!(await pointAt(uploadButton, id))) return;

      setLogo(true);
      await wait(500);
      const teal = swatches.find((swatch) => swatch.dataset.color === '#0f8f7e');
      if (await pointAt(teal, id)) setColor('#0f8f7e');
    },
    async (id) => {
      if (!(await pointAt(domainField, id))) return;

      if (!(await typeDomain(id))) return;

      if (await pointAt(connectButton, id)) await connectDomain();
    },
    async (id) => {
      const exercises = toggles.find((toggle) => toggle.dataset.toggle === 'exercises');
      if (!(await pointAt(exercises, id))) return;

      setToggle('exercises', false);
      await wait(350);
      const banner = toggles.find((toggle) => toggle.dataset.toggle === 'banner');
      if (!(await pointAt(banner, id))) return;

      setToggle('banner', true);
      await wait(350);
      const french = languageButtons.find((button) => button.dataset.lang === 'fr');
      if (await pointAt(french, id)) setLanguage('fr');
    }
  ];

  function markStep(index) {
    currentStep = index;
    stepButtons.forEach((button, buttonIndex) => {
      button.setAttribute('aria-pressed', String(buttonIndex === index));
      const bar = button.querySelector('.cz-bar i');
      bar.classList.remove('run');
    });
    if (autoplay) {
      const bar = stepButtons[index].querySelector('.cz-bar i');
      bar.style.setProperty('--dur', `${stepDuration}ms`);
      void bar.offsetWidth;
      bar.classList.add('run');
    }
    selectTab(index);
  }

  async function playStep(index) {
    runId += 1;
    const id = runId;
    if (index === 0) resetState();
    for (let previous = 0; previous < index; previous += 1) finalState[previous]();
    markStep(index);
    await wait(500);
    await guided[index](id);
    if (id !== runId) return;

    await wait(900);
    cursor.classList.remove('show');
    if (!autoplay) return;

    await wait(Math.max(stepDuration - 3200, 1500));
    if (id !== runId || !autoplay) return;

    playStep((index + 1) % guided.length);
  }

  function takeOver() {
    if (!autoplay && !runId) return;

    autoplay = false;
    runId += 1;
    cursor.classList.remove('show');
    stepButtons.forEach((button) => button.querySelector('.cz-bar i').classList.remove('run'));
  }

  stepButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      autoplay = false;
      playStep(index);
    });
  });

  tabButtons.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      takeOver();
      selectTab(index);
      stepButtons.forEach((button, buttonIndex) => button.setAttribute('aria-pressed', String(buttonIndex === index)));
    });
  });
  themeButtons.forEach((button) =>
    button.addEventListener('click', () => {
      takeOver();
      setTheme(button.dataset.theme);
    })
  );
  swatches.forEach((swatch) =>
    swatch.addEventListener('click', () => {
      takeOver();
      setColor(swatch.dataset.color);
    })
  );
  uploadButton.addEventListener('click', () => {
    takeOver();
    setLogo(!preview.classList.contains('logo'));
  });
  domainField.addEventListener('click', () => {
    takeOver();
    typeDomain(runId);
  });
  connectButton.addEventListener('click', () => {
    takeOver();
    connectDomain();
  });
  toggles.forEach((toggle) =>
    toggle.addEventListener('click', (event) => {
      event.preventDefault();
      takeOver();
      setToggle(toggle.dataset.toggle, toggle.getAttribute('aria-checked') !== 'true');
    })
  );
  languageButtons.forEach((button) =>
    button.addEventListener('click', () => {
      takeOver();
      setLanguage(button.dataset.lang);
    })
  );

  resetState();
  const stage = document.querySelector('.cz-stage');
  new IntersectionObserver(
    (entries, observer) => {
      if (!entries[0].isIntersecting) return;

      observer.disconnect();
      if (reduceMotion) {
        markStep(0);
        return;
      }

      playStep(0);
    },
    { threshold: 0.45 }
  ).observe(stage);

  /* ---------- brand board ---------- */
  const section = document.getElementById('everywhere');
  const board = document.getElementById('bv-board');
  const word = document.getElementById('bv-word');
  const tagline = document.getElementById('bv-tagline');
  const boardBrands = {
    meridian: { word: 'Meridian', tagline: 'Training the people<br>who care for others' },
    northwind: { word: 'Northwind', tagline: 'Helping customers<br>get more done' },
    bloom: { word: 'Bloom', tagline: 'Teaching home bakers<br>to bake with confidence' }
  };

  function splitWord(text) {
    word.innerHTML = '';
    [...text].forEach((letter, index) => {
      const span = document.createElement('span');
      span.textContent = letter;
      span.style.setProperty('--i', index);
      word.append(span);
    });
  }
  splitWord('Meridian');
  revealObserver.observe(board);

  document.querySelectorAll('.bv-brands button').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.brand;
      document.querySelectorAll('.bv-brands button').forEach((item) => {
        item.classList.toggle('on', item === button);
        item.setAttribute('aria-pressed', String(item === button));
      });
      section.dataset.brand = key;
      splitWord(boardBrands[key].word);
      tagline.innerHTML = boardBrands[key].tagline;
      board.classList.remove('swap');
      void board.offsetWidth;
      board.classList.add('swap');
    });
  });

  const mark = board.querySelector('.bv-mark');
  const heroTile = board.querySelector('.bv-hero');
  if (!reduceMotion) {
    heroTile.addEventListener('pointermove', (event) => {
      const box = heroTile.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      mark.style.setProperty('--mx', `${x * 18}px`);
      mark.style.setProperty('--my', `${y * 18}px`);
    });
    heroTile.addEventListener('pointerleave', () => {
      mark.style.setProperty('--mx', '0px');
      mark.style.setProperty('--my', '0px');
    });
  }
})();
