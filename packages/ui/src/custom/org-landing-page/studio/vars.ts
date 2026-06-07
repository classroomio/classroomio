import { baseTokenVars, type LandingThemeVars } from '../theme-vars-base';

export const vars: LandingThemeVars = {
  ...baseTokenVars,
  '--landing-heading-weight': '600',
  '--landing-radius-card': '8px',
  '--landing-divider': '1px solid color-mix(in oklab, var(--landing-border), transparent 50%)'
};
