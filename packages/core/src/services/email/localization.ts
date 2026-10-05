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

  try {
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
  } catch (error) {
    console.error('getStudentEmailDeliveryLocale error:', error);
    return 'en';
  }
}

/**
 * Rechecks the org's entitlement at send time. Entitled orgs keep the queued locale and get their saved template;
 * everyone else gets the English default.
 */
export async function getStudentEmailSendContext(organizationId: string, emailId: string, queuedLocale: EmailLocale) {
  if (!isStudentEmailId(emailId) || !(await canCustomizeStudentEmails(organizationId))) {
    return { locale: 'en' as const, templateOverride: undefined };
  }

  const templateOverride = await getOrganizationStudentEmailTemplate(organizationId, emailId, queuedLocale);
  return { locale: queuedLocale, templateOverride };
}
