import { AppError, ErrorCodes } from '@api/utils/errors';
import type {
  TAssignAudienceCourses,
  TAudienceInviteByEmail,
  TImportAudienceMembers
} from '@cio/utils/validation/organization';
import { addGroupMembers, enrollUsersInCourseGroups, getExistingGroupMembers } from '@cio/db/queries/group';
import { buildEmailFromName, buildEmailBranding } from '@cio/email';
import { enqueueTransactionalEmail } from '@api/services/jobs';
import { addProgramMember, getExistingProgramMembers, getProgramsByOrg } from '@cio/db/queries/program';
import {
  createOrganizationInvite,
  createOrganizationInviteAudits,
  createOrganizationInvites,
  createOrganizationMembers,
  getOrganizationAudienceMember,
  getLatestOrganizationInviteRowByOrgAndEmail,
  getOrgMembersByProfileIds,
  getOrganizationById,
  getOrganizationMembersByNormalizedEmails,
  getStudentOrganizationMemberByOrgAndEmail,
  hasActiveOrganizationInviteForEmail,
  revokeActiveOrganizationInvitesByEmails
} from '@cio/db/queries/organization';
import { getCourseGroupIds, getOrgCourseGroups, getOrgCourses } from '@cio/db/queries/course';
import { updateOrganizationAudienceMember } from '@cio/db/queries/organization';

import { ROLE } from '@cio/utils/constants';
import crypto from 'node:crypto';
import { getDashboardBaseUrl } from '@cio/core/config/dashboard-url';
import { getProfilesByEmails } from '@cio/db/queries/auth';
import { ensureComplianceEnrollmentRecordsForProfiles } from '../course/compliance';
import { getWelcomeSessionIcs } from '../course/session-invite';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ORG_INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
/** Parallel outbound invite emails; avoids sequential SMTP/API latency per recipient. */
const EMAIL_SEND_CONCURRENCY = 5;

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }
  const results: R[] = new Array(items.length);
  let next = 0;
  const workerCount = Math.min(concurrency, items.length);
  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) break;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

function buildInviteLink(
  token: string,
  org?: { siteName?: string | null; customDomain?: string | null; isCustomDomainVerified?: boolean | null }
): string {
  return `${getDashboardBaseUrl(org)}/invite/${encodeURIComponent(token)}`;
}

function getExpiryLabel(expiresAtIso: string): string {
  return new Date(expiresAtIso).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC'
  });
}

function parseRecipientCsv(recipientCsv: string): string[] {
  return recipientCsv
    .split(/[\n,;\t ]+/g)
    .map((value) => value.trim())
    .filter(Boolean);
}

function getNormalizedRecipients(recipientCsv: string): {
  valid: string[];
  invalid: string[];
  duplicates: string[];
} {
  const raw = parseRecipientCsv(recipientCsv);
  const seen = new Set<string>();
  const valid: string[] = [];
  const invalid: string[] = [];
  const duplicates: string[] = [];

  for (const recipient of raw) {
    const normalized = recipient.toLowerCase().trim();
    if (!normalized) continue;

    if (!EMAIL_REGEX.test(normalized)) {
      invalid.push(normalized);
      continue;
    }

    if (seen.has(normalized)) {
      duplicates.push(normalized);
      continue;
    }

    seen.add(normalized);
    valid.push(normalized);
  }

  return { valid, invalid, duplicates };
}

async function resolveCourseIdsAndNamesForImport(orgId: string, data: TImportAudienceMembers) {
  let courseIds: string[] = [];
  let courseNames: string[] = [];
  if (data.allCourses) {
    const courses = await getOrgCourses({ orgId });
    courseIds = courses.items.map((c) => c.id);
    courseNames = courses.items.map((c) => c.title).filter(Boolean);
  } else if (data.courseIds && data.courseIds.length > 0) {
    const courses = await getOrgCourses({ orgId, courseIds: data.courseIds });
    courseIds = courses.items.map((c) => c.id);
    courseNames = courses.items.map((c) => c.title).filter(Boolean);
  }
  return { courseIds, courseNames };
}

