import { generateText, Output } from 'ai';

import {
  createModel,
  getModelName,
  getProviderConfigForProvider,
  pickAnyConfiguredProvider
} from '@cio/ai-assistant/providers';
import { AIProvider } from '@cio/ai-assistant';
import { AGENT_MODELS, DEFAULT_PICKER_MODEL_ID } from '@cio/utils/agent-models';
import { STARTER_SLOT_TIMEOUT_MS, type TStarterCourseSlot } from '@cio/utils/constants/onboarding';
import { ZStarterBlueprint, type TStarterBlueprint } from '@cio/utils/validation';

import { sanitizeHtml } from '../../utils/sanitize-html';
import { buildStarterSlotPrompt, buildStarterSystemPrompt, type StarterPromptInput } from './starter-prompt';

const PROVIDER_BY_NAME: Record<string, AIProvider> = {
  google: AIProvider.GOOGLE,
  openai: AIProvider.OPENAI,
  anthropic: AIProvider.ANTHROPIC,
  moonshot: AIProvider.MOONSHOT
};

function resolveModel() {
  const preferred = AGENT_MODELS[DEFAULT_PICKER_MODEL_ID];
  const preferredProvider = PROVIDER_BY_NAME[preferred.provider];
  const preferredConfig = preferredProvider ? getProviderConfigForProvider(preferredProvider) : null;

  if (preferredConfig) {
    return {
      modelId: preferred.backendModelId,
      model: createModel({ ...preferredConfig, model: preferred.backendModelId })
    };
  }

  const fallback = pickAnyConfiguredProvider();
  if (!fallback) return null;

  return { modelId: getModelName(fallback), model: createModel(fallback) };
}

/**
 * Generates one starter course's content. Returns null when no model is configured. Throws when the model fails
 * or keeps returning content that does not match the schema, so the caller can fall back to sample content.
 */
export async function generateStarterBlueprint(params: {
  slot: TStarterCourseSlot;
  input: StarterPromptInput;
  websiteMarkdown?: string;
  signal: AbortSignal;
}): Promise<{ blueprint: TStarterBlueprint; modelId: string; promptTokens: number; completionTokens: number } | null> {
  const resolved = resolveModel();
  if (!resolved) return null;

  const { output, usage } = await generateText({
    model: resolved.model,
    output: Output.object({ schema: ZStarterBlueprint }),
    system: buildStarterSystemPrompt(params.input.locale),
    prompt: buildStarterSlotPrompt({
      slot: params.slot,
      input: params.input,
      websiteMarkdown: params.websiteMarkdown
    }),
    abortSignal: AbortSignal.any([params.signal, AbortSignal.timeout(STARTER_SLOT_TIMEOUT_MS)]),
    maxRetries: 1
  });

  const blueprint: TStarterBlueprint = {
    description: output.description,
    sections: output.sections.map((section) => ({
      title: section.title,
      lessons: section.lessons.map((lesson) => ({
        title: lesson.title,
        bodyHtml: sanitizeHtml(lesson.bodyHtml)
      }))
    }))
  };

  return {
    blueprint,
    modelId: resolved.modelId,
    promptTokens: usage?.inputTokens ?? 0,
    completionTokens: usage?.outputTokens ?? 0
  };
}
