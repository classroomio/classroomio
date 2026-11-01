import { ChatCircleIcon } from 'phosphor-react-native/src/icons/ChatCircle';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { ClockIcon } from 'phosphor-react-native/src/icons/Clock';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle
} from '@/feature/common/components/alert-dialog';
import type { AppIcon } from '@/feature/common/components/icon';
import { IconTile } from '@/feature/common/components/icon-tile';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { notificationsCatalog } from '@/feature/notifications/translations/catalog';

type PushPermissionDialogProps = {
  open: boolean;
  orgName: string | null;
  onOpenChange: (open: boolean) => void;
  onAllow: () => void;
};

export function PushPermissionDialog({ open, orgName, onOpenChange, onAllow }: PushPermissionDialogProps) {
  const t = useTranslations(notificationsCatalog);
  const { colors } = useTheme();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogTitle>{t('promptTitle')}</AlertDialogTitle>
        <AlertDialogDescription>
          {t('promptDescription', { orgName: orgName ?? t('promptOrgFallback') })}
        </AlertDialogDescription>
        <PushPermissionReasons>
          <PushPermissionReason icon={ClockIcon}>{t('promptReasonDeadlines')}</PushPermissionReason>
          <PushPermissionReason icon={CheckCircleIcon}>{t('promptReasonGrades')}</PushPermissionReason>
          <PushPermissionReason icon={ChatCircleIcon}>{t('promptReasonReplies')}</PushPermissionReason>
        </PushPermissionReasons>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('promptNotNow')}</AlertDialogCancel>
          <AlertDialogAction onPress={onAllow}>{t('promptTurnOn')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function PushPermissionReasons({ children }: { children: ReactNode }) {
  return <View style={styles.reasons}>{children}</View>;
}

function PushPermissionReason({ icon, children }: { icon: AppIcon; children: string }) {
  return (
    <View style={styles.reason}>
      <IconTile icon={icon} size={30} />
      <Text variant="captionStrong" style={styles.reasonText}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  reasons: { gap: SPACING.sm, marginTop: SPACING.md },
  reason: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  reasonText: { flex: 1 }
});
