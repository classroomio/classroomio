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
   * Monthly / yearly switch: slides the knob, swaps every price and billing
   * line that carries data-monthly / data-yearly, and ticks changed prices.
   * @param {HTMLElement | null} toggle
   */
  function setupBilling(toggle) {
    if (!toggle) return;

    const options = [...toggle.querySelectorAll('[role="radio"]')];
    const knob = toggle.querySelector('.pr-toggle-knob');
    const pricedElements = [...document.querySelectorAll('[data-monthly][data-yearly]')];
    const selectedOption = () => options.find((option) => option.getAttribute('aria-checked') === 'true') || options[0];

    const moveKnob = (option) => {
      knob.style.width = `${option.offsetWidth}px`;
      knob.style.transform = `translateX(${option.offsetLeft}px)`;
    };

    const restartTick = (element) => {
      element.classList.remove('tick');
      requestAnimationFrame(() => element.classList.add('tick'));
    };

    const choose = (option, focus) => {
      const period = option.dataset.period;
      options.forEach((item) => {
        const active = item === option;
        item.setAttribute('aria-checked', String(active));
        item.tabIndex = active ? 0 : -1;
      });
      if (focus) option.focus();
      moveKnob(option);
      pricedElements.forEach((element) => {
        const value = element.dataset[period];
        const isPrice = element.tagName === 'B';
        const text = isPrice && !value.startsWith('$') ? `$${value}` : value;
        if (element.textContent === text) return;

        element.textContent = text;
        if (isPrice && !reduceMotion) restartTick(element);
      });
    };

    options.forEach((option, index) => {
      option.addEventListener('click', () => choose(option, false));
      option.addEventListener('keydown', (event) => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
        if (!step) return;

        event.preventDefault();
        choose(options[(index + step + options.length) % options.length], true);
      });
    });

    options.forEach((option) => {
      option.tabIndex = option === selectedOption() ? 0 : -1;
    });
    moveKnob(selectedOption());
    window.addEventListener('resize', () => moveKnob(selectedOption()));
    if (document.fonts) document.fonts.ready.then(() => moveKnob(selectedOption()));
  }

  setupBilling(document.querySelector('.pr-toggle'));
})();
