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
  EditorialLandingHero,
  EditorialLandingNav,
  EditorialLandingPage,
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
  TerminalLandingPage,
  VibrantLandingHero,
  VibrantLandingNav,
  VibrantLandingPage
} from '@cio/ui/custom/org-landing-page';

export const landingPageThemeComponents = {
  minimal: MinimalLandingPage,
  bold: BoldLandingPage,
  classic: ClassicLandingPage,
  saas: SaasLandingPage,
  tech: TechLandingPage,
  studio: StudioLandingPage,
  corporate: CorporateLandingPage,
  terminal: TerminalLandingPage,
  editorial: EditorialLandingPage,
  vibrant: VibrantLandingPage
} as const;

export const landingPageNavComponents = {
  minimal: MinimalLandingNav,
  bold: BoldLandingNav,
  classic: ClassicLandingNav,
  saas: SaasLandingNav,
  tech: TechLandingNav,
  studio: StudioLandingNav,
  corporate: CorporateLandingNav,
  terminal: TerminalLandingNav,
  editorial: EditorialLandingNav,
  vibrant: VibrantLandingNav
} as const;

export const landingPageHeroComponents = {
  minimal: MinimalLandingHero,
  bold: BoldLandingHero,
  classic: ClassicLandingHero,
  saas: SaasLandingHero,
  tech: TechLandingHero,
  studio: StudioLandingHero,
  corporate: CorporateLandingHero,
  terminal: TerminalLandingHero,
  editorial: EditorialLandingHero,
  vibrant: VibrantLandingHero
} as const;
