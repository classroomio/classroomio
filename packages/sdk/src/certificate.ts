import { z } from 'zod';
import type { CertificateTemplateDefinition } from './types';

const certificateTemplateIdPattern = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;
const unsafeMarkupPattern =
  /<(?:script|iframe|object|embed|link|meta|base)\b|\s(?:on[a-z]+|href|src|xlink:href)\s*=|(?:javascript|vbscript|data\s*:\s*text\/html)\s*:/i;
const unsafeStylesPattern = /@import\b|url\s*\(|expression\s*\(|javascript\s*:|behavior\s*:|-moz-binding\s*:/i;

export const CERTIFICATE_TEMPLATE_TOKENS = [
  'accentColor',
  'certificateTitle',
  'certificateId',
  'completionLabel',
  'courseDescription',
  'courseName',
  'date',
  'orgName',
  'presentedToLabel',
  'recipientName',
  'signatoryOneName',
  'signatoryOneRole',
  'signatoryOneState',
  'signatoryTwoName',
  'signatoryTwoRole',
  'signatoryTwoState',
  'subtitle',
  'verifiedCredentialLabel'
] as const;

const allowedTokens = new Set<string>(CERTIFICATE_TEMPLATE_TOKENS);
const definedCertificateTemplates = new WeakSet<object>();

const certificateTemplateSchema = z
  .object({
    id: z.string().regex(certificateTemplateIdPattern, 'Certificate template id is invalid.'),
    label: z.string().trim().min(1).optional(),
    labelKey: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).optional(),
    descriptionKey: z.string().trim().min(1).optional(),
    body: z.string().trim().min(1),
    styles: z.string().trim().min(1)
  })
  .strict()
  .refine((definition) => definition.label || definition.labelKey, {
    message: 'Certificate templates require label or labelKey.'
  })
  .refine((definition) => definition.description || definition.descriptionKey, {
    message: 'Certificate templates require description or descriptionKey.'
  });

function assertSafeDeclarativeTemplate(definition: CertificateTemplateDefinition): void {
  if (unsafeMarkupPattern.test(definition.body) || unsafeStylesPattern.test(definition.body)) {
    throw new Error(`[ClassroomIO SDK] Certificate template "${definition.id}" contains executable or unsafe markup.`);
  }

  if (unsafeStylesPattern.test(definition.styles)) {
    throw new Error(
      `[ClassroomIO SDK] Certificate template "${definition.id}" contains executable or remote-loading CSS.`
    );
  }

  const source = `${definition.body}\n${definition.styles}`;
  const tokens = source.matchAll(/{{\s*([a-zA-Z][a-zA-Z0-9]*)\s*}}/g);

  for (const match of tokens) {
    const token = match[1];

    if (!allowedTokens.has(token)) {
      throw new Error(`[ClassroomIO SDK] Certificate template "${definition.id}" uses unknown placeholder "${token}".`);
    }
  }
}

/**
 * Defines a data-only certificate template. Templates deliberately contain no
 * renderer callback so they can be validated before the host renders them.
 */
export function defineCertificateTemplate(definition: CertificateTemplateDefinition): CertificateTemplateDefinition {
  const result = certificateTemplateSchema.safeParse(definition);

  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue.path.length > 0 ? ` at "${issue.path.join('.')}"` : '';

    throw new Error(`[ClassroomIO SDK] Invalid certificate template: ${issue.message}${path}`);
  }

  const template = result.data as CertificateTemplateDefinition;
  assertSafeDeclarativeTemplate(template);
  Object.freeze(template);
  definedCertificateTemplates.add(template);

  return template;
}

/** @internal Used by definePlugin to reject unvalidated template objects. */
export function isDefinedCertificateTemplate(value: unknown): value is CertificateTemplateDefinition {
  return typeof value === 'object' && value !== null && definedCertificateTemplates.has(value);
}
