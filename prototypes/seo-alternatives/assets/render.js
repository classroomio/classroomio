(function () {
  const data = window.SEO_DATA;
  const ui = window.SEO_UI;
  const app = document.getElementById('app');
  const root = ui.root;

  const pageList = [
    { key: 'overview', title: 'Strategy overview', href: 'index.html' },
    { key: 'hub', title: 'Alternatives hub', href: 'alternatives/index.html' },
    { key: 'keywords', title: 'Keyword research', href: 'keywords.html' },
    { key: 'blog', title: 'Blog content strategy', href: 'blog.html' },
    { key: 'roadmap', title: 'Content roadmap', href: 'roadmap.html' },
    { key: 'linking', title: 'Internal linking', href: 'linking.html' },
    { key: 'measurement', title: 'Measurement plan', href: 'measurement.html' }
  ];

  const e = ui.escapeHtml;
  const badge = ui.badge;

  function competitorLink(slug, label) {
    const competitor = ui.competitorBySlug(slug);
    if (slug === 'hub') return '<a href="' + root + 'alternatives/index.html">Alternatives hub</a>';
    if (!competitor) return e(label || slug);
    return '<a href="' + root + 'alternatives/' + slug + '.html">' + e(label || competitor.name) + '</a>';
  }

  function blogLink(id) {
    const post = ui.blogById(id);
    if (!post) return e(id);
    return '<a href="' + root + 'blog.html#' + id + '">' + shortBlogId(id) + ': ' + e(post.title) + '</a>';
  }

  function shortBlogId(id) {
    return 'B' + parseInt(id.slice(1), 10);
  }

  function priorityBadge(value) {
    return badge(value, value);
  }

  function breadcrumb(items) {
    return '<nav class="breadcrumb" aria-label="Breadcrumb">' + items.join('<span>/</span>') + '</nav>';
  }

  function header(title, lede) {
    return '<h1>' + e(title) + '</h1><p class="lede">' + e(lede) + '</p>';
  }

  function neighbours(key) {
    const index = pageList.findIndex(function (page) {
      return page.key === key;
    });
    return ui.pageNav(pageList[index - 1], pageList[index + 1]);
  }

  function renderOverview() {
    const overview = data.overview;
    const competitors = data.competitors.slice().sort(function (a, b) {
      return a.rank - b.rank;
    });
    const priorityRows = competitors.map(function (competitor) {
      return [
        String(competitor.rank),
        competitorLink(competitor.slug),
        'Wave ' + competitor.wave,
        badge(competitor.relevance, competitor.relevance),
        e(competitor.angle),
        badge(competitor.status, competitor.status === 'Draft' ? 'draft' : 'verify')
      ];
    });

    const claimRows = data.claims.map(function (claim) {
      const tone = claim[1].indexOf('Verified') === 0 ? 'verified' : 'unverified';
      return [e(claim[0]), badge(claim[1], tone), e(claim[2])];
    });

    const quickLinks = [
      ['hub', 'Alternatives hub', 'Nine platforms, each with its own page and angle.'],
      ['keywords', 'Keyword research', 'Keywords, intent and the owner page for each.'],
      ['blog', 'Blog content strategy', data.blog.length + ' posts with outlines and links.'],
      ['roadmap', 'Content roadmap', 'A 90-day plan in four phases.'],
      ['linking', 'Internal linking', 'How pages and posts connect, and how to avoid overlap.'],
      ['measurement', 'Measurement plan', 'Metrics, tracking setup and success criteria.']
    ]
      .map(function (item) {
        const target = pageList.find(function (page) {
          return page.key === item[0];
        });
        return (
          '<a class="card card-link" href="' +
          root +
          target.href +
          '"><div class="card-title">' +
          e(item[1]) +
          '</div><p class="muted small">' +
          e(item[2]) +
          '</p></a>'
        );
      })
      .join('');

    app.innerHTML =
      header(
        'ClassroomIO SEO and content strategy',
        'A working plan for competitor alternative pages and the content that supports them. Last updated ' +
          data.updated +
          '.'
      ) +
      '<div class="callout warn"><p><strong>Evidence rule.</strong> Every claim is labelled verified fact, customer feedback, interpretation or hypothesis. No search volume, difficulty, ranking or traffic figure is invented. No keyword tool was available, so all keyword numbers are unavailable until pulled.</p></div>' +
      '<div class="grid grid-3"><div class="card"><span class="stat">' +
      data.competitors.length +
      '</span><span class="stat-label">platforms in scope</span></div>' +
      '<div class="card"><span class="stat">' +
      data.blog.length +
      '</span><span class="stat-label">supporting blog posts</span></div>' +
      '<div class="card"><span class="stat">90 days</span><span class="stat-label">Oct 22, 2026 to Jan 20, 2027</span></div></div>' +
      '<h2>Goal</h2><p>' +
      e(overview.goal) +
      '</p>' +
      '<h2>Target audience</h2>' +
      ui.table(
        ['Who', 'Situation'],
        overview.audience.map(function (row) {
          return [e(row[0]), e(row[1])];
        })
      ) +
      '<h2>How the pages work</h2><div class="grid grid-2"><div class="card"><h3>Alternative pages</h3><p>' +
      e(overview.pageRole) +
      '</p></div><div class="card"><h3>Supporting blog posts</h3><p>' +
      e(overview.blogRole) +
      '</p></div></div>' +
      '<h2>Main SEO opportunities</h2>' +
      ui.list(overview.opportunities.map(e)) +
      '<h2>Which pages first</h2>' +
      ui.table(['#', 'Platform', 'Wave', 'Relevance', 'Lead angle', 'Status'], priorityRows) +
      '<p class="muted small">Order is a hypothesis based on search intent and relevance. Keyword volume could reorder waves 2 and 3.</p>' +
      '<h2>Key recommendations</h2>' +
      ui.list(overview.recommendations.map(e)) +
      '<h2>Content architecture</h2><div class="card"><ul class="tree">' +
      overview.architecture
        .map(function (line) {
          return '<li>' + e(line) + '</li>';
        })
        .join('') +
      '</ul></div>' +
      '<h2>What ClassroomIO can claim today</h2><p class="muted">Checked against the repository on ' +
      data.updated +
      '. Re-check before publishing.</p>' +
      ui.table(['Capability', 'Status', 'How to word it'], claimRows) +
      '<h2>Open items</h2>' +
      ui.list(overview.openItems.map(e)) +
      '<h2>Explore the prototype</h2><div class="grid grid-3">' +
      quickLinks +
      '</div>' +
      neighbours('overview');
  }

  function renderHub() {
    const competitors = data.competitors.slice().sort(function (a, b) {
      return a.rank - b.rank;
    });
    const groups = ['All'].concat(
      Array.from(
        new Set(
          competitors.map(function (c) {
            return c.group;
          })
        )
      )
    );
    const waves = ['All', 'Wave 1', 'Wave 2', 'Wave 3'];

    function filterButtons(name, values) {
      return (
        '<div class="filters" data-filter-group="' +
        name +
        '" role="group" aria-label="Filter by ' +
        name +
        '">' +
        values
          .map(function (value, index) {
            return (
              '<button type="button" data-value="' +
              e(value) +
              '" aria-pressed="' +
              (index === 0) +
              '">' +
              e(value) +
              '</button>'
            );
          })
          .join('') +
        '</div>'
      );
    }

    const cards = competitors
      .map(function (competitor) {
        const page = window.SEO_PAGES[competitor.slug];
        return (
          '<a class="card card-link" data-group="' +
          e(competitor.group) +
          '" data-wave="Wave ' +
          competitor.wave +
          '" href="' +
          root +
          'alternatives/' +
          competitor.slug +
          '.html">' +
          '<div class="card-title"><span>' +
          competitor.rank +
          '. ' +
          e(competitor.name) +
          '</span>' +
          badge('Wave ' + competitor.wave, 'info') +
          '</div>' +
          '<div class="badges">' +
          badge(competitor.group, 'info') +
          badge('Relevance: ' + competitor.relevance, competitor.relevance) +
          badge(competitor.status, competitor.status === 'Draft' ? 'draft' : 'verify') +
          '</div>' +
          '<p class="small"><strong>Recommended headline</strong><br>' +
          e(page.messaging.headlines[page.messaging.recommended]) +
          '</p>' +
          '<p class="muted small"><strong>Angle:</strong> ' +
          e(competitor.angle) +
          '<br><strong>Pricing model:</strong> ' +
          e(competitor.pricing) +
          '</p>' +
          '<p class="muted small">' +
          e(competitor.note) +
          '</p></a>'
        );
      })
      .join('');

    app.innerHTML =
      breadcrumb([ui.link('index.html', 'Strategy overview'), 'Alternatives hub']) +
      header(
        'Customer education platform alternatives',
        "Proposed hub for the category query. Each card opens that platform's page plan with copy, structure, comparison table and differentiation. On the live site the hub would list only pages that are published."
      ) +
      '<div class="callout"><p><strong>Hub target keyword:</strong> customer education platform alternatives. <strong>Hub job:</strong> route visitors to the right platform page and own the category queries so no platform page has to.</p></div>' +
      filterButtons('group', groups) +
      filterButtons('wave', waves) +
      '<div class="grid grid-3" id="cards">' +
      cards +
      '</div><p class="muted small" id="empty" hidden>No platform matches those filters.</p>' +
      '<h2>Hub page outline</h2>' +
      ui.list([
        '<strong>Hero.</strong> A headline about choosing a platform fairly. It should not repeat any single platform headline.',
        '<strong>How to choose.</strong> Five questions: audience, scope, packaging, reporting, extensibility. Links to ' +
          blogLink('b01') +
          '.',
        '<strong>Platform cards.</strong> One sentence on who each platform suits. Live pages only.',
        '<strong>Pricing models explained.</strong> Short summary with a link to ' + blogLink('b02') + '.',
        '<strong>Where ClassroomIO fits and where it does not.</strong>',
        '<strong>FAQ and final CTA.</strong> Start free or compare plans.'
      ]) +
      neighbours('hub');

    const container = document.getElementById('cards');
    const empty = document.getElementById('empty');
    ui.bindFilters(app, null, function (state) {
      let visible = 0;
      container.querySelectorAll('.card').forEach(function (card) {
        const match =
          (state.group === 'All' || card.dataset.group === state.group) &&
          (state.wave === 'All' || card.dataset.wave === state.wave);
        card.hidden = !match;
        if (match) visible += 1;
      });
      empty.hidden = visible > 0;
    });
  }

  function renderKeywords() {
    const rows = data.keywordRows.map(function (row) {
      return [
        competitorLink(row.slug, row.platform),
        '<strong>' +
          e(row.primary) +
          '</strong><br><span class="muted small">' +
          e(row.secondary.join(', ')) +
          '</span>',
        e(row.intent),
        e(row.audience),
        e(row.funnel),
        badge(row.relevance, row.relevance),
        '<span class="muted">Unavailable</span>',
        e(row.type),
        e(row.title),
        badge('P' + row.priority, row.priority <= 3 ? 'high' : row.priority <= 6 ? 'medium' : 'low')
      ];
    });
    const serpRows = data.keywordRows.map(function (row) {
      return [competitorLink(row.slug, row.platform), e(row.serp)];
    });
    const categoryRows = data.categoryKeywords.map(function (row) {
      let owner = 'No new page';
      if (row.owner === 'hub') owner = '<a href="' + root + 'alternatives/index.html">Alternatives hub</a>';
      else if (row.owner.indexOf('b') === 0 && ui.blogById(row.owner)) owner = blogLink(row.owner);
      return [e(row.keyword), e(row.intent), e(row.funnel), e(row.content), owner];
    });
    const pricingRows = data.pricingKeywords.map(function (row) {
      let owner = 'None';
      if (row.owner.indexOf('b') === 0 && ui.blogById(row.owner)) owner = blogLink(row.owner);
      else if (ui.competitorBySlug(row.owner)) owner = competitorLink(row.owner);
      return [e(row.query), e(row.decision), owner];
    });

    app.innerHTML =
      breadcrumb([ui.link('index.html', 'Strategy overview'), 'Keyword research']) +
      header(
        'Keyword research and search intent',
        'Which keyword belongs on which page. One search intent has one owner.'
      ) +
      '<div class="callout warn"><p><strong>Volume and difficulty are unavailable for every keyword.</strong> No keyword tool was available. Priorities rest on intent, relevance and gaps seen in search results on 2026-10-21. Search results came from summaries, so SERP notes list domains seen, not verified positions.</p></div>' +
      '<h2>Platform keywords</h2><div class="table-wrap-note small muted">Scroll sideways on small screens.</div>' +
      ui.table(
        [
          'Platform',
          'Primary and secondary',
          'Intent',
          'Audience',
          'Funnel',
          'Relevance',
          'Volume / KD',
          'Content type',
          'Proposed title',
          'Priority'
        ],
        rows
      ) +
      '<h2>SERP observations</h2>' +
      ui.table(['Platform', 'What appeared (2026-10-21, positions not verified)'], serpRows) +
      '<h2>Category and problem-aware keywords</h2>' +
      ui.table(['Keyword', 'Intent', 'Funnel', 'Recommended content', 'Owner'], categoryRows) +
      '<h2>Pricing, review and head-to-head queries</h2>' +
      ui.table(['Query', 'Decision', 'Owner'], pricingRows) +
      '<h2>Data still to obtain</h2>' +
      ui.list([
        'Monthly search volume and difficulty for every primary and secondary keyword, with tool and date',
        'A live SERP capture for each primary keyword, including featured snippets and AI overviews',
        'Search Console data for any existing impressions on competitor names',
        'Confirmation that "Intellum alternatives" and "Skilljar alternatives" return only learning-platform intent',
        'Final URL pattern agreed with the website team'
      ]) +
      neighbours('keywords');
  }

  function postCard(post) {
    const linkChips = post.links
      .map(function (slug) {
        return competitorLink(slug);
      })
      .join(', ');
    return (
      '<details id="' +
      post.id +
      '" data-priority="' +
      post.priority +
      '" data-phase="' +
      post.phase +
      '"><summary>' +
      shortBlogId(post.id) +
      '. ' +
      e(post.title) +
      ' ' +
      priorityBadge(post.priority) +
      '</summary><div class="details-body">' +
      '<dl class="kv">' +
      '<dt>Primary keyword</dt><dd>' +
      e(post.keyword) +
      '</dd>' +
      '<dt>Secondary keywords</dt><dd>' +
      e(post.secondary.join(', ')) +
      '</dd>' +
      '<dt>Search intent</dt><dd>' +
      e(post.intent) +
      '</dd>' +
      '<dt>Intended reader</dt><dd>' +
      e(post.reader) +
      '</dd>' +
      '<dt>Problem</dt><dd>' +
      e(post.problem) +
      '</dd>' +
      '<dt>Main points</dt><dd>' +
      ui.list(post.points.map(e)) +
      '</dd>' +
      '<dt>Suggested outline</dt><dd><ol>' +
      post.outline
        .map(function (item) {
          return '<li>' + e(item) + '</li>';
        })
        .join('') +
      '</ol></dd>' +
      '<dt>Links to pages</dt><dd>' +
      linkChips +
      '</dd>' +
      '<dt>Introducing ClassroomIO</dt><dd>' +
      e(post.intro) +
      '</dd>' +
      '<dt>Call to action</dt><dd>' +
      e(post.cta) +
      '</dd>' +
      '<dt>Roadmap phase</dt><dd><a href="' +
      root +
      'roadmap.html">' +
      (post.phase === 1 ? 'Phase 1' : post.phase === 2 ? 'Phase 2' : 'Phase 3 or later') +
      '</a></dd>' +
      '<dt>Evidence needed</dt><dd>' +
      e(post.evidence) +
      '</dd>' +
      '</dl></div></details>'
    );
  }

  function renderBlog() {
    const priorities = ['All', 'High', 'Medium', 'Low'];
    const filter =
      '<div class="filters" data-filter-group="priority" role="group" aria-label="Filter by priority">' +
      priorities
        .map(function (value, index) {
          return (
            '<button type="button" data-value="' +
            value +
            '" aria-pressed="' +
            (index === 0) +
            '">' +
            value +
            '</button>'
          );
        })
        .join('') +
      '</div>';

    app.innerHTML =
      breadcrumb([ui.link('index.html', 'Strategy overview'), 'Blog content strategy']) +
      header(
        'Supporting blog content',
        data.blog.length +
          ' posts chosen from the 54 ideas in the earlier planner. Each answers a real pre-purchase question and links to specific alternative pages.'
      ) +
      '<div class="callout"><p>Three creator-platform ideas were merged into ' +
      blogLink('b09') +
      '. The planner used "LMS pricing models" as the primary keyword for two posts, and this plan gives it to ' +
      blogLink('b02') +
      ' only.</p></div>' +
      filter +
      '<div id="posts">' +
      data.blog.map(postCard).join('') +
      '</div>' +
      neighbours('blog');

    const container = document.getElementById('posts');
    ui.bindFilters(app, null, function (state) {
      container.querySelectorAll('details').forEach(function (item) {
        item.hidden = !(state.priority === 'All' || item.dataset.priority === state.priority);
      });
    });

    function openFromHash() {
      const id = window.location.hash.slice(1);
      const target = id && document.getElementById(id);
      if (target && target.tagName === 'DETAILS') {
        target.hidden = false;
        target.open = true;
        target.scrollIntoView();
      }
    }
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
  }

  function renderRoadmap() {
    const typeSet = ['All'];
    data.roadmap.forEach(function (phase) {
      phase.items.forEach(function (item) {
        if (typeSet.indexOf(item.type) < 0) typeSet.push(item.type);
      });
    });
    const filter =
      '<div class="filters" data-filter-group="type" role="group" aria-label="Filter by type">' +
      typeSet
        .map(function (value, index) {
          return (
            '<button type="button" data-value="' +
            e(value) +
            '" aria-pressed="' +
            (index === 0) +
            '">' +
            e(value) +
            '</button>'
          );
        })
        .join('') +
      '</div>';

    function linkTitle(item) {
      const lowered = item.title.toLowerCase();
      const competitor = data.competitors.find(function (entry) {
        return item.type === 'Alternative page' && lowered.indexOf(entry.name.toLowerCase()) === 0;
      });
      if (competitor) return competitorLink(competitor.slug, item.title);
      if (item.type === 'Hub') return '<a href="' + root + 'alternatives/index.html">' + e(item.title) + '</a>';
      if (item.type === 'Blog') return '<a href="' + root + 'blog.html">' + e(item.title) + '</a>';
      return e(item.title);
    }

    const phases = data.roadmap
      .map(function (phase) {
        const rows = phase.items
          .map(function (item, index) {
            return (
              '<tr data-type="' +
              e(item.type) +
              '"><td>' +
              (index + 1) +
              '</td><td>' +
              linkTitle(item) +
              '</td><td>' +
              e(item.type) +
              '</td><td>' +
              e(item.keyword) +
              '</td><td>' +
              priorityBadge(item.priority) +
              '</td><td>' +
              e(item.reason) +
              '</td><td>' +
              e(item.depends) +
              '</td><td>' +
              badge(item.status, item.status === 'Not started' ? 'info' : 'verify') +
              '</td><td>' +
              e(item.metric) +
              '</td></tr>'
            );
          })
          .join('');
        return (
          '<section class="phase" data-phase><h2>' +
          e(phase.phase) +
          ' <span class="muted small">' +
          e(phase.dates) +
          '</span></h2><div class="table-wrap"><table><thead><tr><th>#</th><th>Item</th><th>Type</th><th>Target keyword</th><th>Priority</th><th>Reason</th><th>Dependencies</th><th>Status</th><th>Success metric</th></tr></thead><tbody>' +
          rows +
          '</tbody></table></div></section>'
        );
      })
      .join('');

    app.innerHTML =
      breadcrumb([ui.link('index.html', 'Strategy overview'), 'Content roadmap']) +
      header(
        'Content calendar and prioritization',
        'A realistic 90-day sequence. Nothing is published at once, and no page goes live before Phase 0 is done.'
      ) +
      '<div class="callout"><p>Priorities weigh relevance to the ideal customer, readiness to evaluate, SERP gaps, competitive difficulty, production effort and product readiness. Keyword evidence is unavailable, so SERP gaps stand in for it. All statuses are Not started.</p></div>' +
      filter +
      phases +
      '<h2>Day-90 review</h2><p>Compare Search Console data with the baseline. Decide which pages to expand, merge or retire. Refresh every pricing fact and its date. Revisit the Teachable and Kajabi decision.</p>' +
      neighbours('roadmap');

    ui.bindFilters(app, null, function (state) {
      app.querySelectorAll('tbody tr').forEach(function (row) {
        row.hidden = !(state.type === 'All' || row.dataset.type === state.type);
      });
      app.querySelectorAll('[data-phase]').forEach(function (section) {
        const anyVisible = Array.from(section.querySelectorAll('tbody tr')).some(function (row) {
          return !row.hidden;
        });
        section.hidden = !anyVisible;
      });
    });
  }

  function renderLinking() {
    const linking = data.linking;
    const relatedRows = linking.related.map(function (row) {
      return [competitorLink(row.from), competitorLink(row.to, row.anchor), e(row.reason)];
    });
    const blogRows = data.blog
      .filter(function (post) {
        return post.links.length;
      })
      .map(function (post) {
        return [
          blogLink(post.id),
          post.links
            .map(function (slug) {
              return competitorLink(slug);
            })
            .join(', ')
        ];
      });
    const reverse = data.competitors.map(function (competitor) {
      const posts = data.blog.filter(function (post) {
        return post.links.indexOf(competitor.slug) >= 0;
      });
      return [
        competitorLink(competitor.slug),
        posts.length
          ? posts
              .map(function (post) {
                return '<a href="' + root + 'blog.html#' + post.id + '">' + shortBlogId(post.id) + '</a>';
              })
              .join(', ')
          : '<span class="muted">None yet</span>'
      ];
    });

    app.innerHTML =
      breadcrumb([ui.link('index.html', 'Strategy overview'), 'Internal linking']) +
      header(
        'Internal linking and site structure',
        'Links are added only where a reader would want the next page. Anchor text describes the destination.'
      ) +
      '<h2>Structure</h2><div class="card"><ul class="tree"><li><a href="' +
      root +
      'alternatives/index.html">/alternatives (hub)</a><ul>' +
      data.competitors
        .map(function (competitor) {
          return '<li>' + competitorLink(competitor.slug, '/alternatives/' + competitor.slug) + '</li>';
        })
        .join('') +
      '</ul></li><li><a href="' +
      root +
      'blog.html">/blog/* (' +
      data.blog.length +
      ' posts)</a></li></ul></div>' +
      '<h2>Hub and platform pages</h2>' +
      ui.list([e(linking.hubTo), e(linking.pageToHub)]) +
      '<h2>Related platform links</h2>' +
      ui.table(['From', 'To (suggested anchor)', 'Why it is relevant'], relatedRows) +
      '<div class="callout warn"><p><strong>Do not link.</strong> ' +
      e(linking.noLink) +
      '</p></div>' +
      '<h2>Blog posts to platform pages</h2>' +
      ui.table(['Post', 'Links to'], blogRows) +
      '<h2>Platform pages and the posts that link to them</h2>' +
      ui.table(['Platform page', 'Posts linking in'], reverse) +
      '<h2>From education to evaluation</h2><ol>' +
      linking.flow
        .map(function (step) {
          return '<li>' + e(step) + '</li>';
        })
        .join('') +
      '</ol>' +
      '<h2>Avoiding keyword cannibalization</h2>' +
      ui.list(linking.cannibalization.map(e)) +
      neighbours('linking');
  }

  function renderMeasurement() {
    const measurement = data.measurement;
    const rows = measurement.metrics.map(function (metric) {
      return [
        '<strong>' + e(metric.name) + '</strong>',
        e(metric.why),
        e(metric.source),
        e(metric.setup),
        e(metric.target)
      ];
    });
    app.innerHTML =
      breadcrumb([ui.link('index.html', 'Strategy overview'), 'Measurement plan']) +
      header(
        'Measurement and reporting',
        'How to judge the strategy after publishing, and what must be set up first.'
      ) +
      '<div class="callout warn"><p><strong>Nothing is assumed to be configured.</strong> Found in the repository on ' +
      data.updated +
      ': the marketing website initialises PostHog and captures server events, and the /demo redirect captures an event named "cal.com page visited". No sitemap route was found, and robots.txt has no sitemap line. No Google Analytics tag was found. Search Console access is unknown.</p></div>' +
      '<h2>Metrics</h2>' +
      ui.table(['Metric', 'Why it matters', 'Where to measure', 'Setup required', 'Target'], rows) +
      '<h2>Tracking setup list</h2><ul class="tree">' +
      measurement.setup
        .map(function (item, index) {
          return '<li><label><input type="checkbox" id="setup-' + index + '"> ' + e(item) + '</label></li>';
        })
        .join('') +
      '</ul>' +
      '<h2>Reporting cadence</h2>' +
      ui.list(measurement.cadence.map(e)) +
      '<h2>Success criteria</h2><p class="muted">No traffic or ranking target is set because no volume data exists.</p>' +
      ui.list(measurement.success.map(e)) +
      neighbours('measurement');
  }

  function section(id, title, html) {
    return '<section id="' + id + '"><h2>' + e(title) + '</h2>' + html + '</section>';
  }

  function renderCompetitor() {
    const slug = document.body.dataset.slug;
    const competitor = ui.competitorBySlug(slug);
    const page = window.SEO_PAGES[slug];
    const message = page.messaging;
    const sorted = data.competitors.slice().sort(function (a, b) {
      return a.rank - b.rank;
    });
    const index = sorted.findIndex(function (entry) {
      return entry.slug === slug;
    });
    const previous = sorted[index - 1];
    const next = sorted[index + 1];

    const headlineButtons = message.headlines
      .map(function (headline, position) {
        return (
          '<button type="button" data-headline="' +
          position +
          '" aria-pressed="' +
          (position === message.recommended) +
          '">Option ' +
          (position + 1) +
          (position === message.recommended ? ' (recommended)' : '') +
          '</button>'
        );
      })
      .join('');

    const preview =
      '<div class="filters" data-filter-group="headline" role="group" aria-label="Headline option">' +
      headlineButtons +
      '</div>' +
      '<div class="preview"><p class="eyebrow">Proposed hero, not final design</p>' +
      '<h2 class="hero-h1" id="hero-headline">' +
      e(message.headlines[message.recommended]) +
      '</h2>' +
      '<p>' +
      e(message.support) +
      '</p>' +
      '<div class="cta-row"><span class="cta-tag">Primary CTA: ' +
      e(message.ctaPrimary) +
      '</span><span class="cta-tag">Secondary CTA: ' +
      e(message.ctaSecondary) +
      '</span></div>' +
      '<ul class="proof">' +
      message.benefits
        .slice(0, 3)
        .map(function (benefit) {
          return '<li>' + e(benefit) + '</li>';
        })
        .join('') +
      '</ul></div>' +
      '<dl class="kv"><dt>SEO title</dt><dd>' +
      e(message.seoTitle) +
      '</dd><dt>Meta description</dt><dd>' +
      e(message.meta) +
      '</dd><dt>URL slug</dt><dd>' +
      e(message.slug) +
      '</dd><dt>Lead angle</dt><dd>' +
      e(message.angle) +
      '</dd></dl>';

    const searchHtml =
      '<dl class="kv"><dt>Primary keyword</dt><dd><strong>' +
      e(page.search.primary) +
      '</strong></dd>' +
      '<dt>Supporting keywords</dt><dd>' +
      e(page.search.supporting.join(', ')) +
      '</dd>' +
      '<dt>Search intent</dt><dd>' +
      e(page.search.intent) +
      '</dd>' +
      '<dt>Audience</dt><dd>' +
      e(page.search.audience) +
      '</dd>' +
      '<dt>Use case</dt><dd>' +
      e(page.search.useCase) +
      '</dd>' +
      '<dt>Need ClassroomIO can address</dt><dd>' +
      e(page.search.need) +
      '</dd>' +
      '<dt>Volume and difficulty</dt><dd class="muted">Unavailable. See <a href="' +
      root +
      'keywords.html">keyword research</a>.</dd></dl>' +
      '<h3>Why someone might search for an alternative</h3>' +
      ui.list(page.search.whyAlternative.map(e)) +
      '<h3>Search results worth studying</h3>' +
      ui.list(page.search.studyPages.map(e));

    const copyHtml =
      '<h3>Supporting benefit statements</h3>' +
      ui.list(page.messaging.benefits.map(e)) +
      '<div class="grid grid-2"><div class="card"><h3>Verified ClassroomIO features</h3><div class="badges">' +
      message.features
        .map(function (feature) {
          return badge(feature, 'verified');
        })
        .join('') +
      '</div></div>' +
      '<div class="card"><h3>Best suited to</h3><p>' +
      e(message.bestFor) +
      '</p></div></div>' +
      '<h3>Limitations to acknowledge on the page</h3>' +
      ui.list(message.limitations.map(e));

    const structureHtml =
      '<ol>' +
      page.structure
        .map(function (row) {
          return '<li><strong>' + e(row[0]) + '.</strong> ' + e(row[1]) + '</li>';
        })
        .join('') +
      '</ol>';

    const comparisonRows = page.comparison.map(function (row) {
      const tone =
        row[3].indexOf('Verified') === 0 ? 'verified' : row[3].indexOf('Unverified') === 0 ? 'unverified' : 'info';
      return [e(row[0]), e(row[1]), e(row[2]), badge(row[3], tone)];
    });
    const comparisonHtml =
      '<p class="muted small">Checked ' +
      e(page.checked) +
      '. Unverified cells must stay unclaimed on the live page.</p>' +
      ui.table(['Dimension', 'ClassroomIO', competitor.name, 'Evidence'], comparisonRows);

    const diff = page.differentiation;
    const diffHtml =
      '<div class="grid grid-2"><div class="card"><h3>Reasons to choose ClassroomIO</h3>' +
      ui.list(diff.reasons.map(e)) +
      '</div>' +
      '<div class="card"><h3>Where ' +
      e(competitor.name) +
      ' has advantages</h3>' +
      ui.list(diff.competitorAdvantages.map(e)) +
      '</div>' +
      '<div class="card"><h3>Where ClassroomIO has gaps</h3>' +
      ui.list(diff.gaps.map(e)) +
      '</div>' +
      '<div class="card"><h3>Evaluate before switching</h3>' +
      ui.list(diff.evaluate.map(e)) +
      '</div></div>';

    const faqHtml = page.faq
      .map(function (row) {
        return (
          '<details><summary>' +
          e(row[0]) +
          '</summary><div class="details-body"><p>' +
          e(row[1]) +
          '</p></div></details>'
        );
      })
      .join('');

    const verifyHtml =
      '<ul class="tree">' +
      page.verify
        .map(function (item, position) {
          return '<li><label><input type="checkbox" id="verify-' + position + '"> ' + e(item) + '</label></li>';
        })
        .join('') +
      '</ul>' +
      '<h3>Sources</h3>' +
      ui.list(
        page.sources.map(function (source) {
          return source[1].indexOf('http') === 0
            ? '<a href="' + e(source[1]) + '" target="_blank" rel="noopener">' + e(source[0]) + '</a>'
            : e(source[0]) + ': ' + e(source[1]);
        })
      );

    const supportingPosts = data.blog.filter(function (post) {
      return post.links.indexOf(slug) >= 0;
    });
    const related = data.linking.related.filter(function (row) {
      return row.from === slug;
    });
    const connectionsHtml =
      '<div class="grid grid-2"><div class="card"><h3>Blog posts that link here</h3>' +
      (supportingPosts.length
        ? ui.list(
            supportingPosts.map(function (post) {
              return blogLink(post.id);
            })
          )
        : '<p class="muted">None yet.</p>') +
      '</div>' +
      '<div class="card"><h3>Related platform pages</h3>' +
      (related.length
        ? ui.list(
            related.map(function (row) {
              return competitorLink(row.to, row.anchor) + ' <span class="muted small">' + e(row.reason) + '</span>';
            })
          )
        : '<p class="muted">No related link is genuinely relevant.</p>') +
      '<p class="small"><a href="' +
      root +
      'alternatives/index.html">Back to the alternatives hub</a></p></div></div>';

    const tabs = [
      ['preview', 'Hero and messaging'],
      ['search', 'Search strategy'],
      ['copy', 'Benefits and limits'],
      ['structure', 'Page structure'],
      ['comparison', 'Comparison'],
      ['differentiation', 'Differentiation'],
      ['faq', 'FAQ'],
      ['verify', 'Verify'],
      ['connections', 'Connections']
    ];

    app.innerHTML =
      breadcrumb([
        ui.link('index.html', 'Strategy overview'),
        ui.link('alternatives/index.html', 'Alternatives hub'),
        e(competitor.name)
      ]) +
      '<h1>' +
      e(competitor.name) +
      ': alternative page plan</h1>' +
      '<div class="badges">' +
      badge('Priority ' + competitor.rank + ' of 9', 'info') +
      badge('Wave ' + competitor.wave, 'info') +
      badge(competitor.group, 'info') +
      badge('Relevance: ' + competitor.relevance, competitor.relevance) +
      badge(competitor.status, competitor.status === 'Draft' ? 'draft' : 'verify') +
      '</div>' +
      '<p class="lede">' +
      e(competitor.note) +
      '</p>' +
      '<nav class="page-tabs" aria-label="On this page">' +
      tabs
        .map(function (tab) {
          return '<a href="#' + tab[0] + '">' + tab[1] + '</a>';
        })
        .join('') +
      '</nav>' +
      section('preview', 'Hero and messaging', preview) +
      section('search', 'A. Search strategy', searchHtml) +
      section('copy', 'B. Benefits, features and limits', copyHtml) +
      section('structure', 'C. Landing page structure', structureHtml) +
      section('comparison', 'D. Comparison table', comparisonHtml) +
      section('differentiation', 'E. Differentiation', diffHtml) +
      section('faq', 'FAQ copy', faqHtml) +
      section('verify', 'Verify before publishing', verifyHtml) +
      section('connections', 'Connections', connectionsHtml) +
      '<div class="page-nav">' +
      (previous
        ? '<a href="' + root + 'alternatives/' + previous.slug + '.html">&larr; ' + e(previous.name) + '</a>'
        : '<a href="' + root + 'alternatives/index.html">&larr; Alternatives hub</a>') +
      (next
        ? '<a href="' + root + 'alternatives/' + next.slug + '.html">' + e(next.name) + ' &rarr;</a>'
        : '<a href="' + root + 'index.html">Strategy overview &rarr;</a>') +
      '</div>';

    app.querySelector('[data-filter-group="headline"]').addEventListener('click', function (event) {
      const button = event.target.closest('button');
      if (!button) return;
      document.getElementById('hero-headline').textContent = message.headlines[Number(button.dataset.headline)];
      this.querySelectorAll('button').forEach(function (other) {
        other.setAttribute('aria-pressed', String(other === button));
      });
    });
  }

  const renderers = {
    overview: renderOverview,
    hub: renderHub,
    keywords: renderKeywords,
    blog: renderBlog,
    roadmap: renderRoadmap,
    linking: renderLinking,
    measurement: renderMeasurement,
    competitor: renderCompetitor
  };

  renderers[ui.pageKey]();
})();
