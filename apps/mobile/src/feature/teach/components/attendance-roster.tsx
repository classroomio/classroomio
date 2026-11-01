import { router } from 'expo-router';
import { CalendarDotsIcon } from 'phosphor-react-native/src/icons/CalendarDots';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { QrCodeIcon } from 'phosphor-react-native/src/icons/QrCode';
import { XCircleIcon } from 'phosphor-react-native/src/icons/XCircle';
import { createContext, use, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle
} from '@/feature/common/components/alert-dialog';
import { Avatar } from '@/feature/common/components/avatar';
import type { SheetRef } from '@/feature/common/components/bottom-sheet';
import { Button, ButtonText } from '@/feature/common/components/button';
import { Card } from '@/feature/common/components/card';
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
  OptionSheetItem,
  OptionSheetTitle
} from '@/feature/common/components/option-sheet';
import { IconTile } from '@/feature/common/components/icon-tile';
import { SwipeActionRow } from '@/feature/common/components/swipe-action-row';
import { Text, type TextTone } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { DURATION, EASE_OUT } from '@/feature/common/constants/motion';
import { parseTimestamp } from '@/feature/common/helpers/time-ago';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { countdownOf } from '@/feature/check-in/helpers/check-in-window';
import { groupCheckInCode } from '@/feature/check-in/helpers/check-in-code';
import { useNow } from '@/feature/check-in/helpers/use-now';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import type { Translator } from '@/feature/i18n/helpers/translate';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import type { Locale } from '@/feature/i18n/types/i18n';
import type { AttendanceMark } from '@/feature/teach/api/attendance';
import { useCheckInCodeQuery } from '@/feature/teach/api/check-in-code';
import { ROSTER_POLL_MS, useTeachCourseQuery } from '@/feature/teach/api/teach-course';
import { formatDateTime } from '@/feature/teach/helpers/relative-time';
import {
  isSessionLive,
  learnerName,
  useAttendanceRoster,
  type AttendanceSession
} from '@/feature/teach/helpers/use-attendance-roster';
import { teachCatalog } from '@/feature/teach/translations/catalog';
import type { en } from '@/feature/teach/translations/en';
import type { AttendanceStatus, TeachCourse, TeachCourseMember } from '@/feature/teach/types/teach';

import { AttendanceStatusControl } from './attendance-status-control';

type RosterContextValue = ReturnType<typeof useAttendanceRoster> & {
  course: TeachCourse;
  session: AttendanceSession | null;
};

const RosterContext = createContext<RosterContextValue | null>(null);

function useRoster() {
  const roster = use(RosterContext);
  if (!roster) throw new Error('Attendance parts must be used inside AttendanceRoster');

  return roster;
}

type AttendanceRosterProps = {
  course: TeachCourse;
  session: AttendanceSession | null;
  onSaveError: (error: unknown, marks: AttendanceMark[], retry: () => void) => void;
  children: ReactNode | ((roster: RosterContextValue) => ReactNode);
};

export function AttendanceRoster({ course, session, onSaveError, children }: AttendanceRosterProps) {
  const roster = useAttendanceRoster(course, session?.id ?? null, { onSaveError });
  const value = { ...roster, course, session };

  return <RosterContext value={value}>{typeof children === 'function' ? children(value) : children}</RosterContext>;
}

export function sessionLabel(session: AttendanceSession, t: Translator<typeof en>, locale: Locale) {
  if (isSessionLive(session)) return t('sessionLiveNow');

  return session.lessonAt ? formatDateTime(session.lessonAt, locale) : t('sessionNumber', { number: session.number });
}

type AttendanceSessionPickerProps = {
  sessions: AttendanceSession[];
  onSelect: (session: AttendanceSession) => void;
};

export function AttendanceSessionPicker({ sessions, onSelect }: AttendanceSessionPickerProps) {
  const t = useTranslations(teachCatalog);
  const locale = useLocale();
  const { colors } = useTheme();
  const { session } = useRoster();
  const picker = useRef<SheetRef>(null);
  const live = session ? isSessionLive(session) : false;

  return (
    <>
      <Item
        onPress={() => picker.current?.present()}
        accessibilityLabel={session ? t('sessionA11y', { title: session.title }) : t('noSessionA11y')}
      >
        <ItemMedia>
          <IconTile icon={CalendarDotsIcon} tone={live ? 'danger' : 'primary'} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle numberOfLines={1}>{session?.title ?? t('chooseSession')}</ItemTitle>
          {session ? (
            <ItemDescription numberOfLines={1} tone={live ? 'danger' : 'muted'}>
              {sessionLabel(session, t, locale)}
            </ItemDescription>
          ) : null}
        </ItemContent>
        <ItemActions>
          <Text variant="captionStrong" tone="primary">
            {t('change')}
          </Text>
          <ItemChevron />
        </ItemActions>
      </Item>

      <OptionSheet ref={picker}>
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
      </OptionSheet>
    </>
  );
}

