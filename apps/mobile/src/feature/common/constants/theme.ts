import type { ViewStyle } from 'react-native';

import { DARK_COLORS, LIGHT_COLORS, type ThemeColors } from './colors';

export type Elevation = {
  raised: ViewStyle;
  floating: ViewStyle;
};

export type Theme = {
  isDark: boolean;
  colors: ThemeColors;
  elevation: Elevation;
};

function createElevation(colors: ThemeColors, isDark: boolean): Elevation {
  return {
    raised: {
      boxShadow: [
        {
          offsetX: 0,
          offsetY: 1,
          blurRadius: 2,
          spreadDistance: 0,
          color: isDark ? 'rgba(0, 0, 0, 0.32)' : 'rgba(0, 0, 0, 0.05)'
        }
      ]
    },
    floating: {
      boxShadow: [
        {
          offsetX: 0,
          offsetY: 1,
          blurRadius: 2,
          spreadDistance: 0,
          color: isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.05)'
        },
        {
          offsetX: 0,
          offsetY: 8,
          blurRadius: 24,
          spreadDistance: -6,
          color: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)'
        }
      ],
      borderColor: colors.border
    }
  };
}

export const LIGHT_THEME: Theme = {
  isDark: false,
  colors: LIGHT_COLORS,
  elevation: createElevation(LIGHT_COLORS, false)
};

export const DARK_THEME: Theme = {
  isDark: true,
  colors: DARK_COLORS,
  elevation: createElevation(DARK_COLORS, true)
};
