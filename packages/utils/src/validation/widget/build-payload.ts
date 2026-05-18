import {
  ZWidgetPayload,
  getLayoutCourseLimit,
  normalizeWidgetConfig,
  type TWidgetConfig,
  type TWidgetEditorCourse,
  type TWidgetLayoutType,
  type TWidgetPayload,
  type TWidgetPayloadCategory,
  type TWidgetPayloadCourseTag,
  type TWidgetPlanGatedFields,
  type TWidgetSelectionMode
} from './widget';

export type BuildWidgetPayloadCourse = TWidgetEditorCourse;

export type BuildWidgetPayloadOrganization = {
  id: string;
  name: string;
  siteName: string;
  customDomain?: string | null;
};

export type BuildWidgetPayloadWidget = {
  id: string;
  publicKey: string;
  layoutType: TWidgetLayoutType;
  selectionMode: TWidgetSelectionMode;
  config: TWidgetConfig | Record<string, unknown>;
};

export type BuildWidgetPayloadInput = {
  widget: BuildWidgetPayloadWidget;
  organization: BuildWidgetPayloadOrganization;
  orgBaseUrl: string;
  allCourses: BuildWidgetPayloadCourse[];
  selectedCourseIds: string[];
  planGatedFields: TWidgetPlanGatedFields;
  planName?: string | null;
  /** Pre-sanitized custom CSS string. Pass '' to skip in preview contexts. */
  sanitizedCustomCss?: string;
  /** Override the "Powered by" footer label. */
  poweredByLabel?: string;
};

/**
 * Pure, dependency-free assembly of a `TWidgetPayload` from already-loaded data.
 * Server callers pre-sanitize custom CSS and pass it via `sanitizedCustomCss`;
 * preview callers can omit it so the iframe renders the in-flight draft as-is.
 */
export function buildWidgetPayload(input: BuildWidgetPayloadInput): TWidgetPayload {
  const {
    widget,
    organization,
    orgBaseUrl,
    allCourses,
    selectedCourseIds,
    planGatedFields,
    planName,
    sanitizedCustomCss,
    poweredByLabel = 'Powered by Classroomio'
  } = input;

  const normalizedConfig = normalizeWidgetConfig(widget.config as Record<string, unknown>, planName);
  const allPublishedCourses = allCourses.filter((course) => course.isPublished);
  const manualOrderLookup = new Map(selectedCourseIds.map((courseId, index) => [courseId, index]));

  let resolvedCourses =
    widget.selectionMode === 'manual'
      ? allCourses.filter((course) => manualOrderLookup.has(course.id))
      : allPublishedCourses;

  const tagsByCourseId: Record<string, TWidgetPayloadCourseTag[]> = {};
  for (const course of allCourses) {
    tagsByCourseId[course.id] = course.tags;
  }

  if (normalizedConfig.filters.includeTagIds.length > 0 || normalizedConfig.filters.excludeTagIds.length > 0) {
    resolvedCourses = resolvedCourses.filter((course) => {
      const courseTagIds = new Set((tagsByCourseId[course.id] ?? []).map((tag) => tag.id));
      const includesRequired =
        normalizedConfig.filters.includeTagIds.length === 0 ||
        normalizedConfig.filters.includeTagIds.some((tagId) => courseTagIds.has(tagId));
      const excludesBlocked = normalizedConfig.filters.excludeTagIds.every((tagId) => !courseTagIds.has(tagId));

      return includesRequired && excludesBlocked;
    });
  }

  if (widget.selectionMode === 'manual' || normalizedConfig.sortBy === 'manual') {
    resolvedCourses = [...resolvedCourses].sort(
      (courseA, courseB) =>
        (manualOrderLookup.get(courseA.id) ?? Number.MAX_SAFE_INTEGER) -
        (manualOrderLookup.get(courseB.id) ?? Number.MAX_SAFE_INTEGER)
    );
  } else if (normalizedConfig.sortBy === 'title') {
    resolvedCourses = [...resolvedCourses].sort((courseA, courseB) => courseA.title.localeCompare(courseB.title));
  } else {
    resolvedCourses = [...resolvedCourses].sort(
      (courseA, courseB) => new Date(courseB.createdAt ?? '').getTime() - new Date(courseA.createdAt ?? '').getTime()
    );
  }

  const layoutType = widget.layoutType;
  const layoutOptions = normalizedConfig.layoutOptions;

  if (layoutType === 'primary_course' && layoutOptions.primaryCourse.featuredCourseId) {
    const featuredId = layoutOptions.primaryCourse.featuredCourseId;
    const featuredIndex = resolvedCourses.findIndex((course) => course.id === featuredId);
    if (featuredIndex > 0) {
      const [featuredCourse] = resolvedCourses.splice(featuredIndex, 1);
      resolvedCourses = [featuredCourse, ...resolvedCourses];
    }
  } else if (layoutType === 'editorial_spotlight' && layoutOptions.editorialSpotlight.mainCourseId) {
    const mainId = layoutOptions.editorialSpotlight.mainCourseId;
    const mainIndex = resolvedCourses.findIndex((course) => course.id === mainId);
    if (mainIndex > 0) {
      const [mainCourse] = resolvedCourses.splice(mainIndex, 1);
      resolvedCourses = [mainCourse, ...resolvedCourses];
    }
  }

  if (layoutType !== 'category_shelf') {
    const layoutLimit = getLayoutCourseLimit(layoutType, layoutOptions);
    resolvedCourses = resolvedCourses.slice(0, Math.max(layoutLimit, 1));
  } else {
    resolvedCourses = resolvedCourses.slice(0, getLayoutCourseLimit(layoutType, layoutOptions));
  }

  const heroCourseId =
    layoutType === 'primary_course'
      ? (layoutOptions.primaryCourse.featuredCourseId ?? resolvedCourses[0]?.id ?? null)
      : layoutType === 'editorial_spotlight'
        ? (layoutOptions.editorialSpotlight.mainCourseId ?? resolvedCourses[0]?.id ?? null)
        : null;

  const tagPool = buildTagPool(layoutType, normalizedConfig, resolvedCourses, tagsByCourseId);
  const categories = buildCategoriesFromShelf(layoutType, normalizedConfig, resolvedCourses, tagsByCourseId);

  return ZWidgetPayload.parse({
    version: 'v1',
    widgetId: widget.id,
    publicKey: widget.publicKey,
    organization: {
      id: organization.id,
      name: organization.name,
      siteName: organization.siteName,
      customDomain: organization.customDomain
    },
    layoutType,
    selectionMode: widget.selectionMode,
    design: {
      ...normalizedConfig,
      advanced: {
        ...normalizedConfig.advanced,
        customCss: sanitizedCustomCss ?? normalizedConfig.advanced.customCss
      }
    },
    planGatedFields,
    labels: {
      loadMoreLabel: normalizedConfig.content.loadMoreLabel,
      poweredByLabel
    },
    courses: resolvedCourses.map((course) => ({
      id: course.id,
      slug: course.slug ?? course.id,
      title: course.title,
      description: course.description,
      imageUrl: course.imageUrl ?? null,
      price: course.price ?? 'Free',
      lessonCount: course.lessonCount,
      exerciseCount: course.exerciseCount ?? 0,
      rating: null,
      ratingCount: 0,
      courseType: course.courseType,
      createdAt: course.createdAt ?? new Date().toISOString(),
      tags: tagsByCourseId[course.id] ?? [],
      featured: heroCourseId ? course.id === heroCourseId : false,
      url: `${orgBaseUrl}/course/${course.slug ?? course.id}`
    })),
    tagPool,
    categories,
    timestamp: Date.now()
  });
}

