import * as z from 'zod';

import { AUDIENCE_BULK_IDS_MAX } from '../organization/audience';
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
        `Up to ${AUDIENCE_IMPORT_MAX_ROWS} addresses. An invalid one comes back as an invalid_email row; set names later with PUT /audience/{memberId}.`
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

const SHARED_PROFILE_NOTE = 'The profile is shared across organizations.';

const MEMBER_NAME_DESCRIPTION =
  'Joined members only: the full name on their profile. The profile is shared across organizations.';

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
    .describe(`Joined members only; must be unique across ClassroomIO (400 if taken). ${SHARED_PROFILE_NOTE}`),
  avatarUrl: z
    .url({ protocol: /^https?$/ })
    .optional()
    .describe(`Joined members only: an http or https image URL. ${SHARED_PROFILE_NOTE}`),
  locale: z
    .enum(['en', 'hi', 'fr', 'pt', 'de', 'vi', 'ru', 'es', 'pl', 'da', 'tr', 'it'])
    .optional()
    .describe(`Joined members only: the language ClassroomIO is shown in. ${SHARED_PROFILE_NOTE}`)
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
  .describe('Send email for a pending member, or any of name, username, avatarUrl and locale for a joined member.');
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

const hasNoRepeats = (values: (string | number)[]) =>
  new Set(values.map((value) => String(value).toLowerCase())).size === values.length;

export const ZPublicApiAudienceBulkStatus = z
  .object({
    action: z
      .enum(['deactivate', 'reactivate', 'archive', 'unarchive'])
      .describe(
        'deactivate: no access, keeps the seat. archive: no access, frees the seat. reactivate, unarchive: active again. Leaving archived takes a seat. Progress is kept.'
      ),
    memberIds: z
      .array(z.number().int().positive())
      .min(1)
      .max(AUDIENCE_BULK_IDS_MAX)
      .refine(hasNoRepeats, { message: 'memberIds has repeats' })
      .optional()
      .describe(`Up to ${AUDIENCE_BULK_IDS_MAX} student member ids. Send this or emails, not both.`),
    emails: z
      .array(z.string().trim().email())
      .min(1)
      .max(AUDIENCE_BULK_IDS_MAX)
      .refine(hasNoRepeats, { message: 'emails has repeats' })
      .optional()
      .describe(
        `Up to ${AUDIENCE_BULK_IDS_MAX} student emails, matched without regard to case. Send this or memberIds, not both.`
      ),
    reason: z.string().trim().max(500).optional().describe('Stored in the audit log with each change.'),
    confirm: z.literal(true).describe('Must be true. Without it the request is refused and nothing changes.')
  })
  .refine((data) => (data.memberIds === undefined) !== (data.emails === undefined), {
    message: 'Send memberIds or emails, not both',
    path: ['memberIds']
  });
export type TPublicApiAudienceBulkStatus = z.infer<typeof ZPublicApiAudienceBulkStatus>;
