import { baseTokenVars, type LandingThemeVars } from '../theme-vars-base';

export const vars: LandingThemeVars = {
  ...baseTokenVars,
  '--landing-heading-weight': '700',
  '--landing-heading-tracking': '-0.01em',
  '--landing-radius-card': '12px',
  '--landing-shadow-card': '0 8px 24px -16px color-mix(in oklab, var(--landing-fg), transparent 85%)',
  '--landing-divider': '1px solid var(--landing-border)'
};
