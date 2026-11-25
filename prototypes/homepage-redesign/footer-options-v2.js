(() => {
  const site = 'https://classroomio.com/';
  const groups = [
    [
      'Product',
      [
        ['AI Agents', 'index.html#ncard-agents'],
        ['Branded Academies', 'index.html#bx-academy'],
        ['Analytics', 'index.html#hs'],
        ['Integrations', 'index.html#bx-integrations'],
        ['Plugins', 'index.html#bx-plugins'],
        ['Pricing', 'pricing.html']
      ]
    ],
    [
      'Solutions',
      [
        ['Customer Education', site + 'customer-education'],
        ['Partner Training', site + 'partner-training'],
        ['Cohort Training', site + 'cohort-training'],
        ['Certification Programs', site + 'certification-programs']
      ]
    ],
    [
      'For Devs',
      [
        ['API', site + 'developers'],
        ['MCP server & skills', site + 'mcp-recipes'],
        ['Self-hosting docs', site + 'docs'],
        ['GitHub', site + 'github']
      ]
    ],
    [
      'Resources',
      [
        ['Customer stories', 'customers.html'],
        ['Blog', site + 'blog'],
        ['Help center', site + 'help'],
        ['Changelog', site + 'changelog'],
        ['Roadmap', site + 'roadmap']
      ]
    ],
    [
      'Compare platforms',
      [
        'Skilljar',
        'LearnUpon',
        'Docebo',
        'Intellum',
        'Thought Industries',
        'Thinkific',
        'Teachfloor',
        'Teachable',
        'Kajabi',
        'Disco',
        'Trainn'
      ].map((name) => [name, site + 'alternatives/' + name.toLowerCase().replace(/ /g, '-')])
    ],
    [
      'Company',
      [
        ['Roadmap', site + 'roadmap'],
        ['Support', site + 'help'],
        ['Privacy Policy', site + 'privacy'],
        ['Terms of Use', site + 'terms']
      ]
    ]
  ];
  const icon = (paths) =>
    `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  const socials = [
    [
      'LinkedIn',
      '#',
      icon(
        '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 10.5V16M8 7.6v.1M11.5 16v-5.5M11.5 13c0-1.6 1-2.6 2.4-2.6s2.1.9 2.1 2.6V16"/>'
      )
    ],
    ['X (Twitter)', 'https://twitter.com/classroomio', icon('<path d="M4 4l16 16M20 4L4 20"/>')],
    [
      'Instagram',
      '#',
      icon('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.3 6.7v.1"/>')
    ],
    [
      'YouTube',
      'https://www.youtube.com/@ClassroomIO',
      icon('<rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="M10 9.2v5.6l4.8-2.8z" fill="currentColor"/>')
    ],
    ['TikTok', '#', icon('<path d="M13.5 3v11.2a3.3 3.3 0 1 1-3.3-3.3"/><path d="M13.5 3c.4 2.6 2.2 4.3 4.8 4.5"/>')]
  ];
  const escapeText = (text) => text.replace(/&/g, '&amp;');
  const columns = groups
    .map(
      ([title, links]) =>
        `<div><b>${title}</b>${links.map(([label, href]) => `<a href="${href}">${escapeText(label)}</a>`).join('')}</div>`
    )
    .join('');
  const bottom = `
    <div class="ft-legal"><a href="${site}terms">Terms of Use</a>, <a href="${site}privacy">Privacy Policy</a> and <a href="${site}privacy">Cookies</a></div>
    <div class="ft-right"><span>© 2026 ClassroomIO · AGPL-3.0</span><div class="ft-social">${socials.map(([label, href, svg]) => `<a href="${href}" aria-label="${label}">${svg}</a>`).join('')}</div></div>`;
  document.querySelectorAll('[data-cols]').forEach((node) => {
    node.innerHTML = columns;
  });
  document.querySelectorAll('[data-bot]').forEach((node) => {
    node.innerHTML = bottom;
  });

  const tickerItems = [
    'Open source',
    'Cloud or self-hosted',
    'Free plan',
    'Works with Claude & Cursor',
    'AI Tutor',
    'SCORM',
    'Custom domains',
    'Certificates'
  ];
  const tickerRun = tickerItems
    .map((item) => `<span class="mq-item">${escapeText(item)}</span><i class="mq-dot" aria-hidden="true"></i>`)
    .join('');
  document.querySelectorAll('[data-ticker]').forEach((node) => {
    node.classList.add('mq');
    node.innerHTML = `<div class="mq-track">${tickerRun}<span class="mq-copy" aria-hidden="true">${tickerRun}</span></div>`;
  });
  const wordRun = '<span class="mq-word">ClassroomIO</span><img class="mq-logo" src="images/logo.svg" alt="">'.repeat(
    3
  );
  document.querySelectorAll('[data-word-marquee]').forEach((node) => {
    node.innerHTML = `<div class="mq-track" aria-hidden="true">${wordRun}<span class="mq-copy">${wordRun}</span></div>`;
  });

  document.querySelectorAll('.ft-mark > span').forEach((word) => {
    word.setAttribute('aria-label', word.textContent);
    word.innerHTML = [...word.textContent]
      .map((letter, index) => `<i aria-hidden="true" style="--i:${index}">${letter}</i>`)
      .join('');
  });
  document.querySelectorAll('.ft-cols').forEach((cols) => {
    [...cols.children].forEach((column, index) => column.style.setProperty('--i', index));
  });

  const params = new URLSearchParams(location.search);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stillFrame = params.has('only') || reduceMotion;
  const footers = [...document.querySelectorAll('.ft')];

  const settle = (footer) => {
    footer.classList.add('in');
    setTimeout(() => footer.classList.add('done'), 1400);
  };
  if (stillFrame) {
    footers.forEach((footer) => footer.classList.add('in', 'done'));
  } else {
    const revealer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          settle(entry.target);
          revealer.unobserve(entry.target);
        });
      },
      { threshold: 0.18 }
    );
    footers.forEach((footer) => revealer.observe(footer));
  }

  document.querySelectorAll('.ft-mark > span').forEach((word) => {
    const letters = [...word.children];
    word.addEventListener('pointermove', (event) => {
      if (!word.closest('.done')) return;

      letters.forEach((letter) => {
        const box = letter.getBoundingClientRect();
        const distance = Math.abs(event.clientX - (box.left + box.width / 2)) / box.width;
        letter.style.setProperty('--lift', (Math.exp((-distance * distance) / 2.2) * -0.14).toFixed(3) + 'em');
      });
    });
    word.addEventListener('pointerleave', () => letters.forEach((letter) => letter.style.removeProperty('--lift')));
  });

  const marquees = [...document.querySelectorAll('.mq')].map((node) => ({
    node,
    track: node.querySelector('.mq-track'),
    offset: 0,
    speed: node.matches('[data-word-marquee]') ? 0.55 : 0.7,
    hovered: false,
    visible: false
  }));
  let scrollBoost = 0;
  let direction = 1;
  let lastScroll = scrollY;
  addEventListener(
    'scroll',
    () => {
      const delta = scrollY - lastScroll;
      lastScroll = scrollY;
      if (delta !== 0) direction = delta > 0 ? 1 : -1;
      scrollBoost = Math.min(Math.abs(delta) * 0.6, 26);
    },
    { passive: true }
  );

  if (!stillFrame) {
    const watcher = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const marquee = marquees.find((item) => item.node === entry.target);
        marquee.visible = entry.isIntersecting;
      });
    });
    marquees.forEach((marquee) => {
      watcher.observe(marquee.node);
      marquee.node.addEventListener('pointerenter', () => {
        marquee.hovered = true;
      });
      marquee.node.addEventListener('pointerleave', () => {
        marquee.hovered = false;
      });
    });
    let lastFrame = performance.now();
    const tick = (now) => {
      const frameScale = Math.min((now - lastFrame) / 16.67, 4);
      lastFrame = now;
      scrollBoost *= Math.pow(0.92, frameScale);
      marquees.forEach((marquee) => {
        if (!marquee.visible) return;

        const half = marquee.track.scrollWidth / 2;
        const pace = marquee.hovered ? 0.15 : 1;
        marquee.offset =
          (marquee.offset + (marquee.speed + scrollBoost * 0.25) * pace * direction * frameScale + half) % half;
        marquee.track.style.transform = `translate3d(${-marquee.offset}px,0,0)`;
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  if (params.has('only')) {
    document.body.classList.add('v2-shot');
    document.querySelectorAll('.v2-opt').forEach((option) => {
      option.hidden = option.id !== 'v' + params.get('only');
    });
  }
})();
