(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
      runStory();
    };

    storyTabs.forEach((tab, index) => tab.addEventListener('click', () => showStory(index)));
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
})();
