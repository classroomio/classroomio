import { describe, expect, it } from 'vitest';
import {
  ZCreateWidget,
  ZUpdateWidget,
  ZWidgetConfig,
  ZWidgetPayload,
  ZWidgetPublicKeyParams,
  getDefaultWidgetConfig,
  getLayoutCourseLimit,
  normalizeWidgetConfig,
  resolveWidgetPlanGatedFields,
  isPaidWidgetPlan,
  WIDGET_LAYOUT_TYPE_VALUES,
  WIDGET_THEME_PRESET_VALUES
} from '@cio/utils/validation/widget';
import type { TWidgetConfig } from '@cio/utils/validation/widget';
import { PLAN } from '@cio/utils/plans';

const SAMPLE_UUID = '11111111-1111-4111-8111-111111111111';
const ANOTHER_UUID = '22222222-2222-4222-8222-222222222222';

describe('Widget Validation Schemas', () => {
  describe('ZCreateWidget', () => {
    it('should parse valid create input', () => {
      const result = ZCreateWidget.safeParse({
        name: 'My Widget',
        layoutType: 'card_grid',
        selectionMode: 'manual',
        selectedCourseIds: []
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('My Widget');
        expect(result.data.layoutType).toBe('card_grid');
      }
    });

    it('should apply defaults for optional fields', () => {
      const result = ZCreateWidget.safeParse({ name: 'Test' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.layoutType).toBe('card_grid');
        expect(result.data.selectionMode).toBe('manual');
        expect(result.data.selectedCourseIds).toEqual([]);
      }
    });

    it('should reject empty name', () => {
      const result = ZCreateWidget.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });

    it('should reject name longer than 120 characters', () => {
      const result = ZCreateWidget.safeParse({ name: 'a'.repeat(121) });
      expect(result.success).toBe(false);
    });

    it('should reject invalid layout type', () => {
      const result = ZCreateWidget.safeParse({ name: 'Test', layoutType: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('should accept all valid layout types', () => {
      for (const layoutType of WIDGET_LAYOUT_TYPE_VALUES) {
        const baseInput: Record<string, unknown> = {
          name: 'Test',
          layoutType,
          selectionMode: 'published'
        };

        if (layoutType === 'primary_course') {
          baseInput.config = {
            layoutOptions: { primaryCourse: { featuredCourseId: SAMPLE_UUID } }
          };
        } else if (layoutType === 'editorial_spotlight') {
          baseInput.config = {
            layoutOptions: { editorialSpotlight: { mainCourseId: SAMPLE_UUID } }
          };
        } else if (layoutType === 'category_shelf') {
          baseInput.config = {
            layoutOptions: { categoryShelf: { categoryTagIds: [SAMPLE_UUID, ANOTHER_UUID] } }
          };
        }

        const result = ZCreateWidget.safeParse(baseInput);
        expect(result.success, `${layoutType} should be valid: ${JSON.stringify(result.error?.issues)}`).toBe(true);
      }
    });

    it('should reject primary_course layout without featuredCourseId', () => {
      const result = ZCreateWidget.safeParse({ name: 'Test', layoutType: 'primary_course' });
      expect(result.success).toBe(false);
    });

    it('should reject editorial_spotlight layout without mainCourseId', () => {
      const result = ZCreateWidget.safeParse({ name: 'Test', layoutType: 'editorial_spotlight' });
      expect(result.success).toBe(false);
    });

    it('should accept category_shelf with manual selection and empty categoryTagIds', () => {
      const result = ZCreateWidget.safeParse({
        name: 'Test',
        layoutType: 'category_shelf',
        selectionMode: 'manual',
        selectedCourseIds: [SAMPLE_UUID]
      });
      expect(result.success).toBe(true);
    });

    it('should reject category_shelf with published selection and empty categoryTagIds', () => {
      const result = ZCreateWidget.safeParse({
        name: 'Test',
        layoutType: 'category_shelf',
        selectionMode: 'published'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('ZUpdateWidget', () => {
    it('should parse valid partial update', () => {
      const result = ZUpdateWidget.safeParse({ name: 'Updated Name' });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = ZUpdateWidget.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should reject empty name string', () => {
      const result = ZUpdateWidget.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('ZWidgetConfig', () => {
    it('should parse empty object with defaults', () => {
      const result = ZWidgetConfig.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.themePreset).toBe('classroomio');
        expect(result.data.sortBy).toBe('manual');
        expect(result.data.colors.primaryColor).toBe('#0f172a');
        expect(result.data.layoutOptions.cardGrid.maxCount).toBe(9);
        expect(result.data.layoutOptions.tagFilter.maxCount).toBe(12);
      }
    });

    it('should reject custom CSS exceeding 5KB', () => {
      const result = ZWidgetConfig.safeParse({
        advanced: { customCss: 'a'.repeat(5001) }
      });
      expect(result.success).toBe(false);
    });

    it('should accept custom CSS within 5KB', () => {
      const result = ZWidgetConfig.safeParse({
        advanced: { customCss: '.widget { color: red; }' }
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid theme preset', () => {
      const result = ZWidgetConfig.safeParse({ themePreset: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('should reject font scale below 0.8', () => {
      const result = ZWidgetConfig.safeParse({
        typography: { fontFamily: 'sans-serif', fontSizeScale: 0.5 }
      });
      expect(result.success).toBe(false);
    });

    it('should reject font scale above 1.4', () => {
      const result = ZWidgetConfig.safeParse({
        typography: { fontFamily: 'sans-serif', fontSizeScale: 2.0 }
      });
      expect(result.success).toBe(false);
    });
  });

  describe('ZWidgetPublicKeyParams', () => {
    it('should accept valid public key', () => {
      const result = ZWidgetPublicKeyParams.safeParse({ publicKey: 'wgt_3J98t1WpEZ73CN' });
      expect(result.success).toBe(true);
    });

    it('should reject short public key', () => {
      const result = ZWidgetPublicKeyParams.safeParse({ publicKey: 'wgt' });
      expect(result.success).toBe(false);
    });

    it('should reject empty public key', () => {
      const result = ZWidgetPublicKeyParams.safeParse({ publicKey: '' });
      expect(result.success).toBe(false);
    });
  });
});

describe('getDefaultWidgetConfig', () => {
  it('should return valid config', () => {
    const config = getDefaultWidgetConfig();
    const result = ZWidgetConfig.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('should return consistent defaults', () => {
    const configA = getDefaultWidgetConfig();
    const configB = getDefaultWidgetConfig();
    expect(configA).toEqual(configB);
  });

  it('should expose layoutOptions for every layout type', () => {
    const config = getDefaultWidgetConfig();
    expect(Object.keys(config.layoutOptions)).toEqual(
      expect.arrayContaining([
        'cardGrid',
        'tagFilter',
        'carousel',
        'primaryCourse',
        'compactList',
        'editorialSpotlight',
        'categoryShelf'
      ])
    );
  });
});

describe('getLayoutCourseLimit', () => {
  it('should respect per-layout maxCount values', () => {
    const config = getDefaultWidgetConfig();
    expect(getLayoutCourseLimit('card_grid', config.layoutOptions)).toBe(9);
    expect(getLayoutCourseLimit('tag_filter', config.layoutOptions)).toBe(12);
    expect(getLayoutCourseLimit('carousel', config.layoutOptions)).toBe(6);
    expect(getLayoutCourseLimit('compact_list', config.layoutOptions)).toBe(5);
  });

  it('should sum primary course slots', () => {
    const config = getDefaultWidgetConfig();
    config.layoutOptions.primaryCourse.secondaryMaxCount = 3;
    expect(getLayoutCourseLimit('primary_course', config.layoutOptions)).toBe(4);
  });

  it('should sum editorial spotlight slots', () => {
    const config = getDefaultWidgetConfig();
    config.layoutOptions.editorialSpotlight.secondaryMaxCount = 4;
    expect(getLayoutCourseLimit('editorial_spotlight', config.layoutOptions)).toBe(5);
  });

  it('should compute category shelf via tags × maxPerCategory', () => {
    const config = getDefaultWidgetConfig();
    config.layoutOptions.categoryShelf.categoryTagIds = [SAMPLE_UUID, ANOTHER_UUID];
    config.layoutOptions.categoryShelf.maxPerCategory = 6;
    expect(getLayoutCourseLimit('category_shelf', config.layoutOptions)).toBe(12);
  });
});

describe('isPaidWidgetPlan', () => {
  it('should return false for BASIC plan', () => {
    expect(isPaidWidgetPlan(PLAN.BASIC)).toBe(false);
  });

  it('should return true for EARLY_ADOPTER plan', () => {
    expect(isPaidWidgetPlan(PLAN.EARLY_ADOPTER)).toBe(true);
  });

  it('should return true for ENTERPRISE plan', () => {
    expect(isPaidWidgetPlan(PLAN.ENTERPRISE)).toBe(true);
  });

  it('should return false for null/undefined', () => {
    expect(isPaidWidgetPlan(null)).toBe(false);
    expect(isPaidWidgetPlan(undefined)).toBe(false);
  });
});

describe('resolveWidgetPlanGatedFields', () => {
  it('should restrict free plan to one theme', () => {
    const fields = resolveWidgetPlanGatedFields(PLAN.BASIC);
    expect(fields.isPaidPlan).toBe(false);
    expect(fields.availableThemes).toEqual(['classroomio']);
    expect(fields.canUseCustomColors).toBe(false);
    expect(fields.canUseCustomCss).toBe(false);
    expect(fields.isBrandingForced).toBe(true);
  });

  it('should unlock all themes for paid plan', () => {
    const fields = resolveWidgetPlanGatedFields(PLAN.EARLY_ADOPTER);
    expect(fields.isPaidPlan).toBe(true);
    expect(fields.availableThemes).toEqual([...WIDGET_THEME_PRESET_VALUES]);
    expect(fields.canUseCustomColors).toBe(true);
    expect(fields.canUseCustomCss).toBe(true);
    expect(fields.isBrandingForced).toBe(false);
  });

  it('should fallback invalid theme to classroomio on free plan', () => {
    const fields = resolveWidgetPlanGatedFields(PLAN.BASIC, 'graphite');
    expect(fields.selectedTheme).toBe('classroomio');
  });

  it('should allow selected theme on paid plan', () => {
    const fields = resolveWidgetPlanGatedFields(PLAN.EARLY_ADOPTER, 'spruce');
    expect(fields.selectedTheme).toBe('spruce');
  });
});

describe('normalizeWidgetConfig', () => {
  it('should enforce branding for free plan', () => {
    const config = normalizeWidgetConfig({ branding: { showPoweredBy: false } }, PLAN.BASIC);
    expect(config.branding.showPoweredBy).toBe(true);
  });

  it('should allow branding toggle for paid plan', () => {
    const config = normalizeWidgetConfig({ branding: { showPoweredBy: false } }, PLAN.EARLY_ADOPTER);
    expect(config.branding.showPoweredBy).toBe(false);
  });

  it('should strip custom CSS for free plan', () => {
    const config = normalizeWidgetConfig({ advanced: { customCss: '.foo { color: red; }' } }, PLAN.BASIC);
    expect(config.advanced.customCss).toBe('');
  });

  it('should keep custom CSS for paid plan', () => {
    const config = normalizeWidgetConfig({ advanced: { customCss: '.foo { color: red; }' } }, PLAN.EARLY_ADOPTER);
    expect(config.advanced.customCss).toBe('.foo { color: red; }');
  });

  it('should reset colors to defaults for free plan', () => {
    const config = normalizeWidgetConfig(
      {
        colors: {
          primaryColor: '#ff0000',
          backgroundColor: '#ffffff',
          textColor: '#111827',
          badgeColor: '#e2e8f0',
          borderColor: '#e5e7eb',
          highlightColor: '#dbeafe'
        }
      } as Partial<TWidgetConfig>,
      PLAN.BASIC
    );
    const defaultConfig = getDefaultWidgetConfig();
    expect(config.colors).toEqual(defaultConfig.colors);
  });

  it('should allow custom colors for paid plan', () => {
    const config = normalizeWidgetConfig(
      {
        colors: {
          primaryColor: '#ff0000',
          backgroundColor: '#ffffff',
          textColor: '#111827',
          badgeColor: '#e2e8f0',
          borderColor: '#e5e7eb',
          highlightColor: '#dbeafe'
        }
      } as Partial<TWidgetConfig>,
      PLAN.EARLY_ADOPTER
    );
    expect(config.colors.primaryColor).toBe('#ff0000');
  });

  it('should handle null/undefined config input', () => {
    const config = normalizeWidgetConfig(null);
    expect(config).toBeDefined();
    expect(config.themePreset).toBe('classroomio');
  });
});
