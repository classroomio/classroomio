import { tokenize, type CourseLandingTokens } from '../course-tokens-base';

export const courseTokens: CourseLandingTokens = tokenize({
  sectionShell: 'ui:py-14 ui:md:py-16 ui:px-4 ui:bg-[var(--landing-bg)]',
  sectionNavItem: 'ui:font-mono',
  eyebrow:
    'ui:text-xs ui:font-mono ui:text-[var(--landing-accent)]' +
    ' ui:[letter-spacing:var(--landing-eyebrow-tracking)]' +
    ' ui:[text-transform:var(--landing-eyebrow-case)]',
  heading:
    'ui:text-3xl ui:md:text-5xl ui:text-[var(--landing-fg)]' +
    ' ui:[font-weight:var(--landing-heading-weight)]' +
    ' ui:[letter-spacing:var(--landing-heading-tracking)]',
  body: 'ui:text-base ui:text-[var(--landing-fg-muted)] ui:leading-relaxed ui:font-mono',
  socialProofShell: 'ui:py-8 ui:px-4 ui:border-y ui:border-dashed ui:border-[var(--landing-border)]',
  socialProofValue:
    'ui:text-3xl ui:font-mono ui:text-[var(--landing-accent)]' + ' ui:[font-weight:var(--landing-heading-weight)]',
  socialProofLabel:
    'ui:text-xs ui:font-mono ui:text-[var(--landing-fg-muted)]' +
    ' ui:[letter-spacing:var(--landing-eyebrow-tracking)]' +
    ' ui:[text-transform:var(--landing-eyebrow-case)]',
  socialProofDivider: 'ui:text-[var(--landing-fg-muted)] ui:font-mono',
  infoGrid: 'ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:border-t ui:border-l ui:border-[var(--landing-border)]',
  infoBlock: 'ui:flex ui:flex-col ui:gap-3 ui:p-8 ui:border-r ui:border-b ui:border-[var(--landing-border)]',
  infoBlockEyebrow:
    'ui:text-xs ui:font-mono ui:text-[var(--landing-accent)]' + ' ui:[letter-spacing:var(--landing-eyebrow-tracking)]',
  curriculumContainer: 'ui:border-t ui:border-l ui:border-[var(--landing-border)]',
  curriculumModule: 'ui:border-r ui:border-b ui:border-[var(--landing-border)] ui:py-0',
  curriculumModuleHeader:
    'ui:flex ui:flex-col ui:items-start ui:gap-2 ui:px-6 ui:py-4 ui:cursor-pointer ui:text-left ui:md:flex-row ui:md:items-center ui:md:justify-between ui:md:gap-4',
  curriculumModuleMeta:
    'ui:text-xs ui:font-mono ui:text-[var(--landing-accent)] ui:px-2 ui:py-1' +
    ' ui:border ui:border-[var(--landing-border)]',
  curriculumLessonRow:
    'ui:flex ui:items-center ui:gap-3 ui:px-6 ui:py-3 ui:border-t ui:border-dashed ui:border-[var(--landing-border)]',
  curriculumLessonPrefix: 'ui:text-xs ui:text-[var(--landing-fg-muted)] ui:font-mono',
  reviewsGrid: 'ui:grid ui:grid-cols-1 ui:md:grid-cols-3 ui:border-t ui:border-l ui:border-[var(--landing-border)]',
  reviewCard: 'ui:p-6 ui:border-r ui:border-b ui:border-[var(--landing-border)] ui:bg-[var(--landing-bg)]',
  reviewName: 'ui:text-sm ui:font-mono ui:text-[var(--landing-fg)] ui:font-medium',
  reviewDate: 'ui:text-xs ui:font-mono ui:text-[var(--landing-fg-muted)]',
  chip:
    'ui:inline-flex ui:items-center ui:px-3 ui:py-1.5 ui:text-xs ui:font-mono' +
    ' ui:bg-transparent ui:text-[var(--landing-fg)] ui:border ui:border-[var(--landing-border)]' +
    ' ui:hover:border-[var(--landing-accent)] ui:hover:text-[var(--landing-accent)]' +
    ' ui:transition-colors',
  chipsShowAll:
    'ui:text-xs ui:font-mono ui:text-[var(--landing-accent)]' +
    ' ui:[letter-spacing:var(--landing-eyebrow-tracking)]' +
    ' ui:[text-transform:var(--landing-eyebrow-case)]' +
    ' ui:cursor-pointer ui:ml-2 ui:bg-transparent ui:border-0',
  instructorShell:
    'ui:grid ui:grid-cols-1 ui:md:grid-cols-[auto_1fr] ui:border-t ui:border-l ui:border-[var(--landing-border)]',
  instructorAvatarWrap:
    'ui:border-r ui:border-b ui:border-[var(--landing-border)] ui:p-6 ui:flex ui:items-center ui:justify-center',
  instructorAvatar: 'ui:size-24 ui:object-cover ui:rounded-none',
  pricingShell: 'ui:p-6 ui:border ui:border-[var(--landing-border)] ui:bg-[var(--landing-card)]',
  pricingAmount: 'ui:text-5xl ui:font-mono ui:text-[var(--landing-fg)] ui:[font-weight:var(--landing-heading-weight)]'
});