async function resolveProgramIdsAndNamesForImport(orgId: string, data: TImportAudienceMembers) {
  let programIds: string[] = [];
  let programNames: string[] = [];

  if (data.allPrograms) {
    const programs = await getProgramsByOrg(orgId);
    programIds = programs.map((program) => program.id);
    programNames = programs.map((program) => program.name).filter(Boolean);
  } else if (data.programIds && data.programIds.length > 0) {
    const programs = await getProgramsByOrg(orgId, data.programIds);
    programIds = programs.map((program) => program.id);
    programNames = programs.map((program) => program.name).filter(Boolean);
  }

  return { programIds, programNames };
}

async function enrollAudienceStudentProfilesInCourses(
  orgId: string,
  organization: NonNullable<Awaited<ReturnType<typeof getOrganizationById>>>,
  profileIds: string[],
  courseIds: string[],
  shouldSendEmail: boolean
): Promise<{ assigned: number; alreadyEnrolled: number; emailsSent: number }> {
  if (courseIds.length === 0 || profileIds.length === 0) {
    return { assigned: 0, alreadyEnrolled: 0, emailsSent: 0 };
  }

  const uniqueProfileIds = [...new Set(profileIds)];
  const orgMembers = await getOrgMembersByProfileIds(orgId, uniqueProfileIds);
  const studentMembers = orgMembers.filter((m) => m.profileId && m.roleId === ROLE.STUDENT);
  const validProfileIds = new Set(studentMembers.map((m) => m.profileId!));
  const profileEmailMap = new Map(studentMembers.filter((m) => m.profileId).map((m) => [m.profileId!, m.email ?? '']));

  const courseGroups = await getOrgCourseGroups(orgId, courseIds);

  if (courseGroups.length === 0) {
    return { assigned: 0, alreadyEnrolled: 0, emailsSent: 0 };
  }

  const validGroupIds = courseGroups.map((cg) => cg.groupId).filter(Boolean) as string[];
  const courseTitleByGroupId = new Map(courseGroups.map((cg) => [cg.groupId, cg.courseTitle]));
  const welcomeMessageByGroupId = new Map(courseGroups.map((cg) => [cg.groupId, cg.welcomeEmailMessage]));
  const validProfiles = uniqueProfileIds.filter((id) => validProfileIds.has(id));

  const pairs = validProfiles.flatMap((profileId) => validGroupIds.map((groupId) => ({ groupId, profileId })));

  const existingSet = await getExistingGroupMembers(pairs);

  const toInsert = pairs.filter((p) => !existingSet.has(`${p.groupId}:${p.profileId}`));
  const alreadyEnrolled = pairs.length - toInsert.length;

  if (toInsert.length > 0) {
    await addGroupMembers(
      toInsert.map((p) => ({
        groupId: p.groupId,
        roleId: ROLE.STUDENT,
        profileId: p.profileId,
        email: profileEmailMap.get(p.profileId) || undefined
      }))
    );
  }

  if (validProfiles.length > 0) {
    await ensureComplianceEnrollmentRecordsForProfiles(courseIds, validProfiles);
  }

  let emailsSent = 0;
  const loginUrl = getDashboardBaseUrl(organization);

  if (shouldSendEmail && toInsert.length > 0) {
    const icsByGroupId = new Map(
      await Promise.all(courseGroups.map(async (cg) => [cg.groupId, await getWelcomeSessionIcs(cg.courseId)] as const))
    );

    const emailPromises = toInsert
      .filter((p) => profileEmailMap.get(p.profileId))
      .map(async (p) => {
        const email = profileEmailMap.get(p.profileId)!;
        try {
          await enqueueTransactionalEmail('studentCourseWelcome', {
            to: email,
            fields: {
              orgName: organization.name,
              courseName: courseTitleByGroupId.get(p.groupId) || 'Course',
              loginUrl,
              customMessage: welcomeMessageByGroupId.get(p.groupId) ?? undefined,
              branding: buildEmailBranding(organization)
            },
            from: buildEmailFromName(`${organization.name} (via ClassroomIO.com)`),
            idempotencyKey: `audience-course-welcome:${p.groupId}:${p.profileId}`,
            ics: icsByGroupId.get(p.groupId)
          });
          emailsSent++;
        } catch (emailError) {
          console.error(`enrollAudienceStudentProfilesInCourses enqueue error for ${email}:`, emailError);
        }
      });

    await Promise.all(emailPromises);
  }

  return {
    assigned: toInsert.length,
    alreadyEnrolled,
    emailsSent
  };
}

