import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import type {
  BetaContentBlockParam,
  BetaMessage,
  BetaTextCitation
} from '@anthropic-ai/sdk/resources/beta/messages/messages';
import type * as z from 'zod/v4';

import { MODELS_WITH_SERVER_FALLBACK, resolveRoleModels, type CourseBuilderRole, type RoleModel } from './models';
import { UsageLedger, type TokenUsage } from './usage';

const SERVER_FALLBACK_BETA = 'server-side-fallback-2026-07-01';
const DEFAULT_MAX_TOKENS = 32_000;

export class ClaudeRefusalError extends Error {
  constructor(
    readonly role: CourseBuilderRole,
    readonly category: string | null
  ) {
    super(`Claude declined the ${role} request${category ? ` (${category})` : ''}`);
  }
}

export class ClaudeTruncatedError extends Error {
  constructor(readonly role: CourseBuilderRole) {
    super(`Claude's ${role} response hit max_tokens before finishing`);
  }
}

export class BudgetExceededError extends Error {
  constructor(
    readonly role: CourseBuilderRole,
    readonly limitUsd: number
  ) {
    super(`The build's budget of $${limitUsd} is spent; the ${role} request was not sent`);
  }
}

export interface ClaudeBudget {
  limitUsd: number;
  /** Spent by earlier stages of the same build, with other clients. */
  spentUsd?: number;
}

export interface ClaudeClientOptions {
  apiKey: string;
  roleModels?: Partial<Record<CourseBuilderRole, Partial<RoleModel>>>;
  ledger?: UsageLedger;
  maxRetries?: number;
  /** No request is sent once the build has spent this much; requests already running finish. */
  budget?: ClaudeBudget;
}

export interface ClaudeRequest {
  role: CourseBuilderRole;
  /** Stable instructions. Cached, so keep anything that varies per request out of it. */
  system: string;
  /** Request content. A block marked with `cache_control` ends a shared, cached prefix. */
  content: BetaContentBlockParam[];
  maxTokens?: number;
  signal?: AbortSignal;
  /** Called once, when the response starts: the request's cached prefix exists from then on. */
  onFirstToken?: () => void;
}

export interface CitedTextPart {
  text: string;
  citations: BetaTextCitation[];
}

function readUsage(message: BetaMessage): TokenUsage {
  const usage = message.usage;

  return {
    inputTokens: usage.input_tokens,
    cacheWrite5mTokens: usage.cache_creation?.ephemeral_5m_input_tokens ?? usage.cache_creation_input_tokens ?? 0,
    cacheWrite1hTokens: usage.cache_creation?.ephemeral_1h_input_tokens ?? 0,
    cacheReadTokens: usage.cache_read_input_tokens ?? 0,
    outputTokens: usage.output_tokens
  };
}

/**
 * Thin wrapper over the Anthropic SDK for the course builder. Picks the model and effort per pipeline role, caches the
 * system prompt, turns on Anthropic's refusal fallback where the model supports it, streams every request (outputs
 * can be long), and records each call's usage and cost in the ledger.
 */
export class ClaudeClient {
  readonly ledger: UsageLedger;
  private readonly client: Anthropic;
  private readonly roleModels: Record<CourseBuilderRole, RoleModel>;
  private readonly budget: ClaudeBudget | null;

  constructor(options: ClaudeClientOptions) {
    this.client = new Anthropic({ apiKey: options.apiKey, maxRetries: options.maxRetries ?? 8 });
    this.roleModels = resolveRoleModels(options.roleModels);
    this.ledger = options.ledger ?? new UsageLedger();
    this.budget = options.budget ?? null;
  }

  /** What the build has spent: earlier stages plus this client's requests. */
  get spentUsd(): number {
    return (this.budget?.spentUsd ?? 0) + this.ledger.totalCostUsd;
  }

  modelFor(role: CourseBuilderRole): RoleModel {
    return this.roleModels[role];
  }

  /** Returns output that matches `schema`. Throws on refusal, truncation or an invalid response. */
  async structured<Schema extends z.ZodType>(request: ClaudeRequest & { schema: Schema }): Promise<z.infer<Schema>> {
    const message = await this.run(request, betaZodOutputFormat(request.schema));
    const parsed = (message as BetaMessage & { parsed_output?: z.infer<Schema> | null }).parsed_output;
    if (parsed === null || parsed === undefined) {
      throw new Error(`Claude's ${request.role} response did not match the schema`);
    }

    return parsed;
  }

  /**
   * Returns prose split into parts, each with the citations Claude attached. Use with `search_result` blocks that
   * have citations enabled. Citations can't be combined with structured output.
   */
  async cited(request: ClaudeRequest): Promise<CitedTextPart[]> {
    const message = await this.run(request);
    const parts: CitedTextPart[] = [];

    for (const block of message.content) {
      if (block.type !== 'text') continue;

      parts.push({ text: block.text, citations: block.citations ?? [] });
    }

    return parts;
  }

  private async run(request: ClaudeRequest, format?: ReturnType<typeof betaZodOutputFormat>): Promise<BetaMessage> {
    if (this.budget && this.spentUsd >= this.budget.limitUsd)
      throw new BudgetExceededError(request.role, this.budget.limitUsd);

    const { model, effort } = this.roleModels[request.role];
    const useServerFallback = MODELS_WITH_SERVER_FALLBACK.has(model);
    const outputConfig = format ? { effort, format } : { effort };
    const startedAt = Date.now();

    const stream = this.client.beta.messages.stream(
      {
        model,
        max_tokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
        system: [{ type: 'text', text: request.system, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: request.content }],
        output_config: outputConfig,
        ...(useServerFallback ? { betas: [SERVER_FALLBACK_BETA], fallbacks: 'default' as const } : {})
      },
      { signal: request.signal }
    );
    if (request.onFirstToken) {
      let started = false;
      stream.on('streamEvent', (event) => {
        if (started || event.type !== 'content_block_delta') return;

        started = true;
        request.onFirstToken?.();
      });
    }
    const message = await stream.finalMessage();

    this.ledger.add(request.role, model, readUsage(message), Date.now() - startedAt);

    if (message.stop_reason === 'refusal') {
      const details = (message as BetaMessage & { stop_details?: { category?: string | null } | null }).stop_details;
      throw new ClaudeRefusalError(request.role, details?.category ?? null);
    }

    if (message.stop_reason === 'max_tokens') throw new ClaudeTruncatedError(request.role);

    return message;
  }
}
