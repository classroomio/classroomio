(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const nav = document.getElementById('nav');
  if (nav) {
    const updateNav = () => nav.classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();
  }

  const dropdowns = [...document.querySelectorAll('.dd')];
  if (dropdowns.length) {
    const closeDropdowns = (except) => {
      dropdowns.forEach((dropdown) => {
        if (dropdown === except) return;

        const btn = dropdown.querySelector('.dd-btn');
        const menu = dropdown.querySelector('.dd-menu');
        if (btn) btn.setAttribute('aria-expanded', 'false');
        if (menu) menu.hidden = true;
      });
    };
    dropdowns.forEach((dropdown) => {
      const button = dropdown.querySelector('.dd-btn');
      const menu = dropdown.querySelector('.dd-menu');
      if (!button || !menu) return;
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
  }

  /**
   * Wraps every word under `element` in a span so words can animate in one by one.
   * @param {Element} element
   */
  function splitWords(element) {
    let wordIndex = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
          return;
        }

        if (child.nodeType !== Node.TEXT_NODE) return;

        const fragment = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;

          if (/^\s+$/.test(part)) {
            fragment.appendChild(document.createTextNode(part));
            return;
          }

          const word = document.createElement('span');
          word.className = 'w';
          word.style.setProperty('--i', String(wordIndex));
          word.textContent = part;
          wordIndex += 1;
          fragment.appendChild(word);
        });
        child.replaceWith(fragment);
      });
    };
    walk(element);
  }

  document.querySelectorAll('[data-split]').forEach(splitWords);

  const revealTargets = document.querySelectorAll('[data-split], [data-in]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
    );
    revealTargets.forEach((target) => revealObserver.observe(target));
  } else {
    revealTargets.forEach((target) => target.classList.add('in'));
  }

  /**
   * Ties the hero avatars to the story slider: the face of the current story lifts and draws a
   * progress ring, hovering fans the stack out, faces lean toward the pointer, and a click opens that story.
   * @param {HTMLElement} storyRoot
   */
  function setupFaces(storyRoot) {
    const cluster = document.getElementById('cu-faces');
    if (!cluster) return;

    const faces = [...cluster.querySelectorAll('.cu-face')];
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    cluster.style.setProperty('--ts-dur', storyRoot.style.getPropertyValue('--ts-dur'));
    storyRoot.addEventListener('ts:change', (event) => {
      faces.forEach((face) => {
        const active = Number(face.dataset.story) === event.detail;
        face.classList.remove('on');
        if (!active) return;

        void face.offsetWidth;
        face.classList.add('on');
      });
    });
    storyRoot.addEventListener('ts:pause', (event) => cluster.classList.toggle('paused', event.detail));

    faces.forEach((face) => {
      face.addEventListener('animationend', (event) => {
        if (event.animationName === 'cu-tap') face.classList.remove('tap');
      });
      face.addEventListener('click', () => {
        const burst = document.createElement('span');
        burst.className = 'cu-burst';
        face.appendChild(burst);
        burst.addEventListener('animationend', () => burst.remove());
        face.classList.remove('tap');
        void face.offsetWidth;
        face.classList.add('tap');
        storyRoot.dispatchEvent(new CustomEvent('ts:go', { detail: Number(face.dataset.story) }));
        storyRoot.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
      });
    });

    if (!canHover || reduceMotion) return;

    const hero = cluster.closest('section');
    cluster.addEventListener('mouseenter', () => cluster.classList.add('fan'));
    cluster.addEventListener('mouseleave', () => cluster.classList.remove('fan'));
    hero.addEventListener('pointermove', (event) => {
      faces.forEach((face) => {
        const bounds = face.getBoundingClientRect();
        const deltaX = event.clientX - (bounds.left + bounds.width / 2);
        const deltaY = event.clientY - (bounds.top + bounds.height / 2);
        const distance = Math.hypot(deltaX, deltaY);
        const pull = Math.max(0, 1 - distance / 420) * (0.06 + Number(face.style.getPropertyValue('--k')) * 0.015);
        face.style.setProperty('--mx', `${(deltaX * pull).toFixed(1)}px`);
        face.style.setProperty('--my', `${(deltaY * pull).toFixed(1)}px`);
      });
    });
    hero.addEventListener('pointerleave', () => {
      faces.forEach((face) => {
        face.style.setProperty('--mx', '0px');
        face.style.setProperty('--my', '0px');
      });
    });
  }

  const storyRoot = document.getElementById('ts');
  if (storyRoot) {
    const storyTabs = [...storyRoot.querySelectorAll('.ts-tab')];
    const storySlides = [...storyRoot.querySelectorAll('.ts-slide')];
    const storyInterval = 4500;
    let storyIndex = 0;
    let storyTimer = null;
    let storyStartedAt = 0;
    let storyRemaining = storyInterval;
    let pausedByUser = reduceMotion;
    let pausedByHover = false;
    storyRoot.style.setProperty('--ts-dur', `${storyInterval}ms`);

    const haltStory = () => {
      if (!storyTimer) return;

      clearTimeout(storyTimer);
      storyTimer = null;
      storyRemaining = Math.max(0, storyRemaining - (performance.now() - storyStartedAt));
    };
    const runStory = () => {
      haltStory();
      const paused = pausedByUser || pausedByHover;
      storyRoot.classList.toggle('paused', paused);
      storyRoot.dispatchEvent(new CustomEvent('ts:pause', { detail: paused }));
      if (paused) return;

      storyStartedAt = performance.now();
      storyTimer = setTimeout(() => {
        storyTimer = null;
        showStory(storyIndex + 1);
      }, storyRemaining);
    };
    const showStory = (index) => {
      haltStory();
      storyIndex = (index + storySlides.length) % storySlides.length;
      storyRemaining = storyInterval;
      storyTabs.forEach((tab, tabIndex) => {
        const active = tabIndex === storyIndex;
        tab.classList.toggle('on', active);
        tab.setAttribute('aria-selected', String(active));
        const bar = tab.querySelector('i');
        bar.style.animation = 'none';
        void bar.offsetWidth;
        bar.style.animation = '';
      });
      storySlides.forEach((slide, slideIndex) => slide.classList.toggle('on', slideIndex === storyIndex));
      storyRoot.dispatchEvent(new CustomEvent('ts:change', { detail: storyIndex }));
      runStory();
    };

    storyTabs.forEach((tab, index) => tab.addEventListener('click', () => showStory(index)));
    storyRoot.addEventListener('ts:go', (event) => showStory(event.detail));
    setupFaces(storyRoot);
    storyRoot.dispatchEvent(new CustomEvent('ts:change', { detail: storyIndex }));
    storyRoot.querySelector('.ts-slides').addEventListener('mouseenter', () => {
      pausedByHover = true;
      runStory();
    });
    storyRoot.querySelector('.ts-slides').addEventListener('mouseleave', () => {
      pausedByHover = false;
      runStory();
    });
    runStory();
  }

  const videos = [...document.querySelectorAll('video.rp-vid')];
  if (reduceMotion) {
    videos.forEach((video) => {
      video.removeAttribute('autoplay');
      video.pause();
    });
  } else if ('IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
            return;
          }

          video.pause();
        });
      },
      { threshold: 0.2 }
    );
    videos.forEach((video) => videoObserver.observe(video));
  }
})();
