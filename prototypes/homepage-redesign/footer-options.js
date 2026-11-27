(() => {
  const site = 'https://classroomio.com/';
  const alternatives = [
    ['Skilljar', 'skilljar'],
    ['LearnUpon', 'learnupon'],
    ['Docebo', 'docebo'],
    ['Intellum', 'intellum'],
    ['Thought Industries', 'thought-industries'],
    ['Thinkific', 'thinkific'],
    ['Teachfloor', 'teachfloor'],
    ['Teachable', 'teachable'],
    ['Kajabi', 'kajabi'],
    ['Disco', 'disco'],
    ['Trainn', 'trainn']
  ];
  const groups = [
    {
      key: 'product',
      title: 'Product',
      links: [
        ['AI Agents', 'index.html#ncard-agents'],
        ['Branded Academies', 'branded-academies.html'],
        ['Analytics', 'analytics.html'],
        ['Integrations', 'integrations.html'],
        ['Plugins', 'plugins.html'],
        ['Pricing', 'pricing.html']
      ]
    },
    {
      key: 'solutions',
      title: 'Solutions',
      links: [
        ['Customer Education', site + 'customer-education'],
        ['Partner Training', site + 'partner-training'],
        ['Cohort Training', site + 'cohort-training'],
        ['Certification Programs', site + 'certification-programs']
      ]
    },
    {
      key: 'devs',
      title: 'For Devs',
      links: [
        ['API', site + 'developers'],
        ['MCP server & skills', site + 'mcp-recipes'],
        ['Self-hosting docs', site + 'docs'],
        ['GitHub', site + 'github']
      ]
    },
    {
      key: 'resources',
      title: 'Resources',
      links: [
        ['Customer stories', 'customers.html'],
        ['Blog', site + 'blog'],
        ['Help center', site + 'help'],
        ['Changelog', site + 'changelog'],
        ['Roadmap', site + 'roadmap']
      ]
    },
    {
      key: 'compare',
      title: 'Compare platforms',
      links: alternatives.map(([name, slug]) => [name + ' alternative', site + 'alternatives/' + slug])
    },
    {
      key: 'company',
      title: 'Company',
      links: [
        ['About', 'about.html'],
        ['Contact', 'https://cal.com/classroomio/demo'],
        ['Book a demo', 'https://cal.com/classroomio/demo']
      ]
    }
  ];
  const stillFrame = new URLSearchParams(location.search).has('only');
  const reduceMotion = stillFrame || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const escapeText = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const link = (label, href, className = '') =>
    `<a${className ? ` class="${className}"` : ''} href="${href}">${escapeText(label)}</a>`;
  const pad = (number) => String(number).padStart(2, '0');

  const renderers = {
    syllabus: () =>
      groups
        .map(
          (group, groupIndex) => `
      <div class="f1-mod">
        <p class="f1-mod-h"><span>Module ${pad(groupIndex + 1)}</span>${group.title}<em>${group.links.length} lessons</em></p>
        <ol>${group.links.map(([label, href], linkIndex) => `<li><a href="${href}"><i class="f1-dot"></i><span class="f1-num">${groupIndex + 1}.${linkIndex + 1}</span>${escapeText(label.replace(' alternative', ''))}</a></li>`).join('')}</ol>
      </div>`
        )
        .join(''),
    'bento-links': () =>
      groups
        .filter((group) => group.key !== 'compare')
        .map(
          (group) => `
      <div class="f2-col"><span class="f2-lbl">${group.title}</span>${group.links.map(([label, href]) => link(label, href)).join('')}</div>`
        )
        .join(''),
    chips: () =>
      alternatives
        .map(([name, slug]) => `<a class="f2-chip" href="${site}alternatives/${slug}"><span>vs</span>${name}</a>`)
        .join(''),
    terminal: () =>
      groups
        .map(
          (group) => `
      <div class="f3-dir" data-dir="${group.key}">
        <p class="f3-dir-h">${group.key}/</p>
        ${group.links.map(([label, href]) => `<a class="f3-file" href="${href}" data-label="${escapeText(label.toLowerCase())}">${escapeText(group.key === 'compare' ? 'vs ' + label.replace(' alternative', '') : label)}</a>`).join('')}
      </div>`
        )
        .join(''),
    columns: () =>
      groups
        .map(
          (group) => `<div><b>${group.title}</b>${group.links.map(([label, href]) => link(label, href)).join('')}</div>`
        )
        .join(''),
    tiles: () =>
      Array.from(
        { length: 22 * 10 },
        (_, index) => `<i style="--d:${((index * 37) % 23) * 0.35}s"${(index * 53) % 9 === 0 ? ' class="on"' : ''}></i>`
      ).join(''),
    rows: () =>
      groups
        .map(
          (group) =>
            `<div class="f5-row"><span class="f5-row-h">${group.title}</span><div>${group.links.map(([label, href]) => link(label.replace(' alternative', ''), href)).join('')}</div></div>`
        )
        .join('')
  };
  document.querySelectorAll('[data-render]').forEach((node) => {
    node.innerHTML = renderers[node.dataset.render]();
  });

  /** Filters terminal links by typed text and shows the first match as ghost completion. */
  const input = document.getElementById('f3-input');
  const ghost = document.getElementById('f3-ghost');
  const count = document.getElementById('f3-count');
  const files = [...document.querySelectorAll('.f3-file')];
  const filterTerminal = (query) => {
    const needle = query.trim().toLowerCase();
    let matches = 0;
    let firstMatch = '';
    files.forEach((file) => {
      const hit = !needle || file.dataset.label.includes(needle);
      file.classList.toggle('dim', !hit);
      file.classList.toggle('hit', Boolean(needle) && hit);
      if (hit) {
        matches += 1;
        if (!firstMatch && file.dataset.label.startsWith(needle)) firstMatch = file.dataset.label;
      }
    });
    document
      .querySelectorAll('.f3-dir')
      .forEach((dir) => dir.classList.toggle('dim', !dir.querySelector('.f3-file:not(.dim)')));
    ghost.textContent = needle && firstMatch ? firstMatch.slice(needle.length) : '';
    count.textContent = needle
      ? `${matches} match${matches === 1 ? '' : 'es'} · press enter to open`
      : `${files.length} pages · start typing to filter`;
  };
  input.addEventListener('input', () => filterTerminal(input.value));
  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;

    const target = files.find((file) => !file.classList.contains('dim'));
    if (target) window.location.href = target.href;
  });
  filterTerminal('');

  /** Types demo queries into an input-like target, one after another. */
  const typeLoop = (prompts, onType) => {
    let promptIndex = 0;
    let charIndex = 0;
    let deleting = false;
    const tick = () => {
      const prompt = prompts[promptIndex];
      charIndex += deleting ? -1 : 1;
      onType(prompt, prompt.text.slice(0, charIndex));
      let delay = deleting ? 28 : 55;
      if (!deleting && charIndex === prompt.text.length) {
        deleting = true;
        delay = 2200;
      }
      if (deleting && charIndex === 0) {
        deleting = false;
        promptIndex = (promptIndex + 1) % prompts.length;
        delay = 400;
      }
      setTimeout(tick, delay);
    };
    if (reduceMotion) {
      onType(prompts[0], prompts[0].text);
      return;
    }

    tick();
  };

  const terminalDemo = [{ text: 'pricing' }, { text: 'skilljar' }, { text: 'mcp' }, { text: 'customer stories' }];
  let userTyped = false;
  input.addEventListener(
    'focus',
    () => {
      userTyped = true;
      input.value = '';
      filterTerminal('');
    },
    { once: true }
  );
  typeLoop(terminalDemo, (_, typed) => {
    if (userTyped) return;

    input.value = typed;
    filterTerminal(typed);
  });

  const askPrompts = [
    {
      text: 'How do we compare with Skilljar?',
      href: site + 'alternatives/skilljar',
      chips: [
        ['Skilljar alternative', site + 'alternatives/skilljar'],
        ['Customer stories', 'customers.html'],
        ['Pricing', 'pricing.html']
      ]
    },
    {
      text: 'Connect Claude to my academy',
      href: site + 'mcp-recipes',
      chips: [
        ['MCP server & skills', site + 'mcp-recipes'],
        ['AI Agents', 'index.html#ncard-agents'],
        ['API', site + 'developers']
      ]
    },
    {
      text: 'What does it cost for 1,000 learners?',
      href: 'pricing.html',
      chips: [
        ['Pricing', 'pricing.html'],
        ['Book a demo', 'https://cal.com/classroomio/demo'],
        ['Self-hosting docs', site + 'docs']
      ]
    },
    {
      text: 'Certify our resellers',
      href: site + 'partner-training',
      chips: [
        ['Partner Training', site + 'partner-training'],
        ['Certification Programs', site + 'certification-programs'],
        ['Cohort Training', site + 'cohort-training']
      ]
    }
  ];
  const typeTarget = document.getElementById('f5-type');
  const goButton = document.getElementById('f5-go');
  const suggestions = document.getElementById('f5-sugg');
  let shownPrompt = null;
  typeLoop(askPrompts, (prompt, typed) => {
    typeTarget.textContent = typed;
    goButton.href = prompt.href;
    const complete = typed.length === prompt.text.length;
    if (complete && shownPrompt !== prompt) {
      shownPrompt = prompt;
      suggestions.innerHTML = prompt.chips
        .map(([label, href], index) => `<a href="${href}" style="--i:${index}">${escapeText(label)}<span>→</span></a>`)
        .join('');
      suggestions.classList.add('on');
    }
    if (!complete && typed.length < prompt.text.length - 1 && shownPrompt === prompt) {
      shownPrompt = null;
      suggestions.classList.remove('on');
    }
  });

  if (new URLSearchParams(location.search).has('only')) {
    const only = new URLSearchParams(location.search).get('only');
    document.body.classList.add('fo-shot');
    document.querySelectorAll('.fo-opt').forEach((option) => {
      option.hidden = option.id !== 'opt' + only;
    });
  }
})();
