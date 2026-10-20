import type { Course } from './types';

const DEFAULT_THRESHOLD = 100;

type CompletionRulesCourse = Pick<Course, 'certificate'>;

export type CompletionRulesSummary = {
  threshold: number;
  deadline: string | null;
};

/** The completion rules as the API applies them, for read-only display outside the course Settings tab. */
export function getCompletionRulesSummary(course: CompletionRulesCourse | null): CompletionRulesSummary {
  const certificate = course?.certificate;
  const storedThreshold = certificate?.threshold;

  return {
    threshold: typeof storedThreshold === 'number' ? storedThreshold : DEFAULT_THRESHOLD,
    deadline: certificate?.deadline ?? null
  };
}
