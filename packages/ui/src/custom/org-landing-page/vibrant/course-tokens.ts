import { tokenize, type CourseLandingTokens } from '../course-tokens-base';

export const courseTokens: CourseLandingTokens = tokenize({
  sectionShell: 'ui:py-14 ui:md:py-16 ui:px-4 ui:bg-[var(--landing-bg)]',
  heading:
    'ui:text-5xl ui:md:text-7xl ui:text-[var(--landing-fg)]' +
    ' ui:[font-weight:var(--landing-heading-weight)]' +
    ' ui:[letter-spacing:var(--landing-heading-tracking)]',
  socialProofShell: 'ui:py-10 ui:px-4 ui:border-y ui:border-[var(--landing-border)]',
  socialProofValue:
    'ui:text-5xl ui:md:text-6xl ui:text-[var(--landing-fg)]' +
    ' ui:[font-weight:var(--landing-heading-weight)]' +
    ' ui:[letter-spacing:var(--landing-heading-tracking)]',
  socialProofLabel:
    'ui:text-xs ui:text-[var(--landing-fg-muted)]' +
    ' ui:[letter-spacing:var(--landing-eyebrow-tracking)]' +
    ' ui:[text-transform:var(--landing-eyebrow-case)]',
  socialProofDivider: 'ui:hidden',
  infoBlock: 'ui:flex ui:flex-col ui:gap-4',
  infoBlockHeading:
    'ui:text-4xl ui:md:text-5xl ui:text-[var(--landing-fg)]' +
    ' ui:[font-weight:var(--landing-heading-weight)]' +
    ' ui:[letter-spacing:var(--landing-heading-tracking)]',
  infoBlockBody:
    'ui:text-lg ui:text-[var(--landing-fg-muted)] ui:leading-relaxed' +
    ' ui:[&_p]:mb-2 ui:[&_ul]:list-disc ui:[&_ul]:pl-5 ui:[&_li]:mb-1',
  curriculumModule: 'ui:mb-6 ui:border-b ui:border-[var(--landing-border)] ui:pb-6 ui:last:border-b-0',
  curriculumModuleHeader:
    'ui:flex ui:flex-col ui:items-start ui:gap-2 ui:cursor-pointer ui:text-left ui:md:flex-row ui:md:items-center ui:md:justify-between ui:md:gap-4',
  curriculumModuleTitle:
    'ui:text-3xl ui:md:text-4xl ui:text-[var(--landing-fg)]' +
    ' ui:[font-weight:var(--landing-heading-weight)]' +
    ' ui:[letter-spacing:var(--landing-heading-tracking)]',
  curriculumLessonRow: 'ui:flex ui:items-center ui:gap-3 ui:py-3 ui:border-t ui:border-[var(--landing-border)]/50',
  instructorShell: 'ui:flex ui:flex-col ui:md:flex-row ui:gap-8 ui:items-start',
  instructorAvatar: 'ui:size-32 ui:rounded-full ui:object-cover',
  instructorName:
    'ui:text-4xl ui:md:text-5xl ui:text-[var(--landing-fg)]' +
    ' ui:[font-weight:var(--landing-heading-weight)]' +
    ' ui:[letter-spacing:var(--landing-heading-tracking)]',
  reviewCard: 'ui:p-0 ui:border-t ui:border-[var(--landing-border)] ui:pt-6 ui:bg-transparent',
  chip:
    'ui:inline-flex ui:items-center ui:px-5 ui:py-2.5 ui:text-base ui:text-[var(--landing-fg)]' +
    ' ui:border ui:border-[var(--landing-border)] ui:bg-transparent' +
    ' ui:[border-radius:var(--landing-radius-pill)]' +
    ' ui:hover:border-[var(--landing-accent)]' +
    ' ui:transition-colors',
  chipsGroupHeading:
    'ui:text-3xl ui:md:text-4xl ui:text-[var(--landing-fg)] ui:mb-6' +
    ' ui:[font-weight:var(--landing-heading-weight)]' +
    ' ui:[letter-spacing:var(--landing-heading-tracking)]',
  pricingShell:
    'ui:p-10 ui:border-2 ui:border-[var(--landing-fg)]' +
    ' ui:[border-radius:var(--landing-radius-card)] ui:bg-[var(--landing-bg)]',
  pricingAmount:
    'ui:text-6xl ui:md:text-7xl ui:text-[var(--landing-fg)]' +
    ' ui:[font-weight:var(--landing-heading-weight)]' +
    ' ui:[letter-spacing:var(--landing-heading-tracking)]'
});
