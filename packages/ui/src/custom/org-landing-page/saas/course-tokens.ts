import { tokenize, type CourseLandingTokens } from '../course-tokens-base';

export const courseTokens: CourseLandingTokens = tokenize({
  sectionShell: 'ui:py-12 ui:md:py-14 ui:px-4 ui:bg-[var(--landing-bg)]',
  infoGrid: 'ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:gap-6',
  infoBlock:
    'ui:flex ui:flex-col ui:gap-3 ui:p-8' +
    ' ui:border ui:border-[var(--landing-border)] ui:[border-radius:var(--landing-radius-card)]',
  reviewsGrid: 'ui:grid ui:grid-cols-1 ui:md:grid-cols-3 ui:gap-4',
  reviewCard: 'ui:p-6 ui:border ui:border-[var(--landing-border)] ui:[border-radius:var(--landing-radius-card)]',
  curriculumContainer:
    'ui:border ui:border-[var(--landing-border)]' + ' ui:[border-radius:var(--landing-radius-card)] ui:overflow-hidden',
  curriculumModule: 'ui:border-t ui:border-[var(--landing-border)] ui:first:border-t-0',
  curriculumModuleHeader:
    'ui:flex ui:flex-col ui:items-start ui:gap-2 ui:px-6 ui:py-4 ui:cursor-pointer ui:text-left ui:md:flex-row ui:md:items-center ui:md:justify-between ui:md:gap-4',
  curriculumLessonRow:
    'ui:flex ui:items-center ui:gap-3 ui:px-6 ui:py-3' + ' ui:border-t ui:border-[var(--landing-border)]/60',
  socialProofShell: 'ui:py-8 ui:px-4 ui:border-y ui:border-[var(--landing-border)]',
  pricingShell:
    'ui:p-8 ui:border ui:border-[var(--landing-border)]' +
    ' ui:[border-radius:var(--landing-radius-card)] ui:[box-shadow:var(--landing-shadow-card)]',
  instructorShell:
    'ui:flex ui:flex-col ui:md:flex-row ui:gap-6 ui:items-start ui:p-8' +
    ' ui:border ui:border-[var(--landing-border)] ui:[border-radius:var(--landing-radius-card)]',
  instructorAvatarWrap: 'ui:shrink-0',
  instructorBodyWrap: 'ui:flex-1',
  instructorAvatar: 'ui:size-24 ui:rounded-full ui:object-cover ui:border ui:border-[var(--landing-border)]',
  instructorBody: 'ui:text-sm ui:text-[var(--landing-fg-muted)] ui:leading-relaxed ui:mt-3'
});
