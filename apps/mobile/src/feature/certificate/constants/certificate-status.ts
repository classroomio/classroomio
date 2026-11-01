import { CalendarClock, CircleAlert, CircleCheck, type LucideIcon } from 'lucide-react-native';

import type { CertificateStatus } from '@/feature/certificate/types/certificate';
import type { TextTone } from '@/feature/common/components/text';

export const CERTIFICATE_STATUS_DISPLAY: Record<CertificateStatus, { icon: LucideIcon; tone: TextTone }> = {
  valid: { icon: CircleCheck, tone: 'success' },
  expiring_soon: { icon: CalendarClock, tone: 'warning' },
  expired: { icon: CircleAlert, tone: 'danger' }
};
