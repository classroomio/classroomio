import type { ThemeColors } from '@/feature/common/constants/colors';
import { FONT_FAMILY } from '@/feature/common/constants/typography';

/** Native stack options shared by every tab: large titles in Geist on the system bar, chevron-only back buttons. */
export function tabStackScreenOptions(colors: ThemeColors) {
  return {
    headerLargeTitleEnabled: true,
    // No bar background or headerTransparent: on iOS 26 either one makes the large title snap away instead of collapsing.
    headerShadowVisible: false,
    headerLargeTitleShadowVisible: false,
    headerTitleStyle: { fontFamily: FONT_FAMILY.semibold, color: colors.ink },
    headerLargeTitleStyle: { fontFamily: FONT_FAMILY.bold, color: colors.ink },
    headerTintColor: colors.primary,
    headerBackButtonDisplayMode: 'minimal',
    contentStyle: { backgroundColor: colors.background }
  } as const;
}
