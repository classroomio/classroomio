import {
  STUDENT_EMAIL_CATALOG,
  type EmailLocale,
  type StudentEmailId,
  type StudentEmailTemplateCopy
} from '@cio/utils/email';

import type { EmailBranding } from './branding';
import type { EmailRenderContext } from './types';
import { getDefaultTemplate } from '../templates';
import { escapeHtml, sanitizeEmailSubject } from '../utils/functions/email-helpers';

type TemplateValues = Record<string, unknown>;

interface StudentEmailRenderInput {
  id: StudentEmailId;
  values: TemplateValues;
  trustedHtml?: TemplateValues;
  optionalValues?: readonly string[];
  actionUrl?: string;
  ctaLabel?: string;
  branding?: EmailBranding;
  context?: EmailRenderContext;
}

function interpolate(template: string, values: TemplateValues, trustedHtml: TemplateValues = {}): string {
  return template.replace(/{{([a-z_]+)}}/g, (_, key: string) => {
    const trustedValue = trustedHtml[key];
    if (trustedValue != null) return String(trustedValue);

    const value = values[key];
    return value == null ? '' : escapeHtml(String(value));
  });
}

function omitParagraphsWithMissingValues(template: string, values: TemplateValues, optionalValues: readonly string[]) {
  return template.replace(/<p\b[^>]*>[\s\S]*?<\/p>/g, (paragraph) => {
    const hasMissingOptionalValue = optionalValues.some(
      (key) => (values[key] == null || values[key] === '') && paragraph.includes(`{{${key}}}`)
    );
    return hasMissingOptionalValue ? '' : paragraph;
  });
}

function replaceActionLinks(content: string, actionUrl?: string): string {
  const actionHref = /href\s*=\s*(['"]){{\s*action_url\s*}}\1/gi;
  if (!actionUrl) return content.replace(actionHref, '');

  return content.replace(actionHref, `href="${escapeHtml(actionUrl)}"`);
}

export function getStudentEmailCopy(
  id: StudentEmailId,
  context: EmailRenderContext = {}
): { locale: EmailLocale; copy: StudentEmailTemplateCopy } {
  const locale = context.locale ?? 'en';
  return { locale, copy: STUDENT_EMAIL_CATALOG[locale].templates[id] };
}

export function renderStudentEmailSubject(
  id: StudentEmailId,
  values: TemplateValues,
  context: EmailRenderContext = {}
): string {
  const { copy } = getStudentEmailCopy(id, context);
  const subject = context.subjectOverride ?? copy.subject;
  return sanitizeEmailSubject(
    subject.replace(/{{([a-z_]+)}}/g, (_, key: string) => {
      const value = values[key];
      return value == null ? '' : String(value);
    })
  );
}

export function renderStudentEmail(input: StudentEmailRenderInput): string {
  const context = input.context ?? {};
  const { locale, copy } = getStudentEmailCopy(input.id, context);
  const bodyTemplate = omitParagraphsWithMissingValues(
    context.contentOverride ?? copy.body,
    input.values,
    input.optionalValues ?? []
  );
  const bodyWithActionLinks = replaceActionLinks(bodyTemplate, input.actionUrl);
  const body = interpolate(bodyWithActionLinks, input.values, input.trustedHtml);
  const ctaLabel = input.ctaLabel ?? copy.cta;
  const cta =
    ctaLabel && input.actionUrl
      ? `<div><a class="button" href="${escapeHtml(input.actionUrl)}">${escapeHtml(ctaLabel)}</a></div>`
      : '';

  return getDefaultTemplate(`${body}${cta}`, input.branding, locale, STUDENT_EMAIL_CATALOG[locale].footer);
}

const DUE_STATUS: Record<EmailLocale, { overdue: string; due: (relativeTime: string) => string }> = {
  en: {
    overdue: 'This goal is overdue.',
    due: (relativeTime) => `This goal is due ${relativeTime}.`
  },
  hi: {
    overdue: 'यह लक्ष्य अब विलंबित है।',
    due: (relativeTime) => `यह लक्ष्य ${relativeTime} पूरा करना है।`
  },
  fr: {
    overdue: 'Cet objectif est en retard.',
    due: (relativeTime) => `Cet objectif est à rendre ${relativeTime}.`
  },
  pt: {
    overdue: 'Esta meta está atrasada.',
    due: (relativeTime) => `Esta meta vence ${relativeTime}.`
  },
  de: {
    overdue: 'Dieses Ziel ist überfällig.',
    due: (relativeTime) => `Dieses Ziel ist ${relativeTime} fällig.`
  },
  vi: {
    overdue: 'Mục tiêu này đã quá hạn.',
    due: (relativeTime) => `Mục tiêu này sẽ đến hạn ${relativeTime}.`
  },
  ru: {
    overdue: 'Срок этой цели истёк.',
    due: (relativeTime) => `Срок этой цели истекает ${relativeTime}.`
  },
  es: {
    overdue: 'Este objetivo está atrasado.',
    due: (relativeTime) => `Este objetivo vence ${relativeTime}.`
  },
  pl: {
    overdue: 'Ten cel jest zaległy.',
    due: (relativeTime) => `Termin tego celu upływa ${relativeTime}.`
  },
  da: {
    overdue: 'Dette mål er overskredet.',
    due: (relativeTime) => `Dette mål skal nås ${relativeTime}.`
  },
  tr: {
    overdue: 'Bu hedefin süresi geçti.',
    due: (relativeTime) => `Bu hedefin son tarihi ${relativeTime}.`
  }
};

export function getLocalizedDueStatus(daysUntilDue: number, locale: EmailLocale): string {
  const copy = DUE_STATUS[locale];
  if (daysUntilDue <= 0) return copy.overdue;

  const relativeTime = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(daysUntilDue, 'day');
  return copy.due(relativeTime);
}
