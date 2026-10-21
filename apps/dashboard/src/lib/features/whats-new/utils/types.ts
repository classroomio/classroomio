export type WhatsNewEntry = {
  id: string;
  title: string;
  summary: string | null;
  url: string;
  videoId: string | null;
  coverUrl: string | null;
  publishedAt: string;
  tags: string[];
};

export type WhatsNewResponse = {
  entries: WhatsNewEntry[];
};
