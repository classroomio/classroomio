import * as z from 'zod';

export const SCORM_RESULTS_SORTS = ['name', 'score', 'status', 'attempts', 'last_launched'] as const;
export type TScormResultsSort = (typeof SCORM_RESULTS_SORTS)[number];

export const SCORM_RESULTS_DIRECTIONS = ['asc', 'desc'] as const;

export const ZScormResultsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(SCORM_RESULTS_SORTS).default('last_launched'),
  direction: z.enum(SCORM_RESULTS_DIRECTIONS).default('desc')
});
export type TScormResultsQuery = z.infer<typeof ZScormResultsQuery>;

export const ZScormResultsProfileParam = z.object({
  profileId: z.string().uuid()
});
export type TScormResultsProfileParam = z.infer<typeof ZScormResultsProfileParam>;
