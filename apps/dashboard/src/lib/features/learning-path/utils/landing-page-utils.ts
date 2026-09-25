import type { TLandingPage, TLandingPageReview } from '@cio/utils/validation/learning-path';

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
  }

  if (Array.isArray(sanitized.reviews)) {
    sanitized.reviews = sanitized.reviews
      .map((item, idx) => ({
        id: typeof item.id === 'number' ? item.id : Date.now() + idx,
        hide: Boolean(item.hide),
        name: item.name.trim(),
        avatar_url: item.avatar_url?.trim() ?? '',
        rating: typeof item.rating === 'number' && !isNaN(item.rating) ? item.rating : null,
        created_at: typeof item.created_at === 'number' ? item.created_at : Date.now(),
        description: item.description.trim()
      }))
      .filter((item) => item.name && item.description);
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
