import { getOrgCourses } from '@cio/db/queries/course';
import { getActiveOrganizationPlan, getOrganizationById } from '@cio/db/queries/organization';
import { getCourseTagsByCourseIdsForOrganization, getTagGroupsWithTags } from '@cio/db/queries/tag';
import { listWidgetCourses } from '@cio/db/queries/widget';
import { PLAN } from '@cio/utils/plans';
import {
  ZWidgetPayload,
  getLayoutCourseLimit,
  normalizeWidgetConfig,
  resolveWidgetPlanGatedFields,
  type TWidgetLayoutType,
  type TWidgetPayload,
  type TWidgetPayloadCategory,
  type TWidgetPayloadCourseTag
} from '@cio/utils/validation/widget';
import type { TWidget } from '@db/types';
import * as csstree from 'css-tree';
import { env } from '@api/config/env';

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const DEFAULT_EMBED_CDN_BASE_URL = 'https://assets.cdn.clsrio.com';
const DEFAULT_LOCAL_EMBED_BASE_URL = 'http://localhost:5180';
const DEFAULT_WIDGET_API_BASE_URL = 'https://api.classroomio.com';
const DEFAULT_WIDGET_APP_BASE_URL = 'https://classroomio.com';

const ALLOWED_CUSTOM_CSS_PROPERTIES = new Set([
  'align-items',
  'background',
  'background-color',
  'border',
  'border-color',
  'border-radius',
  'border-style',
  'border-width',
  'box-shadow',
  'color',
  'display',
  'fill',
  'flex',
  'flex-basis',
  'flex-direction',
  'flex-grow',
  'flex-shrink',
  'font',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'gap',
  'grid',
  'grid-template-columns',
  'grid-template-rows',
  'height',
  'justify-content',
  'letter-spacing',
  'line-height',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'max-height',
  'max-width',
  'min-height',
  'min-width',
  'object-fit',
  'opacity',
  'overflow',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'place-items',
  'stroke',
  'text-align',
  'text-decoration',
  'text-transform',
  'transform',
  'transition',
  'width',
  'white-space'
]);

function encodeBase58(bytes: Uint8Array): string {
  let value = 0n;
  for (const byte of bytes) {
    value = (value << 8n) + BigInt(byte);
  }

  if (value === 0n) {
    return BASE58_ALPHABET[0];
  }

  let encoded = '';
  while (value > 0n) {
    const remainder = Number(value % 58n);
    encoded = BASE58_ALPHABET[remainder] + encoded;
    value /= 58n;
  }

  return encoded;
}

export function generateWidgetPublicKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return `wgt_${encodeBase58(bytes).slice(0, 16)}`;
}

function sanitizeCustomCssValue(customCss: string, planName?: string | null): string {
  if (!customCss.trim() || !planName || planName === PLAN.BASIC) {
    return '';
  }

  if (customCss.length > 5_000) {
    throw new Error('Custom CSS exceeds 5KB limit');
  }

  const normalizedCss = customCss.toLowerCase();
  const bannedSnippets = ['@import', 'javascript:', 'expression(', 'behavior:', 'binding:', '-moz-binding'];
  if (bannedSnippets.some((snippet) => normalizedCss.includes(snippet))) {
    throw new Error('Custom CSS contains unsupported rules');
  }

  const ast = csstree.parse(customCss, { context: 'stylesheet' });

  csstree.walk(ast, (node: any) => {
    if (node.type === 'Atrule') {
      throw new Error('At-rules are not allowed in custom CSS');
    }

    if (node.type === 'Declaration') {
      const propertyName = node.property.toLowerCase();
      const propertyValue = csstree.generate(node.value).toLowerCase();

      if (!ALLOWED_CUSTOM_CSS_PROPERTIES.has(propertyName)) {
        throw new Error(`Custom CSS property "${propertyName}" is not allowed`);
      }

      if (propertyName === 'position' && propertyValue.includes('fixed')) {
        throw new Error('position: fixed is not allowed in custom CSS');
      }
    }
  });

  return csstree.generate(ast);
}

function getCourseBaseUrl(siteName: string, customDomain?: string | null): string {
  if (customDomain) {
    return `https://${customDomain}`;
  }

  return siteName ? `https://${siteName}.classroomio.com` : DEFAULT_WIDGET_APP_BASE_URL;
}

export function getCourseWidgetScriptUrl(): string {
  const embedBaseUrl = (
    env.PUBLIC_EMBED_BASE_URL ||
    (env.NODE_ENV === 'development' ? DEFAULT_LOCAL_EMBED_BASE_URL : DEFAULT_EMBED_CDN_BASE_URL)
  ).replace(/\/$/, '');

  return `${embedBaseUrl}/embeds/course-widget/course-widget.js`;
}

export function getWidgetApiBaseUrl(): string {
  return (env.PUBLIC_SERVER_URL || DEFAULT_WIDGET_API_BASE_URL).replace(/\/$/, '');
}

export function getWidgetEmbedCode(publicKey: string): string {
  const scriptUrl = getCourseWidgetScriptUrl();
  const apiBaseUrl = getWidgetApiBaseUrl();

  return `<div data-cio-widget="course-widget" data-widget-key="${publicKey}" data-api-base-url="${apiBaseUrl}"></div>\n<script async type="module" src="${scriptUrl}"></script>`;
}

