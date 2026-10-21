import type { TContentReportTargetType } from '@cio/utils/validation/report';

class ReportDialogState {
  open = $state(false);
  targetType = $state<TContentReportTargetType | null>(null);
  targetId = $state('');

  start(targetType: TContentReportTargetType, targetId: string) {
    this.targetType = targetType;
    this.targetId = String(targetId);
    this.open = true;
  }

  handleOpenChange(isOpen: boolean) {
    this.open = isOpen;

    if (!isOpen) {
      this.targetType = null;
      this.targetId = '';
    }
  }
}

export const reportDialog = new ReportDialogState();
