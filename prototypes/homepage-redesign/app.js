(function () {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');

  /**
   * @param {number} value
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  /**
   * @param {number} from
   * @param {number} to
   * @param {number} amount
   * @returns {number}
   */
  const lerp = (from, to, amount) => from + (to - from) * amount;

  const scrollListeners = [];
  const onScroll = (listener) => scrollListeners.push(listener);
  const runScrollListeners = () => scrollListeners.forEach((listener) => listener(window.scrollY));

  if (!reduceMotion && window.Lenis) {
    const lenis = new window.Lenis({ duration: 1.25, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    lenis.on('scroll', runScrollListeners);
    const lenisFrame = (time) => {
      lenis.raf(time);
      requestAnimationFrame(lenisFrame);
    };
    requestAnimationFrame(lenisFrame);
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;

        event.preventDefault();
        lenis.scrollTo(target, { offset: -70 });
      });
    });
  } else {
    window.addEventListener('scroll', runScrollListeners, { passive: true });
  }

  const nav = document.getElementById('nav');
  onScroll((scrollY) => nav.classList.toggle('scrolled', scrollY > 8));

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
   * Wires tab buttons to the panes that share their `data-target` names.
   * @param {Element[]} buttons
   * @param {Element} paneRoot
   */
  function bindTabs(buttons, paneRoot) {
    const panes = [...paneRoot.querySelectorAll(':scope > [data-pane]')];
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        buttons.forEach((other) => {
          const isActive = other === button;
          other.classList.toggle('on', isActive);
          other.setAttribute('aria-selected', String(isActive));
        });
        panes.forEach((pane) => {
          pane.hidden = pane.dataset.pane !== button.dataset.target;
        });
      });
    });
  }

  document.querySelectorAll('[data-tabs]').forEach((group) => {
    const paneRoot =
      group.querySelector('[data-tabpanes]') || document.querySelector(`[data-tabpanes="${group.dataset.tabs}"]`);
    bindTabs([...group.querySelectorAll('[role="tab"]')], paneRoot);
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

  const dashboardWrap = document.getElementById('db-wrap');
  const dashboardTilt = document.getElementById('db-tilt');
  const dashboardScale = document.getElementById('db-scale');
  const dashboardWidth = 1180;
  const dashboardHeight = 760;

  const fitDashboard = () => {
    const hero = document.getElementById('hs');
    if (hero.classList.contains('hs-pin')) {
      const heroWidth = hero.clientWidth;
      const availableHeight = window.innerHeight - 128 - 112;
      const scale = Math.min((heroWidth - 56) / dashboardWidth, availableHeight / dashboardHeight);
      const inset = (heroWidth - dashboardWidth * scale) / 2;
      dashboardWrap.style.left = `${inset}px`;
      dashboardWrap.style.right = `${inset}px`;
      dashboardScale.style.transform = `scale(${scale})`;
      dashboardTilt.style.height = `${dashboardHeight * scale}px`;
      return;
    }
    dashboardWrap.style.removeProperty('left');
    dashboardWrap.style.removeProperty('right');
    const scale = dashboardTilt.clientWidth / dashboardWidth;
    dashboardScale.style.transform = `scale(${scale})`;
    dashboardTilt.style.height = `${dashboardHeight * scale * 0.9}px`;
  };
  fitDashboard();
  window.addEventListener('resize', fitDashboard);

  const stage = document.getElementById('hs');
  const stageStick = document.getElementById('hs-stick');
  const stageCopy = document.getElementById('hs-copy');
  const stagePieceSpecs = [
    null,
    { x: 0.93, y: 0.56, s: 1.1 },
    null,
    null,
    null,
    { x: 0.19, y: 0.9, s: 0.62 },
    { x: 0.09, y: 0.34, s: 0.7 }
  ];
  const stagePieces = [...dashboardTilt.querySelectorAll('.kpi, .chart')].map((element, index) => ({
    element,
    spec: stagePieceSpecs[index],
    dx: 0,
    dy: 0
  }));
  const stageAsk = document.querySelector('.hs .ask');
  const stagePinned = () => window.innerWidth > 860 && !reduceMotion;
  const smooth = (t) => t * t * (3 - 2 * t);

  const measureStage = () => {
    if (!stage.classList.contains('hs-pin')) return;
    const scale = dashboardTilt.clientWidth / dashboardWidth;
    const stickRect = stageStick.getBoundingClientRect();
    stagePieces.forEach((piece) => {
      piece.element.style.transform = 'none';
      if (!piece.spec) return;
      const rect = piece.element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2 - stickRect.left;
      const centerY = rect.top + rect.height / 2 - stickRect.top;
      const halfWidth = (rect.width * piece.spec.s) / 2;
      const halfHeight = (rect.height * piece.spec.s) / 2;
      const margin = 20;
      const targetX = clamp(piece.spec.x * stickRect.width, margin + halfWidth, stickRect.width - margin - halfWidth);
      const targetY = clamp(
        piece.spec.y * stickRect.height,
        margin + halfHeight,
        stickRect.height - margin - halfHeight
      );
      piece.dx = (targetX - centerX) / scale;
      piece.dy = (targetY - centerY) / scale;
    });
  };

  const assembleStage = () => {
    const pinned = stagePinned();
    if (pinned !== stage.classList.contains('hs-pin')) {
      stage.classList.toggle('hs-pin', pinned);
      if (!pinned) {
        stagePieces.forEach((piece) => {
          piece.element.style.removeProperty('transform');
          piece.element.style.removeProperty('opacity');
          piece.element.style.removeProperty('animation');
        });
        stageAsk.removeAttribute('style');
        dashboardTilt.style.removeProperty('--shell');
        stageCopy.removeAttribute('style');
      }
      fitDashboard();
      measureStage();
    }
    if (!pinned) return;

    const stageRect = stage.getBoundingClientRect();
    const progress = clamp(-stageRect.top / (stageRect.height - window.innerHeight), 0, 1);
    stage.classList.toggle('settled', progress > 0.55);

    stagePieces.forEach((piece, index) => {
      const local = smooth(clamp((progress - index * 0.025) / 0.62, 0, 1));
      const remain = 1 - local;
      if (!piece.spec) {
        piece.element.style.animation = 'none';
        piece.element.style.opacity = String(clamp(local * 1.4, 0, 1));
        piece.element.style.transform = `translate3d(0, ${remain * 36}px, 0) scale(${0.96 + 0.04 * local})`;
        return;
      }
      const scale = piece.spec.s + (1 - piece.spec.s) * local;
      piece.element.style.transform = `translate3d(${piece.dx * remain}px, ${piece.dy * remain}px, 0) scale(${scale})`;
    });

    const askMove = smooth(clamp(progress / 0.6, 0, 1));
    stageAsk.style.transform = `translateX(calc(-50% + ${(1 - askMove) * stageStick.clientWidth * 0.18}px))`;
    stageAsk.style.bottom = `${(1 - askMove) * -34 + askMove * 34}px`;

    dashboardTilt.style.setProperty('--shell', smooth(clamp((progress - 0.4) / 0.4, 0, 1)).toFixed(3));

    const copyOut = smooth(clamp((progress - 0.12) / 0.38, 0, 1));
    stageCopy.style.opacity = String(1 - copyOut);
    stageCopy.style.transform = `translateY(${-copyOut * 70}px) scale(${1 - copyOut * 0.06})`;
    stageCopy.style.filter = `blur(${copyOut * 8}px)`;
    stageCopy.style.pointerEvents = copyOut > 0.6 ? 'none' : 'auto';
  };
  const refreshStage = () => {
    fitDashboard();
    measureStage();
    assembleStage();
  };
  window.addEventListener('resize', refreshStage);
  window.addEventListener('load', refreshStage);
  assembleStage();
  measureStage();
  assembleStage();
  onScroll(assembleStage);

  const centerOf = (element, stage) => {
    const stageRect = stage.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    const scale = stageRect.width / stage.offsetWidth;

    return {
      x: (rect.left + rect.width / 2 - stageRect.left) / scale,
      y: (rect.top + rect.height / 2 - stageRect.top) / scale
    };
  };

  const jumpTo = (element, apply) => {
    element.style.transition = 'none';
    apply();
    void element.offsetWidth;
    element.style.transition = '';
  };

  const setPose = (element, x, y, rotate, scale = 1) => {
    element.style.setProperty('--fx', `${x}px`);
    element.style.setProperty('--fy', `${y}px`);
    element.style.setProperty('--fr', `${rotate}deg`);
    element.style.setProperty('--fs', scale);
  };

  const createLoop = (card, play) => {
    let visible = false;
    let running = false;
    let runId = 0;

    const loop = async () => {
      running = true;
      while (visible) {
        const currentRun = ++runId;
        const wait = (ms) =>
          new Promise((resolve, reject) => {
            setTimeout(() => (currentRun === runId ? resolve() : reject(new Error('restart'))), ms);
          });
        await play(wait).catch(() => undefined);
      }
      running = false;
    };

    new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !running) loop();
      },
      { threshold: 0.3 }
    ).observe(card);

    return {
      restart: () => {
        runId += 1;
        if (visible && !running) loop();
      }
    };
  };

  const bentoStages = [...document.querySelectorAll('.bx-stage')];
  const fitBentoStages = () => {
    bentoStages.forEach((stage) => {
      const vis = stage.parentElement;
      const baseWidth = Number(stage.dataset.w);
      const baseHeight = Number(stage.dataset.h);
      const stacked = window.innerWidth <= 960;
      const maxHeight = stacked ? 270 : vis.clientHeight;
      const fitScale = Math.max(Math.min(vis.clientWidth / baseWidth, maxHeight / baseHeight, 1.05), 0.5);
      vis.style.height = stacked ? `${Math.round(baseHeight * fitScale + 24)}px` : '';
      stage.style.setProperty('--w', baseWidth);
      stage.style.setProperty('--h', baseHeight);
      stage.style.setProperty('--k', fitScale.toFixed(3));
    });
  };
  fitBentoStages();
  window.addEventListener('resize', fitBentoStages);

  if (!reduceMotion) {
    document.querySelectorAll('.bx').forEach((card) => {
      const vis = card.querySelector('.bx-vis');
      const stage = card.querySelector('.bx-stage');
      card.addEventListener('pointermove', (event) => {
        const rect = vis.getBoundingClientRect();
        const relativeX = (event.clientX - rect.left) / rect.width;
        const relativeY = (event.clientY - rect.top) / rect.height;
        vis.style.setProperty('--mx', `${(relativeX * 100).toFixed(1)}%`);
        vis.style.setProperty('--my', `${(relativeY * 100).toFixed(1)}%`);
        stage.style.setProperty('--px', (Math.min(Math.max(relativeX, 0), 1) - 0.5).toFixed(3));
        stage.style.setProperty('--py', (Math.min(Math.max(relativeY, 0), 1) - 0.5).toFixed(3));
      });
      card.addEventListener('pointerleave', () => {
        stage.style.setProperty('--px', '0');
        stage.style.setProperty('--py', '0');
      });
    });
  }

  const runPulse = (path, duration = 700) =>
    path.animate([{ strokeDashoffset: 22 }, { strokeDashoffset: -100 }], {
      duration,
      easing: 'cubic-bezier(.45, 0, .25, 1)'
    }).finished;

  const flash = (element, className, duration) => {
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
    setTimeout(() => element.classList.remove(className), duration);
  };

  const pluginCard = document.querySelector('[data-bx="plug"]');
  if (pluginCard) {
    const tiles = [...pluginCard.querySelectorAll('.pi-t')];
    const basePaths = [...pluginCard.querySelectorAll('.bx-base path')];
    const hotPaths = [...pluginCard.querySelectorAll('.bx-hot path')];
    const core = pluginCard.querySelector('.pi-core');
    const chip = pluginCard.querySelector('.pi-chip');
    const chipName = pluginCard.querySelector('.pi-name');

    const install = async (index) => {
      const tile = tiles[index];
      tile.classList.add('up');
      basePaths[index].classList.add('lit');
      await runPulse(hotPaths[index], 650);
      basePaths[index].classList.remove('lit');
      flash(core, 'pop', 520);
      flash(core, 'ring', 900);
      tile.classList.add('on');
      chipName.textContent = tile.dataset.name;
      flash(chip, 'on', 1900);
    };

    tiles.forEach((tile, index) => {
      tile.addEventListener('mouseenter', () => basePaths[index].classList.add('lit'));
      tile.addEventListener('mouseleave', () => basePaths[index].classList.remove('lit'));
      tile.addEventListener('click', async () => {
        if (reduceMotion) {
          tile.classList.add('on');
          return;
        }

        await install(index);
        setTimeout(() => tile.classList.remove('up'), 700);
      });
    });

    if (reduceMotion) {
      tiles.forEach((tile) => tile.classList.add('on'));
    } else {
      createLoop(pluginCard, async (wait) => {
        tiles.forEach((tile) => tile.classList.remove('on', 'up'));
        await wait(600);

        for (const index of [0, 1, 3, 2]) {
          tiles[index].classList.add('up');
          await wait(420);
          await install(index);
          await wait(1500);
          tiles[index].classList.remove('up');
          await wait(350);
        }
        await wait(1800);
      });
    }
  }

  const scormCard = document.querySelector('[data-bx="scorm"]');
  if (scormCard) {
    const node = scormCard.querySelector('.sp-node');
    const packageFile = scormCard.querySelector('.sp-file');
    const sourceLabel = scormCard.querySelector('.sp-src');
    const pills = [...scormCard.querySelectorAll('.sp-pill')];
    const hotPaths = [...scormCard.querySelectorAll('.bx-hot path')];
    const completion = scormCard.querySelector('.sp-done');
    const sources = ['Articulate', 'Captivate', 'iSpring'];
    let sourceIndex = 0;

    const fillValue = async (pill, wait) => {
      const value = pill.querySelector('.sp-val');
      if (value.dataset.text) {
        value.textContent = value.dataset.text;
        return;
      }

      const target = Number(value.dataset.to);
      for (let current = 0; current < target; current += 6) {
        value.textContent = `${current}${value.dataset.unit}`;
        await wait(20);
      }
      value.textContent = `${target}${value.dataset.unit}`;
    };

    const resetPills = () => {
      pills.forEach((pill) => {
        pill.classList.remove('on');
        const value = pill.querySelector('.sp-val');
        value.textContent = value.dataset.text ? '—' : `0${value.dataset.unit}`;
      });
      completion.classList.remove('on');
    };

    pills.forEach((pill, index) => {
      pill.addEventListener('mouseenter', () => {
        scormCard.querySelectorAll('.bx-base path')[index].classList.add('lit');
        scormCard.querySelectorAll('.bx-base path')[index + 3].classList.add('lit');
      });
      pill.addEventListener('mouseleave', () => {
        scormCard.querySelectorAll('.bx-base path.lit').forEach((path) => path.classList.remove('lit'));
      });
    });

    if (reduceMotion) {
      pills.forEach((pill) => {
        pill.classList.add('on');
        const value = pill.querySelector('.sp-val');
        value.textContent = value.dataset.text || `${value.dataset.to}${value.dataset.unit}`;
      });
      completion.classList.add('on');
    } else {
      const scormLoop = createLoop(scormCard, async (wait) => {
        resetPills();
        packageFile.classList.remove('on', 'in');
        jumpTo(packageFile, () => {
          packageFile.style.setProperty('--fy', '-46px');
          packageFile.style.setProperty('--fs', '1');
        });
        sourceLabel.textContent = `From ${sources[sourceIndex]}`;
        sourceIndex = (sourceIndex + 1) % sources.length;
        await wait(450);

        packageFile.classList.add('on');
        packageFile.style.setProperty('--fy', '-4px');
        await wait(1000);
        packageFile.classList.add('in');
        packageFile.style.setProperty('--fy', '44px');
        packageFile.style.setProperty('--fs', '.3');
        await wait(420);
        flash(node, 'pop', 200);
        flash(node, 'ring', 900);
        await wait(200);

        await Promise.all([0, 1, 2].map((index) => runPulse(hotPaths[index], 750)));
        await Promise.all(
          pills.map(async (pill, index) => {
            await wait(index * 140);
            pill.classList.add('on');
            await fillValue(pill, wait);
          })
        );
        await wait(250);

        await Promise.all([3, 4, 5].map((index) => runPulse(hotPaths[index], 750)));
        completion.classList.add('on');
        await wait(2800);
      });
      node.addEventListener('click', scormLoop.restart);
    }
  }

  const ssoCard = document.querySelector('[data-bx="sso"]');
  if (ssoCard) {
    const stage = ssoCard.querySelector('.bx-stage');
    const signInWindow = ssoCard.querySelector('.ss-win');
    const domain = ssoCard.querySelector('.ss-domain');
    const verified = ssoCard.querySelector('.ss-ver');
    const ssoToggle = ssoCard.querySelector('.ss-tog');
    const ssoButton = ssoCard.querySelector('.ss-btn');
    const swatches = [...ssoCard.querySelectorAll('.ss-sw button')];
    const cursor = ssoCard.querySelector('.bx-cur');
    const domainText = 'learn.yourbrand.com';
    let pickedByVisitor = false;

    const setBrand = (index) => {
      swatches.forEach((swatch, swatchIndex) => swatch.classList.toggle('on', swatchIndex === index));
      stage.style.setProperty('--brand', swatches[index].style.getPropertyValue('--c'));
    };
    const moveCursor = (target) => {
      const point = centerOf(target, stage);
      cursor.style.setProperty('--cx', `${point.x - 3}px`);
      cursor.style.setProperty('--cy', `${point.y - 2}px`);
    };
    const clickCursor = async (wait) => {
      cursor.classList.add('click');
      await wait(180);
      cursor.classList.remove('click');
    };

    swatches.forEach((swatch, index) => {
      swatch.addEventListener('click', () => {
        pickedByVisitor = true;
        setBrand(index);
      });
    });

    if (reduceMotion) {
      domain.textContent = domainText;
      verified.classList.add('on');
      ssoToggle.classList.add('on');
    } else {
      createLoop(ssoCard, async (wait) => {
        signInWindow.classList.remove('signed');
        ssoButton.classList.remove('load', 'press');
        verified.classList.remove('on');
        ssoToggle.classList.remove('on');
        cursor.classList.remove('on');
        jumpTo(cursor, () => {
          cursor.style.setProperty('--cx', '500px');
          cursor.style.setProperty('--cy', '320px');
        });
        if (!pickedByVisitor) setBrand(0);
        domain.textContent = '';
        await wait(600);

        for (let length = 1; length <= domainText.length; length += 1) {
          domain.textContent = domainText.slice(0, length);
          await wait(48);
        }
        await wait(250);
        verified.classList.add('on');
        await wait(500);
        cursor.classList.add('on');

        if (!pickedByVisitor) {
          for (const index of [1, 2]) {
            moveCursor(swatches[index]);
            await wait(850);
            await clickCursor(wait);
            setBrand(index);
            await wait(650);
          }
        }

        moveCursor(ssoToggle);
        await wait(850);
        await clickCursor(wait);
        ssoToggle.classList.add('on');
        await wait(600);

        moveCursor(ssoButton);
        await wait(900);
        ssoButton.classList.add('press');
        await clickCursor(wait);
        ssoButton.classList.remove('press');
        ssoButton.classList.add('load');
        await wait(1000);

        signInWindow.classList.add('signed');
        cursor.classList.remove('on');
        await wait(2800);
      });
    }
  }

  const zapCard = document.querySelector('[data-bx="zap"]');
  if (zapCard) {
    const core = zapCard.querySelector('.zh-core');
    const eventTag = zapCard.querySelector('.zh-evt');
    const chips = [...zapCard.querySelectorAll('.zh-chip')];
    const basePaths = [...zapCard.querySelectorAll('.bx-base path')];
    const hotPaths = [...zapCard.querySelectorAll('.bx-hot path')];

    const send = async (index) => {
      basePaths[index].classList.add('lit');
      await runPulse(hotPaths[index], 650);
      basePaths[index].classList.remove('lit');
      chips[index].classList.add('hit');
    };

    chips.forEach((chip, index) => {
      chip.addEventListener('mouseenter', () => basePaths[index].classList.add('lit'));
      chip.addEventListener('mouseleave', () => basePaths[index].classList.remove('lit'));
      chip.addEventListener('click', async () => {
        if (reduceMotion) return;

        chip.classList.remove('hit');
        flash(core, 'pop', 200);
        await send(index);
        flash(chip, 'hit', 900);
      });
    });

    if (reduceMotion) {
      chips.forEach((chip) => chip.classList.add('hit'));
      eventTag.classList.add('on');
    } else {
      const zapLoop = createLoop(zapCard, async (wait) => {
        chips.forEach((chip) => chip.classList.remove('hit'));
        eventTag.classList.remove('on');
        await wait(700);

        eventTag.classList.add('on');
        flash(core, 'pop', 200);
        flash(core, 'ring', 900);
        await wait(350);
        await send(0);
        await wait(250);
        await Promise.all(
          [1, 2, 3, 4, 5].map(async (index, order) => {
            await wait(order * 130);
            await send(index);
          })
        );
        await wait(2600);
        eventTag.classList.remove('on');
        chips.forEach((chip) => chip.classList.remove('hit'));
        await wait(500);
      });
      core.addEventListener('click', zapLoop.restart);
    }
  }

  const countUp = (element) => {
    const target = Number(element.dataset.count);
    const suffix = element.dataset.suffix || '';
    if (reduceMotion) {
      element.textContent = `${target}${suffix}`;
      return;
    }

    const started = performance.now();
    const step = (now) => {
      const progress = clamp((now - started) / 1600, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = `${Math.round(target * eased)}${suffix}`;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const chartPoints = [
    { title: 'Direction check', fraction: 0, values: [91, 85, 81, 71] },
    { title: 'Feedback practice', fraction: 0.5, values: [87, 89, 85, 78] },
    { title: 'Leadership reflection', fraction: 1, values: [85, 93, 81, 71] }
  ];
  const tip = document.getElementById('chart-tip');
  const tipTitle = document.getElementById('tip-title');
  const tipValues = ['tv1', 'tv2', 'tv3', 'tv4'].map((id) => document.getElementById(id));
  const hoverLine = document.getElementById('hover-line');
  const lineSvg = hoverLine.ownerSVGElement;
  let chartIndex = 1;

  const showChartPoint = (index) => {
    const point = chartPoints[index];
    const lineX = point.fraction * 520;
    hoverLine.setAttribute('x1', String(lineX));
    hoverLine.setAttribute('x2', String(lineX));
    tipTitle.textContent = point.title;
    point.values.forEach((value, valueIndex) => {
      tipValues[valueIndex].textContent = String(value);
    });
    const lineWrap = lineSvg.parentElement;
    const svgLeft = parseFloat(getComputedStyle(lineWrap).paddingLeft);
    const svgWidth = lineWrap.clientWidth - svgLeft;
    const pointLeft = svgLeft + point.fraction * svgWidth;
    const tipLeft = point.fraction > 0.7 ? pointLeft - tip.offsetWidth - 12 : pointLeft + 12;
    tip.style.left = `${tipLeft}px`;
  };

  let dashboardStarted = false;
  const startDashboard = () => {
    if (dashboardStarted) return;

    dashboardStarted = true;
    dashboardWrap.classList.add('in-view');
    dashboardWrap.querySelectorAll('[data-count]').forEach(countUp);
    showChartPoint(chartIndex);
    if (reduceMotion) return;

    setInterval(() => {
      chartIndex = (chartIndex + 1) % chartPoints.length;
      showChartPoint(chartIndex);
    }, 2800);
  };

  if ('IntersectionObserver' in window) {
    const dashboardObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) startDashboard();
      },
      { threshold: 0.2 }
    );
    dashboardObserver.observe(dashboardWrap);
  } else {
    startDashboard();
  }

  const askPrompts = [
    'Add a quiz after "Leading a team"',
    'Translate this course into Spanish',
    'Create a 4-part onboarding course for new admins',
    'Turn our reporting docs into a short course'
  ];
  const askTyped = document.getElementById('ask-typed');
  if (reduceMotion) {
    askTyped.textContent = askPrompts[0];
  } else {
    let promptIndex = 0;
    let letterIndex = 0;
    let deleting = false;
    const typeNext = () => {
      const prompt = askPrompts[promptIndex];
      letterIndex += deleting ? -1 : 1;
      askTyped.textContent = prompt.slice(0, letterIndex);
      let delay = deleting ? 18 : 42 + Math.random() * 40;
      if (!deleting && letterIndex === prompt.length) {
        deleting = true;
        delay = 2200;
      } else if (deleting && letterIndex === 0) {
        deleting = false;
        promptIndex = (promptIndex + 1) % askPrompts.length;
        delay = 400;
      }
      setTimeout(typeNext, delay);
    };
    setTimeout(typeNext, 1200);
  }

  const floatSection = document.getElementById('float');
  const floatLines = [...floatSection.querySelectorAll('.float-line')];
  const floatTicks = [...floatSection.querySelectorAll('.float-progress i')];
  const orbitItems = [...floatSection.querySelectorAll('.ob')].map((element) => ({
    element,
    angle: Number(element.dataset.a),
    radius: Number(element.dataset.r),
    depth: Number(element.dataset.z)
  }));
  let floatProgress = 0;
  let floatVisible = false;

  const setFloatStep = (step) => {
    floatLines.forEach((line, index) => line.classList.toggle('on', index === step));
    floatTicks.forEach((tick, index) => tick.classList.toggle('on', index <= step));
  };

  const readFloatProgress = () => {
    const rect = floatSection.getBoundingClientRect();
    const travel = floatSection.offsetHeight - window.innerHeight;
    floatProgress = clamp(-rect.top / travel, 0, 1);
    floatVisible = rect.top < window.innerHeight && rect.bottom > 0;
    setFloatStep(floatProgress < 0.34 ? 0 : floatProgress < 0.67 ? 1 : 2);
  };

  const placeOrbit = (time) => {
    const isNarrow = window.innerWidth < 640;
    const stageHeight = floatSection.querySelector('.float-stick').clientHeight;
    const radiusX = isNarrow ? window.innerWidth * 0.4 : Math.min(window.innerWidth * 0.37, 540);
    const radiusY = stageHeight * (isNarrow ? 0.36 : 0.34);
    const spread = 1 - Math.pow(1 - clamp(floatProgress * 5 + 0.25, 0, 1), 3);
    orbitItems.forEach((item) => {
      const drift = reduceMotion ? 0 : time * 0.004;
      const degrees = item.angle + floatProgress * 150 + drift;
      const radians = (degrees * Math.PI) / 180;
      const x = Math.cos(radians) * radiusX * item.radius * spread;
      const y = Math.sin(radians) * radiusY * item.radius * spread;
      const bob = reduceMotion ? 0 : Math.sin(time / 1400 + item.angle) * 8;
      const depth = item.depth + Math.sin(radians) * 90;
      const scale = 0.82 + (Math.sin(radians) + 1) * 0.1;
      const turnY = Math.cos(radians) * -16;
      const turnZ = Math.cos(radians + item.angle) * 7;
      item.element.style.transform = `translate3d(${x}px, ${y + bob}px, ${depth}px) rotateY(${turnY}deg) rotateZ(${turnZ}deg) scale(${scale})`;
      item.element.style.zIndex = String(Math.round(depth + 200));
    });
  };

  readFloatProgress();
  placeOrbit(0);
  onScroll(readFloatProgress);
  window.addEventListener('resize', readFloatProgress);
  if (!reduceMotion) {
    const orbitFrame = (time) => {
      if (floatVisible) placeOrbit(time);
      requestAnimationFrame(orbitFrame);
    };
    requestAnimationFrame(orbitFrame);
  }

  const parallaxPhotos = () => {
    if (reduceMotion || window.innerWidth < 860) return;

    document.querySelectorAll('.hp:not([hidden]) .hp-photo img').forEach((image) => {
      const rect = image.parentElement.getBoundingClientRect();
      const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * -0.08;
      image.style.transform = `translateY(${offset - 40}px)`;
    });
  };
  onScroll(parallaxPhotos);
  parallaxPhotos();

  const quizOptions = [...document.querySelectorAll('#quiz-opts .opt-c')];
  if (!reduceMotion) {
    let quizIndex = 0;
    setInterval(() => {
      quizIndex = (quizIndex + 1) % quizOptions.length;
      quizOptions.forEach((option, index) => option.classList.toggle('on', index === quizIndex));
    }, 2200);
  }

  const aiRoot = document.getElementById('ncards');
  const aiCards = [...aiRoot.querySelectorAll('.nc')];
  const aiStages = [...aiRoot.querySelectorAll('.nd-stage')];

  const fitAiStage = (stage) => {
    const demo = stage.parentElement;
    const baseWidth = Number(stage.dataset.w);
    const baseHeight = Number(stage.dataset.h);
    const fitScale = Math.min((demo.clientWidth - 36) / baseWidth, (demo.clientHeight - 40) / baseHeight, 1);
    stage.style.setProperty('--w', baseWidth);
    stage.style.setProperty('--h', baseHeight);
    stage.style.setProperty('--k', Math.max(fitScale, 0.25).toFixed(3));
  };
  const aiResize = new ResizeObserver((entries) => {
    entries.forEach((entry) => fitAiStage(entry.target.querySelector('.nd-stage')));
  });
  aiStages.forEach((stage) => {
    fitAiStage(stage);
    aiResize.observe(stage.parentElement);
  });
  aiCards.forEach((card) => card.style.setProperty('--dur', `${card.dataset.dur}ms`));

  const typeText = async (element, text, wait, speed = 34) => {
    for (let length = 1; length <= text.length; length += 1) {
      element.textContent = text.slice(0, length);
      await wait(speed);
    }
  };

  const streamRich = async (element, parts, wait) => {
    for (const [text, bold] of parts) {
      const target = bold ? element.appendChild(document.createElement('b')) : element;
      const words = text.split(/(\s+)/);
      for (const word of words) {
        target.append(word);
        if (word.trim()) await wait(45);
      }
    }
  };

  const courseDemo = {
    reset(card) {
      card.querySelector('.cg-prompt').classList.remove('gone');
      card.querySelector('.cg-text').textContent = '';
      card.querySelector('.cg-plan').classList.remove('on');
      card.querySelector('.cg-status').textContent = 'Drafting…';
      card.querySelectorAll('.cg-list li').forEach((row) => row.classList.remove('on', 'done'));
      card.querySelector('.cg-impl').className = 'cg-impl';
      card.querySelector('.cg-prog').classList.remove('on');
      card.querySelector('.cg-prog i').style.width = '0';
      card.querySelector('.cg-count').textContent = '';
      card.querySelector('.cg-course').classList.remove('on');
      card.querySelector('.cg-ready').classList.remove('on');
      card.querySelector('.cg-spark').classList.remove('on');
    },
    async play(card, wait) {
      const generateButton = card.querySelector('.cg-go');
      const status = card.querySelector('.cg-status');
      const rows = [...card.querySelectorAll('.cg-list li')];
      const implementButton = card.querySelector('.cg-impl');
      const progress = card.querySelector('.cg-prog');
      const progressFill = progress.querySelector('i');
      const counter = card.querySelector('.cg-count');
      const lessonsPerRow = [3, 2, 3, 1];
      const totalItems = 9;

      await wait(500);
      await typeText(card.querySelector('.cg-text'), 'An onboarding course for new admins', wait, 38);
      await wait(350);
      generateButton.classList.add('press');
      await wait(160);
      generateButton.classList.remove('press');
      await wait(200);
      card.querySelector('.cg-prompt').classList.add('gone');
      await wait(350);
      card.querySelector('.cg-plan').classList.add('on');
      await wait(450);
      for (const row of rows) {
        row.classList.add('on');
        await wait(380);
      }
      status.textContent = 'Ready for review';
      implementButton.classList.add('on');
      await wait(300);
      implementButton.classList.add('pulse');
      await wait(1300);
      implementButton.classList.remove('pulse');
      implementButton.classList.add('press');
      await wait(160);
      implementButton.classList.remove('press');
      implementButton.classList.add('gone');
      status.textContent = 'Building…';
      progress.classList.add('on');

      let builtItems = 0;
      for (const [rowIndex, row] of rows.entries()) {
        for (let item = 0; item < lessonsPerRow[rowIndex]; item += 1) {
          builtItems += 1;
          progressFill.style.width = `${(builtItems / totalItems) * 100}%`;
          counter.textContent = `${builtItems}/${totalItems}`;
          await wait(170);
        }
        row.classList.add('done');
      }
      status.textContent = 'Done';
      await wait(250);
      card.querySelector('.cg-course').classList.add('on');
      await wait(700);
      card.querySelector('.cg-spark').classList.add('on');
      card.querySelector('.cg-ready').classList.add('on');
      await wait(2600);
    }
  };

  const transcriptLanguages = [
    {
      name: 'English',
      segments: [
        'Welcome to the workspace tour.',
        'First, open Settings from the sidebar.',
        'Invite your team by email.',
        'Then give each person a role.'
      ]
    },
    {
      name: 'Français',
      segments: [
        'Bienvenue dans la visite de l’espace de travail.',
        'Ouvrez d’abord les paramètres dans la barre latérale.',
        'Invitez votre équipe par e-mail.',
        'Attribuez ensuite un rôle à chacun.'
      ]
    },
    {
      name: 'Español',
      segments: [
        'Bienvenido al recorrido por el espacio de trabajo.',
        'Primero, abre Ajustes en la barra lateral.',
        'Invita a tu equipo por correo.',
        'Luego asigna un rol a cada persona.'
      ]
    }
  ];
  let transcriptLanguageIndex = 0;
  const waveRoot = aiRoot.querySelector('.tv-wave');
  const waveBars = Array.from({ length: 34 }, () => waveRoot.appendChild(document.createElement('i')));

  const transcribeDemo = {
    reset(card) {
      card.querySelector('.tv-player').classList.remove('playing');
      card.querySelector('.tv-menu').classList.remove('on');
      card.querySelector('.tv-gen-item').classList.remove('hi');
      card.querySelector('.tv-busy').classList.remove('on');
      card.querySelector('.tv-lang').classList.remove('on', 'flip');
      card.querySelector('.tv-track i').style.width = '0';
      card.querySelector('.tv-time').textContent = '0:00';
      waveBars.forEach((bar) => {
        bar.style.height = '';
        bar.classList.remove('past');
      });
      card.querySelectorAll('.tv-segs li').forEach((row) => {
        row.classList.remove('on', 'now');
        row.querySelector('p').textContent = '';
      });
    },
    async play(card, wait) {
      const language = transcriptLanguages[transcriptLanguageIndex];
      transcriptLanguageIndex = (transcriptLanguageIndex + 1) % transcriptLanguages.length;
      const menuButton = card.querySelector('.tv-dots');
      const menu = card.querySelector('.tv-menu');
      const languageChip = card.querySelector('.tv-lang');
      const rows = [...card.querySelectorAll('.tv-segs li')];
      const track = card.querySelector('.tv-track i');
      const clock = card.querySelector('.tv-time');
      const videoSeconds = 24;
      const frameCount = 70;

      await wait(500);
      menuButton.classList.add('press');
      await wait(150);
      menuButton.classList.remove('press');
      menu.classList.add('on');
      await wait(600);
      card.querySelector('.tv-gen-item').classList.add('hi');
      await wait(450);
      menu.classList.remove('on');
      card.querySelector('.tv-busy').classList.add('on');
      await wait(1100);
      card.querySelector('.tv-busy').classList.remove('on');
      languageChip.querySelector('i').textContent = `Detected · ${language.name}`;
      languageChip.classList.add('on', 'flip');

      for (const [rowIndex, row] of rows.entries()) {
        row.classList.add('on');
        const paragraph = row.querySelector('p');
        for (const word of language.segments[rowIndex].split(' ')) {
          const wordElement = document.createElement('span');
          wordElement.textContent = `${word} `;
          paragraph.appendChild(wordElement);
          await wait(40);
        }
        await wait(120);
      }

      await wait(300);
      card.querySelector('.tv-player').classList.add('playing');
      for (let frame = 0; frame <= frameCount; frame += 1) {
        const progress = frame / frameCount;
        const second = progress * videoSeconds;
        const segmentIndex = Math.min(Math.floor(second / 6), rows.length - 1);
        const segmentProgress = (second - segmentIndex * 6) / 6;
        track.style.width = `${progress * 100}%`;
        clock.textContent = `0:${String(Math.floor(second)).padStart(2, '0')}`;
        waveBars.forEach((bar, barIndex) => {
          bar.style.height = `${18 + Math.abs(Math.sin(frame * 0.55 + barIndex * 0.8)) * 70 + Math.random() * 12}%`;
          bar.classList.toggle('past', barIndex / waveBars.length < progress);
        });
        rows.forEach((row, rowIndex) => {
          row.classList.toggle('now', rowIndex === segmentIndex);
          const words = [...row.querySelectorAll('p span')];
          words.forEach((word, wordIndex) => {
            const litBefore = rowIndex < segmentIndex;
            const litNow = rowIndex === segmentIndex && wordIndex / words.length <= segmentProgress;
            word.classList.toggle('lit', litBefore || litNow);
          });
        });
        await wait(80);
      }
      await wait(1500);
    }
  };

  const mcpDemo = {
    reset(card) {
      card.querySelector('.mc-lines').textContent = '';
      card.querySelector('.mc-link').classList.remove('on');
      card.querySelector('.mc-auth').classList.remove('on', 'gone');
      card.querySelector('.mc-course').classList.remove('on');
      card
        .querySelectorAll('.mc-ch b, .mc-pub, .mc-course li, .mc-by')
        .forEach((element) => element.classList.remove('on'));
      card.querySelectorAll('.mc-packet').forEach((packet) => packet.remove());
    },
    async play(card, wait) {
      const lines = card.querySelector('.mc-lines');
      const link = card.querySelector('.mc-link');
      const auth = card.querySelector('.mc-auth');
      const course = card.querySelector('.mc-course');
      const lessons = [...course.querySelectorAll('li')];
      const serverNode = card.querySelector('.mc-cio');
      const addLine = (className, html = '') => {
        const line = document.createElement('div');
        line.className = className;
        line.innerHTML = html;
        lines.appendChild(line);
        while (lines.scrollHeight > lines.clientHeight && lines.children.length > 1) lines.firstElementChild.remove();
        return line;
      };
      const sendPacket = async () => {
        if (reduceMotion) return;

        const packet = link.appendChild(document.createElement('span'));
        packet.className = 'mc-packet';
        await packet.animate(
          [
            { transform: 'translateX(0) scale(.6)', opacity: 0 },
            { transform: 'translateX(30px) scale(1)', opacity: 1, offset: 0.2 },
            { transform: 'translateX(136px) scale(.6)', opacity: 0 }
          ],
          { duration: 520, easing: 'cubic-bezier(.45, 0, .25, 1)' }
        ).finished;
        packet.remove();
      };
      const toolCalls = [
        ['create_course', () => course.querySelector('.mc-ch b').classList.add('on')],
        ['create_course_section', () => undefined],
        ['create_lesson', () => lessons[0].classList.add('on')],
        ['create_lesson', () => lessons[1].classList.add('on')],
        ['create_lesson', () => lessons[2].classList.add('on')],
        ['publish_course', () => course.querySelector('.mc-pub').classList.add('on')]
      ];

      await wait(400);
      await typeText(addLine('p'), 'claude mcp add --transport http classroomio https://mcp.classroomio.com', wait, 16);
      await wait(300);
      addLine('m', 'Opening ClassroomIO sign-in…');
      auth.classList.add('on');
      await wait(1000);
      auth.querySelector('.mc-ok').classList.add('press');
      await wait(160);
      auth.querySelector('.mc-ok').classList.remove('press');
      await wait(200);
      auth.classList.add('gone');
      link.classList.add('on');
      card.querySelectorAll('.mc-node').forEach((node) => flash(node, 'pop', 520));
      addLine('ok-line', '✓ Connected to classroomio');
      await wait(700);
      await typeText(addLine('u'), 'Create a 3-lesson SOC 2 course and publish it', wait, 26);
      await wait(400);
      course.classList.add('on');
      await wait(300);

      for (const [toolName, applyResult] of toolCalls) {
        const line = addLine('t', `<b>classroomio</b><em>${toolName}</em><s>✓</s>`);
        await sendPacket();
        flash(serverNode, 'pop', 520);
        line.classList.add('ok');
        applyResult();
        await wait(260);
      }
      course.querySelector('.mc-by').classList.add('on');
      addLine('m', 'SOC 2 Security Basics is live with 3 lessons.');
      await wait(2600);
    }
  };

  const tutorDemo = {
    reset(card) {
      card.querySelector('.tu-fab').className = 'tu-fab';
      card.querySelector('.tu-panel').classList.remove('on');
      card.querySelector('.tu-msgs').textContent = '';
      card.querySelector('.tu-typed').textContent = '';
      card.querySelector('.tu-hl').classList.remove('on');
    },
    async play(card, wait) {
      const askButton = card.querySelector('.tu-fab');
      const messages = card.querySelector('.tu-msgs');
      const typed = card.querySelector('.tu-typed');
      const sendButton = card.querySelector('.tu-input em');
      const addMessage = (className, html = '') => {
        const message = document.createElement('div');
        message.className = className;
        message.innerHTML = html;
        messages.appendChild(message);
        return message;
      };
      const ask = async (question) => {
        await typeText(typed, question, wait, 30);
        await wait(250);
        flash(sendButton, 'press', 160);
        typed.textContent = '';
        addMessage('tu-q', question);
      };
      const answer = async (toolLabel, parts, citation, onRead) => {
        await wait(300);
        const tool = addMessage('tu-tool', `<i class="spin"></i>${toolLabel}`);
        await wait(750);
        tool.classList.add('done');
        onRead();
        const dots = addMessage('tu-dots', '<i></i><i></i><i></i>');
        await wait(600);
        dots.remove();
        const reply = addMessage('tu-a');
        const replyText = reply.appendChild(document.createElement('span'));
        await streamRich(replyText, parts, wait);
        reply.insertAdjacentHTML('beforeend', `<br><span class="tu-cite">↗ ${citation}</span>`);
      };

      await wait(500);
      askButton.classList.add('pulse');
      await wait(1200);
      askButton.classList.remove('pulse');
      askButton.classList.add('press');
      await wait(150);
      askButton.classList.add('gone');
      card.querySelector('.tu-panel').classList.add('on');
      await wait(500);

      await ask('Where do I create the API key for this?');
      await answer(
        'Reading this lesson',
        [
          ['Go to ', false],
          ['Settings → API', true],
          [' and click ', false],
          ['Create key', true],
          ['. You paste it in when you connect the source.', false]
        ],
        'Lesson 3 · Connect your first data source',
        () => card.querySelector('.tu-hl').classList.add('on')
      );
      await wait(1400);
      await ask('Can I rotate it later?');
      await answer(
        'Searching the course',
        [['Yes. Rotating and revoking keys is covered later in this course.', false]],
        'Lesson 6 · Rotate and revoke keys',
        () => undefined
      );
      await wait(2400);
    }
  };

  const aiDemos = { course: courseDemo, transcribe: transcribeDemo, mcp: mcpDemo, tutor: tutorDemo };
  let aiIndex = 0;
  let aiRun = 0;
  let aiHovered = false;
  let aiVisible = false;

  const waitFor = (runId) => (ms) =>
    new Promise((resolve, reject) => {
      setTimeout(() => (runId === aiRun ? resolve() : reject(new Error('superseded'))), ms);
    });

  const playAiDemo = async () => {
    const runId = ++aiRun;
    const card = aiCards[aiIndex];
    const demo = aiDemos[card.dataset.demo];
    const wait = waitFor(runId);
    aiCards.forEach((otherCard) => aiDemos[otherCard.dataset.demo].reset(otherCard));
    if (!aiVisible) return;

    while (runId === aiRun) {
      const finished = await demo.play(card, wait).then(
        () => true,
        () => false
      );
      if (!finished) return;

      if (!aiHovered) {
        activateAi((aiIndex + 1) % aiCards.length);
        return;
      }

      demo.reset(card);
      await wait(400).catch(() => undefined);
    }
  };

  const activateAi = (index) => {
    aiIndex = index;
    aiCards.forEach((card, cardIndex) => card.classList.toggle('on', cardIndex === index));
    const bar = aiCards[index].querySelector('.nc-bar i');
    bar.style.animation = 'none';
    void bar.offsetWidth;
    bar.style.animation = '';
    playAiDemo();
  };

  if (reduceMotion) {
    const instant = () => Promise.resolve();
    aiCards.forEach((card) => aiDemos[card.dataset.demo].play(card, instant));
    aiCards.forEach((card, index) => {
      card.addEventListener('click', () =>
        aiCards.forEach((other, otherIndex) => other.classList.toggle('on', otherIndex === index))
      );
    });
  } else {
    aiCards.forEach((card, index) => {
      card.addEventListener('mouseenter', () => {
        aiHovered = true;
        aiRoot.classList.add('paused');
        if (index !== aiIndex) activateAi(index);
      });
      card.addEventListener('click', () => {
        if (index !== aiIndex) activateAi(index);
      });
    });
    aiRoot.addEventListener('mouseleave', () => {
      aiHovered = false;
      aiRoot.classList.remove('paused');
    });
    new IntersectionObserver(
      ([entry]) => {
        const wasVisible = aiVisible;
        aiVisible = entry.isIntersecting;
        if (aiVisible && !wasVisible) playAiDemo();
        if (!aiVisible && wasVisible) aiRun += 1;
      },
      { threshold: 0.25 }
    ).observe(aiRoot);
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

  const carousel = document.getElementById('car');
  const carouselTrack = document.getElementById('car-track');
  const slides = [...carouselTrack.querySelectorAll('.slide')];
  const dotsRoot = document.getElementById('car-dots');
  const dots = slides.map(() => {
    const dot = document.createElement('i');
    dotsRoot.appendChild(dot);
    return dot;
  });
  let slideIndex = 0;
  let carouselTimer = null;

  const showSlide = (index) => {
    slideIndex = (index + slides.length) % slides.length;
    const activeSlide = slides[slideIndex];
    const offset = activeSlide.offsetLeft - (carousel.clientWidth - activeSlide.offsetWidth) / 2;
    carouselTrack.style.transform = `translateX(${-offset}px)`;
    slides.forEach((slide, slideNumber) => {
      slide.classList.toggle('on', slideNumber === slideIndex);
      slide.setAttribute('aria-hidden', String(slideNumber !== slideIndex));
    });
    dots.forEach((dot, dotNumber) => dot.classList.toggle('on', dotNumber === slideIndex));
  };
  const scheduleCarousel = () => {
    clearInterval(carouselTimer);
    if (reduceMotion) return;

    carouselTimer = setInterval(() => showSlide(slideIndex + 1), 5500);
  };
  document.getElementById('car-prev').addEventListener('click', () => {
    showSlide(slideIndex - 1);
    scheduleCarousel();
  });
  document.getElementById('car-next').addEventListener('click', () => {
    showSlide(slideIndex + 1);
    scheduleCarousel();
  });
  let swipeStartX = null;
  carousel.addEventListener('pointerdown', (event) => {
    swipeStartX = event.clientX;
  });
  carousel.addEventListener('pointerup', (event) => {
    if (swipeStartX === null) return;

    const distance = event.clientX - swipeStartX;
    swipeStartX = null;
    if (Math.abs(distance) < 40) return;

    showSlide(slideIndex + (distance < 0 ? 1 : -1));
    scheduleCarousel();
  });
  slides.forEach((slide, index) => {
    slide.addEventListener('click', () => {
      if (index === slideIndex) return;

      showSlide(index);
      scheduleCarousel();
    });
  });
  window.addEventListener('resize', () => showSlide(slideIndex));
  window.addEventListener('load', () => showSlide(slideIndex));
  showSlide(0);
  scheduleCarousel();

  const tourCursor = document.getElementById('tcur');
  const dashboardGrid = tourCursor.parentElement;
  const tourRange = [...dashboardGrid.querySelectorAll('.db-range > *')];
  const tourSegment = [...dashboardGrid.querySelectorAll('.db-seg > *')];
  const tourWait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const tourPick = (items, target) =>
    items.forEach((item) => {
      item.classList.toggle('hot', item === target);
      item.classList.toggle('cold', item !== target);
    });
  const tourTo = (target, offsetX = 0.5, offsetY = 0.55) => {
    const scale = dashboardTilt.clientWidth / dashboardWidth;
    const gridRect = dashboardGrid.getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    const x = (rect.left - gridRect.left + rect.width * offsetX) / scale;
    const y = (rect.top - gridRect.top + rect.height * offsetY) / scale;
    tourCursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };
  const tourClick = async (target) => {
    tourCursor.classList.remove('click');
    void tourCursor.offsetWidth;
    tourCursor.classList.add('click');
    target.style.transition = 'transform .2s';
    target.style.transform = 'scale(.94)';
    await tourWait(160);
    target.style.transform = '';
  };
  const dashboardReady = () => {
    const shell = Number(getComputedStyle(dashboardTilt).getPropertyValue('--shell') || 1);
    return shell > 0.9;
  };
  const runTour = async () => {
    const assistantButton = dashboardGrid.querySelector('.db-ai');
    const lineChart = dashboardGrid.querySelector('.line-wrap');
    const steps = [
      () => [tourRange[1], () => tourPick(tourRange, tourRange[1])],
      () => [tourRange[3], () => tourPick(tourRange, tourRange[3])],
      () => [tourSegment[0], () => tourPick(tourSegment, tourSegment[0])],
      () => [lineChart, null],
      () => [tourSegment[1], () => tourPick(tourSegment, tourSegment[1])],
      () => [tourRange[0], () => tourPick(tourRange, tourRange[0])],
      () => [assistantButton, null]
    ];
    let index = 0;
    for (;;) {
      if (!dashboardReady() || document.hidden) {
        await tourWait(500);
        continue;
      }
      const [target, apply] = steps[index % steps.length]();
      tourTo(target, target === lineChart ? 0.55 : 0.5, target === lineChart ? 0.5 : 0.55);
      await tourWait(1500);
      if (apply) {
        await tourClick(target);
        apply();
      }
      await tourWait(1500);
      index += 1;
    }
  };
  if (!reduceMotion) {
    tourTo(tourRange[0]);
    runTour();
  } else {
    tourCursor.style.display = 'none';
  }

  const marqueeTrack = document.querySelector('.marq-track');
  if (marqueeTrack) {
    const copy = marqueeTrack.firstElementChild.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    marqueeTrack.appendChild(copy);
  }

  runScrollListeners();
})();
