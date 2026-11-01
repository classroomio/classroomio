import { ArrowSquareOutIcon } from 'phosphor-react-native/src/icons/ArrowSquareOut';
import { EnvelopeOpenIcon } from 'phosphor-react-native/src/icons/EnvelopeOpen';
import { EnvelopeSimpleIcon } from 'phosphor-react-native/src/icons/EnvelopeSimple';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { createContext, use, useState, type ReactNode } from 'react';
import { AccessibilityInfo, StyleSheet } from 'react-native';

import {
  OptionSheet,
  OptionSheetCancel,
  OptionSheetContent,
  OptionSheetItem,
  OptionSheetTitle
} from '@/feature/common/components/option-sheet';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import {
  useDeleteNotification,
  useMarkNotificationRead,
  useMarkNotificationUnread
} from '@/feature/notifications/api/notifications';
import { hrefForDeepLink } from '@/feature/notifications/helpers/deep-link';
import { notificationCopy } from '@/feature/notifications/helpers/notification-display';
import { openNotificationTarget } from '@/feature/notifications/helpers/open-notification';
import { notificationsCatalog } from '@/feature/notifications/translations/catalog';
import type { NotificationItem } from '@/feature/notifications/types/notifications';
import { useActiveOrg } from '@/feature/org/helpers/use-active-org';
import { showToast } from '@/feature/toast/helpers/toast-store';
import type { ToastAction } from '@/feature/toast/types/toast';

type NotificationActionsValue = {
  /** Marking and deleting need the server, so they are unavailable offline. */
  offline: boolean;
  canOpen: (item: NotificationItem) => boolean;
  open: (item: NotificationItem) => void;
  toggleRead: (item: NotificationItem) => void;
  remove: (item: NotificationItem) => void;
  /** Opens the action sheet; Android's stand-in for the iOS context menu. */
  showMenu: (item: NotificationItem) => void;
};

const NotificationActionsContext = createContext<NotificationActionsValue | null>(null);

export function useNotificationActions() {
  const context = use(NotificationActionsContext);
  if (!context) throw new Error('Notification rows must be inside NotificationActions');

  return context;
}

/** Owns opening, marking, deleting with undo and the Android action sheet for the notification rows inside it. */
export function NotificationActions({ children }: { children: ReactNode }) {
  const t = useTranslations(notificationsCatalog);
  const offline = useIsOffline();
  const markRead = useMarkNotificationRead();
  const markUnread = useMarkNotificationUnread();
  const deletion = useDeleteNotification();
  const { organizations } = useActiveOrg();
  const [menuItem, setMenuItem] = useState<NotificationItem | null>(null);

  const announceOffline = () => AccessibilityInfo.announceForAccessibility(t('unavailableOffline'));

  const showChangeError = (error: unknown) =>
    showToast({ tone: 'danger', title: t('changeNotSaved'), description: errorMessage(error) });

  const value: NotificationActionsValue = {
    offline,
    canOpen: (item) => hrefForDeepLink(item.deepLink) !== null,
    open: (item) => {
      if (!item.readAt && !offline) markRead.mutate(item.id);
      if (!hrefForDeepLink(item.deepLink)) return;

      openNotificationTarget({ deepLink: item.deepLink, memberOrgIds: organizations.map((org) => org.id) });
    },
    toggleRead: (item) => {
      if (offline) return announceOffline();

      const mutation = item.readAt ? markUnread : markRead;
      mutation.mutate(item.id, { onError: showChangeError });
    },
    remove: (item) => {
      if (offline) return announceOffline();

      const undo: ToastAction = { label: t('undo'), onPress: () => deletion.undo(item.id) };
      deletion.remove(item, {
        undo,
        onError: (error) => showToast({ tone: 'danger', title: t('deleteFailed'), description: errorMessage(error) })
      });
      showToast({ title: t('deleted'), action: undo });
    },
    showMenu: setMenuItem
  };

  return (
    <NotificationActionsContext value={value}>
      {children}
      <NotificationActionSheet item={menuItem} onClose={() => setMenuItem(null)} />
    </NotificationActionsContext>
  );
}

function NotificationActionSheet({ item, onClose }: { item: NotificationItem | null; onClose: () => void }) {
  const [shown, setShown] = useState<NotificationItem | null>(item);
  if (item && item !== shown) setShown(item);

  return (
    <OptionSheet open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <OptionSheetContent>
        {shown ? <NotificationActionSheetItems item={shown} /> : null}
        <OptionSheetCancel />
      </OptionSheetContent>
    </OptionSheet>
  );
}

function NotificationActionSheetItems({ item }: { item: NotificationItem }) {
  const t = useTranslations(notificationsCatalog);
  const common = useTranslations(commonCatalog);
  const locale = useLocale();
  const actions = useNotificationActions();
  const copy = notificationCopy(item, new Date(), locale);

  return (
    <>
      <OptionSheetTitle>{copy.title}</OptionSheetTitle>
      {actions.offline ? (
        <Text variant="caption" tone="muted" style={styles.offline}>
          {t('unavailableOffline')}
        </Text>
      ) : null}
      {actions.canOpen(item) ? (
        <OptionSheetItem icon={ArrowSquareOutIcon} onSelect={() => actions.open(item)}>
          {common('open')}
        </OptionSheetItem>
      ) : null}
      <OptionSheetItem
        icon={item.readAt ? EnvelopeSimpleIcon : EnvelopeOpenIcon}
        disabled={actions.offline}
        onSelect={() => actions.toggleRead(item)}
      >
        {item.readAt ? t('markUnread') : t('markRead')}
      </OptionSheetItem>
      <OptionSheetItem icon={TrashIcon} destructive disabled={actions.offline} onSelect={() => actions.remove(item)}>
        {common('delete')}
      </OptionSheetItem>
    </>
  );
}

const styles = StyleSheet.create({
  offline: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xs }
});
