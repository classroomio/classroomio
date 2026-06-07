import { tokenize, type CourseLandingTokens } from '../course-tokens-base';

export const courseTokens: CourseLandingTokens = tokenize({
  sectionShell: 'ui:py-14 ui:md:py-16 ui:px-4 ui:bg-[var(--landing-bg)]',
  heading: 'ui:text-3xl ui:md:text-4xl ui:text-[var(--landing-fg)]' + ' ui:[font-weight:var(--landing-heading-weight)]',
  socialProofShell: 'ui:py-8 ui:px-4 ui:border-y ui:border-[var(--landing-border)]',
  socialProofLabel:
    'ui:text-xs ui:text-[var(--landing-fg-muted)]' +
    ' ui:[letter-spacing:var(--landing-eyebrow-tracking)]' +
    ' ui:[text-transform:var(--landing-eyebrow-case)]',
  infoGrid: 'ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:border-t ui:border-l ui:border-[var(--landing-border)]',
  infoBlock: 'ui:flex ui:flex-col ui:gap-3 ui:p-8 ui:border-r ui:border-b ui:border-[var(--landing-border)]',
  curriculumContainer: 'ui:border-t ui:border-[var(--landing-border)]',
  curriculumModule: 'ui:border-b ui:border-[var(--landing-border)] ui:py-0',
  curriculumModuleHeader:
    'ui:flex ui:flex-col ui:items-start ui:gap-2 ui:py-5 ui:cursor-pointer ui:text-left ui:md:flex-row ui:md:items-center ui:md:justify-between ui:md:gap-4',
  reviewsGrid: 'ui:grid ui:grid-cols-1 ui:md:grid-cols-3 ui:border-t ui:border-l ui:border-[var(--landing-border)]',
  reviewCard: 'ui:p-6 ui:border-r ui:border-b ui:border-[var(--landing-border)] ui:bg-[var(--landing-bg)]',
  instructorShell:
    'ui:grid ui:grid-cols-1 ui:md:grid-cols-[auto_1fr] ui:gap-0 ui:border ui:border-[var(--landing-border)]',
  instructorAvatarWrap:
    'ui:border-b ui:md:border-b-0 ui:md:border-r ui:border-[var(--landing-border)] ui:p-6 ui:flex ui:items-center ui:justify-center',
  pricingShell: 'ui:p-6 ui:border ui:border-[var(--landing-border)] ui:bg-[var(--landing-bg)]'
});
