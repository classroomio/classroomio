export type NavItem = { label: string; href: string };

export type OrgLandingPageTheme =
  | 'minimal'
  | 'bold'
  | 'classic'
  | 'saas'
  | 'tech'
  | 'studio'
  | 'corporate'
  | 'terminal';

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

export interface OrgLandingPageProps {
  orgName: string;
  logoUrl?: string;
  navItems: NavItem[];
  authAction?: {
    label: string;
    href: string;
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
}
