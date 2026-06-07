import { baseTokenVars, type LandingThemeVars } from '../theme-vars-base';

export const vars: LandingThemeVars = {
  ...baseTokenVars,
  '--landing-heading-weight': '700',
  '--landing-eyebrow-tracking': '0.08em',
  '--landing-eyebrow-case': 'uppercase',
  '--landing-radius-card': '4px',
  '--landing-divider': '1px solid var(--landing-border)'
};
