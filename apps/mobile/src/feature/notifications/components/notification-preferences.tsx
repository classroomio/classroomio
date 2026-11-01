import type { TNotificationCategory } from '@cio/utils/constants/notifications';
import { BellRing, Globe, Moon, RefreshCw, Settings2 } from 'lucide-react-native';
import { createContext, use, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { Icon } from '@/feature/common/components/icon';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle
} from '@/feature/common/components/item';
import {
  OptionSheet,
  OptionSheetCancel,
  OptionSheetContent,
  OptionSheetItem,
  OptionSheetTitle
} from '@/feature/common/components/option-sheet';
import { ScreenSection, ScreenSectionHeader } from '@/feature/common/components/screen';
import { SegmentedControl, SegmentedControlItem } from '@/feature/common/components/segmented-control';
import { Skeleton } from '@/feature/common/components/skeleton';
import { Switch } from '@/feature/common/components/switch';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import {
  useNotificationPreferencesQuery,
  useUpdateNotificationPreferences
} from '@/feature/notifications/api/notification-preferences';
import {
  NOTIFICATION_CATEGORY_DISPLAY,
  NOTIFICATION_CHANNEL_KEYS,
  NOTIFICATION_CHANNEL_NOTE_KEYS
} from '@/feature/notifications/constants/notifications';
import {
  DEFAULT_QUIET_HOURS,
  QUIET_HOURS_OPTIONS,
  deviceTimezone,
  formatMinuteOfDay
} from '@/feature/notifications/helpers/quiet-hours';
import { notificationsCatalog } from '@/feature/notifications/translations/catalog';
import type { en } from '@/feature/notifications/translations/en';
import type {
  CategoryPreference,
  NotificationChannel,
  NotificationPreferences as Preferences,
  NotificationPreferencesUpdate
} from '@/feature/notifications/types/notifications';
import { SettingValue } from '@/feature/settings/components/setting-value';
import { showToast } from '@/feature/toast/helpers/toast-store';

type NotificationPreferencesContextValue = {
  channel: NotificationChannel;
  setChannel: (channel: NotificationChannel) => void;
  preferences: Preferences | undefined;
  query: ReturnType<typeof useNotificationPreferencesQuery>;
  update: (update: NotificationPreferencesUpdate) => void;
};

const NotificationPreferencesContext = createContext<NotificationPreferencesContextValue | null>(null);

function useNotificationPreferences() {
  const context = use(NotificationPreferencesContext);
  if (!context) throw new Error('Notification preference parts must be inside NotificationPreferences');

  return context;
}

export function NotificationPreferences({ children }: { children: ReactNode }) {
  const t = useTranslations(notificationsCatalog);
  const [channel, setChannel] = useState<NotificationChannel>('push');
  const query = useNotificationPreferencesQuery();
  const mutation = useUpdateNotificationPreferences();

  const update = (change: NotificationPreferencesUpdate) => {
    mutation.mutate(change, {
      onError: (error) => showToast({ tone: 'danger', title: t('changeNotSaved'), description: errorMessage(error) })
    });
  };

  return (
    <NotificationPreferencesContext value={{ channel, setChannel, preferences: query.data, query, update }}>
      {children}
    </NotificationPreferencesContext>
  );
}

