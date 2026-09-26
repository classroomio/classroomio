import type { TLandingPage, TLandingPageInstructor, TLandingPageReview } from '@cio/utils/validation/learning-path';
import { INSTRUCTOR_ROLE_LABEL } from '@cio/utils/constants';
import { normalizeIntegerInput } from '@cio/utils/functions';
import type { LearningPathDetail } from './types';

export function dedupeSkills(skills: string[] | undefined): string[] | undefined {
  if (!skills) return undefined;

  const cleaned = skills.map((skill) => skill.trim()).filter(Boolean);
  const unique = [...new Set(cleaned)];

  return unique.length > 0 ? unique : undefined;
}

export function createLandingId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

/**
 * Trims/dedupes/normalizes a path landing draft before save.
 * Pure — keeps business logic out of `path-landing-editor.svelte`.
 */
export function sanitizePathLandingPage(draft: TLandingPage): TLandingPage {
  const sanitized: TLandingPage = { ...draft };

  for (const key of [
    'title',
    'description',
    'requirements',
    'goals',
    'paymentLink',
    'certificateTemplateUrl'
  ] as const) {
    const value = sanitized[key];

    if (typeof value === 'string') {
      const trimmed = value.trim();

      if (trimmed) {
        (sanitized as Record<string, unknown>)[key] = trimmed;
      } else {
        delete (sanitized as Record<string, unknown>)[key];
      }
    }
  }

  if (Array.isArray(sanitized.skills)) {
    const cleaned = dedupeSkills(sanitized.skills);
    if (cleaned) {
      sanitized.skills = cleaned;
    } else {
      delete sanitized.skills;
    }
  }

  if (Array.isArray(sanitized.instructors)) {
    sanitized.instructors = sanitized.instructors
      .map((item, idx) => ({
        ...item,
        id: item.id ?? `inst_${idx}`,
        name: item.name.trim(),
        role: item.role?.trim() || undefined,
        imgUrl: item.imgUrl?.trim() || undefined,
        description: item.description?.trim() || undefined,
        coursesNo: item.coursesNo ?? undefined
      }))
      .filter((item) => item.name);

    if (sanitized.instructors.length === 0) {
      delete sanitized.instructors;
    }
  }

  if (Array.isArray(sanitized.reviews)) {
    sanitized.reviews = sanitized.reviews
      .map((item, idx) => ({
        id: typeof item.id === 'number' ? item.id : Date.now() + idx,
        hide: Boolean(item.hide),
        name: item.name.trim(),
        avatar_url: item.avatar_url?.trim() ?? '',
        rating:
          typeof item.rating === 'number' && !isNaN(item.rating)
            ? Math.max(1, Math.min(5, Math.round(item.rating)))
            : null,
        created_at: typeof item.created_at === 'number' ? item.created_at : Date.now(),
        description: item.description.trim()
      }))
      .filter((item) => item.name && item.description);
  }

  if (typeof sanitized.discount === 'number' && !isNaN(sanitized.discount)) {
    sanitized.discount = normalizeIntegerInput(sanitized.discount, 0, 100);
  }

  if (Array.isArray(sanitized.faqs)) {
    sanitized.faqs = sanitized.faqs
      .map((item) => ({
        ...item,
        question: item.question.trim(),
        answer: item.answer.trim()
      }))
      .filter((item) => item.question && item.answer);
  }

  return sanitized;
}

export function createFaqId(): string {
  return createLandingId('faq');
}

/**
 * Normalizes stored reviews into editable rows with stable ids.
 * Pure — keeps parsing out of `reviews-form.svelte`.
 */
export function parseInitialPathReviews(landingPage: TLandingPage): TLandingPageReview[] {
  return (landingPage.reviews ?? []).map((item, idx) => ({
    id: typeof item.id === 'number' ? item.id : Date.now() + idx,
    name: item.name ?? '',
    avatar_url: item.avatar_url ?? '',
    rating: typeof item.rating === 'number' ? item.rating : null,
    created_at: typeof item.created_at === 'number' ? item.created_at : Date.now(),
    description: item.description ?? '',
    hide: Boolean(item.hide)
  }));
}

