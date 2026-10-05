import {
  getActiveOrganizationPlan,
  getOrganizationById,
  getOrganizationStudentEmailTemplate
} from '@cio/db/queries/organization';
import { isStudentEmailId, resolveStudentEmailLocale, type EmailLocale } from '@cio/utils/email';
import { PLAN } from '@cio/utils/plans';
import { env } from '@cio/core/config/env';

export async function canCustomizeStudentEmails(organizationId: string): Promise<boolean> {
  if (env.PUBLIC_IS_SELFHOSTED === 'true') return true;

  const activePlan = await getActiveOrganizationPlan(organizationId);
  return (activePlan?.planName ?? PLAN.BASIC) !== PLAN.BASIC;
}

export async function getStudentEmailDeliveryLocale(
  organizationId: string | undefined,
  emailId: string
): Promise<EmailLocale> {
  if (!organizationId || !isStudentEmailId(emailId)) return 'en';

  const [organization, canCustomize] = await Promise.all([
    getOrganizationById(organizationId),
    canCustomizeStudentEmails(organizationId)
  ]);
  if (!organization) return 'en';

  const language = organization.settings?.language;
  return resolveStudentEmailLocale({
    isEligible: canCustomize,
    enforced: language?.enforced === true,
    locale: language?.locale
  });
}

/**
 * Returns the org's saved template for this email and locale, or undefined when the org is not entitled to one.
 */
export async function getStudentEmailTemplateOverride(organizationId: string, emailId: string, locale: EmailLocale) {
  if (!isStudentEmailId(emailId) || !(await canCustomizeStudentEmails(organizationId))) return undefined;

  return getOrganizationStudentEmailTemplate(organizationId, emailId, locale);
}
