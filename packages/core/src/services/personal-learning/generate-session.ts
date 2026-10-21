import { generateObject } from 'ai';
import { createModel, pickAnyConfiguredProvider } from '@cio/ai-assistant/providers';
import {
  claimPersonalLearningSession,
  completePersonalLearningSession,
  getPersonalLearningSessionContext,
  markPersonalLearningSessionFailed
} from '@cio/db/queries/personal-learning';
import { AppError } from '@cio/utils/errors';

import { discoverLearningSources } from './source-discovery';
import { LearningSessionDraftSchema, validateSessionDraft } from './source-validation';

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!
  );
}

function buildLessonHtml(draft: ReturnType<typeof validateSessionDraft>): string {
  const objectives = draft.objectives.map((objective) => `<li>${escapeHtml(objective)}</li>`).join('');
  const activities = draft.activities
    .map(
      (activity) =>
        `<h3>${escapeHtml(activity.type)} (${activity.estimatedMinutes} min)</h3><p>${escapeHtml(activity.content)}</p>`
    )
    .join('');
  const questions = draft.checkQuestions.map((question) => `<li>${escapeHtml(question)}</li>`).join('');
  const citations = draft.citations
    .map((citation) => `<li><a href="${escapeHtml(citation.url)}">${escapeHtml(citation.title)}</a></li>`)
    .join('');

  return `<h2>Learning objectives</h2><ul>${objectives}</ul><h2>Activities</h2>${activities}<h2>Check your understanding</h2><ul>${questions}</ul><h2>Verified sources</h2><ul>${citations}</ul>`;
}

function errorCode(error: unknown): string {
  return error && typeof error === 'object' && 'code' in error
    ? String(error.code)
    : 'PERSONAL_LEARNING_GENERATION_FAILED';
}

export async function generatePersonalLearningSession(input: { sessionId: string; attempt: number }) {
  const context = await getPersonalLearningSessionContext(input.sessionId);
  if (!context) throw new AppError('Learning session not found', 'LEARNING_NOT_FOUND', 404);
  if (context.session.status === 'ready') return { status: 'ready' as const, lessonId: context.session.lessonId };
  if (context.session.status !== 'queued') return { status: context.session.status };

  const claimedSession = await claimPersonalLearningSession(input.sessionId);
  if (!claimedSession) return { status: 'pending' as const };

  try {
    const sources = await discoverLearningSources({
      ownerUserId: context.journey.ownerUserId,
      query: context.journey.goal,
      language: context.journey.language
    });
    const providerConfig = pickAnyConfiguredProvider();
    if (!providerConfig) throw new AppError('AI assistant is not configured', 'AI_NOT_CONFIGURED', 503);

    const generated = await generateObject({
      model: createModel(providerConfig),
      schema: LearningSessionDraftSchema,
      system: [
        'Create exactly one practical learning session for the learner goal.',
        `Fit all activities within ${context.journey.dailyMinutes} minutes.`,
        'Use only the verified sources provided and cite every factual learning claim.',
        'Do not outline or generate later sessions. Each citation URL must match a provided source exactly.'
      ].join(' '),
      prompt: JSON.stringify({
        goal: context.journey.goal,
        language: context.journey.language,
        studyDays: context.journey.targetStudyDays,
        dailyMinutes: context.journey.dailyMinutes,
        courseTitle: context.courseTitle,
        verifiedSources: sources.map(({ url, title, content }) => ({ url, title, content }))
      }),
      maxRetries: 0
    });
    const draft = validateSessionDraft(generated.object, sources, context.journey.dailyMinutes);
    const completed = await completePersonalLearningSession({
      sessionId: input.sessionId,
      title: draft.title,
      content: buildLessonHtml(draft),
      sourceManifest: sources,
      generationMeta: { generatedAt: new Date().toISOString() }
    });
    if (!completed)
      throw new AppError('Learning session changed while generating', 'LEARNING_SESSION_NOT_CLAIMED', 409);

    return { status: 'ready' as const, lessonId: completed.lessonId };
  } catch (error) {
    await markPersonalLearningSessionFailed(input.sessionId, errorCode(error), input.attempt >= 3);
    throw error;
  }
}