async function enrollAudienceStudentProfilesInPrograms(
  organization: NonNullable<Awaited<ReturnType<typeof getOrganizationById>>>,
  orgId: string,
  profileIds: string[],
  programIds: string[],
  shouldSendEmail: boolean
): Promise<{ assigned: number; alreadyEnrolled: number; emailsSent: number }> {
  if (programIds.length === 0 || profileIds.length === 0) {
    return { assigned: 0, alreadyEnrolled: 0, emailsSent: 0 };
  }

  const uniqueProfileIds = [...new Set(profileIds)];
  const orgMembers = await getOrgMembersByProfileIds(orgId, uniqueProfileIds);
  const studentMembers = orgMembers.filter((member) => member.profileId && member.roleId === ROLE.STUDENT);
  const validProfileIds = new Set(studentMembers.map((member) => member.profileId!));
  const profileEmailMap = new Map(
    studentMembers.filter((member) => member.profileId).map((member) => [member.profileId!, member.email ?? ''])
  );

  const programs = await getProgramsByOrg(orgId, programIds);
  if (programs.length === 0) {
    return { assigned: 0, alreadyEnrolled: 0, emailsSent: 0 };
  }

  const programNameById = new Map(programs.map((program) => [program.id, program.name || 'Program']));
  const loginUrl = getDashboardBaseUrl(organization);
  const validProgramIds = programs.map((program) => program.id);
  const validProfiles = uniqueProfileIds.filter((profileId) => validProfileIds.has(profileId));
  const pairs = validProfiles.flatMap((profileId) => validProgramIds.map((programId) => ({ programId, profileId })));
  const existingSet = await getExistingProgramMembers(pairs);
  const toInsert = pairs.filter((pair) => !existingSet.has(`${pair.programId}:${pair.profileId}`));
  const alreadyEnrolled = pairs.length - toInsert.length;

  if (toInsert.length > 0) {
    await Promise.all(
      toInsert.map((pair) =>
        addProgramMember({
          programId: pair.programId,
          roleId: ROLE.STUDENT,
          profileId: pair.profileId,
          email: profileEmailMap.get(pair.profileId) || undefined
        })
      )
    );
  }

  let emailsSent = 0;

  if (shouldSendEmail && toInsert.length > 0) {
    await Promise.all(
      toInsert
        .filter((pair) => profileEmailMap.get(pair.profileId))
        .map(async (pair) => {
          const email = profileEmailMap.get(pair.profileId)!;

          try {
            await enqueueTransactionalEmail('studentProgramWelcome', {
              to: email,
              fields: {
                orgName: organization.name,
                programName: programNameById.get(pair.programId) || 'Program',
                loginUrl,
                branding: buildEmailBranding(organization)
              },
              from: buildEmailFromName(`${organization.name} (via ClassroomIO.com)`),
              idempotencyKey: `audience-program-welcome:${pair.programId}:${pair.profileId}`
            });
            emailsSent++;
          } catch (emailError) {
            console.error(`enrollAudienceStudentProfilesInPrograms enqueue error for ${email}:`, emailError);
          }
        })
    );
  }

  return {
    assigned: toInsert.length,
    alreadyEnrolled,
    emailsSent
  };
}

