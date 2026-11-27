(function () {
  const root = document.getElementById('dx');
  if (!root) return;

  const steps = [...root.querySelectorAll('.dx-step')];
  const panes = [...root.querySelectorAll('.dx-pane')];
  const fill = root.querySelector('.dx-line i');
  const notch = root.querySelector('.dx-notch');
  const card = root.querySelector('.dx-card');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STEP_MS = 3600;
  let current = 0;
  let timer = 0;
  let visible = false;

  const placeNotch = () => {
    const dot = steps[current].querySelector('.dx-dot').getBoundingClientRect();
    const box = card.getBoundingClientRect();
    const notchX = Math.min(box.width - 20, Math.max(20, dot.left + dot.width / 2 - box.left));
    notch.style.setProperty('--nx', `${notchX}px`);
  };

  /**
   * Shows one step: earlier steps are done, this one runs its pane animation.
   */
  const show = (index) => {
    current = index;
    steps.forEach((step, stepIndex) => {
      step.classList.toggle('done', stepIndex < index);
      step.classList.toggle('on', stepIndex === index);
    });
    fill.style.setProperty('--fill', `${(index / (steps.length - 1)) * 100}%`);
    panes.forEach((pane, paneIndex) => {
      pane.classList.remove('run');
      pane.classList.toggle('on', paneIndex === index);
    });
    placeNotch();
    const pane = panes[index];
    void pane.offsetWidth;
    requestAnimationFrame(() => pane.classList.add('run'));
  };

  const schedule = () => {
    clearTimeout(timer);
    if (!visible || reduceMotion) return;

    const isLast = current === steps.length - 1;
    timer = setTimeout(() => {
      if (isLast) {
        steps[current].classList.add('done');
        steps[current].classList.remove('on');
        timer = setTimeout(() => {
          show(0);
          schedule();
        }, 1400);
        return;
      }

      show(current + 1);
      schedule();
    }, STEP_MS);
  };

  steps.forEach((step, index) => {
    step.addEventListener('click', () => {
      show(index);
      schedule();
    });
  });

  window.addEventListener('resize', placeNotch);
  show(0);
  if (reduceMotion) panes.forEach((pane) => pane.classList.add('run'));

  new IntersectionObserver(
    (entries) => {
      const nowVisible = entries.some((entry) => entry.isIntersecting);
      if (nowVisible && !visible) {
        visible = true;
        show(current);
        schedule();
      }
      if (!nowVisible) {
        visible = false;
        clearTimeout(timer);
      }
    },
    { rootMargin: '0px 0px -10% 0px' }
  ).observe(root);
})();
