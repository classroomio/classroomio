import { describe, expect, it } from 'vitest';

import {
  breadcrumbEdges,
  indexPageChildren,
  isListingContent,
  mergeStructure,
  navigationTree,
  pageDataTree,
  type StructureResult
} from './structure';

const HELP = 'https://help.acme.example';
const inHelp = (url: string) => url.startsWith(HELP);

function parentOf(results: StructureResult[], id: string) {
  return mergeStructure(results).edges.get(id);
}

describe('structure: choosing a parent', () => {
  it('never lets page data that only places a page at the top override a breadcrumb naming its parent', () => {
    const article = `${HELP}/articles/42-add-assets`;
    const blob = {
      props: {
        article: [{ title: 'Add assets', url: article }],
        trail: [
          { title: 'Getting started', url: `${HELP}/collections/1-getting-started` },
          { title: 'Setup guides', url: `${HELP}/collections/2-setup-guides` }
        ]
      }
    };
    const known = (url: string) => inHelp(url);
    const html = `<nav aria-label="Breadcrumb"><ol>
      <li><a href="${HELP}/">All collections</a></li>
      <li><a href="${HELP}/collections/1-getting-started">Getting started</a></li>
      <li><a href="${HELP}/collections/2-setup-guides">Setup guides</a></li></ol></nav>`;

    const results = [pageDataTree([blob], article, known), breadcrumbEdges(html, article)];

    expect(parentOf(results, article)?.parentId).toBe(`${HELP}/collections/2-setup-guides`);
    expect(parentOf(results, `${HELP}/collections/2-setup-guides`)?.parentId).toBe(
      `${HELP}/collections/1-getting-started`
    );
  });

  it('takes the parent from the breadcrumb and the position from that parent’s own list, not from a preview elsewhere', () => {
    const article = `${HELP}/articles/7-invite-users`;
    const homePreview = indexPageChildren(
      `<h2>Users</h2><ul><li><a href="/articles/9-roles">Roles</a></li><li><a href="/articles/7-invite-users">Invite users</a></li><li><a href="/articles/8-remove">Remove users</a></li></ul>`,
      `${HELP}/`,
      inHelp
    );
    const sectionList = indexPageChildren(
      `<ul><li><a href="/articles/5-overview">Overview</a></li><li><a href="/articles/9-roles">Roles</a></li><li><a href="/articles/7-invite-users">Invite users</a></li></ul>`,
      `${HELP}/sections/3-users`,
      inHelp
    );
    const crumbs = breadcrumbEdges(
      `<ol class="breadcrumbs"><li><a href="/">Help</a></li><li><a href="/sections/3-users">Users</a></li></ol>`,
      article
    );

    const edge = parentOf([{ edges: homePreview, groups: [] }, { edges: sectionList, groups: [] }, crumbs], article);

    expect(edge).toMatchObject({ parentId: `${HELP}/sections/3-users`, position: 2 });
  });
});

describe('structure: breadcrumbs', () => {
  it('drops a last crumb without a link, which names the page itself', () => {
    const article = `${HELP}/articles/42-add-assets`;
    const result = breadcrumbEdges(
      `<nav aria-label="breadcrumb"><ol>
        <li><a href="/">All collections</a></li>
        <li><a href="/collections/2-setup-guides">Setup guides</a></li>
        <li>Add assets</li></ol></nav>`,
      article
    );

    expect(result.groups).toEqual([]);
    expect(result.edges[result.edges.length - 1]).toMatchObject({
      childId: article,
      parentId: `${HELP}/collections/2-setup-guides`
    });
  });

  it('reads a trail once when it repeats itself in a nested menu, and skips the current page item', () => {
    const article = `${HELP}/solutions/articles/12-submit-a-ticket`;
    const html = `<nav><ol class="breadcrumb">
      <li><a href="/support/home">Home</a></li>
      <li><a href="/solutions/1-getting-started">Getting started</a></li>
      <li><a href="/solutions/folders/4-drive">Drive</a></li>
      <li class="more"><a href="#">…</a><ul>
        <li><a href="/solutions/1-getting-started">Getting started</a></li>
        <li><a href="/solutions/folders/4-drive">Drive</a></li></ul></li>
      <li aria-current="page">Submit a ticket</li></ol></nav>`;

    expect(breadcrumbEdges(html, article).edges.map((edge) => [edge.childId, edge.parentId])).toEqual([
      [`${HELP}/support/home`, null],
      [`${HELP}/solutions/1-getting-started`, `${HELP}/support/home`],
      [`${HELP}/solutions/folders/4-drive`, `${HELP}/solutions/1-getting-started`],
      [article, `${HELP}/solutions/folders/4-drive`]
    ]);
    expect(navigationTree(html, article, inHelp).edges).toEqual([]);
  });
});

describe('structure: listing pages', () => {
  it('calls content made of the titles of the pages it lists a listing, in HTML and in Markdown', () => {
    const collection = `${HELP}/collections/2-setup-guides`;
    const titles = ['Add assets', 'Add parts', 'Create a maintenance template', 'Invite your team'];
    const html = `<h1>Setup guides</h1><p>4 articles</p><ul>${titles
      .map((title, index) => `<li><a href="/articles/${index}">${title}</a></li>`)
      .join('')}</ul>`;
    const markdown = `# Setup guides\n\n${titles.map((title, index) => `- [${title}](${HELP}/articles/${index})`).join('\n')}`;

    expect(isListingContent({ format: 'html', text: html }, collection, inHelp)).toBe(true);
    expect(isListingContent({ format: 'markdown', text: markdown }, collection, inHelp)).toBe(true);
  });

  it('keeps an article that links to other pages as an article', () => {
    const article = `${HELP}/articles/7-invite-users`;
    const text = `<h1>Invite users</h1><p>Open the team page, choose who to invite and pick the role each person gets. Invitations expire after a week, and you can send one again at any time from the same page. People who already belong to another team keep their own settings.</p><h2>Related</h2><ul><li><a href="/articles/9-roles">Roles</a></li><li><a href="/articles/8-remove">Remove users</a></li></ul>`;

    expect(isListingContent({ format: 'html', text }, article, inHelp)).toBe(false);
  });
});
