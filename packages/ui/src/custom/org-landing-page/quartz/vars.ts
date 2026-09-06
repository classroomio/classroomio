import { baseTokenVars, type LandingThemeVars } from '../theme-vars-base';

/**
 * Quartz is a near-monochrome, hairline-ruled theme: an off-white canvas, white cards,
 * and ink used as both the accent and the primary button surface. Colour enters only
 * through course tag dots and the org logo.
 */
export const vars: LandingThemeVars = {
  ...baseTokenVars,
  '--landing-bg': '#f3f3f4',
  '--landing-bg-section': '#ffffff',
  '--landing-card': '#ffffff',
  '--landing-card-soft': '#fafafb',
  '--landing-fg': '#111114',
  '--landing-fg-muted': '#6e6e77',
  '--landing-fg-faint': '#9a9aa3',
  '--landing-border': '#e3e3e6',
  '--landing-border-soft': '#ededf0',
  '--landing-accent': '#111114',
  '--landing-accent-fg': '#ffffff',
  '--landing-button-primary-bg': '#111114',
  '--landing-button-primary-fg': '#ffffff',
  '--landing-button-primary-bg-hover': '#2b2b33',
  '--landing-button-secondary-bg': '#ffffff',
  '--landing-button-secondary-fg': '#111114',
  '--landing-button-secondary-border': '#e3e3e6',
  '--landing-button-secondary-bg-hover': '#fafafb',
  '--landing-button-tertiary-fg': '#111114',
  '--landing-button-tertiary-bg-hover': '#ededf0',
  '--landing-heading-weight': '600',
  '--landing-heading-tracking': '-0.032em',
  '--landing-heading-case': 'none',
  '--landing-eyebrow-tracking': '0.09em',
  '--landing-eyebrow-case': 'uppercase',
  '--landing-radius-card': '0px',
  '--landing-radius-pill': '9999px',
  '--landing-shadow-card': 'none',
  '--landing-divider': '1px solid #e3e3e6',
  '--landing-mono-family': 'ui-sans-serif, system-ui, sans-serif',
  '--landing-glow': 'none',
  '--landing-panel-bg-accent': '#fafafb'
};
