export type CourseBuilderRole = 'card' | 'planner' | 'writer' | 'checker' | 'repair' | 'reviewer';

export type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export interface RoleModel {
  model: string;
  effort: Effort;
}

/** Which Claude model and effort level each pipeline step uses. Hosts may override any role. */
export const DEFAULT_ROLE_MODELS: Record<CourseBuilderRole, RoleModel> = {
  card: { model: 'claude-haiku-5-5', effort: 'low' },
  planner: { model: 'claude-opus-5-5', effort: 'high' },
  writer: { model: 'claude-sonnet-5-5', effort: 'high' },
  checker: { model: 'claude-haiku-5-5', effort: 'high' },
  repair: { model: 'claude-sonnet-5-5', effort: 'high' },
  reviewer: { model: 'claude-opus-5-5', effort: 'medium' }
};

/** USD per million tokens. */
export interface TokenPrices {
  input: number;
  cacheWrite5m: number;
  cacheWrite1h: number;
  cacheRead: number;
  output: number;
}

export interface ModelPricing {
  standard: TokenPrices;
  /** Prices for every token of a request whose prompt is longer than `threshold` tokens. */
  longPrompt?: { threshold: number; prices: TokenPrices };
}

/** Anthropic list prices, checked on 18 November 2026 (platform.claude.com/docs/en/about-claude/pricing). */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  'claude-opus-5-5': {
    standard: { input: 4, cacheWrite5m: 5, cacheWrite1h: 8, cacheRead: 0.2, output: 20 }
  },
  'claude-sonnet-5-5': {
    standard: { input: 2, cacheWrite5m: 2.5, cacheWrite1h: 4, cacheRead: 0.1, output: 10 }
  },
  'claude-haiku-5-5': {
    standard: { input: 0.1, cacheWrite5m: 0.125, cacheWrite1h: 0.2, cacheRead: 0.01, output: 0.5 },
    longPrompt: {
      threshold: 100_000,
      prices: { input: 0.5, cacheWrite5m: 0.625, cacheWrite1h: 1, cacheRead: 0.05, output: 2.5 }
    }
  }
};

/** Models that accept Anthropic's server-side refusal fallback (`fallbacks: "default"`). */
export const MODELS_WITH_SERVER_FALLBACK = new Set(['claude-opus-5-5', 'claude-sonnet-5-5']);

export function resolveRoleModels(overrides: Partial<Record<CourseBuilderRole, Partial<RoleModel>>> = {}) {
  const resolved = { ...DEFAULT_ROLE_MODELS };

  for (const [role, override] of Object.entries(overrides) as Array<[CourseBuilderRole, Partial<RoleModel>]>) {
    resolved[role] = { ...DEFAULT_ROLE_MODELS[role], ...override };
  }

  return resolved;
}
