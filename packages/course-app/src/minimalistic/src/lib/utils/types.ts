export type LandingPageContent = {
  header: {
    title: string;
    titleHighlight: string;
    subtitle: string;
    action: {
      label: string;
      link: string;
      redirect: boolean;
    };
    banner: {
      video?: string;
      image?: string;
      type: 'video' | 'image';
      show: boolean;
    };
    show: boolean;
  };
  courseHeader: {
    title: string;
    titleHighlight: string;
    subtitle: string;
    action: {
      label: string;
      link: string;
      redirect: boolean;
    };
    banner: {
      video?: string;
      image?: string;
      type: 'video' | 'image';
      show: boolean;
    };
    show: boolean;
  };
  aboutUs: {
    title: string;
    subtitle: string;
    imageUrl: string;
    benefits: {
      title: string;
      list: Array<{
        title: string;
        subtitle: string;
      }>;
    };
    show: boolean;
  };
  courses: {
    title: string;
    titleHighlight: string;
    subtitle: string;
    show: boolean;
  };
  pathway: {
    title: string;
    titleHighlight: string;
    subtitle: string;
    show: boolean;
  };
  faq: {
    title: string;
    questions: Array<{
      id: number;
      title: string;
      content: string;
    }>;
    show: boolean;
  };
  contact: {
    title: string;
    titleHighlight: string;
    subtitle: string;
    address: string;
    phone: string;
    email: string;
    show: boolean;
  };
  footerNote: {
    title: string;
    titleHighlight: string;
    subtitle: string;
    buttonLabel: string;
    show: boolean;
  };
  mailinglist: {
    title: string;
    subtitle: string;
    buttonLabel: string;
    show: boolean;
  };
  footer: {
    facebook: string;
    instagram: string;
    twitter: string;
    linkedin: string;
    show: boolean;
  };
};

export type CourseMetadata = {
  title: string;
  description: string;
  banner: string;
  created_at: string;
  cost: number;
  currency: string;
  type: string;
  slug?: string;
};

export type Lesson = {
  title: string;
  position: number;
  filename: string;
};
