import { MODEL_PRICING, type CourseBuilderRole } from './models';

export interface TokenUsage {
  inputTokens: number;
  cacheWrite5mTokens: number;
  cacheWrite1hTokens: number;
  cacheReadTokens: number;
  outputTokens: number;
}

export interface UsageEntry extends TokenUsage {
  role: CourseBuilderRole;
  model: string;
  costUsd: number;
  durationMs: number;
  /** When the response finished, in epoch milliseconds. */
  endedAt: number;
}

const MILLION = 1_000_000;

/**
 * Cost of one request in USD. Returns 0 for a model without a known price, so an unpriced model shows up as free in
 * reports rather than failing the build.
 */
export function costOfUsage(model: string, usage: TokenUsage): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;

  const promptTokens = usage.inputTokens + usage.cacheWrite5mTokens + usage.cacheWrite1hTokens + usage.cacheReadTokens;
  const isLongPrompt = pricing.longPrompt !== undefined && promptTokens > pricing.longPrompt.threshold;
  const prices = isLongPrompt && pricing.longPrompt ? pricing.longPrompt.prices : pricing.standard;

  const cost =
    usage.inputTokens * prices.input +
    usage.cacheWrite5mTokens * prices.cacheWrite5m +
    usage.cacheWrite1hTokens * prices.cacheWrite1h +
    usage.cacheReadTokens * prices.cacheRead +
    usage.outputTokens * prices.output;

  return cost / MILLION;
}

/** Collects every model call of one build, for cost reports and budget checks. */
export class UsageLedger {
  readonly entries: UsageEntry[] = [];

  add(role: CourseBuilderRole, model: string, usage: TokenUsage, durationMs: number): UsageEntry {
    const costUsd = costOfUsage(model, usage);
    const entry: UsageEntry = { role, model, ...usage, costUsd, durationMs, endedAt: Date.now() };
    this.entries.push(entry);

    return entry;
  }

  get totalCostUsd(): number {
    return this.entries.reduce((total, entry) => total + entry.costUsd, 0);
  }

  byRole(): Record<string, { calls: number; costUsd: number; inputTokens: number; outputTokens: number }> {
    const summary: Record<string, { calls: number; costUsd: number; inputTokens: number; outputTokens: number }> = {};

    for (const entry of this.entries) {
      const row = (summary[entry.role] ??= { calls: 0, costUsd: 0, inputTokens: 0, outputTokens: 0 });
      row.calls += 1;
      row.costUsd += entry.costUsd;
      row.inputTokens +=
        entry.inputTokens + entry.cacheWrite5mTokens + entry.cacheWrite1hTokens + entry.cacheReadTokens;
      row.outputTokens += entry.outputTokens;
    }

    return summary;
  }
}
