import * as minimal from '@cio/ui/custom/org-landing-page/minimal';
import * as bold from '@cio/ui/custom/org-landing-page/bold';
import * as classic from '@cio/ui/custom/org-landing-page/classic';
import * as saas from '@cio/ui/custom/org-landing-page/saas';
import * as tech from '@cio/ui/custom/org-landing-page/tech';
import * as studio from '@cio/ui/custom/org-landing-page/studio';
import * as corporate from '@cio/ui/custom/org-landing-page/corporate';
import * as terminal from '@cio/ui/custom/org-landing-page/terminal';
import * as editorial from '@cio/ui/custom/org-landing-page/editorial';
import * as vibrant from '@cio/ui/custom/org-landing-page/vibrant';
import * as quartz from '@cio/ui/custom/org-landing-page/quartz';
import type { Component } from 'svelte';

type ThemeBundle = {
  nav: Component<any>;
  hero: Component<any>;
  courseCard: Component<any>;
  coursesGridClass: string;
};

export const THEME_BUNDLES: Record<string, ThemeBundle> = {
  minimal,
  bold,
  classic,
  saas,
  tech,
  studio,
  corporate,
  terminal,
  editorial,
  vibrant,
  quartz
} as unknown as Record<string, ThemeBundle>;

/** apps/dashboard features/org/utils/landing-page.ts NAV_SNIPPET_THEMES */
const NAV_INSIDE_HERO = new Set(['minimal', 'saas', 'tech', 'studio', 'corporate', 'terminal', 'editorial', 'vibrant']);

export function themeRendersNavInsideHero(theme: string): boolean {
  return NAV_INSIDE_HERO.has(theme);
}
