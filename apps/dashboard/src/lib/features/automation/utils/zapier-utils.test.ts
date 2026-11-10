import { getZapierPartnerApp, ZAPIER_ACTIONS, ZAPIER_PARTNER_APPS, ZAPIER_TRIGGERS } from '@cio/utils/constants/zapier';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import en from '../../../utils/translations/en.json';
import type { ZapierConnection } from './types';

const envMock = vi.hoisted(() => ({
  PUBLIC_ZAPIER_APP_KEY: 'App249044CLIAPI',
  PUBLIC_ZAPIER_CONNECT_URL: 'https://zapier.com/developer/public-invite/249044/token/'
}));

vi.mock('$env/dynamic/public', () => ({ env: envMock }));

const {
  buildZapierRecipeUrl,
  buildZapierZapUrl,
  countZapierApps,
  filterZapierApps,
  formatZapierDate,
  getZapierAppLogoUrl,
  getZapierFailingTriggers,
  getZapierAccess,
  getZapierAppMonogram,
  getZapierInviteUrl,
  getZapierMonogramTextColor,
  getRecipeDirection,
  getRecipeMode,
  getZapierPrimaryRecipe,
  describeRecipe,
  dismissZapierInviteNote,
  sortRecipes,
  hasAcceptedZapierInvite,
  hasDismissedZapierInviteNote,
  hasOpenedZapierInvite,
  isZapierInviteRequired,
  parseZapierDirectoryState,
  rememberZapierInviteOpened,
  sortZapierApps,
  toZapierDirectorySearch,
  ZAPIER_URLS
} = await import('./zapier-utils');

function partnerApp(slug: string) {
  const app = getZapierPartnerApp(slug);

  if (!app) throw new Error(`Missing partner app: ${slug}`);

  return app;
}

function stepParams(url: string) {
  return new URL(url).searchParams;
}

function urlPath(url: string) {
  const parsed = new URL(url);

  return `${parsed.origin}${parsed.pathname}`;
}

const slack = partnerApp('slack');
const calendly = partnerApp('calendly');
const zoom = partnerApp('zoom');

