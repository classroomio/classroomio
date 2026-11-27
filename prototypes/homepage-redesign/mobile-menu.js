(function () {
  const nav = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const sheet = document.getElementById('sheet');
  if (!nav || !burger || !sheet) return;

  const desktopQuery = window.matchMedia('(min-width: 861px)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const chevron = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>';
  const arrow = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';

  /**
   * Copies a desktop dropdown item into a mobile menu row.
   * @param {HTMLAnchorElement} source
   * @returns {HTMLAnchorElement}
   */
  function buildItem(source) {
    const item = document.createElement('a');
    item.href = source.getAttribute('href');
    const icon = source.querySelector('.dd-ic');
    const title = source.querySelector('b');
    const description = source.querySelector('em');
    const iconHtml = icon ? `<i class="mm-ic" aria-hidden="true">${icon.textContent}</i>` : '';
    const descriptionHtml = description ? `<em>${description.textContent}</em>` : '';
    item.className = description ? 'mm-item' : 'mm-chip';
    item.innerHTML = `${iconHtml}<span><b>${title.textContent}</b>${descriptionHtml}</span>`;
    return item;
  }

  /**
   * Builds one collapsible group from a desktop dropdown.
   * @param {Element} dropdown
   * @param {number} index
   * @returns {HTMLDivElement}
   */
  function buildGroup(dropdown, index) {
    const label = dropdown.querySelector('.dd-btn').textContent.trim();
    const menu = dropdown.querySelector('.dd-menu');
    const panelId = `mm-panel-${index}`;
    const group = document.createElement('div');
    group.className = 'mm-row mm-group';
    group.innerHTML = `<button class="mm-acc" type="button" aria-expanded="false" aria-controls="${panelId}"><span>${label}</span><i class="mm-chev">${chevron}</i></button><div class="mm-panel" id="${panelId}"><div class="mm-panel-in"></div></div>`;
    const panelInner = group.querySelector('.mm-panel-in');
    const columns = menu.querySelectorAll('.dd-col');

    if (!columns.length) {
      const list = document.createElement('div');
      list.className = 'mm-list';
      menu.querySelectorAll(':scope > .dd-item').forEach((source) => list.append(buildItem(source)));
      panelInner.append(list);
      return group;
    }

    columns.forEach((column) => {
      const heading = column.querySelector('.dd-h');
      if (heading) {
        const subheading = document.createElement('p');
        subheading.className = 'mm-sub';
        subheading.textContent = heading.textContent;
        panelInner.append(subheading);
      }
      const isChipColumn = Boolean(column.querySelector('.dd-item.sm'));
      const list = document.createElement('div');
      list.className = isChipColumn ? 'mm-chips' : 'mm-list';
      column.querySelectorAll('.dd-item').forEach((source) => list.append(buildItem(source)));
      panelInner.append(list);
    });
    return group;
  }

  /**
   * Builds a plain top-level row from a desktop nav link.
   * @param {HTMLAnchorElement} source
   * @returns {HTMLAnchorElement}
   */
  function buildLink(source) {
    const link = document.createElement('a');
    link.href = source.getAttribute('href');
    link.className = 'mm-row mm-link';
    if (source.getAttribute('aria-current') === 'page') link.setAttribute('aria-current', 'page');
    link.innerHTML = `<span>${source.textContent.trim()}</span><i class="mm-go">${arrow}</i>`;
    return link;
  }

  const scroller = document.createElement('div');
  scroller.className = 'mm-scroll';
  scroller.setAttribute('data-lenis-prevent', '');
  let groupIndex = 0;
  document.querySelectorAll('.nav-links > *').forEach((entry) => {
    const row = entry.classList.contains('dd') ? buildGroup(entry, groupIndex++) : buildLink(entry);
    scroller.append(row);
  });

  const loginHref = nav.querySelector('.nav-cta .btn-line')?.getAttribute('href') || 'https://classroomio.com/login';
  const signupHref = nav.querySelector('.nav-cta .btn-blue')?.getAttribute('href') || 'https://classroomio.com/signup';
  const footer = document.createElement('div');
  footer.className = 'mm-foot';
  footer.innerHTML = `<div class="mm-cta"><a class="btn btn-line" href="${loginHref}">Log in</a><a class="btn btn-blue" href="${signupHref}">Start for free</a></div><a class="mm-demo" href="https://cal.com/classroomio/demo">Not sure where to start? <b>Book a demo</b></a>`;

  sheet.replaceChildren(scroller, footer);
  sheet.setAttribute('aria-label', 'Menu');
  [...scroller.children].forEach((row, index) => row.style.setProperty('--i', String(index)));

  let closeTimer = 0;

  /** Sizes the menu to fill the space between the nav bar and the bottom of the screen. */
  function fitToViewport() {
    const navBottom = Math.max(nav.getBoundingClientRect().bottom, 0);
    nav.style.setProperty('--mm-height', `${window.innerHeight - navBottom}px`);
  }

  /** Opens the menu below the nav bar and locks page scroll. */
  function openMenu() {
    window.clearTimeout(closeTimer);
    fitToViewport();
    sheet.hidden = false;
    nav.classList.add('menu-open');
    document.documentElement.classList.add('mm-lock');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
    requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add('open')));
  }

  /**
   * Closes the menu and restores page scroll.
   * @param {{ returnFocus?: boolean }} [options]
   */
  function closeMenu(options = {}) {
    if (burger.getAttribute('aria-expanded') !== 'true') return;

    sheet.classList.remove('open');
    nav.classList.remove('menu-open');
    document.documentElement.classList.remove('mm-lock');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    if (options.returnFocus) burger.focus();
    closeTimer = window.setTimeout(
      () => {
        sheet.hidden = true;
      },
      reduceMotion.matches ? 0 : 260
    );
  }

  burger.addEventListener('click', () => {
    if (burger.getAttribute('aria-expanded') === 'true') closeMenu();
    else openMenu();
  });

  scroller.addEventListener('click', (event) => {
    const toggle = event.target.closest('.mm-acc');
    if (toggle) {
      const willOpen = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(willOpen));
      toggle.parentElement.classList.toggle('is-open', willOpen);
      return;
    }

    if (event.target.closest('a')) closeMenu();
  });
  footer.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu({ returnFocus: true });
  });
  window.addEventListener('resize', () => {
    if (burger.getAttribute('aria-expanded') !== 'true') return;

    if (desktopQuery.matches) closeMenu();
    else fitToViewport();
  });
  desktopQuery.addEventListener('change', (event) => {
    if (event.matches) closeMenu();
  });
})();
