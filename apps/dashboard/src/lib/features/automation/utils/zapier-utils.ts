import { env } from '$env/dynamic/public';
import { canOAuthScopesChangeData } from '@cio/utils/constants/oauth-scopes';
import type { TWebhookEventType } from '@cio/utils/constants/webhook';
import {
  ZAPIER_ACTIONS,
  ZAPIER_APP_CATEGORIES,
  ZAPIER_FEATURED_RECIPE_IDS,
  ZAPIER_PARTNER_APPS,
  ZAPIER_TRIGGERS,
  type TZapierAppCategory,
  type TZapierPartnerApp,
  type TZapierRecipe,
  type TZapierTriggerKey
} from '@cio/utils/constants/zapier';
import { buildWebhookExampleEnvelope } from '@cio/utils/validation/webhook';

import type {
  ZapierAccess,
  ZapierConnection,
  ZapierDirectoryCategory,
  ZapierDirectoryCounts,
  ZapierDirectoryFilters,
  ZapierDirectoryQuick,
  ZapierDirectorySort,
  ZapierDirectoryState,
  ZapierZapStep
} from './types';

export const ZAPIER_URLS = {
  editor: 'https://zapier.com/app/editor',
  connections: 'https://zapier.com/app/assets/connections'
} as const;

export const ZAPIER_DIRECTORY_PAGE_SIZE = 18;

const ZAPIER_WEBINTENT_CREATE_URL = 'https://zapier.com/webintent/create-zap';
const ZAPIER_EMBED_CREATE_URL = 'https://api.zapier.com/v1/embed';
const ZAPIER_INVITE_STORAGE_PREFIX = 'cio:zapier-invite-opened:';

export function isZapierLive(): boolean {
  return env.PUBLIC_ZAPIER_LISTING === 'public';
}

function getZapierCreateBaseUrl(): string | null {
  if (!isZapierLive()) return ZAPIER_WEBINTENT_CREATE_URL;

  const appSlug = env.PUBLIC_ZAPIER_APP_SLUG;

  return appSlug ? `${ZAPIER_EMBED_CREATE_URL}/${encodeURIComponent(appSlug)}/create` : null;
}

function getZapierStepAppKey(step: ZapierZapStep, app?: TZapierPartnerApp): string | null {
  if (step.app === 'classroomio') return env.PUBLIC_ZAPIER_APP_KEY || null;

  return app?.zapierKey ?? null;
}

export function buildZapierZapUrl(steps: readonly ZapierZapStep[], app?: TZapierPartnerApp): string {
  if (steps.length === 0) return ZAPIER_URLS.editor;

  const baseUrl = getZapierCreateBaseUrl();
  if (!baseUrl) return ZAPIER_URLS.editor;

  const url = new URL(baseUrl);

  for (const [index, step] of steps.entries()) {
    const stepAppKey = getZapierStepAppKey(step, app);
    if (!stepAppKey) return ZAPIER_URLS.editor;

    url.searchParams.set(`steps[${index}][app]`, `${stepAppKey}@latest`);
    if (step.key) url.searchParams.set(`steps[${index}][action]`, step.key);
    url.searchParams.set(`steps[${index}][type]`, step.type);
  }

  return url.toString();
}

export type ZapierRecipeDirection = 'out' | 'in';

export type ZapierRecipePrefill = {
  field: 'courseId' | 'cohortId';
  value: string;
  label: string;
};

export function getZapierPrimaryRecipe(app: TZapierPartnerApp): TZapierRecipe | null {
  return app.recipes[0] ?? null;
}

export function getRecipeDirection(recipe: TZapierRecipe): ZapierRecipeDirection {
  return recipe.trigger.app === 'classroomio' ? 'out' : 'in';
}

export function getRecipeMode(recipe: TZapierRecipe): 'instant' | 'polling' {
  if (recipe.trigger.app === 'classroomio' || recipe.trigger.type !== 'read') return 'instant';

  return recipe.trigger.isInstant ? 'instant' : 'polling';
}

export function getRecipeClassroomioStep(recipe: TZapierRecipe) {
  if (recipe.trigger.app === 'classroomio') return recipe.trigger;

  return recipe.action.app === 'classroomio' ? recipe.action : null;
}

