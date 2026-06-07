import { baseTokenVars, type LandingThemeVars } from '../theme-vars-base';

export const vars: LandingThemeVars = {
  ...baseTokenVars,
  '--landing-heading-weight': '600',
  '--landing-eyebrow-tracking': '0.12em',
  '--landing-eyebrow-case': 'uppercase',
  '--landing-radius-card': '0px',
  '--landing-radius-pill': '0px',
  '--landing-divider': '1px solid var(--landing-border)'
};
