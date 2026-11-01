import { createContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { DARK_THEME, LIGHT_THEME, type Theme } from '@/feature/common/constants/theme';
import type { OrgBrand } from '@/feature/org/types/org';
import { useThemePreference } from '@/feature/settings/helpers/theme-preference-store';

export const ThemeContext = createContext<Theme>(LIGHT_THEME);

type ThemeProviderProps = { brand?: OrgBrand | null; children: ReactNode };

export function ThemeProvider({ brand, children }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const preference = useThemePreference();
  const scheme = preference === 'system' ? systemScheme : preference;

  const theme = useMemo(() => {
    const base = scheme === 'dark' ? DARK_THEME : LIGHT_THEME;
    if (!brand) return base;

    const colors = {
      ...base.colors,
      primary: brand.primary,
      primaryPressed: brand.primary,
      onPrimary: brand.onPrimary,
      primaryText: base.isDark ? base.colors.ink : brand.primary,
      primaryTint: `${brand.primary}${base.isDark ? '2E' : '14'}`
    };

    return { ...base, colors };
  }, [scheme, brand]);

  return <ThemeContext value={theme}>{children}</ThemeContext>;
}
