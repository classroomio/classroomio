import { baseTokenVars, type LandingThemeVars } from '../theme-vars-base';

export const vars: LandingThemeVars = {
  ...baseTokenVars,
  '--landing-heading-weight': '500',
  '--landing-heading-tracking': '-0.04em',
  '--landing-radius-card': '24px',
  '--landing-divider': '1px solid color-mix(in oklab, var(--landing-border), transparent 50%)',
  '--landing-panel-bg-accent': 'color-mix(in oklab, var(--landing-accent), var(--landing-bg) 80%)'
};
