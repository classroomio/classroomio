import { getLessonBlockScope } from '@cio/db/queries/block';
import { pickAnyConfiguredProvider } from '@cio/ai-assistant/providers';
import { enforceTokenBalance, recordTokenUsage } from '@cio/core/services/agent/usage';
import { createHtmlPage, deriveHtmlPageName, readHtmlPage } from '@cio/core/services/block/html-page';
import type { THtmlPage, THtmlPageCreate, THtmlPageGenerate } from '@cio/utils/validation/block';

import { generateHtmlDocument } from '@api/services/agent/html-generation';
import { AppError, ErrorCodes } from '@api/utils/errors';

async function requireLessonOrganization(lessonId: string): Promise<string> {
  const scope = await getLessonBlockScope(lessonId);
  if (!scope) {
    throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
  }

  return scope.organizationId;
}

/**
 * Stores an uploaded or pasted HTML page for a lesson's organization.
 */
export async function createLessonHtmlPage(
  lessonId: string,
  profileId: string,
  input: THtmlPageCreate
): Promise<THtmlPage> {
  const organizationId = await requireLessonOrganization(lessonId);

  return createHtmlPage({ organizationId, profileId, name: input.name, html: input.html });
}

/**
 * Generates an HTML page with AI, or rewrites the page `input.assetId` points at, and stores the result as a
 * new page. Charges the lesson's organization for the tokens used.
 */
export async function generateLessonHtmlPage(
  courseId: string,
  lessonId: string,
  profileId: string,
  input: THtmlPageGenerate
): Promise<THtmlPage> {
  const organizationId = await requireLessonOrganization(lessonId);
  const providerConfig = pickAnyConfiguredProvider();
  if (!providerConfig) {
    throw new AppError('AI assistant is not configured', 'AI_NOT_CONFIGURED', 503);
  }

  const currentHtml = input.assetId ? await readHtmlPage(input.assetId, organizationId) : undefined;
  if (currentHtml === null) {
    throw new AppError('HTML page not found', ErrorCodes.HTML_PAGE_NOT_FOUND, 404);
  }

  await enforceTokenBalance(organizationId);

  const result = await generateHtmlDocument(lessonId, input.prompt, currentHtml, providerConfig);
  await recordTokenUsage(organizationId, profileId, courseId, result.usage, result.modelName);

  const name = deriveHtmlPageName(result.html, 'ai-page.html');

  return createHtmlPage({ organizationId, profileId, name, html: result.html });
}
