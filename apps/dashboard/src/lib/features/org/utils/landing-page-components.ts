import {
  BoldLandingHero,
  BoldLandingNav,
  BoldLandingPage,
  ClassicLandingHero,
  ClassicLandingNav,
  ClassicLandingPage,
  CorporateLandingHero,
  CorporateLandingNav,
  CorporateLandingPage,
  MinimalLandingHero,
  MinimalLandingNav,
  MinimalLandingPage,
  SaasLandingHero,
  SaasLandingNav,
  SaasLandingPage,
  StudioLandingHero,
  StudioLandingNav,
  StudioLandingPage,
  TechLandingHero,
  TechLandingNav,
  TechLandingPage,
  TerminalLandingHero,
  TerminalLandingNav,
  TerminalLandingPage
} from '@cio/ui/custom/org-landing-page';

export const landingPageThemeComponents = {
  minimal: MinimalLandingPage,
  bold: BoldLandingPage,
  classic: ClassicLandingPage,
  saas: SaasLandingPage,
  tech: TechLandingPage,
  studio: StudioLandingPage,
  corporate: CorporateLandingPage,
  terminal: TerminalLandingPage
} as const;

export const landingPageNavComponents = {
  minimal: MinimalLandingNav,
  bold: BoldLandingNav,
  classic: ClassicLandingNav,
  saas: SaasLandingNav,
  tech: TechLandingNav,
  studio: StudioLandingNav,
  corporate: CorporateLandingNav,
  terminal: TerminalLandingNav
} as const;

export const landingPageHeroComponents = {
  minimal: MinimalLandingHero,
  bold: BoldLandingHero,
  classic: ClassicLandingHero,
  saas: SaasLandingHero,
  tech: TechLandingHero,
  studio: StudioLandingHero,
  corporate: CorporateLandingHero,
  terminal: TerminalLandingHero
} as const;
