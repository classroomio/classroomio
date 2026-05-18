import { PLAN } from '@cio/utils/plans';
import * as z from 'zod';

export const WIDGET_STATUS_VALUES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export const WIDGET_LAYOUT_TYPE_VALUES = [
  'card_grid',
  'tag_filter',
  'carousel',
  'primary_course',
  'compact_list',
  'editorial_spotlight',
  'category_shelf'
] as const;
export const WIDGET_SELECTION_MODE_VALUES = ['manual', 'published'] as const;
export const WIDGET_SORT_BY_VALUES = ['manual', 'newest', 'title'] as const;
export const WIDGET_THEME_PRESET_VALUES = ['classroomio', 'graphite', 'linen', 'spruce'] as const;
export const WIDGET_SHADOW_SIZE_VALUES = ['none', 'sm', 'md', 'lg'] as const;
export const WIDGET_TOP_BADGE_STYLE_VALUES = ['solid', 'outline'] as const;
export const WIDGET_CARD_GRID_COLUMN_VALUES = ['2', '3'] as const;
export const WIDGET_CAROUSEL_VISIBLE_CARD_VALUES = ['2', '3', '4'] as const;
export const WIDGET_COMPACT_LIST_DENSITY_VALUES = ['comfortable', 'compact'] as const;
export const WIDGET_EDITORIAL_TITLE_STYLE_VALUES = ['serif', 'sans'] as const;
export const WIDGET_TAG_FILTER_SOURCE_VALUES = ['auto', 'manual'] as const;

const ZCssColor = z.string().trim().min(1).max(64);

export const ZWidgetStatus = z.enum(WIDGET_STATUS_VALUES);
export const ZWidgetLayoutType = z.enum(WIDGET_LAYOUT_TYPE_VALUES);
export const ZWidgetSelectionMode = z.enum(WIDGET_SELECTION_MODE_VALUES);
export const ZWidgetSortBy = z.enum(WIDGET_SORT_BY_VALUES);
export const ZWidgetThemePreset = z.enum(WIDGET_THEME_PRESET_VALUES);
export const ZWidgetShadowSize = z.enum(WIDGET_SHADOW_SIZE_VALUES);
export const ZWidgetTopBadgeStyle = z.enum(WIDGET_TOP_BADGE_STYLE_VALUES);
export const ZWidgetCardGridColumns = z.enum(WIDGET_CARD_GRID_COLUMN_VALUES);
export const ZWidgetCarouselVisibleCards = z.enum(WIDGET_CAROUSEL_VISIBLE_CARD_VALUES);
export const ZWidgetCompactListDensity = z.enum(WIDGET_COMPACT_LIST_DENSITY_VALUES);
export const ZWidgetEditorialTitleStyle = z.enum(WIDGET_EDITORIAL_TITLE_STYLE_VALUES);
export const ZWidgetTagFilterSource = z.enum(WIDGET_TAG_FILTER_SOURCE_VALUES);

const DEFAULT_WIDGET_CONTENT_CONFIG = {
  loadMoreLabel: 'Load more',
  hideLoadMore: false,
  showBorder: true,
  borderWidth: 1,
  borderRadius: 12,
  shadowSize: 'md' as const,
  shadowColor: 'rgba(15, 23, 42, 0.3)',
  showCourseImage: true,
  showCourseTypeBadge: true,
  showLessonsCount: true,
  showPrice: true,
  showDescriptionExcerpt: true,
  shortenLongDescription: true,
  showRating: true,
  showFeaturedStyle: false,
  ctaLabel: 'View course'
};

const DEFAULT_WIDGET_COLORS_CONFIG = {
  primaryColor: '#0f172a',
  backgroundColor: '#ffffff',
  textColor: '#0f172a',
  badgeColor: '#e2e8f0',
  borderColor: 'rgba(15, 23, 42, 0.3)',
  highlightColor: '#f8fafc'
};

const DEFAULT_WIDGET_TYPOGRAPHY_CONFIG = {
  fontFamily: "'DM Sans', Inter, ui-sans-serif, system-ui, sans-serif",
  fontSizeScale: 1
};

const DEFAULT_WIDGET_FILTERS_CONFIG = {
  includeTagIds: [] as string[],
  excludeTagIds: [] as string[],
  topBadgeStyle: 'solid' as const
};

const DEFAULT_WIDGET_BRANDING_CONFIG = {
  showPoweredBy: true
};

const DEFAULT_WIDGET_ADVANCED_CONFIG = {
  customCss: ''
};