export function AttendanceCheckInItem() {
  const { course, session } = useRoster();
  const code = useCheckInCodeQuery(course.id, session?.id ?? null);
  if (!session) return null;

  const open = () =>
    router.push({
      pathname: '/teach/course/[courseId]/check-in',
      params: { courseId: course.id, lessonId: session.id }
    });

  return code.data ? (
    <OpenCheckInItem courseId={course.id} code={code.data.code} expiresAt={code.data.expiresAt} onPress={open} />
  ) : (
    <StartCheckInItem onPress={open} />
  );
}

function StartCheckInItem({ onPress }: { onPress: () => void }) {
  const t = useTranslations(teachCatalog);
  const { colors } = useTheme();

  return (
    <Item onPress={onPress}>
      <ItemMedia>
        <IconTile icon={QrCodeIcon} tone="primary" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle numberOfLines={1}>{t('startCheckIn')}</ItemTitle>
        <ItemDescription numberOfLines={2}>{t('startCheckInDescription')}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <ItemChevron />
      </ItemActions>
    </Item>
  );
}

type OpenCheckInItemProps = { courseId: string; code: string; expiresAt: string; onPress: () => void };

function OpenCheckInItem({ courseId, code, expiresAt, onPress }: OpenCheckInItemProps) {
  const t = useTranslations(teachCatalog);
  const { colors } = useTheme();
  const now = useNow(1000);
  const countdown = countdownOf(expiresAt, now);
  useTeachCourseQuery(courseId, { pollMs: countdown ? ROSTER_POLL_MS : undefined });

  return (
    <Item onPress={onPress}>
      <ItemMedia>
        <IconTile icon={QrCodeIcon} tone={countdown ? 'success' : 'neutral'} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle numberOfLines={1}>{countdown ? t('checkInOpen') : t('codeExpired')}</ItemTitle>
        <ItemDescription numberOfLines={1} style={styles.tabular}>
          {countdown
            ? t('checkInOpenDetail', { code: groupCheckInCode(code), time: countdown.label })
            : t('startCheckInDescription')}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Text variant="captionStrong" tone="primary">
          {t('showCode')}
        </Text>
        <ItemChevron />
      </ItemActions>
    </Item>
  );
}

const STATUS_KEYS = {
  present: 'present',
  late: 'statusLate',
  absent: 'absent',
  unmarked: 'notMarked'
} as const satisfies Record<AttendanceStatus | 'unmarked', keyof typeof en>;

const STATUS_TONES = {
  present: 'success',
  late: 'warning',
  absent: 'danger',
  unmarked: 'muted'
} as const satisfies Record<AttendanceStatus | 'unmarked', TextTone>;

