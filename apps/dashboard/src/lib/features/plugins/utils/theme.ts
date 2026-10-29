import { type PluginThemeV1, DEFAULT_LIGHT_THEME_V1, DEFAULT_DARK_THEME_V1 } from '@classroomio/plugin-sdk';

export function resolveCurrentHostTheme(): PluginThemeV1 {
  if (typeof document === 'undefined') {
    return DEFAULT_LIGHT_THEME_V1;
  }

  const isDark = document.documentElement.classList.contains('dark');
  const baseTheme = isDark ? DEFAULT_DARK_THEME_V1 : DEFAULT_LIGHT_THEME_V1;
  const computedBodyStyle = window.getComputedStyle(document.body);
  const hostFontSans = computedBodyStyle.fontFamily || baseTheme.tokens.fontSans;

  return {
    ...baseTheme,
    tokens: {
      ...baseTheme.tokens,
      fontSans: hostFontSans
    }
  };
}
