(function () {
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const burger = document.getElementById('burger');
  const sheet = document.getElementById('sheet');
  burger.addEventListener('click', () => {
    const isOpen = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!isOpen));
    sheet.hidden = isOpen;
  });
  sheet.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      burger.setAttribute('aria-expanded', 'false');
      sheet.hidden = true;
    }
  });

  const solutionsButton = document.getElementById('solutions-btn');
  const solutionsMenu = document.getElementById('solutions-menu');
  const setSolutions = (isOpen) => {
    solutionsButton.setAttribute('aria-expanded', String(isOpen));
    solutionsMenu.hidden = !isOpen;
  };
  solutionsButton.addEventListener('click', (event) => {
    event.stopPropagation();
    setSolutions(solutionsMenu.hidden);
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.dd')) setSolutions(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setSolutions(false);
  });

  /**
   * Wires a set of tab buttons to the panes that share their `data-target` names.
   * @param {Element[]} buttons
   * @param {Element} paneRoot
   * @param {(index: number) => void} [onChange]
   */
  function bindTabs(buttons, paneRoot, onChange) {
    const panes = [...paneRoot.querySelectorAll(':scope > [data-pane]')];
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => {
        buttons.forEach((other) => {
          const isActive = other === button;
          other.classList.toggle('on', isActive);
          other.setAttribute('aria-selected', String(isActive));
        });
        panes.forEach((pane) => {
          pane.hidden = pane.dataset.pane !== button.dataset.target;
        });
        if (onChange) onChange(index);
      });
    });
  }

  const feature = document.querySelector('[data-feature]');
  bindTabs([...feature.querySelectorAll('.acc-i')], feature.querySelector('.feature-stage'));

  document.querySelectorAll('[data-tabs]').forEach((group) => {
    const name = group.dataset.tabs;
    const paneRoot = document.querySelector(`[data-tabpanes="${name}"]`);
    const buttons = [...group.querySelectorAll('[role="tab"]')];
    if (name === 'journey') {
      const progress = group.querySelector('.j-progress i');
      bindTabs(buttons, paneRoot, (index) => {
        progress.style.width = `${((index + 1) / buttons.length) * 100}%`;
      });
      return;
    }

    bindTabs(buttons, paneRoot);
  });

  if (!('IntersectionObserver' in window)) return;

  window.addEventListener('load', setupReveal, { once: true });

  function setupReveal() {
    const revealTargets = document.querySelectorAll('.block > *, .dark-in > *, .cta-panel > *, .story > *');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );
    revealTargets.forEach((target) => {
      const rect = target.getBoundingClientRect();
      if (rect.top < window.innerHeight) return;

      target.classList.add('reveal');
      observer.observe(target);
    });
  }
})();
