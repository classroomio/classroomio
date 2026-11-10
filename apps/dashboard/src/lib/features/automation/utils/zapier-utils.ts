import { env } from '$env/dynamic/public';
import { canOAuthScopesChangeData } from '@cio/utils/constants/oauth-scopes';
import {
  ZAPIER_APP_CATEGORIES,
  ZAPIER_FEATURED_RECIPE_IDS,
  ZAPIER_PARTNER_APPS,
  type TZapierAppCategory,
  type TZapierPartnerApp,
  type TZapierRecipe
} from '@cio/utils/constants/zapier';

import type {
  ZapierAccess,
  ZapierConnection,
  ZapierDirectoryCategory,
  ZapierDirectoryCounts,
  ZapierDirectoryState,
  ZapierTrigger,
  ZapierZapStep
} from './types';

export const ZAPIER_URLS = {
  editor: 'https://zapier.com/app/editor',
  myZaps: 'https://zapier.com/app/zaps',
  connections: 'https://zapier.com/app/assets/connections'
} as const;

const ZAPIER_LOGO_DIRECTORY = '/images/zapier-apps';
const PNG_LOGO_SLUGS: readonly string[] = ['jotform'];

export const ZAPIER_LOGO_URL = `${ZAPIER_LOGO_DIRECTORY}/zapier.svg`;
export const CLASSROOMIO_LOGO_URL = '/logo-192.png';

export function getZapierAppLogoUrl(app: Pick<TZapierPartnerApp, 'slug'>): string {
  const extension = PNG_LOGO_SLUGS.includes(app.slug) ? 'png' : 'svg';

  return `${ZAPIER_LOGO_DIRECTORY}/${app.slug}.${extension}`;
}

/**
 * Triggers with failed deliveries to Zapier in the redelivery window, across every connection. The server counts
 * FAILED and GAVE_UP deliveries from the last 24 hours, so a later success does not hide earlier missed events.
 */
export function getZapierFailingTriggers(connections: readonly ZapierConnection[]): ZapierTrigger[] {
  return connections.flatMap((connection) => connection.triggers.filter((trigger) => trigger.failedDeliveryCount > 0));
}

const ZAPIER_CREATE_ZAP_URL = 'https://zapier.com/webintent/create-zap';
const ZAPIER_INVITE_STORAGE_PREFIX = 'cio:zapier-invite-opened:';
const ZAPIER_INVITE_NOTE_STORAGE_PREFIX = 'cio:zapier-invite-note-dismissed:';

function getZapierStepAppKey(step: ZapierZapStep, app?: TZapierPartnerApp): string | null {
  if (step.app === 'classroomio') return env.PUBLIC_ZAPIER_APP_KEY || null;

  return app?.zapierKey ?? null;
}

