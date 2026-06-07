export type LandingThemeVarName =
  | '--landing-bg'
  | '--landing-bg-section'
  | '--landing-card'
  | '--landing-card-soft'
  | '--landing-fg'
  | '--landing-fg-muted'
  | '--landing-fg-faint'
  | '--landing-border'
  | '--landing-border-soft'
  | '--landing-accent'
  | '--landing-accent-fg'
  | '--landing-button-primary-bg'
  | '--landing-button-primary-fg'
  | '--landing-button-primary-bg-hover'
  | '--landing-button-secondary-bg'
  | '--landing-button-secondary-fg'
  | '--landing-button-secondary-border'
  | '--landing-button-secondary-bg-hover'
  | '--landing-button-tertiary-fg'
  | '--landing-button-tertiary-bg-hover'
  | '--landing-heading-weight'
  | '--landing-heading-tracking'
  | '--landing-heading-case'
  | '--landing-eyebrow-tracking'
  | '--landing-eyebrow-case'
  | '--landing-radius-card'
  | '--landing-radius-pill'
  | '--landing-shadow-card'
  | '--landing-divider'
  | '--landing-mono-family'
  | '--landing-glow'
  | '--landing-panel-bg-accent';

export type LandingThemeVars = Record<LandingThemeVarName, string>;

export const baseTokenVars: LandingThemeVars = {
  '--landing-bg': 'var(--background)',
  '--landing-bg-section': 'var(--muted)',
  '--landing-card': 'var(--card)',
  '--landing-card-soft': 'var(--muted)',
  '--landing-fg': 'var(--foreground)',
  '--landing-fg-muted': 'var(--muted-foreground)',
  '--landing-fg-faint': 'var(--muted-foreground)',
  '--landing-border': 'var(--border)',
  '--landing-border-soft': 'var(--border)',
  '--landing-accent': 'var(--primary)',
  '--landing-accent-fg': 'var(--primary-foreground)',
  '--landing-button-primary-bg': 'var(--primary)',
  '--landing-button-primary-fg': 'var(--primary-foreground)',
  '--landing-button-primary-bg-hover': 'color-mix(in oklab, var(--primary) 88%, black)',
  '--landing-button-secondary-bg': 'transparent',
  '--landing-button-secondary-fg': 'var(--foreground)',
  '--landing-button-secondary-border': 'var(--border)',
  '--landing-button-secondary-bg-hover': 'var(--muted)',
  '--landing-button-tertiary-fg': 'var(--primary)',
  '--landing-button-tertiary-bg-hover': 'var(--muted)',
  '--landing-heading-weight': '600',
  '--landing-heading-tracking': 'normal',
  '--landing-heading-case': 'none',
  '--landing-eyebrow-tracking': '0.04em',
  '--landing-eyebrow-case': 'none',
  '--landing-radius-card': '0px',
  '--landing-radius-pill': '9999px',
  '--landing-shadow-card': 'none',
  '--landing-divider': '1px solid color-mix(in oklab, var(--landing-border), transparent 40%)',
  '--landing-mono-family': 'ui-sans-serif, system-ui, sans-serif',
  '--landing-glow': 'none',
  '--landing-panel-bg-accent': 'color-mix(in oklab, var(--landing-accent), var(--landing-bg) 88%)'
};
