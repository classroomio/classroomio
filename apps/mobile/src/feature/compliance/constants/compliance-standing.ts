import { CalendarDotsIcon } from 'phosphor-react-native/src/icons/CalendarDots';
import { CalendarSlashIcon } from 'phosphor-react-native/src/icons/CalendarSlash';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { CircleDashedIcon } from 'phosphor-react-native/src/icons/CircleDashed';
import { HourglassIcon } from 'phosphor-react-native/src/icons/Hourglass';
import { MinusCircleIcon } from 'phosphor-react-native/src/icons/MinusCircle';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import type { AppIcon } from '@/feature/common/components/icon';

import type { TextTone } from '@/feature/common/components/text';
import type { en } from '@/feature/compliance/translations/en';
import type { ComplianceOverallStatus, ComplianceStanding } from '@/feature/compliance/types/compliance';

type StandingDisplay = { labelKey: keyof typeof en; icon: AppIcon; tone: TextTone };

export const STANDING_DISPLAY: Record<ComplianceStanding, StandingDisplay> = {
  overdue: { labelKey: 'standingOverdue', icon: WarningCircleIcon, tone: 'danger' },
  in_grace_period: { labelKey: 'standingInGracePeriod', icon: HourglassIcon, tone: 'danger' },
  due_soon: { labelKey: 'standingDueSoon', icon: CalendarDotsIcon, tone: 'warning' },
  open: { labelKey: 'standingOpen', icon: CircleDashedIcon, tone: 'muted' },
  unscheduled: { labelKey: 'standingUnscheduled', icon: CalendarSlashIcon, tone: 'muted' },
  compliant: { labelKey: 'standingCompliant', icon: CheckCircleIcon, tone: 'success' },
  waived: { labelKey: 'standingWaived', icon: MinusCircleIcon, tone: 'muted' }
};

export const OVERALL_DISPLAY: Record<Exclude<ComplianceOverallStatus, 'none'>, StandingDisplay> = {
  overdue: STANDING_DISPLAY.overdue,
  in_grace_period: STANDING_DISPLAY.in_grace_period,
  due_soon: STANDING_DISPLAY.due_soon,
  compliant: STANDING_DISPLAY.compliant
};

/** Standings that need the learner to act, in the order the screen lists them. */
export const ATTENTION_STANDINGS: ComplianceStanding[] = ['overdue', 'in_grace_period', 'due_soon'];

export const TODO_STANDINGS: ComplianceStanding[] = ['open', 'unscheduled'];
