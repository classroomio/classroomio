export type Categories = 'sveltekit' | 'svelte';

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
