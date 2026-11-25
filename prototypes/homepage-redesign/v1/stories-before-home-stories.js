(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * Customer quote tabs: rotate every few seconds while in view, stop once
   * the visitor picks a tab, and support arrow-key navigation.
   */
  function setupStories(root) {
    if (!root) return;

    const tabs = [...root.querySelectorAll('[role="tab"]')];
    const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));
    const rotateMs = 7000;
    let current = 0;
    let timer = 0;
    let visible = false;
    let held = reduceMotion;

    root.style.setProperty('--dur', `${rotateMs}ms`);
    tabs.forEach((tab) => tab.insertAdjacentHTML('beforeend', '<i aria-hidden="true"></i>'));
    root.classList.toggle('hold', held);

    const select = (index, focus) => {
      current = (index + tabs.length) % tabs.length;
      tabs.forEach((tab, tabIndex) => {
        const active = tabIndex === current;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        panels[tabIndex].hidden = !active;
      });
      if (focus) tabs[current].focus();
      schedule();
    };

    function schedule() {
      clearTimeout(timer);
      if (held || !visible) return;

      timer = setTimeout(() => select(current + 1, false), rotateMs);
    }

    const hold = () => {
      held = true;
      root.classList.add('hold');
      clearTimeout(timer);
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        hold();
        select(index, false);
      });
      tab.addEventListener('keydown', (event) => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
        if (!step) return;

        event.preventDefault();
        hold();
        select(current + step, true);
      });
    });

    new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        schedule();
      },
      { threshold: 0.4 }
    ).observe(root);
  }

  setupStories(document.getElementById('ts'));
})();
