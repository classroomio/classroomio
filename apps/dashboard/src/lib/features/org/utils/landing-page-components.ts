import {
  BoldCourseLanding,
  BoldLandingHero,
  BoldLandingNav,
  BoldLandingPage,
  ClassicCourseLanding,
  ClassicLandingHero,
  ClassicLandingNav,
  ClassicLandingPage,
  CorporateCourseLanding,
  CorporateLandingHero,
  CorporateLandingNav,
  CorporateLandingPage,
  EditorialCourseLanding,
  EditorialLandingHero,
  EditorialLandingNav,
  EditorialLandingPage,
  MinimalCourseLanding,
  MinimalLandingHero,
  MinimalLandingNav,
  MinimalLandingPage,
  SaasCourseLanding,
  SaasLandingHero,
  SaasLandingNav,
  SaasLandingPage,
  StudioCourseLanding,
  StudioLandingHero,
  StudioLandingNav,
  StudioLandingPage,
  TechCourseLanding,
  TechLandingHero,
  TechLandingNav,
  TechLandingPage,
  TerminalCourseLanding,
  TerminalLandingHero,
  TerminalLandingNav,
  TerminalLandingPage,
  VibrantCourseLanding,
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

export const courseLandingPageThemeComponents = {
  minimal: MinimalCourseLanding,
  bold: BoldCourseLanding,
  classic: ClassicCourseLanding,
  saas: SaasCourseLanding,
  tech: TechCourseLanding,
  studio: StudioCourseLanding,
  corporate: CorporateCourseLanding,
  terminal: TerminalCourseLanding,
  editorial: EditorialCourseLanding,
  vibrant: VibrantCourseLanding
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
