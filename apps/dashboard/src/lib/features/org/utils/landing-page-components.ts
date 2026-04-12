import {
  BoldLandingHero,
  BoldLandingNav,
  BoldLandingPage,
  ClassicLandingHero,
  ClassicLandingNav,
  ClassicLandingPage,
  MinimalLandingHero,
  MinimalLandingNav,
  MinimalLandingPage
} from '@cio/ui/custom/org-landing-page';

export const landingPageThemeComponents = {
  minimal: MinimalLandingPage,
  bold: BoldLandingPage,
  classic: ClassicLandingPage
} as const;

export const landingPageNavComponents = {
  minimal: MinimalLandingNav,
  bold: BoldLandingNav,
  classic: ClassicLandingNav
} as const;

export const landingPageHeroComponents = {
  minimal: MinimalLandingHero,
  bold: BoldLandingHero,
  classic: ClassicLandingHero
} as const;
