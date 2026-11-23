import type { Ref } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Sheet,
  SheetClose,
  SheetHeader,
  SheetHeading,
  SheetTitle,
  useSheetDismiss,
  type SheetRef
} from '@/feature/common/components/bottom-sheet';
import { Button, ButtonText } from '@/feature/common/components/button';
import { SegmentedControl, SegmentedControlItem } from '@/feature/common/components/segmented-control';
import { Text } from '@/feature/common/components/text';
import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { learningCatalog } from '@/feature/learning/translations/catalog';
import type { ContentTypeFilter, DurationFilter, LevelFilter, StatusFilter } from '@/feature/learning/types/learning';

export type FilterValues = {
  status?: StatusFilter;
  type?: ContentTypeFilter;
  level: LevelFilter;
  duration: DurationFilter;
};

type FilterSheetProps = {
  ref: Ref<SheetRef>;
  value: FilterValues;
  onChange: (value: FilterValues) => void;
};

/** Bottom sheet for narrowing a list by status or content type, difficulty and duration. Changes apply at once. */
export function FilterSheet({ ref, value, onChange }: FilterSheetProps) {
  return (
    <Sheet ref={ref}>
      <FilterSheetBody value={value} onChange={onChange} />
    </Sheet>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text variant="captionStrong" tone="muted">
        {label}
      </Text>
      {children}
    </View>
  );
}

function FilterSheetBody({ value, onChange }: Omit<FilterSheetProps, 'ref'>) {
  const t = useTranslations(learningCatalog);
  const close = useSheetDismiss();

  return (
    <>
      <SheetHeader>
        <SheetHeading>
          <SheetTitle>{t('filters')}</SheetTitle>
        </SheetHeading>
        <SheetClose />
      </SheetHeader>
      <View style={styles.body}>
        {value.type ? (
          <FilterGroup label={t('filterType')}>
            <SegmentedControl value={value.type} onValueChange={(type) => onChange({ ...value, type })}>
              <SegmentedControlItem value="all">{t('all')}</SegmentedControlItem>
              <SegmentedControlItem value="paths">{t('typePaths')}</SegmentedControlItem>
              <SegmentedControlItem value="courses">{t('typeCourses')}</SegmentedControlItem>
            </SegmentedControl>
          </FilterGroup>
        ) : null}
        {value.status ? (
          <FilterGroup label={t('filterStatus')}>
            <SegmentedControl value={value.status} onValueChange={(status) => onChange({ ...value, status })}>
              <SegmentedControlItem value="all">{t('all')}</SegmentedControlItem>
              <SegmentedControlItem value="in-progress">{t('inProgress')}</SegmentedControlItem>
              <SegmentedControlItem value="not-started">{t('notStarted')}</SegmentedControlItem>
            </SegmentedControl>
          </FilterGroup>
        ) : null}
        <FilterGroup label={t('filterDifficulty')}>
          <SegmentedControl value={value.level} onValueChange={(level) => onChange({ ...value, level })}>
            <SegmentedControlItem value="all">{t('all')}</SegmentedControlItem>
            <SegmentedControlItem value="beginner">{t('levelBeginner')}</SegmentedControlItem>
            <SegmentedControlItem value="intermediate">{t('levelIntermediate')}</SegmentedControlItem>
            <SegmentedControlItem value="advanced">{t('levelAdvanced')}</SegmentedControlItem>
          </SegmentedControl>
        </FilterGroup>
        <FilterGroup label={t('filterDuration')}>
          <SegmentedControl value={value.duration} onValueChange={(duration) => onChange({ ...value, duration })}>
            <SegmentedControlItem value="all">{t('all')}</SegmentedControlItem>
            <SegmentedControlItem value="short">{t('durationShort')}</SegmentedControlItem>
            <SegmentedControlItem value="medium">{t('durationMedium')}</SegmentedControlItem>
            <SegmentedControlItem value="long">{t('durationLong')}</SegmentedControlItem>
          </SegmentedControl>
        </FilterGroup>
        <View style={styles.actions}>
          <Button
            variant="outline"
            style={styles.action}
            onPress={() =>
              onChange({
                ...value,
                level: 'all',
                duration: 'all',
                ...(value.status ? { status: 'all' as const } : {}),
                ...(value.type ? { type: 'all' as const } : {})
              })
            }
          >
            <ButtonText>{t('resetFilters')}</ButtonText>
          </Button>
          <Button style={styles.action} onPress={close}>
            <ButtonText>{t('done')}</ButtonText>
          </Button>
        </View>
      </View>
    </>
  );
}

/** How many filters differ from their defaults. */
export function activeFilterCount(value: FilterValues) {
  return [
    value.status && value.status !== 'all',
    value.type && value.type !== 'all',
    value.level !== 'all',
    value.duration !== 'all'
  ].filter(Boolean).length;
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: GUTTER, paddingTop: SPACING.xs, gap: SPACING.lg },
  group: { gap: SPACING.xs },
  actions: { flexDirection: 'row', gap: SPACING.sm, paddingTop: SPACING.xs },
  action: { flex: 1 }
});
