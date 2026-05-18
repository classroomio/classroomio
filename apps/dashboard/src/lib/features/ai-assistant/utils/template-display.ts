import type { CourseTemplateId } from '@cio/ai-assistant';

export type CourseTemplateDisplay = {
  iconName: 'GraduationCap' | 'Compass' | 'Award';
  titleKey: string;
  descriptionKey: string;
  formTitleKey: string;
  fieldLabelKeys: Record<string, string>;
};

export const DISPLAY_BY_ID: Record<CourseTemplateId, CourseTemplateDisplay> = {
  product_101: {
    iconName: 'GraduationCap',
    titleKey: 'course.creator.template.product_101.title',
    descriptionKey: 'course.creator.template.product_101.description',
    formTitleKey: 'course.creator.template.product_101.form_title',
    fieldLabelKeys: {
      product_name: 'course.creator.template.field.product_name',
      product_summary: 'course.creator.template.field.product_summary',
      audience: 'course.creator.template.field.audience',
      outcome: 'course.creator.template.field.outcome',
      depth: 'course.creator.template.field.depth',
      documentation_url: 'course.creator.template.field.documentation_url'
    }
  },
  product_onboarding: {
    iconName: 'Compass',
    titleKey: 'course.creator.template.product_onboarding.title',
    descriptionKey: 'course.creator.template.product_onboarding.description',
    formTitleKey: 'course.creator.template.product_onboarding.form_title',
    fieldLabelKeys: {
      product_name: 'course.creator.template.field.product_name',
      audience: 'course.creator.template.field.audience',
      outcome: 'course.creator.template.field.outcome',
      documentation_url: 'course.creator.template.field.documentation_url'
    }
  },
  expert_on_x: {
    iconName: 'Award',
    titleKey: 'course.creator.template.expert_on_x.title',
    descriptionKey: 'course.creator.template.expert_on_x.description',
    formTitleKey: 'course.creator.template.expert_on_x.form_title',
    fieldLabelKeys: {
      topic: 'course.creator.template.field.topic',
      expertise_level: 'course.creator.template.field.expertise_level',
      outcome: 'course.creator.template.field.outcome',
      documentation_url: 'course.creator.template.field.documentation_url'
    }
  }
};
