import { type PluginThemeV1, DEFAULT_LIGHT_THEME_V1, DEFAULT_DARK_THEME_V1 } from '@classroomio/plugin-sdk';

export function resolveCurrentHostTheme(): PluginThemeV1 {
  if (typeof document === 'undefined') {
    return DEFAULT_LIGHT_THEME_V1;
  }

  const isDark = document.documentElement.classList.contains('dark');
  return isDark ? DEFAULT_DARK_THEME_V1 : DEFAULT_LIGHT_THEME_V1;
}