beforeEach(() => {
  envMock.PUBLIC_ZAPIER_APP_KEY = 'App249044CLIAPI';
  envMock.PUBLIC_ZAPIER_CONNECT_URL = 'https://zapier.com/developer/public-invite/249044/token/';
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('buildZapierZapUrl', () => {
  it('opens the Zap editor through webintent and appends @latest to every app key', () => {
    const url = buildZapierZapUrl(
      [
        { app: 'classroomio', type: 'read', key: 'course_completed' },
        { app: 'partner', type: 'write', key: 'channel_message' }
      ],
      slack
    );
    const params = stepParams(url);

    expect(urlPath(url)).toBe('https://zapier.com/webintent/create-zap');
    expect(params.get('steps[0][app]')).toBe('App249044CLIAPI@latest');
    expect(params.get('steps[0][action]')).toBe('course_completed');
    expect(params.get('steps[0][type]')).toBe('read');
    expect(params.get('steps[1][app]')).toBe('SlackCLIAPI@latest');
    expect(params.get('steps[1][action]')).toBe('channel_message');
    expect(params.get('steps[1][type]')).toBe('write');
  });

  it('falls back to the plain editor with no steps', () => {
    expect(buildZapierZapUrl([])).toBe(ZAPIER_URLS.editor);
  });

  it('falls back to the editor when the ClassroomIO app key is missing', () => {
    envMock.PUBLIC_ZAPIER_APP_KEY = '';

    expect(buildZapierRecipeUrl(slack, slack.recipes[0])).toBe(ZAPIER_URLS.editor);
  });

  it('falls back to the editor when a partner step has no app to resolve its key', () => {
    expect(buildZapierZapUrl([{ app: 'partner', type: 'write', key: 'channel_message' }])).toBe(ZAPIER_URLS.editor);
  });
});

describe('buildZapierRecipeUrl', () => {
  it('builds a ClassroomIO trigger into a partner action', () => {
    const params = stepParams(buildZapierRecipeUrl(slack, slack.recipes[0]));

    expect(params.get('steps[0][app]')).toBe('App249044CLIAPI@latest');
    expect(params.get('steps[0][action]')).toBe('course_completed');
    expect(params.get('steps[0][type]')).toBe('read');
    expect(params.get('steps[1][app]')).toBe('SlackCLIAPI@latest');
    expect(params.get('steps[1][action]')).toBe('channel_message');
    expect(params.get('steps[1][type]')).toBe('write');
  });

  it('builds a partner trigger into a ClassroomIO action', () => {
    const params = stepParams(buildZapierRecipeUrl(calendly, calendly.recipes[0]));

    expect(params.get('steps[0][app]')).toBe('CalendlyCLIAPI@latest');
    expect(params.get('steps[0][action]')).toBe('invitee_created');
    expect(params.get('steps[0][type]')).toBe('read');
    expect(params.get('steps[1][app]')).toBe('App249044CLIAPI@latest');
    expect(params.get('steps[1][action]')).toBe('enroll_student');
    expect(params.get('steps[1][type]')).toBe('write');
  });

  it('builds a second recipe', () => {
    const params = stepParams(buildZapierRecipeUrl(zoom, zoom.recipes[1]));

    expect(params.get('steps[0][action]')).toBe('new_cohort_member');
    expect(params.get('steps[1][action]')).toBe('create_meeting_registrant');
  });
});

describe('Zapier directory state', () => {
  const defaults = { query: '', category: 'all' } as const;

  it('parses defaults from an empty query string', () => {
    expect(parseZapierDirectoryState(new URLSearchParams())).toEqual(defaults);
  });

  it('parses the query and category', () => {
    expect(parseZapierDirectoryState(new URLSearchParams('q=hub&category=crm'))).toEqual({
      query: 'hub',
      category: 'crm'
    });
  });

  it('falls back to defaults for invalid values', () => {
    expect(parseZapierDirectoryState(new URLSearchParams('q=%20%20&category=unknown'))).toEqual(defaults);
  });

  it('trims the search query', () => {
    expect(parseZapierDirectoryState(new URLSearchParams('q=%20hubspot%20')).query).toBe('hubspot');
  });

  it('serializes defaults to an empty string', () => {
    expect(toZapierDirectorySearch(defaults)).toBe('');
  });

  it('round trips through the query string', () => {
    const state = { query: 'hub', category: 'crm' } as const;

    expect(parseZapierDirectoryState(new URLSearchParams(toZapierDirectorySearch(state)))).toEqual(state);
  });
});

describe('Zapier directory helpers', () => {
  const apps = ZAPIER_PARTNER_APPS;
  const noDescription = () => '';

  it('counts every app and each category', () => {
    expect(countZapierApps(apps)).toEqual({
      all: 20,
      categories: {
        crm: 2,
        marketing: 2,
        communication: 4,
        'customer-support': 2,
        sales: 2,
        productivity: 3,
        forms: 2,
        analytics: 2,
        community: 1
      }
    });
  });

  it('filters by name and translated description, case-insensitively', () => {
    expect(filterZapierApps(apps, { query: 'HUB', category: 'all' }, noDescription).map((app) => app.slug)).toEqual([
      'hubspot'
    ]);

    const describe = (app: (typeof apps)[number]) =>
      app.slug === 'slack' ? 'Team communication and collaboration' : '';

    expect(
      filterZapierApps(apps, { query: 'team COMMUNICATION', category: 'all' }, describe).map((app) => app.slug)
    ).toEqual(['slack']);
  });

  it('combines category and query', () => {
    expect(filterZapierApps(apps, { query: '', category: 'forms' }, noDescription)).toHaveLength(2);
    expect(filterZapierApps(apps, { query: 'cal', category: 'sales' }, noDescription).map((app) => app.slug)).toEqual([
      'calendly',
      'calcom'
    ]);
  });

  it('sorts A to Z by name', () => {
    const names = sortZapierApps(apps).map((app) => app.name);

    expect(names).toEqual([...names].sort((first, second) => first.localeCompare(second)));
  });
});

describe('Zapier invite helpers', () => {
  it('reads the invite URL', () => {
    expect(getZapierInviteUrl()).toBe('https://zapier.com/developer/public-invite/249044/token/');

    envMock.PUBLIC_ZAPIER_CONNECT_URL = '';
    expect(getZapierInviteUrl()).toBe('');
  });

  it('requires the invite only while an invite URL is configured', () => {
    expect(isZapierInviteRequired()).toBe(true);

    envMock.PUBLIC_ZAPIER_CONNECT_URL = '';
    expect(isZapierInviteRequired()).toBe(false);
  });

  it('detects a connection authorized by the current profile', () => {
    const connections = [{ authorizedBy: { profileId: 'profile-1' } }] as unknown as ZapierConnection[];

    expect(hasAcceptedZapierInvite(connections, 'profile-1')).toBe(true);
    expect(hasAcceptedZapierInvite(connections, 'profile-2')).toBe(false);
    expect(hasAcceptedZapierInvite(connections, null)).toBe(false);
    expect(hasAcceptedZapierInvite(connections, undefined)).toBe(false);
  });

  it('remembers the invite per profile in local storage', () => {
    const store = new Map<string, string>();

    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value)
    });

    expect(hasOpenedZapierInvite('profile-1')).toBe(false);

    rememberZapierInviteOpened('profile-1');

    expect(hasOpenedZapierInvite('profile-1')).toBe(true);
    expect(hasOpenedZapierInvite('profile-2')).toBe(false);
    expect(store.get('cio:zapier-invite-opened:profile-1')).toBe('1');
  });

  it('ignores blocked storage', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      }
    });

    expect(hasOpenedZapierInvite('profile-1')).toBe(false);
    expect(() => rememberZapierInviteOpened('profile-1')).not.toThrow();
    expect(hasDismissedZapierInviteNote('org-1')).toBe(false);
    expect(() => dismissZapierInviteNote('org-1')).not.toThrow();
  });

  it('remembers a dismissed invite note per organization', () => {
    const store = new Map<string, string>();

    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value)
    });

    expect(hasDismissedZapierInviteNote('org-1')).toBe(false);

    dismissZapierInviteNote('org-1');

    expect(hasDismissedZapierInviteNote('org-1')).toBe(true);
    expect(hasDismissedZapierInviteNote('org-2')).toBe(false);
    expect(store.get('cio:zapier-invite-note-dismissed:org-1')).toBe('1');
  });

  it('does nothing without a profile', () => {
    expect(hasOpenedZapierInvite(null)).toBe(false);
    expect(hasOpenedZapierInvite(undefined)).toBe(false);
    expect(() => rememberZapierInviteOpened(null)).not.toThrow();
    expect(hasDismissedZapierInviteNote(null)).toBe(false);
    expect(() => dismissZapierInviteNote(undefined)).not.toThrow();
  });
});

