export interface PublicLandingCourse {
  id: string;
  title: string;
  description: string;
  bannerImage?: string | null;
  isPaid: boolean;
  cost?: number;
  currency?: string;
  href: string;
}

export interface PublicLandingLinkItem {
  label: string;
  href: string;
}

export interface PublicLandingPageViewModel {
  theme: string;
  templateId: string;
  locale: string;
  organization: {
    id: string;
    name: string;
    siteName: string;
    avatarUrl?: string;
  };
  hero: {
    heading: string;
    subheading?: string;
    eyebrow?: string;
    image?: string;
    stats?: Array<{ label: string; value: string }>;
    primaryAction?: PublicLandingLinkItem;
    secondaryAction?: PublicLandingLinkItem;
  };
  navigation?: {
    navItems: PublicLandingLinkItem[];
    signInLabel?: string;
    accountLabel?: string;
    isAuthenticated?: boolean;
  };
  courses: PublicLandingCourse[];
  hasMoreCourses: boolean;
  links?: {
    title?: string;
    items: PublicLandingLinkItem[];
  };
  callout?: {
    title?: string;
    description?: string;
    action?: PublicLandingLinkItem;
  };
  embed?: {
    type: 'youtube' | 'vimeo' | 'loom' | 'custom';
    url: string;
    aspectRatio?: string;
  };
  footer?: {
    text?: string;
    links: PublicLandingLinkItem[];
    socialLinks: Array<{ platform: string; href: string }>;
  };
}
