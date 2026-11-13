export type SitePage = { path: string; title: string; description: string };

export const STATIC_SITE_PAGES: SitePage[] = [
  {
    path: '/',
    title: 'ClassroomIO home',
    description:
      'One platform for customer academies, partner certification, and employee training. Build courses with AI, publish under your domain, and track completions.'
  },
  {
    path: '/pricing',
    title: 'Pricing',
    description:
      'Basic is free for up to 20 students. Upgrade for more seats, higher AI limits, a custom domain, or enterprise controls.'
  },
  {
    path: '/teach',
    title: 'Teach on ClassroomIO',
    description: 'Make side income teaching what you love: launch your own course and academy on ClassroomIO.'
  },
  {
    path: '/customer-education',
    title: 'Customer academy software for SaaS',
    description:
      'Launch a branded academy for onboarding, feature adoption, admin training, and certification under your own domain, with an AI tutor in every lesson.'
  },
  {
    path: '/customer-education/vs-help-docs',
    title: 'Customer academy vs help docs',
    description:
      'Why a customer academy outperforms help docs for onboarding, certification, and adoption, compared with Intercom Articles, Zendesk Guide, and Confluence.'
  },
  {
    path: '/partner-training',
    title: 'Partner training',
    description:
      'Run a partner academy alongside your customer one: separate brand and domain, same account. Certify resellers, agencies, and integrators.'
  },
  {
    path: '/compliance-training',
    title: 'Compliance training',
    description:
      'Turn policies and SOPs into certified training with renewals, grace periods, and audit evidence, and track who is falling behind.'
  },
  {
    path: '/docs-vs-company-academy',
    title: 'Docs vs company academy',
    description:
      'When a company needs documentation, when it needs an academy, and how both work together for onboarding, enablement, and certification.'
  },
  {
    path: '/automation',
    title: 'API, webhooks and MCP server',
    description:
      'Automate course authoring and learner provisioning with the ClassroomIO REST API, webhooks, and MCP server. Open source and self-hostable.'
  },
  {
    path: '/mcp-recipes',
    title: 'MCP recipes',
    description:
      'Ready-to-run prompts for the ClassroomIO MCP server: generate courses, refresh content, tag launches, and more from any MCP client.'
  },
  {
    path: '/public-courses',
    title: 'Public courses',
    description:
      'Publish public courses on your own branded page, with built-in quizzes, lesson callouts, and optional custom domains.'
  },
  { path: '/blog', title: 'Blog', description: 'Product news, launches, and guides from the ClassroomIO team.' },
  {
    path: '/changelog',
    title: 'Changelog',
    description: 'Every new feature, improvement, and fix shipped to ClassroomIO, published weekly, newest first.'
  },
  {
    path: '/oss-friends',
    title: 'Open source friends',
    description: 'Open source projects the ClassroomIO team recommends and builds alongside.'
  }
];

export const NON_INDEXED_ROUTES = ['/early-adopter/thanks'];