/** Zapier dropdown field the recipe's ClassroomIO step accepts, if any. */
export function getRecipePrefillField(recipe: TZapierRecipe): 'courseId' | 'cohortId' | null {
  const step = getRecipeClassroomioStep(recipe);
  if (!step) return null;

  if (step.type === 'read') {
    return ZAPIER_TRIGGERS.find((trigger) => trigger.key === step.key)?.prefill ?? null;
  }

  return ZAPIER_ACTIONS.find((action) => action.key === step.key)?.prefill ?? null;
}

export function buildZapierRecipeUrl(
  app: TZapierPartnerApp,
  recipe: TZapierRecipe,
  prefill?: ZapierRecipePrefill | null
): string {
  const steps: ZapierZapStep[] = [recipe.trigger, recipe.action];
  const url = buildZapierZapUrl(steps, app);

  if (!prefill || url === ZAPIER_URLS.editor) return url;

  const stepIndex = steps.findIndex((step) => step.app === 'classroomio');
  if (stepIndex === -1) return url;

  const parsed = new URL(url);
  parsed.searchParams.set(`steps[${stepIndex}][params][${prefill.field}]`, prefill.value);
  parsed.searchParams.set(`steps[${stepIndex}][meta][parammap][${prefill.field}]`, prefill.label);

  return parsed.toString();
}

/** Primary first, then instant before polling, then catalog order. */
export function sortRecipes(recipes: readonly TZapierRecipe[], primaryId?: string): TZapierRecipe[] {
  return [...recipes].sort((first, second) => {
    if (first.id === primaryId) return -1;
    if (second.id === primaryId) return 1;

    const firstInstant = getRecipeMode(first) === 'instant' ? 1 : 0;
    const secondInstant = getRecipeMode(second) === 'instant' ? 1 : 0;

    return secondInstant - firstInstant;
  });
}

export function getPartnerSteps(app: TZapierPartnerApp, type: 'read' | 'write'): { key: string; isInstant: boolean }[] {
  const steps: { key: string; isInstant: boolean }[] = [];

  for (const recipe of app.recipes) {
    for (const step of [recipe.trigger, recipe.action]) {
      if (step.app !== 'partner' || step.type !== type) continue;
      if (steps.some((existing) => existing.key === step.key)) continue;

      steps.push({ key: step.key, isInstant: step.type === 'read' ? step.isInstant : false });
    }
  }

  return steps;
}

/**
 * One-line recipe sentence built from step labels, for example
 * "When Invitee Created or Rescheduled in Calendly, Enroll Student in Course in ClassroomIO."
 */
export function describeRecipe(
  recipe: TZapierRecipe,
  app: TZapierPartnerApp,
  translate: (key: string, params?: Record<string, string | number>) => string
): string {
  if (recipe.trigger.app === 'classroomio') {
    const actionKey = recipe.action.app === 'partner' ? recipe.action.key : '';

    return translate('automation.zapier.recipes.sentence_out', {
      trigger: translate(`automation.zapier.catalog_triggers.${recipe.trigger.key}.label`),
      action: translate(`automation.zapier.partner_steps.${app.slug}.${actionKey}`),
      app: app.name
    });
  }

  const actionKey = recipe.action.app === 'classroomio' ? recipe.action.key : '';

  return translate('automation.zapier.recipes.sentence_in', {
    trigger: translate(`automation.zapier.partner_steps.${app.slug}.${recipe.trigger.key}`),
    action: translate(`automation.zapier.catalog_actions.${actionKey}.label`),
    app: app.name
  });
}

export function getZapierAccess(scopes: string[]): ZapierAccess {
  return canOAuthScopesChangeData(scopes) ? 'read_write' : 'read_only';
}

export function getZapierFeaturedRecipes(): { app: TZapierPartnerApp; recipe: TZapierRecipe }[] {
  const featured: { app: TZapierPartnerApp; recipe: TZapierRecipe }[] = [];

  for (const id of ZAPIER_FEATURED_RECIPE_IDS) {
    for (const app of ZAPIER_PARTNER_APPS) {
      const recipe = app.recipes.find((candidate) => candidate.id === id);
      if (!recipe) continue;

      featured.push({ app, recipe });
      break;
    }
  }

  return featured;
}

