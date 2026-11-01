import { CalendarDotsIcon } from 'phosphor-react-native/src/icons/CalendarDots';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { CircleDashedIcon } from 'phosphor-react-native/src/icons/CircleDashed';
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { XCircleIcon } from 'phosphor-react-native/src/icons/XCircle';
import { createContext, use, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/feature/common/components/avatar';
import { Button, ButtonSpinner, ButtonText } from '@/feature/common/components/button';
import { Icon } from '@/feature/common/components/icon';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/feature/common/components/input';
import {
  Item,
  ItemActions,
  ItemChevron,
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
import { SegmentedControl, SegmentedControlItem } from '@/feature/common/components/segmented-control';
import { SwipeActionRow } from '@/feature/common/components/swipe-action-row';
import { Text } from '@/feature/common/components/text';
import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import type { Locale } from '@/feature/i18n/types/i18n';
import type { Translator } from '@/feature/i18n/helpers/translate';
import { formatDateTime } from '@/feature/teach/helpers/relative-time';
import {
  learnerName,
  useAttendanceRoster,
  type AttendanceSession
} from '@/feature/teach/helpers/use-attendance-roster';
import { teachCatalog } from '@/feature/teach/translations/catalog';
import type { en } from '@/feature/teach/translations/en';
import type { AttendanceStatus, TeachCourse, TeachCourseMember } from '@/feature/teach/types/teach';

import { Stat, StatGrid } from './stat-grid';

type RosterContextValue = ReturnType<typeof useAttendanceRoster> & { session: AttendanceSession | null };

const RosterContext = createContext<RosterContextValue | null>(null);

function useRoster() {
  const roster = use(RosterContext);
  if (!roster) throw new Error('Attendance parts must be used inside AttendanceRoster');

  return roster;
}

type AttendanceRosterProps = {
  course: TeachCourse;
  session: AttendanceSession | null;
  children: ReactNode | ((roster: RosterContextValue) => ReactNode);
};

export function AttendanceRoster({ course, session, children }: AttendanceRosterProps) {
  const roster = useAttendanceRoster(course, session?.id ?? null);
  const value = { ...roster, session };

  return <RosterContext value={value}>{typeof children === 'function' ? children(value) : children}</RosterContext>;
}

function sessionLabel(session: AttendanceSession, t: Translator<typeof en>, locale: Locale) {
  return session.lessonAt ? formatDateTime(session.lessonAt, locale) : t('sessionNumber', { number: session.number });
}

type AttendanceSessionPickerProps = {
  sessions: AttendanceSession[];
  onSelect: (session: AttendanceSession) => void;
};

export function AttendanceSessionPicker({ sessions, onSelect }: AttendanceSessionPickerProps) {
  const t = useTranslations(teachCatalog);
  const locale = useLocale();
  const { session, changes } = useRoster();
  const [open, setOpen] = useState(false);

  return (
    <>
      <ItemGroup>
        <Item
          onPress={() => setOpen(true)}
          accessibilityLabel={session ? t('sessionA11y', { title: session.title }) : t('noSessionA11y')}
        >
          <ItemMedia variant="tile">
            <Icon icon={CalendarDotsIcon} size={20} tone="ink" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle numberOfLines={1}>{session?.title ?? t('chooseSession')}</ItemTitle>
            {session ? <ItemDescription numberOfLines={1}>{sessionLabel(session, t, locale)}</ItemDescription> : null}
          </ItemContent>
          <ItemActions>
            <Text variant="captionStrong" tone="primary">
              {t('change')}
            </Text>
            <ItemChevron />
          </ItemActions>
        </Item>
      </ItemGroup>
      {changes.length > 0 && (
        <Text variant="caption" tone="muted">
          {t('unsavedNote')}
        </Text>
      )}

      <OptionSheet open={open} onOpenChange={setOpen}>
        <OptionSheetContent>
          <OptionSheetTitle>{t('sessions')}</OptionSheetTitle>
          {sessions.map((candidate) => (
            <OptionSheetItem
              key={candidate.id}
              selected={candidate.id === session?.id}
              onSelect={() => onSelect(candidate)}
            >
              {`${candidate.title} · ${sessionLabel(candidate, t, locale)}`}
            </OptionSheetItem>
          ))}
          <OptionSheetCancel />
        </OptionSheetContent>
      </OptionSheet>
    </>
  );
}

export function AttendanceSummary() {
  const t = useTranslations(teachCatalog);
  const { counts } = useRoster();

  return (
    <StatGrid>
      <Stat
        label={t('present')}
        icon={CheckCircleIcon}
        value={String(counts.present)}
        tone={counts.present > 0 ? 'success' : 'ink'}
      />
      <Stat
        label={t('absent')}
        icon={XCircleIcon}
        value={String(counts.absent)}
        tone={counts.absent > 0 ? 'danger' : 'ink'}
      />
      <Stat label={t('notMarked')} icon={CircleDashedIcon} value={String(counts.unmarked)} />
    </StatGrid>
  );
}

export function AttendanceBulkActions() {
  const t = useTranslations(teachCatalog);
  const { markAll, discard, changes, learners } = useRoster();
  if (learners.length === 0) return null;

  return (
    <View style={styles.bulk}>
      <Button variant="outline" size="sm" onPress={() => markAll('present')} style={styles.bulkButton}>
        <ButtonText>{t('markAllPresent')}</ButtonText>
      </Button>
      <Button variant="outline" size="sm" onPress={() => markAll('absent')} style={styles.bulkButton}>
        <ButtonText>{t('markAllAbsent')}</ButtonText>
      </Button>
      {changes.length > 0 && (
        <Button variant="ghost" size="sm" onPress={discard}>
          <ButtonText>{t('undo')}</ButtonText>
        </Button>
      )}
    </View>
  );
}

export function AttendanceSearch({ value, onChangeText }: { value: string; onChangeText: (value: string) => void }) {
  const t = useTranslations(teachCatalog);

  return (
    <InputGroup>
      <InputGroupAddon>
        <View style={styles.searchIcon}>
          <Icon icon={MagnifyingGlassIcon} size={17} tone="muted" />
        </View>
      </InputGroupAddon>
      <InputGroupInput
        value={value}
        onChangeText={onChangeText}
        placeholder={t('findLearner')}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode="while-editing"
        accessibilityLabel={t('findLearner')}
        style={styles.searchInput}
      />
    </InputGroup>
  );
}

const STATUS_KEYS = {
  present: 'present',
  absent: 'absent',
  unmarked: 'notMarked'
} as const satisfies Record<AttendanceStatus | 'unmarked', keyof typeof en>;

export function AttendanceRow({ learner }: { learner: TeachCourseMember }) {
  const t = useTranslations(teachCatalog);
  const { statusOf, setStatus, changes } = useRoster();
  const status = statusOf(learner.id);
  const statusText = t(STATUS_KEYS[status ?? 'unmarked']);
  const name = learnerName(learner) ?? t('invitedLearner');
  const changed = changes.some((change) => change.studentId === learner.id);

  return (
    <SwipeActionRow
      resetKey={learner.id}
      leading={{
        label: t('present'),
        icon: CheckCircleIcon,
        tone: 'success',
        onCommit: () => setStatus(learner.id, 'present')
      }}
      trailing={{
        label: t('absent'),
        icon: XCircleIcon,
        tone: 'danger',
        onCommit: () => setStatus(learner.id, 'absent')
      }}
    >
      <Item accessibilityLabel={[name, statusText, changed ? t('notSaved') : null].filter(Boolean).join(', ')}>
        <ItemMedia>
          <Avatar name={name} uri={learner.profile?.avatarUrl} size={36} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle numberOfLines={1}>{name}</ItemTitle>
          <ItemDescription numberOfLines={1}>
            {statusText}
            {changed ? ` · ${t('notSaved')}` : ''}
          </ItemDescription>
        </ItemContent>
        <View style={styles.toggle}>
          <SegmentedControl<AttendanceStatus | ''>
            value={status ?? ''}
            onValueChange={(next) => next && setStatus(learner.id, next)}
          >
            <SegmentedControlItem value="present">{t('present')}</SegmentedControlItem>
            <SegmentedControlItem value="absent">{t('absent')}</SegmentedControlItem>
          </SegmentedControl>
        </View>
      </Item>
    </SwipeActionRow>
  );
}

type AttendanceSaveBarProps = { saving: boolean; onSave: () => void };

export function AttendanceSaveBar({ saving, onSave }: AttendanceSaveBarProps) {
  const t = useTranslations(teachCatalog);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { changes, learners } = useRoster();
  const label = changes.length === 0 ? t('noChangesToSave') : t('saveChanges', { count: changes.length });

  return (
    <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
      <View
        style={[
          styles.saveBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + SPACING.sm
          }
        ]}
      >
        <Text variant="caption" tone="muted" style={styles.saveCopy}>
          {t('learnerCount', { count: learners.length })}
        </Text>
        <Button size="lg" disabled={saving || changes.length === 0} onPress={onSave} style={styles.saveButton}>
          {saving ? <ButtonSpinner /> : <ButtonText>{label}</ButtonText>}
        </Button>
      </View>
    </KeyboardStickyView>
  );
}

const styles = StyleSheet.create({
  bulk: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  bulkButton: { flexGrow: 1 },
  searchIcon: { paddingLeft: SPACING.sm },
  searchInput: { paddingLeft: SPACING.xs },
  toggle: { width: 168 },
  saveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: GUTTER,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth * 2
  },
  saveCopy: { minWidth: 72 },
  saveButton: { flex: 1 }
});
