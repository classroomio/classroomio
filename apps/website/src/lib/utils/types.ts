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

export type FORM_TYPE_KEY = keyof typeof FORM_TYPE;

export enum FORM_TYPE {
  BUG = 'BUG',
  HELP = 'HELP',
  FEATURE = 'FEATURE',
  FEEDBACK = 'FEEDBACK'
}
