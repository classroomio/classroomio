import { tokenize, type CourseLandingTokens } from '../course-tokens-base';

export const courseTokens: CourseLandingTokens = tokenize({
  sectionShell: 'ui:py-12 ui:md:py-14 ui:px-4 ui:bg-[var(--landing-bg)]',
  eyebrow:
    'ui:flex ui:items-center ui:gap-1.5 ui:text-xs ui:text-[var(--landing-fg-muted)]' +
    ' ui:before:content-[""] ui:before:size-1.5 ui:before:rounded-full ui:before:bg-[var(--landing-accent)]' +
    ' ui:[letter-spacing:var(--landing-eyebrow-tracking)]',
  socialProofShell: 'ui:py-8 ui:px-4 ui:border-y ui:border-[var(--landing-border)]',
  socialProofItem:
    'ui:flex ui:items-center ui:gap-2 ui:px-4 ui:py-3' +
    ' ui:[border-radius:var(--landing-radius-card)] ui:border ui:border-[var(--landing-border)]/60',
  socialProofDivider: 'ui:hidden',
  infoBlock:
    'ui:flex ui:flex-col ui:gap-3 ui:p-6' +
    ' ui:border ui:border-[var(--landing-border)] ui:[border-radius:var(--landing-radius-card)]',
  curriculumModule:
    'ui:mb-3 ui:p-4' + ' ui:border ui:border-[var(--landing-border)] ui:[border-radius:var(--landing-radius-card)]',
  curriculumLessonRow: 'ui:flex ui:items-center ui:gap-3 ui:py-2 ui:pl-4 ui:text-sm',
  instructorShell:
    'ui:flex ui:flex-col ui:md:flex-row ui:gap-6 ui:items-start ui:p-6' +
    ' ui:border ui:border-[var(--landing-border)] ui:[border-radius:var(--landing-radius-card)]',
  instructorAvatar: 'ui:size-16 ui:object-cover ui:[border-radius:var(--landing-radius-card)]',
  reviewCard: 'ui:p-5 ui:border ui:border-[var(--landing-border)]' + ' ui:[border-radius:var(--landing-radius-card)]',
  pricingShell: 'ui:p-6 ui:border ui:border-[var(--landing-border)]' + ' ui:[border-radius:var(--landing-radius-card)]'
});
