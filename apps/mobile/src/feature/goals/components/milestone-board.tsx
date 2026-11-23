import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Polygon, Stop } from 'react-native-svg';

import { Card } from '@/feature/common/components/card';
import { Progress } from '@/feature/common/components/progress';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { FONT_FAMILY } from '@/feature/common/constants/typography';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { FLAME } from '@/feature/goals/constants/flame';
import { goalsCatalog } from '@/feature/goals/translations/catalog';
import type { StreakMilestone } from '@/feature/goals/types/goals';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

type MedalState = 'earned' | 'next' | 'locked';

const HEXAGON = '50,6 89,28 89,72 50,94 11,72 11,28';

type MilestoneBoardProps = { milestones: StreakMilestone[]; current: number };

/** The next streak milestone with progress toward it, then every milestone as a medal, earned ones in colour. */
export function MilestoneBoard({ milestones, current }: MilestoneBoardProps) {
  const t = useTranslations(goalsCatalog);
  const format = useFormatters();
  const next = milestones.find((milestone) => !milestone.achieved) ?? null;
  const stateOf = (milestone: StreakMilestone): MedalState =>
    milestone.achieved ? 'earned' : milestone === next ? 'next' : 'locked';

  return (
    <Card style={styles.card}>
      {next ? (
        <View style={styles.next}>
          <Medal days={next.days} state="next" size={60} />
          <View style={styles.nextCopy}>
            <Text variant="caption" tone="muted">
              {t('nextMilestoneTitle')}
            </Text>
            <Text variant="heading">{t('milestoneName', { count: next.days })}</Text>
            <Progress value={(Math.min(current, next.days) / next.days) * 100} />
            <Text variant="micro" tone="muted">
              {t('milestoneProgress', { current: format.number(Math.min(current, next.days)), count: next.days })}
            </Text>
          </View>
        </View>
      ) : (
        <Text variant="bodyStrong" tone="success" style={styles.allEarned}>
          {t('allMilestonesEarned')}
        </Text>
      )}

      <View style={styles.grid} accessibilityRole="list">
        {milestones.map((milestone) => {
          const state = stateOf(milestone);
          const status = milestone.achieved
            ? t('milestoneAchieved')
            : t('milestoneRemaining', { count: milestone.daysRemaining });

          return (
            <View
              key={milestone.days}
              style={styles.cell}
              accessible
              accessibilityLabel={`${t('milestoneName', { count: milestone.days })}, ${status}`}
            >
              <Medal days={milestone.days} state={state} size={52} />
              <Text variant="micro" tone={state === 'locked' ? 'subtle' : 'ink'} style={styles.cellText}>
                {t('milestoneName', { count: milestone.days })}
              </Text>
              <Text variant="micro" tone={state === 'earned' ? 'success' : 'subtle'} style={styles.cellText}>
                {status}
              </Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

type MedalProps = { days: number; state: MedalState; size: number };

function Medal({ days, state, size }: MedalProps) {
  const { colors } = useTheme();
  const format = useFormatters();
  const fill = state === 'earned' ? 'url(#medal-earned)' : state === 'next' ? colors.surface : colors.muted;
  const stroke = state === 'earned' ? FLAME.base : state === 'next' ? colors.primary : colors.border;
  const numberColor = state === 'earned' ? colors.onSolid : state === 'next' ? colors.ink : colors.inkSubtle;

  return (
    <View style={[styles.medal, { width: size, height: size }]} importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="medal-earned" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={FLAME.tip} />
            <Stop offset="1" stopColor={FLAME.base} />
          </LinearGradient>
        </Defs>
        <Polygon
          points={HEXAGON}
          fill={fill}
          stroke={stroke}
          strokeWidth={state === 'next' ? 6 : 4}
          strokeLinejoin="round"
        />
      </Svg>
      <Text style={[styles.medalNumber, { color: numberColor, fontSize: size * 0.36, lineHeight: size * 0.42 }]}>
        {format.number(days)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: SPACING.lg, padding: SPACING.md },
  next: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  nextCopy: { flex: 1, gap: SPACING.xxs },
  allEarned: { textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: SPACING.md },
  cell: { width: '33.333%', alignItems: 'center', gap: 2 },
  cellText: { textAlign: 'center' },
  medal: { alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xxs },
  medalNumber: { fontFamily: FONT_FAMILY.extrabold, fontVariant: ['tabular-nums'], letterSpacing: -0.5 }
});
