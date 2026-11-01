import type { LandingPageDocumentV1, LandingPageTemplateDefinition, LandingPageTemplateId } from '../types';
import { BOOTCAMP_DOCUMENT, BOOTCAMP_TEMPLATE } from './bootcamp';
import { CREATOR_DOCUMENT, CREATOR_TEMPLATE } from './creator';
import { MINIMAL_DOCUMENT, MINIMAL_TEMPLATE } from './minimal';
import { MODERN_DOCUMENT, MODERN_TEMPLATE } from './modern';

export * from './bootcamp';
export * from './creator';
export * from './modern';
export * from './minimal';

export const TEMPLATES: Record<LandingPageTemplateId, LandingPageTemplateDefinition> = {
  bootcamp: BOOTCAMP_TEMPLATE,
  creator: CREATOR_TEMPLATE,
  modern: MODERN_TEMPLATE,
  minimal: MINIMAL_TEMPLATE
};

export const TEMPLATE_LIST: LandingPageTemplateDefinition[] = [
  BOOTCAMP_TEMPLATE,
  CREATOR_TEMPLATE,
  MODERN_TEMPLATE,
  MINIMAL_TEMPLATE
];

export function getTemplateById(id: string): LandingPageTemplateDefinition | undefined {
  if (id in TEMPLATES) {
    return TEMPLATES[id as LandingPageTemplateId];
  }
  return undefined;
}

export function getDefaultDocumentForTemplate(id: LandingPageTemplateId): LandingPageDocumentV1 {
  const tpl = TEMPLATES[id];
  if (tpl) {
    return JSON.parse(JSON.stringify(tpl.document));
  }
  return JSON.parse(JSON.stringify(MODERN_DOCUMENT));
}
