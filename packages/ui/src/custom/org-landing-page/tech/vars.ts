import { baseTokenVars, type LandingThemeVars } from '../theme-vars-base';

export const vars: LandingThemeVars = {
  ...baseTokenVars,
  '--landing-heading-weight': '800',
  '--landing-heading-tracking': '-0.01em',
  '--landing-eyebrow-tracking': '0.18em',
  '--landing-eyebrow-case': 'uppercase',
  '--landing-radius-card': '0px',
  '--landing-radius-pill': '0px',
  '--landing-divider': '1px dashed var(--landing-border)',
  '--landing-mono-family': 'ui-monospace, "JetBrains Mono", "Fira Code", monospace'
};