function buildTagPool(
  layoutType: TWidgetLayoutType,
  config: TWidgetConfig,
  courses: Array<{ id: string }>,
  tagsByCourseId: Record<string, TWidgetPayloadCourseTag[]>
): TWidgetPayloadCourseTag[] {
  if (layoutType !== 'tag_filter') {
    return [];
  }

  const allTagsFromCourses = new Map<string, TWidgetPayloadCourseTag>();
  for (const course of courses) {
    for (const tag of tagsByCourseId[course.id] ?? []) {
      if (!allTagsFromCourses.has(tag.id)) {
        allTagsFromCourses.set(tag.id, tag);
      }
    }
  }

  if (config.layoutOptions.tagFilter.tagSource === 'manual') {
    const allowedIds = new Set(config.layoutOptions.tagFilter.manualTagIds);
    return [...allTagsFromCourses.values()].filter((tag) => allowedIds.has(tag.id));
  }

  return [...allTagsFromCourses.values()];
}

function buildCategoriesFromShelf(
  layoutType: TWidgetLayoutType,
  config: TWidgetConfig,
  courses: Array<{ id: string }>,
  tagsByCourseId: Record<string, TWidgetPayloadCourseTag[]>
): TWidgetPayloadCategory[] {
  if (layoutType !== 'category_shelf') {
    return [];
  }

  const orderedCategoryIds = config.layoutOptions.categoryShelf.categoryTagIds;
  if (orderedCategoryIds.length === 0) {
    return [];
  }

  const tagsById = new Map<string, TWidgetPayloadCourseTag>();
  for (const tags of Object.values(tagsByCourseId)) {
    for (const tag of tags) {
      tagsById.set(tag.id, tag);
    }
  }

  const maxPerCategory = config.layoutOptions.categoryShelf.maxPerCategory;

  return orderedCategoryIds
    .map((tagId) => {
      const tagInfo = tagsById.get(tagId);
      if (!tagInfo) {
        return null;
      }

      const matchingCourses = courses.filter((course) =>
        (tagsByCourseId[course.id] ?? []).some((tag) => tag.id === tagId)
      );

      return {
        tagId,
        name: tagInfo.name,
        slug: tagInfo.slug,
        color: tagInfo.color,
        courseIds: matchingCourses.slice(0, maxPerCategory).map((course) => course.id)
      } satisfies TWidgetPayloadCategory;
    })
    .filter((entry): entry is TWidgetPayloadCategory => entry !== null);
}
