import { and, db, eq, inArray, isNull, notInArray, orgNote, orgNoteFavorite, orgNoteShare } from '@db/drizzle';
import type { TNewOrgNote, TNewOrgNoteFavorite, TNewOrgNoteShare } from '@db/types';

interface SeedNotesArgs {
  testOrgId: string;
  adminUserId: string;
  studentUserId: string;
  mvcCourseId: string;
  reactCourseId: string;
}

// ---------- Stable note IDs (udemy-test demo workspace) ----------

const NOTE_IDS = {
  // Private tree (admin) — default personal starter concept
  personalRoot: '8f000000-1000-4000-8000-000000000001',
  personalWeekGoals: '8f000000-1000-4000-8000-000000000002',
  personalMvcPrep: '8f000000-1000-4000-8000-000000000003',

  // Workspace tree (admin, team visibility) — default org starter concept
  orgPlaybookRoot: '8f000000-2000-4000-8000-000000000001',
  orgWeeklyReview: '8f000000-2000-4000-8000-000000000002',
  orgFeedbackThemes: '8f000000-2000-4000-8000-000000000003',
  orgActionItems: '8f000000-2000-4000-8000-000000000004',

  // Workspace flat (admin, team) — linked to React course
  reactLaunch: '8f000000-2000-4000-8000-000000000005',

  // Shared tree (student owned, shared with admin)
  sharedRoot: '8f000000-3000-4000-8000-000000000001',
  sharedMvcHomework: '8f000000-3000-4000-8000-000000000002',
  sharedQuizTopics: '8f000000-3000-4000-8000-000000000003',

  // Org templates (templates page)
  personalTemplate: '8f000000-4000-4000-8000-000000000001',
  teamTemplate: '8f000000-4000-4000-8000-000000000002'
} as const;

const SEED_NOTE_IDS = Object.values(NOTE_IDS);

const NON_TEMPLATE_SEED_NOTE_IDS = SEED_NOTE_IDS.filter(
  (id) => id !== NOTE_IDS.personalTemplate && id !== NOTE_IDS.teamTemplate
);

const FAVORITE_NOTE_IDS = [
  NOTE_IDS.personalRoot,
  NOTE_IDS.orgPlaybookRoot,
  NOTE_IDS.sharedRoot,
  NOTE_IDS.personalMvcPrep
] as const;

function noteContent(paragraphs: string[]) {
  return paragraphs.map((text) => `<p>${text}</p>`).join('');
}

function plainText(paragraphs: string[]) {
  return paragraphs.join(' ');
}

