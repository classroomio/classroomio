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

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.18, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('[data-rv]').forEach((element) => revealObserver.observe(element));

  /* ---------- widget renderer ---------- */
  const COURSES = [
    { id: 'a', title: 'Getting started with Lumen', tag: 'Basics', lessons: 6, price: 'Free', rating: '4.9' },
    { id: 'b', title: 'Your first dashboard', tag: 'Basics', lessons: 8, price: 'Free', rating: '4.8' },
    { id: 'c', title: 'Sharing reports with your team', tag: 'Teams', lessons: 5, price: '$29', rating: '4.7' },
    { id: 'd', title: 'Automations that save hours', tag: 'Advanced', lessons: 9, price: '$49', rating: '4.9' },
    { id: 'e', title: 'Roles and permissions', tag: 'Teams', lessons: 4, price: 'Free', rating: '4.6' },
    { id: 'f', title: 'Forecasting made simple', tag: 'Advanced', lessons: 7, price: '$49', rating: '4.8' }
  ];
  const TAGS = ['Basics', 'Teams', 'Advanced'];
  const LAYOUTS = [
    {
      key: 'grid',
      name: 'Card grid',
      text: 'A tidy grid of course cards with plenty of room to breathe.',
      good: 'Course catalogs'
    },
    { key: 'tags', name: 'Tag filter', text: 'Visitors tap a topic to narrow a long list down.', good: 'Big catalogs' },
    {
      key: 'carousel',
      name: 'Carousel',
      text: 'A sliding row of courses that fits into a tight space.',
      good: 'Homepage sections'
    },
    {
      key: 'primary',
      name: 'Primary course',
      text: 'One large card for your flagship or newest course.',
      good: 'Launches'
    },
    { key: 'list', name: 'Compact list', text: 'A slim list that takes up very little room.', good: 'Sidebars' },
    {
      key: 'editorial',
      name: 'Editorial spotlight',
      text: 'One main pick with a few more beside it, like a magazine.',
      good: 'Blog posts'
    },
    {
      key: 'shelf',
      name: 'Category shelf',
      text: 'Courses grouped by topic on shelves that are easy to scan.',
      good: 'Catalogs by topic'
    }
  ];

  const indexOf = (course) => COURSES.indexOf(course) % 6;
  const meta = (course) =>
    `<span class="wc-meta"><span class="wc-l">${course.lessons} lessons</span><span class="wc-r">★ ${course.rating}</span></span>`;
  const thumb = (course) => `<span class="wc-th t${indexOf(course)}"><i></i></span>`;
  const card = (course) =>
    `<div class="wc">${thumb(course)}<div class="wc-bd"><span class="wc-tag">${course.tag}</span><b>${course.title}</b>${meta(course)}<span class="wc-ft"><span class="wc-p">${course.price}</span><span class="wc-cta">View course</span></span></div></div>`;
  const row = (course) =>
    `<div class="w-row">${thumb(course)}<span class="w-row-t"><b>${course.title}</b>${meta(course)}</span><span class="wc-p">${course.price}</span><span class="w-row-go">→</span></div>`;
  const tagBar = (labels, active) =>
    `<div class="w-tags">${labels.map((label, index) => `<span class="${index === active ? 'on' : ''}">${label}</span>`).join('')}</div>`;

  /**
   * Builds the markup for one widget layout.
   * @param {string} layout
   * @param {{ courses?: object[], max?: number, tag?: number }} [options]
   * @returns {string}
   */
  function renderWidget(layout, options = {}) {
    const courses = options.courses && options.courses.length ? options.courses : COURSES;
    const max = options.max || 6;
    const tag = options.tag || 0;
    if (layout === 'tags') {
      const filtered = tag === 0 ? courses : courses.filter((course) => course.tag === TAGS[tag - 1]);
      return `${tagBar(['All', ...TAGS], tag)}<div class="w-cards">${filtered.slice(0, max).map(card).join('')}</div>`;
    }

    if (layout === 'carousel') {
      const dots = '<i class="on"></i><i></i><i></i>';
      return `<div class="w-car"><div class="w-car-track">${[...courses, ...courses].map(card).join('')}</div></div><div class="w-car-nav"><span class="w-dots">${dots}</span><span class="w-arrows"><b>‹</b><b>›</b></span></div>`;
    }

    if (layout === 'primary') {
      const course = courses[0];
      return `<div class="w-pri">${thumb(course)}<div class="w-pri-bd"><span class="w-eyebrow">New course</span><b>${course.title}</b><p>Learn the basics in a weekend, at your own pace.</p>${meta(course)}<span class="w-pri-ft"><span class="w-btn">Start learning</span><span class="wc-p">${course.price}</span></span></div></div>`;
    }

    if (layout === 'list') return `<div class="w-list">${courses.slice(0, Math.min(max, 4)).map(row).join('')}</div>`;

    if (layout === 'editorial') {
      const [main, ...rest] = courses;
      return `<div class="w-ed"><div class="w-ed-main">${thumb(main)}<span class="w-eyebrow">Editor's pick</span><b>${main.title}</b><p>Our most popular course, picked by the Lumen team.</p></div><div class="w-ed-side">${rest.slice(0, 3).map(row).join('')}</div></div>`;
    }

    if (layout === 'shelf') {
      const shelfTag = TAGS[tag % TAGS.length];
      const shelf = courses.filter((course) => course.tag === shelfTag);
      const items = shelf.length ? shelf : courses.slice(0, 2);
      return `${tagBar(TAGS, tag % TAGS.length)}<div class="w-shelf">${items.map(card).join('')}</div>`;
    }

    return `<div class="w-cards">${courses.slice(0, max).map(card).join('')}</div>`;
  }

  /* ---------- hero ---------- */
  const hero = document.getElementById('hero');
  const slot = document.getElementById('pl-slot');
  const slotInner = document.getElementById('pl-slot-in');
  const chips = [...document.querySelectorAll('.pl-chip')];
  let heroLayout = '';
  let heroBusy = false;
  let heroPausedUntil = 0;

  function paintHero(layout) {
    heroLayout = layout;
    slotInner.className = `pl-slot-in w wl-${layout}`;
    slotInner.innerHTML = renderWidget(layout, { max: 3 });
    chips.forEach((chip) => chip.classList.toggle('on', chip.dataset.layout === layout));
  }

  async function snapHero(layout) {
    if (layout === heroLayout || heroBusy) return;

    const chip = chips.find((item) => item.dataset.layout === layout);
    if (reduceMotion || !chip.offsetWidth || !slot.offsetWidth) {
      paintHero(layout);
      return;
    }

    heroBusy = true;
    chips.forEach((item) => item.classList.toggle('on', item === chip));
    const from = chip.querySelector('.pl-chip-th').getBoundingClientRect();
    const to = slot.getBoundingClientRect();
    const ghost = chip.querySelector('.pl-chip-th').cloneNode(true);
    ghost.classList.add('pl-ghost');
    Object.assign(ghost.style, {
      left: `${from.left}px`,
      top: `${from.top}px`,
      width: `${from.width}px`,
      height: `${from.height}px`
    });
    document.body.append(ghost);
    const scaleX = to.width / from.width;
    const scaleY = to.height / from.height;
    const moveX = to.left - from.left;
    const moveY = to.top - from.top;
    const flight = ghost.animate(
      [
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${moveX}px, ${moveY}px) scale(${scaleX}, ${scaleY})`, opacity: 0.25 }
      ],
      { duration: 620, easing: 'cubic-bezier(0.6, 0, 0.2, 1)', fill: 'forwards' }
    );
    slot.classList.add('out');
    await wait(380);
    paintHero(layout);
    slot.classList.remove('out');
    slot.classList.remove('pop');
    void slot.offsetWidth;
    slot.classList.add('pop');
    await flight.finished.catch(() => {});
    ghost.remove();
    heroBusy = false;
  }

  chips.forEach((chip) =>
    chip.addEventListener('click', () => {
      heroPausedUntil = Date.now() + 9000;
      snapHero(chip.dataset.layout);
    })
  );

  paintHero('grid');
  requestAnimationFrame(() => hero.classList.add('in'));

  let heroVisible = true;
  new IntersectionObserver((entries) => {
    heroVisible = entries[0].isIntersecting;
  }).observe(hero);
  if (!reduceMotion) {
    setInterval(() => {
      if (!heroVisible || document.hidden || Date.now() < heroPausedUntil) return;

      const current = chips.findIndex((chip) => chip.dataset.layout === heroLayout);
      snapHero(chips[(current + 1) % chips.length].dataset.layout);
    }, 3800);
  }

  /* ---------- guided editor ---------- */
  const editor = document.getElementById('pb-ed');
  const stepItems = [...document.querySelectorAll('.pb-step')];
  const railButtons = [...document.querySelectorAll('.pb-rail button')];
  const groups = [...document.querySelectorAll('.pb-group')];
  const courseList = document.getElementById('pb-courses');
  const layoutGrid = document.getElementById('pb-layouts');
  const modeButtons = [...document.querySelectorAll('#pb-mode button')];
  const presetButtons = [...document.querySelectorAll('#pb-presets button')];
  const radiusInput = document.getElementById('pb-radius');
  const showToggles = [...document.querySelectorAll('.pb-tg [role="switch"]')];
  const formatButtons = [...document.querySelectorAll('#pb-format button')];
  const code = document.getElementById('pb-code');
  const copyButton = document.getElementById('pb-copy');
  const versions = document.getElementById('pb-versions');
  const publishButton = document.getElementById('pb-publish');
  const status = document.getElementById('pb-status');
  const preview = document.getElementById('pb-preview');
  const frame = document.getElementById('pb-frame');
  const viewportButtons = [...document.querySelectorAll('#pb-vp button')];

  const EMBED = {
    html: '<div data-cio-widget="course-widget"\n     data-widget-key="wk_8f2k1"></div>\n<script async type="module"\n  src="https://…/course-widget"></script>',
    url: 'https://…/embed/course-widget/wk_8f2k1'
  };

  const state = {
    mode: 'manual',
    selected: new Set(['a']),
    layout: 'grid',
    preset: 'classroomio',
    radius: 12,
    show: { price: true, rating: true, lessons: true },
    format: 'html',
    published: false
  };

  courseList.innerHTML = COURSES.map(
    (course) =>
      `<li><button type="button" data-course="${course.id}" aria-pressed="false"><i class="pb-check"></i><span class="wc-th t${indexOf(course)}"><i></i></span><span class="pb-ct"><b>${course.title}</b><em>${course.lessons} lessons · ${course.tag}</em></span></button></li>`
  ).join('');
  layoutGrid.innerHTML = LAYOUTS.map(
    (layout) =>
      `<button type="button" data-layout="${layout.key}"><span class="lt lt-${layout.key}"><i></i><i></i><i></i><i></i></span>${layout.name}</button>`
  ).join('');
  const courseButtons = [...courseList.querySelectorAll('button')];
  const layoutButtons = [...layoutGrid.querySelectorAll('button')];

  function selectedCourses() {
    if (state.mode === 'published') return COURSES;

    return COURSES.filter((course) => state.selected.has(course.id));
  }

  function renderEditor() {
    courseButtons.forEach((button) => {
      const on = state.mode === 'published' || state.selected.has(button.dataset.course);
      button.setAttribute('aria-pressed', String(on));
    });
    courseList.classList.toggle('all', state.mode === 'published');
    modeButtons.forEach((button) => button.classList.toggle('on', button.dataset.mode === state.mode));
    layoutButtons.forEach((button) => button.classList.toggle('on', button.dataset.layout === state.layout));
    presetButtons.forEach((button) => button.classList.toggle('on', button.dataset.preset === state.preset));
    radiusInput.value = state.radius;
    showToggles.forEach((toggle) => toggle.setAttribute('aria-checked', String(state.show[toggle.dataset.show])));
    formatButtons.forEach((button) => button.classList.toggle('on', button.dataset.format === state.format));
    code.textContent = EMBED[state.format];
    copyButton.textContent = state.format === 'html' ? 'Copy embed' : 'Copy link';
    status.textContent = state.published ? 'Live' : 'Draft';
    status.classList.toggle('live', state.published);

    preview.className = `pb-frame-in w wl-${state.layout} p-${state.preset}${state.show.price ? '' : ' no-price'}${state.show.rating ? '' : ' no-rating'}${state.show.lessons ? '' : ' no-lessons'}`;
    preview.style.setProperty('--wr', `${state.radius}px`);
    preview.innerHTML = renderWidget(state.layout, { courses: selectedCourses() });
  }

  function flash(element) {
    element.classList.remove('flash');
    void element.offsetWidth;
    element.classList.add('flash');
  }

  function resetState() {
    state.mode = 'manual';
    state.selected = new Set(['a']);
    state.layout = 'grid';
    state.preset = 'classroomio';
    state.radius = 12;
    state.show = { price: true, rating: true, lessons: true };
    state.format = 'html';
    state.published = false;
    versions.querySelector('.new')?.remove();
    copyButton.classList.remove('done');
  }

  function addVersion() {
    if (versions.querySelector('.new')) return;

    const item = document.createElement('li');
    item.className = 'new';
    item.innerHTML = '<span>Version 3</span><em>Live now</em>';
    versions.prepend(item);
  }

  const finalState = [
    () => ['a', 'b', 'd', 'f'].forEach((id) => state.selected.add(id)),
    () => {
      state.layout = 'carousel';
    },
    () => {
      state.preset = 'spruce';
      state.radius = 20;
      state.show.lessons = false;
    },
    () => {
      state.published = true;
      addVersion();
    }
  ];

  let runId = 0;
  let guided = !reduceMotion;
  let currentStep = -1;

  const guidedActions = [
    async (id) => {
      for (const courseId of ['b', 'd', 'f']) {
        await wait(420);
        if (id !== runId) return;

        state.selected.add(courseId);
        renderEditor();
        flash(courseButtons.find((button) => button.dataset.course === courseId));
      }
    },
    async (id) => {
      for (const key of ['primary', 'carousel']) {
        await wait(700);
        if (id !== runId) return;

        state.layout = key;
        renderEditor();
        flash(layoutButtons.find((button) => button.dataset.layout === key));
      }
    },
    async (id) => {
      await wait(500);
      if (id !== runId) return;

      state.preset = 'spruce';
      renderEditor();
      flash(presetButtons.find((button) => button.dataset.preset === 'spruce'));
      for (let radius = 13; radius <= 20; radius += 1) {
        await wait(45);
        if (id !== runId) return;

        state.radius = radius;
        renderEditor();
      }
      await wait(500);
      if (id !== runId) return;

      state.show.lessons = false;
      renderEditor();
      flash(showToggles.find((toggle) => toggle.dataset.show === 'lessons'));
    },
    async (id) => {
      await wait(500);
      if (id !== runId) return;

      flash(publishButton);
      state.published = true;
      addVersion();
      renderEditor();
      await wait(700);
      if (id !== runId) return;

      flash(copyButton);
      copyButton.classList.add('done');
      copyButton.textContent = 'Copied';
    }
  ];

  function showTab(index) {
    railButtons.forEach((button, buttonIndex) => button.classList.toggle('on', buttonIndex === index));
    groups.forEach((group, groupIndex) => group.classList.toggle('on', groupIndex === index));
  }

  function setStep(index) {
    if (index === currentStep) return;

    currentStep = index;
    runId += 1;
    const id = runId;
    stepItems.forEach((item, itemIndex) =>
      item.querySelector('button').setAttribute('aria-pressed', String(itemIndex === index))
    );
    showTab(index);
    if (reduceMotion) {
      resetState();
      for (let previous = 0; previous <= index; previous += 1) finalState[previous]();
      renderEditor();
      return;
    }

    if (!guided) return;

    resetState();
    for (let previous = 0; previous < index; previous += 1) finalState[previous]();
    renderEditor();
    guidedActions[index](id);
  }

  function takeOver() {
    guided = false;
    runId += 1;
  }

  const desktop = window.matchMedia('(min-width: 1001px)');
  let scrollLockUntil = 0;
  stepItems.forEach((item, index) =>
    item.querySelector('button').addEventListener('click', () => {
      stopAutoplay();
      guided = !reduceMotion;
      scrollLockUntil = Date.now() + 1000;
      if (desktop.matches) {
        item.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      }
      currentStep = -1;
      setStep(index);
    })
  );

  const stepObserver = new IntersectionObserver(
    (entries) => {
      if (!desktop.matches || Date.now() < scrollLockUntil) return;

      entries.forEach((entry) => {
        if (entry.isIntersecting) setStep(Number(entry.target.dataset.step));
      });
    },
    { rootMargin: '-45% 0px -45% 0px' }
  );
  stepItems.forEach((item) => stepObserver.observe(item));

  let autoplayTimer = 0;
  function stopAutoplay() {
    clearInterval(autoplayTimer);
    autoplayTimer = 0;
  }
  new IntersectionObserver(
    (entries) => {
      const visible = entries[0].isIntersecting;
      if (desktop.matches) return;

      if (!visible) {
        stopAutoplay();
        return;
      }

      if (currentStep === -1) setStep(0);
      if (reduceMotion || !guided || autoplayTimer) return;

      autoplayTimer = setInterval(() => setStep((currentStep + 1) % stepItems.length), 6500);
    },
    { threshold: 0.4 }
  ).observe(editor);

  railButtons.forEach((button, index) =>
    button.addEventListener('click', () => {
      takeOver();
      stopAutoplay();
      showTab(index);
    })
  );
  courseButtons.forEach((button) =>
    button.addEventListener('click', () => {
      takeOver();
      stopAutoplay();
      state.mode = 'manual';
      const id = button.dataset.course;
      if (state.selected.has(id) && state.selected.size > 1) state.selected.delete(id);
      else state.selected.add(id);
      renderEditor();
    })
  );
  modeButtons.forEach((button) =>
    button.addEventListener('click', () => {
      takeOver();
      stopAutoplay();
      state.mode = button.dataset.mode;
      renderEditor();
    })
  );
  layoutButtons.forEach((button) =>
    button.addEventListener('click', () => {
      takeOver();
      stopAutoplay();
      state.layout = button.dataset.layout;
      renderEditor();
    })
  );
  presetButtons.forEach((button) =>
    button.addEventListener('click', () => {
      takeOver();
      stopAutoplay();
      state.preset = button.dataset.preset;
      renderEditor();
    })
  );
  radiusInput.addEventListener('input', () => {
    takeOver();
    stopAutoplay();
    state.radius = Number(radiusInput.value);
    renderEditor();
  });
  showToggles.forEach((toggle) =>
    toggle.addEventListener('click', (event) => {
      event.preventDefault();
      takeOver();
      stopAutoplay();
      state.show[toggle.dataset.show] = !state.show[toggle.dataset.show];
      renderEditor();
    })
  );
  formatButtons.forEach((button) =>
    button.addEventListener('click', () => {
      takeOver();
      stopAutoplay();
      state.format = button.dataset.format;
      copyButton.classList.remove('done');
      renderEditor();
    })
  );
  copyButton.addEventListener('click', () => {
    takeOver();
    stopAutoplay();
    copyButton.classList.add('done');
    copyButton.textContent = 'Copied';
  });
  publishButton.addEventListener('click', () => {
    takeOver();
    stopAutoplay();
    state.published = true;
    addVersion();
    renderEditor();
    flash(status);
  });
  viewportButtons.forEach((button) =>
    button.addEventListener('click', () => {
      viewportButtons.forEach((item) => item.classList.toggle('on', item === button));
      frame.dataset.vp = button.dataset.vp;
    })
  );

  renderEditor();
  showTab(0);

  /* ---------- layout gallery ---------- */
  const gallery = document.getElementById('pg-grid');
  gallery.innerHTML = LAYOUTS.map(
    (layout, index) =>
      `<article class="pg-card pgc-${layout.key}" data-rv style="--rv:${index % 3}"><div class="pg-mini"><div class="w wl-${layout.key}" data-layout="${layout.key}">${renderWidget(layout.key, { max: layout.key === 'grid' ? 4 : 6 })}</div></div><div class="pg-txt"><h3>${layout.name}</h3><p>${layout.text}</p><span class="pg-good">Good for · ${layout.good}</span></div></article>`
  ).join('');
  gallery.querySelectorAll('[data-rv]').forEach((element) => revealObserver.observe(element));

  gallery.querySelectorAll('.pgc-tags, .pgc-shelf').forEach((galleryCard) => {
    const widget = galleryCard.querySelector('.w');
    const layout = widget.dataset.layout;
    let tag = 0;
    let timer = 0;
    const tick = () => {
      tag = layout === 'tags' ? (tag + 1) % 4 : (tag + 1) % 3;
      widget.innerHTML = renderWidget(layout, { tag });
    };
    galleryCard.addEventListener('pointerenter', () => {
      if (reduceMotion || timer) return;

      tick();
      timer = setInterval(tick, 1100);
    });
    galleryCard.addEventListener('pointerleave', () => {
      clearInterval(timer);
      timer = 0;
    });
  });

  const swatches = [...document.querySelectorAll('#pg-sw button')];
  swatches.forEach((swatch) =>
    swatch.addEventListener('click', () => {
      swatches.forEach((item) => item.classList.toggle('on', item === swatch));
      gallery.style.setProperty('--wc', swatch.dataset.color);
    })
  );
})();