/**
 * Derives landing-page instructors from a path's courses.
 * Pure — shared by `path-landing-editor.svelte` (initial draft) and
 * `instructors-form.svelte` (empty-state fallback). Falls back to the
 * org name/avatar or the current user's profile when no course
 * instructor is available.
 */
export function getTutorsFromCourses(
  path: LearningPathDetail,
  fallbackOrg?: { name?: string | null; avatarUrl?: string | null } | null,
  fallbackUser?: { fullname?: string | null; avatarUrl?: string | null } | null,
  defaultRole: string = INSTRUCTOR_ROLE_LABEL.INSTRUCTOR
): TLandingPageInstructor[] {
  const list: TLandingPageInstructor[] = [];
  const seenNames = new Set<string>();

  for (const pathCourse of path.courses ?? []) {
    const instructor = pathCourse.instructor;

    if (instructor?.name && instructor.name.trim()) {
      const normalized = instructor.name.trim().toLowerCase();

      if (!seenNames.has(normalized)) {
        seenNames.add(normalized);
        list.push({
          id: `inst_${list.length + 1}`,
          name: instructor.name.trim(),
          role: instructor.role?.trim() || defaultRole,
          imgUrl: instructor.imgUrl?.trim() || '',
          description: '',
          coursesNo: 1
        });
      } else {
        const existing = list.find((item) => item.name.trim().toLowerCase() === normalized);

        if (existing && typeof existing.coursesNo === 'number') {
          existing.coursesNo += 1;
        }
      }
    }
  }

  if (list.length === 0 && (fallbackOrg?.name || fallbackUser?.fullname)) {
    list.push({
      id: 'inst_default',
      name: fallbackOrg?.name || fallbackUser?.fullname || defaultRole,
      role: defaultRole,
      imgUrl: fallbackOrg?.avatarUrl || fallbackUser?.avatarUrl || '',
      description: '',
      coursesNo: path.courses?.length || 1
    });
  }

  return list;
}

export interface ResolveInitialPathInstructorsOptions {
  fallbackOrg?: { name?: string | null; avatarUrl?: string | null } | null;
  fallbackUser?: { fullname?: string | null; avatarUrl?: string | null } | null;
  defaultRole?: string;
  draftInstructors?: TLandingPageInstructor[] | null;
}

/**
 * Resolves the initial instructors for the landing-page draft:
 * saved or draft instructors win, otherwise derive from courses/org/profile.
 */
export function resolveInitialPathInstructors(
  path: LearningPathDetail,
  options: ResolveInitialPathInstructorsOptions = {}
): TLandingPageInstructor[] | undefined {
  const { fallbackOrg, fallbackUser, defaultRole = INSTRUCTOR_ROLE_LABEL.INSTRUCTOR, draftInstructors } = options;

  const rawInstructors = draftInstructors ?? path.landingPage?.instructors;
  if (Array.isArray(rawInstructors) && rawInstructors.length > 0) {
    return rawInstructors.map((item, idx): TLandingPageInstructor => {
      const imgUrl =
        item.imgUrl || ('avatarUrl' in item && typeof item.avatarUrl === 'string' ? item.avatarUrl : '') || '';
      const description = item.description || ('bio' in item && typeof item.bio === 'string' ? item.bio : '') || '';
      const rawCount = item.coursesNo ?? ('courseNo' in item && item.courseNo != null ? item.courseNo : undefined);
      const coursesNo: string | number = typeof rawCount === 'number' || typeof rawCount === 'string' ? rawCount : 1;

      return {
        id: item.id ?? `inst_${idx + 1}`,
        name: item.name,
        role: item.role ?? defaultRole,
        imgUrl,
        description,
        coursesNo
      };
    });
  }

  const derived = getTutorsFromCourses(path, fallbackOrg, fallbackUser, defaultRole);

  return derived.length > 0 ? derived : undefined;
}
