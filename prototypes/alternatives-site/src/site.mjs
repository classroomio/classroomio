import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

function loadResearch(file) {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(here, 'research', file), 'utf8'), sandbox);
  return sandbox.window;
}

export const SLUGS = [
  'skilljar',
  'learnupon',
  'docebo',
  'intellum',
  'thought-industries',
  'thinkific',
  'teachfloor',
  'teachable',
  'kajabi'
];

export const research = Object.fromEntries(SLUGS.map((slug) => [slug, loadResearch(`${slug}.js`).SEO_PAGES[slug]]));
export const seoData = loadResearch('site.js').SEO_DATA;
export const BLOG = Object.fromEntries(seoData.blog.map((post) => [post.id, post]));
export const CHECKED = seoData.updated;

export const COMPETITORS = {
  skilljar: {
    name: 'Skilljar',
    kind: 'Customer education platform',
    angle: 'Start building today',
    blurb:
      'Deep CRM integrations and proctored exams, priced through sales. See what a free workspace and a $35 plan can cover first.'
  },
  learnupon: {
    name: 'LearnUpon',
    kind: 'Learning management system',
    angle: 'Let AI draft the first course',
    blurb:
      'Built for employees, customers and associations. If you only teach customers, see how a narrower product works.'
  },
  docebo: {
    name: 'Docebo',
    kind: 'Workforce learning platform',
    angle: 'Monthly billing, one job',
    blurb: 'A workforce platform with a one-year minimum. See what a customer academy looks like on a monthly plan.'
  },
  intellum: {
    name: 'Intellum',
    kind: 'Customer education platform',
    angle: 'Certificates and domain in one plan',
    blurb:
      'A modular enterprise platform for several audiences. Compare it with one plan for a single customer audience.'
  },
  'thought-industries': {
    name: 'Thought Industries',
    kind: 'Learning and knowledge platform',
    angle: 'A price for 10,000 students',
    blurb:
      'A learning and knowledge layer sold through a demo. See how an academy-first plan compares on scope and learner caps.'
  },
  thinkific: {
    name: 'Thinkific',
    kind: 'Course business platform',
    angle: 'Every teammate can build',
    blurb: 'Made for selling courses and memberships. See what changes when the only goal is training customers.'
  },
  teachfloor: {
    name: 'Teachfloor',
    kind: 'Cohort-based learning platform',
    angle: 'Cohorts on your own domain',
    blurb: 'Strong cohort learning with peer review. See where branding, domain and SSO sit in each plan.'
  },
  teachable: {
    name: 'Teachable',
    kind: 'Creator course platform',
    angle: 'Customers or creators?',
    blurb: 'A platform for creators selling courses. Work out whether your use case belongs there before you compare.'
  },
  kajabi: {
    name: 'Kajabi',
    kind: 'Creator business suite',
    angle: 'Priced by students, not contacts',
    blurb: 'A creator suite with funnels and email. See what a team that only trains customers would pay for.'
  }
};

export const PLANS = [
  {
    name: 'Free',
    price: '$0',
    unit: '',
    line: 'Build your first course and try the product.',
    items: ['Up to 20 students', '500K AI credits', 'Unlimited courses', 'MCP access']
  },
  {
    name: 'Early Adopter',
    price: '$35',
    unit: 'per month, or $350 per year',
    hot: true,
    line: 'Your own academy, ready for customers.',
    items: [
      'Up to 10,000 students',
      '3M AI credits',
      'Custom domain and branding',
      'Certificates',
      'Unlimited collaborators',
      'API with limits, and webhooks',
      'MCP access'
    ]
  },
  {
    name: 'Enterprise',
    price: 'By quote',
    unit: '',
    line: 'For larger programs and security requirements.',
    items: ['Unlimited students', 'SSO with OIDC', 'Up to 4 organizations', 'MCP access']
  }
];

export const FEATURES = {
  ai: {
    icon: 'spark',
    title: 'AI course creation',
    text: 'Describe the lesson you need and get a draft to edit. You review everything before it is published.',
    viz: 'ai'
  },
  tutor: {
    icon: 'spark',
    title: 'AI tutor for learners',
    text: 'Learners can ask questions inside a course, so common how-to questions do not wait for your team.',
    viz: 'tutor'
  },
  domain: {
    icon: 'globe',
    title: 'Custom domain and branding',
    text: 'Run the academy on your own domain with your colors and logo, from the $35 plan.',
    viz: 'domain'
  },
  certs: {
    icon: 'award',
    title: 'Certificates',
    text: 'Design a certificate and issue it when a learner finishes. Included from the $35 plan.',
    viz: 'certs'
  },
  analytics: {
    icon: 'chart',
    title: 'Learner and course analytics',
    text: 'See who is learning, which courses are finished and where people drop off, inside the product.',
    viz: 'analytics'
  },
  api: {
    icon: 'plug',
    title: 'API and webhooks',
    text: 'Send learning events to your own tools and pull data out with the public API. Limits apply on Early Adopter.',
    viz: 'api'
  },
  mcp: {
    icon: 'terminal',
    title: 'MCP access on every plan',
    text: 'Connect an AI agent to your academy to draft and manage courses, including on the free plan.',
    viz: 'mcp'
  },
  cohorts: {
    icon: 'cohort',
    title: 'Cohorts with goals and a news feed',
    text: 'Run a group through a course together, set a goal and post updates to the cohort.',
    viz: 'cohorts'
  },
  seats: {
    icon: 'users',
    title: 'Unlimited collaborators',
    text: 'Support, product and customer success can all contribute to courses without paying per seat.',
    viz: 'seats'
  },
  structure: {
    icon: 'book',
    title: 'Learning paths, cohorts and live sessions',
    text: 'Guide customers through courses in a set order, run them together as a cohort, and add live sessions where a conversation helps.',
    viz: 'structure'
  },
  price: {
    icon: 'tag',
    title: 'A simple paid plan, and a free plan too',
    text: 'Your domain, branding and certificates are all in one paid plan. Start on the free plan for up to 20 students, with no sales call.',
    viz: 'price'
  },
  capacity: {
    icon: 'layers',
    title: 'Capacity-based pricing',
    text: 'Plans are sized by student capacity: 20, 10,000 or unlimited. There is no per-learner fee.',
    viz: 'capacity'
  },
  free: {
    icon: 'tag',
    title: 'A free plan to build on',
    text: 'Create a course, invite up to 20 students and see how it feels before you spend anything.',
    viz: 'free'
  },
  monthly: {
    icon: 'calendar',
    title: 'Monthly or yearly billing',
    text: 'Pay $35 a month, or $350 a year. Enterprise is agreed by quote.',
    viz: 'monthly'
  },
  courses: {
    icon: 'book',
    title: 'Unlimited courses',
    text: 'Build as many courses as your customers need. Courses are not capped on any plan.',
    viz: 'courses'
  },
  exercises: {
    icon: 'file',
    title: 'Exercises with auto-grading',
    text: 'Check understanding as people learn, without marking every answer by hand.',
    viz: 'exercises'
  },
  templates: {
    icon: 'grid',
    title: 'Course templates',
    text: 'Start from a template and reuse a structure across product lines.',
    viz: 'templates'
  }
};

export function relPath(root, target) {
  return `${root}${target}`;
}
