export const ALTERNATIVE_SLUGS = [
  'skilljar',
  'learnupon',
  'docebo',
  'intellum',
  'thought-industries',
  'thinkific',
  'teachfloor',
  'teachable',
  'kajabi'
] as const;

export type CompetitorSlug = (typeof ALTERNATIVE_SLUGS)[number];

export const COMPETITOR_NAMES: Record<CompetitorSlug, string> = {
  skilljar: 'Skilljar',
  learnupon: 'LearnUpon',
  docebo: 'Docebo',
  intellum: 'Intellum',
  'thought-industries': 'Thought Industries',
  thinkific: 'Thinkific',
  teachfloor: 'Teachfloor',
  teachable: 'Teachable',
  kajabi: 'Kajabi'
};
