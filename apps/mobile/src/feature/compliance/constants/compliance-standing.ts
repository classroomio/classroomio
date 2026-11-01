import {
  CalendarClock,
  CalendarOff,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CircleMinus,
  Hourglass,
  type LucideIcon
} from 'lucide-react-native';

import type { TextTone } from '@/feature/common/components/text';
import type { en } from '@/feature/compliance/translations/en';
import type { ComplianceOverallStatus, ComplianceStanding } from '@/feature/compliance/types/compliance';

type StandingDisplay = { labelKey: keyof typeof en; icon: LucideIcon; tone: TextTone };

export const STANDING_DISPLAY: Record<ComplianceStanding, StandingDisplay> = {
  overdue: { labelKey: 'standingOverdue', icon: CircleAlert, tone: 'danger' },
  in_grace_period: { labelKey: 'standingInGracePeriod', icon: Hourglass, tone: 'danger' },
  due_soon: { labelKey: 'standingDueSoon', icon: CalendarClock, tone: 'warning' },
  open: { labelKey: 'standingOpen', icon: CircleDashed, tone: 'muted' },
  unscheduled: { labelKey: 'standingUnscheduled', icon: CalendarOff, tone: 'muted' },
  compliant: { labelKey: 'standingCompliant', icon: CircleCheck, tone: 'success' },
  waived: { labelKey: 'standingWaived', icon: CircleMinus, tone: 'muted' }
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