const DEFAULT_LAYOUT_OPTIONS_CARD_GRID = {
  columns: '3' as const,
  maxCount: 9,
  showRating: true
};

const DEFAULT_LAYOUT_OPTIONS_TAG_FILTER = {
  maxCount: 12,
  tagSource: 'auto' as const,
  manualTagIds: [] as string[],
  defaultTagId: null,
  showAllOption: true
};

const DEFAULT_LAYOUT_OPTIONS_CAROUSEL = {
  visibleCards: '3' as const,
  maxCount: 6,
  autoPlay: false,
  autoPlayIntervalMs: 5000,
  showDots: true,
  showArrows: true,
  loop: true
};

const DEFAULT_LAYOUT_OPTIONS_PRIMARY_COURSE = {
  featuredCourseId: null,
  eyebrowLabel: 'Featured course',
  ctaLabel: 'Enroll now',
  secondaryMaxCount: 3
};

const DEFAULT_LAYOUT_OPTIONS_COMPACT_LIST = {
  maxCount: 5,
  density: 'comfortable' as const,
  showThumbnail: true,
  showTags: true
};

const DEFAULT_LAYOUT_OPTIONS_EDITORIAL_SPOTLIGHT = {
  mainCourseId: null,
  secondaryMaxCount: 4,
  titleStyle: 'serif' as const
};

const DEFAULT_LAYOUT_OPTIONS_CATEGORY_SHELF = {
  categoryTagIds: [] as string[],
  defaultCategoryTagId: null,
  showAllTab: true,
  maxPerCategory: 6
};

const DEFAULT_LAYOUT_OPTIONS = {
  cardGrid: DEFAULT_LAYOUT_OPTIONS_CARD_GRID,
  tagFilter: DEFAULT_LAYOUT_OPTIONS_TAG_FILTER,
  carousel: DEFAULT_LAYOUT_OPTIONS_CAROUSEL,
  primaryCourse: DEFAULT_LAYOUT_OPTIONS_PRIMARY_COURSE,
  compactList: DEFAULT_LAYOUT_OPTIONS_COMPACT_LIST,
  editorialSpotlight: DEFAULT_LAYOUT_OPTIONS_EDITORIAL_SPOTLIGHT,
  categoryShelf: DEFAULT_LAYOUT_OPTIONS_CATEGORY_SHELF
};

const DEFAULT_WIDGET_CONFIG = {
  themePreset: 'classroomio' as const,
  sortBy: 'manual' as const,
  content: DEFAULT_WIDGET_CONTENT_CONFIG,
  colors: DEFAULT_WIDGET_COLORS_CONFIG,
  typography: DEFAULT_WIDGET_TYPOGRAPHY_CONFIG,
  filters: DEFAULT_WIDGET_FILTERS_CONFIG,
  branding: DEFAULT_WIDGET_BRANDING_CONFIG,
  advanced: DEFAULT_WIDGET_ADVANCED_CONFIG,
  layoutOptions: DEFAULT_LAYOUT_OPTIONS
};

export const ZWidgetContentConfig = z.object({
  loadMoreLabel: z.string().trim().min(1).max(64).default('Load more'),
  hideLoadMore: z.boolean().default(false),
  showBorder: z.boolean().default(true),
  borderWidth: z.number().min(0).max(8).default(1),
  borderRadius: z.number().min(0).max(32).default(12),
  shadowSize: ZWidgetShadowSize.default('md'),
  shadowColor: ZCssColor.default('rgba(15, 23, 42, 0.3)'),
  showCourseImage: z.boolean().default(true),
  showCourseTypeBadge: z.boolean().default(true),
  showLessonsCount: z.boolean().default(true),
  showPrice: z.boolean().default(true),
  showDescriptionExcerpt: z.boolean().default(true),
  shortenLongDescription: z.boolean().default(true),
  showRating: z.boolean().default(true),
  showFeaturedStyle: z.boolean().default(false),
  ctaLabel: z.string().trim().min(1).max(64).default('View course')
});

export const ZWidgetColorsConfig = z.object({
  primaryColor: ZCssColor.default('#0f172a'),
  backgroundColor: ZCssColor.default('#ffffff'),
  textColor: ZCssColor.default('#0f172a'),
  badgeColor: ZCssColor.default('#e2e8f0'),
  borderColor: ZCssColor.default('rgba(15, 23, 42, 0.3)'),
  highlightColor: ZCssColor.default('#f8fafc')
});

