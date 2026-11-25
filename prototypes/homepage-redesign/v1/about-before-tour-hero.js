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

  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /**
   * Builds the About hero's isometric tile field and wires its intro, hover lift,
   * click-to-hop key tile, ripples, idle hops and scroll tilt.
   * @param {HTMLElement} stage The `.ah-stage` element holding the scene.
   */
  function setupTileHero(stage) {
    const plane = stage.querySelector('#ah-plane');
    const keyTile = stage.querySelector('#ah-key');
    const scene = stage.querySelector('.ah-scene');
    const hint = stage.querySelector('#ah-hint');
    const gridSize = 8;
    const tiles = [];
    const keyCell = { col: 4, row: 3 };
    let lastInteraction = Date.now() + 3000;
    let isVisible = true;
    let isHopping = false;

    const fragment = document.createDocumentFragment();
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const tileElement = document.createElement('i');
        tileElement.className = 'ah-t';
        tileElement.style.setProperty('--c', col);
        tileElement.style.setProperty('--r', row);
        tileElement.style.setProperty('--d', `${((col + gridSize - row) * 55).toFixed(0)}ms`);
        tileElement.appendChild(document.createElement('b'));
        fragment.appendChild(tileElement);
        tiles.push({ element: tileElement, col, row, centerX: 0, centerY: 0 });
      }
    }
    plane.insertBefore(fragment, plane.firstChild);

    const gridDistance = (tile, cell) => Math.hypot(tile.col - cell.col, tile.row - cell.row);

    const paintGlow = () => {
      tiles.forEach((tile) => {
        const glow = Math.max(0, 1 - gridDistance(tile, keyCell) / 2.4);
        tile.element.style.setProperty('--g', glow.toFixed(2));
      });
    };

    const measure = () => {
      const stageBounds = scene.getBoundingClientRect();
      tiles.forEach((tile) => {
        const bounds = tile.element.firstChild.getBoundingClientRect();
        tile.centerX = bounds.left + bounds.width / 2 - stageBounds.left;
        tile.centerY = bounds.top + bounds.height / 2 - stageBounds.top;
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

    const hop = (cell) => {
      if (isHopping) return;

      if (cell.col === keyCell.col && cell.row === keyCell.row) {
        land();
        return;
      }

      keyCell.col = cell.col;
      keyCell.row = cell.row;
      plane.style.setProperty('--kc', cell.col);
      plane.style.setProperty('--kr', cell.row);
      paintGlow();
      if (reduceMotion) return;

      isHopping = true;
      const arc = keyTile.animate(
        [{ translate: '0 0 0' }, { translate: '0 0 170px', offset: 0.45 }, { translate: '0 0 0' }],
        { duration: 700, easing: 'cubic-bezier(.45, 0, .35, 1)' }
      );
      arc.onfinish = () => {
        isHopping = false;
        land();
      };
    };

    const dismissHint = () => hint.classList.add('gone');

    const visibleCells = () => {
      const stageBounds = scene.getBoundingClientRect();
      const minX = stageBounds.width > 960 ? stageBounds.width * 0.55 : stageBounds.width * 0.15;
      return tiles.filter((tile) => {
        const isNearKey = gridDistance(tile, keyCell) <= 2.3 && gridDistance(tile, keyCell) > 0;
        const isInFrame =
          tile.centerX > minX &&
          tile.centerX < stageBounds.width * 0.86 &&
          tile.centerY > stageBounds.height * 0.4 &&
          tile.centerY < stageBounds.height * 0.78;
        return isNearKey && isInFrame;
      });
    };

    paintGlow();
    requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.add('go')));
    window.setTimeout(
      () => {
        measure();
        if (!reduceMotion) land();
      },
      reduceMotion ? 0 : 1650
    );
    window.addEventListener('resize', measure);

    stage.addEventListener('pointerup', (event) => {
      if (event.target.closest('a, button, input')) return;

      measure();
      const stageBounds = scene.getBoundingClientRect();
      const target = nearestTile(event.clientX - stageBounds.left, event.clientY - stageBounds.top, 120);
      if (!target) return;

      lastInteraction = Date.now();
      dismissHint();
      hop(target);
    });

    if (canHover && !reduceMotion) {
      let hotTile = null;
      stage.addEventListener('pointerenter', measure);
      stage.addEventListener('pointermove', (event) => {
        const stageBounds = scene.getBoundingClientRect();
        const pointX = event.clientX - stageBounds.left;
        const pointY = event.clientY - stageBounds.top;
        lastInteraction = Date.now();
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
        const keyX = (event.clientX - (keyBounds.left + keyBounds.width / 2)) / stageBounds.width;
        const keyY = (event.clientY - (keyBounds.top + keyBounds.height / 2)) / stageBounds.height;
        keyTile.style.setProperty('--tx', `${(-keyY * 26).toFixed(1)}deg`);
        keyTile.style.setProperty('--ty', `${(keyX * 26).toFixed(1)}deg`);
        keyTile.style.setProperty('--kl', hotTile && gridDistance(hotTile, keyCell) === 0 ? '18px' : '0px');
      });
      stage.addEventListener('pointerleave', () => {
        tiles.forEach((tile) => tile.element.style.setProperty('--lift', '0'));
        hotTile?.element.classList.remove('hot');
        hotTile = null;
        keyTile.style.setProperty('--tx', '0deg');
        keyTile.style.setProperty('--ty', '0deg');
        keyTile.style.setProperty('--kl', '0px');
      });
    }

    if (reduceMotion) return;

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        isVisible = entries[0].isIntersecting;
      }).observe(stage);
    }

    window.setInterval(() => {
      if (!isVisible || document.hidden || Date.now() - lastInteraction < 5000) return;

      measure();
      const candidates = visibleCells();
      if (!candidates.length) return;

      hop(candidates[Math.floor(Math.random() * candidates.length)]);
    }, 4200);

    let scrollFrame = 0;
    window.addEventListener(
      'scroll',
      () => {
        if (scrollFrame) return;

        scrollFrame = requestAnimationFrame(() => {
          scrollFrame = 0;
          const progress = Math.min(1, Math.max(0, window.scrollY / stage.offsetHeight));
          plane.style.setProperty('--sp', progress.toFixed(3));
        });
      },
      { passive: true }
    );
  }

  setupTileHero(document.getElementById('ah-stage'));

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
   * vision photo, the typed prompt, the licence scramble and the custom-domain browser.
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

    const browser = document.getElementById('bn-browser');
    const typeDomain = createTyper(document.getElementById('bn-domain'));
    const domains = ['learn.yourcompany.com', 'academy.yourcompany.com', 'training.yourcompany.com'];
    let domainIndex = 0;
    const reskin = () => {
      browser.classList.add('swap');
      browser.dataset.skin = String(domainIndex);
      void browser.offsetWidth;
      browser.classList.remove('swap');
      setTimeout(nextDomain, 2600);
    };
    const nextDomain = () => {
      domainIndex = (domainIndex + 1) % domains.length;
      typeDomain(domains[domainIndex], reskin);
    };

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
        setTimeout(nextDomain, 2200);
      },
      { threshold: 0.25 }
    );
    startObserver.observe(bento);
  }

  setupBento(document.getElementById('bento'));

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
