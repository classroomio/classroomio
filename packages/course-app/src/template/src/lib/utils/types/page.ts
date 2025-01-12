export type Page = {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  sections: Section[];
};

export type Section = {
  settings: Record<string, any>;
  show: boolean;
  type: string;
};
