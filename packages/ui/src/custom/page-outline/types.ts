export type PageOutlineLevel = 1 | 2 | 3;

export interface PageOutlineItem {
  id: string;
  title: string;
  level: PageOutlineLevel;
}

export type PageOutlineHideBelow = 'md' | 'lg' | 'xl' | 'never';
