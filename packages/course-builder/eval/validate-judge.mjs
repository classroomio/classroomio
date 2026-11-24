/**
 * Sanity-checks the coverage judge on Energis before it is trusted to score generated courses:
 *   1. the gold course against itself            -> should score close to 1
 *   2. today's fixed generic starter outline      -> should score low
 *   3. the knowledge base's own page tree         -> shows whether the source covers the gold scope
 * Needs a build of the package (pnpm --filter @cio/course-builder build) and ANTHROPIC_API_KEY.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ClaudeClient, judgeCoverage } from '../dist/index.js';

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'eval-data', 'energis');
const gold = JSON.parse(readFileSync(join(DATA_DIR, 'gold-course.json'), 'utf8'));
const knowledgeBase = JSON.parse(readFileSync(join(DATA_DIR, 'knowledge-base.json'), 'utf8'));

const goldAsCandidate = {
  courses: [
    {
      title: gold.title,
      sections: gold.sections.map((section) => ({
        title: section.title,
        lessons: section.lessons.map((lesson) => lesson.title)
      }))
    }
  ]
};

const genericStarter = {
  courses: [
    {
      title: 'Getting Started with Energis.Cloud',
      sections: [
        { title: 'Getting to know Energis.Cloud', lessons: ['What the product does', 'Navigating the interface'] },
        { title: 'Configuring your account', lessons: ['Account settings', 'Personal preferences'] },
        { title: 'Achieving your first result', lessons: ['Your first task', 'Reviewing results'] }
      ]
    },
    {
      title: 'Core Workflows, Step by Step',
      sections: [
        { title: 'Everyday tasks', lessons: ['Daily routine', 'Common actions'] },
        { title: 'Working efficiently', lessons: ['Shortcuts', 'Best practices'] }
      ]
    },
    {
      title: 'Collaborating with Your Team',
      sections: [{ title: 'Inviting colleagues', lessons: ['Invitations', 'Roles and permissions'] }]
    },
    {
      title: 'Getting Help and Next Steps',
      sections: [{ title: 'Finding answers', lessons: ['Help center', 'Contacting support'] }]
    }
  ]
};

const pagesByParent = new Map();
for (const page of knowledgeBase) {
  const siblings = pagesByParent.get(page.parentId) ?? [];
  siblings.push(page);
  pagesByParent.set(page.parentId, siblings);
}
const isNoise = (page) => /obsolete|deprecated|^test$|untitled/i.test(page.title) || page.path[1] === 'Release Content';
const sectionPages = knowledgeBase.filter((page) => page.path.length === 2 && !isNoise(page));
const knowledgeBaseTree = {
  courses: [
    {
      title: 'Energis Support Center (page tree)',
      sections: sectionPages.flatMap((area) => {
        const children = (pagesByParent.get(area.id) ?? []).filter((page) => !isNoise(page));

        return children.map((child) => ({
          title: `${area.title} > ${child.title}`,
          lessons: (pagesByParent.get(child.id) ?? []).filter((page) => !isNoise(page)).map((page) => page.title)
        }));
      })
    }
  ]
};

const client = new ClaudeClient({ apiKey: process.env.ANTHROPIC_API_KEY });
const cases = [
  ['gold vs itself', goldAsCandidate],
  ['generic starter outline', genericStarter],
  ['knowledge-base page tree', knowledgeBaseTree]
];

for (const [label, candidate] of cases) {
  const startedAt = Date.now();
  const result = await judgeCoverage(client, gold, candidate);
  const missing = result.judgement.sections
    .filter((section) => section.verdict !== 'covered')
    .map((section) => `${section.goldNumber}:${section.verdict}`);
  console.log(
    `${label}: score ${result.score.toFixed(2)} (covered ${result.covered}, partial ${result.partial}, missing ${result.missing}, unknown ${result.unknown}) in ${Date.now() - startedAt} ms`
  );
  if (missing.length) console.log(`   not fully covered: ${missing.join(', ')}`);
}

console.log('judge cost $', client.ledger.totalCostUsd.toFixed(4));