export async function buildWidgetPayload(
  widget: TWidget,
  overrideSelectedCourseIds?: string[]
): Promise<TWidgetPayload> {
  const organization = await getOrganizationById(widget.organizationId);
  if (!organization) {
    throw new Error('Organization not found for widget');
  }

  const activePlan = await getActiveOrganizationPlan(widget.organizationId);
  const normalizedConfig = normalizeWidgetConfig(widget.config as Record<string, unknown>, activePlan?.planName);
  const selectedCourseIds =
    overrideSelectedCourseIds ?? (await listWidgetCourses(widget.id)).map((course) => course.courseId);
  const allCourses = await getOrgCourses({ orgId: widget.organizationId, limit: 200 });
  const allPublishedCourses = allCourses.items.filter((course) => course.isPublished);
  const manualOrderLookup = new Map(selectedCourseIds.map((courseId, index) => [courseId, index]));

  let resolvedCourses =
    widget.selectionMode === 'manual'
      ? allCourses.items.filter((course) => manualOrderLookup.has(course.id))
      : allPublishedCourses;

  const tagsByCourseId = await getCourseTagsByCourseIdsForOrganization(
    widget.organizationId,
    resolvedCourses.map((course) => course.id)
  );

  if (normalizedConfig.filters.includeTagIds.length > 0 || normalizedConfig.filters.excludeTagIds.length > 0) {
    resolvedCourses = resolvedCourses.filter((course) => {
      const courseTags = tagsByCourseId[course.id] ?? [];
      const courseTagIds = new Set(courseTags.map((tag) => tag.id));
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

  const layoutType = widget.layoutType as TWidgetLayoutType;
  const layoutOptions = normalizedConfig.layoutOptions;

  // Hoist the configured "main" course to the front for layouts that have a hero slot,
  // so the rest of the slice/limit logic can treat slot 0 as the featured course.
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

  // Cap the course list according to the active layout's limit. Category shelf
  // builds its own grouped slices below from the already-filtered universe.
  if (layoutType !== 'category_shelf') {
    const layoutLimit = getLayoutCourseLimit(layoutType, layoutOptions);
    resolvedCourses = resolvedCourses.slice(0, Math.max(layoutLimit, 1));
  } else {
    resolvedCourses = resolvedCourses.slice(0, getLayoutCourseLimit(layoutType, layoutOptions));
  }

  // Build payload-specific aggregates.
  const heroCourseId =
    layoutType === 'primary_course'
      ? (layoutOptions.primaryCourse.featuredCourseId ?? resolvedCourses[0]?.id ?? null)
      : layoutType === 'editorial_spotlight'
        ? (layoutOptions.editorialSpotlight.mainCourseId ?? resolvedCourses[0]?.id ?? null)
        : null;

  const tagPool = buildTagPool(layoutType, normalizedConfig, resolvedCourses, tagsByCourseId);
  const categories = buildCategoriesFromShelf(layoutType, normalizedConfig, resolvedCourses, tagsByCourseId);

  const planGatedFields = resolveWidgetPlanGatedFields(activePlan?.planName, normalizedConfig.themePreset);
  const sanitizedCustomCss = sanitizeCustomCssValue(normalizedConfig.advanced.customCss, activePlan?.planName);
  const orgBaseUrl = getCourseBaseUrl(organization.siteName ?? '', organization.customDomain);

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
        customCss: sanitizedCustomCss
      }
    },
    planGatedFields,
    labels: {
      loadMoreLabel: normalizedConfig.content.loadMoreLabel,
      poweredByLabel: 'Powered by Classroomio'
    },
    courses: resolvedCourses.map((course) => ({
      id: course.id,
      slug: course.slug ?? course.id,
      title: course.title,
      description: course.description,
      imageUrl: course.bannerImage || course.logo || null,
      price: course.cost ? `${course.currency} ${course.cost}` : 'Free',
      lessonCount: course.lessonCount,
      exerciseCount: course.exerciseCount ?? 0,
      rating: null,
      ratingCount: 0,
      courseType: course.type,
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
  config: ReturnType<typeof normalizeWidgetConfig>,
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
  config: ReturnType<typeof normalizeWidgetConfig>,
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

  // Reverse-lookup tag info from the tags-by-course map.
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

export async function listWidgetAvailableEditorData(orgId: string) {
  const [coursesResult, tagGroups, activePlan] = await Promise.all([
    getOrgCourses({ orgId, limit: 200 }),
    getTagGroupsWithTags(orgId),
    getActiveOrganizationPlan(orgId)
  ]);
  const tagsByCourseId = await getCourseTagsByCourseIdsForOrganization(
    orgId,
    coursesResult.items.map((course) => course.id)
  );

  return {
    availableCourses: coursesResult.items.map((course) => ({
      id: course.id,
      slug: course.slug ?? course.id,
      title: course.title,
      description: course.description,
      imageUrl: course.bannerImage || course.logo || null,
      isPublished: course.isPublished,
      price: course.cost ? `${course.currency} ${course.cost}` : 'Free',
      lessonCount: course.lessonCount,
      exerciseCount: course.exerciseCount ?? 0,
      courseType: course.type,
      createdAt: course.createdAt ?? new Date().toISOString(),
      tags: tagsByCourseId[course.id] ?? []
    })),
    availableTags: tagGroups.flatMap((group) =>
      group.tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        color: tag.color,
        groupId: group.id
      }))
    ),
    planGatedFields: resolveWidgetPlanGatedFields(activePlan?.planName, 'classroomio')
  };
}