export const ZWidgetTypographyConfig = z.object({
  fontFamily: z.string().trim().min(1).max(120).default("'DM Sans', Inter, ui-sans-serif, system-ui, sans-serif"),
  fontSizeScale: z.number().min(0.8).max(1.4).default(1)
});

export const ZWidgetFiltersConfig = z.object({
  includeTagIds: z.array(z.uuid()).default([]),
  excludeTagIds: z.array(z.uuid()).default([]),
  topBadgeStyle: ZWidgetTopBadgeStyle.default('solid')
});

export const ZWidgetBrandingConfig = z.object({
  showPoweredBy: z.boolean().default(true)
});

export const ZWidgetAdvancedConfig = z.object({
  customCss: z.string().max(5_000).default('')
});

export const ZWidgetCardGridOptions = z.object({
  columns: ZWidgetCardGridColumns.default('3'),
  maxCount: z.number().int().min(3).max(24).default(9),
  showRating: z.boolean().default(true)
});

export const ZWidgetTagFilterOptions = z.object({
  maxCount: z.number().int().min(4).max(24).default(12),
  tagSource: ZWidgetTagFilterSource.default('auto'),
  manualTagIds: z.array(z.uuid()).default([]),
  defaultTagId: z.uuid().nullable().default(null),
  showAllOption: z.boolean().default(true)
});

export const ZWidgetCarouselOptions = z.object({
  visibleCards: ZWidgetCarouselVisibleCards.default('3'),
  maxCount: z.number().int().min(3).max(12).default(6),
  autoPlay: z.boolean().default(false),
  autoPlayIntervalMs: z.number().int().min(3000).max(10000).default(5000),
  showDots: z.boolean().default(true),
  showArrows: z.boolean().default(true),
  loop: z.boolean().default(true)
});

export const ZWidgetPrimaryCourseOptions = z.object({
  featuredCourseId: z.uuid().nullable().default(null),
  eyebrowLabel: z.string().trim().min(1).max(40).default('Featured course'),
  ctaLabel: z.string().trim().min(1).max(40).default('Enroll now'),
  secondaryMaxCount: z.number().int().min(0).max(6).default(3)
});

export const ZWidgetCompactListOptions = z.object({
  maxCount: z.number().int().min(1).max(12).default(5),
  density: ZWidgetCompactListDensity.default('comfortable'),
  showThumbnail: z.boolean().default(true),
  showTags: z.boolean().default(true)
});

export const ZWidgetEditorialSpotlightOptions = z.object({
  mainCourseId: z.uuid().nullable().default(null),
  secondaryMaxCount: z.number().int().min(2).max(4).default(4),
  titleStyle: ZWidgetEditorialTitleStyle.default('serif')
});

export const ZWidgetCategoryShelfOptions = z.object({
  categoryTagIds: z.array(z.uuid()).max(8).default([]),
  defaultCategoryTagId: z.uuid().nullable().default(null),
  showAllTab: z.boolean().default(true),
  maxPerCategory: z.number().int().min(3).max(9).default(6)
});

export const ZWidgetLayoutOptions = z.object({
  cardGrid: ZWidgetCardGridOptions.default(DEFAULT_LAYOUT_OPTIONS_CARD_GRID),
  tagFilter: ZWidgetTagFilterOptions.default(DEFAULT_LAYOUT_OPTIONS_TAG_FILTER),
  carousel: ZWidgetCarouselOptions.default(DEFAULT_LAYOUT_OPTIONS_CAROUSEL),
  primaryCourse: ZWidgetPrimaryCourseOptions.default(DEFAULT_LAYOUT_OPTIONS_PRIMARY_COURSE),
  compactList: ZWidgetCompactListOptions.default(DEFAULT_LAYOUT_OPTIONS_COMPACT_LIST),
  editorialSpotlight: ZWidgetEditorialSpotlightOptions.default(DEFAULT_LAYOUT_OPTIONS_EDITORIAL_SPOTLIGHT),
  categoryShelf: ZWidgetCategoryShelfOptions.default(DEFAULT_LAYOUT_OPTIONS_CATEGORY_SHELF)
});

