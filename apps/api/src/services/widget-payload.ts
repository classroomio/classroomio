import { getOrgCourses } from '@cio/db/queries/course';
import { getActiveOrganizationPlan, getOrganizationById } from '@cio/db/queries/organization';
import { getCourseTagsByCourseIdsForOrganization, getTagGroupsWithTags } from '@cio/db/queries/tag';
import { listWidgetCourses } from '@cio/db/queries/widget';
import { PLAN } from '@cio/utils/plans';
import {
  buildWidgetPayload as buildWidgetPayloadShared,
  normalizeWidgetConfig,
  resolveWidgetPlanGatedFields,
  type BuildWidgetPayloadCourse,
  type TWidgetPayload
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

export function sanitizeCustomCssValue(customCss: string, planName?: string | null): string {
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

export function getCourseBaseUrl(siteName: string, customDomain?: string | null): string {
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

type OrgCourse = Awaited<ReturnType<typeof getOrgCourses>>['items'][number];

export function formatCourseForWidget(
  course: OrgCourse,
  tags: BuildWidgetPayloadCourse['tags']
): BuildWidgetPayloadCourse {
  return {
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
    tags
  };
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
  const planName = activePlan?.planName ?? null;
  const normalizedConfig = normalizeWidgetConfig(widget.config as Record<string, unknown>, planName);
  const selectedCourseIds =
    overrideSelectedCourseIds ?? (await listWidgetCourses(widget.id)).map((course) => course.courseId);
  const allCoursesResult = await getOrgCourses({ orgId: widget.organizationId, limit: 200 });
  const tagsByCourseId = await getCourseTagsByCourseIdsForOrganization(
    widget.organizationId,
    allCoursesResult.items.map((course) => course.id)
  );

  const allCourses = allCoursesResult.items.map((course) =>
    formatCourseForWidget(course, tagsByCourseId[course.id] ?? [])
  );

  const planGatedFields = resolveWidgetPlanGatedFields(planName, normalizedConfig.themePreset);
  const sanitizedCustomCss = sanitizeCustomCssValue(normalizedConfig.advanced.customCss, planName);
  const orgBaseUrl = getCourseBaseUrl(organization.siteName ?? '', organization.customDomain);

  return buildWidgetPayloadShared({
    widget: {
      id: widget.id,
      publicKey: widget.publicKey,
      layoutType: widget.layoutType,
      selectionMode: widget.selectionMode,
      config: normalizedConfig
    },
    organization: {
      id: organization.id,
      name: organization.name,
      siteName: organization.siteName ?? '',
      customDomain: organization.customDomain
    },
    orgBaseUrl,
    allCourses,
    selectedCourseIds,
    planGatedFields,
    planName,
    sanitizedCustomCss
  });
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
    availableCourses: coursesResult.items.map((course) =>
      formatCourseForWidget(course, tagsByCourseId[course.id] ?? [])
    ),
    availableTags: tagGroups.flatMap((group) =>
      group.tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        color: tag.color,
        groupId: group.id
      }))
    ),
    planGatedFields: resolveWidgetPlanGatedFields(activePlan?.planName, 'classroomio'),
    planName: activePlan?.planName ?? null
  };
}
