import {
  STARTER_COURSE_TITLES,
  STARTER_PRODUCT_PLACEHOLDER,
  type TStarterCourseSlot,
  type TStarterDraftOrigin
} from '@cio/utils/constants/onboarding';
import {
  ZCourseImportDraftPayload,
  type TCourseImportDraftPayload,
  type TStarterBlueprint
} from '@cio/utils/validation';

/**
 * Converts one slot's blueprint into the payload the course importer already understands.
 * Throws a ZodError when the result is not a valid payload.
 */
export function blueprintToDraftPayload(params: {
  slot: TStarterCourseSlot;
  blueprint: TStarterBlueprint;
  locale: string;
  sourceUrls: string[];
  productName: string;
}): TCourseImportDraftPayload {
  const { slot, blueprint, locale, sourceUrls, productName } = params;

  const filled = fillProductNameInBlueprint(blueprint, productName);

  const sections = filled.sections.map((section, sectionIndex) => ({
    externalId: `s${sectionIndex + 1}`,
    title: section.title,
    order: sectionIndex + 1
  }));

  const lessons = filled.sections.flatMap((section, sectionIndex) =>
    section.lessons.map((lesson, lessonIndex) => ({
      externalId: `s${sectionIndex + 1}l${lessonIndex + 1}`,
      sectionExternalId: `s${sectionIndex + 1}`,
      title: lesson.title,
      order: lessonIndex + 1
    }))
  );

  const lessonLanguages = filled.sections.flatMap((section, sectionIndex) =>
    section.lessons.map((lesson, lessonIndex) => ({
      lessonExternalId: `s${sectionIndex + 1}l${lessonIndex + 1}`,
      locale,
      content: lesson.bodyHtml
    }))
  );

  const sourceReferences = sourceUrls.map((url) => ({ type: 'website' as const, label: url }));

  return ZCourseImportDraftPayload.parse({
    course: {
      title: fillProductName(STARTER_COURSE_TITLES[slot], productName),
      description: filled.description,
      type: 'SELF_PACED',
      locale
    },
    tags: [],
    sections,
    lessons,
    lessonLanguages,
    sourceReferences,
    warnings: []
  });
}

export function buildStarterDraftIdempotencyKey(jobId: string, slot: TStarterCourseSlot): string {
  return `onboarding:${jobId}:${slot}`;
}

export function buildStarterDraftSummary(jobId: string, slot: TStarterCourseSlot, origin: TStarterDraftOrigin) {
  return { onboarding: { jobId, slot, origin } };
}

/** Replaces the product placeholder in text that the user will see. Case-sensitive, all occurrences. */
export function fillProductName(text: string, productName: string): string {
  return text.split(STARTER_PRODUCT_PLACEHOLDER).join(productName);
}

function escapeHtmlText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Replaces the product placeholder in every string of a blueprint, escaping the name where it lands in HTML.
 */
export function fillProductNameInBlueprint(blueprint: TStarterBlueprint, productName: string): TStarterBlueprint {
  const htmlName = escapeHtmlText(productName);

  return {
    description: fillProductName(blueprint.description, productName),
    sections: blueprint.sections.map((section) => ({
      title: fillProductName(section.title, productName),
      lessons: section.lessons.map((lesson) => ({
        title: fillProductName(lesson.title, productName),
        bodyHtml: fillProductName(lesson.bodyHtml, htmlName)
      }))
    }))
  };
}