export const ZWidgetConfig = z.object({
  themePreset: ZWidgetThemePreset.default('classroomio'),
  sortBy: ZWidgetSortBy.default('manual'),
  content: ZWidgetContentConfig.default(DEFAULT_WIDGET_CONTENT_CONFIG),
  colors: ZWidgetColorsConfig.default(DEFAULT_WIDGET_COLORS_CONFIG),
  typography: ZWidgetTypographyConfig.default(DEFAULT_WIDGET_TYPOGRAPHY_CONFIG),
  filters: ZWidgetFiltersConfig.default(DEFAULT_WIDGET_FILTERS_CONFIG),
  branding: ZWidgetBrandingConfig.default(DEFAULT_WIDGET_BRANDING_CONFIG),
  advanced: ZWidgetAdvancedConfig.default(DEFAULT_WIDGET_ADVANCED_CONFIG),
  layoutOptions: ZWidgetLayoutOptions.default(DEFAULT_LAYOUT_OPTIONS)
});

export const ZWidgetPlanGatedFields = z.object({
  isPaidPlan: z.boolean(),
  canUseCustomColors: z.boolean(),
  canUseCustomCss: z.boolean(),
  canToggleBranding: z.boolean(),
  isBrandingForced: z.boolean(),
  availableThemes: z.array(ZWidgetThemePreset),
  selectedTheme: ZWidgetThemePreset
});

export const ZWidgetPayloadCourseTag = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  color: z.string()
});

export const ZWidgetPayloadCourse = z.object({
  id: z.uuid(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  price: z.union([z.string(), z.number()]).nullable().optional(),
  lessonCount: z.number().int().nonnegative(),
  exerciseCount: z.number().int().nonnegative().default(0),
  rating: z.number().min(0).max(5).nullable().optional(),
  ratingCount: z.number().int().nonnegative().default(0),
  courseType: z.string().nullable().optional(),
  createdAt: z.string(),
  tags: z.array(ZWidgetPayloadCourseTag).default([]),
  featured: z.boolean().default(false),
  url: z.string()
});

export const ZWidgetPayloadCategory = z.object({
  tagId: z.uuid(),
  name: z.string(),
  slug: z.string(),
  color: z.string(),
  courseIds: z.array(z.uuid())
});

export const ZWidgetPayloadLabels = z.object({
  loadMoreLabel: z.string(),
  poweredByLabel: z.string()
});

export const ZWidgetPayload = z.object({
  version: z.literal('v1'),
  widgetId: z.uuid(),
  publicKey: z.string(),
  organization: z.object({
    id: z.uuid(),
    name: z.string(),
    siteName: z.string(),
    customDomain: z.string().nullable().optional()
  }),
  layoutType: ZWidgetLayoutType,
  selectionMode: ZWidgetSelectionMode,
  design: ZWidgetConfig,
  planGatedFields: ZWidgetPlanGatedFields,
  labels: ZWidgetPayloadLabels,
  courses: z.array(ZWidgetPayloadCourse),
  tagPool: z.array(ZWidgetPayloadCourseTag).default([]),
  categories: z.array(ZWidgetPayloadCategory).default([]),
  timestamp: z.number().int().nonnegative()
});

export const ZWidgetListItem = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  name: z.string(),
  status: ZWidgetStatus,
  layoutType: ZWidgetLayoutType,
  selectionMode: ZWidgetSelectionMode,
  publicKey: z.string(),
  hasUnpublishedChanges: z.boolean().default(false),
  latestPublishedVersionId: z.uuid().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const ZWidgetEditorCourse = z.object({
  id: z.uuid(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  isPublished: z.boolean().nullable().optional(),
  price: z.union([z.string(), z.number()]).nullable().optional(),
  lessonCount: z.number().int().nonnegative(),
  exerciseCount: z.number().int().nonnegative().default(0),
  courseType: z.string().nullable().optional(),
  createdAt: z.string(),
  tags: z.array(ZWidgetPayloadCourseTag).default([])
});

export const ZWidgetVersionRecord = z.object({
  id: z.uuid(),
  widgetId: z.uuid(),
  version: z.number().int().positive(),
  payloadSnapshot: ZWidgetPayload,
  runtimeManifest: z.record(z.string(), z.unknown()),
  rolledBackFromVersionId: z.uuid().nullable().optional(),
  publishedAt: z.string(),
  publishedByUserId: z.uuid()
});

export const ZWidgetDetail = z.object({
  widget: ZWidgetListItem.extend({
    config: ZWidgetConfig,
    selectedCourseIds: z.array(z.uuid()),
    embedCode: z.string(),
    publicScriptUrl: z.string()
  }),
  organization: z.object({
    id: z.uuid(),
    name: z.string(),
    siteName: z.string(),
    customDomain: z.string().nullable().optional()
  }),
  orgBaseUrl: z.string(),
  availableCourses: z.array(ZWidgetEditorCourse),
  availableTags: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      slug: z.string(),
      color: z.string(),
      groupId: z.uuid()
    })
  ),
  versions: z.array(ZWidgetVersionRecord),
  planGatedFields: ZWidgetPlanGatedFields,
  planName: z.string().nullable()
});