export function AttendanceSummary() {
  const t = useTranslations(teachCatalog);
  const format = useFormatters();
  const { colors } = useTheme();
  const { counts, learners } = useRoster();
  const marked = learners.length - counts.unmarked;
  const segments = (['present', 'late', 'absent', 'unmarked'] as const).filter((status) => counts[status] > 0);
  const fill = {
    present: colors.success,
    late: colors.warning,
    absent: colors.danger,
    unmarked: colors.mutedStrong
  };

  return (
    <Card style={styles.summary}>
      <View
        accessible
        accessibilityLabel={[
          t('markedOf', { marked, count: learners.length }),
          ...(['present', 'late', 'absent', 'unmarked'] as const).map(
            (status) => `${t(STATUS_KEYS[status])} ${counts[status]}`
          )
        ].join(', ')}
        style={styles.summaryBody}
      >
        <Text variant="heading" style={styles.tabular}>
          {t('markedOf', { marked: format.number(marked), count: learners.length })}
        </Text>
        <View style={styles.bar}>
          {segments.map((status) => (
            <Animated.View
              key={status}
              layout={LinearTransition.duration(DURATION.base).easing(EASE_OUT)}
              style={[styles.segment, { flex: counts[status], backgroundColor: fill[status] }]}
            />
          ))}
        </View>
        <View style={styles.legend}>
          {(['present', 'late', 'absent', 'unmarked'] as const).map((status) => (
            <View key={status} style={styles.legendItem}>
              <Text variant="title" tone={counts[status] > 0 ? STATUS_TONES[status] : 'subtle'} style={styles.tabular}>
                {format.number(counts[status])}
              </Text>
              <View style={styles.legendLabel}>
                <View style={[styles.dot, { backgroundColor: fill[status] }]} />
                <Text variant="micro" tone="muted" numberOfLines={1}>
                  {t(STATUS_KEYS[status])}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}

export function AttendanceBulkActions() {
  const t = useTranslations(teachCatalog);
  const { markAll, markUnmarked, overwrittenBy, counts, learners } = useRoster();
  const [confirming, setConfirming] = useState<AttendanceStatus | null>(null);
  if (learners.length === 0) return null;

  const requestAll = (status: AttendanceStatus) => {
    if (overwrittenBy(status) === 0) {
      markAll(status);
      return;
    }

    setConfirming(status);
  };

  const someMarked = counts.unmarked > 0 && counts.unmarked < learners.length;
  const replaced = confirming ? overwrittenBy(confirming) : 0;

  return (
    <View style={styles.bulk}>
      <View style={styles.bulkRow}>
        <Button variant="outline" size="sm" onPress={() => requestAll('present')} style={styles.bulkButton}>
          <ButtonText>{t('markAllPresent')}</ButtonText>
        </Button>
        <Button variant="outline" size="sm" onPress={() => requestAll('absent')} style={styles.bulkButton}>
          <ButtonText>{t('markAllAbsent')}</ButtonText>
        </Button>
      </View>
      {someMarked ? (
        <Button variant="secondary" size="sm" onPress={() => markUnmarked('absent')}>
          <ButtonText>{t('markRestAbsent', { count: counts.unmarked })}</ButtonText>
        </Button>
      ) : null}

      <AlertDialog open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>
            {confirming === 'absent'
              ? t('confirmAllAbsentTitle', { count: learners.length })
              : t('confirmAllPresentTitle', { count: learners.length })}
          </AlertDialogTitle>
          <AlertDialogDescription>{t('confirmReplaceMarks', { count: replaced })}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel />
            <AlertDialogAction
              variant={confirming === 'absent' ? 'destructive' : 'primary'}
              onPress={() => {
                if (confirming) markAll(confirming);
                setConfirming(null);
              }}
            >
              {confirming === 'absent' ? t('markAllAbsent') : t('markAllPresent')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

export function AttendanceRows({ learners }: { learners: TeachCourseMember[] }) {
  return (
    <ItemGroup>
      {learners.map((learner) => (
        <AttendanceRow key={learner.id} learner={learner} />
      ))}
    </ItemGroup>
  );
}

function AttendanceRow({ learner }: { learner: TeachCourseMember }) {
  const t = useTranslations(teachCatalog);
  const format = useFormatters();
  const { statusOf, recordOf, setStatus } = useRoster();
  const status = statusOf(learner.id);
  const statusText = t(STATUS_KEYS[status ?? 'unmarked']);
  const name = learnerName(learner) ?? t('invitedLearner');
  const checkedInAt = recordOf(learner.id)?.checkedInAt;
  const checkedInTime = checkedInAt && status !== 'absent' ? parseTimestamp(checkedInAt) : Number.NaN;
  const checkedIn = Number.isFinite(checkedInTime)
    ? t('checkedInAt', { time: format.time(new Date(checkedInTime)) })
    : null;

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
      <Item>
        <ItemMedia>
          <Avatar name={name} uri={learner.profile?.avatarUrl} size={36} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle numberOfLines={1}>{name}</ItemTitle>
          <Text variant="caption" numberOfLines={2}>
            <Text variant="captionStrong" tone={STATUS_TONES[status ?? 'unmarked']}>
              {statusText}
            </Text>
            {checkedIn ? <Text tone="muted">{` · ${checkedIn}`}</Text> : null}
          </Text>
        </ItemContent>
        <AttendanceStatusControl value={status} learner={name} onChange={(next) => setStatus(learner.id, next)} />
      </Item>
    </SwipeActionRow>
  );
}

const styles = StyleSheet.create({
  tabular: { fontVariant: ['tabular-nums'] },
  summary: { padding: SPACING.md },
  summaryBody: { gap: SPACING.sm },
  bar: {
    flexDirection: 'row',
    gap: 3,
    height: 8,
    borderRadius: RADII.pill,
    overflow: 'hidden'
  },
  segment: { height: '100%', borderRadius: RADII.xs },
  legend: { flexDirection: 'row', gap: SPACING.xs, marginTop: SPACING.xxs },
  legendItem: { flex: 1, gap: 2 },
  legendLabel: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 2 },
  bulk: { gap: SPACING.xs },
  bulkRow: { flexDirection: 'row', gap: SPACING.xs },
  bulkButton: { flex: 1 },
  searchIcon: { paddingLeft: SPACING.sm },
  searchInput: { paddingLeft: SPACING.xs }
});
