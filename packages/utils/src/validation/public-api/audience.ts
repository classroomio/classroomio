import * as z from 'zod';

import { AUDIENCE_IMPORT_MAX_ROWS } from '../organization/audience-import';

const ZPublicApiAudienceActivityWindow = z.enum(['7d', '30d', '90d', '180d', 'never']);

export const ZPublicApiAudienceQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  sortBy: z.enum(['createdAt', 'name', 'email', 'lastLoginAt', 'lastActiveAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.enum(['ACTIVE', 'DEACTIVATED', 'ARCHIVED']).default('ACTIVE'),
  inviteStatus: z.enum(['active', 'pending', 'expired', 'revoked']).optional(),
  enrollment: z.enum(['enrolled', 'not_enrolled']).optional(),
  completion: z.enum(['not_started', 'in_progress', 'completed']).optional(),
  lastLoginBefore: ZPublicApiAudienceActivityWindow.optional(),
  lastActiveBefore: ZPublicApiAudienceActivityWindow.optional(),
  excludeRecentJoiners: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .default(true)
    .transform((value) => value === true || value === 'true')
});
export type TPublicApiAudienceQuery = z.infer<typeof ZPublicApiAudienceQuery>;

export const ZPublicApiCreateAudience = z
  .object({
    email: z.string().trim().email().optional().describe('One person to invite. Send this or emails, not both'),
    emails: z
      .array(z.string().trim())
      .min(1)
      .max(AUDIENCE_IMPORT_MAX_ROWS)
      .optional()
      .describe(
        `Up to ${AUDIENCE_IMPORT_MAX_ROWS} people to invite in one request. An address that is not valid comes back as an invalid_email row instead of failing the request. Names are not taken here; set one with PUT /audience/{memberId} after the person joins`
      ),
    courseIds: z.array(z.string().uuid()).optional(),
    sendEmail: z.boolean().default(true).describe('Email the invite. Default: true; false adds them without an email.')
  })
  .refine((data) => (data.email === undefined) !== (data.emails === undefined), {
    message: 'Send email or emails, not both',
    path: ['emails']
  });
export type TPublicApiCreateAudience = z.infer<typeof ZPublicApiCreateAudience>;

const ZPublicApiMemberName = z.string().trim().min(3).max(120);

const SHARED_PROFILE_NOTE = 'The profile is shared, so the change shows in every organization the person belongs to.';

const MEMBER_NAME_DESCRIPTION =
  'Joined members only: sets the full name on their profile. The profile is shared, so the name shows in every organization the person belongs to.';

/**
 * Profile fields an org admin's key may set on a joined member, with the rules of Settings → Profile
 * (`ZUpdateProfile`). Declared here so a dashboard schema change can't silently change the public contract.
 */
export const ZPublicApiMemberProfileFields = {
  name: ZPublicApiMemberName.optional().describe(MEMBER_NAME_DESCRIPTION),
  username: z
    .string()
    .min(3)
    .optional()
    .describe(
      `Joined members only: sets their username. Usernames are unique across ClassroomIO, so a taken one returns 400. ${SHARED_PROFILE_NOTE}`
    ),
  avatarUrl: z
    .url({ protocol: /^https?$/ })
    .optional()
    .describe(
      `Joined members only: sets their profile picture to this http or https image URL. ${SHARED_PROFILE_NOTE}`
    ),
  locale: z
    .enum(['en', 'hi', 'fr', 'pt', 'de', 'vi', 'ru', 'es', 'pl', 'da', 'tr', 'it'])
    .optional()
    .describe(`Joined members only: sets the language ClassroomIO is shown in for them. ${SHARED_PROFILE_NOTE}`)
};

const ZPublicApiMemberProfile = z.object(ZPublicApiMemberProfileFields);
export type TPublicApiMemberProfileFields = z.infer<typeof ZPublicApiMemberProfile>;

export const MEMBER_PROFILE_EMAIL_NOTE =
  'The person is emailed which profile fields changed; email and password stay with the person.';

export function hasMemberProfileField(data: TPublicApiMemberProfileFields) {
  return (
    data.name !== undefined || data.username !== undefined || data.avatarUrl !== undefined || data.locale !== undefined
  );
}

export const ZPublicApiUpdateAudience = z
  .object({
    email: z
      .string()
      .email()
      .optional()
      .describe('Pending members only: corrects the invited email and re-sends the invite unless sendEmail is false'),
    sendEmail: z.boolean().default(true).describe('Whether to email the new invite when email changes'),
    ...ZPublicApiMemberProfileFields
  })
  .refine((data) => data.email !== undefined || hasMemberProfileField(data), { message: 'No fields to update' })
  .refine((data) => data.email === undefined || !hasMemberProfileField(data), {
    message:
      'Send email or profile fields, not both: email is for pending members and name, username, avatarUrl and locale are for joined members'
  })
  .describe(
    `Send email for a pending member, or any of name, username, avatarUrl and locale for a joined member. ${MEMBER_PROFILE_EMAIL_NOTE} To change an admin's or tutor's role, use PUT /team/{memberId}.`
  );
export type TPublicApiUpdateAudience = z.infer<typeof ZPublicApiUpdateAudience>;

export const ZPublicApiAssignAudienceCourses = z
  .object({
    profileIds: z.array(z.uuid()).min(1).max(500),
    courseIds: z.array(z.uuid()).optional(),
    cohortIds: z.array(z.uuid()).optional(),
    sendEmail: z.boolean().default(true)
  })
  .refine((data) => (data.courseIds?.length ?? 0) > 0 || (data.cohortIds?.length ?? 0) > 0, {
    message: 'At least one course or cohort must be selected',
    path: ['courseIds']
  });
export type TPublicApiAssignAudienceCourses = z.infer<typeof ZPublicApiAssignAudienceCourses>;

export const ZPublicApiAudienceMemberParam = z.object({
  memberId: z.coerce.number().int().positive()
});
export type TPublicApiAudienceMemberParam = z.infer<typeof ZPublicApiAudienceMemberParam>;
