import { BRAND_ROOT_DOMAIN, TENANT_ROOT_DOMAIN } from '@cio/utils/constants';
import {
  getWidgetThemeSerifStack,
  type TWidgetConfig,
  type TWidgetPayload,
  type TWidgetPayloadCourse
} from '@cio/utils/validation/widget';

const COURSE_TYPE_MAP: Record<string, { label: string; className: string }> = {
  LIVE_CLASS: { label: 'Live class', className: 'cio-type-badge cio-type-live' },
  SELF_PACED: { label: 'Self paced', className: 'cio-type-badge cio-type-self' },
  COMPLIANCE: { label: 'Compliance', className: 'cio-type-badge cio-type-compliance' }
};

export function getCourseTypeMeta(courseType: string | null | undefined): { label: string; className: string } | null {
  if (!courseType) return null;
  return COURSE_TYPE_MAP[courseType] ?? { label: courseType, className: 'cio-type-badge cio-type-default' };
}

export function getStarSegments(rating: number | null | undefined): { filled: number; empty: number } {
  if (rating == null) return { filled: 0, empty: 5 };
  const rounded = Math.round(rating);
  const filled = Math.max(0, Math.min(5, rounded));
  return { filled, empty: 5 - filled };
}

export function buildCssVarsFromDesign(design: TWidgetConfig): string {
  const shadowBlur =
    design.content.shadowSize === 'lg'
      ? 28
      : design.content.shadowSize === 'md'
        ? 18
        : design.content.shadowSize === 'sm'
          ? 8
          : 0;

  return [
    `--cio-primary:${design.colors.primaryColor}`,
    `--cio-bg:${design.colors.backgroundColor}`,
    `--cio-text:${design.colors.textColor}`,
    `--cio-border:${design.colors.borderColor}`,
    `--cio-badge:${design.colors.badgeColor}`,
    `--cio-highlight:${design.colors.highlightColor}`,
    `--cio-radius:${design.content.borderRadius}px`,
    `--cio-font:${design.typography.fontFamily}`,
    `--cio-font-serif:${getWidgetThemeSerifStack(design.themePreset)}`,
    `--cio-font-scale:${design.typography.fontSizeScale}`,
    `--cio-shadow:0 8px ${shadowBlur}px ${design.content.shadowColor}`
  ].join(';');
}

export function getCourseExcerpt(course: TWidgetPayloadCourse, maxLength = 160): string {
  if (!course.description) return '';
  const flat = course.description.replace(/\s+/g, ' ').trim();
  if (flat.length <= maxLength) return flat;
  return `${flat.slice(0, maxLength - 1).trim()}…`;
}

export function formatLessonsLine(course: TWidgetPayloadCourse, showLessonsCount?: boolean): string {
  if (showLessonsCount === false) return '';
  const parts: string[] = [];
  if (course.lessonCount) parts.push(`${course.lessonCount} lessons`);
  if (course.exerciseCount) parts.push(`${course.exerciseCount} exercises`);
  return parts.join(' · ');
}

/** Hostname used in UTM (custom domain or `{siteName}.${TENANT_ROOT_DOMAIN}`). */
export function getOrgDomainForUtm(organization: TWidgetPayload['organization']): string {
  const custom = organization.customDomain?.trim();
  if (custom) {
    try {
      if (custom.includes('://')) {
        return new URL(custom).hostname;
      }
    } catch {
      /* use raw host below */
    }
    return custom.replace(/^\/+/, '').split('/')[0] || organization.siteName;
  }
  const site = organization.siteName.trim();
  return site ? `${site}.${TENANT_ROOT_DOMAIN}` : BRAND_ROOT_DOMAIN;
}

/** Marketing homepage link with widget + org attribution for analytics. */
export function buildPoweredByMarketingUrl(payload: TWidgetPayload): string {
  const orgDomain = getOrgDomainForUtm(payload.organization);
  const params = new URLSearchParams({
    utm_source: 'classroomio_widget',
    utm_medium: 'embed',
    utm_campaign: 'powered_by',
    utm_content: payload.widgetId,
    utm_term: orgDomain
  });
  return `https://${BRAND_ROOT_DOMAIN}/?${params.toString()}`;
}