describe('Zapier overview helpers', () => {
  it('points every catalog app at a bundled logo', () => {
    expect(getZapierAppLogoUrl(slack)).toBe('/images/zapier-apps/slack.svg');
    expect(getZapierAppLogoUrl(partnerApp('jotform'))).toBe('/images/zapier-apps/jotform.png');
  });

  it('finds triggers with failed deliveries in the last 24 hours', () => {
    const trigger = (id: string, failedDeliveryCount: number, isActive = true) => ({
      id,
      failedDeliveryCount,
      isActive,
      lastDeliveryStatus: failedDeliveryCount > 0 ? 'FAILED' : 'SUCCESS',
      lastDeliveryAt: '2026-11-09T08:00:00Z'
    });
    const connections = [
      {
        triggers: [
          trigger('failed-recent', 2),
          trigger('gave-up-recent', 1),
          trigger('failed-but-disabled', 3, false),
          trigger('delivered', 0),
          trigger('never', 0)
        ]
      }
    ] as unknown as ZapierConnection[];

    expect(getZapierFailingTriggers(connections).map((failing) => failing.id)).toEqual([
      'failed-recent',
      'gave-up-recent',
      'failed-but-disabled'
    ]);
  });

  it('reads access from the granted scopes', () => {
    expect(getZapierAccess(['audience:read', 'audience:write'])).toBe('read_write');
    expect(getZapierAccess(['audience:read'])).toBe('read_only');
    expect(getZapierAccess(['audience:read', 'webhook:subscription:read', 'webhook:subscription:write'])).toBe(
      'read_only'
    );
  });

  it('builds a monogram and disambiguates the Google apps', () => {
    expect(getZapierAppMonogram(partnerApp('hubspot'))).toBe('Hu');
    expect(getZapierAppMonogram(partnerApp('google_meet'))).toBe('GM');
    expect(getZapierAppMonogram(partnerApp('sheets'))).toBe('GS');
  });

  it('picks readable monogram text for light and dark brand colors', () => {
    expect(getZapierMonogramTextColor(partnerApp('mailchimp').color)).toBe('#111827');
    expect(getZapierMonogramTextColor(partnerApp('slack').color)).toBe('#ffffff');
  });

  it('formats dates', () => {
    expect(formatZapierDate(null)).toBeNull();
    expect(formatZapierDate('2026-11-09T12:00:00.000Z', 'en-US')).toBe('Nov 9, 2026');
    expect(formatZapierDate('2026-11-09T12:00:00.000Z', 'fr')).toBe('9 nov. 2026');
  });

  it('keeps trigger and action recipe keys aligned with the shared constants', () => {
    const triggerKeys = new Set(ZAPIER_TRIGGERS.map((trigger) => trigger.key));
    const actionKeys = new Set(ZAPIER_ACTIONS.map((action) => action.key));

    for (const app of ZAPIER_PARTNER_APPS) {
      for (const recipe of app.recipes) {
        for (const step of [recipe.trigger, recipe.action]) {
          if (step.app !== 'classroomio') continue;

          expect(step.type === 'read' ? triggerKeys.has(step.key) : actionKeys.has(step.key)).toBe(true);
        }
      }
    }
  });
});

