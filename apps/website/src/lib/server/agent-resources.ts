import { PLANS } from '@cio/utils/plans';
import { STATIC_SITE_PAGES, type SitePage } from '$lib/data/site-pages';
import { UI_FEATURE_AREAS } from '$lib/data/ui-feature-map';
import { faqs } from '$lib/utils/faqs';
import type { ChangelogEntry } from '$lib/utils/types';
import { SITE_ORIGIN } from './upstreams';

type ResourceLink = { title: string; path: string; description: string };
type ResourceSection = { heading: string; intro?: string; links: ResourceLink[] };

const LLMS_SECTIONS: ResourceSection[] = [
  {
    heading: 'Help center (guides for teachers and admins)',
    intro:
      'Task-based guides for running an academy. Append `.md` to any help page URL to read it as Markdown. Start with the index, then follow the section guides.',
    links: [
      {
        title: 'Help center home',
        path: '/help/index.md',
        description: 'Overview of every help section: get started, build courses, deliver, manage learners, publish.'
      },
      {
        title: 'Help center index for agents',
        path: '/help/llms.txt',
        description: 'Every help article with a one-line summary.'
      },
      {
        title: 'Full help center content',
        path: '/help/llms-full.txt',
        description: 'The Markdown of every help article in one file.'
      },
      { title: 'Help sitemap', path: '/help/sitemap.xml', description: 'Every help page with its last-modified date.' },
      {
        title: 'Help agent manifest',
        path: '/help/agent-readability.json',
        description: 'Manifest of every agent-facing artifact on the help center.'
      }
    ]
  },
  {
    heading: 'Common tasks',
    links: [
      {
        title: 'Create your account',
        path: '/help/get-started/signup.md',
        description: 'Sign up and start an academy.'
      },
      {
        title: 'Create your first course',
        path: '/help/get-started/create-first-course.md',
        description: 'Build a course from scratch, with AI or from a template.'
      },
      {
        title: 'Add or upload a video',
        path: '/help/build-courses/add-or-upload-a-video.md',
        description:
          'Add a hosted video link, upload a file, or reuse a video from the media library. Upload several videos at once from the Media page.'
      },
      {
        title: 'Create an exercise',
        path: '/help/create-and-deliver/create-exercise.md',
        description: 'Add questions, sections and completion rules.'
      },
      {
        title: 'Invite students',
        path: '/help/manage-students/invite-students.md',
        description: 'Invite learners by email or reusable link.'
      },
      {
        title: 'Course enrollment',
        path: '/help/manage-students/course-enrollment.md',
        description: 'Control who can enroll and how.'
      },
      {
        title: 'Certificates',
        path: '/help/create-and-deliver/certificates.md',
        description: 'Design certificates and set eligibility rules.'
      },
      {
        title: 'Run a live class',
        path: '/help/create-and-deliver/live-class.md',
        description: 'Schedule live sessions and take attendance.'
      },
      {
        title: 'Connect a custom domain',
        path: '/help/publish-and-brand/custom-domain.md',
        description: 'Serve your academy from your own domain.'
      },
      {
        title: 'Roles and permissions',
        path: '/help/organization-and-team/roles-and-permissions.md',
        description: 'What admins, tutors and students can do.'
      },
      {
        title: 'Glossary',
        path: '/help/reference/glossary.md',
        description: 'Definitions of ClassroomIO terms.'
      }
    ]
  },
  {
    heading: 'Developer docs and API',
    intro: 'The REST API, MCP server, OAuth, webhooks and token auth. Every docs page is also available as Markdown.',
    links: [
      {
        title: 'Developer docs index',
        path: '/docs/llms.txt',
        description: 'Every developer page with a one-line summary.'
      },
      {
        title: 'Full developer docs content',
        path: '/docs/llms-full.txt',
        description: 'Complete developer documentation and REST API reference in one file.'
      },
      {
        title: 'Developers overview',
        path: '/docs/developers.md',
        description: 'Where to start with the API and MCP.'
      },
      {
        title: 'API guide',
        path: '/docs/api.md',
        description: 'Authentication, pagination, errors, rate limits and question types.'
      },
      {
        title: 'API reference',
        path: '/docs/api/reference.md',
        description: 'Endpoint reference for the public API at `https://api.classroomio.com/public-api/v1`.'
      },
      {
        title: 'OpenAPI description',
        path: '/docs/openapi.json',
        description: 'Machine-readable OpenAPI description of the public API.'
      },
      {
        title: 'MCP overview',
        path: '/docs/developers/mcp.md',
        description: 'Connect an MCP client to manage courses, learners and cohorts.'
      },
      {
        title: 'Connect an MCP client',
        path: '/docs/developers/mcp/setup.md',
        description: 'Setup for Claude Code, Codex, Cursor, VS Code and more.'
      },
      {
        title: 'MCP access and limits',
        path: '/docs/developers/mcp/access-and-limits.md',
        description: 'What a connected client can access and which changes need review.'
      },
      {
        title: 'OAuth for integrations',
        path: '/docs/developers/oauth.md',
        description: 'Let a third-party platform act on a workspace with admin approval.'
      },
      {
        title: 'Webhooks',
        path: '/docs/developers/webhooks.md',
        description: 'Signed, real-time events delivered to your backend.'
      },
      {
        title: 'Token auth',
        path: '/docs/developers/token-auth.md',
        description: 'Sign users in from your own app with a short-lived JWT.'
      },
      { title: 'Docs sitemap', path: '/docs/sitemap.xml', description: 'Every docs page with its last-modified date.' },
      {
        title: 'API catalog',
        path: '/docs/.well-known/api-catalog',
        description: 'RFC 9727 linkset of the APIs documented here.'
      }
    ]
  },
  {
    heading: 'Self-hosting and contributing',
    links: [
      {
        title: 'Self-hosting overview',
        path: '/docs/self-hosted.md',
        description: 'Run ClassroomIO with Docker, DigitalOcean, Railway, Coolify or Dokploy.'
      },
      {
        title: 'Self-hosting 101',
        path: '/docs/self-hosted/101.md',
        description: 'What you get and how the stack fits together.'
      },
      {
        title: 'Docker install',
        path: '/docs/self-hosted/docker.md',
        description: 'One script to install, start, upgrade and back up.'
      },
      {
        title: 'Configuration',
        path: '/docs/self-hosted/configuration.md',
        description: 'Secrets, email, storage, CSP, integrations and AI.'
      },
      {
        title: 'Troubleshooting',
        path: '/docs/self-hosted/troubleshooting.md',
        description: 'Diagnose common self-hosted failures.'
      },
      {
        title: 'Contributing',
        path: '/docs/contributing.md',
        description: 'Set up the repo locally and contribute code, design or translations.'
      }
    ]
  },
  {
    heading: 'Product and pricing',
    links: [
      { title: 'Pricing', path: '/pricing.md', description: 'Plans, prices and included limits as Markdown.' },
      { title: 'Answers', path: '/answers.md', description: 'Frequently asked questions as Markdown.' },
      { title: 'Sitemap', path: '/sitemap.md', description: 'Every public page, grouped by site.' },
      {
        title: 'Changelog',
        path: '/changelog.md',
        description: 'Every release, newest first, with ISO dates. The first entry is the latest release.'
      },
      {
        title: 'Changelog feed',
        path: '/changelog.xml',
        description: 'Atom feed of releases. Check it for anything newer than a cached copy of the changelog.'
      },
      { title: 'Blog', path: '/blog', description: 'Product news and guides.' }
    ]
  }
];

