import { tokenize, type CourseLandingTokens } from '../course-tokens-base';

export const courseTokens: CourseLandingTokens = tokenize({
  sectionShell: 'ui:py-12 ui:md:py-14 ui:px-4 ui:bg-[var(--landing-bg)]',
  sectionNavShell: 'ui:border-b ui:border-[var(--landing-border)] ui:bg-[var(--landing-bg)]',
  sectionNavItem: 'ui:font-mono',
  eyebrow:
    'ui:text-xs ui:font-mono ui:text-[var(--landing-accent)]' +
    ' ui:[letter-spacing:var(--landing-eyebrow-tracking)]' +
    ' ui:[text-transform:var(--landing-eyebrow-case)]',
  heading:
    'ui:text-3xl ui:md:text-4xl ui:text-[var(--landing-fg)] ui:font-mono' +
    ' ui:[font-weight:var(--landing-heading-weight)]',
  body: 'ui:text-sm ui:text-[var(--landing-fg-muted)] ui:font-mono ui:leading-relaxed',
  socialProofShell: 'ui:py-8 ui:px-4 ui:border-y ui:border-[var(--landing-border)]',
  socialProofValue:
    'ui:text-2xl ui:font-mono ui:text-[var(--landing-fg)]' + ' ui:[font-weight:var(--landing-heading-weight)]',
  socialProofLabel:
    'ui:text-xs ui:font-mono ui:text-[var(--landing-fg-muted)]' +
    ' ui:[letter-spacing:var(--landing-eyebrow-tracking)]' +
    ' ui:[text-transform:var(--landing-eyebrow-case)]',
  socialProofDivider:
    'ui:size-2 ui:rounded-full ui:bg-[var(--landing-accent)]' + ' ui:[box-shadow:var(--landing-glow)]',
  infoBlock:
    'ui:flex ui:flex-col ui:gap-3 ui:p-6' +
    ' ui:[background:linear-gradient(180deg,var(--landing-card)_0%,var(--landing-bg-section)_100%)]' +
    ' ui:border ui:border-[var(--landing-border-soft)]' +
    ' ui:[border-radius:var(--landing-radius-card)]',
  infoBlockHeading:
    'ui:text-xl ui:font-mono ui:text-[var(--landing-fg)]' + ' ui:[font-weight:var(--landing-heading-weight)]',
  infoBlockBody: 'ui:text-sm ui:font-mono ui:text-[var(--landing-fg-muted)] ui:leading-relaxed',
  curriculumContainer:
    'ui:p-2' +
    ' ui:[background:linear-gradient(180deg,var(--landing-card)_0%,var(--landing-bg-section)_100%)]' +
    ' ui:border ui:border-[var(--landing-border-soft)]' +
    ' ui:[border-radius:var(--landing-radius-card)]',
  curriculumModule: 'ui:py-2',
  curriculumModuleHeader:
    'ui:flex ui:items-center ui:justify-between ui:gap-4 ui:px-4 ui:py-3 ui:cursor-pointer' +
    ' ui:font-mono ui:text-[var(--landing-fg)]',
  curriculumModuleTitle:
    'ui:text-base ui:font-mono ui:text-[var(--landing-fg)]' + ' ui:[font-weight:var(--landing-heading-weight)]',
  curriculumModuleMeta: 'ui:text-xs ui:font-mono ui:text-[var(--landing-accent)]',
  curriculumLessonRow:
    'ui:flex ui:items-center ui:gap-3 ui:px-4 ui:py-2 ui:font-mono ui:text-sm' +
    ' ui:[border-top:1px_dashed_var(--landing-border-soft)]',
  curriculumLessonPrefix: 'ui:text-xs ui:text-[var(--landing-accent)] ui:font-mono',
  curriculumLessonTitle: 'ui:text-sm ui:text-[var(--landing-fg-muted)] ui:font-mono',
  reviewCard:
    'ui:p-6' +
    ' ui:[background:linear-gradient(180deg,var(--landing-card)_0%,var(--landing-bg-section)_100%)]' +
    ' ui:border ui:border-[var(--landing-border-soft)]' +
    ' ui:[border-radius:var(--landing-radius-card)]',
  reviewName: 'ui:text-sm ui:font-mono ui:text-[var(--landing-fg)]',
  reviewDate: 'ui:text-xs ui:font-mono ui:text-[var(--landing-fg-muted)]',
  reviewQuote: 'ui:text-sm ui:font-mono ui:text-[var(--landing-fg)] ui:leading-relaxed ui:mb-4',
  chip:
    'ui:inline-flex ui:items-center ui:px-3 ui:py-1.5 ui:text-xs ui:font-mono' +
    ' ui:bg-transparent ui:text-[var(--landing-fg)]' +
    ' ui:border ui:border-[var(--landing-border-soft)]' +
    ' ui:[border-radius:var(--landing-radius-pill)]' +
    ' ui:hover:border-[var(--landing-border)] ui:transition-colors',
  chipsShowAll:
    'ui:text-xs ui:font-mono ui:text-[var(--landing-accent)]' +
    ' ui:[letter-spacing:var(--landing-eyebrow-tracking)]' +
    ' ui:[text-transform:var(--landing-eyebrow-case)]' +
    ' ui:cursor-pointer ui:ml-2 ui:bg-transparent ui:border-0',
  instructorShell:
    'ui:flex ui:flex-col ui:md:flex-row ui:gap-6 ui:items-start ui:p-6' +
    ' ui:[background:linear-gradient(180deg,var(--landing-card)_0%,var(--landing-bg-section)_100%)]' +
    ' ui:border ui:border-[var(--landing-border-soft)]' +
    ' ui:[border-radius:var(--landing-radius-card)]',
  instructorAvatar: 'ui:size-20 ui:rounded-full ui:object-cover ui:border ui:border-[var(--landing-border-soft)]',
  instructorName:
    'ui:text-xl ui:font-mono ui:text-[var(--landing-fg)]' + ' ui:[font-weight:var(--landing-heading-weight)]',
  instructorRole: 'ui:text-sm ui:font-mono ui:text-[var(--landing-fg-muted)]',
  pricingShell:
    'ui:p-6' +
    ' ui:[background:linear-gradient(180deg,var(--landing-card)_0%,var(--landing-bg-section)_100%)]' +
    ' ui:border ui:border-[var(--landing-border-soft)]' +
    ' ui:[border-radius:var(--landing-radius-card)]',
  pricingAmount:
    'ui:text-4xl ui:md:text-5xl ui:font-mono ui:text-[var(--landing-fg)]' +
    ' ui:[font-weight:var(--landing-heading-weight)]',
  pricingFreeBadge:
    'ui:inline-block ui:px-3 ui:py-1 ui:text-xs ui:font-mono ui:text-[var(--landing-accent-fg)]' +
    ' ui:bg-[var(--landing-accent)] ui:[border-radius:var(--landing-radius-pill)]' +
    ' ui:[box-shadow:var(--landing-glow)]'
});
