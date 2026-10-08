import { readFileSync } from 'node:fs';

import type postgres from 'postgres';

export type CsvAccountRow = {
  fullname: string;
  email: string;
  createdAt: string;
};

export type SpamHeuristic = {
  urlInFullname: boolean;
  cyrillicInFullname: boolean;
  disposableEmailPattern: boolean;
  gibberishFullname: boolean;
  emailAsFullname: boolean;
  score: number;
};

export type AccountActivity = {
  csvFullname: string;
  email: string;
  csvCreatedAt: string;
  foundInDb: boolean;
  userId: string | null;
  profileId: string | null;
  profileFullname: string | null;
  username: string | null;
  userCreatedAt: string | null;
  emailVerified: boolean | null;
  banned: boolean | null;
  banReason: string | null;
  sessionCount: number;
  heuristic: SpamHeuristic;
  adminOrgCount: number;
  tutorOrgCount: number;
  studentOrgCount: number;
  adminOrgs: Array<{
    orgId: string;
    orgName: string;
    siteName: string | null;
    orgCreatedAt: string;
    memberCreatedAt: string;
    lastActiveAt: string | null;
    plan: string | null;
    courseCount: number;
    publishedCourseCount: number;
    lessonCount: number;
    exerciseCount: number;
    orgInviteCount: number;
    orgInviteEmailsSent: number;
    courseInviteCount: number;
    courseInviteEmailsSent: number;
    widgetCount: number;
    cohortCount: number;
    programCount: number;
    orgMemberCount: number;
    landingPageHasExternalLink: boolean;
  }>;
  courseInvitesCreated: number;
  orgInvitesCreated: number;
  orgInviteEmailsSent: number;
  courseInviteEmailsSent: number;
  analyticsEventCount: number;
  distinctAnalyticsEventTypes: string[];
  communityQuestions: number;
  communityAnswers: number;
  courseNewsfeedPosts: number;
  assetsUploaded: number;
  enrolledCourseCount: number;
};

const ROLE_ADMIN = 1;
const ROLE_TUTOR = 2;
const ROLE_STUDENT = 3;

const URL_PATTERN = /https?:\/\/|www\./i;
const CYRILLIC_PATTERN = /[\u0400-\u04FF]/;
const DISPOSABLE_EMAIL_PATTERNS = [
  /^infojobes\+/i,
  /\+[\d]{6,}@gmail\.com$/i,
  /@(hiredify|uberip|montabella|21zv)\.com$/i
];
const GIBBERISH_PATTERN = /^[a-z0-9._\-]{1,20}$/i;

export function repoCsvPath(repoRoot: string, fileName = 'dump-28-09-29.csv'): string {
  return `${repoRoot}/company/data-export/${fileName}`;
}

export function parseCsv(content: string): CsvAccountRow[] {
  const lines = content.trim().split(/\r?\n/);
  const rows: CsvAccountRow[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex]?.trim();
    if (!line) continue;

    const fields = parseCsvLine(line);
    if (fields.length < 3) continue;

    rows.push({
      fullname: fields[0] ?? '',
      email: (fields[1] ?? '').trim().toLowerCase(),
      createdAt: fields[2] ?? ''
    });
  }

  return rows;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index++) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  fields.push(current);
  return fields;
}

export function classifySpamHeuristic(fullname: string, email: string): SpamHeuristic {
  const urlInFullname = URL_PATTERN.test(fullname);
  const cyrillicInFullname = CYRILLIC_PATTERN.test(fullname);
  const disposableEmailPattern = DISPOSABLE_EMAIL_PATTERNS.some((pattern) => pattern.test(email));
  const trimmedFullname = fullname.trim();
  const gibberishFullname =
    trimmedFullname.length > 0 &&
    trimmedFullname.length <= 12 &&
    GIBBERISH_PATTERN.test(trimmedFullname) &&
    !trimmedFullname.includes(' ');
  const emailAsFullname = trimmedFullname.toLowerCase() === email.toLowerCase();

  let score = 0;
  if (urlInFullname) score += 5;
  if (cyrillicInFullname && urlInFullname) score += 3;
  if (disposableEmailPattern) score += 3;
  if (gibberishFullname) score += 2;
  if (emailAsFullname) score += 1;

  return {
    urlInFullname,
    cyrillicInFullname,
    disposableEmailPattern,
    gibberishFullname,
    emailAsFullname,
    score
  };
}