async function createStudentOrgInvitesAndSendEmails(input: {
  orgId: string;
  organization: NonNullable<Awaited<ReturnType<typeof getOrganizationById>>>;
  emails: string[];
  courseIds: string[];
  programIds: string[];
  accessNamesLabel: string | undefined;
  invitedByProfileId: string;
  shouldSendEmail: boolean;
}): Promise<{ created: number; emailsSent: number; emailsFailed: number }> {
  const { orgId, organization, emails, courseIds, programIds, accessNamesLabel, invitedByProfileId, shouldSendEmail } =
    input;

  if (emails.length === 0) {
    return { created: 0, emailsSent: 0, emailsFailed: 0 };
  }

  await revokeActiveOrganizationInvitesByEmails(orgId, emails, invitedByProfileId);

  const expiresAt = new Date(Date.now() + ORG_INVITE_EXPIRY_MS).toISOString();

  const inviteInputs = emails.map((email) => {
    const token = generateToken();
    return {
      email,
      token,
      row: {
        organizationId: orgId,
        roleId: ROLE.STUDENT,
        email,
        tokenHash: hashToken(token),
        createdByProfileId: invitedByProfileId,
        expiresAt,
        isRevoked: false,
        metadata: {
          source: 'AUDIENCE_IMPORT',
          courseIds: courseIds.length > 0 ? courseIds : undefined,
          programIds: programIds.length > 0 ? programIds : undefined
        }
      }
    };
  });

  const invites = await createOrganizationInvites(inviteInputs.map((i) => i.row));
  const inviteByEmail = new Map(invites.map((inv) => [(inv.email ?? '').toLowerCase(), inv]));
  const tokenByEmail = new Map(inviteInputs.map((i) => [i.email.toLowerCase(), i.token]));

  await createOrganizationInviteAudits(
    emails.map((email) => {
      const invite = inviteByEmail.get(email)!;
      return {
        inviteId: invite.id,
        organizationId: orgId,
        eventType: 'CREATED' as const,
        actorProfileId: invitedByProfileId,
        targetEmail: email,
        ipAddress: null,
        userAgent: null,
        metadata: {
          roleId: ROLE.STUDENT,
          roleName: 'Student',
          expiresAt,
          courseIds,
          programIds
        }
      };
    })
  );

  let emailsSent = 0;
  let emailsFailed = 0;

  if (shouldSendEmail) {
    const emailOutcomes = await mapWithConcurrency(emails, EMAIL_SEND_CONCURRENCY, async (email) => {
      const invite = inviteByEmail.get(email)!;
      const token = tokenByEmail.get(email)!;
      try {
        const inviteLink = buildInviteLink(token, organization);
        await enqueueTransactionalEmail('studentOrgInvite', {
          to: email,
          fields: {
            email,
            orgName: organization.name,
            inviteLink,
            expiresAt: getExpiryLabel(expiresAt),
            courseNames: accessNamesLabel,
            branding: buildEmailBranding(organization)
          },
          from: buildEmailFromName(`${organization.name} (via ClassroomIO.com)`),
          idempotencyKey: `student-org-invite:${invite.id}`
        });

        // Optimistic — see comment in services/organization/invite.ts.
        return {
          inviteId: invite.id,
          email,
          success: true as const,
          error: undefined as string | undefined
        };
      } catch (emailError) {
        const message = emailError instanceof Error ? emailError.message : 'Unknown email error';
        return { inviteId: invite.id, email, success: false as const, error: message };
      }
    });

    emailsSent = emailOutcomes.filter((o) => o.success).length;
    emailsFailed = emailOutcomes.length - emailsSent;

    await createOrganizationInviteAudits(
      emailOutcomes.map((o) => ({
        inviteId: o.inviteId,
        organizationId: orgId,
        eventType: o.success ? ('EMAIL_SENT' as const) : ('EMAIL_FAILED' as const),
        actorProfileId: invitedByProfileId,
        targetEmail: o.email,
        ipAddress: null,
        userAgent: null,
        metadata: o.success ? {} : { error: o.error ?? 'Unknown' }
      }))
    );
  }

  return { created: emails.length, emailsSent, emailsFailed };
}

