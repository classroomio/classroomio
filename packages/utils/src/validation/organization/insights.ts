import * as z from 'zod';

export const ORG_PEOPLE_ROLE_FILTERS = ['all', 'students', 'tutors', 'admins'] as const;

export type TOrgPeopleRoleFilter = (typeof ORG_PEOPLE_ROLE_FILTERS)[number];

export const ZOrgPeopleQuery = z.object({
  role: z.enum(ORG_PEOPLE_ROLE_FILTERS).default('all'),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});
export type TOrgPeopleQuery = z.infer<typeof ZOrgPeopleQuery>;