export function isLikelySpam(row: CsvAccountRow): boolean {
  return classifySpamHeuristic(row.fullname, row.email).score >= 3;
}

function landingPageHasExternalLink(landingpage: unknown): boolean {
  if (!landingpage || typeof landingpage !== 'object') return false;

  const serialized = JSON.stringify(landingpage).toLowerCase();
  return serialized.includes('http://') || serialized.includes('https://');
}

export async function analyzeAccounts(sql: postgres.Sql, rows: CsvAccountRow[]): Promise<AccountActivity[]> {
  if (rows.length === 0) return [];

  const emails = rows.map((row) => row.email);

  const users = await sql<
    Array<{
      user_id: string;
      email: string;
      user_created_at: Date;
      email_verified: boolean;
      banned: boolean | null;
      ban_reason: string | null;
      profile_id: string | null;
      profile_fullname: string | null;
      username: string | null;
      profile_created_at: string | null;
    }>
  >`
    SELECT
      u.id AS user_id,
      lower(u.email) AS email,
      u.created_at AS user_created_at,
      u.email_verified,
      u.banned,
      u.ban_reason,
      p.id AS profile_id,
      p.fullname AS profile_fullname,
      p.username,
      p.created_at AS profile_created_at
    FROM "user" u
    LEFT JOIN profile p ON p.id = u.id
    WHERE lower(u.email) = ANY(${emails})
  `;

  const userByEmail = new Map(users.map((user) => [user.email, user]));
  const profileIds = users.map((user) => user.profile_id).filter((id): id is string => Boolean(id));
  const userIds = users.map((user) => user.user_id);

  const sessionCounts =
    userIds.length === 0
      ? []
      : await sql<Array<{ user_id: string; session_count: number }>>`
          SELECT user_id, count(*)::int AS session_count
          FROM "session"
          WHERE user_id = ANY(${userIds})
          GROUP BY user_id
        `;

  const sessionCountByUser = new Map(sessionCounts.map((row) => [row.user_id, row.session_count]));

  const memberships =
    profileIds.length === 0
      ? []
      : await sql<
          Array<{
            profile_id: string;
            organization_id: string;
            role_id: number;
            role_type: string;
            org_name: string;
            siteName: string | null;
            org_created_at: string;
            member_created_at: string;
            last_active_at: string | null;
            plan_name: string | null;
          }>
        >`
          SELECT
            om.profile_id,
            om.organization_id,
            om.role_id,
            r.type AS role_type,
            o.name AS org_name,
            o."siteName",
            o.created_at AS org_created_at,
            om.created_at AS member_created_at,
            om.last_active_at,
            op.plan_name
          FROM organizationmember om
          JOIN role r ON r.id = om.role_id
          JOIN organization o ON o.id = om.organization_id
          LEFT JOIN organization_plan op ON op.org_id = o.id AND op.is_active = true
          WHERE om.profile_id = ANY(${profileIds})
            AND om.status = 'ACTIVE'
        `;

  const adminOrgIds = [
    ...new Set(memberships.filter((row) => Number(row.role_id) === ROLE_ADMIN).map((row) => row.organization_id))
  ];

  const orgCourseStats =
    adminOrgIds.length === 0
      ? []
      : await sql<
          Array<{
            organization_id: string;
            course_count: number;
            published_course_count: number;
            lesson_count: number;
            exercise_count: number;
          }>
        >`
          SELECT
            g.organization_id,
            count(DISTINCT c.id)::int AS course_count,
            count(DISTINCT c.id) FILTER (WHERE c.is_published = true)::int AS published_course_count,
            count(DISTINCT l.id)::int AS lesson_count,
            count(DISTINCT e.id)::int AS exercise_count
          FROM "group" g
          LEFT JOIN course c ON c.group_id = g.id AND c.status = 'ACTIVE'
          LEFT JOIN lesson l ON l.course_id = c.id
          LEFT JOIN exercise e ON e.course_id = c.id
          WHERE g.organization_id = ANY(${adminOrgIds})
          GROUP BY g.organization_id
        `;

  const orgInviteStats =
    adminOrgIds.length === 0
      ? []
      : await sql<
          Array<{
            organization_id: string;
            org_invite_count: number;
            org_invite_emails_sent: number;
          }>
        >`
          SELECT
            oi.organization_id,
            count(DISTINCT oi.id)::int AS org_invite_count,
            count(DISTINCT oia.id) FILTER (WHERE oia.event_type = 'EMAIL_SENT')::int AS org_invite_emails_sent
          FROM organization_invite oi
          LEFT JOIN organization_invite_audit oia ON oia.invite_id = oi.id
          WHERE oi.organization_id = ANY(${adminOrgIds})
          GROUP BY oi.organization_id
        `;

  const orgCourseInviteStats =
    adminOrgIds.length === 0
      ? []
      : await sql<
          Array<{
            organization_id: string;
            course_invite_count: number;
            course_invite_emails_sent: number;
          }>
        >`
          SELECT
            g.organization_id,
            count(DISTINCT ci.id)::int AS course_invite_count,
            count(DISTINCT cia.id) FILTER (WHERE cia.event_type = 'EMAIL_SENT')::int AS course_invite_emails_sent
          FROM "group" g
          JOIN course c ON c.group_id = g.id
          LEFT JOIN course_invite ci ON ci.course_id = c.id
          LEFT JOIN course_invite_audit cia ON cia.invite_id = ci.id
          WHERE g.organization_id = ANY(${adminOrgIds})
          GROUP BY g.organization_id
        `;

  const orgWidgetStats =
    adminOrgIds.length === 0
      ? []
      : await sql<Array<{ organization_id: string; widget_count: number }>>`
          SELECT organization_id, count(*)::int AS widget_count
          FROM widget
          WHERE organization_id = ANY(${adminOrgIds})
            AND deleted_at IS NULL
          GROUP BY organization_id
        `;

  const orgCohortStats =
    adminOrgIds.length === 0
      ? []
      : await sql<Array<{ organization_id: string; cohort_count: number }>>`
          SELECT organization_id, count(*)::int AS cohort_count
          FROM cohort
          WHERE organization_id = ANY(${adminOrgIds})
          GROUP BY organization_id
        `;

  const orgProgramStats =
    adminOrgIds.length === 0
      ? []
      : await sql<Array<{ organization_id: string; program_count: number }>>`
          SELECT organization_id, count(*)::int AS program_count
          FROM program
          WHERE organization_id = ANY(${adminOrgIds})
          GROUP BY organization_id
        `;

  const orgMemberStats =
    adminOrgIds.length === 0
      ? []
      : await sql<Array<{ organization_id: string; org_member_count: number }>>`
          SELECT organization_id, count(*)::int AS org_member_count
          FROM organizationmember
          WHERE organization_id = ANY(${adminOrgIds})
            AND status = 'ACTIVE'
          GROUP BY organization_id
        `;

  const orgLandingPages =
    adminOrgIds.length === 0
      ? []
      : await sql<Array<{ id: string; landingpage: unknown }>>`
          SELECT id, landingpage
          FROM organization
          WHERE id = ANY(${adminOrgIds})
        `;

  const profileInviteStats =
    profileIds.length === 0
      ? []
      : await sql<
          Array<{
            profile_id: string;
            course_invites_created: number;
            org_invites_created: number;
            org_invite_emails_sent: number;
            course_invite_emails_sent: number;
          }>
        >`
          SELECT
            p.id AS profile_id,
            (
              SELECT count(*)::int
              FROM course_invite ci
              WHERE ci.created_by_profile_id = p.id
            ) AS course_invites_created,
            (
              SELECT count(*)::int
              FROM organization_invite oi
              WHERE oi.created_by_profile_id = p.id
            ) AS org_invites_created,
            (
              SELECT count(*)::int
              FROM organization_invite_audit oia
              JOIN organization_invite oi ON oi.id = oia.invite_id
              WHERE oi.created_by_profile_id = p.id
                AND oia.event_type = 'EMAIL_SENT'
            ) AS org_invite_emails_sent,
            (
              SELECT count(*)::int
              FROM course_invite_audit cia
              JOIN course_invite ci ON ci.id = cia.invite_id
              WHERE ci.created_by_profile_id = p.id
                AND cia.event_type = 'EMAIL_SENT'
            ) AS course_invite_emails_sent
          FROM profile p
          WHERE p.id = ANY(${profileIds})
        `;

  const analyticsStats =
    userIds.length === 0
      ? []
      : await sql<Array<{ user_id: string; event_count: number; event_types: string[] }>>`
          SELECT
            user_id,
            count(*)::int AS event_count,
            array_agg(DISTINCT event_type ORDER BY event_type) AS event_types
          FROM analytics_page_event
          WHERE user_id = ANY(${userIds})
          GROUP BY user_id
        `;

  const communityQuestionStats =
    profileIds.length === 0
      ? []
      : await sql<Array<{ profile_id: string; question_count: number }>>`
          SELECT author_profile_id AS profile_id, count(*)::int AS question_count
          FROM community_question
          WHERE author_profile_id = ANY(${profileIds})
          GROUP BY author_profile_id
        `;

  const communityAnswerStats =
    profileIds.length === 0
      ? []
      : await sql<Array<{ profile_id: string; answer_count: number }>>`
          SELECT author_profile_id AS profile_id, count(*)::int AS answer_count
          FROM community_answer
          WHERE author_profile_id = ANY(${profileIds})
          GROUP BY author_profile_id
        `;

  const newsfeedStats =
    profileIds.length === 0
      ? []
      : await sql<Array<{ profile_id: string; post_count: number }>>`
          SELECT gm.profile_id, count(*)::int AS post_count
          FROM course_newsfeed cn
          JOIN groupmember gm ON gm.id = cn.author_id
          WHERE gm.profile_id = ANY(${profileIds})
          GROUP BY gm.profile_id
        `;

  const assetStats =
    profileIds.length === 0
      ? []
      : await sql<Array<{ profile_id: string; asset_count: number }>>`
          SELECT created_by_profile_id AS profile_id, count(*)::int AS asset_count
          FROM assets
          WHERE created_by_profile_id = ANY(${profileIds})
          GROUP BY created_by_profile_id
        `;

  const enrollmentStats =
    profileIds.length === 0
      ? []
      : await sql<Array<{ profile_id: string; enrolled_course_count: number }>>`
          SELECT gm.profile_id, count(DISTINCT c.id)::int AS enrolled_course_count
          FROM groupmember gm
          JOIN "group" g ON g.id = gm.group_id
          JOIN course c ON c.group_id = g.id
          WHERE gm.profile_id = ANY(${profileIds})
            AND gm.role_id = ${ROLE_STUDENT}
          GROUP BY gm.profile_id
        `;

  const courseStatsByOrg = new Map(orgCourseStats.map((row) => [row.organization_id, row]));
  const orgInviteStatsByOrg = new Map(orgInviteStats.map((row) => [row.organization_id, row]));
  const courseInviteStatsByOrg = new Map(orgCourseInviteStats.map((row) => [row.organization_id, row]));
  const widgetStatsByOrg = new Map(orgWidgetStats.map((row) => [row.organization_id, row]));
  const cohortStatsByOrg = new Map(orgCohortStats.map((row) => [row.organization_id, row]));
  const programStatsByOrg = new Map(orgProgramStats.map((row) => [row.organization_id, row]));
  const memberStatsByOrg = new Map(orgMemberStats.map((row) => [row.organization_id, row]));
  const landingPageByOrg = new Map(orgLandingPages.map((row) => [row.id, row.landingpage]));
  const profileInviteStatsByProfile = new Map(profileInviteStats.map((row) => [row.profile_id, row]));
  const analyticsByUser = new Map(analyticsStats.map((row) => [row.user_id, row]));
  const communityQuestionsByProfile = new Map(
    communityQuestionStats.map((row) => [row.profile_id, row.question_count])
  );
  const communityAnswersByProfile = new Map(communityAnswerStats.map((row) => [row.profile_id, row.answer_count]));
  const newsfeedByProfile = new Map(newsfeedStats.map((row) => [row.profile_id, row.post_count]));
  const assetsByProfile = new Map(assetStats.map((row) => [row.profile_id, row.asset_count]));
  const enrollmentsByProfile = new Map(enrollmentStats.map((row) => [row.profile_id, row.enrolled_course_count]));

  const membershipsByProfile = new Map<string, Array<(typeof memberships)[number]>>();
  for (const membership of memberships) {
    const existing = membershipsByProfile.get(membership.profile_id) ?? [];
    existing.push(membership);
    membershipsByProfile.set(membership.profile_id, existing);
  }

  return rows.map((row) => {
    const heuristic = classifySpamHeuristic(row.fullname, row.email);
    const user = userByEmail.get(row.email);

    if (!user) {
      return emptyActivity(row, heuristic);
    }

    const profileMemberships = membershipsByProfile.get(user.profile_id ?? '') ?? [];
    const adminMemberships = profileMemberships.filter((membership) => Number(membership.role_id) === ROLE_ADMIN);

    const adminOrgs = adminMemberships.map((membership) => {
      const courseStats = courseStatsByOrg.get(membership.organization_id);
      const orgInvites = orgInviteStatsByOrg.get(membership.organization_id);
      const courseInvites = courseInviteStatsByOrg.get(membership.organization_id);

      return {
        orgId: membership.organization_id,
        orgName: membership.org_name,
        siteName: membership.siteName,
        orgCreatedAt: membership.org_created_at,
        memberCreatedAt: membership.member_created_at,
        lastActiveAt: membership.last_active_at,
        plan: membership.plan_name,
        courseCount: courseStats?.course_count ?? 0,
        publishedCourseCount: courseStats?.published_course_count ?? 0,
        lessonCount: courseStats?.lesson_count ?? 0,
        exerciseCount: courseStats?.exercise_count ?? 0,
        orgInviteCount: orgInvites?.org_invite_count ?? 0,
        orgInviteEmailsSent: orgInvites?.org_invite_emails_sent ?? 0,
        courseInviteCount: courseInvites?.course_invite_count ?? 0,
        courseInviteEmailsSent: courseInvites?.course_invite_emails_sent ?? 0,
        widgetCount: widgetStatsByOrg.get(membership.organization_id)?.widget_count ?? 0,
        cohortCount: cohortStatsByOrg.get(membership.organization_id)?.cohort_count ?? 0,
        programCount: programStatsByOrg.get(membership.organization_id)?.program_count ?? 0,
        orgMemberCount: memberStatsByOrg.get(membership.organization_id)?.org_member_count ?? 0,
        landingPageHasExternalLink: landingPageHasExternalLink(landingPageByOrg.get(membership.organization_id))
      };
    });

    const inviteStats = user.profile_id ? profileInviteStatsByProfile.get(user.profile_id) : undefined;
    const analytics = analyticsByUser.get(user.user_id);

    return {
      csvFullname: row.fullname,
      email: row.email,
      csvCreatedAt: row.createdAt,
      foundInDb: true,
      userId: user.user_id,
      profileId: user.profile_id,
      profileFullname: user.profile_fullname,
      username: user.username,
      userCreatedAt: user.user_created_at.toISOString(),
      emailVerified: user.email_verified,
      banned: user.banned,
      banReason: user.ban_reason,
      sessionCount: sessionCountByUser.get(user.user_id) ?? 0,
      heuristic,
      adminOrgCount: profileMemberships.filter((membership) => Number(membership.role_id) === ROLE_ADMIN).length,
      tutorOrgCount: profileMemberships.filter((membership) => Number(membership.role_id) === ROLE_TUTOR).length,
      studentOrgCount: profileMemberships.filter((membership) => Number(membership.role_id) === ROLE_STUDENT).length,
      adminOrgs,
      courseInvitesCreated: inviteStats?.course_invites_created ?? 0,
      orgInvitesCreated: inviteStats?.org_invites_created ?? 0,
      orgInviteEmailsSent: inviteStats?.org_invite_emails_sent ?? 0,
      courseInviteEmailsSent: inviteStats?.course_invite_emails_sent ?? 0,
      analyticsEventCount: analytics?.event_count ?? 0,
      distinctAnalyticsEventTypes: analytics?.event_types ?? [],
      communityQuestions: user.profile_id ? (communityQuestionsByProfile.get(user.profile_id) ?? 0) : 0,
      communityAnswers: user.profile_id ? (communityAnswersByProfile.get(user.profile_id) ?? 0) : 0,
      courseNewsfeedPosts: user.profile_id ? (newsfeedByProfile.get(user.profile_id) ?? 0) : 0,
      assetsUploaded: user.profile_id ? (assetsByProfile.get(user.profile_id) ?? 0) : 0,
      enrolledCourseCount: user.profile_id ? (enrollmentsByProfile.get(user.profile_id) ?? 0) : 0
    };
  });
}

