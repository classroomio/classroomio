import type { OrgLandingPageTheme } from './types';
import type { CourseLandingTokens } from './course-tokens-base';
import { courseTokens as minimalTokens } from './minimal/course-tokens';
import { courseTokens as boldTokens } from './bold/course-tokens';
import { courseTokens as classicTokens } from './classic/course-tokens';
import { courseTokens as saasTokens } from './saas/course-tokens';
import { courseTokens as techTokens } from './tech/course-tokens';
import { courseTokens as studioTokens } from './studio/course-tokens';
import { courseTokens as corporateTokens } from './corporate/course-tokens';
import { courseTokens as terminalTokens } from './terminal/course-tokens';
import { courseTokens as editorialTokens } from './editorial/course-tokens';
import { courseTokens as vibrantTokens } from './vibrant/course-tokens';

export type { CourseLandingTokens } from './course-tokens-base';

const TOKENS: Record<OrgLandingPageTheme, CourseLandingTokens> = {
  minimal: minimalTokens,
  bold: boldTokens,
  classic: classicTokens,
  saas: saasTokens,
  tech: techTokens,
  studio: studioTokens,
  corporate: corporateTokens,
  terminal: terminalTokens,
  editorial: editorialTokens,
  vibrant: vibrantTokens
};

export function courseLandingTokens(theme: OrgLandingPageTheme): CourseLandingTokens {
  return TOKENS[theme] ?? minimalTokens;
}
