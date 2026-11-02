import { darken } from '@/feature/common/helpers/color';

export type ThemeColors = {
  background: string;
  surface: string;
  muted: string;
  mutedStrong: string;
  border: string;
  borderStrong: string;
  ink: string;
  inkBody: string;
  inkMuted: string;
  inkSubtle: string;
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  primaryText: string;
  primaryTint: string;
  ring: string;
  danger: string;
  dangerTint: string;
  success: string;
  successTint: string;
  warning: string;
  warningTint: string;
  scrim: string;
  /** Glyphs and text on saturated fills and course artwork, white in both themes. */
  onSolid: string;
  /** The darkening behind text laid over course artwork. */
  artworkScrim: string;
  shadow: string;
};

const LIGHT_PRIMARY = '#1447E6';
const DARK_PRIMARY = '#2B5BEA';

export const LIGHT_COLORS: ThemeColors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  muted: '#F5F5F5',
  mutedStrong: '#EBEBEB',
  border: '#E5E5E5',
  borderStrong: '#D4D4D4',
  ink: '#0A0A0A',
  inkBody: '#262626',
  inkMuted: '#737373',
  inkSubtle: '#8F8F8F',
  primary: LIGHT_PRIMARY,
  primaryPressed: darken(LIGHT_PRIMARY, 0.12),
  onPrimary: '#FFFFFF',
  primaryText: LIGHT_PRIMARY,
  primaryTint: '#EFF6FF',
  ring: '#8EC5FF',
  danger: '#E7000B',
  dangerTint: '#FEF2F2',
  success: '#00A63E',
  successTint: '#F0FDF4',
  warning: '#E17100',
  warningTint: '#FFFBEB',
  scrim: 'rgba(0, 0, 0, 0.5)',
  onSolid: '#FFFFFF',
  artworkScrim: '#000000',
  shadow: '#000000'
};

export const DARK_COLORS: ThemeColors = {
  background: '#0A0A0A',
  surface: '#171717',
  muted: '#262626',
  mutedStrong: '#303030',
  border: '#2E2E2E',
  borderStrong: '#404040',
  ink: '#FAFAFA',
  inkBody: '#E5E5E5',
  inkMuted: '#A1A1A1',
  inkSubtle: '#737373',
  primary: DARK_PRIMARY,
  primaryPressed: darken(DARK_PRIMARY, 0.12),
  onPrimary: '#FFFFFF',
  primaryText: '#51A2FF',
  primaryTint: 'rgba(43, 127, 255, 0.16)',
  ring: '#2B7FFF',
  danger: '#FF6467',
  dangerTint: 'rgba(255, 100, 103, 0.14)',
  success: '#05DF72',
  successTint: 'rgba(5, 223, 114, 0.12)',
  warning: '#FFB900',
  warningTint: 'rgba(255, 185, 0, 0.12)',
  scrim: 'rgba(0, 0, 0, 0.6)',
  onSolid: '#FFFFFF',
  artworkScrim: '#000000',
  shadow: '#000000'
};
