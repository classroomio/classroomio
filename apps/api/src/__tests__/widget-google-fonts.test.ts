import { describe, expect, it } from 'vitest';
import {
  buildWidgetGoogleFontsStylesheetHref,
  collectWidgetGoogleFontFamilies,
  getDefaultWidgetConfig,
  getWidgetThemeSerifStack,
  WIDGET_THEME_PRESET_VALUES
} from '@cio/utils/validation/widget';

describe('Widget Google Fonts', () => {
  it('loads theme-specific families for each preset', () => {
    for (const theme of WIDGET_THEME_PRESET_VALUES) {
      const config = { ...getDefaultWidgetConfig(), themePreset: theme };
      const families = collectWidgetGoogleFontFamilies(config);
      expect(families.length).toBeGreaterThan(0);
      const href = buildWidgetGoogleFontsStylesheetHref(config);
      expect(href.startsWith('https://fonts.googleapis.com/css2?')).toBe(true);
      expect(href).toContain('display=swap');
    }
  });

  it('includes IBM Plex families for graphite', () => {
    const config = { ...getDefaultWidgetConfig(), themePreset: 'graphite' as const };
    const families = collectWidgetGoogleFontFamilies(config);
    expect(families).toContain('IBM Plex Sans');
    expect(families).toContain('IBM Plex Serif');
  });

  it('merges quoted custom Google fonts from typography.fontFamily', () => {
    const config = {
      ...getDefaultWidgetConfig(),
      themePreset: 'classroomio' as const,
      typography: {
        ...getDefaultWidgetConfig().typography,
        fontFamily: "'Manrope', ui-sans-serif, sans-serif"
      }
    };
    expect(collectWidgetGoogleFontFamilies(config)).toContain('Manrope');
  });

  it('exposes serif stacks per theme', () => {
    expect(getWidgetThemeSerifStack('classroomio')).toContain('Lora');
    expect(getWidgetThemeSerifStack('spruce')).toContain('Fraunces');
  });
});
