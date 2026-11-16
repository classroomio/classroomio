import { generateText } from 'ai';
import { AIProvider, createModel } from '@cio/ai-assistant';
import { pickAnyConfiguredProvider } from '@cio/ai-assistant/providers';
import { enforceTokenBalance, recordTokenUsage } from '@cio/core/services/agent/usage';
import { listOrganizationSkills } from '@cio/db/queries/skill';
import type { TSuggestSkills } from '@cio/utils/validation/skill';
import { AppError } from '@api/utils/errors';

const SUGGEST_MODELS: Record<AIProvider, string> = {
  [AIProvider.OPENAI]: 'gpt-4o-mini',
  [AIProvider.ANTHROPIC]: 'claude-haiku-4-5-20251001',
  [AIProvider.GOOGLE]: 'gemini-3.1-flash-lite',
  [AIProvider.MOONSHOT]: 'kimi-k2.6'
};

const SKILL_USAGE_PREFIX = 'skill-suggest:';
const MAX_CATALOGUE_SKILLS = 400;

const SYSTEM_PROMPT = [
  'You tag a math question with the skills it practises.',
  'You get a catalogue of skills as lines of "code | name" and one question.',
  'Reply with a JSON array of objects {"code": string, "reason": string} using only codes from the catalogue, best match first.',
  'Prefer the most specific skill. Return an empty array when nothing fits. Reply with the JSON only.'
].join(' ');

export type SkillSuggestion = { skillId: string; code: string; name: string; reason: string };

export type GenerateSkillText = (input: { system: string; prompt: string }) => Promise<string>;

/** Pulls the first JSON array out of a model reply, tolerating code fences and surrounding words. */
export function parseSuggestedCodes(text: string): Array<{ code: string; reason: string }> {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];

  try {
    const parsed: unknown = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((item) => {
      if (typeof item === 'string') return [{ code: item, reason: '' }];
      if (typeof item !== 'object' || item === null || typeof (item as { code?: unknown }).code !== 'string') return [];

      const reason = (item as { reason?: unknown }).reason;

      return [{ code: (item as { code: string }).code, reason: typeof reason === 'string' ? reason : '' }];
    });
  } catch {
    return [];
  }
}

/**
 * Suggests skills from the organisation's catalogue for one question. The model sees only the question text and
 * the catalogue; codes it invents are dropped, so every suggestion is an existing skill the teacher can accept.
 */
export async function suggestSkillsForQuestion(
  orgId: string,
  input: TSuggestSkills,
  generate: GenerateSkillText
): Promise<SkillSuggestion[]> {
  const catalogue = (await listOrganizationSkills(orgId)).slice(0, MAX_CATALOGUE_SKILLS);
  if (catalogue.length === 0) return [];

  const questionText = [
    `Question: ${input.title}`,
    input.description ? `Details: ${input.description}` : null,
    input.options?.length ? `Options: ${input.options.join(' | ')}` : null
  ]
    .filter(Boolean)
    .join('\n');
  const catalogueText = catalogue.map((skill) => `${skill.code} | ${skill.name}`).join('\n');
  const reply = await generate({ system: SYSTEM_PROMPT, prompt: `Catalogue:\n${catalogueText}\n\n${questionText}` });

  const byCode = new Map(catalogue.map((skill) => [skill.code.toLowerCase(), skill]));
  const seen = new Set<string>();
  const suggestions: SkillSuggestion[] = [];

  for (const item of parseSuggestedCodes(reply)) {
    const skill = byCode.get(item.code.trim().toLowerCase());
    if (!skill || seen.has(skill.id)) continue;

    seen.add(skill.id);
    suggestions.push({ skillId: skill.id, code: skill.code, name: skill.name, reason: item.reason });
  }

  return suggestions.slice(0, input.limit);
}

/** The production model call: the first configured provider, with the org's token balance enforced and usage recorded. */
export async function suggestSkillsWithModel(
  orgId: string,
  userId: string,
  courseId: string,
  input: TSuggestSkills
): Promise<SkillSuggestion[]> {
  const providerConfig = pickAnyConfiguredProvider();
  if (!providerConfig) throw new AppError('AI assistant is not configured', 'AI_NOT_CONFIGURED', 503);

  await enforceTokenBalance(orgId);

  const modelName = SUGGEST_MODELS[providerConfig.provider];
  const model = createModel({ ...providerConfig, model: modelName });
  const googleOptions =
    providerConfig.provider === AIProvider.GOOGLE ? { google: { thinkingConfig: { thinkingBudget: 0 } } } : undefined;

  return suggestSkillsForQuestion(orgId, input, async ({ system, prompt }) => {
    const { text, usage } = await generateText({
      model,
      system,
      prompt,
      maxOutputTokens: 400,
      maxRetries: 0,
      providerOptions: googleOptions
    });
    const promptTokens = usage.inputTokens ?? 0;
    const completionTokens = usage.outputTokens ?? 0;
    await recordTokenUsage(
      orgId,
      userId,
      courseId,
      { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens },
      SKILL_USAGE_PREFIX + modelName
    );

    return text;
  });
}
