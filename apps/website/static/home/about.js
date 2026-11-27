(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const nav = document.getElementById('nav');
  const updateNav = () => nav && nav.classList.toggle('scrolled', window.scrollY > 8);
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

  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /**
   * Builds the About hero's isometric tile field and runs the feature tour: the key tile
   * hops between feature tiles, each landing opens a card describing that feature.
   * Also wires hover lift, click-to-hop, ripples, the step rail and the scroll tilt.
   * @param {HTMLElement} stage The `.ah-stage` element holding the scene.
   */
  function setupTileHero(stage) {
    if (!stage) return;

    const plane = stage.querySelector('#ah-plane');
    const scene = stage.querySelector('.ah-scene');
    const keyTile = stage.querySelector('#ah-key');
    const card = stage.querySelector('#ah-card');
    const hint = stage.querySelector('#ah-hint');
    const rail = stage.querySelector('#ah-rail');
    const railButtons = [...rail.querySelectorAll('button')];
    const gridSize = 11;
    const stepDuration = 4500;
    const tiles = [];
    const steps = [...stage.querySelector('#ah-steps').children].map((node) => {
      const icon = node.querySelector('.ah-ic');
      const cardNodes = [...node.children].filter((child) => child !== icon);
      return { col: Number(node.dataset.col), row: Number(node.dataset.row), icon, cardNodes, tile: null };
    });
    const keyCell = { col: steps[0].col, row: steps[0].row };
    let activeStep = -1;
    let advanceTimer = 0;
    let currentArc = null;
    let isVisible = true;

    stage.style.setProperty('--ah-top', `${stage.getBoundingClientRect().top + window.scrollY}px`);

    const fragment = document.createDocumentFragment();
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const tileElement = document.createElement('i');
        tileElement.className = 'ah-t';
        tileElement.style.setProperty('--c', col);
        tileElement.style.setProperty('--r', row);
        tileElement.style.setProperty('--d', `${((col + gridSize - row) * 45).toFixed(0)}ms`);
        tileElement.appendChild(document.createElement('b'));
        fragment.appendChild(tileElement);
        tiles.push({ element: tileElement, col, row, centerX: 0, centerY: 0, step: -1 });
      }
    }
    plane.insertBefore(fragment, plane.firstChild);

    steps.forEach((step, index) => {
      const tile = tiles.find((candidate) => candidate.col === step.col && candidate.row === step.row);
      const faceIcon = document.createElement('i');
      faceIcon.className = 'ah-face-ic';
      faceIcon.appendChild(step.icon.cloneNode(true));
      tile.element.classList.add('feat');
      tile.element.firstChild.appendChild(faceIcon);
      tile.step = index;
      step.tile = tile;
    });

    const gridDistance = (tile, cell) => Math.hypot(tile.col - cell.col, tile.row - cell.row);

    const paintGlow = () => {
      tiles.forEach((tile) => {
        const glow = Math.max(0, 1 - gridDistance(tile, keyCell) / 2.4);
        tile.element.style.setProperty('--g', glow.toFixed(2));
      });
    };

    const measure = () => {
      const sceneBounds = scene.getBoundingClientRect();
      tiles.forEach((tile) => {
        const bounds = tile.element.firstChild.getBoundingClientRect();
        tile.centerX = bounds.left + bounds.width / 2 - sceneBounds.left;
        tile.centerY = bounds.top + bounds.height / 2 - sceneBounds.top;
      });
    };

    const nearestTile = (pointX, pointY, maxDistance) => {
      let closest = null;
      let closestDistance = maxDistance;
      tiles.forEach((tile) => {
        const distance = Math.hypot(tile.centerX - pointX, tile.centerY - pointY);
        if (distance < closestDistance) {
          closest = tile;
          closestDistance = distance;
        }
      });
      return closest;
    };

    const placeCard = () => {
      const stageBounds = stage.getBoundingClientRect();
      const keyBounds = keyTile.firstChild.getBoundingClientRect();
      const halfWidth = card.offsetWidth / 2 + 12;
      const centerX = keyBounds.left + keyBounds.width / 2 - stageBounds.left;
      const clampedX = Math.min(Math.max(centerX, halfWidth), stageBounds.width - halfWidth);
      card.style.setProperty('--cx', `${clampedX.toFixed(1)}px`);
      const anchorY = keyBounds.top - stageBounds.top + keyBounds.height * 0.22;
      const minAnchorY = card.offsetHeight + 26 + 12;
      card.style.setProperty('--cy', `${Math.max(anchorY, minAnchorY).toFixed(1)}px`);
    };

    const followKey = () => {
      const followUntil = performance.now() + 900;
      const step = () => {
        placeCard();
        if (performance.now() < followUntil) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const openCard = (index) => {
      card.replaceChildren(...steps[index].cardNodes.map((node) => node.cloneNode(true)));
      placeCard();
      void card.offsetWidth;
      card.classList.add('show');
      followKey();
    };

    const ripple = (cell) => {
      if (reduceMotion) return;

      tiles.forEach((tile) => {
        const distance = gridDistance(tile, cell);
        const strength = Math.max(0.15, 1 - distance / 7);
        tile.element.animate(
          [
            { translate: '0 0 0' },
            { translate: `0 0 ${(-16 * strength).toFixed(1)}px` },
            { translate: `0 0 ${(12 * strength).toFixed(1)}px` },
            { translate: '0 0 0' }
          ],
          { duration: 900, delay: distance * 70, easing: 'cubic-bezier(.3, .7, .4, 1)' }
        );
      });
    };

    const land = () => {
      keyTile.classList.remove('land');
      void keyTile.offsetWidth;
      keyTile.classList.add('land');
      ripple(keyCell);
    };

    const hop = (cell, onLand) => {
      currentArc?.cancel();
      currentArc = null;
      const isSameCell = cell.col === keyCell.col && cell.row === keyCell.row;
      keyCell.col = cell.col;
      keyCell.row = cell.row;
      plane.style.setProperty('--kc', cell.col);
      plane.style.setProperty('--kr', cell.row);
      paintGlow();
      if (isSameCell || reduceMotion) {
        if (!reduceMotion) land();
        onLand?.();
        return;
      }

      currentArc = keyTile.animate(
        [{ translate: '0 0 0' }, { translate: '0 0 170px', offset: 0.45 }, { translate: '0 0 0' }],
        { duration: 700, easing: 'cubic-bezier(.45, 0, .35, 1)' }
      );
      currentArc.onfinish = () => {
        currentArc = null;
        land();
        onLand?.();
      };
    };

    const markNext = (index) => {
      steps.forEach((step, stepIndex) => step.tile.element.classList.toggle('next', stepIndex === index));
    };

    const scheduleAdvance = (delay) => {
      window.clearTimeout(advanceTimer);
      if (reduceMotion) return;

      advanceTimer = window.setTimeout(function advance() {
        if (!isVisible || document.hidden) {
          advanceTimer = window.setTimeout(advance, 1000);
          return;
        }

        showStep((activeStep + 1) % steps.length);
      }, delay);
    };

    const showStep = (index) => {
      activeStep = index;
      card.classList.remove('show');
      rail.classList.remove('hold');
      railButtons.forEach((button, buttonIndex) => {
        button.classList.remove('on');
        button.setAttribute('aria-pressed', String(buttonIndex === index));
      });
      void rail.offsetWidth;
      rail.style.setProperty('--dur', `${stepDuration}ms`);
      railButtons[index].classList.add('on');
      markNext((index + 1) % steps.length);
      hop(steps[index], () => openCard(index));
      scheduleAdvance(stepDuration);
    };

    const roam = (tile) => {
      activeStep = tile.step === -1 ? activeStep : tile.step;
      card.classList.remove('show');
      rail.classList.add('hold');
      hop(tile);
      scheduleAdvance(6000);
    };

    const dismissHint = () => hint.classList.add('gone');

    paintGlow();
    requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.add('go')));
    window.setTimeout(
      () => {
        measure();
        showStep(0);
      },
      reduceMotion ? 0 : 1650
    );

    window.addEventListener('resize', () => {
      measure();
      placeCard();
    });

    railButtons.forEach((button, index) => {
      button.addEventListener('click', () => {
        dismissHint();
        showStep(index);
      });
    });

    stage.addEventListener('pointerup', (event) => {
      if (event.target.closest('a, button, input')) return;

      measure();
      const sceneBounds = scene.getBoundingClientRect();
      const target = nearestTile(event.clientX - sceneBounds.left, event.clientY - sceneBounds.top, 120);
      if (!target) return;

      dismissHint();
      if (target.step !== -1) {
        showStep(target.step);
        return;
      }

      roam(target);
    });

    if (canHover && !reduceMotion) {
      let hotTile = null;
      stage.addEventListener('pointerenter', measure);
      stage.addEventListener('pointermove', (event) => {
        const sceneBounds = scene.getBoundingClientRect();
        const pointX = event.clientX - sceneBounds.left;
        const pointY = event.clientY - sceneBounds.top;
        tiles.forEach((tile) => {
          const falloff = Math.max(0, 1 - Math.hypot(tile.centerX - pointX, tile.centerY - pointY) / 200);
          tile.element.style.setProperty('--lift', (falloff * falloff * 26).toFixed(1));
        });
        const nextHot = nearestTile(pointX, pointY, 90);
        if (nextHot !== hotTile) {
          hotTile?.element.classList.remove('hot');
          nextHot?.element.classList.add('hot');
          hotTile = nextHot;
        }
        const keyBounds = keyTile.firstChild.getBoundingClientRect();
        const keyX = (event.clientX - (keyBounds.left + keyBounds.width / 2)) / sceneBounds.width;
        const keyY = (event.clientY - (keyBounds.top + keyBounds.height / 2)) / sceneBounds.height;
        keyTile.style.setProperty('--tx', `${(-keyY * 26).toFixed(1)}deg`);
        keyTile.style.setProperty('--ty', `${(keyX * 26).toFixed(1)}deg`);
      });
      stage.addEventListener('pointerleave', () => {
        tiles.forEach((tile) => tile.element.style.setProperty('--lift', '0'));
        hotTile?.element.classList.remove('hot');
        hotTile = null;
        keyTile.style.setProperty('--tx', '0deg');
        keyTile.style.setProperty('--ty', '0deg');
      });
    }

    if (reduceMotion) return;

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        isVisible = entries[0].isIntersecting;
      }).observe(stage);
    }

    let scrollFrame = 0;
    window.addEventListener(
      'scroll',
      () => {
        if (scrollFrame) return;

        scrollFrame = requestAnimationFrame(() => {
          scrollFrame = 0;
          const progress = Math.min(1, Math.max(0, window.scrollY / stage.offsetHeight));
          plane.style.setProperty('--sp', progress.toFixed(3));
          if (card.classList.contains('show')) placeCard();
        });
      },
      { passive: true }
    );
  }

  setupTileHero(document.getElementById('ah-stage'));

  /**
   * Runs the About photo hero: each tab swaps the background photo, the active tab
   * fills over the interval, then the next tab takes over. Hover or focus pauses it.
   * @param {HTMLElement | null} hero The `.ph` section.
   */
  function setupPhotoHero(hero) {
    if (!hero) return;

    const photos = [...hero.querySelectorAll('.ph-photos img')];
    const tabs = [...hero.querySelectorAll('.ph-tab')];
    const meter = hero.querySelector('.ph-meter');
    const slideCards = [...hero.querySelectorAll('.ph-fc[data-slide]')];
    const meterNow = hero.querySelector('.ph-now');
    const ask = hero.querySelector('.ph-ask');
    const typed = hero.querySelector('.ph-typed');
    let typingTimer = null;

    const typePrompt = (text) => {
      clearTimeout(typingTimer);
      ask.classList.remove('sent');
      if (reduceMotion) {
        typed.textContent = text;
        return;
      }

      let length = 0;
      typed.textContent = '';
      const step = () => {
        length += 1;
        typed.textContent = text.slice(0, length);
        if (length < text.length) {
          typingTimer = setTimeout(step, 34 + Math.random() * 40);
          return;
        }

        typingTimer = setTimeout(() => ask.classList.add('sent'), 700);
      };
      typingTimer = setTimeout(step, 450);
    };

    const interval = 6000;
    let activeIndex = 0;
    let timer = null;
    let startedAt = 0;
    let remaining = interval;
    let paused = false;
    hero.style.setProperty('--ph-dur', `${interval}ms`);

    const show = (index) => {
      const previousIndex = activeIndex;
      const isSwap = index !== previousIndex;
      activeIndex = index;
      photos.forEach((photo, photoIndex) => {
        photo.classList.remove('wipe', 'was');
        photo.classList.toggle('on', photoIndex === index);
        if (isSwap && photoIndex === previousIndex) photo.classList.add('was');
      });
      if (isSwap) {
        void photos[index].offsetWidth;
        photos[index].classList.add('wipe');
      }
      tabs.forEach((tab, tabIndex) => {
        const active = tabIndex === index;
        tab.classList.remove('on');
        tab.setAttribute('aria-pressed', String(active));
      });
      void tabs[index].offsetWidth;
      tabs[index].classList.add('on');
      meter.style.setProperty('--step', String(index + 1));
      meterNow.textContent = String(index + 1).padStart(2, '0');
      slideCards.forEach((card) => card.classList.toggle('on', Number(card.dataset.slide) === index));
      meter.closest('.ph-banner').dataset.slide = String(index);
      typePrompt(tabs[index].dataset.ask);
    };

    const schedule = (delay) => {
      clearTimeout(timer);
      if (reduceMotion) return;

      startedAt = performance.now();
      remaining = delay;
      timer = setTimeout(() => {
        show((activeIndex + 1) % tabs.length);
        schedule(interval);
      }, delay);
    };

    const pause = () => {
      if (paused || reduceMotion) return;

      paused = true;
      clearTimeout(timer);
      remaining = Math.max(0, remaining - (performance.now() - startedAt));
      hero.classList.add('paused');
    };

    const resume = () => {
      if (!paused) return;

      paused = false;
      hero.classList.remove('paused');
      schedule(remaining);
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        show(index);
        paused = false;
        hero.classList.remove('paused');
        schedule(interval);
      });
    });
    const tabRow = hero.querySelector('.ph-tabs');
    tabRow.addEventListener('mouseenter', pause);
    tabRow.addEventListener('mouseleave', resume);
    tabRow.addEventListener('focusin', pause);
    tabRow.addEventListener('focusout', resume);

    const banner = hero.querySelector('.ph-banner');
    if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
      let pointerQueued = false;
      let pointerX = 0;
      let pointerY = 0;
      const applyPointer = () => {
        pointerQueued = false;
        hero.style.setProperty('--mx', pointerX.toFixed(3));
        hero.style.setProperty('--my', pointerY.toFixed(3));
      };
      banner.addEventListener('pointermove', (event) => {
        const bounds = banner.getBoundingClientRect();
        pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
        pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
        if (pointerQueued) return;

        pointerQueued = true;
        requestAnimationFrame(applyPointer);
      });
      banner.addEventListener('pointerleave', () => {
        pointerX = 0;
        pointerY = 0;
        requestAnimationFrame(applyPointer);
      });
    }

    show(0);
    schedule(interval);
  }

  setupPhotoHero(document.getElementById('ph'));

  /**
   * Returns a function that types `text` into `element`, deleting back to the shared prefix first.
   * Each call cancels the previous one. `onDone` runs once the text is complete.
   * @param {HTMLElement} element
   * @returns {(text: string, onDone?: () => void) => void}
   */
  function createTyper(element) {
    let timer = 0;
    return (text, onDone) => {
      clearTimeout(timer);
      if (reduceMotion) {
        element.textContent = text;
        if (onDone) onDone();
        return;
      }

      const step = () => {
        const current = element.textContent;
        if (!text.startsWith(current)) {
          element.textContent = current.slice(0, -1);
          timer = setTimeout(step, 18);
          return;
        }

        if (current.length < text.length) {
          element.textContent = text.slice(0, current.length + 1);
          timer = setTimeout(step, 42);
          return;
        }

        if (onDone) onDone();
      };
      step();
    };
  }

  /**
   * Wires the mission and vision bento: pointer tilt and glare on every card, the colour lens on the
   * vision photo, the typed prompt, the licence scramble and the logo card pop.
   * @param {HTMLElement} bento
   */
  function setupBento(bento) {
    const cards = [...bento.querySelectorAll('.bn-card')];
    const lensBleed = 14;

    if (canHover && !reduceMotion) {
      cards.forEach((card) => {
        card.addEventListener('pointermove', (event) => {
          const bounds = card.getBoundingClientRect();
          const offsetX = (event.clientX - bounds.left) / bounds.width;
          const offsetY = (event.clientY - bounds.top) / bounds.height;
          const tiltStrength = Math.min(7, 2800 / bounds.width);
          const shiftX = (offsetX - 0.5) * -16;
          const shiftY = (offsetY - 0.5) * -16;
          card.classList.add('hot');
          card.style.setProperty('--ry', `${((offsetX - 0.5) * tiltStrength).toFixed(2)}deg`);
          card.style.setProperty('--rx', `${((0.5 - offsetY) * tiltStrength).toFixed(2)}deg`);
          card.style.setProperty('--gx', `${(offsetX * 100).toFixed(1)}%`);
          card.style.setProperty('--gy', `${(offsetY * 100).toFixed(1)}%`);
          card.style.setProperty('--px', `${shiftX.toFixed(1)}px`);
          card.style.setProperty('--py', `${shiftY.toFixed(1)}px`);
          card.style.setProperty('--lx', `${(event.clientX - bounds.left + lensBleed - shiftX).toFixed(1)}px`);
          card.style.setProperty('--ly', `${(event.clientY - bounds.top + lensBleed - shiftY).toFixed(1)}px`);
        });
        card.addEventListener('pointerleave', () => {
          card.classList.remove('hot');
          ['--rx', '--ry', '--px', '--py'].forEach((name) => card.style.removeProperty(name));
        });
      });
    }

    const typedPrompt = document.getElementById('bn-typed');
    const options = [...document.querySelectorAll('#bn-opts li')];
    const typePrompt = createTyper(typedPrompt);
    let optionIndex = 0;
    let promptTimer = 0;
    let promptHeld = false;
    const markOptions = () => {
      options.forEach((option, index) => {
        option.classList.toggle('on', index === optionIndex);
        option.style.setProperty('--o', String((index - optionIndex + options.length) % options.length));
      });
    };
    const queueNextOption = () => {
      clearTimeout(promptTimer);
      if (promptHeld || reduceMotion) return;

      promptTimer = setTimeout(() => {
        optionIndex = (optionIndex + 1) % options.length;
        markOptions();
        typePrompt(options[optionIndex].textContent, queueNextOption);
      }, 2400);
    };
    options.forEach((option, index) => {
      const choose = () => {
        promptHeld = true;
        clearTimeout(promptTimer);
        optionIndex = index;
        markOptions();
        typePrompt(option.textContent);
      };
      option.addEventListener('mouseenter', choose);
      option.addEventListener('click', choose);
    });
    document.getElementById('bn-opts').addEventListener('mouseleave', () => {
      promptHeld = false;
      queueNextOption();
    });
    markOptions();

    const licence = document.getElementById('bn-big');
    const licenceText = licence.textContent;
    const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let scrambling = false;
    const scrambleLicence = () => {
      if (reduceMotion || scrambling) return;

      scrambling = true;
      const totalFrames = 20;
      let frame = 0;
      const tick = () => {
        frame += 1;
        const settled = Math.floor((frame / totalFrames) * licenceText.length);
        const letters = [...licenceText].map((character, index) => {
          if (index < settled || character === '-' || character === '.') return character;

          return glyphs[Math.floor(Math.random() * glyphs.length)];
        });
        licence.textContent = letters.join('');
        if (frame < totalFrames) {
          setTimeout(tick, 45);
          return;
        }

        licence.textContent = licenceText;
        scrambling = false;
      };
      tick();
    };
    licence.closest('.bn-card').addEventListener('mouseenter', scrambleLicence);

    const mark = bento.querySelector('.bn-mark');
    mark.addEventListener('click', () => {
      mark.classList.remove('pop');
      void mark.offsetWidth;
      mark.classList.add('pop');
    });
    mark.addEventListener('animationend', (event) => {
      if (event.animationName === 'bn-pop') mark.classList.remove('pop');
    });

    if (reduceMotion || !('IntersectionObserver' in window)) return;

    const startObserver = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;

        startObserver.disconnect();
        setTimeout(scrambleLicence, 700);
        setTimeout(queueNextOption, 600);
      },
      { threshold: 0.25 }
    );
    startObserver.observe(bento);
  }

  setupBento(document.getElementById('bento'));

  function setupAgentWaves(canvas) {
    if (!canvas) return;

    const context = canvas.getContext('2d');
    const lineCount = 26;
    let width = 0;
    let height = 0;
    let frameId = 0;
    let visible = false;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const ridge = (x, depth, time) =>
      Math.sin(x * 0.018 + time * 0.6 + depth * 2.2) * 9 +
      Math.sin(x * 0.041 - time * 0.9 + depth * 4.1) * 5 +
      Math.sin(x * 0.007 + time * 0.25) * 14;

    const draw = (time) => {
      context.clearRect(0, 0, width, height);
      for (let line = 0; line < lineCount; line += 1) {
        const depth = line / (lineCount - 1);
        const baseY = height * (0.12 + depth * 0.9);
        const amplitude = 0.5 + depth * 1.1;
        context.beginPath();
        for (let x = -10; x <= width + 10; x += 6) {
          const y = baseY - ridge(x, depth, time) * amplitude;
          if (x === -10) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        const alpha = 0.18 + depth * 0.7;
        context.strokeStyle = depth > 0.62 ? `rgba(5, 66, 204, ${alpha})` : `rgba(140, 170, 240, ${alpha})`;
        context.lineWidth = 0.8 + depth * 0.9;
        context.stroke();
      }
    };

    const loop = (now) => {
      draw(now / 1000);
      if (visible) frameId = requestAnimationFrame(loop);
    };

    resize();
    draw(0);
    window.addEventListener('resize', () => {
      resize();
      draw(performance.now() / 1000);
    });
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      cancelAnimationFrame(frameId);
      if (visible) frameId = requestAnimationFrame(loop);
    }).observe(canvas);
  }

  function setupAgentPrompts(typed) {
    if (!typed || reduceMotion) return;

    const prompts = [
      'Draft a course from our help docs',
      'Who has not finished onboarding?',
      'Enrol the new partners in Product basics'
    ];
    let promptIndex = 0;
    let charIndex = prompts[0].length;
    let deleting = true;

    const step = () => {
      if (deleting) {
        charIndex -= 1;
        if (charIndex <= 0) {
          deleting = false;
          promptIndex = (promptIndex + 1) % prompts.length;
        }
      } else {
        charIndex += 1;
      }
      typed.textContent = prompts[promptIndex].slice(0, Math.max(charIndex, 0));
      const finished = !deleting && charIndex >= prompts[promptIndex].length;
      if (finished) deleting = true;
      const delay = finished ? 2600 : deleting ? 28 : 55;
      window.setTimeout(step, delay);
    };

    window.setTimeout(step, 3200);
  }

  function setupFocusTiles(stage) {
    if (!stage) return;

    const tones = ['tl-blue', 'tl-mint', 'tl-navy', 'tl-lilac', 'tl-lime'];
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    stage.querySelectorAll('.tl-run').forEach((run) => {
      Array.from(run.children).forEach((tile) => run.appendChild(tile.cloneNode(true)));
    });
    stage.querySelectorAll('.tl-tile').forEach((tile, index) => {
      tile.style.transitionDelay = `${(index % 3) * 90 + Math.floor(index / 6) * 60}ms`;
      tile.addEventListener('transitionend', () => (tile.style.transitionDelay = ''), { once: true });
    });

    if (!reduceMotion) stage.classList.add('tl-ready');

    stage.addEventListener('pointermove', (event) => {
      const bounds = stage.getBoundingClientRect();
      const offsetX = (event.clientX - bounds.left) / bounds.width - 0.5;
      const offsetY = (event.clientY - bounds.top) / bounds.height - 0.5;
      stage.style.setProperty('--px', `${(-offsetX * 28).toFixed(1)}px`);
      stage.style.setProperty('--py', `${(-offsetY * 20).toFixed(1)}px`);
    });
    stage.addEventListener('pointerleave', () => {
      stage.style.setProperty('--px', '0px');
      stage.style.setProperty('--py', '0px');
    });

    stage.addEventListener('click', (event) => {
      const tile = event.target.closest('.tl-tile');
      if (!tile) return;

      const currentTone = tones.find((tone) => tile.classList.contains(tone));
      const nextTone = tones[(tones.indexOf(currentTone) + 1) % tones.length];
      tile.classList.replace(currentTone, nextTone);
      tile.classList.remove('tl-pop');
      void tile.offsetWidth;
      tile.classList.add('tl-pop');
    });
  }

  /**
   * Wires the value cards: pointer tilt, glare and layer parallax on each card, the logo spin,
   * the typed AI Tutor prompts with their replies, and the metric switcher with count-up.
   * @param {HTMLElement} grid The `.vx` element holding the three cards.
   */
  function setupValueCards(grid) {
    if (!grid) return;

    const cards = [...grid.querySelectorAll('.vx-card')];
    grid.querySelectorAll('.vx-title .vx-w').forEach((word, index) => word.style.setProperty('--i', String(index)));
    grid.querySelectorAll('.vx-word i').forEach((letter, index) => letter.style.setProperty('--i', String(index)));

    const settleDelay = 1300 + cards.length * 140;
    const startLive = () => window.setTimeout(() => grid.classList.add('vx-live'), settleDelay);
    if (grid.classList.contains('in')) startLive();
    else
      new MutationObserver((records, observer) => {
        if (!grid.classList.contains('in')) return;

        observer.disconnect();
        startLive();
      }).observe(grid, { attributes: true, attributeFilter: ['class'] });

    if (canHover && !reduceMotion) {
      cards.forEach((card) => {
        card.addEventListener('pointermove', (event) => {
          const bounds = card.getBoundingClientRect();
          const offsetX = (event.clientX - bounds.left) / bounds.width;
          const offsetY = (event.clientY - bounds.top) / bounds.height;
          card.classList.add('vx-tilting');
          card.style.setProperty('--mx', `${(offsetX * 100).toFixed(1)}%`);
          card.style.setProperty('--my', `${(offsetY * 100).toFixed(1)}%`);
          card.style.setProperty('--px', (offsetX * 2 - 1).toFixed(3));
          card.style.setProperty('--py', (offsetY * 2 - 1).toFixed(3));
          if (!grid.classList.contains('vx-live')) return;

          card.style.setProperty('--ry', `${((offsetX - 0.5) * 12).toFixed(2)}deg`);
          card.style.setProperty('--rx', `${((0.5 - offsetY) * 10).toFixed(2)}deg`);
        });
        card.addEventListener('pointerleave', () => {
          card.classList.remove('vx-tilting');
          ['--rx', '--ry'].forEach((name) => card.style.setProperty(name, '0deg'));
          ['--px', '--py'].forEach((name) => card.style.setProperty(name, '0'));
        });
      });
    }

    const orb = grid.querySelector('.vx-orb');
    orb.addEventListener('click', () => {
      orb.classList.remove('vx-spin');
      void orb.offsetWidth;
      orb.classList.add('vx-spin');
    });
    orb.addEventListener('animationend', () => orb.classList.remove('vx-spin'));

    const prompts = [
      { ask: 'Summarise lesson 3 in two lines', reply: '3 key points ready' },
      { ask: 'Quiz me on the onboarding module', reply: '5 questions drafted' },
      { ask: 'Draft a course from our help docs', reply: '12 lessons outlined' },
      { ask: 'Who is stuck on module 2?', reply: '4 learners need a nudge' }
    ];
    const typed = grid.querySelector('.vx-typed');
    const send = grid.querySelector('.vx-send');
    const reply = grid.querySelector('.vx-reply');
    const replyText = reply.querySelector('span');
    const typePrompt = createTyper(typed);
    let promptIndex = 0;
    let promptTimer = 0;

    const firePrompt = () => {
      clearTimeout(promptTimer);
      send.classList.remove('vx-fire');
      void send.offsetWidth;
      send.classList.add('vx-fire');
      replyText.textContent = prompts[promptIndex].reply;
      reply.classList.add('on');
      promptTimer = setTimeout(nextPrompt, 2400);
    };
    const nextPrompt = () => {
      reply.classList.remove('on');
      promptIndex = (promptIndex + 1) % prompts.length;
      typePrompt(prompts[promptIndex].ask, () => {
        promptTimer = setTimeout(firePrompt, 700);
      });
    };
    send.addEventListener('click', firePrompt);

    const metrics = [
      { label: 'Course completion', value: 68, suffix: '%' },
      { label: 'Active learners this week', value: 1240, suffix: '' },
      { label: 'Average quiz score', value: 84, suffix: '%' },
      { label: 'Customers onboarded', value: 312, suffix: '' }
    ];
    const metric = grid.querySelector('.vx-metric');
    const label = grid.querySelector('.vx-label');
    const valueEl = grid.querySelector('.vx-val');
    let metricIndex = 0;
    let metricTimer = 0;
    let countFrame = 0;

    const countTo = (target, suffix, from) => {
      cancelAnimationFrame(countFrame);
      if (reduceMotion) {
        valueEl.textContent = `${target.toLocaleString('en-US')}${suffix}`;
        return;
      }

      const startTime = performance.now();
      const duration = 1100;
      const tick = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        const current = Math.round(from + (target - from) * eased);
        valueEl.textContent = `${current.toLocaleString('en-US')}${suffix}`;
        if (progress < 1) countFrame = requestAnimationFrame(tick);
      };
      countFrame = requestAnimationFrame(tick);
    };

    const showMetric = (step) => {
      clearTimeout(metricTimer);
      metricIndex = (metricIndex + step + metrics.length) % metrics.length;
      const next = metrics[metricIndex];
      const swap = () => {
        label.textContent = next.label;
        countTo(next.value, next.suffix, 0);
      };
      if (reduceMotion) swap();
      else {
        const shift = step > 0 ? -16 : 16;
        metric
          .animate(
            [
              { transform: 'translateY(0)', opacity: 1, filter: 'blur(0)' },
              { transform: `translateY(${shift}px)`, opacity: 0, filter: 'blur(4px)' }
            ],
            { duration: 200, easing: 'ease-in' }
          )
          .finished.then(() => {
            swap();
            metric.animate(
              [
                { transform: `translateY(${-shift}px)`, opacity: 0, filter: 'blur(4px)' },
                { transform: 'translateY(0)', opacity: 1, filter: 'blur(0)' }
              ],
              { duration: 420, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
            );
          });
      }
      metricTimer = setTimeout(() => showMetric(1), 3600);
    };
    grid
      .querySelectorAll('.vx-arrow')
      .forEach((arrow) => arrow.addEventListener('click', () => showMetric(Number(arrow.dataset.step))));

    if (reduceMotion || !('IntersectionObserver' in window)) return;

    let started = false;
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || started) return;

          started = true;
          setTimeout(() => countTo(68, '%', 0), 900);
          promptTimer = setTimeout(firePrompt, 2200);
          metricTimer = setTimeout(() => showMetric(1), 4600);
        });
      },
      { threshold: 0.35 }
    ).observe(grid);
  }

  /**
   * Wires the Who we are panel: the cursor glow, circles that swell near the pointer and pop on
   * click, the blue circles that drift around the grid, and the three topics that cycle on their
   * own while linking each row to its pill and photo.
   * @param {HTMLElement} panel The `.wwa` element.
   */
  function setupWhoWeAre(panel) {
    if (!panel) return;

    const grid = panel.querySelector('.wwa-grid');
    [...grid.children].forEach((cell, index) => cell.style.setProperty('--i', String(index)));
    const circles = [...grid.querySelectorAll('.wwa-c')];
    const plainCircles = circles.filter((circle) => !circle.classList.contains('wwa-p'));
    const rows = [...panel.querySelectorAll('#wwa-row')];
    const linked = [...panel.querySelectorAll('[data-k]')];
    let activeIndex = 0;

    const setActive = (index) => {
      activeIndex = index;
      linked.forEach((element) => element.classList.toggle('on', Number(element.dataset.k) === index));
      rows.forEach((row) => row.setAttribute('aria-expanded', String(Number(row.dataset.k) === index)));
      grid.classList.add('has-on');
    };
    const restartBar = () => {
      const bar = rows[activeIndex].querySelector('.wwa-bar');
      bar.style.animation = 'none';
      void bar.offsetWidth;
      bar.style.animation = '';
    };

    rows.forEach((row) =>
      row.addEventListener('click', () => {
        setActive(Number(row.dataset.k));
        restartBar();
      })
    );
    grid.querySelectorAll('.wwa-pill').forEach((pill) => {
      const choose = () => {
        if (Number(pill.dataset.k) === activeIndex) return;

        setActive(Number(pill.dataset.k));
      };
      pill.addEventListener('pointerenter', choose);
      pill.addEventListener('click', choose);
    });
    rows.forEach((row) =>
      row.querySelector('.wwa-bar').addEventListener('animationend', () => setActive((activeIndex + 1) % rows.length))
    );
    setActive(0);

    circles.forEach((circle) =>
      circle.addEventListener('click', () => {
        if (!circle.classList.contains('wwa-p')) circle.classList.toggle('a');
        circle.classList.remove('wwa-pop');
        void circle.offsetWidth;
        circle.classList.add('wwa-pop');
      })
    );
    circles.forEach((circle) => circle.addEventListener('animationend', () => circle.classList.remove('wwa-pop')));

    panel.addEventListener('pointerenter', () => panel.classList.add('paused'));
    panel.addEventListener('pointerleave', () => {
      panel.classList.remove('paused');
      circles.forEach((circle) => circle.style.setProperty('--s', '1'));
    });

    if (reduceMotion) return;

    if (canHover) {
      panel.addEventListener('pointermove', (event) => {
        const panelBounds = panel.getBoundingClientRect();
        panel.style.setProperty('--gx', `${event.clientX - panelBounds.left}px`);
        panel.style.setProperty('--gy', `${event.clientY - panelBounds.top}px`);
        circles.forEach((circle) => {
          const bounds = circle.getBoundingClientRect();
          const distance = Math.hypot(
            event.clientX - (bounds.left + bounds.width / 2),
            event.clientY - (bounds.top + bounds.height / 2)
          );
          const pull = Math.max(0, 1 - distance / 170);
          circle.style.setProperty('--s', (1 + pull * 0.16).toFixed(3));
        });
      });
    }

    let inView = false;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        inView = entries[0].isIntersecting;
      }).observe(panel);
    }
    setInterval(() => {
      if (!inView || panel.classList.contains('paused')) return;

      const lit = plainCircles.filter((circle) => circle.classList.contains('a'));
      const dark = plainCircles.filter((circle) => !circle.classList.contains('a'));
      if (!lit.length || !dark.length) return;

      lit[Math.floor(Math.random() * lit.length)].classList.remove('a');
      dark[Math.floor(Math.random() * dark.length)].classList.add('a');
    }, 1800);
  }

  setupFocusTiles(document.querySelector('.tl'));
  setupWhoWeAre(document.getElementById('wwa'));
  setupValueCards(document.getElementById('vx'));
  setupAgentWaves(document.querySelector('.wy-waves'));
  setupAgentPrompts(document.querySelector('.wy-typed'));

  const track = document.getElementById('team-track');
  track.querySelectorAll('.ab-card').forEach((card, index) => card.style.setProperty('--n', String(index)));
})();