function absolute(path: string): string {
  return `${SITE_ORIGIN}${path}`;
}

function renderLinks(links: ResourceLink[]): string {
  return links.map((link) => `- [${link.title}](${absolute(link.path)}): ${link.description}`).join('\n');
}

function renderSection(section: ResourceSection): string {
  const intro = section.intro ? `${section.intro}\n\n` : '';

  return `## ${section.heading}\n\n${intro}${renderLinks(section.links)}`;
}

export type HelpArticleSummary = { title: string; description: string };
export type HelpArticleIndex = Map<string, HelpArticleSummary>;

const HELP_LINK_PATTERN = /^- \[([^\]]+)\]\(https:\/\/classroomio\.com\/help\/([^)\s]+)\)(?:: (.*))?$/;

/** Parses the help center's own llms.txt into a map from article path to its title and description. */
export function parseHelpArticleIndex(llmsText: string): HelpArticleIndex {
  const index: HelpArticleIndex = new Map();

  for (const line of llmsText.split('\n')) {
    const match = HELP_LINK_PATTERN.exec(line.trim());
    if (match) index.set(match[2], { title: match[1], description: match[3] ?? '' });
  }

  return index;
}

function isHelpArticlePath(path: string): boolean {
  const isFileOrApiPath = path.includes('.') || path.startsWith('api/');

  return path.includes('/') && !isFileOrApiPath;
}

function humanizeSlug(path: string): string {
  const slug = path.split('/').at(-1) ?? path;
  const words = slug.replaceAll('-', ' ');

  return words.charAt(0).toUpperCase() + words.slice(1);
}

