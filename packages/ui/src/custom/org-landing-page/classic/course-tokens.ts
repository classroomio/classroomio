import { tokenize, type CourseLandingTokens } from '../course-tokens-base';

export const courseTokens: CourseLandingTokens = tokenize({
  sectionHeader: 'ui:flex ui:flex-col ui:items-center ui:text-center ui:gap-3 ui:mb-10',
  heading:
    'ui:text-3xl ui:md:text-4xl ui:text-[var(--landing-fg)] ui:text-center' +
    ' ui:[font-weight:var(--landing-heading-weight)]',
  body: 'ui:text-base ui:text-[var(--landing-fg-muted)] ui:leading-relaxed ui:text-center',
  headingRule: 'ui:h-px ui:w-16 ui:bg-[var(--landing-accent)] ui:mx-auto ui:mt-2',
  socialProofShell: 'ui:py-8 ui:px-4 ui:border-y ui:border-[var(--landing-border)] ui:text-center',
  socialProofItem: 'ui:flex ui:flex-col ui:items-center ui:gap-1 ui:text-[var(--landing-fg)]',
  socialProofDivider: 'ui:w-px ui:h-10 ui:bg-[var(--landing-border)]',
  infoGrid: 'ui:flex ui:flex-col ui:items-center ui:gap-16 ui:max-w-3xl ui:mx-auto',
  infoBlock: 'ui:flex ui:flex-col ui:items-center ui:text-center ui:gap-3 ui:w-full',
  infoBlockBody: 'ui:text-base ui:text-[var(--landing-fg-muted)] ui:leading-relaxed ui:text-center',
  reviewsGrid: 'ui:grid ui:grid-cols-1 ui:md:grid-cols-3 ui:gap-6 ui:justify-items-center',
  reviewCard:
    'ui:p-6 ui:border ui:border-[var(--landing-border)] ui:bg-[var(--landing-card)]' +
    ' ui:[border-radius:var(--landing-radius-card)] ui:text-center',
  instructorShell: 'ui:flex ui:flex-col ui:items-center ui:text-center ui:gap-3 ui:max-w-2xl ui:mx-auto',
  instructorAvatar: 'ui:size-28 ui:rounded-full ui:object-cover ui:border-2 ui:border-[var(--landing-accent)]',
  pricingShell:
    'ui:p-8 ui:border ui:border-[var(--landing-border)] ui:bg-[var(--landing-card)]' +
    ' ui:[border-radius:var(--landing-radius-card)] ui:text-center'
});
