/**
 * Deletes an organization and ALL associated data for a given user email.
 *
 * Only processes organizations where the user has an ADMIN role.
 * For each admin org, cascades through every child table (courses, lessons,
 * exercises, submissions, groupmembers, tags, assets, widgets, programs,
 * cohorts, AI data, analytics, etc.) before removing the org.
 *
 * After all orgs are deleted, also removes the user account (profile,
 * sessions, accounts, SSO providers) if no RESTRICT FKs remain. If the
 * user still has references elsewhere (e.g. widgets in other orgs), the
 * user is left intact and a warning is printed.
 *
 * Usage:
 *   pnpm --filter @cio/db db:delete-org -- --email user@example.com                # dry run (default)
 *   pnpm --filter @cio/db db:delete-org -- --email user@example.com --execute      # permanent delete
 */
import 'dotenv/config';

import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL ?? process.env.PRIVATE_DATABASE_URL ?? '';
const shouldExecute = process.argv.includes('--execute');

function readArg(flag: string): string {
  const flagIndex = process.argv.indexOf(flag);
  const value = flagIndex === -1 ? '' : (process.argv[flagIndex + 1] ?? '');

  if (value.startsWith('--')) {
    console.error(`Missing value for ${flag}`);
    process.exit(1);
  }

  return value.trim();
}

const email = readArg('--email').toLowerCase();

if (!connectionString) {
  console.error('DATABASE_URL or PRIVATE_DATABASE_URL environment variable is required');
  process.exit(1);
}

if (!email) {
  console.error('Usage: pnpm --filter @cio/db db:delete-org -- --email user@example.com [--execute]');
  process.exit(1);
}

const ROLE_ADMIN = 1;