export function getZapierSimilarApps(app: TZapierPartnerApp, limit = 4): TZapierPartnerApp[] {
  const sameCategory = ZAPIER_PARTNER_APPS.filter(
    (other) => other.slug !== app.slug && other.category === app.category
  );
  const popular = ZAPIER_PARTNER_APPS.filter(
    (other) => other.slug !== app.slug && other.category !== app.category && other.isPopular
  );

  return [...sameCategory, ...popular].slice(0, limit);
}

function humanizeZapierFieldName(field: string): string {
  const acronyms = new Set(['id', 'url']);
  const words = field
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .split(' ')
    .filter(Boolean);

  return words
    .map((word) => (acronyms.has(word) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ');
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ID_FIELD_PATTERN = /(^id$|Id$|_id$)/;
const ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const SNAKE_CASE_PATTERN = /^[A-Za-z][A-Za-z0-9]*(?:_[A-Za-z0-9]+)+$/;
const LOWERCASE_WORD_PATTERN = /^[a-z][a-z0-9]{1,24}$/;

/** Internal identifiers are noise in a preview; people read titles, names, dates and statuses. */
function isInternalIdentifier(key: string, value: unknown): boolean {
  if (ID_FIELD_PATTERN.test(key)) return true;

  return typeof value === 'string' && UUID_PATTERN.test(value);
}

/** Renders ISO timestamps and enum-like values the way a person reads them, not as payload literals. */
function toReadableSampleValue(value: string): string {
  if (ISO_TIMESTAMP_PATTERN.test(value)) {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));
  }

  if (SNAKE_CASE_PATTERN.test(value)) {
    const sentence = value.toLowerCase().replace(/_/g, ' ');

    return sentence.charAt(0).toUpperCase() + sentence.slice(1);
  }

  if (LOWERCASE_WORD_PATTERN.test(value)) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  return value;
}

/**
 * Flattens example webhook data into label/value rows for the capability cards. Nested objects
 * contribute one readable value (`title`, `name` or `email`) instead of a JSON blob, and internal
 * identifiers are left out.
 */
export function flattenZapierSampleData(data: Record<string, unknown>, limit = 6): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  const readableKeys = ['title', 'name', 'email'];

  for (const [key, value] of Object.entries(data)) {
    if (rows.length >= limit) break;
    if (value === null || value === undefined) continue;
    if (isInternalIdentifier(key, value)) continue;

    if (typeof value === 'object') {
      const nested = value as Record<string, unknown>;
      const readableKey = readableKeys.find((candidate) => typeof nested[candidate] === 'string');
      if (!readableKey) continue;

      rows.push({
        label: `${humanizeZapierFieldName(key)} ${humanizeZapierFieldName(readableKey)}`,
        value: toReadableSampleValue(String(nested[readableKey]))
      });
      continue;
    }

    rows.push({
      label: humanizeZapierFieldName(key),
      value: typeof value === 'string' ? toReadableSampleValue(value) : String(value)
    });
  }

  return rows;
}

export function getZapierTriggerKey(eventType: string): TZapierTriggerKey | null {
  return ZAPIER_TRIGGERS.find((trigger) => trigger.eventType === eventType)?.key ?? null;
}

export function getZapierAppMonogram(app: Pick<TZapierPartnerApp, 'name' | 'monogram'>): string {
  return app.monogram ?? app.name.slice(0, 2);
}

/**
 * Black or white text for the monogram, chosen from the brand color's relative luminance so a light
 * background such as Mailchimp's yellow stays readable.
 */
