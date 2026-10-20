import 'dotenv/config';

import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { AgentRole } from '@cio/ai-assistant';
import { buildStudentContextMessage, buildTeacherContextMessage } from '@cio/ai-assistant/prompt';
import { ZAgentChatBody } from '@cio/utils/validation/agent/agent';
import { ContentType } from '@cio/utils/constants/content';
import { reorderContentParam } from '@cio/core/services/agent/agent-tool-schemas';

const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.PRIVATE_DATABASE_URL || process.env.PGBOUNCER_DATABASE_URL
);

type AgentFixture = {
  orgId: string;
  groupId: string;
  courseId: string;
  sectionId: string;
  activityId: string;
  otherCourseId: string;
};

async function createAgentFixture(suffix: string): Promise<AgentFixture> {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  const [organization] = await db
    .insert(schema.organization)
    .values({ name: `char-agent-${suffix}` })
    .returning();
  const [group] = await db
    .insert(schema.group)
    .values({ name: `char-agent-${suffix}`, organizationId: organization.id })
    .returning();
  const [course] = await db
    .insert(schema.course)
    .values({
      title: 'Agent baseline',
      description: 'Agent activity characterization',
      groupId: group.id,
      slug: `char-agent-${suffix}`,
      type: 'SELF_PACED' as never,
      status: 'ACTIVE'
    })
    .returning();
  const [section] = await db
    .insert(schema.courseSection)
    .values({ title: 'Main', order: 1, courseId: course.id })
    .returning();
  const [activity] = await db
    .insert(schema.courseActivity)
    .values({
      courseId: course.id,
      sectionId: section.id,
      kind: 'scorm',
      title: 'Safety package',
      instructions: '<p>Finish the package to complete this item.</p>',
      order: 1
    })
    .returning();
  const [otherCourse] = await db
    .insert(schema.course)
    .values({
      title: 'Other course',
      description: 'Foreign binding check',
      groupId: group.id,
      slug: `char-agent-other-${suffix}`,
      type: 'SELF_PACED' as never,
      status: 'ACTIVE'
    })
    .returning();

  return {
    orgId: organization.id,
    groupId: group.id,
    courseId: course.id,
    sectionId: section.id,
    activityId: activity.id,
    otherCourseId: otherCourse.id
  };
}

async function cleanupAgentFixture(fixture: AgentFixture) {
  const { db } = await import('@db/drizzle');
  const schema = await import('@db/schema');

  await db.delete(schema.courseActivity).where(eq(schema.courseActivity.courseId, fixture.courseId));
  await db.delete(schema.courseSection).where(eq(schema.courseSection.courseId, fixture.courseId));
  await db.delete(schema.lesson).where(eq(schema.lesson.courseId, fixture.courseId));
  await db.delete(schema.course).where(eq(schema.course.id, fixture.courseId));
  await db.delete(schema.course).where(eq(schema.course.id, fixture.otherCourseId));
  await db.delete(schema.group).where(eq(schema.group.id, fixture.groupId));
  await db.delete(schema.organization).where(eq(schema.organization.id, fixture.orgId));
}

function suffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function agentContext(overrides: Record<string, unknown> = {}) {
  return {
    orgId: 'org-1',
    courseId: 'course-1',
    courseTitle: 'Course',
    userId: 'user-1',
    role: AgentRole.STUDENT,
    locale: 'en',
    ...overrides
  } as never;
}

describe.skipIf(!hasDatabase)('agent activity binding and verification', () => {
  it('binds an activity to its course with title and instructions', async () => {
    const fixture = await createAgentFixture(suffix());
    try {
      const { getActivityCourseBinding } = await import('@cio/db/queries/agent/chat-resource');

      const binding = await getActivityCourseBinding(fixture.activityId);

      expect(binding).toMatchObject({
        courseId: fixture.courseId,
        title: 'Safety package',
        instructions: '<p>Finish the package to complete this item.</p>'
      });
      expect(await getActivityCourseBinding(crypto.randomUUID())).toBeUndefined();
    } finally {
      await cleanupAgentFixture(fixture);
    }
  });

  it('verifies ownership, rejects foreign ids and non-UUIDs', async () => {
    const fixture = await createAgentFixture(suffix());
    try {
      const { verifyActivityBelongsToCourse } = await import('@cio/core/services/agent/chat-context');

      await expect(verifyActivityBelongsToCourse(fixture.activityId, fixture.courseId)).resolves.toBeUndefined();
      await expect(verifyActivityBelongsToCourse(fixture.activityId, fixture.otherCourseId)).rejects.toMatchObject({
        statusCode: 403
      });
      await expect(verifyActivityBelongsToCourse('not-a-uuid', fixture.courseId)).rejects.toMatchObject({
        statusCode: 400
      });
    } finally {
      await cleanupAgentFixture(fixture);
    }
  }, 30000);
});

describe('agent reorder validation with activities', () => {
  it('accepts activity items alongside lessons and exercises', () => {
    const result = reorderContentParam.safeParse({
      items: [
        { id: crypto.randomUUID(), type: 'LESSON', order: 1 },
        { id: crypto.randomUUID(), type: 'EXERCISE', order: 2 },
        { id: crypto.randomUUID(), type: 'ACTIVITY', order: 3 }
      ]
    });

    expect(result.success).toBe(true);
  });

  it('still rejects unknown item types', () => {
    const result = reorderContentParam.safeParse({
      items: [{ id: crypto.randomUUID(), type: 'SECTION', order: 1 }]
    });

    expect(result.success).toBe(false);
  });
});

