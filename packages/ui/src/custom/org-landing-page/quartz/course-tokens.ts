import { tokenize, type CourseLandingTokens } from '../course-tokens-base';

/**
 * Quartz keeps the body on hairline rules rather than cards: sections are separated by a single
 * border, headings stay tight and dark, and meta text drops to the faint token.
 */
export const courseTokens: CourseLandingTokens = tokenize({
  sectionShell:
    'ui:py-11 ui:md:py-14 ui:px-5 ui:md:px-8 ui:bg-[var(--landing-card)] ui:border-t ui:border-[var(--landing-border)]',
  sectionInner: 'ui:max-w-[1200px] ui:mx-auto',
  heading:
    'ui:text-2xl ui:md:text-[28px] ui:text-[var(--landing-fg)]' +
    ' ui:[font-weight:var(--landing-heading-weight)]' +
    ' ui:[letter-spacing:var(--landing-heading-tracking)]',
  socialProofShell:
    'ui:py-6 ui:px-5 ui:md:px-8 ui:bg-[var(--landing-card)] ui:border-y ui:border-[var(--landing-border)]',
  socialProofValue:
    'ui:text-xl ui:text-[var(--landing-fg)]' +
    ' ui:[font-weight:var(--landing-heading-weight)]' +
    ' ui:[letter-spacing:var(--landing-heading-tracking)]',
  socialProofLabel:
    'ui:text-xs ui:text-[var(--landing-fg-faint)]' +
    ' ui:[letter-spacing:var(--landing-eyebrow-tracking)]' +
    ' ui:[text-transform:var(--landing-eyebrow-case)]',
  sectionNavShell:
    'ui:sticky ui:top-[58px] ui:z-40 ui:bg-[var(--landing-bg)]/90 ui:backdrop-blur-md ui:border-b ui:border-[var(--landing-border)] ui:px-5 ui:md:px-8',
  infoBlock: 'ui:flex ui:flex-col ui:gap-3 ui:pt-8 ui:border-t ui:border-[var(--landing-border)]',
  infoBlockHeading:
    'ui:text-xl ui:text-[var(--landing-fg)]' +
    ' ui:[font-weight:var(--landing-heading-weight)]' +
    ' ui:[letter-spacing:var(--landing-heading-tracking)]',
  curriculumModule: 'ui:border-b ui:border-[var(--landing-border)]',
  curriculumModuleTitle:
    'ui:text-base ui:font-medium ui:text-[var(--landing-fg)] ui:[letter-spacing:var(--landing-heading-tracking)]',
  curriculumModuleMeta: 'ui:text-[13px] ui:text-[var(--landing-fg-faint)]',
  curriculumLessonRow: 'ui:flex ui:items-center ui:gap-3 ui:py-2.5 ui:text-sm ui:text-[var(--landing-fg-muted)]',
  chip: 'ui:border ui:border-[var(--landing-border)] ui:rounded-[var(--landing-radius-pill)] ui:px-3.5 ui:py-1.5 ui:text-[13px] ui:text-[var(--landing-fg-muted)] ui:bg-[var(--landing-card)]',
  reviewCard: 'ui:border ui:border-[var(--landing-border)] ui:p-5 ui:bg-[var(--landing-card)]',
  pricingShell:
    'ui:py-14 ui:px-5 ui:md:px-8 ui:bg-[var(--landing-card)] ui:border-t ui:border-[var(--landing-border)] ui:text-center',
  pricingAmount:
    'ui:text-5xl ui:text-[var(--landing-fg)]' +
    ' ui:[font-weight:var(--landing-heading-weight)]' +
    ' ui:[letter-spacing:var(--landing-heading-tracking)]'
});
