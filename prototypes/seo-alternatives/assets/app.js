(function () {
  const data = window.SEO_DATA;
  const body = document.body;
  const root = body.dataset.root || '';
  const pageKey = body.dataset.page;

  const sections = [
    { label: 'Strategy', items: [{ key: 'overview', title: 'Strategy overview', href: 'index.html' }] },
    {
      label: 'Alternatives',
      items: [
        {
          key: 'hub',
          title: 'Alternatives hub',
          href: 'alternatives/index.html',
          tail: String(data.competitors.length)
        },
        { key: 'keywords', title: 'Keyword research', href: 'keywords.html' }
      ]
    },
    {
      label: 'Content',
      items: [
        { key: 'blog', title: 'Blog content strategy', href: 'blog.html', tail: String(data.blog.length) },
        { key: 'roadmap', title: 'Content roadmap', href: 'roadmap.html' }
      ]
    },
    {
      label: 'Operations',
      items: [
        { key: 'linking', title: 'Internal linking', href: 'linking.html' },
        { key: 'measurement', title: 'Measurement plan', href: 'measurement.html' }
      ]
    }
  ];

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (name) {
      if (name === 'html') node.innerHTML = attrs[name];
      else if (name === 'text') node.textContent = attrs[name];
      else node.setAttribute(name, attrs[name]);
    });
    (children || []).forEach(function (child) {
      node.appendChild(child);
    });
    return node;
  }

  function buildSidebar() {
    const sidebar = el('aside', { class: 'sidebar', id: 'sidebar', 'aria-label': 'Primary' });
    sidebar.appendChild(
      el('a', { class: 'brand', href: root + 'index.html' }, [
        el('span', { class: 'brand-mark', text: 'C' }),
        el('span', { html: 'ClassroomIO SEO<small>Strategy prototype</small>' })
      ])
    );

    sections.forEach(function (section) {
      sidebar.appendChild(el('div', { class: 'nav-group-label', text: section.label }));
      section.items.forEach(function (item) {
        const attrs = { class: 'nav-link', href: root + item.href };
        const active = pageKey === item.key || (item.key === 'hub' && pageKey === 'competitor');
        if (active) attrs['aria-current'] = 'page';
        const link = el('a', attrs, [el('span', { text: item.title })]);
        if (item.tail) link.appendChild(el('span', { class: 'nav-tail', text: item.tail }));
        sidebar.appendChild(link);
      });
    });

    sidebar.appendChild(el('div', { class: 'nav-group-label', text: 'Competitor pages' }));
    data.competitors.forEach(function (competitor) {
      const attrs = { class: 'nav-link', href: root + 'alternatives/' + competitor.slug + '.html' };
      if (pageKey === 'competitor' && body.dataset.slug === competitor.slug) attrs['aria-current'] = 'page';
      const link = el('a', attrs, [el('span', { text: competitor.name })]);
      link.appendChild(el('span', { class: 'nav-tail', text: 'P' + competitor.wave }));
      sidebar.appendChild(link);
    });

    return sidebar;
  }

  function buildShell() {
    const main = document.getElementById('app');
    const content = el('main', { class: 'content', id: 'main' }, [el('div', { class: 'content-inner' }, [])]);
    content.firstChild.appendChild(main);

    const topbar = el('div', { class: 'topbar' }, [
      el('a', { class: 'brand', href: root + 'index.html', text: 'ClassroomIO SEO strategy' }),
      el('button', {
        class: 'menu-button',
        type: 'button',
        'aria-controls': 'sidebar',
        'aria-expanded': 'false',
        text: 'Menu'
      })
    ]);

    const shell = el('div', { class: 'shell' }, []);
    const sidebar = buildSidebar();
    const column = el('div', {}, [topbar, content]);
    shell.appendChild(sidebar);
    shell.appendChild(column);
    body.appendChild(shell);

    const button = topbar.querySelector('.menu-button');
    button.addEventListener('click', function () {
      const open = shell.dataset.menu === 'open';
      shell.dataset.menu = open ? 'closed' : 'open';
      button.setAttribute('aria-expanded', String(!open));
    });
    sidebar.addEventListener('click', function (event) {
      if (event.target.closest('a')) shell.dataset.menu = 'closed';
    });
  }

  function badge(text, tone) {
    const toneClass = (tone || text || '').toLowerCase().replace(/[^a-z]+/g, '');
    return '<span class="badge ' + toneClass + '">' + text + '</span>';
  }

  function escapeHtml(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function link(href, text) {
    return '<a href="' + root + href + '">' + escapeHtml(text) + '</a>';
  }

  function competitorBySlug(slug) {
    return data.competitors.find(function (competitor) {
      return competitor.slug === slug;
    });
  }

  function blogById(id) {
    return data.blog.find(function (post) {
      return post.id === id;
    });
  }

  function table(headers, rows) {
    const head =
      '<tr>' +
      headers
        .map(function (name) {
          return '<th>' + name + '</th>';
        })
        .join('') +
      '</tr>';
    const bodyRows = rows
      .map(function (row) {
        return (
          '<tr>' +
          row
            .map(function (cell) {
              return '<td>' + cell + '</td>';
            })
            .join('') +
          '</tr>'
        );
      })
      .join('');
    return '<div class="table-wrap"><table><thead>' + head + '</thead><tbody>' + bodyRows + '</tbody></table></div>';
  }

  function list(items) {
    return (
      '<ul>' +
      items
        .map(function (item) {
          return '<li>' + item + '</li>';
        })
        .join('') +
      '</ul>'
    );
  }

  function pageNav(previous, next) {
    const left = previous
      ? '<a href="' + root + previous.href + '">&larr; ' + previous.title + '</a>'
      : '<span></span>';
    const right = next ? '<a href="' + root + next.href + '">' + next.title + ' &rarr;</a>' : '<span></span>';
    return '<div class="page-nav">' + left + right + '</div>';
  }

  function bindFilters(container, items, apply) {
    const groups = container.querySelectorAll('[data-filter-group]');
    const state = {};
    groups.forEach(function (group) {
      state[group.dataset.filterGroup] = 'All';
      group.addEventListener('click', function (event) {
        const target = event.target.closest('button');
        if (!target) return;
        state[group.dataset.filterGroup] = target.dataset.value;
        group.querySelectorAll('button').forEach(function (button) {
          button.setAttribute('aria-pressed', String(button === target));
        });
        apply(state);
      });
    });
    apply(state);
  }

  window.SEO_UI = {
    el: el,
    badge: badge,
    escapeHtml: escapeHtml,
    link: link,
    competitorBySlug: competitorBySlug,
    blogById: blogById,
    table: table,
    list: list,
    pageNav: pageNav,
    bindFilters: bindFilters,
    root: root,
    pageKey: pageKey
  };

  buildShell();
})();