/**
 * Per-layout cross-field rules. Keep this in sync with the editor UI gating
 * in `widget-editor.svelte` so users get the same feedback there.
 */
function applyLayoutRefinements(
  data: {
    layoutType?: TWidgetLayoutType;
    selectionMode?: TWidgetSelectionMode;
    selectedCourseIds?: string[];
    config?: TWidgetConfig;
  },
  ctx: z.RefinementCtx
) {
  if (!data.layoutType || !data.config) return;

  const layoutOptions = data.config.layoutOptions;
  const selectedIds = new Set(data.selectedCourseIds ?? []);
  const isManual = data.selectionMode === 'manual';

  if (data.layoutType === 'primary_course') {
    const featuredId = layoutOptions.primaryCourse.featuredCourseId;
    if (!featuredId) {
      ctx.addIssue({
        code: 'custom',
        path: ['config', 'layoutOptions', 'primaryCourse', 'featuredCourseId'],
        message: 'A featured course is required for the Primary course layout.'
      });
    } else if (isManual && !selectedIds.has(featuredId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['config', 'layoutOptions', 'primaryCourse', 'featuredCourseId'],
        message: 'The featured course must be one of the selected courses.'
      });
    }
  }

  if (data.layoutType === 'editorial_spotlight') {
    const mainId = layoutOptions.editorialSpotlight.mainCourseId;
    if (!mainId) {
      ctx.addIssue({
        code: 'custom',
        path: ['config', 'layoutOptions', 'editorialSpotlight', 'mainCourseId'],
        message: 'A main course is required for the Editorial spotlight layout.'
      });
    } else if (isManual && !selectedIds.has(mainId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['config', 'layoutOptions', 'editorialSpotlight', 'mainCourseId'],
        message: 'The main course must be one of the selected courses.'
      });
    }
  }

  if (data.layoutType === 'category_shelf' && !isManual) {
    if (layoutOptions.categoryShelf.categoryTagIds.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['config', 'layoutOptions', 'categoryShelf', 'categoryTagIds'],
        message: 'Add at least one category tag for the Category shelf layout.'
      });
    }
  }
}

export const ZCreateWidget = z
  .object({
    name: z.string().trim().min(1).max(120),
    layoutType: ZWidgetLayoutType.default('card_grid'),
    selectionMode: ZWidgetSelectionMode.default('manual'),
    config: ZWidgetConfig.default(DEFAULT_WIDGET_CONFIG),
    selectedCourseIds: z.array(z.uuid()).default([])
  })
  .superRefine((data, ctx) => applyLayoutRefinements(data, ctx));

export const ZUpdateWidget = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    layoutType: ZWidgetLayoutType.optional(),
    selectionMode: ZWidgetSelectionMode.optional(),
    config: ZWidgetConfig.optional(),
    selectedCourseIds: z.array(z.uuid()).optional()
  })
  .superRefine((data, ctx) => applyLayoutRefinements(data, ctx));

export const ZRollbackWidget = z.object({
  versionId: z.uuid()
});

export const ZWidgetIdParams = z.object({
  widgetId: z.uuid()
});

export const ZWidgetPublicKeyParams = z.object({
  publicKey: z.string().trim().min(8)
});

