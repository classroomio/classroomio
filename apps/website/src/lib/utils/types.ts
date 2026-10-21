export type Categories = 'sveltekit' | 'svelte';

export type RawBlogPost = {
  metadata: BlogPost;
  default: any;
};

export type BlogPost = {
  title: string;
  slug: string;
  description: string;
  tags: string[];
  author: string;
  imageUrl: string;
  role: string;
  avatar: string;
  date: string;
  categories: Categories[];
  published: boolean;
};

export type OssFriend = {
  name: string;
  description: string;
  href: string;
};

export type TestimonialSegment = {
  text: string;
  highlight?: boolean;
};

export type Testimonial = {
  id: string;
  quote: TestimonialSegment[];
  name: string;
  role: string;
  avatar: string;
};

export type ChangelogEntry = {
  id: string;
  title: string;
  summary: string | null;
  url: string;
  videoId: string | null;
  coverUrl: string | null;
  publishedAt: string;
  tags: string[];
};
