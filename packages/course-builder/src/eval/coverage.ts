import * as z from 'zod/v4';

import type { ClaudeClient } from '../llm/claude';

export interface GoldSection {
  number: number;
  title: string;
  lessons: Array<{ title: string; minutes?: number }>;
}

export interface GoldCourse {
  title: string;
  audience?: string;
  sections: GoldSection[];
}

/** A generated course reduced to what the judge needs: titles of courses, sections and lessons. */
export interface CandidateOutline {
  courses: Array<{
    title: string;
    sections: Array<{ title: string; lessons: string[] }>;
  }>;
}

export const COVERAGE_VERDICTS = ['covered', 'partial', 'missing', 'unknown'] as const;

const ZCoverageJudgement = z.object({
  sections: z.array(
    z.object({
      goldNumber: z.number().int(),
      verdict: z.enum(COVERAGE_VERDICTS),
      matchedCandidateSections: z
        .array(z.string())
        .describe('Titles of the candidate sections that teach this topic, as "course title > section title"'),
      reason: z.string()
    })
  )
});

export type CoverageJudgement = z.infer<typeof ZCoverageJudgement>;

export interface CoverageResult {
  /** Covered counts 1, partial counts 0.5, missing and unknown count 0. */
  score: number;
  covered: number;
  partial: number;
  missing: number;
  unknown: number;
  judgement: CoverageJudgement;
}

const JUDGE_SYSTEM = [
  'You compare two course outlines for the same software product.',
  'The gold outline was written by the company. The candidate outline was generated.',
  'For each gold section, decide whether the candidate teaches the same topic:',
  '- covered: a candidate section or set of lessons teaches the same topic at similar depth.',
  '- partial: the topic is mentioned or only part of it is taught.',
  '- missing: nothing in the candidate teaches it.',
  '- unknown: the titles are too vague to tell.',
  'Judge by meaning, not wording. Do not reward a candidate for broad titles that could mean anything.',
  'Answer for every gold section, in gold order.'
].join('\n');

function renderGold(gold: GoldCourse): string {
  return gold.sections
    .map((section) => {
      const lessons = section.lessons.map((lesson) => `    - ${lesson.title}`).join('\n');

      return `${section.number}. ${section.title}\n${lessons}`;
    })
    .join('\n');
}

function renderCandidate(candidate: CandidateOutline): string {
  return candidate.courses
    .map((course) => {
      const sections = course.sections
        .map((section) => {
          const lessons = section.lessons.map((lesson) => `      - ${lesson}`).join('\n');

          return `  - ${section.title}\n${lessons}`;
        })
        .join('\n');

      return `Course: ${course.title}\n${sections}`;
    })
    .join('\n\n');
}

/**
 * Turns a judgement into a score. Gold sections the judge left out, or answered twice, count once, as missing when
 * absent.
 */
export function scoreCoverage(gold: GoldCourse, judgement: CoverageJudgement): CoverageResult {
  const verdictByNumber = new Map<number, (typeof COVERAGE_VERDICTS)[number]>();
  for (const section of judgement.sections) {
    if (!verdictByNumber.has(section.goldNumber)) verdictByNumber.set(section.goldNumber, section.verdict);
  }

  const counts = { covered: 0, partial: 0, missing: 0, unknown: 0 };
  for (const section of gold.sections) counts[verdictByNumber.get(section.number) ?? 'missing'] += 1;

  const total = gold.sections.length || 1;
  const score = (counts.covered + counts.partial * 0.5) / total;

  return { score, ...counts, judgement };
}

/** Scores how much of a gold course's scope a generated outline covers, judged section by section. */
export async function judgeCoverage(
  client: ClaudeClient,
  gold: GoldCourse,
  candidate: CandidateOutline
): Promise<CoverageResult> {
  const goldText = renderGold(gold);
  const candidateText = renderCandidate(candidate);

  const judgement = await client.structured({
    role: 'checker',
    system: JUDGE_SYSTEM,
    content: [
      {
        type: 'text',
        text: `<gold_outline title="${gold.title}">\n${goldText}\n</gold_outline>\n\n<candidate_outline>\n${candidateText}\n</candidate_outline>`
      }
    ],
    schema: ZCoverageJudgement,
    maxTokens: 16_000
  });

  return scoreCoverage(gold, judgement);
}
