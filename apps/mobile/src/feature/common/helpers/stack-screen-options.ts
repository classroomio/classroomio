import type { ThemeColors } from '@/feature/common/constants/colors';
import { FONT_FAMILY } from '@/feature/common/constants/typography';

/** Native stack options shared by every tab: large titles in Geist on the screen background, chevron-only back buttons. */
export function tabStackScreenOptions(colors: ThemeColors) {
  return {
    headerLargeTitleEnabled: true,
    headerShadowVisible: false,
    headerLargeTitleShadowVisible: false,
    headerTransparent: false,
    headerStyle: { backgroundColor: colors.background },
    headerLargeStyle: { backgroundColor: colors.background },
    headerTitleStyle: { fontFamily: FONT_FAMILY.semibold, color: colors.ink },
    headerLargeTitleStyle: { fontFamily: FONT_FAMILY.bold, color: colors.ink },
    headerTintColor: colors.primary,
    headerBackButtonDisplayMode: 'minimal',
    contentStyle: { backgroundColor: colors.background }
  } as const;
}
