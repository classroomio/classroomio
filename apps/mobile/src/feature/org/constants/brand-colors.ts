import type { OrgBrand } from '@/feature/org/types/org';

const WHITE = '#FFFFFF';

export const NAMED_THEME_BRANDS: Record<string, OrgBrand> = {
  blue: { primary: '#1447E6', onPrimary: WHITE },
  green: { primary: '#5EA500', onPrimary: WHITE },
  amber: { primary: '#E17100', onPrimary: WHITE },
  rose: { primary: '#EC003F', onPrimary: WHITE },
  purple: { primary: '#9810FA', onPrimary: WHITE },
  orange: { primary: '#F54900', onPrimary: WHITE },
  teal: { primary: '#009689', onPrimary: WHITE },
  mono: { primary: '#57534D', onPrimary: WHITE },
  red: { primary: '#E7000B', onPrimary: WHITE },
  yellow: { primary: '#FDC700', onPrimary: '#17140F' },
  violet: { primary: '#7F22FE', onPrimary: WHITE }
};
