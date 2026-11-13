import * as z from 'zod';

export const PUBLIC_API_ANALYTICS_DAYS = [7, 30, 90, 365] as const;

const toList = (value: unknown) =>
  typeof value === 'string'
    ? value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : value;

export const includeOf = <T extends readonly [string, ...string[]]>(sections: T, fallback: T[number]) =>
  z
    .preprocess(toList, z.array(z.enum(sections)).min(1))
    .default([fallback])
    .describe(`Sections to return, comma-separated: ${sections.join(', ')}. Default: ${fallback}.`);

export const ZPublicApiAnalyticsDays = z.coerce
  .number()
  .pipe(z.literal(PUBLIC_API_ANALYTICS_DAYS, { error: 'days must be one of 7, 30, 90, 365' }))
  .default(30)
  .describe('Days counted back from today (UTC): 7, 30, 90 or 365. Default: 30.');

export const ZPublicApiGeneratedAtMeta = z.object({
  generatedAt: z
    .string()
    .nullable()
    .describe('When the oldest returned section was computed (ISO 8601); null when no section was returned')
});
