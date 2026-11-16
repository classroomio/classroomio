export type PluginQuestionGradingStrategy = 'manual' | 'declarative-match' | 'none' | (string & {});

export interface PluginQuestionGradingConfig {
  strategy: PluginQuestionGradingStrategy;
  expectedAnswer?: unknown;
  matchPattern?: string;
  tolerance?: number;
  hiddenTests?: Array<{ input: string; expected: string; [key: string]: unknown }>;
  timeoutMs?: number;
  [key: string]: unknown;
}

export interface PluginQuestionSettingsEnvelope {
  pluginId: string;
  installationId: string;
  pluginVersion: string;
  artifactDigest: string;
  contributionId: string;
  configVersion: number;
  publicConfig: Record<string, unknown>;
  gradingConfig?: PluginQuestionGradingConfig;
}

export type QuestionPluginLifecycleState = 'active' | 'disabled' | 'uninstalled' | 'revoked' | 'unavailable';

export type QuestionPluginMode = 'edit' | 'take' | 'preview' | 'review' | 'submission';

export function isPluginQuestionSettings(
  settings: unknown
): settings is { pluginQuestion: PluginQuestionSettingsEnvelope } {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return false;
  }

  const raw = (settings as Record<string, unknown>).pluginQuestion;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return false;
  }

  const envelope = raw as Record<string, unknown>;
  return (
    typeof envelope.pluginId === 'string' &&
    typeof envelope.installationId === 'string' &&
    typeof envelope.pluginVersion === 'string' &&
    typeof envelope.artifactDigest === 'string' &&
    typeof envelope.contributionId === 'string' &&
    typeof envelope.configVersion === 'number' &&
    typeof envelope.publicConfig === 'object' &&
    envelope.publicConfig !== null &&
    !Array.isArray(envelope.publicConfig)
  );
}

/**
 * Returns a copy of question settings with server-only grading configuration stripped for learners.
 */
export function sanitizePluginQuestionForLearner(
  settings: Record<string, unknown> | null | undefined
): Record<string, unknown> | undefined {
  if (!settings) return undefined;

  const rawPluginQuestion = settings.pluginQuestion;
  if (!rawPluginQuestion || typeof rawPluginQuestion !== 'object' || Array.isArray(rawPluginQuestion)) {
    return { ...settings };
  }

  const envelope = rawPluginQuestion as Record<string, unknown>;
  const { gradingConfig: _discarded, ...safeEnvelope } = envelope;

  return {
    ...settings,
    pluginQuestion: safeEnvelope
  };
}
