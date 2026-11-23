import { FlameIcon } from 'phosphor-react-native/src/icons/Flame';
import { MoonIcon } from 'phosphor-react-native/src/icons/Moon';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/feature/common/components/icon';
import { Text, type TextTone } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { FONT_FAMILY } from '@/feature/common/constants/typography';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { FLAME } from '@/feature/goals/constants/flame';
import { goalsCatalog } from '@/feature/goals/translations/catalog';
import type { GoalsSummary, StreakDay } from '@/feature/goals/types/goals';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import { StreakFlame, type FlameState } from './streak-flame';

const DAY = 36;

const STATUS_TONE: Record<FlameState, TextTone> = { lit: 'success', waiting: 'warning', out: 'muted' };
const TRACK = 4;

function dayDate(day: StreakDay) {
  return new Date(`${day.date}T12:00:00`);
}

function flameState(streak: GoalsSummary['streak']): FlameState {
  if (streak.activeToday) return 'lit';

  return streak.current > 0 ? 'waiting' : 'out';
}

/** The current streak as a flame and a large count, the last seven days as a chain, and the best streak. */
export function StreakHero({ streak }: { streak: GoalsSummary['streak'] }) {
  const t = useTranslations(goalsCatalog);
  const format = useFormatters();
  const { colors } = useTheme();
  const state = flameState(streak);
  const status =
    state === 'lit' ? t('activeToday') : state === 'waiting' ? t('notActiveToday') : t('noStreakDescription');

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View
        style={styles.summary}
        accessible
        accessibilityRole="summary"
        accessibilityLabel={`${streak.current > 0 ? t('streakDays', { count: streak.current }) : t('noStreak')}. ${status}`}
      >
        <StreakFlame state={state} size={72} />
        <Text style={[styles.count, { color: state === 'out' ? colors.inkSubtle : colors.ink }]}>
          {format.number(streak.current)}
        </Text>
        <Text variant="subheading" tone="muted">
          {t('streakUnit', { count: streak.current })}
        </Text>
        <Text variant="caption" tone={STATUS_TONE[state]} style={styles.status}>
          {status}
        </Text>
      </View>

      <WeekChain days={streak.days} />

      <Text variant="caption" tone="muted" style={styles.footnote}>
        {[streak.best > 0 ? t('bestStreak', { count: streak.best }) : null, t('weekendNote')]
          .filter(Boolean)
          .join(' · ')}
      </Text>
    </View>
  );
}

function WeekChain({ days }: { days: StreakDay[] }) {
  const t = useTranslations(goalsCatalog);
  const locale = useLocale();
  const { colors } = useTheme();
  const narrow = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
  const long = new Intl.DateTimeFormat(locale, { weekday: 'long' });
  const todayIndex = days.length - 1;

  return (
    <View style={styles.chain} accessibilityRole="list">
      <View style={styles.track}>
        {days.slice(1).map((day, index) => {
          const joined = days[index]!.active && day.active;

          return (
            <View
              key={day.date}
              style={[styles.segment, { backgroundColor: joined ? FLAME.body : colors.mutedStrong }]}
            />
          );
        })}
      </View>
      {days.map((day, index) => {
        const today = index === todayIndex;
        const name = long.format(dayDate(day));

        return (
          <View
            key={day.date}
            style={styles.day}
            accessible
            accessibilityLabel={day.active ? t('dayActive', { day: name }) : t('dayInactive', { day: name })}
          >
            <View
              style={[
                styles.node,
                day.active
                  ? { backgroundColor: FLAME.body }
                  : {
                      backgroundColor: colors.surface,
                      borderColor: today ? colors.ink : colors.borderStrong,
                      borderWidth: today ? 2 : 1.5,
                      borderStyle: day.isWeekend && !today ? 'dashed' : 'solid'
                    }
              ]}
            >
              {day.active ? (
                <Icon icon={FlameIcon} size={18} color={colors.onSolid} weight="fill" />
              ) : day.isWeekend ? (
                <Icon icon={MoonIcon} size={14} tone="subtle" />
              ) : null}
            </View>
            <Text variant="micro" tone={today ? 'ink' : 'subtle'} style={today && styles.todayLabel}>
              {narrow.format(dayDate(day))}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: RADII.xl,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
    gap: SPACING.lg
  },
  summary: { alignItems: 'center' },
  count: {
    fontFamily: FONT_FAMILY.extrabold,
    fontSize: 64,
    lineHeight: 68,
    letterSpacing: -2.5,
    fontVariant: ['tabular-nums'],
    marginTop: SPACING.xxs
  },
  status: { textAlign: 'center', marginTop: SPACING.xs, maxWidth: 280 },
  chain: { flexDirection: 'row', justifyContent: 'space-between' },
  track: {
    position: 'absolute',
    left: DAY / 2,
    right: DAY / 2,
    top: (DAY - TRACK) / 2,
    height: TRACK,
    flexDirection: 'row'
  },
  segment: { flex: 1, height: TRACK },
  day: { alignItems: 'center', gap: SPACING.xxs },
  node: { width: DAY, height: DAY, borderRadius: DAY / 2, alignItems: 'center', justifyContent: 'center' },
  todayLabel: { fontFamily: FONT_FAMILY.semibold },
  footnote: { textAlign: 'center' }
});
