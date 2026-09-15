/**
 * Shared cascade-deletion helpers used by org deletion scripts.
 *
 * `deleteOrganization` removes an organization and ALL associated data by
 * walking every child table (courses, lessons, exercises, submissions,
 * groupmembers, tags, assets, widgets, programs, cohorts, AI data,
 * analytics, etc.) in reverse dependency order before removing the org.
 */
import type postgres from 'postgres';

export type OrgDataCounts = {
  courses: number;
  groups: number;
  orgMembers: number;
  groupMembers: number;
  lessons: number;
  exercises: number;
  submissions: number;
};

export async function countOrgData(sql: postgres.Sql, orgId: string): Promise<OrgDataCounts> {
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

export function printCounts(counts: OrgDataCounts) {
  console.log(`  Groups (course groups):  ${counts.groups}`);
  console.log(`  Courses:                ${counts.courses}`);
  console.log(`  Lessons:                ${counts.lessons}`);
  console.log(`  Exercises:              ${counts.exercises}`);
  console.log(`  Submissions:            ${counts.submissions}`);
  console.log(`  Org members:            ${counts.orgMembers}`);
  console.log(`  Group members (enrolled students/tutors): ${counts.groupMembers}`);
}

export async function deleteOrganization(sql: postgres.Sql, orgId: string) {
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
      SELECT id FROM organizationmember WHERE organization_id = ${orgId}
    `;
    const orgMemberIds = orgMembers.map((om) => om.id);

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