export function getZapierMonogramTextColor(color: string): string {
  const match = /^#?([0-9a-f]{6})$/i.exec(color);
  if (!match) return '#ffffff';

  const value = Number.parseInt(match[1], 16);
  const channels = [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff].map((channel) => {
    const normalized = channel / 255;

    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];

  return luminance > 0.5 ? '#111827' : '#ffffff';
}

export function formatZapierDate(value: string | null): string | null {
  return value ? new Date(value).toLocaleDateString() : null;
}

export function getZapierInviteUrl(): string {
  return env.PUBLIC_ZAPIER_CONNECT_URL ?? '';
}

export function hasAcceptedZapierInvite(
  connections: readonly ZapierConnection[],
  profileId: string | null | undefined
): boolean {
  if (!profileId) return false;

  return connections.some((connection) => connection.authorizedBy.profileId === profileId);
}

export function hasOpenedZapierInvite(profileId: string | null | undefined): boolean {
  if (!profileId) return false;

  try {
    return globalThis.localStorage?.getItem(`${ZAPIER_INVITE_STORAGE_PREFIX}${profileId}`) === '1';
  } catch {
    return false;
  }
}

export function rememberZapierInviteOpened(profileId: string | null | undefined): void {
  if (!profileId) return;

  try {
    globalThis.localStorage?.setItem(`${ZAPIER_INVITE_STORAGE_PREFIX}${profileId}`, '1');
  } catch {
    // Browsers can block storage (private mode, site data restrictions); the invite flag is only a convenience.
  }
}

function parseZapierCategory(value: string | null): ZapierDirectoryCategory {
  return ZAPIER_APP_CATEGORIES.find((category) => category === value) ?? 'all';
}

function parseZapierQuick(value: string | null): ZapierDirectoryQuick {
  return value === 'popular' || value === 'recent' ? value : 'all';
}

function parseZapierSort(value: string | null): ZapierDirectorySort {
  return value === 'az' ? 'az' : 'popular';
}

function parseZapierShown(value: string | null): number {
  if (!value) return ZAPIER_DIRECTORY_PAGE_SIZE;

  const shown = Number(value);

  return Number.isInteger(shown) && shown >= ZAPIER_DIRECTORY_PAGE_SIZE ? shown : ZAPIER_DIRECTORY_PAGE_SIZE;
}

export function parseZapierDirectoryState(searchParams: URLSearchParams): ZapierDirectoryState {
  return {
    query: searchParams.get('q')?.trim() ?? '',
    category: parseZapierCategory(searchParams.get('category')),
    quick: parseZapierQuick(searchParams.get('quick')),
    sort: parseZapierSort(searchParams.get('sort')),
    shown: parseZapierShown(searchParams.get('shown'))
  };
}

export function toZapierDirectorySearch(state: ZapierDirectoryState): string {
  const searchParams = new URLSearchParams();
  const query = state.query.trim();

  if (query) searchParams.set('q', query);
  if (state.category !== 'all') searchParams.set('category', state.category);
  if (state.quick !== 'all') searchParams.set('quick', state.quick);
  if (state.sort !== 'popular') searchParams.set('sort', state.sort);
  if (state.shown !== ZAPIER_DIRECTORY_PAGE_SIZE) searchParams.set('shown', String(state.shown));

  return searchParams.toString();
}

export function countZapierApps(apps: readonly TZapierPartnerApp[]): ZapierDirectoryCounts {
  const categories = Object.fromEntries(ZAPIER_APP_CATEGORIES.map((category) => [category, 0])) as Record<
    TZapierAppCategory,
    number
  >;

  let popular = 0;
  let recent = 0;

  for (const app of apps) {
    categories[app.category] += 1;
    if (app.isPopular) popular += 1;
    if (app.isRecent) recent += 1;
  }

  return { all: apps.length, popular, recent, categories };
}

export function filterZapierApps(
  apps: readonly TZapierPartnerApp[],
  filters: ZapierDirectoryFilters,
  describe: (app: TZapierPartnerApp) => string
): TZapierPartnerApp[] {
  const query = filters.query.trim().toLowerCase();

  return apps.filter((app) => {
    const matchesQuery =
      !query || app.name.toLowerCase().includes(query) || describe(app).toLowerCase().includes(query);
    const matchesCategory = filters.category === 'all' || app.category === filters.category;
    const matchesQuick = filters.quick === 'all' || (filters.quick === 'popular' ? app.isPopular : app.isRecent);

    return matchesQuery && matchesCategory && matchesQuick;
  });
}

export function sortZapierApps(
  apps: readonly TZapierPartnerApp[],
  sort: ZapierDirectorySort = 'popular'
): TZapierPartnerApp[] {
  return [...apps].sort((first, second) => {
    if (sort === 'popular' && first.isPopular !== second.isPopular) return first.isPopular ? -1 : 1;

    return first.name.localeCompare(second.name);
  });
}

export const ZAPIER_EXAMPLE_ORGANIZATION = { id: 'org_example', name: 'Acme Academy', siteName: 'acme' };

export function getZapierExampleData(eventType: TWebhookEventType): Record<string, unknown> {
  return buildWebhookExampleEnvelope(eventType, ZAPIER_EXAMPLE_ORGANIZATION).data as Record<string, unknown>;
}
