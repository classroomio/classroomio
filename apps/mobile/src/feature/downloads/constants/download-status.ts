import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { DownloadSimpleIcon } from 'phosphor-react-native/src/icons/DownloadSimple';
import { PauseCircleIcon } from 'phosphor-react-native/src/icons/PauseCircle';
import { WarningIcon } from 'phosphor-react-native/src/icons/Warning';
import { WifiSlashIcon } from 'phosphor-react-native/src/icons/WifiSlash';

import type { AppIcon } from '@/feature/common/components/icon';
import type { TextTone } from '@/feature/common/components/text';
import type { DownloadStatus } from '@/feature/downloads/types/downloads';

export const DOWNLOAD_STATUS_ICON: Record<DownloadStatus, { icon: AppIcon; tone: TextTone }> = {
  complete: { icon: CheckCircleIcon, tone: 'success' },
  downloading: { icon: DownloadSimpleIcon, tone: 'primary' },
  queued: { icon: DownloadSimpleIcon, tone: 'muted' },
  waiting: { icon: WifiSlashIcon, tone: 'muted' },
  paused: { icon: PauseCircleIcon, tone: 'muted' },
  failed: { icon: WarningIcon, tone: 'danger' }
};
