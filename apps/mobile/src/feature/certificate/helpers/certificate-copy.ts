import { certificateCatalog } from '@/feature/certificate/translations/catalog';
import type { en } from '@/feature/certificate/translations/en';
import type { Certificate, CertificateList } from '@/feature/certificate/types/certificate';
import { calendarDaysUntil } from '@/feature/common/helpers/calendar-date';
import type { Translator } from '@/feature/i18n/helpers/translate';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

/** Translator and date formatter for certificate copy, in the app language. */
export type CertificateCopy = { t: Translator<typeof en>; date: (iso: string) => string };

export function useCertificateCopy(): CertificateCopy {
  const t = useTranslations(certificateCatalog);
  const formatters = useFormatters();

  return { t, date: (iso: string) => formatters.date(new Date(iso)) };
}

export function certificateStatusText(
  certificate: Pick<Certificate, 'status' | 'expiresAt'>,
  { t, date }: CertificateCopy,
  now = new Date()
) {
  const { status, expiresAt } = certificate;
  if (!expiresAt) return t('statusValidNoExpiry');
  if (status === 'expired') return t('statusExpiredOn', { date: date(expiresAt) });
  if (status === 'expiring_soon') {
    const days = calendarDaysUntil(expiresAt, now);

    return days <= 0 ? t('statusExpiresToday') : t('statusExpiresInDays', { count: days });
  }

  return t('statusValidUntil', { date: date(expiresAt) });
}

export function certificatesSummaryText(earned: CertificateList['earned'], { t }: CertificateCopy) {
  const expiring = earned.filter((certificate) => certificate.status === 'expiring_soon').length;
  const count = t('summaryCount', { count: earned.length });

  return expiring > 0 ? `${count} · ${t('summaryExpiringSoon', { count: expiring })}` : count;
}
