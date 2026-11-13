import { PLANS } from '@cio/utils/plans';
import { faqs } from '$lib/utils/faqs';
import type { ChangelogEntry } from '$lib/utils/types';
import { SITE_ORIGIN } from './upstreams';

type ResourceLink = { title: string; path: string; description: string };
type ResourceSection = { heading: string; intro?: string; links: ResourceLink[] };

const SITE_PAGES: ResourceLink[] = [
  { title: 'Home', path: '/', description: 'What ClassroomIO is and who it is for.' },
  { title: 'Pricing', path: '/pricing', description: 'Plans, limits and what each includes.' },
  { title: 'Teach online', path: '/teach', description: 'Run courses, cohorts and live classes for learners.' },
  {
    title: 'Customer education',
    path: '/customer-education',
    description: 'Academies that onboard and retain customers.'
  },
  {
    title: 'Customer education vs help docs',
    path: '/customer-education/vs-help-docs',
    description: 'When an academy beats a help center.'
  },
  {
    title: 'Partner training',
    path: '/partner-training',
    description: 'Certification programs for partners and resellers.'
  },
  {
    title: 'Compliance training',
    path: '/compliance-training',
    description: 'Recurring compliance courses with tracked completion.'
  },
  {
    title: 'Company academy vs docs',
    path: '/docs-vs-company-academy',
    description: 'Why a company academy complements documentation.'
  },
  { title: 'Automation', path: '/automation', description: 'Automate enrollment and learner workflows.' },
  { title: 'MCP recipes', path: '/mcp-recipes', description: 'Prompts for running ClassroomIO from an AI client.' },
  { title: 'Public courses', path: '/public-courses', description: 'Catalog of public ClassroomIO courses.' },
  { title: 'Blog', path: '/blog', description: 'Product news and guides.' },
  { title: 'Changelog', path: '/changelog', description: 'Release notes for every update.' },
  { title: 'Open source friends', path: '/oss-friends', description: 'Open source projects we recommend.' }
];

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

export function buildLlmsTxt(): string {
  const header = `# ClassroomIO

> ClassroomIO is an open-source learning platform for running customer, partner and employee academies: courses, cohorts, live classes, exercises, certificates, a public API and an MCP server. Use the Cloud product or self-host it.

Use this index to find machine-readable documentation and product resources. Follow the linked indexes when you need individual pages.

## When to use ClassroomIO

- Build and sell online courses, cohorts and live classes under your own brand and domain.
- Train customers, partners and employees with tracked progress, exercises and certificates.
- Automate courses, learners and organization data through the REST API, webhooks, OAuth or the MCP server.
- Self-host the full stack on your own infrastructure with Docker.

## How agents should use ClassroomIO

- To answer how-to questions, read the help center. Fetch its index below, then open the matching article as Markdown.
- For API calls, read the API guide and OpenAPI description before choosing an operation. Ask for approval before changing a user's data.
- For MCP, use an OAuth-capable client and let the user authorize access to their organization.
- Help pages live at \`${SITE_ORIGIN}/help\` and developer pages at \`${SITE_ORIGIN}/docs\`.`;

  const sections = LLMS_SECTIONS.map(renderSection).join('\n\n');

  return `${header}\n\n${sections}\n`;
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

export function buildSitemapMarkdown(): string {
  const pages = renderLinks(SITE_PAGES);

  return `# ClassroomIO sitemap

## Website

${pages}

## Other sitemaps

- [Help center sitemap](${absolute('/help/sitemap.xml')}): Every help page.
- [Help center index](${absolute('/help/llms.txt')}): Every help article with a summary.
- [Developer docs sitemap](${absolute('/docs/sitemap.xml')}): Every docs page.
- [Developer docs index](${absolute('/docs/llms.txt')}): Every docs page with a summary.
- [llms.txt](${absolute('/llms.txt')}): Curated index for agents.
- [Sitemap index](${absolute('/sitemap.xml')}): Every sitemap above in one file.
`;
}

export type SitemapBlogPost = { slug: string; date: string };

function toIsoDay(date: string): string | null {
  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function renderSitemapEntry(path: string, lastModified: string | null): string {
  const lastModifiedTag = lastModified ? `<lastmod>${lastModified}</lastmod>` : '';

  return `  <url><loc>${escapeXml(absolute(path))}</loc>${lastModifiedTag}</url>`;
}

export function buildSitemapXml(blogPosts: SitemapBlogPost[], changelogLastModified: string | null): string {
  const pageEntries = SITE_PAGES.map((page) => {
    const lastModified = page.path === '/changelog' ? changelogLastModified : null;

    return renderSitemapEntry(page.path, lastModified);
  });
  const blogEntries = blogPosts.map((post) => renderSitemapEntry(`/blog/${post.slug}`, toIsoDay(post.date)));
  const urls = [...pageEntries, ...blogEntries].join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
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