export type TWidgetStatus = z.infer<typeof ZWidgetStatus>;
export type TWidgetLayoutType = z.infer<typeof ZWidgetLayoutType>;
export type TWidgetSelectionMode = z.infer<typeof ZWidgetSelectionMode>;
export type TWidgetSortBy = z.infer<typeof ZWidgetSortBy>;
export type TWidgetThemePreset = z.infer<typeof ZWidgetThemePreset>;
export type TWidgetConfig = z.infer<typeof ZWidgetConfig>;
export type TWidgetLayoutOptions = z.infer<typeof ZWidgetLayoutOptions>;
export type TWidgetCardGridOptions = z.infer<typeof ZWidgetCardGridOptions>;
export type TWidgetTagFilterOptions = z.infer<typeof ZWidgetTagFilterOptions>;
export type TWidgetCarouselOptions = z.infer<typeof ZWidgetCarouselOptions>;
export type TWidgetPrimaryCourseOptions = z.infer<typeof ZWidgetPrimaryCourseOptions>;
export type TWidgetCompactListOptions = z.infer<typeof ZWidgetCompactListOptions>;
export type TWidgetEditorialSpotlightOptions = z.infer<typeof ZWidgetEditorialSpotlightOptions>;
export type TWidgetCategoryShelfOptions = z.infer<typeof ZWidgetCategoryShelfOptions>;
export type TWidgetPlanGatedFields = z.infer<typeof ZWidgetPlanGatedFields>;
export type TWidgetPayloadCourse = z.infer<typeof ZWidgetPayloadCourse>;
export type TWidgetPayloadCategory = z.infer<typeof ZWidgetPayloadCategory>;
export type TWidgetPayloadCourseTag = z.infer<typeof ZWidgetPayloadCourseTag>;
export type TWidgetPayload = z.infer<typeof ZWidgetPayload>;
export type TWidgetListItem = z.infer<typeof ZWidgetListItem>;
export type TWidgetEditorCourse = z.infer<typeof ZWidgetEditorCourse>;
export type TWidgetDetail = z.infer<typeof ZWidgetDetail>;
export type TCreateWidget = z.infer<typeof ZCreateWidget>;
export type TUpdateWidget = z.infer<typeof ZUpdateWidget>;
export type TRollbackWidget = z.infer<typeof ZRollbackWidget>;

export function getDefaultWidgetConfig(): TWidgetConfig {
  return ZWidgetConfig.parse(DEFAULT_WIDGET_CONFIG);
}

export function isPaidWidgetPlan(planName?: string | null): boolean {
  return planName === PLAN.EARLY_ADOPTER || planName === PLAN.ENTERPRISE;
}

export function resolveWidgetPlanGatedFields(
  planName?: string | null,
  selectedTheme?: TWidgetThemePreset
): TWidgetPlanGatedFields {
  const isPaidPlan = isPaidWidgetPlan(planName);
  const availableThemes: TWidgetThemePreset[] = isPaidPlan ? [...WIDGET_THEME_PRESET_VALUES] : ['classroomio'];
  const themeCandidate = selectedTheme ?? 'classroomio';
  const selectedResolvedTheme = availableThemes.includes(themeCandidate) ? themeCandidate : 'classroomio';

  return {
    isPaidPlan,
    canUseCustomColors: isPaidPlan,
    canUseCustomCss: isPaidPlan,
    canToggleBranding: isPaidPlan,
    isBrandingForced: !isPaidPlan,
    availableThemes,
    selectedTheme: selectedResolvedTheme
  };
}

export function normalizeWidgetConfig(config?: Partial<TWidgetConfig> | null, planName?: string | null): TWidgetConfig {
  const parsedConfig = ZWidgetConfig.parse(config ?? {});
  const planGatedFields = resolveWidgetPlanGatedFields(planName, parsedConfig.themePreset);

  return {
    ...parsedConfig,
    themePreset: planGatedFields.selectedTheme,
    branding: {
      ...parsedConfig.branding,
      showPoweredBy: planGatedFields.isBrandingForced ? true : parsedConfig.branding.showPoweredBy
    },
    advanced: {
      ...parsedConfig.advanced,
      customCss: planGatedFields.canUseCustomCss ? parsedConfig.advanced.customCss : ''
    },
    colors: planGatedFields.canUseCustomColors ? parsedConfig.colors : getDefaultWidgetConfig().colors
  };
}

/**
 * Returns the maximum number of courses that should be requested/rendered for a
 * given layout. Mirrors the rules enforced server-side in `buildWidgetPayload`.
 */
export function getLayoutCourseLimit(layoutType: TWidgetLayoutType, options: TWidgetLayoutOptions): number {
  switch (layoutType) {
    case 'card_grid':
      return options.cardGrid.maxCount;
    case 'tag_filter':
      return options.tagFilter.maxCount;
    case 'carousel':
      return options.carousel.maxCount;
    case 'primary_course':
      return 1 + options.primaryCourse.secondaryMaxCount;
    case 'compact_list':
      return options.compactList.maxCount;
    case 'editorial_spotlight':
      return 1 + options.editorialSpotlight.secondaryMaxCount;
    case 'category_shelf': {
      const tagCount = Math.max(options.categoryShelf.categoryTagIds.length, 1);
      return tagCount * options.categoryShelf.maxPerCategory;
    }
    default:
      return 24;
  }
}