/** Skeleton while loading and an error with retry; renders nothing once preferences are loaded. */
export function NotificationPreferencesStatus() {
  const t = useTranslations(notificationsCatalog);
  const common = useTranslations(commonCatalog);
  const { preferences, query } = useNotificationPreferences();
  if (preferences) return null;

  if (query.isError) {
    return (
      <Empty>
        <EmptyMedia icon={Settings2} />
        <EmptyTitle>{t('settingsLoadError')}</EmptyTitle>
        <EmptyDescription>{errorMessage(query.error)}</EmptyDescription>
        <EmptyContent>
          <Button variant="outline" onPress={() => void query.refetch()}>
            <ButtonIcon icon={RefreshCw} />
            <ButtonText>{common('retry')}</ButtonText>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <View style={styles.skeleton}>
      <Skeleton height={40} radius={RADII.md} />
      <Skeleton height={232} radius={RADII.xl} />
      <Skeleton height={176} radius={RADII.xl} />
    </View>
  );
}

export function NotificationChannelPicker() {
  const t = useTranslations(notificationsCatalog);
  const { channel, setChannel, preferences } = useNotificationPreferences();
  if (!preferences) return null;

  const note =
    channel === 'push' && !preferences.pushAvailable
      ? t('pushUnavailable')
      : t(NOTIFICATION_CHANNEL_NOTE_KEYS[channel]);

  return (
    <View style={styles.picker}>
      <SegmentedControl value={channel} onValueChange={setChannel}>
        {(Object.keys(NOTIFICATION_CHANNEL_KEYS) as NotificationChannel[]).map((value) => (
          <SegmentedControlItem key={value} value={value}>
            {t(NOTIFICATION_CHANNEL_KEYS[value])}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
      <Text variant="caption" tone="muted">
        {note}
      </Text>
    </View>
  );
}

function channelValue(row: CategoryPreference, channel: NotificationChannel) {
  return channel === 'email' ? row.email : row[channel];
}

export function NotificationCategorySection({
  title,
  categories
}: {
  title: keyof typeof en;
  categories: TNotificationCategory[];
}) {
  const t = useTranslations(notificationsCatalog);
  const { channel, preferences } = useNotificationPreferences();
  if (!preferences) return null;

  const rows = categories
    .map((category) => preferences.categories.find((row) => row.category === category))
    .filter((row): row is CategoryPreference => Boolean(row) && channelValue(row!, channel) !== null);
  if (rows.length === 0) return null;

  return (
    <ScreenSection>
      <ScreenSectionHeader title={t(title)} />
      <ItemGroup>
        {rows.map((row) => (
          <NotificationCategorySwitch key={row.category} row={row} />
        ))}
      </ItemGroup>
    </ScreenSection>
  );
}

function NotificationCategorySwitch({ row }: { row: CategoryPreference }) {
  const t = useTranslations(notificationsCatalog);
  const { channel, preferences, update } = useNotificationPreferences();
  const display = NOTIFICATION_CATEGORY_DISPLAY[row.category];
  const label = t(display.label);
  const locked = row.locked && channel !== 'email';
  const disabled = locked || (channel === 'push' && !preferences?.pushAvailable);

  return (
    <Item>
      <ItemMedia variant="tile">
        <Icon icon={display.icon} size={20} tone="ink" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{label}</ItemTitle>
        <ItemDescription numberOfLines={3}>{t(display.description)}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Switch
          accessibilityLabel={`${label}, ${t(NOTIFICATION_CHANNEL_KEYS[channel])}`}
          value={channelValue(row, channel) ?? false}
          disabled={disabled}
          onValueChange={(value) => update({ categories: [{ category: row.category, [channel]: value }] })}
        />
      </ItemActions>
    </Item>
  );
}

type QuietHoursField = 'startMinute' | 'endMinute';

export function QuietHoursSection() {
  const t = useTranslations(notificationsCatalog);
  const locale = useLocale();
  const { channel, preferences, update } = useNotificationPreferences();
  const [editing, setEditing] = useState<QuietHoursField | null>(null);
  if (!preferences || channel !== 'push' || !preferences.pushAvailable) return null;

  const quietHours = preferences.quietHours;
  const timezone = quietHours?.timezone ?? deviceTimezone();

  const setField = (field: QuietHoursField, minute: number) => {
    const current = quietHours ?? { ...DEFAULT_QUIET_HOURS, timezone };
    update({ quietHours: { ...current, [field]: minute, timezone: deviceTimezone() } });
  };

  return (
    <ScreenSection>
      <ScreenSectionHeader title={t('quietHours')} />
      <ItemGroup>
        <Item>
          <ItemMedia variant="tile">
            <Icon icon={Moon} size={20} tone="ink" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{t('pausePush')}</ItemTitle>
            <ItemDescription numberOfLines={3}>{t('pausePushDescription')}</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Switch
              accessibilityLabel={t('pausePushA11y')}
              value={Boolean(quietHours)}
              onValueChange={(value) =>
                update({ quietHours: value ? { ...DEFAULT_QUIET_HOURS, timezone: deviceTimezone() } : null })
              }
            />
          </ItemActions>
        </Item>
        {quietHours ? (
          <Item onPress={() => setEditing('startMinute')}>
            <ItemContent>
              <ItemTitle>{t('quietFrom')}</ItemTitle>
            </ItemContent>
            <ItemActions>
              <SettingValue>{formatMinuteOfDay(quietHours.startMinute, locale)}</SettingValue>
            </ItemActions>
          </Item>
        ) : null}
        {quietHours ? (
          <Item onPress={() => setEditing('endMinute')}>
            <ItemContent>
              <ItemTitle>{t('quietUntil')}</ItemTitle>
            </ItemContent>
            <ItemActions>
              <SettingValue>{formatMinuteOfDay(quietHours.endMinute, locale)}</SettingValue>
            </ItemActions>
          </Item>
        ) : null}
        {quietHours ? (
          <Item>
            <ItemMedia variant="tile">
              <Icon icon={Globe} size={20} tone="ink" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{t('timeZone')}</ItemTitle>
            </ItemContent>
            <ItemActions>
              <SettingValue>{quietHours.timezone}</SettingValue>
            </ItemActions>
          </Item>
        ) : null}
      </ItemGroup>

      <OptionSheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <OptionSheetContent>
          <OptionSheetTitle>{editing === 'endMinute' ? t('quietEnd') : t('quietStart')}</OptionSheetTitle>
          {QUIET_HOURS_OPTIONS.map((minute) => (
            <OptionSheetItem
              key={minute}
              selected={editing !== null && quietHours?.[editing] === minute}
              onSelect={() => editing && setField(editing, minute)}
            >
              {formatMinuteOfDay(minute, locale)}
            </OptionSheetItem>
          ))}
          <OptionSheetCancel />
        </OptionSheetContent>
      </OptionSheet>
    </ScreenSection>
  );
}

export function NotificationPreferencesFootnote() {
  const t = useTranslations(notificationsCatalog);
  const { preferences } = useNotificationPreferences();
  if (!preferences) return null;

  return (
    <View style={styles.footnote}>
      <Icon icon={BellRing} size={16} tone="subtle" />
      <Text variant="caption" tone="muted" style={styles.footnoteText}>
        {t('footnote')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: { gap: SPACING.xl },
  picker: { gap: SPACING.xs },
  footnote: { flexDirection: 'row', gap: SPACING.xs, alignItems: 'flex-start' },
  footnoteText: { flex: 1 }
});
