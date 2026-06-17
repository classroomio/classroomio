import type { Component } from 'svelte';

export type NavItem = { label: string; href: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = Component<any>;

export type LandingPageThemeBundle = {
  nav: AnyComponent;
  hero: AnyComponent;
  courseCard: AnyComponent;
  org: AnyComponent;
  course: AnyComponent;
  coursesGridClass: string;
};

export type OrgLandingPageTheme =
  | 'minimal'
  | 'bold'
  | 'classic'
  | 'saas'
  | 'tech'
  | 'studio'
  | 'corporate'
  | 'terminal'
  | 'editorial'
  | 'vibrant';

export type CourseItem = {
  id: string;
  slug?: string;
  logo?: string | null;
  title: string;
  description: string;
  type?: string;
  isPublished?: boolean;
  cost?: number;
  currency?: string;
  lessonCount?: number;
  exerciseCount?: number;
  totalStudents?: number;
  metadata?: {
    discount?: number;
    showDiscount?: boolean;
  };
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
    color?: string | null;
  }>;
  // Fallbacks for specific templates that might still want to use these
  image?: string;
  link?: string;
  price?: string;
  duration?: string;
  level?: string;
};

export type FooterSocialPlatform =
  | 'instagram'
  | 'x'
  | 'linkedin'
  | 'facebook'
  | 'youtube'
  | 'github'
  | 'tiktok'
  | 'website';

export type FooterSocial = { platform: FooterSocialPlatform; href: string };

export type FooterColumnLink = { id: string; label: string; href: string };

export type FooterColumn = {
  id: string;
  heading: string;
  links: FooterColumnLink[];
  cta?: { label: string; href: string };
};

export type OrgLandingPageFooterConfig = {
  brand: {
    tagline?: string;
    copyright?: string;
    socials: FooterSocial[];
  };
  columns: FooterColumn[];
  bottom?: {
    text?: string;
    links: FooterColumnLink[];
  };
};
export type LandingPageEmbed = {
  title: string;
  description?: string;
  code: string;
  secondaryAction?: {
    label: string;
    href: string;
  };
};

export type LandingPageCallout = {
  heading: string;
  description: string;
  action: {
    label: string;
    href: string;
  };
};

export type LandingPageLinkIcon =
  | 'help-circle'
  | 'life-buoy'
  | 'book-open'
  | 'video'
  | 'users'
  | 'message-circle'
  | 'newspaper'
  | 'rocket'
  | 'calendar'
  | 'mail';

export type LandingPageLinkCard = {
  icon: LandingPageLinkIcon;
  title: string;
  description: string;
  href: string;
};

export type LandingPageLinks = {
  heading: string;
  description?: string;
  /** Bold template card footer chip (e.g. Visit). */
  boldVisitLabel?: string;
  /** Classic template card footer (e.g. Learn more). */
  classicLearnMoreLabel?: string;
  cards: LandingPageLinkCard[];
};

/**
 * Localizable UI chrome strings used across landing templates.
 * Every field is optional; when absent, each template falls back to its own
 * English default that fits the template's voice. Consumers (e.g. dashboard
 * with translations) pass an object of resolved strings to override defaults
 * in one place rather than per template.
 */
export interface OrgLandingPageLabels {
  /** Eyebrow above the catalog section. Default per template (often "Catalog"). */
  catalogEyebrow?: string;
  /** Section heading for the catalog. Default per template (e.g. "Our Courses", "Courses starting this season."). */
  catalogHeading?: string;
  /** Optional description under the catalog heading. Default per template, only used where the template renders one. */
  catalogDescription?: string;
  /** Label for the catalog "browse all"/"view more" CTA. Default per template (e.g. "Browse all →", "View more courses"). */
  browseCoursesLabel?: string;
  /** Per-card CTA on a course card. Default: "Enroll" (Bold defaults to "Details"). */
  enrollLabel?: string;
  /** Displayed in place of the price when cost is 0. Default: "Free". */
  freeLabel?: string;
  /** Tag/badge prefix for a featured course (editorial hero, vibrant featured panel). Default: "Featured". */
  featuredLabel?: string;
  /** Filter chip label for "show all" in templates that render a filter bar. Default: "All". */
  filterAllLabel?: string;
  /** CTA for the featured-course block (vibrant). Default: "Start this course". */
  startCourseLabel?: string;
  /** Plural-aware lesson-count label. Default: `${count} lessons` / `1 lesson`. */
  lessonsLabel?: (count: number) => string;
  /** Plural-aware exercise-count label. Default: `${count} exercises` / `1 exercise`. */
  exercisesLabel?: (count: number) => string;
  /** Plural-aware enrolled-students label. Default: `${count} enrolled`. */
  enrolledLabel?: (count: number) => string;
  /** Eyebrow for the Resources/Links section. Default per template (typically "Resources"). */
  resourcesEyebrow?: string;
  /** Eyebrow for the Embed section in templates that render one (terminal). Default: "Embed". */
  embedEyebrow?: string;
  /** Eyebrow for the Callout section. Default per template (e.g. "Ready when you are", "Get started"). */
  calloutEyebrow?: string;
  /** Card footer CTA on the resources/links section. Default per template ("Learn more", "Visit"). Separate from the existing per-template `boldVisitLabel` / `classicLearnMoreLabel` on `LandingPageLinks`, which still apply to those specific templates. */
  learnMoreLabel?: string;
}

