import { baseTokenVars, type LandingThemeVars } from '../theme-vars-base';

export const vars: LandingThemeVars = {
  ...baseTokenVars,
  '--landing-heading-weight': '900',
  '--landing-heading-tracking': '-0.02em',
  '--landing-radius-card': '24px',
  '--landing-shadow-card': '0 8px 24px -20px color-mix(in oklab, var(--landing-fg), transparent 80%)',
  '--landing-divider': '1px solid var(--landing-border)'
};