export async function importAudienceMembers(orgId: string, data: TImportAudienceMembers, invitedByProfileId: string) {
  const organization = await getOrganizationById(orgId);
  if (!organization || !organization.siteName) {
    throw new AppError('Organization not found', ErrorCodes.ORGANIZATION_NOT_FOUND, 404);
  }

  const recipients = getNormalizedRecipients(data.recipientCsv);

  if (recipients.invalid.length > 0) {
    throw new AppError(
      `Invalid emails found: ${recipients.invalid.slice(0, 5).join(', ')}`,
      ErrorCodes.VALIDATION_ERROR,
      400,
      'recipientCsv'
    );
  }

  if (recipients.valid.length === 0) {
    throw new AppError('No valid emails provided', ErrorCodes.VALIDATION_ERROR, 400, 'recipientCsv');
  }

  const memberRows = await getOrganizationMembersByNormalizedEmails(orgId, recipients.valid);
  const memberByEmail = new Map(memberRows.map((m) => [m.normalizedEmail, m]));

  const newEmails: string[] = [];
  const existingStudentProfileIds: string[] = [];
  const pendingStudentEmails: string[] = [];
  const teamEmails: string[] = [];

  for (const email of recipients.valid) {
    const m = memberByEmail.get(email);
    if (!m) {
      newEmails.push(email);
      continue;
    }
    if (m.roleId !== ROLE.STUDENT) {
      teamEmails.push(email);
      continue;
    }
    if (!m.profileId) {
      pendingStudentEmails.push(email);
      continue;
    }
    existingStudentProfileIds.push(m.profileId);
  }

  if (teamEmails.length > 0) {
    throw new AppError(
      `These emails belong to organization staff, not students: ${teamEmails.slice(0, 8).join(', ')}${teamEmails.length > 8 ? '…' : ''}`,
      ErrorCodes.VALIDATION_ERROR,
      400,
      'recipientCsv'
    );
  }

  const { courseIds, courseNames } = await resolveCourseIdsAndNamesForImport(orgId, data);
  const { programIds, programNames } = await resolveProgramIdsAndNamesForImport(orgId, data);
  const accessNames = [...courseNames, ...programNames];
  const accessNamesLabel = accessNames.length > 0 ? accessNames.join(', ') : undefined;

  const assignedToCourses = await enrollAudienceStudentProfilesInCourses(
    orgId,
    organization,
    existingStudentProfileIds,
    courseIds,
    data.sendEmail
  );
  const assignedToPrograms = await enrollAudienceStudentProfilesInPrograms(
    organization,
    orgId,
    existingStudentProfileIds,
    programIds,
    data.sendEmail
  );

  let imported = 0;
  let importEmailsSent = 0;
  let importEmailsFailed = 0;

  if (newEmails.length > 0) {
    await createOrganizationMembers(
      newEmails.map((email) => ({
        organizationId: orgId,
        email,
        roleId: ROLE.STUDENT,
        verified: false
      }))
    );

    if (courseIds.length > 0) {
      const courseGroupMappings = await getCourseGroupIds(courseIds);
      const validGroupIds = courseGroupMappings.map((m) => m.groupId).filter(Boolean) as string[];

      if (validGroupIds.length > 0) {
        const profiles = await getProfilesByEmails(newEmails);
        if (profiles.length > 0) {
          const users = profiles.map((p) => ({ profileId: p.id, email: p.email ?? undefined }));
          await enrollUsersInCourseGroups(validGroupIds, users, ROLE.STUDENT);
          await ensureComplianceEnrollmentRecordsForProfiles(
            courseIds,
            profiles.map((profile) => profile.id)
          );
        }
      }
    }

    if (programIds.length > 0) {
      const profiles = await getProfilesByEmails(newEmails);
      if (profiles.length > 0) {
        await enrollAudienceStudentProfilesInPrograms(
          organization,
          orgId,
          profiles.map((profile) => profile.id),
          programIds,
          false
        );
      }
    }

    const inviteOutcome = await createStudentOrgInvitesAndSendEmails({
      orgId,
      organization,
      emails: newEmails,
      courseIds,
      programIds,
      accessNamesLabel,
      invitedByProfileId,
      shouldSendEmail: data.sendEmail
    });
    imported = newEmails.length;
    importEmailsSent = inviteOutcome.emailsSent;
    importEmailsFailed = inviteOutcome.emailsFailed;
  }

  let pendingEmailsSent = 0;
  let pendingEmailsFailed = 0;
  if (pendingStudentEmails.length > 0) {
    const pendingOutcome = await createStudentOrgInvitesAndSendEmails({
      orgId,
      organization,
      emails: pendingStudentEmails,
      courseIds,
      programIds,
      accessNamesLabel,
      invitedByProfileId,
      shouldSendEmail: data.sendEmail
    });
    pendingEmailsSent = pendingOutcome.emailsSent;
    pendingEmailsFailed = pendingOutcome.emailsFailed;
  }

  return {
    imported,
    assigned: assignedToCourses.assigned + assignedToPrograms.assigned,
    alreadyEnrolledInCourses: assignedToCourses.alreadyEnrolled,
    alreadyEnrolledInPrograms: assignedToPrograms.alreadyEnrolled,
    pendingInvitesRenewed: pendingStudentEmails.length,
    duplicates: recipients.duplicates.length,
    emailsSent: assignedToCourses.emailsSent + assignedToPrograms.emailsSent + importEmailsSent + pendingEmailsSent,
    emailsFailed: importEmailsFailed + pendingEmailsFailed
  };
}