describe('Zapier recipes', () => {
  it('ships the 86 curated recipes', () => {
    expect(ZAPIER_PARTNER_APPS.reduce((total, app) => total + app.recipes.length, 0)).toBe(86);
  });

  it('uses one ClassroomIO step per recipe and unique ids', () => {
    const ids = new Set<string>();

    for (const app of ZAPIER_PARTNER_APPS) {
      for (const recipe of app.recipes) {
        expect(ids.has(recipe.id)).toBe(false);
        ids.add(recipe.id);

        const classroomioSteps = [recipe.trigger, recipe.action].filter((step) => step.app === 'classroomio');
        expect(classroomioSteps).toHaveLength(1);
      }
    }
  });

  it('reads the primary recipe and its direction', () => {
    const slackRecipe = getZapierPrimaryRecipe(slack);

    expect(slackRecipe?.id).toBe('slack_completed_channel');
    expect(getRecipeDirection(slackRecipe!)).toBe('out');
    expect(getRecipeDirection(calendly.recipes[0])).toBe('in');
    expect(getRecipeMode(slackRecipe!)).toBe('instant');
    expect(getRecipeMode(calendly.recipes[0])).toBe('instant');
    expect(getRecipeMode(partnerApp('hubspot').recipes[0])).toBe('polling');
  });

  it('sorts the primary recipe first, then instant before polling', () => {
    const hubspotRecipes = sortRecipes(partnerApp('hubspot').recipes, 'hubspot_deal_stage_enroll');

    expect(hubspotRecipes[0].id).toBe('hubspot_deal_stage_enroll');
    expect(hubspotRecipes[1].id).toBe('hubspot_list_enroll');
    expect(hubspotRecipes[2].id).toBe('hubspot_form_invite');
  });

  it('builds the recipe sentence from step labels', () => {
    const translate = (key: string, params?: Record<string, string | number>) => {
      const labels: Record<string, string> = {
        'automation.zapier.recipes.sentence_out': 'When {trigger} in ClassroomIO, {action} in {app}.',
        'automation.zapier.recipes.sentence_in': 'When {trigger} in {app}, {action} in ClassroomIO.',
        'automation.zapier.catalog_triggers.course_completed.label': 'Course Completed',
        'automation.zapier.partner_steps.slack.channel_message': 'Send Channel Message',
        'automation.zapier.catalog_actions.enroll_student.label': 'Enroll Student in Course',
        'automation.zapier.partner_steps.calendly.invitee_created': 'Invitee Created or Rescheduled'
      };
      const template = labels[key] ?? key;

      return template.replace(/\{(\w+)\}/g, (_, name) => String(params?.[name] ?? ''));
    };

    expect(describeRecipe(slack.recipes[0], slack, translate)).toBe(
      'When Course Completed in ClassroomIO, Send Channel Message in Slack.'
    );
    expect(describeRecipe(calendly.recipes[0], calendly, translate)).toBe(
      'When Invitee Created or Rescheduled in Calendly, Enroll Student in Course in ClassroomIO.'
    );
  });

  it('has a title for every recipe and a label for every partner step', () => {
    const recipeTitles = en.automation.zapier.recipes as Record<string, unknown>;
    const partnerSteps = en.automation.zapier.partner_steps as Record<string, Record<string, string>>;

    for (const app of ZAPIER_PARTNER_APPS) {
      for (const recipe of app.recipes) {
        expect(recipeTitles[recipe.id]).toBeTruthy();

        for (const step of [recipe.trigger, recipe.action]) {
          if (step.app !== 'partner') continue;

          expect(partnerSteps[app.slug]?.[step.key]).toBeTruthy();
        }
      }
    }
  });
});