describe('agent chat validation with activities', () => {
  it('accepts an activity context id', () => {
    const activityId = crypto.randomUUID();
    const result = ZAgentChatBody.safeParse({
      courseId: 'course-1',
      messages: [],
      context: { activityId }
    });

    expect(result.success).toBe(true);
  });

  it('rejects a non-UUID activity context id', () => {
    const result = ZAgentChatBody.safeParse({
      courseId: 'course-1',
      messages: [],
      context: { activityId: 'not-a-uuid' }
    });

    expect(result.success).toBe(false);
  });
});

describe('agent prompt context with activities', () => {
  it('grounds the student tutor in activity title and instructions only', () => {
    const message = buildStudentContextMessage(
      agentContext({
        activityId: 'activity-1',
        activityTitle: 'Safety package',
        activityInstructions: '<p>Finish the package.</p>'
      })
    );

    expect(message).toContain('Current activity: "Safety package" (ID: activity-1)');
    expect(message).toContain('<activity_instructions>\n<p>Finish the package.</p>\n</activity_instructions>');
  });

  it('tells the teacher when an activity has no instructions', () => {
    const message = buildTeacherContextMessage(
      agentContext({ role: AgentRole.TEACHER, activityId: 'activity-1', activityTitle: 'Safety package' })
    );

    expect(message).toContain('currently viewing activity "Safety package" (ID: activity-1)');
    expect(message).toContain('This activity has no instructions yet.');
  });

  it('omits activity lines without an activity context', () => {
    const message = buildStudentContextMessage(agentContext());

    expect(message).not.toContain('activity');
  });
});

describe.skipIf(!hasDatabase)('agent reorder execution with activities', () => {
  it('reorders an activity through the teacher reorder tool', async () => {
    const fixture = await createAgentFixture(suffix());
    try {
      const { db } = await import('@db/drizzle');
      const schema = await import('@db/schema');
      const { buildAgentTools } = await import('@cio/core/services/agent/chat-tools');
      const { getCourseContentItems } = await import('@db/queries/course/content');

      const [second] = await db
        .insert(schema.courseActivity)
        .values({
          courseId: fixture.courseId,
          sectionId: fixture.sectionId,
          kind: 'scorm',
          title: 'Second package',
          order: 2
        })
        .returning();

      const tools = buildAgentTools(fixture.orgId, crypto.randomUUID(), fixture.courseId, []);
      const result = (await tools.reorder_content?.execute?.(
        {
          items: [
            { id: fixture.activityId, type: ContentType.Activity, order: 2 },
            { id: second.id, type: ContentType.Activity, order: 1 }
          ]
        },
        { toolCallId: 'char-agent-1', messages: [] }
      )) as unknown as { courseId: string; updatedActivities: number };

      expect(result).toMatchObject({ courseId: fixture.courseId, updatedActivities: 2 });

      const rows = await getCourseContentItems(fixture.courseId);
      const orders = new Map(rows.map((row) => [row.id, row.order]));
      expect(orders.get(fixture.activityId)).toBe(2);
      expect(orders.get(second.id)).toBe(1);
    } finally {
      await cleanupAgentFixture(fixture);
    }
  }, 30000);
});

describe.skipIf(!hasDatabase)('student agent tools with activities', () => {
  it('lists activities in the course outline', async () => {
    const fixture = await createAgentFixture(suffix());
    try {
      const { buildStudentAgentTools } = await import('@api/services/agent/student-tools');

      const tools = buildStudentAgentTools(fixture.orgId, crypto.randomUUID(), fixture.courseId, {} as never);
      const result = (await tools.list_course_outline?.execute?.(
        {},
        {
          toolCallId: 'char-student-1',
          messages: []
        }
      )) as unknown as { outline: Array<{ kind: string; items?: Array<{ type: string; id: string; title: string }> }> };

      const section = result.outline.find((entry) => entry.kind === 'section');
      const activities = section?.items?.filter((item) => item.type === ContentType.Activity) ?? [];

      expect(activities.map((activity) => activity.id)).toEqual([fixture.activityId]);
      expect(activities[0]?.title).toBe('Safety package');
    } finally {
      await cleanupAgentFixture(fixture);
    }
  }, 30000);

  it('finds activities by title and instructions in search', async () => {
    const fixture = await createAgentFixture(suffix());
    try {
      const { buildStudentAgentTools } = await import('@api/services/agent/student-tools');

      const tools = buildStudentAgentTools(fixture.orgId, crypto.randomUUID(), fixture.courseId, {} as never);
      const byTitle = (await tools.search_course?.execute?.(
        { query: 'Safety package', limit: 8 },
        { toolCallId: 'char-student-2', messages: [] }
      )) as unknown as { results: { type: string; id: string }[] };
      expect(byTitle.results.some((result) => result.type === 'activity' && result.id === fixture.activityId)).toBe(
        true
      );

      const byInstructions = (await tools.search_course?.execute?.(
        { query: 'Finish the package', limit: 8 },
        { toolCallId: 'char-student-3', messages: [] }
      )) as unknown as { results: { type: string; id: string }[] };
      expect(
        byInstructions.results.some((result) => result.type === 'activity' && result.id === fixture.activityId)
      ).toBe(true);
    } finally {
      await cleanupAgentFixture(fixture);
    }
  }, 30000);
});