async function main() {
  const sql = postgres(connectionString);

  try {
    // 1. Find the user
    const users = await sql`
      SELECT id, name, email FROM "user" WHERE lower(email) = ${email}
    `;

    if (users.length === 0) {
      console.error(`No user found with email ${email}`);
      process.exit(1);
    }

    if (users.length > 1) {
      console.error(
        `${users.length} users match ${email} case-insensitively: ${users.map((u) => u.id).join(', ')}. Resolve the ambiguity before running this script.`
      );
      process.exit(1);
    }

    const targetUser = users[0];
    console.log(`Found user ${targetUser.id} (${targetUser.name}) <${targetUser.email}>`);

    // 2. Find organizations where this user is an admin
    const adminMemberships = await sql`
      SELECT om.id AS member_id, om.organization_id, o.name AS org_name
      FROM organizationmember om
      JOIN organization o ON o.id = om.organization_id
      WHERE om.profile_id = ${targetUser.id} AND om.role_id = ${ROLE_ADMIN}
    `;

    if (adminMemberships.length === 0) {
      console.error(`User ${email} is not an admin of any organization. Nothing to delete.`);
      process.exit(1);
    }

    console.log(`\nUser is admin of ${adminMemberships.length} organization(s):`);
    for (const m of adminMemberships) {
      console.log(`  - ${m.org_name} (${m.organization_id})`);
    }

    if (!shouldExecute) {
      console.log('\n--- DRY RUN: would delete the following for each organization ---\n');

      for (const m of adminMemberships) {
        const orgId = m.organization_id;
        const counts = await countOrgData(sql, orgId);

        console.log(`Organization: ${m.org_name} (${orgId})`);
        printCounts(counts);
        console.log('');
      }

      console.log('Dry run only. Re-run with --execute to permanently delete.');
      return;
    }

    // 3. Execute deletion for each org
    for (const m of adminMemberships) {
      const orgId = m.organization_id;
      console.log(`\nDeleting organization: ${m.org_name} (${orgId}) ...`);

      await deleteOrganization(sql, orgId);
      console.log(`  ✓ Organization "${m.org_name}" and all associated data deleted.`);
    }

    // 4. Clean up the user account itself
    console.log('\nCleaning up user account ...');
    const userDeleted = await deleteUserAccount(sql, targetUser.id);

    if (userDeleted) {
      console.log(`  ✓ User account ${targetUser.id} (${targetUser.email}) deleted.`);
    } else {
      console.log(`  ⚠ User account ${targetUser.id} could not be deleted (remaining references in other tables).`);
      console.log('    The user may still belong to other organizations or own data outside the deleted orgs.');
    }

    console.log('\nDone. All targeted organizations and their data have been permanently removed.');
  } catch (error) {
    console.error('delete-org error:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

async function countOrgData(sql: postgres.Sql, orgId: string) {
  const [courseCount] =
    await sql`SELECT count(*)::int AS count FROM course WHERE group_id IN (SELECT id FROM "group" WHERE organization_id = ${orgId})`;
  const [groupCount] = await sql`SELECT count(*)::int AS count FROM "group" WHERE organization_id = ${orgId}`;
  const [memberCount] =
    await sql`SELECT count(*)::int AS count FROM organizationmember WHERE organization_id = ${orgId}`;
  const [groupMemberCount] =
    await sql`SELECT count(*)::int AS count FROM groupmember WHERE group_id IN (SELECT id FROM "group" WHERE organization_id = ${orgId})`;
  const [lessonCount] =
    await sql`SELECT count(*)::int AS count FROM lesson WHERE course_id IN (SELECT id FROM course WHERE group_id IN (SELECT id FROM "group" WHERE organization_id = ${orgId}))`;
  const [exerciseCount] =
    await sql`SELECT count(*)::int AS count FROM exercise WHERE course_id IN (SELECT id FROM course WHERE group_id IN (SELECT id FROM "group" WHERE organization_id = ${orgId}))`;
  const [submissionCount] =
    await sql`SELECT count(*)::int AS count FROM submission WHERE course_id IN (SELECT id FROM course WHERE group_id IN (SELECT id FROM "group" WHERE organization_id = ${orgId}))`;

  return {
    courses: courseCount.count,
    groups: groupCount.count,
    orgMembers: memberCount.count,
    groupMembers: groupMemberCount.count,
    lessons: lessonCount.count,
    exercises: exerciseCount.count,
    submissions: submissionCount.count
  };
}

function printCounts(counts: {
  courses: number;
  groups: number;
  orgMembers: number;
  groupMembers: number;
  lessons: number;
  exercises: number;
  submissions: number;
}) {
  console.log(`  Groups (course groups):  ${counts.groups}`);
  console.log(`  Courses:                ${counts.courses}`);
  console.log(`  Lessons:                ${counts.lessons}`);
  console.log(`  Exercises:              ${counts.exercises}`);
  console.log(`  Submissions:            ${counts.submissions}`);
  console.log(`  Org members:            ${counts.orgMembers}`);
  console.log(`  Group members (enrolled students/tutors): ${counts.groupMembers}`);
}

async function deleteOrganization(sql: postgres.Sql, orgId: string) {
  await sql.begin(async (tx) => {
    // Collect all IDs up front so we can reference them in delete statements.
    // This also ensures we fail fast if any query errors before mutation.

    // Courses (via group -> org)
    const courses = await tx`
      SELECT id FROM course
      WHERE group_id IN (SELECT id FROM "group" WHERE organization_id = ${orgId})
    `;
    const courseIds = courses.map((c) => c.id);

    // Groups
    const groups = await tx`
      SELECT id FROM "group" WHERE organization_id = ${orgId}
    `;
    const groupIds = groups.map((g) => g.id);

    // Group members (enrolled students/tutors)
    const groupMembers = await tx`
      SELECT id FROM groupmember
      WHERE group_id IN (SELECT id FROM "group" WHERE organization_id = ${orgId})
    `;
    const groupMemberIds = groupMembers.map((gm) => gm.id);

    // Org members
    const orgMembers = await tx`
      SELECT id, profile_id FROM organizationmember WHERE organization_id = ${orgId}
    `;
    const orgMemberIds = orgMembers.map((om) => om.id);
    const orgMemberProfileIds = orgMembers.map((om) => om.profile_id).filter(Boolean);

    // Lessons
    const lessons = courseIds.length > 0 ? await tx`SELECT id FROM lesson WHERE course_id IN ${tx(courseIds)}` : [];
    const lessonIds = lessons.map((l) => l.id);

    // Exercises
    const exercises = courseIds.length > 0 ? await tx`SELECT id FROM exercise WHERE course_id IN ${tx(courseIds)}` : [];
    const exerciseIds = exercises.map((e) => e.id);

    // Submissions
    const submissions =
      courseIds.length > 0 ? await tx`SELECT id FROM submission WHERE course_id IN ${tx(courseIds)}` : [];
    const submissionIds = submissions.map((s) => s.id);

    // Questions (via exercises)
    const questions =
      exerciseIds.length > 0 ? await tx`SELECT id FROM question WHERE exercise_id IN ${tx(exerciseIds)}` : [];
    const questionIds = questions.map((q) => q.id);

    // Polls
    const polls = courseIds.length > 0 ? await tx`SELECT id FROM apps_poll WHERE "courseId" IN ${tx(courseIds)}` : [];
    const pollIds = polls.map((p) => p.id);

    // Community questions
    const communityQuestions = await tx`
      SELECT id FROM community_question WHERE organization_id = ${orgId}
    `;
    const communityQuestionIds = communityQuestions.map((cq) => cq.id);

    // Newsfeed
    const newsfeeds =
      courseIds.length > 0 ? await tx`SELECT id FROM course_newsfeed WHERE course_id IN ${tx(courseIds)}` : [];
    const newsfeedIds = newsfeeds.map((n) => n.id);

    // Programs (legacy)
    const programs = await tx`SELECT id FROM program WHERE organization_id = ${orgId}`;
    const programIds = programs.map((p) => p.id);

    const programMembers =
      programIds.length > 0 ? await tx`SELECT id FROM program_member WHERE program_id IN ${tx(programIds)}` : [];
    const programMemberIds = programMembers.map((pm) => pm.id);

    const programNewsfeeds =
      programIds.length > 0 ? await tx`SELECT id FROM program_newsfeed WHERE program_id IN ${tx(programIds)}` : [];
    const programNewsfeedIds = programNewsfeeds.map((pn) => pn.id);

    const programGoals =
      programIds.length > 0 ? await tx`SELECT id FROM program_goal WHERE program_id IN ${tx(programIds)}` : [];
    const programGoalIds = programGoals.map((pg) => pg.id);

    // Cohorts
    const cohorts = await tx`SELECT id FROM cohort WHERE organization_id = ${orgId}`;
    const cohortIds = cohorts.map((c) => c.id);

    const cohortMembers =
      cohortIds.length > 0 ? await tx`SELECT id FROM cohort_member WHERE cohort_id IN ${tx(cohortIds)}` : [];
    const cohortMemberIds = cohortMembers.map((cm) => cm.id);

    const cohortNewsfeeds =
      cohortIds.length > 0 ? await tx`SELECT id FROM cohort_newsfeed WHERE cohort_id IN ${tx(cohortIds)}` : [];
    const cohortNewsfeedIds = cohortNewsfeeds.map((cn) => cn.id);

    const cohortGoals =
      cohortIds.length > 0 ? await tx`SELECT id FROM cohort_goal WHERE cohort_id IN ${tx(cohortIds)}` : [];
    const cohortGoalIds = cohortGoals.map((cg) => cg.id);

    // Widgets
    const widgets = await tx`SELECT id FROM widget WHERE organization_id = ${orgId}`;
    const widgetIds = widgets.map((w) => w.id);

    // Tags
    const tags = await tx`SELECT id FROM tag WHERE organization_id = ${orgId}`;
    const tagIds = tags.map((t) => t.id);

    // Assets
    const assets = await tx`SELECT id FROM assets WHERE organization_id = ${orgId}`;
    const assetIds = assets.map((a) => a.id);

    // AI agent runs
    const aiRuns = await tx`SELECT id FROM ai_agent_run WHERE org_id = ${orgId}`;
    const aiRunIds = aiRuns.map((r) => r.id);

    // AI chat conversations
    const aiConversations =
      courseIds.length > 0 ? await tx`SELECT id FROM ai_chat_conversation WHERE course_id IN ${tx(courseIds)}` : [];
    const aiConversationIds = aiConversations.map((c) => c.id);

    // Quizzes
    const quizzes = await tx`SELECT id FROM quiz WHERE organization_id = ${orgId}`;
    const quizIds = quizzes.map((q) => q.id);

    // Course import drafts
    const importDrafts = await tx`SELECT id FROM course_import_draft WHERE organization_id = ${orgId}`;
    const importDraftIds = importDrafts.map((d) => d.id);

    // Media jobs
    const mediaJobs = await tx`SELECT id FROM media_job WHERE organization_id = ${orgId}`;
    const mediaJobIds = mediaJobs.map((mj) => mj.id);

    // Invite links
    const inviteLinks = await tx`SELECT id FROM invite_link WHERE organization_id = ${orgId}`;
    const inviteLinkIds = inviteLinks.map((il) => il.id);

    // Course invites
    const courseInvites =
      courseIds.length > 0 ? await tx`SELECT id FROM course_invite WHERE course_id IN ${tx(courseIds)}` : [];
    const courseInviteIds = courseInvites.map((ci) => ci.id);

    // Course invite audits
    const courseInviteAudits =
      courseInviteIds.length > 0
        ? await tx`SELECT id FROM course_invite_audit WHERE invite_id IN ${tx(courseInviteIds)}`
        : [];

    // Organization invites
    const orgInvites = await tx`SELECT id FROM organization_invite WHERE organization_id = ${orgId}`;
    const orgInviteIds = orgInvites.map((oi) => oi.id);

    // Organization invite audits
    const orgInviteAudits =
      orgInviteIds.length > 0
        ? await tx`SELECT id FROM organization_invite_audit WHERE organization_id = ${orgId}`
        : [];

    // Asset usages
    const assetUsages = await tx`SELECT id FROM asset_usages WHERE organization_id = ${orgId}`;

    // Media transcripts
    const mediaTranscripts =
      assetIds.length > 0 ? await tx`SELECT id FROM media_transcript WHERE asset_id IN ${tx(assetIds)}` : [];

    // Course completion records
    const completionRecords =
      courseIds.length > 0 ? await tx`SELECT id FROM course_completion_record WHERE course_id IN ${tx(courseIds)}` : [];
    const completionRecordIds = completionRecords.map((cr) => cr.id);

    // Course certificate issues
    const certIssues =
      courseIds.length > 0 ? await tx`SELECT id FROM course_certificate_issue WHERE course_id IN ${tx(courseIds)}` : [];

    // AI tutor data
    const aiMessageCounts = await tx`SELECT id FROM ai_tutor_message_count WHERE org_id = ${orgId}`;
    const aiCapEvents = await tx`SELECT id FROM ai_tutor_cap_event WHERE org_id = ${orgId}`;
    const aiTokenUsages = await tx`SELECT id FROM ai_token_usage WHERE org_id = ${orgId}`;
    const aiCreditBalances = await tx`SELECT id FROM ai_credit_balance WHERE org_id = ${orgId}`;
    const aiCreditPurchases = await tx`SELECT id FROM ai_credit_purchase WHERE org_id = ${orgId}`;

    // Lesson languages (needed for history cleanup)
    const lessonLanguages =
      lessonIds.length > 0 ? await tx`SELECT id FROM lesson_language WHERE lesson_id IN ${tx(lessonIds)}` : [];
    const lessonLanguageIds = lessonLanguages.map((ll) => ll.id);

    // ─── BEGIN DELETION (reverse dependency order) ───

    // Phase 1: Analytics & dead-letter (no FK constraints, just columns)
    await tx`DELETE FROM analytics_page_event WHERE org_id = ${orgId}`;
    await tx`DELETE FROM analytics_org_daily WHERE org_id = ${orgId}`;
    await tx`DELETE FROM analytics_course_daily WHERE org_id = ${orgId}`;
    await tx`DELETE FROM analytics_country_daily WHERE org_id = ${orgId}`;

    // Login events for all org members (user_id references user.id)
    if (orgMemberProfileIds.length > 0) {
      await tx`DELETE FROM analytics_login_events WHERE user_id IN ${tx(orgMemberProfileIds)}`;
    }

    await tx`DELETE FROM dead_letter_job WHERE organization_id = ${orgId}`;

    // Phase 2: AI tutor data (RESTRICT FKs to org)
    if (aiMessageCounts.length > 0)
      await tx`DELETE FROM ai_tutor_message_count WHERE id IN ${tx(aiMessageCounts.map((r) => r.id))}`;
    if (aiCapEvents.length > 0)
      await tx`DELETE FROM ai_tutor_cap_event WHERE id IN ${tx(aiCapEvents.map((r) => r.id))}`;
    if (aiTokenUsages.length > 0)
      await tx`DELETE FROM ai_token_usage WHERE id IN ${tx(aiTokenUsages.map((r) => r.id))}`;
    if (aiCreditBalances.length > 0)
      await tx`DELETE FROM ai_credit_balance WHERE id IN ${tx(aiCreditBalances.map((r) => r.id))}`;
    if (aiCreditPurchases.length > 0)
      await tx`DELETE FROM ai_credit_purchase WHERE id IN ${tx(aiCreditPurchases.map((r) => r.id))}`;

    // Phase 3: AI chat conversations (explicit delete for children without full cascade)
    if (aiConversationIds.length > 0) {
      await tx`DELETE FROM ai_chat_document WHERE conversation_id IN ${tx(aiConversationIds)}`;
      await tx`DELETE FROM ai_chat_model_context WHERE conversation_id IN ${tx(aiConversationIds)}`;
      await tx`DELETE FROM ai_chat_conversation WHERE id IN ${tx(aiConversationIds)}`;
    }

    // Phase 4: AI agent runs
    if (aiRunIds.length > 0) {
      await tx`DELETE FROM ai_agent_run_event WHERE run_id IN ${tx(aiRunIds)}`;
      await tx`DELETE FROM ai_agent_run_step WHERE run_id IN ${tx(aiRunIds)}`;
      await tx`DELETE FROM ai_agent_run WHERE id IN ${tx(aiRunIds)}`;
    }

    // Phase 5: Quizzes
    if (quizIds.length > 0) {
      await tx`DELETE FROM quiz_play WHERE quiz_id IN ${tx(quizIds)}`;
      await tx`DELETE FROM quiz WHERE id IN ${tx(quizIds)}`;
    }

    // Phase 6: Community (RESTRICT FKs to org and course)
    if (communityQuestionIds.length > 0) {
      await tx`DELETE FROM community_answer WHERE question_id IN ${tx(communityQuestionIds)}`;
      await tx`DELETE FROM community_question WHERE id IN ${tx(communityQuestionIds)}`;
    }

    // Phase 7: Polls
    if (pollIds.length > 0) {
      await tx`DELETE FROM apps_poll_submission WHERE poll_id IN ${tx(pollIds)}`;
      await tx`DELETE FROM apps_poll_option WHERE poll_id IN ${tx(pollIds)}`;
      await tx`DELETE FROM apps_poll WHERE id IN ${tx(pollIds)}`;
    }

    // Phase 8: Newsfeed
    if (newsfeedIds.length > 0) {
      await tx`DELETE FROM course_newsfeed_comment WHERE course_newsfeed_id IN ${tx(newsfeedIds)}`;
      await tx`DELETE FROM course_newsfeed WHERE id IN ${tx(newsfeedIds)}`;
    }

    // Phase 9: Course invites and audits
    if (courseInviteAudits.length > 0) {
      await tx`DELETE FROM course_invite_audit WHERE id IN ${tx(courseInviteAudits.map((r) => r.id))}`;
    }
    if (courseInvites.length > 0) {
      await tx`DELETE FROM course_invite WHERE id IN ${tx(courseInviteIds)}`;
    }

    // Phase 10: Organization invites and audits
    if (orgInviteAudits.length > 0) {
      await tx`DELETE FROM organization_invite_audit WHERE id IN ${tx(orgInviteAudits.map((r) => r.id))}`;
    }
    if (orgInvites.length > 0) {
      await tx`DELETE FROM organization_invite WHERE id IN ${tx(orgInviteIds)}`;
    }

    // Phase 11: Invite links
    if (inviteLinks.length > 0) {
      await tx`DELETE FROM invite_link WHERE id IN ${tx(inviteLinkIds)}`;
    }

    // Phase 12: Course completion records and certificates
    if (completionRecordIds.length > 0) {
      await tx`DELETE FROM course_completion_notification_event WHERE course_completion_record_id IN ${tx(completionRecordIds)}`;
      await tx`DELETE FROM course_certificate_issue WHERE course_completion_record_id IN ${tx(completionRecordIds)}`;
    }
    if (certIssues.length > 0) {
      await tx`DELETE FROM course_certificate_issue WHERE id IN ${tx(certIssues.map((r) => r.id))}`;
    }
    if (completionRecords.length > 0) {
      await tx`DELETE FROM course_completion_record WHERE id IN ${tx(completionRecordIds)}`;
    }

    // Phase 13: Group attendance
    if (courseIds.length > 0) {
      await tx`DELETE FROM group_attendance WHERE course_id IN ${tx(courseIds)}`;
    }

    // Phase 14: Questions, options, answers (before submissions)
    if (questionIds.length > 0) {
      await tx`DELETE FROM question_answer WHERE question_id IN ${tx(questionIds)}`;
      await tx`DELETE FROM option WHERE question_id IN ${tx(questionIds)}`;
      await tx`DELETE FROM question WHERE id IN ${tx(questionIds)}`;
    }

    // Phase 15: Submissions and their answers
    if (submissionIds.length > 0) {
      await tx`DELETE FROM question_answer WHERE submission_id IN ${tx(submissionIds)}`;
      await tx`DELETE FROM submission WHERE id IN ${tx(submissionIds)}`;
    }

    // Phase 16: Exercise sections and exercises
    if (exerciseIds.length > 0) {
      await tx`DELETE FROM exercise_section WHERE exercise_id IN ${tx(exerciseIds)}`;
      await tx`DELETE FROM exercise WHERE id IN ${tx(exerciseIds)}`;
    }

    // Phase 17: Lessons and their children
    if (lessonIds.length > 0) {
      await tx`DELETE FROM lesson_comment WHERE lesson_id IN ${tx(lessonIds)}`;
      await tx`DELETE FROM lesson_completion WHERE lesson_id IN ${tx(lessonIds)}`;
      await tx`DELETE FROM lesson_video_progress WHERE lesson_id IN ${tx(lessonIds)}`;
      if (lessonLanguageIds.length > 0) {
        await tx`DELETE FROM lesson_language_history WHERE lesson_language_id IN ${tx(lessonLanguageIds)}`;
        await tx`DELETE FROM lesson_language WHERE id IN ${tx(lessonLanguageIds)}`;
      }
      await tx`DELETE FROM lesson WHERE id IN ${tx(lessonIds)}`;
    }

    // Phase 18: Media jobs and transcripts
    if (mediaJobIds.length > 0) {
      await tx`DELETE FROM media_transcript WHERE media_job_id IN ${tx(mediaJobIds)}`;
      await tx`DELETE FROM media_job WHERE id IN ${tx(mediaJobIds)}`;
    }
    if (mediaTranscripts.length > 0) {
      await tx`DELETE FROM media_transcript WHERE id IN ${tx(mediaTranscripts.map((r) => r.id))}`;
    }

    // Phase 19: Asset usages and assets
    if (assetUsages.length > 0) {
      await tx`DELETE FROM asset_usages WHERE id IN ${tx(assetUsages.map((r) => r.id))}`;
    }
    if (assets.length > 0) {
      await tx`DELETE FROM assets WHERE id IN ${tx(assetIds)}`;
    }

    // Phase 20: Course import drafts
    if (importDraftIds.length > 0) {
      await tx`DELETE FROM course_import_draft WHERE id IN ${tx(importDraftIds)}`;
    }

    // Phase 21: Tag assignments and tags
    if (tagIds.length > 0) {
      await tx`DELETE FROM tag_assignment WHERE tag_id IN ${tx(tagIds)}`;
      await tx`DELETE FROM tag WHERE id IN ${tx(tagIds)}`;
    }

    // Phase 22: Courses (FK to group is RESTRICT)
    if (courseIds.length > 0) {
      await tx`DELETE FROM course WHERE id IN ${tx(courseIds)}`;
    }

    // Phase 23: Group members and groups
    if (groupMemberIds.length > 0) {
      await tx`DELETE FROM groupmember WHERE id IN ${tx(groupMemberIds)}`;
    }
    if (groupIds.length > 0) {
      await tx`DELETE FROM "group" WHERE id IN ${tx(groupIds)}`;
    }

    // Phase 24: Programs (legacy)
    if (programMemberIds.length > 0) {
      await tx`DELETE FROM program_member WHERE id IN ${tx(programMemberIds)}`;
    }
    if (programGoalIds.length > 0) {
      await tx`DELETE FROM program_goal_assignment WHERE goal_id IN ${tx(programGoalIds)}`;
      await tx`DELETE FROM program_goal WHERE id IN ${tx(programGoalIds)}`;
    }
    if (programNewsfeedIds.length > 0) {
      await tx`DELETE FROM program_newsfeed_comment WHERE program_newsfeed_id IN ${tx(programNewsfeedIds)}`;
      await tx`DELETE FROM program_newsfeed WHERE id IN ${tx(programNewsfeedIds)}`;
    }
    if (programIds.length > 0) {
      await tx`DELETE FROM program_course WHERE program_id IN ${tx(programIds)}`;
      await tx`DELETE FROM program WHERE id IN ${tx(programIds)}`;
    }

    // Phase 25: Cohorts
    if (cohortMemberIds.length > 0) {
      await tx`DELETE FROM cohort_member WHERE id IN ${tx(cohortMemberIds)}`;
    }
    if (cohortGoalIds.length > 0) {
      await tx`DELETE FROM cohort_goal_assignment WHERE goal_id IN ${tx(cohortGoalIds)}`;
      await tx`DELETE FROM cohort_goal WHERE id IN ${tx(cohortGoalIds)}`;
    }
    if (cohortNewsfeedIds.length > 0) {
      await tx`DELETE FROM cohort_newsfeed_comment WHERE cohort_newsfeed_id IN ${tx(cohortNewsfeedIds)}`;
      await tx`DELETE FROM cohort_newsfeed WHERE id IN ${tx(cohortNewsfeedIds)}`;
    }
    if (cohortIds.length > 0) {
      await tx`DELETE FROM cohort_course WHERE cohort_id IN ${tx(cohortIds)}`;
      await tx`DELETE FROM cohort WHERE id IN ${tx(cohortIds)}`;
    }

    // Phase 26: Widgets
    if (widgetIds.length > 0) {
      await tx`DELETE FROM widget_course WHERE widget_id IN ${tx(widgetIds)}`;
      await tx`DELETE FROM widget_version WHERE widget_id IN ${tx(widgetIds)}`;
      await tx`DELETE FROM widget WHERE id IN ${tx(widgetIds)}`;
    }

    // Phase 27: Org config tables (most cascade from org, but explicit for safety)
    await tx`DELETE FROM organization_auth_policy WHERE organization_id = ${orgId}`;
    await tx`DELETE FROM organization_sso_config WHERE organization_id = ${orgId}`;
    await tx`DELETE FROM organization_token_auth WHERE organization_id = ${orgId}`;
    await tx`DELETE FROM organization_api_key WHERE organization_id = ${orgId}`;
    await tx`DELETE FROM organization_automation_usage WHERE organization_id = ${orgId}`;
    await tx`DELETE FROM organization_contacts WHERE organization_id = ${orgId}`;
    await tx`DELETE FROM organization_emaillist WHERE organization_id = ${orgId}`;
    await tx`DELETE FROM organization_plan WHERE org_id = ${orgId}`;

    // Phase 28: Organization members (email notifications cascade from member)
    await tx`DELETE FROM organizationmember_email_notifications WHERE organization_member_id IN (SELECT id FROM organizationmember WHERE organization_id = ${orgId})`;
    await tx`DELETE FROM organizationmember WHERE organization_id = ${orgId}`;

    // Phase 29: The organization itself
    await tx`DELETE FROM organization WHERE id = ${orgId}`;
  });
}

/**
 * Attempts to fully delete a user and all their data.
 *
 * FK order:
 *   1. session       (CASCADE from user — but explicit for safety)
 *   2. account       (CASCADE from user)
 *   3. sso_provider  (CASCADE from user)
 *   4. analytics_login_events  (RESTRICT to user.id)
 *   5. widget        (RESTRICT to user.id via createdByUserId)
 *   6. profile       (RESTRICT to user.id)
 *   7. user
 *
 * Returns true if the user was deleted, false if blocked by RESTRICT FKs.
 */
async function deleteUserAccount(sql: postgres.Sql, userId: string): Promise<boolean> {
  return sql
    .begin(async (tx) => {
      // Delete sessions (CASCADE, but explicit)
      await tx`DELETE FROM session WHERE user_id = ${userId}`;

      // Delete accounts (CASCADE, but explicit)
      await tx`DELETE FROM account WHERE user_id = ${userId}`;

      // Delete SSO providers (CASCADE, but explicit)
      await tx`DELETE FROM sso_provider WHERE user_id = ${userId}`;

      // Delete login events (RESTRICT FK)
      await tx`DELETE FROM analytics_login_events WHERE user_id = ${userId}`;

      // Delete widgets where this user is the creator (RESTRICT FK on createdByUserId)
      // First delete child tables, then the widget itself
      const userWidgets = await tx`SELECT id FROM widget WHERE created_by_user_id = ${userId}`;
      const widgetIds = userWidgets.map((w) => w.id);

      if (widgetIds.length > 0) {
        await tx`DELETE FROM widget_course WHERE widget_id IN ${tx(widgetIds)}`;
        await tx`DELETE FROM widget_version WHERE widget_id IN ${tx(widgetIds)}`;
        await tx`DELETE FROM widget WHERE id IN ${tx(widgetIds)}`;
      }

      // Delete profile (RESTRICT FK — profile.id = user.id)
      await tx`DELETE FROM profile WHERE id = ${userId}`;

      // Delete the user (session/account/sso cascade)
      await tx`DELETE FROM "user" WHERE id = ${userId}`;

      return true;
    })
    .then(() => true)
    .catch(() => false);
}

main();