function emptyActivity(row: CsvAccountRow, heuristic: SpamHeuristic): AccountActivity {
  return {
    csvFullname: row.fullname,
    email: row.email,
    csvCreatedAt: row.createdAt,
    foundInDb: false,
    userId: null,
    profileId: null,
    profileFullname: null,
    username: null,
    userCreatedAt: null,
    emailVerified: null,
    banned: null,
    banReason: null,
    sessionCount: 0,
    heuristic,
    adminOrgCount: 0,
    tutorOrgCount: 0,
    studentOrgCount: 0,
    adminOrgs: [],
    courseInvitesCreated: 0,
    orgInvitesCreated: 0,
    orgInviteEmailsSent: 0,
    courseInviteEmailsSent: 0,
    analyticsEventCount: 0,
    distinctAnalyticsEventTypes: [],
    communityQuestions: 0,
    communityAnswers: 0,
    courseNewsfeedPosts: 0,
    assetsUploaded: 0,
    enrolledCourseCount: 0
  };
}

export function loadCsvAccounts(csvPath: string): CsvAccountRow[] {
  const content = readFileSync(csvPath, 'utf8');
  return parseCsv(content);
}

export type ActivitySummary = {
  totalCsvRows: number;
  likelySpamRows: number;
  foundInDb: number;
  notFoundInDb: number;
  withAdminOrg: number;
  withAnyOrg: number;
  signupOnly: number;
  createdCourses: number;
  publishedCourses: number;
  sentAnyInviteEmail: number;
  withAnalyticsEvents: number;
  banned: number;
  emailVerified: number;
  avgCoursesPerAdminOrg: number;
  signupBurstAccounts: number;
};

