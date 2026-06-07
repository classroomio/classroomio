import type { OrgLandingPageTheme } from './types';
import { baseTokenVars, type LandingThemeVars } from './theme-vars-base';
import { vars as minimalVars } from './minimal/vars';
import { vars as boldVars } from './bold/vars';
import { vars as classicVars } from './classic/vars';
import { vars as saasVars } from './saas/vars';
import { vars as techVars } from './tech/vars';
import { vars as studioVars } from './studio/vars';
import { vars as corporateVars } from './corporate/vars';
import { vars as terminalVars } from './terminal/vars';
import { vars as editorialVars } from './editorial/vars';
import { vars as vibrantVars } from './vibrant/vars';

export type { LandingThemeVarName, LandingThemeVars } from './theme-vars-base';

export const LANDING_THEME_VARS: Record<OrgLandingPageTheme, LandingThemeVars> = {
  minimal: minimalVars,
  bold: boldVars,
  classic: classicVars,
  saas: saasVars,
  tech: techVars,
  studio: studioVars,
  corporate: corporateVars,
  vibrant: vibrantVars,
  terminal: terminalVars,
  editorial: editorialVars
};

export function themeStyle(theme: OrgLandingPageTheme): string {
  const vars = LANDING_THEME_VARS[theme] ?? baseTokenVars;
  return Object.entries(vars)
    .map(([name, value]) => `${name}: ${value}`)
    .join('; ');
}
