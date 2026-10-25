import { isIP } from 'node:net';

import type { PersonalLearningSource } from '@cio/db/schema';
import { AppError } from '@cio/utils/errors';
import { z } from 'zod';

const LOCAL_HOST_SUFFIXES = ['.localhost', '.local', '.internal', '.test'];

export const LearningSessionDraftSchema = z.object({
  title: z.string().trim().min(1).max(160),
  objectives: z.array(z.string().trim().min(1).max(500)).min(1).max(8),
  activities: z
    .array(
      z.object({
        type: z.enum(['reading', 'explanation', 'practice', 'reflection']),
        estimatedMinutes: z.number().int().positive(),
        content: z.string().trim().min(1).max(12000)
      })
    )
    .min(1)
    .max(8),
  checkQuestions: z.array(z.string().trim().min(1).max(1000)).min(1).max(8),
  citations: z
    .array(
      z.object({
        url: z.string().url(),
        title: z.string().trim().min(1).max(200),
        evidence: z
          .array(
            z.object({
              claimId: z.string().trim().min(1).max(80),
              quote: z.string().trim().min(1).max(1000)
            })
          )
          .min(1)
          .max(8)
      })
    )
    .min(1)
    .max(8),
  whyThisSession: z.string().trim().min(1).max(1000)
});

export type LearningSessionDraft = z.infer<typeof LearningSessionDraftSchema>;

function normalizeEvidenceText(value: string): string {
  return value.normalize('NFKC').replace(/\s+/g, ' ').trim();
}

export function validateSourceUrl(rawUrl: string): URL {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new AppError('Source URL is invalid', 'INVALID_SOURCE_URL', 400);
  }

  const hostname = parsedUrl.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  const isLocalHostname =
    hostname === 'localhost' ||
    LOCAL_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix)) ||
    hostname.endsWith('.invalid');

  if (
    (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') ||
    parsedUrl.username !== '' ||
    parsedUrl.password !== '' ||
    isIP(hostname) !== 0 ||
    isLocalHostname
  ) {
    throw new AppError('Source URL host or scheme is not allowed', 'INVALID_SOURCE_URL', 400);
  }

  parsedUrl.hash = '';
  return parsedUrl;
}

export function validateSessionDraft(
  draft: unknown,
  sourceManifest: PersonalLearningSource[],
  dailyMinutes: number
): LearningSessionDraft {
  if (sourceManifest.length === 0)
    throw new AppError('No verifiable learning sources found', 'NO_VERIFIABLE_SOURCE', 422);

  const parsedDraft = LearningSessionDraftSchema.safeParse(draft);
  if (!parsedDraft.success) throw new AppError('Generated learning session is invalid', 'INVALID_SESSION_DRAFT', 502);

  const sourcesByUrl = new Map(sourceManifest.map((source) => [validateSourceUrl(source.url).href, source]));
  const claimIds = new Set([
    ...parsedDraft.data.objectives.map((_, index) => `objective-${index + 1}`),
    ...parsedDraft.data.activities.map((_, index) => `activity-${index + 1}`)
  ]);

  const citations = parsedDraft.data.citations.map((citation) => {
    const source = sourcesByUrl.get(validateSourceUrl(citation.url).href);
    if (!source) {
      throw new AppError('Session citation is not in the verified source manifest', 'UNKNOWN_CITATION', 502);
    }

    for (const evidence of citation.evidence) {
      if (!claimIds.has(evidence.claimId)) {
        throw new AppError('Citation evidence references an unknown learning claim', 'INVALID_CITATION_CLAIM', 502);
      }

      if (!source.content || !normalizeEvidenceText(source.content).includes(normalizeEvidenceText(evidence.quote))) {
        throw new AppError(
          'Citation evidence is not present in its verified source',
          'UNVERIFIED_CITATION_EVIDENCE',
          502
        );
      }
    }

    return { ...citation, title: source.title };
  });

  const citedClaimIds = new Set(citations.flatMap(({ evidence }) => evidence.map(({ claimId }) => claimId)));
  if ([...claimIds].some((claimId) => !citedClaimIds.has(claimId))) {
    throw new AppError('A learning claim is missing verified citation evidence', 'MISSING_CITATION_EVIDENCE', 502);
  }

  const estimatedMinutes = parsedDraft.data.activities.reduce(
    (total, activity) => total + activity.estimatedMinutes,
    0
  );
  if (estimatedMinutes > dailyMinutes) {
    throw new AppError('Session activities exceed the selected daily study time', 'DAILY_BUDGET_EXCEEDED', 502);
  }

  return { ...parsedDraft.data, citations };
}
