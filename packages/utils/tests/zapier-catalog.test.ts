import { describe, expect, it } from 'vitest';

import {
  ZAPIER_ACTIONS,
  ZAPIER_APP_CATEGORIES,
  ZAPIER_PARTNER_APPS,
  ZAPIER_TRIGGERS,
  getZapierPartnerApp
} from '../src/constants/zapier';

const triggerKeys = new Set(ZAPIER_TRIGGERS.map((trigger) => trigger.key));
const actionKeys = new Set(ZAPIER_ACTIONS.map((action) => action.key));
const categories = new Set(ZAPIER_APP_CATEGORIES);

describe('Zapier partner app catalog', () => {
  it('lists twenty apps with unique slugs', () => {
    const slugs = ZAPIER_PARTNER_APPS.map((app) => app.slug);

    expect(slugs).toHaveLength(20);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('uses a valid category, color and unversioned Zapier key for every app', () => {
    for (const app of ZAPIER_PARTNER_APPS) {
      expect(categories.has(app.category)).toBe(true);
      expect(app.color).toMatch(/^#[0-9A-F]{6}$/i);
      expect(app.zapierKey.length).toBeGreaterThan(0);
      expect(app.zapierKey).not.toContain('@');
    }
  });

  it('gives every app at least one two-step recipe', () => {
    for (const app of ZAPIER_PARTNER_APPS) {
      expect(app.recipes.length).toBeGreaterThan(0);

      for (const recipe of app.recipes) {
        expect([recipe.trigger, recipe.action]).toHaveLength(2);
      }
    }
  });

  it('only references real ClassroomIO triggers and actions', () => {
    for (const app of ZAPIER_PARTNER_APPS) {
      for (const recipe of app.recipes) {
        for (const step of [recipe.trigger, recipe.action] as const) {
          if (step.app !== 'classroomio') continue;

          const knownKey = step.type === 'read' ? triggerKeys.has(step.key) : actionKeys.has(step.key);
          expect(knownKey).toBe(true);
        }
      }
    }
  });

  it('only references non-empty partner step keys', () => {
    for (const app of ZAPIER_PARTNER_APPS) {
      for (const recipe of app.recipes) {
        for (const step of [recipe.trigger, recipe.action] as const) {
          if (step.app !== 'partner') continue;

          expect(step.key.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('finds apps by slug', () => {
    expect(getZapierPartnerApp('slack')?.name).toBe('Slack');
    expect(getZapierPartnerApp('missing')).toBeNull();
  });
});