function buildNotes({
  testOrgId,
  adminUserId,
  studentUserId,
  mvcCourseId,
  reactCourseId
}: SeedNotesArgs): TNewOrgNote[] {
  const now = new Date().toISOString();

  return [
    // --- Private: 3-level nested personal starter ---
    {
      id: NOTE_IDS.personalRoot,
      organizationId: testOrgId,
      ownerId: adminUserId,
      title: 'My workspace',
      content: noteContent([
        'Welcome to your personal notes area. Use this page to capture ideas, todos, and scratch work.',
        'This is the default personal starter note — a simple hub you can branch from.'
      ]),
      plainText: plainText([
        'Welcome to your personal notes area. Use this page to capture ideas, todos, and scratch work.',
        'This is the default personal starter note — a simple hub you can branch from.'
      ]),
      visibility: 'private',
      parentId: null,
      sortOrder: 0,
      updatedAt: now
    },
    {
      id: NOTE_IDS.personalWeekGoals,
      organizationId: testOrgId,
      ownerId: adminUserId,
      title: 'Week goals',
      content: noteContent([
        'Ship the MVC lab walkthrough.',
        'Review student submissions for the React cohort.',
        'Prep slides for the pandas intro session.'
      ]),
      plainText: plainText([
        'Ship the MVC lab walkthrough.',
        'Review student submissions for the React cohort.',
        'Prep slides for the pandas intro session.'
      ]),
      visibility: 'private',
      parentId: NOTE_IDS.personalRoot,
      sortOrder: 0,
      updatedAt: now
    },
    {
      id: NOTE_IDS.personalMvcPrep,
      organizationId: testOrgId,
      ownerId: adminUserId,
      title: 'MVC lab prep',
      content: noteContent([
        'Outline controller responsibilities and route naming conventions.',
        'Link demo repo and highlight the three starter exercises.',
        'Reminder: walk through the Getting started with MVC course structure first.'
      ]),
      plainText: plainText([
        'Outline controller responsibilities and route naming conventions.',
        'Link demo repo and highlight the three starter exercises.',
        'Reminder: walk through the Getting started with MVC course structure first.'
      ]),
      visibility: 'private',
      courseId: mvcCourseId,
      parentId: NOTE_IDS.personalWeekGoals,
      sortOrder: 0,
      updatedAt: now
    },

    // --- Workspace: 4-level nested org playbook ---
    {
      id: NOTE_IDS.orgPlaybookRoot,
      organizationId: testOrgId,
      ownerId: adminUserId,
      title: 'Instructor playbook',
      content: noteContent([
        'Shared team playbook for Udemy Test instructors.',
        'This is the default organization starter — a living doc for how we run courses.'
      ]),
      plainText: plainText([
        'Shared team playbook for Udemy Test instructors.',
        'This is the default organization starter — a living doc for how we run courses.'
      ]),
      visibility: 'team',
      parentId: null,
      sortOrder: 0,
      updatedAt: now
    },
    {
      id: NOTE_IDS.orgWeeklyReview,
      organizationId: testOrgId,
      ownerId: adminUserId,
      title: 'Weekly review checklist',
      content: noteContent([
        'Review course completion rates across MVC, React, and Pandas tracks.',
        'Scan community threads for unanswered questions.',
        'Update office hours calendar.'
      ]),
      plainText: plainText([
        'Review course completion rates across MVC, React, and Pandas tracks.',
        'Scan community threads for unanswered questions.',
        'Update office hours calendar.'
      ]),
      visibility: 'team',
      parentId: NOTE_IDS.orgPlaybookRoot,
      sortOrder: 0,
      updatedAt: now
    },
    {
      id: NOTE_IDS.orgFeedbackThemes,
      organizationId: testOrgId,
      ownerId: adminUserId,
      title: 'Student feedback themes',
      content: noteContent([
        'Learners want more hands-on labs in week two.',
        'Several students asked for slower pacing on React hooks.',
        'Positive signal: pandas cheat sheet downloads are up.'
      ]),
      plainText: plainText([
        'Learners want more hands-on labs in week two.',
        'Several students asked for slower pacing on React hooks.',
        'Positive signal: pandas cheat sheet downloads are up.'
      ]),
      visibility: 'team',
      parentId: NOTE_IDS.orgWeeklyReview,
      sortOrder: 0,
      updatedAt: now
    },
    {
      id: NOTE_IDS.orgActionItems,
      organizationId: testOrgId,
      ownerId: adminUserId,
      title: 'Q1 action items',
      content: noteContent([
        'Add a bonus React hooks recap lesson.',
        'Publish MVC troubleshooting FAQ.',
        'Schedule co-teaching session for pandas capstone.'
      ]),
      plainText: plainText([
        'Add a bonus React hooks recap lesson.',
        'Publish MVC troubleshooting FAQ.',
        'Schedule co-teaching session for pandas capstone.'
      ]),
      visibility: 'team',
      parentId: NOTE_IDS.orgFeedbackThemes,
      sortOrder: 0,
      updatedAt: now
    },
    {
      id: NOTE_IDS.reactLaunch,
      organizationId: testOrgId,
      ownerId: adminUserId,
      title: 'React course launch',
      content: noteContent([
        'Launch checklist for Modern Web Development with React.',
        'Landing page copy draft, email announcement, and cohort kickoff agenda.'
      ]),
      plainText: plainText([
        'Launch checklist for Modern Web Development with React.',
        'Landing page copy draft, email announcement, and cohort kickoff agenda.'
      ]),
      visibility: 'team',
      courseId: reactCourseId,
      parentId: null,
      sortOrder: 1,
      updatedAt: now
    },

    // --- Shared with admin: student-owned private notes ---
    {
      id: NOTE_IDS.sharedRoot,
      organizationId: testOrgId,
      ownerId: studentUserId,
      title: 'Study group notes',
      content: noteContent([
        'Notes from our weekly study group (John Doe).',
        'Shared with the instructor for feedback on our learning plan.'
      ]),
      plainText: plainText([
        'Notes from our weekly study group (John Doe).',
        'Shared with the instructor for feedback on our learning plan.'
      ]),
      visibility: 'private',
      parentId: null,
      sortOrder: 0,
      updatedAt: now
    },
    {
      id: NOTE_IDS.sharedMvcHomework,
      organizationId: testOrgId,
      ownerId: studentUserId,
      title: 'MVC homework outline',
      content: noteContent([
        'Problem set 1: routing and controllers.',
        'Open questions on dependency injection patterns.'
      ]),
      plainText: plainText([
        'Problem set 1: routing and controllers.',
        'Open questions on dependency injection patterns.'
      ]),
      visibility: 'private',
      courseId: mvcCourseId,
      parentId: NOTE_IDS.sharedRoot,
      sortOrder: 0,
      updatedAt: now
    },
    {
      id: NOTE_IDS.sharedQuizTopics,
      organizationId: testOrgId,
      ownerId: studentUserId,
      title: 'Practice quiz topics',
      content: noteContent([
        'MVC request lifecycle, view models, and partial views.',
        'Need help distinguishing service layer vs repository layer.'
      ]),
      plainText: plainText([
        'MVC request lifecycle, view models, and partial views.',
        'Need help distinguishing service layer vs repository layer.'
      ]),
      visibility: 'private',
      parentId: NOTE_IDS.sharedMvcHomework,
      sortOrder: 0,
      updatedAt: now
    },

    // --- Templates (shown on Templates page, not sidebar) ---
    {
      id: NOTE_IDS.personalTemplate,
      organizationId: testOrgId,
      ownerId: adminUserId,
      title: 'Personal journal',
      content: noteContent([
        'Date:',
        'What went well today?',
        'What should I focus on tomorrow?',
        'Notes & reflections:'
      ]),
      plainText: plainText([
        'Date:',
        'What went well today?',
        'What should I focus on tomorrow?',
        'Notes & reflections:'
      ]),
      visibility: 'private',
      isTemplate: true,
      parentId: null,
      sortOrder: 0,
      updatedAt: now
    },
    {
      id: NOTE_IDS.teamTemplate,
      organizationId: testOrgId,
      ownerId: adminUserId,
      title: 'Team meeting notes',
      content: noteContent([
        'Attendees:',
        'Agenda:',
        'Discussion notes:',
        'Action items (owner / due date):'
      ]),
      plainText: plainText([
        'Attendees:',
        'Agenda:',
        'Discussion notes:',
        'Action items (owner / due date):'
      ]),
      visibility: 'team',
      isTemplate: true,
      parentId: null,
      sortOrder: 0,
      updatedAt: now
    }
  ];
}

