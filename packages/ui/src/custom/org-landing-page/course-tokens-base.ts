export type CourseLandingTokens = {
  sectionShell: string;
  sectionInner: string;
  sectionHeader: string;
  eyebrow: string;
  heading: string;
  body: string;
  headingRule: string;

  socialProofShell: string;
  socialProofItem: string;
  socialProofValue: string;
  socialProofLabel: string;
  socialProofDivider: string;

  infoGrid: string;
  infoBlock: string;
  infoBlockEyebrow: string;
  infoBlockHeading: string;
  infoBlockBody: string;
  infoCertificateFrame: string;
  certificateShell: string;
  certificateFrame: string;

  sectionNavShell: string;
  sectionNavInner: string;
  sectionNavList: string;
  sectionNavItem: string;
  sectionNavItemActive: string;

  chipsSectionShell: string;
  chipsGroupHeading: string;
  chipsGroup: string;
  chip: string;
  chipsShowAll: string;

  curriculumContainer: string;
  curriculumModule: string;
  curriculumModuleHeader: string;
  curriculumModuleTitle: string;
  curriculumModuleMeta: string;
  curriculumLessonRow: string;
  curriculumLessonPrefix: string;
  curriculumLessonTitle: string;
  curriculumLessonIcon: string;

  instructorShell: string;
  instructorAvatarWrap: string;
  instructorBodyWrap: string;
  instructorAvatar: string;
  instructorName: string;
  instructorRole: string;
  instructorMeta: string;
  instructorBody: string;

  reviewsAverage: string;
  reviewsAverageValue: string;
  reviewsAverageLabel: string;
  reviewsGrid: string;
  reviewCard: string;
  reviewStars: string;
  reviewStar: string;
  reviewQuote: string;
  reviewName: string;
  reviewDate: string;

  pricingShell: string;
  pricingHeader: string;
  pricingEyebrow: string;
  pricingAmount: string;
  pricingCurrency: string;
  pricingDiscount: string;
  pricingFreeBadge: string;
  pricingFeatures: string;
  pricingFeature: string;
  pricingFeatureIcon: string;
  pricingCta: string;
  pricingRewardShell: string;
  pricingRewardLabel: string;
  pricingSavingsBadge: string;
};

