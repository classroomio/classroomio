import { getProfilesByEmails } from '@cio/db/queries/auth';
import { ROLE } from '@cio/utils/constants';

export interface BulkMemberInput {
  profileId?: string | null;
  email?: string | null;
  roleId: number;
}

export interface ResolvedBulkMembers {
  direct: Array<{ profileId: string; email: string | null; roleId: number }>;
  inviteEmails: string[];
  failed: Array<{ key: string; reason: string }>;
}

/**
 * Resolves mixed profileId/email member inputs against existing profiles.
 * Email-only entries that match an account enroll directly; the rest go to
 * the invite flow. Tutor emails without an account fail (tutors must already
 * be org team). Shared shape for the API sync path and the worker.
 */
export async function resolveBulkMembers(members: BulkMemberInput[]): Promise<ResolvedBulkMembers> {
  const direct: ResolvedBulkMembers['direct'] = [];
  const inviteEmails: string[] = [];
  const failed: ResolvedBulkMembers['failed'] = [];

  const emailOnlyEmails = members
    .filter((member) => !member.profileId && member.email)
    .map((member) => member.email!.toLowerCase().trim());
  const profilesByEmail = new Map<string, { id: string }>();

  if (emailOnlyEmails.length > 0) {
    const profiles = await getProfilesByEmails(emailOnlyEmails);

    for (const profile of profiles) {
      if (profile.email) {
        profilesByEmail.set(profile.email.toLowerCase().trim(), { id: profile.id });
      }
    }
  }

  for (const member of members) {
    if (member.profileId) {
      direct.push({ profileId: member.profileId, email: member.email ?? null, roleId: member.roleId });
      continue;
    }

    const normalizedEmail = (member.email ?? '').toLowerCase().trim();

    if (!normalizedEmail) {
      failed.push({ key: '', reason: 'MISSING_PROFILE_OR_EMAIL' });
      continue;
    }

    if (member.roleId === ROLE.TUTOR) {
      failed.push({ key: normalizedEmail, reason: 'TUTOR_REQUIRES_ACCOUNT' });
      continue;
    }

    const existingProfile = profilesByEmail.get(normalizedEmail);

    if (existingProfile) {
      direct.push({ profileId: existingProfile.id, email: member.email ?? null, roleId: member.roleId });
    } else {
      inviteEmails.push(normalizedEmail);
    }
  }

  return { direct, inviteEmails, failed };
}
