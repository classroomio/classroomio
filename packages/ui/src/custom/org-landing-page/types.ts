export type NavItem = { label: string; href: string };

export type OrgLandingPageTheme = 'minimal' | 'bold' | 'classic';

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

export type FooterLink = { label: string; href: string };
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
  };
  courses: CourseItem[];
  hasMoreCourses?: boolean;
  disableCourseLinks?: boolean;
  embed?: LandingPageEmbed;
  callout?: LandingPageCallout;
  footerLinks: FooterLink[];
  footerText: string;
}