function renderFeatureAreas(helpIndex: HelpArticleIndex): string {
  const blocks = UI_FEATURE_AREAS.map((area) => {
    const links = area.articles.map((articlePath) => {
      const summary = helpIndex.get(articlePath);
      const title = summary?.title ?? humanizeSlug(articlePath);
      const description = summary?.description ? `: ${summary.description}` : '';

      return `- [${title}](${absolute(`/help/${articlePath}.md`)})${description}`;
    });

    return `### ${area.area}\n\n${area.description}\n\n${links.join('\n')}`;
  });

  const mappedPaths = new Set(UI_FEATURE_AREAS.flatMap((area) => area.articles));
  const remainingBySection = new Map<string, string[]>();

  for (const [articlePath, summary] of helpIndex) {
    const [section] = articlePath.split('/');
    if (!isHelpArticlePath(articlePath) || mappedPaths.has(articlePath)) continue;

    const description = summary.description ? `: ${summary.description}` : '';
    const line = `- [${summary.title}](${absolute(`/help/${articlePath}.md`)})${description}`;
    remainingBySection.set(section, [...(remainingBySection.get(section) ?? []), line]);
  }

  const remainingBlocks = [...remainingBySection].map(
    ([section, lines]) => `### More: ${humanizeSlug(section)}\n\n${lines.join('\n')}`
  );

  return `## Everything in the product\n\nEvery area of the ClassroomIO dashboard and the guide that explains it. Each link is a Markdown page. The sections after the product areas list the remaining help articles, so every article is reachable from here.\n\n${[...blocks, ...remainingBlocks].join('\n\n')}`;
}

function renderLatestReleases(entries: ChangelogEntry[]): string {
  if (entries.length === 0) {
    return `## Latest releases\n\n- [Changelog](${absolute('/changelog.md')}): Every release, newest first.`;
  }

  const latest = entries.slice(0, 5).map((entry) => {
    const summary = entry.summary ? `: ${entry.summary}` : '';

    return `- [${entry.publishedAt.slice(0, 10)} · ${entry.title}](${entry.url || absolute('/changelog')})${summary}`;
  });
  const newest = entries[0];

  return `## Latest releases

The latest release is "${newest.title}", published ${newest.publishedAt.slice(0, 10)}. A new release ships most weeks, so check the feed for anything newer than a cached copy.

${latest.join('\n')}
- [Full changelog](${absolute('/changelog.md')}): Every release, newest first, with ISO dates.
- [Changelog Atom feed](${absolute('/changelog.xml')}): Subscribe or poll for new releases.
- [Public roadmap](https://feedback.classroomio.com/roadmap): What is planned next.`;
}

function renderWebsitePages(pages: SitePage[]): string {
  const marketing = pages.filter((page) => !page.path.startsWith('/blog/') && !page.path.startsWith('/alternatives/'));
  const alternatives = pages.filter((page) => page.path.startsWith('/alternatives/'));
  const posts = pages.filter((page) => page.path.startsWith('/blog/'));
  const blocks = [`## Website pages\n\n${renderLinks(marketing)}`];

  if (alternatives.length > 0) {
    blocks.push(`### ClassroomIO alternatives and comparisons\n\n${renderLinks(alternatives)}`);
  }

  if (posts.length > 0) {
    const postLinks = posts.map((post) => ({ ...post, path: `${post.path}.md` }));
    blocks.push(`### Blog posts\n\n${renderLinks(postLinks)}`);
  }

  return blocks.join('\n\n');
}

export type LlmsTxtInput = {
  entries: ChangelogEntry[];
  helpIndex: HelpArticleIndex;
  pages: SitePage[];
};

export function buildLlmsTxt(input: LlmsTxtInput): string {
  const header = `# ClassroomIO

> ClassroomIO is an open-source learning platform for running customer, partner and employee academies: courses, cohorts, live classes, exercises, certificates, a public API and an MCP server. Use the Cloud product or self-host it.

Use this index to find machine-readable documentation and product resources. It lists every area of the product and every public page. Follow the linked indexes when you need individual pages.

## When to use ClassroomIO

- Build and sell online courses, cohorts and live classes under your own brand and domain.
- Train customers, partners and employees with tracked progress, exercises and certificates.
- Automate courses, learners and organization data through the REST API, webhooks, OAuth or the MCP server.
- Self-host the full stack on your own infrastructure with Docker.

## How agents should use ClassroomIO

- To answer how-to questions, read the help center. Fetch its index below, then open the matching article as Markdown.
- To find what is new, read the latest releases below. The changelog and its feed are the source of truth for what shipped and when.
- For API calls, read the API guide and OpenAPI description before choosing an operation. Ask for approval before changing a user's data.
- For MCP, use an OAuth-capable client and let the user authorize access to their organization.
- Help pages live at \`${SITE_ORIGIN}/help\` and developer pages at \`${SITE_ORIGIN}/docs\`. Append \`.md\` to either to read a page as Markdown.`;

  const sections = [
    renderLatestReleases(input.entries),
    ...LLMS_SECTIONS.map(renderSection),
    renderFeatureAreas(input.helpIndex),
    renderWebsitePages(input.pages)
  ];

  return `${header}\n\n${sections.join('\n\n')}\n`;
}