export function summarizeActivities(activities: AccountActivity[]): ActivitySummary {
  const likelySpam = activities.filter((activity) => activity.heuristic.score >= 3);
  const found = activities.filter((activity) => activity.foundInDb);
  const withAdminOrg = found.filter((activity) => activity.adminOrgCount > 0);
  const withAnyOrg = found.filter(
    (activity) => activity.adminOrgCount + activity.tutorOrgCount + activity.studentOrgCount > 0
  );
  const signupOnly = found.filter(
    (activity) => activity.adminOrgCount + activity.tutorOrgCount + activity.studentOrgCount === 0
  );

  const totalCourses = withAdminOrg.reduce(
    (sum, activity) => sum + activity.adminOrgs.reduce((orgSum, org) => orgSum + org.courseCount, 0),
    0
  );
  const totalPublishedCourses = withAdminOrg.reduce(
    (sum, activity) => sum + activity.adminOrgs.reduce((orgSum, org) => orgSum + org.publishedCourseCount, 0),
    0
  );
  const totalAdminOrgs = withAdminOrg.reduce((sum, activity) => sum + activity.adminOrgCount, 0);

  const signupTimestamps = likelySpam
    .map((activity) => new Date(activity.csvCreatedAt).getTime())
    .filter((timestamp) => !Number.isNaN(timestamp))
    .sort((left, right) => left - right);

  let burstAccounts = 0;
  if (signupTimestamps.length >= 2) {
    const windowMs = 60 * 60 * 1000;
    let windowStart = signupTimestamps[0];
    let windowCount = 1;

    for (let index = 1; index < signupTimestamps.length; index++) {
      const timestamp = signupTimestamps[index];
      if (timestamp - windowStart <= windowMs) {
        windowCount++;
      } else {
        if (windowCount >= 5) burstAccounts = Math.max(burstAccounts, windowCount);
        windowStart = timestamp;
        windowCount = 1;
      }
    }

    if (windowCount >= 5) burstAccounts = Math.max(burstAccounts, windowCount);
  }

  return {
    totalCsvRows: activities.length,
    likelySpamRows: likelySpam.length,
    foundInDb: found.length,
    notFoundInDb: activities.length - found.length,
    withAdminOrg: withAdminOrg.length,
    withAnyOrg: withAnyOrg.length,
    signupOnly: signupOnly.length,
    createdCourses: totalCourses,
    publishedCourses: totalPublishedCourses,
    sentAnyInviteEmail: found.filter(
      (activity) => activity.orgInviteEmailsSent > 0 || activity.courseInviteEmailsSent > 0
    ).length,
    withAnalyticsEvents: found.filter((activity) => activity.analyticsEventCount > 0).length,
    banned: found.filter((activity) => activity.banned).length,
    emailVerified: found.filter((activity) => activity.emailVerified).length,
    avgCoursesPerAdminOrg: totalAdminOrgs > 0 ? Number((totalCourses / totalAdminOrgs).toFixed(2)) : 0,
    signupBurstAccounts: burstAccounts
  };
}

export function formatActivityLine(activity: AccountActivity): string {
  const flags = [
    activity.heuristic.urlInFullname ? 'url-name' : null,
    activity.heuristic.cyrillicInFullname ? 'cyrillic' : null,
    activity.heuristic.disposableEmailPattern ? 'disposable-email' : null,
    activity.adminOrgCount > 0 ? `admin:${activity.adminOrgCount}` : null,
    activity.enrolledCourseCount > 0 ? `enrolled:${activity.enrolledCourseCount}` : null
  ]
    .filter(Boolean)
    .join(', ');

  const orgSummary = activity.adminOrgs
    .map(
      (org) =>
        `${org.siteName ?? org.orgName}(courses=${org.courseCount},published=${org.publishedCourseCount},invites=${org.orgInviteEmailsSent + org.courseInviteEmailsSent})`
    )
    .join('; ');

  return [
    activity.email,
    activity.foundInDb ? 'found' : 'missing',
    `spamScore=${activity.heuristic.score}`,
    flags || 'no-flags',
    `sessions=${activity.sessionCount}`,
    `analytics=${activity.analyticsEventCount}`,
    orgSummary || 'no-admin-org'
  ].join(' | ');
}
