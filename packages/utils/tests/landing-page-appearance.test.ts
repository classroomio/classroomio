import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NATIVE_LANDING_PAGE_THEME,
  normalizeLandingPageAppearance,
  ZLandingPageAppearance,
  ZUpdateOrganization
} from '../src/validation/organization';

describe('LandingPageAppearance & Normalization', () => {
  it('normalizes legacy string theme to native appearance', () => {
    const appearance = normalizeLandingPageAppearance(undefined, 'bold');
    expect(appearance).toEqual({
      kind: 'native',
      theme: 'bold'
    });
  });

  it('normalizes undefined or null theme to default quartz theme', () => {
    const appearanceFromUndefined = normalizeLandingPageAppearance(undefined, undefined);
    expect(appearanceFromUndefined).toEqual({
      kind: 'native',
      theme: DEFAULT_NATIVE_LANDING_PAGE_THEME
    });

    const appearanceFromNull = normalizeLandingPageAppearance(null, null);
    expect(appearanceFromNull).toEqual({
      kind: 'native',
      theme: DEFAULT_NATIVE_LANDING_PAGE_THEME
    });
  });

  it('normalizes unknown or invalid string theme to default quartz theme', () => {
    const appearance = normalizeLandingPageAppearance(undefined, 'non-existent-theme');
    expect(appearance).toEqual({
      kind: 'native',
      theme: DEFAULT_NATIVE_LANDING_PAGE_THEME
    });
  });

  it('preserves valid native appearance', () => {
    const native = {
      kind: 'native',
      theme: 'terminal'
    };
    const appearance = normalizeLandingPageAppearance(native, 'bold');
    expect(appearance).toEqual(native);
  });

  it('preserves valid plugin appearance', () => {
    const pluginAppearance = {
      kind: 'plugin',
      fallbackTheme: 'bold',
      installationId: 'a3d02a0a-7cb5-46f9-9061-6be1f72740bc',
      pluginId: 'com.classroomio.landing-templates',
      contributionId: 'landing-templates-picker',
      templateId: 'neo-brutalism',
      version: '1.0.0'
    };
    const appearance = normalizeLandingPageAppearance(pluginAppearance);
    expect(appearance).toEqual(pluginAppearance);
  });

  it('falls back to native when plugin appearance has invalid installationId uuid', () => {
    const invalidPluginAppearance = {
      kind: 'plugin',
      fallbackTheme: 'bold',
      installationId: 'not-a-uuid',
      pluginId: 'com.classroomio.landing-templates',
      contributionId: 'landing-templates-picker',
      templateId: 'neo-brutalism',
      version: '1.0.0'
    };
    const appearance = normalizeLandingPageAppearance(invalidPluginAppearance, 'bold');
    expect(appearance).toEqual({
      kind: 'native',
      theme: 'bold'
    });
  });

  it('validates appearance in ZUpdateOrganization schema', () => {
    const validUpdate = {
      landingpage: {
        appearance: {
          kind: 'native',
          theme: 'quartz'
        }
      }
    };
    expect(ZUpdateOrganization.safeParse(validUpdate).success).toBe(true);

    const invalidUpdate = {
      landingpage: {
        appearance: {
          kind: 'plugin',
          fallbackTheme: 'invalid-theme'
        }
      }
    };
    expect(ZUpdateOrganization.safeParse(invalidUpdate).success).toBe(false);
  });
});
