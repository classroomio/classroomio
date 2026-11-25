(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const nav = document.getElementById('nav');
  const updateNav = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  const burger = document.getElementById('burger');
  const sheet = document.getElementById('sheet');
  burger.addEventListener('click', () => {
    const isOpen = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!isOpen));
    sheet.hidden = isOpen;
  });

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

  const heroVisual = document.getElementById('hero-visual');
  requestAnimationFrame(() => requestAnimationFrame(() => heroVisual.classList.add('go')));

  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (canHover && !reduceMotion) {
    const floaters = [...heroVisual.querySelectorAll('[data-depth]')];
    heroVisual.addEventListener('pointermove', (event) => {
      const bounds = heroVisual.getBoundingClientRect();
      const offsetX = (event.clientX - bounds.left) / bounds.width - 0.5;
      const offsetY = (event.clientY - bounds.top) / bounds.height - 0.5;
      floaters.forEach((floater) => {
        const depth = Number(floater.dataset.depth);
        floater.style.setProperty('--px', `${(-offsetX * depth).toFixed(1)}px`);
        floater.style.setProperty('--py', `${(-offsetY * depth).toFixed(1)}px`);
      });
    });
    heroVisual.addEventListener('pointerleave', () => {
      floaters.forEach((floater) => {
        floater.style.setProperty('--px', '0px');
        floater.style.setProperty('--py', '0px');
      });
    });

    document.querySelectorAll('.mv-card').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const bounds = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${event.clientX - bounds.left}px`);
        card.style.setProperty('--my', `${event.clientY - bounds.top}px`);
      });
    });
  }

  const parallaxItems = [...document.querySelectorAll('[data-par]')];
  if (parallaxItems.length && !reduceMotion) {
    let ticking = false;
    const updateParallax = () => {
      ticking = false;
      const viewportHeight = window.innerHeight;
      parallaxItems.forEach((item) => {
        const bounds = item.getBoundingClientRect();
        const progress = (bounds.top + bounds.height / 2 - viewportHeight / 2) / viewportHeight;
        const clamped = Math.max(-1, Math.min(1, progress));
        item.style.setProperty('--pv', `${(clamped * Number(item.dataset.par)).toFixed(1)}px`);
        const image = item.querySelector('img');
        if (image && item.classList.contains('st-photo'))
          image.style.transform = `scale(1.12) translateY(${(clamped * -24).toFixed(1)}px)`;
      });
    };
    window.addEventListener(
      'scroll',
      () => {
        if (ticking) return;

        ticking = true;
        requestAnimationFrame(updateParallax);
      },
      { passive: true }
    );
    updateParallax();
  }

  const track = document.getElementById('team-track');
  track.querySelectorAll('.ab-card').forEach((card, index) => card.style.setProperty('--n', String(index)));
  const prevButton = document.getElementById('team-prev');
  const nextButton = document.getElementById('team-next');
  const scrollStep = () => {
    const card = track.querySelector('.ab-card');
    const gap = parseFloat(getComputedStyle(track).columnGap) || 16;
    return card.getBoundingClientRect().width + gap;
  };
  const updateArrows = () => {
    const maxScroll = track.scrollWidth - track.clientWidth - 2;
    prevButton.disabled = track.scrollLeft <= 2;
    nextButton.disabled = track.scrollLeft >= maxScroll;
  };
  /**
   * Eases the team track horizontally by `distance` pixels, then lets scroll snapping settle it.
   * @param {number} distance
   */
  const glideTrack = (distance) => {
    const start = track.scrollLeft;
    const maxScroll = track.scrollWidth - track.clientWidth;
    const target = Math.max(0, Math.min(maxScroll, start + distance));
    if (reduceMotion) {
      track.scrollLeft = target;
      return;
    }

    const duration = 520;
    const startTime = performance.now();
    track.style.scrollSnapType = 'none';
    const frame = (now) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      track.scrollLeft = start + (target - start) * eased;
      if (progress < 1) {
        requestAnimationFrame(frame);
        return;
      }

      track.style.scrollSnapType = '';
    };
    requestAnimationFrame(frame);
  };
  prevButton.addEventListener('click', () => glideTrack(-scrollStep()));
  nextButton.addEventListener('click', () => glideTrack(scrollStep()));
  track.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', updateArrows);
  updateArrows();
})();
