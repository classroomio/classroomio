import { tokenize, type CourseLandingTokens } from '../course-tokens-base';

export const courseTokens: CourseLandingTokens = tokenize({
  sectionShell: 'ui:py-14 ui:md:py-16 ui:px-4 ui:bg-[var(--landing-bg)]',
  heading:
    'ui:text-4xl ui:md:text-6xl ui:text-[var(--landing-fg)]' +
    ' ui:[font-weight:var(--landing-heading-weight)]' +
    ' ui:[letter-spacing:var(--landing-heading-tracking)]',
  socialProofShell: 'ui:py-10 ui:px-4 ui:bg-[var(--landing-fg)] ui:text-[var(--landing-bg)]',
  socialProofValue: 'ui:text-4xl ui:text-[var(--landing-bg)] ui:[font-weight:var(--landing-heading-weight)]',
  socialProofLabel: 'ui:text-xs ui:text-[var(--landing-bg)]/70 ui:[letter-spacing:var(--landing-eyebrow-tracking)]',
  socialProofDivider: 'ui:size-2 ui:rounded-full ui:bg-[var(--landing-accent)]',
  infoBlock:
    'ui:flex ui:flex-col ui:gap-3 ui:p-8 ui:border ui:border-[var(--landing-border)]/50' +
    ' ui:[border-radius:var(--landing-radius-card)]',
  infoBlockHeading:
    'ui:text-3xl ui:text-[var(--landing-fg)] ui:[font-weight:var(--landing-heading-weight)] ui:[letter-spacing:var(--landing-heading-tracking)]',
  curriculumModule:
    'ui:mb-3 ui:p-6 ui:border ui:border-[var(--landing-border)]/50' + ' ui:[border-radius:var(--landing-radius-card)]',
  curriculumModuleTitle:
    'ui:text-xl ui:md:text-2xl ui:text-[var(--landing-fg)] ui:[font-weight:var(--landing-heading-weight)] ui:[letter-spacing:var(--landing-heading-tracking)]',
  curriculumModuleMeta:
    'ui:text-xs ui:font-medium ui:px-3 ui:py-1 ui:bg-[var(--landing-accent)] ui:text-[var(--landing-accent-fg)]' +
    ' ui:[border-radius:var(--landing-radius-pill)]',
  instructorShell:
    'ui:flex ui:flex-col ui:md:flex-row ui:gap-6 ui:items-start ui:p-8' +
    ' ui:border ui:border-[var(--landing-border)]/50 ui:[border-radius:var(--landing-radius-card)]',
  instructorAvatar: 'ui:size-28 ui:rounded-full ui:object-cover ui:ring-4 ui:ring-[var(--landing-accent)]',
  instructorName:
    'ui:text-3xl ui:text-[var(--landing-fg)] ui:[font-weight:var(--landing-heading-weight)] ui:[letter-spacing:var(--landing-heading-tracking)]',
  reviewCard: 'ui:p-6 ui:border ui:border-[var(--landing-border)]/50 ui:[border-radius:var(--landing-radius-card)]',
  pricingShell:
    'ui:p-8 ui:bg-[var(--landing-fg)] ui:text-[var(--landing-bg)]' +
    ' ui:[border-radius:var(--landing-radius-card)] ui:[box-shadow:var(--landing-shadow-card)]',
  pricingAmount:
    'ui:text-5xl ui:md:text-6xl ui:text-[var(--landing-bg)]' +
    ' ui:[font-weight:var(--landing-heading-weight)] ui:[letter-spacing:var(--landing-heading-tracking)]',
  pricingCurrency: 'ui:text-base ui:text-[var(--landing-bg)]/70 ui:ml-1',
  pricingDiscount: 'ui:text-base ui:text-[var(--landing-bg)]/60 ui:line-through',
  pricingEyebrow: 'ui:text-xs ui:text-[var(--landing-bg)]/70 ui:[letter-spacing:var(--landing-eyebrow-tracking)]',
  pricingFeature: 'ui:flex ui:items-center ui:gap-2 ui:text-sm ui:text-[var(--landing-bg)]/90'
});