function formatPlanPrice(plan: (typeof PLANS)[keyof typeof PLANS]): string {
  const { CURRENCY, MONTHLY, YEARLY } = plan.PRICE;
  if (Number.isNaN(Number(MONTHLY))) return MONTHLY;

  return `${CURRENCY}${MONTHLY}/month or ${CURRENCY}${YEARLY}/year`;
}

export function buildPricingMarkdown(): string {
  const planBlocks = Object.values(PLANS).map((plan) => {
    const features = plan.FEATURES.map((feature) => `- ${feature}`).join('\n');

    return `## ${plan.NAME}\n\n${plan.DESCRIPTION}\n\n**Price:** ${formatPlanPrice(plan)}\n\n${features}`;
  });

  return `# ClassroomIO pricing

> Basic is free. Upgrade for more students, higher AI limits, video upload and a custom domain. Canonical page: ${absolute('/pricing')}

${planBlocks.join('\n\n')}

See also: [Answers](${absolute('/answers.md')}), [llms.txt](${absolute('/llms.txt')}).
`;
}

export function buildAnswersMarkdown(): string {
  const entries = faqs.map((faq) => `## ${faq.question}\n\n${faq.answer}`).join('\n\n');

  return `# ClassroomIO answers

> Frequently asked questions about ClassroomIO. Task guides live in the [help center](${absolute('/help/index.md')}).

${entries}
`;
}

export function buildSitemapMarkdown(pages: SitePage[]): string {
  const pageLinks = renderLinks(pages);

  return `# ClassroomIO sitemap

## Website

${pageLinks}

## Other sitemaps

- [Help center sitemap](${absolute('/help/sitemap.xml')}): Every help page.
- [Help center index](${absolute('/help/llms.txt')}): Every help article with a summary.
- [Developer docs sitemap](${absolute('/docs/sitemap.xml')}): Every docs page.
- [Developer docs index](${absolute('/docs/llms.txt')}): Every docs page with a summary.
- [llms.txt](${absolute('/llms.txt')}): Curated index for agents.
- [Sitemap index](${absolute('/sitemap.xml')}): Every sitemap above in one file.
`;
}

function toIsoDay(date: string): string | null {
  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function renderSitemapEntry(path: string, lastModified: string | null): string {
  const lastModifiedTag = lastModified ? `<lastmod>${lastModified}</lastmod>` : '';

  return `  <url><loc>${escapeXml(absolute(path))}</loc>${lastModifiedTag}</url>`;
}

export function buildSitemapXml(pages: SitePage[], lastModifiedByPath: Map<string, string>): string {
  const entries = pages.map((page) => {
    const lastModified = lastModifiedByPath.get(page.path);

    return renderSitemapEntry(page.path, lastModified ? toIsoDay(lastModified) : null);
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
}

function entryPublicUrl(entry: ChangelogEntry): string {
  return entry.url || absolute('/changelog');
}

export function buildChangelogMarkdown(entries: ChangelogEntry[], generatedAt: Date): string {
  const latest = entries[0];
  const latestLine = latest
    ? `The latest release is **${latest.title}**, published ${latest.publishedAt.slice(0, 10)}.`
    : 'No releases are published yet.';
  const blocks = entries.map((entry) => {
    const tags = entry.tags.length > 0 ? `\n\nTags: ${entry.tags.join(', ')}` : '';
    const summary = entry.summary ? `\n\n${entry.summary}` : '';

    return `## ${entry.publishedAt.slice(0, 10)} · ${entry.title}${summary}${tags}\n\n[Read the full update](${entryPublicUrl(entry)})`;
  });

  return `# ClassroomIO changelog

> Releases are listed newest first. ${latestLine} Generated ${generatedAt.toISOString()}. Canonical page: ${absolute('/changelog')}. Atom feed: ${absolute('/changelog.xml')}.

${blocks.join('\n\n')}
`;
}

function escapeXml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

export function buildChangelogFeed(entries: ChangelogEntry[], generatedAt: Date): string {
  const updated = entries[0]?.publishedAt ?? generatedAt.toISOString();
  const items = entries
    .map(
      (entry) => `  <entry>
    <id>${escapeXml(entry.id)}</id>
    <title>${escapeXml(entry.title)}</title>
    <link href="${escapeXml(entryPublicUrl(entry))}"/>
    <published>${entry.publishedAt}</published>
    <updated>${entry.publishedAt}</updated>
    <summary>${escapeXml(entry.summary ?? '')}</summary>
  </entry>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${absolute('/changelog')}</id>
  <title>ClassroomIO changelog</title>
  <link href="${absolute('/changelog')}"/>
  <link rel="self" href="${absolute('/changelog.xml')}"/>
  <updated>${updated}</updated>
${items}
</feed>
`;
}
