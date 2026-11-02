import { ArrowsClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowsClockwise';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { CloudArrowUpIcon } from 'phosphor-react-native/src/icons/CloudArrowUp';
import { PlayCircleIcon } from 'phosphor-react-native/src/icons/PlayCircle';
import { WarningIcon } from 'phosphor-react-native/src/icons/Warning';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '@/feature/common/components/button';
import { Icon, type AppIcon } from '@/feature/common/components/icon';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle
} from '@/feature/common/components/item';
import { ScreenSection, ScreenSectionHeader } from '@/feature/common/components/screen';
import { Text, type TextTone } from '@/feature/common/components/text';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import type { Translator } from '@/feature/i18n/helpers/translate';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useSyncEntries } from '@/feature/offline/helpers/sync-queue';
import { requestSync, retrySyncEntry } from '@/feature/offline/helpers/sync-runner';
import { offlineCatalog } from '@/feature/offline/translations/catalog';
import type { en } from '@/feature/offline/translations/en';
import type { SyncEntry } from '@/feature/offline/types/sync';

type OfflineTranslator = Translator<typeof en>;

const MAX_ROWS = 20;

type SyncRow = { id: string; entry: SyncEntry; updates: number };

function rowsOf(entries: SyncEntry[]): SyncRow[] {
  const rows: SyncRow[] = [];
  const beats = new Map<string, SyncRow>();

  for (const entry of entries) {
    if (entry.type !== 'playback.position') {
      rows.push({ id: entry.key, entry, updates: 1 });
      continue;
    }

    const assetId = entry.payload.type === 'playback.position' ? entry.payload.assetId : '';
    const groupKey = `${entry.lessonId}:${assetId}:${entry.status}`;
    const existing = beats.get(groupKey);
    if (existing) {
      existing.entry = entry;
      existing.updates += 1;
      continue;
    }

    const row = { id: entry.key, entry, updates: 1 };
    beats.set(groupKey, row);
    rows.push(row);
  }

  const waiting = rows.filter((row) => row.entry.status !== 'synced');
  const synced = rows.filter((row) => row.entry.status === 'synced').reverse();

  return [...waiting, ...synced].slice(0, MAX_ROWS);
}

function formatPosition(seconds: number) {
  const minutes = Math.floor(seconds / 60);

  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

function statusOf(entry: SyncEntry, t: OfflineTranslator): { icon: AppIcon; tone: TextTone; label: string } {
  if (entry.status === 'synced') return { icon: CheckCircleIcon, tone: 'success', label: t('synced') };
  if (entry.status === 'syncing') return { icon: ArrowsClockwiseIcon, tone: 'primary', label: t('syncing') };
  if (entry.status === 'queued') return { icon: CloudArrowUpIcon, tone: 'muted', label: t('waitingToSync') };
  if (entry.retryable) {
    return { icon: ArrowsClockwiseIcon, tone: 'warning', label: t('retryingAttempt', { attempt: entry.attempts + 1 }) };
  }

  return {
    icon: WarningIcon,
    tone: 'danger',
    label: entry.error ? t('notAcceptedReason', { reason: entry.error }) : t('notAccepted')
  };
}

function titleOf(row: SyncRow, t: OfflineTranslator) {
  const { entry } = row;
  if (entry.type === 'lesson.complete') return t('lessonCompleted');

  const position = entry.payload.type === 'playback.position' ? formatPosition(entry.payload.positionSeconds) : null;

  return position ? t('videoProgressAt', { position }) : t('videoProgress');
}

function SyncQueueRow({ row }: { row: SyncRow }) {
  const t = useTranslations(offlineCatalog);
  const { entry } = row;
  const status = statusOf(entry, t);
  const title = titleOf(row, t);
  const context = [entry.lessonTitle, entry.courseTitle].filter(Boolean).join(' · ');
  const failed = entry.status === 'failed' && !entry.retryable;

  return (
    <Item accessibilityLabel={[title, context, status.label].filter(Boolean).join(', ')}>
      <ItemMedia variant="tile">
        <Icon icon={entry.type === 'lesson.complete' ? CheckCircleIcon : PlayCircleIcon} size={19} tone="ink" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle numberOfLines={1}>{title}</ItemTitle>
        {context ? <ItemDescription numberOfLines={1}>{context}</ItemDescription> : null}
        <Text variant="caption" tone={status.tone} numberOfLines={2}>
          {row.updates > 1 ? `${status.label} · ${t('updateCount', { count: row.updates })}` : status.label}
        </Text>
      </ItemContent>
      {failed ? (
        <ItemActions>
          <Button size="sm" variant="outline" onPress={() => void retrySyncEntry(entry)}>
            <ButtonText>{t('retry')}</ButtonText>
          </Button>
        </ItemActions>
      ) : null}
    </Item>
  );
}

function summaryOf(entries: SyncEntry[], offline: boolean, t: OfflineTranslator) {
  const waiting = entries.filter(
    (entry) => entry.status === 'queued' || entry.status === 'syncing' || (entry.status === 'failed' && entry.retryable)
  );
  if (waiting.length === 0) return t('allSynced');

  return offline
    ? t('changesWillSync', { count: waiting.length })
    : t('changesWaitingSentence', { count: waiting.length });
}

export function SyncQueuePanel() {
  const t = useTranslations(offlineCatalog);
  const entries = useSyncEntries();
  const offline = useIsOffline();
  const [syncing, setSyncing] = useState(false);
  const rows = rowsOf(entries);

  const syncNow = async () => {
    setSyncing(true);
    await requestSync({ force: true });
    setSyncing(false);
  };

  return (
    <ScreenSection>
      <ScreenSectionHeader
        title={t('syncTitle')}
        action={
          <Button size="sm" variant="outline" disabled={offline || syncing} onPress={syncNow}>
            {syncing ? (
              <ButtonSpinner />
            ) : (
              <>
                <ButtonIcon icon={ArrowsClockwiseIcon} />
                <ButtonText>{t('syncNow')}</ButtonText>
              </>
            )}
          </Button>
        }
      />
      <Text variant="caption" tone="muted" style={styles.summary}>
        {summaryOf(entries, offline, t)}
      </Text>
      {rows.length > 0 ? (
        <ItemGroup>
          {rows.map((row) => (
            <SyncQueueRow key={row.id} row={row} />
          ))}
        </ItemGroup>
      ) : null}
    </ScreenSection>
  );
}

const styles = StyleSheet.create({
  summary: { marginTop: -4 }
});