export const baseCourseTokens: CourseLandingTokens = {
  sectionShell: 'ui:py-12 ui:md:py-14 ui:px-4',
  sectionInner: 'ui:max-w-[1200px] ui:mx-auto',
  sectionHeader: 'ui:flex ui:flex-col ui:gap-2 ui:mb-6',
  eyebrow:
    'ui:text-xs ui:text-[var(--landing-fg-muted)]' +
    ' ui:[letter-spacing:var(--landing-eyebrow-tracking)]' +
    ' ui:[text-transform:var(--landing-eyebrow-case)]',
  heading:
    'ui:text-3xl ui:md:text-4xl ui:text-[var(--landing-fg)]' +
    ' ui:[font-weight:var(--landing-heading-weight)]' +
    ' ui:[letter-spacing:var(--landing-heading-tracking)]' +
    ' ui:[text-transform:var(--landing-heading-case)]',
  body: 'ui:text-base ui:text-[var(--landing-fg-muted)] ui:leading-relaxed',
  headingRule: 'ui:hidden',

  socialProofShell: 'ui:py-8 ui:px-4 ui:border-y ui:border-[var(--landing-border)]',
  socialProofItem: 'ui:flex ui:flex-col ui:items-center ui:gap-1 ui:text-[var(--landing-fg)]',
  socialProofValue: 'ui:text-2xl ui:[font-weight:var(--landing-heading-weight)]',
  socialProofLabel:
    'ui:text-xs ui:text-[var(--landing-fg-muted)] ui:[letter-spacing:var(--landing-eyebrow-tracking)] ui:[text-transform:var(--landing-eyebrow-case)]',
  socialProofDivider: 'ui:w-px ui:h-10 ui:bg-[var(--landing-border)] ui:opacity-60',

  infoGrid: 'ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:gap-12',
  infoBlock: 'ui:flex ui:flex-col ui:gap-3' + ' ui:pt-8 ui:border-t ui:border-[var(--landing-border)]',
  infoBlockEyebrow:
    'ui:text-xs ui:text-[var(--landing-fg-muted)]' +
    ' ui:[letter-spacing:var(--landing-eyebrow-tracking)]' +
    ' ui:[text-transform:var(--landing-eyebrow-case)]',
  infoBlockHeading:
    'ui:text-2xl ui:text-[var(--landing-fg)]' +
    ' ui:[font-weight:var(--landing-heading-weight)]' +
    ' ui:[letter-spacing:var(--landing-heading-tracking)]',
  infoBlockBody:
    'ui:text-base ui:text-[var(--landing-fg-muted)] ui:leading-relaxed' +
    ' ui:[&_p]:mb-2 ui:[&_ul]:list-disc ui:[&_ul]:pl-5 ui:[&_li]:mb-1',
  infoCertificateFrame:
    'ui:overflow-hidden ui:border ui:border-[var(--landing-border)]' + ' ui:[border-radius:var(--landing-radius-card)]',
  certificateShell:
    'ui:p-6 ui:md:p-8 ui:border ui:border-[var(--landing-border)]' +
    ' ui:[border-radius:var(--landing-radius-card)]' +
    ' ui:bg-[var(--landing-card)] ui:[box-shadow:var(--landing-shadow-card)]',
  certificateFrame:
    'ui:overflow-hidden ui:border ui:border-[var(--landing-border)]' +
    ' ui:[border-radius:var(--landing-radius-card)]' +
    ' ui:max-w-[260px] ui:w-full',

  sectionNavShell: 'ui:border-b ui:border-[var(--landing-border)] ui:bg-[var(--landing-bg)]',
  sectionNavInner: 'ui:max-w-[1200px] ui:mx-auto ui:px-4',
  sectionNavList: 'ui:border-b-0 ui:w-full',
  sectionNavItem: '',
  sectionNavItemActive: '',

  chipsSectionShell: 'ui:flex ui:flex-col ui:gap-10',
  chipsGroupHeading:
    'ui:text-2xl ui:md:text-3xl ui:text-[var(--landing-fg)] ui:mb-5' +
    ' ui:[font-weight:var(--landing-heading-weight)]' +
    ' ui:[letter-spacing:var(--landing-heading-tracking)]',
  chipsGroup: 'ui:flex ui:flex-wrap ui:gap-2.5 ui:items-center',
  chip:
    'ui:inline-flex ui:items-center ui:px-4 ui:py-2 ui:text-sm ui:text-[var(--landing-fg)]' +
    ' ui:border ui:border-[var(--landing-border)] ui:bg-transparent' +
    ' ui:[border-radius:var(--landing-radius-pill)]' +
    ' ui:hover:border-[var(--landing-accent)] ui:transition-colors',
  chipsShowAll:
    'ui:text-sm ui:text-[var(--landing-fg)] ui:underline ui:underline-offset-4' +
    ' ui:[font-weight:var(--landing-heading-weight)] ui:cursor-pointer ui:ml-2 ui:bg-transparent ui:border-0',

  curriculumContainer: 'ui:flex ui:flex-col',
  curriculumModule: 'ui:border-t ui:border-[var(--landing-border)]' + ' ui:last:border-b ui:py-2',
  curriculumModuleHeader:
    'ui:flex ui:flex-col ui:items-start ui:gap-2 ui:py-4 ui:cursor-pointer ui:text-left' +
    ' ui:md:flex-row ui:md:items-center ui:md:justify-between ui:md:gap-4',
  curriculumModuleTitle:
    'ui:text-base ui:md:text-lg ui:text-[var(--landing-fg)]' + ' ui:[font-weight:var(--landing-heading-weight)]',
  curriculumModuleMeta: 'ui:text-xs ui:text-[var(--landing-fg-muted)] ui:font-mono',
  curriculumLessonRow:
    'ui:flex ui:items-center ui:gap-3 ui:py-3 ui:pl-2' + ' ui:border-t ui:border-[var(--landing-border)]/60',
  curriculumLessonPrefix: 'ui:text-xs ui:text-[var(--landing-fg-muted)] ui:font-mono ui:min-w-[3ch]',
  curriculumLessonTitle: 'ui:text-sm ui:text-[var(--landing-fg)]',
  curriculumLessonIcon: 'ui:text-[var(--landing-fg-muted)]',

  instructorShell:
    'ui:flex ui:flex-col ui:md:flex-row ui:gap-6 ui:items-start' +
    ' ui:p-6 ui:md:p-8 ui:border ui:border-[var(--landing-border)]' +
    ' ui:[border-radius:var(--landing-radius-card)]' +
    ' ui:[box-shadow:var(--landing-shadow-card)]',
  instructorAvatarWrap: 'ui:shrink-0',
  instructorBodyWrap: 'ui:flex-1 ui:p-6',

  instructorAvatar: 'ui:size-20 ui:rounded-full ui:object-cover ui:border ui:border-[var(--landing-border)]',
  instructorName: 'ui:text-xl ui:text-[var(--landing-fg)]' + ' ui:[font-weight:var(--landing-heading-weight)]',
  instructorRole: 'ui:text-sm ui:text-[var(--landing-fg-muted)]',
  instructorMeta: 'ui:text-xs ui:text-[var(--landing-fg-faint)] ui:mt-1',
  instructorBody: 'ui:text-sm ui:text-[var(--landing-fg-muted)] ui:leading-relaxed ui:mt-3',

  reviewsAverage: 'ui:flex ui:items-center ui:gap-3 ui:mb-8 ui:text-[var(--landing-fg)]',
  reviewsAverageValue: 'ui:text-3xl ui:[font-weight:var(--landing-heading-weight)]',
  reviewsAverageLabel: 'ui:text-sm ui:text-[var(--landing-fg-muted)]',
  reviewsGrid: 'ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:gap-4',
  reviewCard:
    'ui:p-6 ui:border ui:border-[var(--landing-border)] ui:bg-[var(--landing-card)]' +
    ' ui:[border-radius:var(--landing-radius-card)]' +
    ' ui:[box-shadow:var(--landing-shadow-card)]',
  reviewStars: 'ui:flex ui:items-center ui:gap-0.5 ui:mb-3',
  reviewStar: 'ui:text-[var(--landing-accent)] ui:size-4',
  reviewQuote: 'ui:text-sm ui:text-[var(--landing-fg)] ui:leading-relaxed ui:mb-4',
  reviewName: 'ui:text-sm ui:text-[var(--landing-fg)] ui:font-medium',
  reviewDate: 'ui:text-xs ui:text-[var(--landing-fg-muted)]',

  pricingShell:
    'ui:p-6 ui:border ui:border-[var(--landing-border)] ui:bg-[var(--landing-card)]' +
    ' ui:[border-radius:var(--landing-radius-card)]' +
    ' ui:[box-shadow:var(--landing-shadow-card)]',
  pricingHeader: 'ui:flex ui:flex-col ui:gap-2 ui:mb-6',
  pricingEyebrow:
    'ui:text-xs ui:text-[var(--landing-fg-muted)]' +
    ' ui:[letter-spacing:var(--landing-eyebrow-tracking)]' +
    ' ui:[text-transform:var(--landing-eyebrow-case)]',
  pricingAmount:
    'ui:text-4xl ui:md:text-5xl ui:text-[var(--landing-fg)]' +
    ' ui:[font-weight:var(--landing-heading-weight)]' +
    ' ui:[letter-spacing:var(--landing-heading-tracking)]',
  pricingCurrency: 'ui:text-base ui:text-[var(--landing-fg-muted)] ui:font-normal ui:ml-1',
  pricingDiscount: 'ui:text-sm ui:text-[var(--landing-fg-muted)] ui:line-through',
  pricingFreeBadge:
    'ui:inline-block ui:px-3 ui:py-1 ui:text-xs ui:text-[var(--landing-accent-fg)]' +
    ' ui:bg-[var(--landing-accent)]' +
    ' ui:[border-radius:var(--landing-radius-pill)]' +
    ' ui:[letter-spacing:var(--landing-eyebrow-tracking)]' +
    ' ui:[text-transform:var(--landing-eyebrow-case)]',
  pricingFeatures: 'ui:flex ui:flex-col ui:gap-2 ui:mb-6',
  pricingFeature: 'ui:flex ui:items-center ui:gap-2 ui:text-sm ui:text-[var(--landing-fg)]',
  pricingFeatureIcon: 'ui:text-[var(--landing-accent)]',
  pricingCta: 'ui:w-full',
  pricingRewardShell:
    'ui:mt-4 ui:p-3 ui:border ui:border-dashed ui:border-[var(--landing-border)]' +
    ' ui:[border-radius:var(--landing-radius-card)]' +
    ' ui:text-xs ui:text-[var(--landing-fg-muted)]',
  pricingRewardLabel: 'ui:text-[var(--landing-fg)] ui:[font-weight:var(--landing-heading-weight)]',
  pricingSavingsBadge: 'ui:text-xs ui:text-[var(--landing-accent)]' + ' ui:[font-weight:var(--landing-heading-weight)]'
};

export function tokenize(overrides: Partial<CourseLandingTokens>): CourseLandingTokens {
  return { ...baseCourseTokens, ...overrides };
}
