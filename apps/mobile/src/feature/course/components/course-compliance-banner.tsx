import { CalendarDotsIcon } from 'phosphor-react-native/src/icons/CalendarDots';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { ShieldSlashIcon } from 'phosphor-react-native/src/icons/ShieldSlash';
import { WarningIcon } from 'phosphor-react-native/src/icons/Warning';

import { Banner, BannerContent, BannerDescription, BannerIcon, BannerTitle } from '@/feature/common/components/banner';
import { complianceDeadlineCopy } from '@/feature/course/helpers/compliance-deadline';
import { courseCatalog } from '@/feature/course/translations/catalog';
import type { EnrolledCourse } from '@/feature/course/types/course';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

type CourseComplianceBannerProps = {
  course: Pick<EnrolledCourse, 'complianceStatus' | 'complianceDueDate' | 'complianceValidUntil'>;
};

export function CourseComplianceBanner({ course }: CourseComplianceBannerProps) {
  const t = useTranslations(courseCatalog);
  const locale = useLocale();
  const copy = complianceDeadlineCopy(course, t, locale);
  if (!copy) return null;

  const icon = copy.urgent
    ? WarningIcon
    : copy.tone === 'success'
      ? CheckCircleIcon
      : copy.tone === 'neutral'
        ? ShieldSlashIcon
        : CalendarDotsIcon;

  return (
    <Banner tone={copy.tone} accessibilityLabel={`${copy.title}. ${copy.description}`}>
      <BannerIcon icon={icon} />
      <BannerContent>
        <BannerTitle>{copy.title}</BannerTitle>
        <BannerDescription>{copy.description}</BannerDescription>
      </BannerContent>
    </Banner>
  );
}