export type CourseCurriculumLesson = {
  id: string;
  title: string;
  durationMinutes?: number;
};

export type CourseCurriculumSection = {
  id: string;
  title: string;
  lessons: CourseCurriculumLesson[];
  exerciseCount?: number;
};

export type CourseReviewItem = {
  id: string;
  name: string;
  avatarUrl?: string;
  rating: number;
  description: string;
  createdAt?: string;
};

export type CourseInstructor = {
  name: string;
  role?: string;
  imgUrl?: string;
  description?: string;
  coursesNo?: number;
};

export type CoursePricing = {
  cost: number;
  currency: string;
  discount?: number;
  showDiscount?: boolean;
  ctaLabel: string;
  ctaHref?: string;
  features?: string[];
  reward?: {
    show: boolean;
    description: string;
  };
};

export type CourseSocialProof = {
  rating?: number;
  lessons?: number;
  type?: string;
  hasCertificate?: boolean;
};

export type CourseInfoBlocks = {
  requirements?: string;
  description?: string;
  goals?: string;
  certificateUrl?: string;
};

export type CourseChipSections = {
  skills?: string[];
  tools?: string[];
};

export type CourseCurriculum = {
  grouped: boolean;
  sections: CourseCurriculumSection[];
};

export interface CourseLandingPageLabels {
  socialProofRatingLabel?: string;
  socialProofLessonsLabel?: string;
  socialProofTypeLabel?: string;
  socialProofCertificateLabel?: string;
  curriculumEyebrow?: string;
  curriculumHeading?: string;
  lessonsLabel?: (count: number) => string;
  exercisesLabel?: (count: number) => string;
  lecturePrefix?: (index: number) => string;
  infoRequirementsHeading?: string;
  infoRequirementsEyebrow?: string;
  infoDescriptionHeading?: string;
  infoDescriptionEyebrow?: string;
  infoGoalsHeading?: string;
  infoGoalsEyebrow?: string;
  infoCertificateHeading?: string;
  infoCertificateEyebrow?: string;
  instructorEyebrow?: string;
  instructorHeading?: string;
  instructorCoursesLabel?: (count: number) => string;
  reviewsEyebrow?: string;
  reviewsHeading?: string;
  reviewsAverageLabel?: (count: number) => string;
  pricingEyebrow?: string;
  freeLabel?: string;
  pricingRewardLabel?: string;
  chipsSkillsEyebrow?: string;
  chipsSkillsHeading?: string;
  chipsToolsEyebrow?: string;
  chipsToolsHeading?: string;
  chipsShowAllLabel?: string;
  chipsShowLessLabel?: string;
  navAboutLabel?: string;
  navCurriculumLabel?: string;
  navSkillsLabel?: string;
  navInstructorLabel?: string;
  navReviewsLabel?: string;
  navPricingLabel?: string;
}

export interface CourseLandingPageProps {
  theme: OrgLandingPageTheme;
  orgName: string;
  logoUrl?: string;
  navItems: NavItem[];
  authAction?: {
    label: string;
    href: string;
    loading?: boolean;
    disabled?: boolean;
  };
  hero: {
    heading: string;
    subheading: string;
    primaryAction: { label: string; href: string; disabled?: boolean };
    secondaryAction?: { label: string; href: string };
    image?: string;
    stats?: Array<{ label: string; value: string }>;
  };
  socialProof: CourseSocialProof;
  info: CourseInfoBlocks;
  curriculum: CourseCurriculum;
  chips?: CourseChipSections;
  instructor: CourseInstructor;
  reviews: {
    items: CourseReviewItem[];
    averageRating?: number;
  };
  pricing: CoursePricing;
  footer: OrgLandingPageFooterConfig;
  labels?: CourseLandingPageLabels;
}

export interface OrgLandingPageProps {
  orgName: string;
  logoUrl?: string;
  navItems: NavItem[];
  authAction?: {
    label: string;
    href: string;
    loading?: boolean;
    disabled?: boolean;
  };
  hero: {
    heading: string;
    subheading: string;
    primaryAction: { label: string; href: string; disabled?: boolean };
    secondaryAction?: { label: string; href: string };
    image?: string;
    stats?: Array<{ label: string; value: string }>;
  };
  courses: CourseItem[];
  hasMoreCourses?: boolean;
  disableCourseLinks?: boolean;
  embed?: LandingPageEmbed;
  callout?: LandingPageCallout;
  links?: LandingPageLinks;
  footer: OrgLandingPageFooterConfig;
  /** Optional UI-chrome string overrides (eyebrows, CTA labels, plural-aware meta). */
  labels?: OrgLandingPageLabels;
}