export function buildZapierZapUrl(steps: readonly ZapierZapStep[], app?: TZapierPartnerApp): string {
  if (steps.length === 0) return ZAPIER_URLS.editor;

  const url = new URL(ZAPIER_CREATE_ZAP_URL);

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

export function buildZapierRecipeUrl(app: TZapierPartnerApp, recipe: TZapierRecipe): string {
  return buildZapierZapUrl([recipe.trigger, recipe.action], app);
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
    const triggerLabel = translate(`automation.zapier.catalog_triggers.${recipe.trigger.key}.label`);
    const actionLabel = translate(`automation.zapier.partner_steps.${app.slug}.${actionKey}`);

    return translate('automation.zapier.recipes.sentence_out', {
      trigger: triggerLabel,
      action: actionLabel,
      app: app.name
    });
  }

  const actionKey = recipe.action.app === 'classroomio' ? recipe.action.key : '';
  const triggerLabel = translate(`automation.zapier.partner_steps.${app.slug}.${recipe.trigger.key}`);
  const actionLabel = translate(`automation.zapier.catalog_actions.${actionKey}.label`);

  return translate('automation.zapier.recipes.sentence_in', {
    trigger: triggerLabel,
    action: actionLabel,
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

/**
 * A short, readable date such as "Nov 9, 2026", in the dashboard locale when one is given.
 */
export function formatZapierDate(value: string | null, localeCode?: string): string | null {
  if (!value) return null;

  return new Intl.DateTimeFormat(localeCode, { dateStyle: 'medium' }).format(new Date(value));
}

export function getZapierInviteUrl(): string {
  return env.PUBLIC_ZAPIER_CONNECT_URL ?? '';
}

/**
 * True while the integration is invite-only, which a configured invite URL signals: admins must accept the
 * invite on Zapier before ClassroomIO appears there.
 */
export function isZapierInviteRequired(): boolean {
  return getZapierInviteUrl() !== '';
}

export function hasAcceptedZapierInvite(
  connections: readonly ZapierConnection[],
  profileId: string | null | undefined
): boolean {
  if (!profileId) return false;

  return connections.some((connection) => connection.authorizedBy.profileId === profileId);
}

function hasStoredFlag(key: string): boolean {
  try {
    return globalThis.localStorage?.getItem(key) === '1';
  } catch {
    return false;
  }
}

function storeFlag(key: string): void {
  try {
    globalThis.localStorage?.setItem(key, '1');
  } catch {
    // Browsers can block storage (private mode, site data restrictions); these flags are only a convenience.
  }
}

export function hasOpenedZapierInvite(profileId: string | null | undefined): boolean {
  if (!profileId) return false;

  return hasStoredFlag(`${ZAPIER_INVITE_STORAGE_PREFIX}${profileId}`);
}

export function rememberZapierInviteOpened(profileId: string | null | undefined): void {
  if (!profileId) return;

  storeFlag(`${ZAPIER_INVITE_STORAGE_PREFIX}${profileId}`);
}

export function hasDismissedZapierInviteNote(organizationId: string | null | undefined): boolean {
  if (!organizationId) return false;

  return hasStoredFlag(`${ZAPIER_INVITE_NOTE_STORAGE_PREFIX}${organizationId}`);
}

export function dismissZapierInviteNote(organizationId: string | null | undefined): void {
  if (!organizationId) return;

  storeFlag(`${ZAPIER_INVITE_NOTE_STORAGE_PREFIX}${organizationId}`);
}

function parseZapierCategory(value: string | null): ZapierDirectoryCategory {
  return ZAPIER_APP_CATEGORIES.find((category) => category === value) ?? 'all';
}

export function parseZapierDirectoryState(searchParams: URLSearchParams): ZapierDirectoryState {
  const query = searchParams.get('q')?.trim() ?? '';

  return {
    query,
    category: parseZapierCategory(searchParams.get('category'))
  };
}

export function toZapierDirectorySearch(state: ZapierDirectoryState): string {
  const searchParams = new URLSearchParams();
  const query = state.query.trim();

  if (query) searchParams.set('q', query);
  if (state.category !== 'all') searchParams.set('category', state.category);

  return searchParams.toString();
}

export function countZapierApps(apps: readonly TZapierPartnerApp[]): ZapierDirectoryCounts {
  const categories = Object.fromEntries(ZAPIER_APP_CATEGORIES.map((category) => [category, 0])) as Record<
    TZapierAppCategory,
    number
  >;

  for (const app of apps) {
    categories[app.category] += 1;
  }

  return { all: apps.length, categories };
}

export function filterZapierApps(
  apps: readonly TZapierPartnerApp[],
  filters: ZapierDirectoryState,
  describe: (app: TZapierPartnerApp) => string
): TZapierPartnerApp[] {
  const query = filters.query.trim().toLowerCase();

  return apps.filter((app) => {
    const matchesQuery =
      !query || app.name.toLowerCase().includes(query) || describe(app).toLowerCase().includes(query);
    const matchesCategory = filters.category === 'all' || app.category === filters.category;

    return matchesQuery && matchesCategory;
  });
}

export function sortZapierApps(apps: readonly TZapierPartnerApp[]): TZapierPartnerApp[] {
  return [...apps].sort((first, second) => first.name.localeCompare(second.name));
}
