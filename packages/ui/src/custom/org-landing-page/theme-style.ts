import type { OrgLandingPageTheme } from './types';

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
  | '--landing-button-tertiary-bg-hover';

export type LandingThemeVars = Record<LandingThemeVarName, string>;

const baseTokenVars: LandingThemeVars = {
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
  '--landing-button-tertiary-bg-hover': 'var(--muted)'
};

export const LANDING_THEME_VARS: Record<OrgLandingPageTheme, LandingThemeVars> = {
  minimal: baseTokenVars,
  bold: baseTokenVars,
  classic: baseTokenVars,
  saas: baseTokenVars,
  tech: baseTokenVars,
  studio: baseTokenVars,
  corporate: baseTokenVars,
  vibrant: baseTokenVars,
  terminal: {
    '--landing-bg': '#06070a',
    '--landing-bg-section': '#0c0e13',
    '--landing-card': '#0f1218',
    '--landing-card-soft': '#14171f',
    '--landing-fg': '#e9eaed',
    '--landing-fg-muted': '#9da1ab',
    '--landing-fg-faint': '#61656f',
    '--landing-border': '#1c1f28',
    '--landing-border-soft': '#161922',
    '--landing-accent': 'var(--primary)',
    '--landing-accent-fg': 'var(--primary-foreground)',
    '--landing-button-primary-bg': '#f4f5f7',
    '--landing-button-primary-fg': '#0a0b0e',
    '--landing-button-primary-bg-hover': '#ffffff',
    '--landing-button-secondary-bg': 'rgba(255,255,255,0.04)',
    '--landing-button-secondary-fg': '#e9eaed',
    '--landing-button-secondary-border': '#262a35',
    '--landing-button-secondary-bg-hover': 'rgba(255,255,255,0.08)',
    '--landing-button-tertiary-fg': 'var(--primary)',
    '--landing-button-tertiary-bg-hover': 'rgba(255,255,255,0.06)'
  },
  editorial: {
    '--landing-bg': '#f4f3ed',
    '--landing-bg-section': '#ebeae3',
    '--landing-card': '#fafaf5',
    '--landing-card-soft': '#ecebe5',
    '--landing-fg': '#1a1a1a',
    '--landing-fg-muted': '#76746c',
    '--landing-fg-faint': '#98968e',
    '--landing-border': '#d9d8d0',
    '--landing-border-soft': '#e3e2da',
    '--landing-accent': '#c25237',
    '--landing-accent-fg': '#fafaf5',
    '--landing-button-primary-bg': '#1a1a1a',
    '--landing-button-primary-fg': '#fafaf5',
    '--landing-button-primary-bg-hover': '#2c2b29',
    '--landing-button-secondary-bg': 'transparent',
    '--landing-button-secondary-fg': '#1a1a1a',
    '--landing-button-secondary-border': '#d9d8d0',
    '--landing-button-secondary-bg-hover': '#ebeae3',
    '--landing-button-tertiary-fg': '#c25237',
    '--landing-button-tertiary-bg-hover': '#ebeae3'
  }
};

export function themeStyle(theme: OrgLandingPageTheme): string {
  const vars = LANDING_THEME_VARS[theme] ?? baseTokenVars;
  return Object.entries(vars)
    .map(([name, value]) => `${name}: ${value}`)
    .join('; ');
}
