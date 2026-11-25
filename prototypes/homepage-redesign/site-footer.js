(() => {
  const footer = document.querySelector('[data-site-footer]');
  if (!footer) return;

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
      ([title, links], index) =>
        `<div style="--i:${index}"><b>${title}</b>${links.map(([label, href]) => `<a href="${href}">${escapeText(label)}</a>`).join('')}</div>`
    )
    .join('');
  const wordmark = [...'ClassroomIO']
    .map((letter, index) => `<i aria-hidden="true" style="--i:${index}">${letter}</i>`)
    .join('');
  footer.innerHTML = `
    <div class="ft-cols">${columns}</div>
    <div class="ft-mark"><img src="images/logo.svg" alt=""><span role="img" aria-label="ClassroomIO">${wordmark}</span></div>
    <div class="ft-bot">
      <div class="ft-legal"><a href="${site}terms">Terms of Use</a>, <a href="${site}privacy">Privacy Policy</a> and <a href="${site}privacy">Cookies</a></div>
      <div class="ft-right"><span>© 2026 ClassroomIO</span><div class="ft-social">${socials.map(([label, href, svg]) => `<a href="${href}" aria-label="${label}">${svg}</a>`).join('')}</div></div>
    </div>`;

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    footer.classList.add('in', 'done');
    return;
  }

  const revealer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;

      footer.classList.add('in');
      setTimeout(() => footer.classList.add('done'), 1400);
      revealer.disconnect();
    },
    { threshold: 0.18 }
  );
  revealer.observe(footer);

  const word = footer.querySelector('.ft-mark > span');
  const letters = [...word.children];
  word.addEventListener('pointermove', (event) => {
    if (!footer.classList.contains('done')) return;

    letters.forEach((letter) => {
      const box = letter.getBoundingClientRect();
      const distance = Math.abs(event.clientX - (box.left + box.width / 2)) / box.width;
      letter.style.setProperty('--lift', (Math.exp((-distance * distance) / 2.2) * -0.14).toFixed(3) + 'em');
    });
  });
  word.addEventListener('pointerleave', () => letters.forEach((letter) => letter.style.removeProperty('--lift')));
})();
