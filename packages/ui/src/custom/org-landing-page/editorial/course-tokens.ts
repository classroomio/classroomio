import { tokenize, type CourseLandingTokens } from '../course-tokens-base';

export const courseTokens: CourseLandingTokens = tokenize({
  sectionShell: 'ui:py-12 ui:md:py-14 ui:px-4 ui:bg-[var(--landing-bg)]',
  eyebrow:
    'ui:text-xs ui:text-[var(--landing-accent)]' +
    ' ui:[letter-spacing:var(--landing-eyebrow-tracking)]' +
    ' ui:[text-transform:var(--landing-eyebrow-case)]',
  heading:
    'ui:text-4xl ui:md:text-5xl ui:text-[var(--landing-fg)]' +
    ' ui:[font-weight:var(--landing-heading-weight)]' +
    ' ui:[letter-spacing:var(--landing-heading-tracking)]',
  body:
    'ui:text-lg ui:text-[var(--landing-fg-muted)] ui:leading-relaxed' +
    ' ui:[letter-spacing:var(--landing-heading-tracking)]',
  socialProofShell: 'ui:py-8 ui:px-4 ui:border-y ui:border-[var(--landing-border)]',
  socialProofValue:
    'ui:text-3xl ui:text-[var(--landing-fg)]' +
    ' ui:[font-weight:var(--landing-heading-weight)]' +
    ' ui:[letter-spacing:var(--landing-heading-tracking)]',
  socialProofLabel:
    'ui:text-xs ui:text-[var(--landing-accent)]' +
    ' ui:[letter-spacing:var(--landing-eyebrow-tracking)]' +
    ' ui:[text-transform:var(--landing-eyebrow-case)]',
  infoBlock: 'ui:flex ui:flex-col ui:gap-3 ui:pt-10 ui:border-t ui:border-[var(--landing-border)]',
  infoBlockHeading:
    'ui:text-3xl ui:md:text-4xl ui:text-[var(--landing-fg)]' +
    ' ui:[font-weight:var(--landing-heading-weight)]' +
    ' ui:[letter-spacing:var(--landing-heading-tracking)]',
  infoBlockBody:
    'ui:text-base ui:md:text-lg ui:text-[var(--landing-fg)] ui:leading-relaxed' +
    ' ui:first-letter:text-5xl ui:first-letter:[font-weight:var(--landing-heading-weight)]' +
    ' ui:first-letter:float-left ui:first-letter:mr-2 ui:first-letter:leading-none' +
    ' ui:first-letter:text-[var(--landing-accent)]',
  curriculumModule: 'ui:border-t ui:border-[var(--landing-border)] ui:py-2 ui:last:border-b',
  curriculumModuleHeader:
    'ui:flex ui:flex-col ui:items-start ui:gap-2 ui:py-5 ui:cursor-pointer ui:text-left ui:md:flex-row ui:md:items-baseline ui:md:justify-between ui:md:gap-4',
  curriculumModuleTitle:
    'ui:text-2xl ui:md:text-3xl ui:text-[var(--landing-fg)]' +
    ' ui:[font-weight:var(--landing-heading-weight)]' +
    ' ui:[letter-spacing:var(--landing-heading-tracking)]',
  curriculumModuleMeta:
    'ui:text-xs ui:text-[var(--landing-accent)]' +
    ' ui:[letter-spacing:var(--landing-eyebrow-tracking)]' +
    ' ui:[text-transform:var(--landing-eyebrow-case)]',
  curriculumLessonPrefix:
    'ui:text-base ui:text-[var(--landing-accent)]' + ' ui:[font-weight:var(--landing-heading-weight)]',
  reviewCard: 'ui:p-0 ui:border-t ui:border-[var(--landing-border)] ui:pt-6 ui:bg-transparent',
  reviewStar: 'ui:text-[var(--landing-accent)] ui:size-4',
  reviewQuote:
    'ui:text-base ui:italic ui:text-[var(--landing-fg)] ui:leading-relaxed ui:mb-4' +
    ' ui:before:content-["“"] ui:before:text-[var(--landing-accent)] ui:before:text-2xl ui:before:mr-1',
  instructorShell: 'ui:flex ui:flex-col ui:md:flex-row ui:gap-8 ui:items-start',
  instructorAvatar: 'ui:size-32 ui:rounded-full ui:object-cover',
  instructorName:
    'ui:text-2xl ui:text-[var(--landing-fg)]' +
    ' ui:[font-weight:var(--landing-heading-weight)]' +
    ' ui:[letter-spacing:var(--landing-heading-tracking)]',
  instructorRole:
    'ui:text-sm ui:text-[var(--landing-accent)]' +
    ' ui:[letter-spacing:var(--landing-eyebrow-tracking)]' +
    ' ui:[text-transform:var(--landing-eyebrow-case)]',
  pricingShell: 'ui:p-8 ui:border-t-2 ui:border-b-2 ui:border-[var(--landing-fg)] ui:bg-[var(--landing-bg)]',
  pricingAmount:
    'ui:text-5xl ui:md:text-6xl ui:text-[var(--landing-fg)]' +
    ' ui:[font-weight:var(--landing-heading-weight)]' +
    ' ui:[letter-spacing:var(--landing-heading-tracking)]'
});