export async function resendAudienceInvite(orgId: string, data: TAudienceInviteByEmail, invitedByProfileId: string) {
  const organization = await getOrganizationById(orgId);
  if (!organization || !organization.siteName) {
    throw new AppError('Organization not found', ErrorCodes.ORGANIZATION_NOT_FOUND, 404);
  }

  const member = await getStudentOrganizationMemberByOrgAndEmail(orgId, data.email);
  if (!member) {
    throw new AppError('Audience member not found', ErrorCodes.VALIDATION_ERROR, 404, 'email');
  }
  if (member.profileId) {
    throw new AppError('Member has already joined', ErrorCodes.VALIDATION_ERROR, 400, 'email');
  }

  const emailToUse = member.email.toLowerCase().trim();

  const latestInvite = await getLatestOrganizationInviteRowByOrgAndEmail(orgId, emailToUse);
  const meta = (latestInvite?.metadata as { courseIds?: string[]; programIds?: string[] } | undefined) ?? {};
  const courseIdsFromMetadata = meta.courseIds?.filter(Boolean) ?? [];
  const programIdsFromMetadata = meta.programIds?.filter(Boolean) ?? [];

  let courseIds: string[] = [];
  let courseNames: string[] = [];
  if (courseIdsFromMetadata.length > 0) {
    const courses = await getOrgCourses({ orgId, courseIds: courseIdsFromMetadata });
    courseIds = courses.items.map((c) => c.id);
    courseNames = courses.items.map((c) => c.title).filter(Boolean);
  }

  let programIds: string[] = [];
  let programNames: string[] = [];
  if (programIdsFromMetadata.length > 0) {
    const programs = await getProgramsByOrg(orgId, programIdsFromMetadata);
    programIds = programs.map((program) => program.id);
    programNames = programs.map((program) => program.name).filter(Boolean);
  }

  await revokeActiveOrganizationInvitesByEmails(orgId, [emailToUse], invitedByProfileId);

  const expiresAt = new Date(Date.now() + ORG_INVITE_EXPIRY_MS).toISOString();
  const token = generateToken();
  const accessNames = [...courseNames, ...programNames];
  const accessNamesLabel = accessNames.length > 0 ? accessNames.join(', ') : undefined;

  const invite = await createOrganizationInvite({
    organizationId: orgId,
    roleId: ROLE.STUDENT,
    email: emailToUse,
    tokenHash: hashToken(token),
    createdByProfileId: invitedByProfileId,
    expiresAt,
    isRevoked: false,
    metadata: {
      source: 'AUDIENCE_RESEND',
      courseIds: courseIds.length > 0 ? courseIds : undefined,
      programIds: programIds.length > 0 ? programIds : undefined
    }
  });

  await createOrganizationInviteAudits([
    {
      inviteId: invite.id,
      organizationId: orgId,
      eventType: 'CREATED',
      actorProfileId: invitedByProfileId,
      targetEmail: emailToUse,
      ipAddress: null,
      userAgent: null,
      metadata: {
        roleId: ROLE.STUDENT,
        roleName: 'Student',
        expiresAt,
        courseIds,
        programIds
      }
    }
  ]);

  let emailSent = false;
  try {
    const inviteLink = buildInviteLink(token, organization);
    await enqueueTransactionalEmail('studentOrgInvite', {
      to: emailToUse,
      fields: {
        email: emailToUse,
        orgName: organization.name,
        inviteLink,
        expiresAt: getExpiryLabel(expiresAt),
        courseNames: accessNamesLabel,
        branding: buildEmailBranding(organization)
      },
      from: buildEmailFromName(`${organization.name} (via ClassroomIO.com)`),
      idempotencyKey: `student-org-invite:${invite.id}`
    });

    emailSent = true;
    // Optimistic EMAIL_SENT — worker handles retries; final failure flips
    // email_delivery to `failed` for operator follow-up.
    await createOrganizationInviteAudits([
      {
        inviteId: invite.id,
        organizationId: orgId,
        eventType: 'EMAIL_SENT',
        actorProfileId: invitedByProfileId,
        targetEmail: emailToUse,
        ipAddress: null,
        userAgent: null,
        metadata: {}
      }
    ]);
  } catch (emailError) {
    const message = emailError instanceof Error ? emailError.message : 'Unknown email error';
    await createOrganizationInviteAudits([
      {
        inviteId: invite.id,
        organizationId: orgId,
        eventType: 'EMAIL_FAILED',
        actorProfileId: invitedByProfileId,
        targetEmail: emailToUse,
        ipAddress: null,
        userAgent: null,
        metadata: { error: message }
      }
    ]);
  }

  return { emailSent };
}

