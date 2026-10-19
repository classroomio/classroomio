import { getWebhookEventContext, type TWebhookEventContext } from '@cio/db/queries/webhook';
import { ROLE } from '@cio/utils/constants';

const ROLE_LABELS: Record<number, string> = {
  [ROLE.ADMIN]: 'admin',
  [ROLE.TUTOR]: 'tutor',
  [ROLE.STUDENT]: 'student'
};

const EMPTY_CONTEXT: TWebhookEventContext = { profiles: new Map(), course: null, exercise: null, lesson: null };

function readString(data: Record<string, unknown>, key: string): string | null {
  const value = data[key];

  return typeof value === 'string' ? value : null;
}

async function loadContext(data: Record<string, unknown>): Promise<TWebhookEventContext> {
  const profileIds = [readString(data, 'profileId'), readString(data, 'actorProfileId')].filter(
    (id): id is string => id !== null
  );

  try {
    return await getWebhookEventContext({
      profileIds,
      courseId: readString(data, 'courseId') ?? undefined,
      exerciseId: readString(data, 'exerciseId') ?? undefined,
      lessonId: readString(data, 'lessonId') ?? undefined
    });
  } catch (error) {
    console.error('loadContext webhook details error:', error);

    return EMPTY_CONTEXT;
  }
}

function toPersonRef(
  profileId: string | null,
  email: string | null,
  profiles: TWebhookEventContext['profiles']
): { id: string | null; name: string | null; email: string | null } {
  const profile = profileId ? profiles.get(profileId) : undefined;

  return { id: profileId, name: profile?.name ?? null, email: email ?? profile?.email ?? null };
}

/**
 * Adds the readable details (learner, course, exercise, lesson, actor, role) next to the ids an event
 * was created with. The existing fields are kept as they are. Details that cannot be read come back
 * as `null` so the event is still sent.
 */
export async function enrichWebhookEventData(data: Record<string, unknown>): Promise<Record<string, unknown>> {
  const context = await loadContext(data);
  const enriched: Record<string, unknown> = { ...data };
  const courseId = readString(data, 'courseId');
  const exerciseId = readString(data, 'exerciseId');
  const lessonId = readString(data, 'lessonId');

  if (courseId) {
    enriched.course = { id: courseId, title: context.course?.title ?? null, slug: context.course?.slug ?? null };
  }

  if (exerciseId) {
    enriched.exercise = { id: exerciseId, title: context.exercise?.title ?? null };
  } else if ('exerciseId' in data) {
    enriched.exercise = null;
  }

  if (lessonId) {
    enriched.lesson = { id: lessonId, title: context.lesson?.title ?? null };
  }

  if ('profileId' in data) {
    enriched.learner = toPersonRef(readString(data, 'profileId'), readString(data, 'email'), context.profiles);
  }

  if ('actorProfileId' in data) {
    const actorId = readString(data, 'actorProfileId');
    enriched.actor = actorId ? toPersonRef(actorId, null, context.profiles) : null;
  }

  if (typeof data.roleId === 'number') {
    enriched.role = ROLE_LABELS[data.roleId] ?? 'unknown';
  }

  return enriched;
}
