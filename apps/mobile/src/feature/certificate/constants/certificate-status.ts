import { CalendarDotsIcon } from 'phosphor-react-native/src/icons/CalendarDots';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import type { AppIcon } from '@/feature/common/components/icon';

import type { CertificateStatus } from '@/feature/certificate/types/certificate';
import type { TextTone } from '@/feature/common/components/text';

export const CERTIFICATE_STATUS_DISPLAY: Record<CertificateStatus, { icon: AppIcon; tone: TextTone }> = {
  valid: { icon: CheckCircleIcon, tone: 'success' },
  expiring_soon: { icon: CalendarDotsIcon, tone: 'warning' },
  expired: { icon: WarningCircleIcon, tone: 'danger' }
};