export async function revokeAudiencePendingInvite(
  orgId: string,
  data: TAudienceInviteByEmail,
  revokedByProfileId: string
) {
  const member = await getStudentOrganizationMemberByOrgAndEmail(orgId, data.email);
  if (!member) {
    throw new AppError('Audience member not found', ErrorCodes.VALIDATION_ERROR, 404, 'email');
  }
  if (member.profileId) {
    throw new AppError('Member has already joined', ErrorCodes.VALIDATION_ERROR, 400, 'email');
  }

  const emailToUse = member.email.toLowerCase().trim();

  const hasActive = await hasActiveOrganizationInviteForEmail(orgId, emailToUse);
  if (!hasActive) {
    throw new AppError('No active pending invite to revoke', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const revoked = await revokeActiveOrganizationInvitesByEmails(orgId, [emailToUse], revokedByProfileId);
  if (revoked.length === 0) {
    throw new AppError('No invite was revoked', ErrorCodes.VALIDATION_ERROR, 400);
  }

  await createOrganizationInviteAudits(
    revoked.map((inv) => ({
      inviteId: inv.id,
      organizationId: orgId,
      eventType: 'REVOKED' as const,
      actorProfileId: revokedByProfileId,
      targetEmail: emailToUse,
      ipAddress: null,
      userAgent: null,
      metadata: { reason: 'audience_revoked_by_admin' }
    }))
  );

  return { revoked: true };
}

export async function assignAudienceToCourses(orgId: string, data: TAssignAudienceCourses) {
  const organization = await getOrganizationById(orgId);
  if (!organization) {
    throw new AppError('Organization not found', ErrorCodes.ORGANIZATION_NOT_FOUND, 404);
  }

  const courseIds = data.courseIds ?? [];
  const programIds = data.programIds ?? [];

  let assignedToCourses = { assigned: 0, alreadyEnrolled: 0, emailsSent: 0 };
  let assignedToPrograms = { assigned: 0, alreadyEnrolled: 0, emailsSent: 0 };

  if (courseIds.length > 0) {
    const courseGroups = await getOrgCourseGroups(orgId, courseIds);
    if (courseGroups.length === 0) {
      throw new AppError('No valid courses found', ErrorCodes.VALIDATION_ERROR, 400, 'courseIds');
    }

    assignedToCourses = await enrollAudienceStudentProfilesInCourses(
      orgId,
      organization,
      data.profileIds,
      courseIds,
      data.sendEmail
    );
  }

  if (programIds.length > 0) {
    const programs = await getProgramsByOrg(orgId, programIds);
    if (programs.length === 0) {
      throw new AppError('No valid programs found', ErrorCodes.VALIDATION_ERROR, 400, 'programIds');
    }

    assignedToPrograms = await enrollAudienceStudentProfilesInPrograms(
      organization,
      orgId,
      data.profileIds,
      programIds,
      data.sendEmail
    );
  }

  return {
    assigned: assignedToCourses.assigned + assignedToPrograms.assigned,
    alreadyEnrolled: assignedToCourses.alreadyEnrolled + assignedToPrograms.alreadyEnrolled,
    emailsSent: assignedToCourses.emailsSent + assignedToPrograms.emailsSent
  };
}

export async function updatePendingAudienceMemberEmail(
  orgId: string,
  memberId: number,
  data: { email: string; sendEmail: boolean },
  invitedByProfileId: string
) {
  const organization = await getOrganizationById(orgId);
  if (!organization) {
    throw new AppError('Organization not found', ErrorCodes.ORGANIZATION_NOT_FOUND, 404);
  }

  const existingMember = await getOrganizationAudienceMember(orgId, memberId);
  if (!existingMember) {
    throw new AppError('Audience member not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (existingMember.profileId) {
    throw new AppError(
      'Only pending audience members can be updated through this endpoint',
      ErrorCodes.VALIDATION_ERROR,
      400,
      'memberId'
    );
  }

  const normalizedEmail = data.email.toLowerCase().trim();
  const currentEmail = existingMember.email.toLowerCase().trim();

  if (!normalizedEmail) {
    throw new AppError('Email is required', ErrorCodes.VALIDATION_ERROR, 400, 'email');
  }

  if (normalizedEmail !== currentEmail) {
    const matchingMembers = await getOrganizationMembersByNormalizedEmails(orgId, [normalizedEmail]);

    if (matchingMembers.length > 0) {
      throw new AppError('An audience member with this email already exists', ErrorCodes.CONFLICT, 409, 'email');
    }
  }

  await revokeActiveOrganizationInvitesByEmails(orgId, [currentEmail, normalizedEmail], invitedByProfileId);

  const updatedMember = await updateOrganizationAudienceMember(orgId, memberId, {
    email: normalizedEmail,
    verified: false
  });

  if (!updatedMember) {
    throw new AppError('Audience member not found', ErrorCodes.NOT_FOUND, 404);
  }

  const latestInvite = await getLatestOrganizationInviteRowByOrgAndEmail(orgId, currentEmail);
  const meta = (latestInvite?.metadata as { courseIds?: string[]; programIds?: string[] } | undefined) ?? {};

  await createStudentOrgInvitesAndSendEmails({
    orgId,
    organization,
    emails: [normalizedEmail],
    courseIds: meta.courseIds?.filter(Boolean) ?? [],
    programIds: meta.programIds?.filter(Boolean) ?? [],
    accessNamesLabel: undefined,
    invitedByProfileId,
    shouldSendEmail: data.sendEmail
  });

  return updatedMember;
}