function buildFavorites(adminUserId: string): TNewOrgNoteFavorite[] {
  return FAVORITE_NOTE_IDS.map((noteId) => ({
    profileId: adminUserId,
    noteId
  }));
}

function buildShares(adminUserId: string, studentUserId: string): TNewOrgNoteShare[] {
  const sharedNoteIds = [NOTE_IDS.sharedRoot, NOTE_IDS.sharedMvcHomework, NOTE_IDS.sharedQuizTopics];

  return sharedNoteIds.map((noteId) => ({
    noteId,
    profileId: adminUserId,
    sharedBy: studentUserId,
    permission: 'read' as const
  }));
}

export async function seedNotes({
  testOrgId,
  adminUserId,
  studentUserId,
  mvcCourseId,
  reactCourseId
}: SeedNotesArgs) {
  const now = new Date().toISOString();

  // Keep udemy-test tidy by removing ad-hoc workspace notes from manual testing.
  const cleaned = await db
    .update(orgNote)
    .set({ deletedAt: now, updatedAt: now })
    .where(
      and(
        eq(orgNote.organizationId, testOrgId),
        eq(orgNote.origin, 'workspace'),
        eq(orgNote.isTemplate, false),
        isNull(orgNote.deletedAt),
        notInArray(orgNote.id, NON_TEMPLATE_SEED_NOTE_IDS)
      )
    )
    .returning({ id: orgNote.id });

  if (cleaned.length > 0) {
    console.log(`   ✓ Soft-deleted ${cleaned.length} stray workspace note(s)`);
  }

  const existing = await db
    .select({ id: orgNote.id })
    .from(orgNote)
    .where(inArray(orgNote.id, SEED_NOTE_IDS));

  if (existing.length > 0) {
    console.log('   ✓ Notes demo data already exists, skipping');
    return;
  }

  const notes = buildNotes({ testOrgId, adminUserId, studentUserId, mvcCourseId, reactCourseId });

  await db.insert(orgNote).values(notes);
  console.log(`   ✓ Inserted ${notes.length} demo note(s)`);

  const favorites = buildFavorites(adminUserId);
  await db.insert(orgNoteFavorite).values(favorites);
  console.log(`   ✓ Inserted ${favorites.length} favorite(s) for admin`);

  const shares = buildShares(adminUserId, studentUserId);
  await db.insert(orgNoteShare).values(shares);
  console.log(`   ✓ Inserted ${shares.length} share grant(s) for admin`);
}
