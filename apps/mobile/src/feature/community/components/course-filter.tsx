import { CaretDownIcon } from 'phosphor-react-native/src/icons/CaretDown';
import { FunnelSimpleIcon } from 'phosphor-react-native/src/icons/FunnelSimple';
import { createContext, use, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Icon } from '@/feature/common/components/icon';
import {
  OptionSheet,
  OptionSheetCancel,
  OptionSheetContent,
  OptionSheetItem,
  OptionSheetSeparator,
  OptionSheetTitle
} from '@/feature/common/components/option-sheet';
import { Text } from '@/feature/common/components/text';
import { HIT_SLOP, SPACING } from '@/feature/common/constants/layout';
import { selectionHaptic } from '@/feature/common/helpers/haptics';
import { communityCatalog } from '@/feature/community/translations/catalog';
import type { CourseOption } from '@/feature/community/types/community';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

type CourseFilterContextValue = {
  courseId: string | null;
  onCourseChange: (courseId: string | null) => void;
  courses: CourseOption[];
  open: boolean;
  setOpen: (open: boolean) => void;
};

const CourseFilterContext = createContext<CourseFilterContextValue | null>(null);

function useCourseFilter() {
  const context = use(CourseFilterContext);
  if (!context) throw new Error('CourseFilter parts must be used inside CourseFilter');

  return context;
}

type CourseFilterProps = {
  courseId: string | null;
  onCourseChange: (courseId: string | null) => void;
  courses: CourseOption[];
  children: ReactNode;
};

export function CourseFilter({ courseId, onCourseChange, courses, children }: CourseFilterProps) {
  const [open, setOpen] = useState(false);

  return (
    <CourseFilterContext value={{ courseId, onCourseChange, courses, open, setOpen }}>{children}</CourseFilterContext>
  );
}

export function CourseFilterTrigger() {
  const { courseId, courses, setOpen } = useCourseFilter();
  const t = useTranslations(communityCatalog);
  const selected = courses.find((course) => course.id === courseId);
  const label = selected?.title ?? t('allCourses');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('courseFilterLabel', { course: label })}
      hitSlop={HIT_SLOP}
      onPress={() => {
        selectionHaptic();
        setOpen(true);
      }}
      style={styles.trigger}
    >
      <Icon icon={FunnelSimpleIcon} size={17} tone={selected ? 'primary' : 'muted'} />
      <Text variant="captionStrong" tone={selected ? 'primary' : 'body'} numberOfLines={1} style={styles.label}>
        {label}
      </Text>
      <Icon icon={CaretDownIcon} size={16} tone="muted" />
    </Pressable>
  );
}

export function CourseFilterSheet() {
  const { courseId, onCourseChange, courses, open, setOpen } = useCourseFilter();
  const t = useTranslations(communityCatalog);

  return (
    <OptionSheet open={open} onOpenChange={setOpen}>
      <OptionSheetContent>
        <OptionSheetTitle>{t('courseFilterTitle')}</OptionSheetTitle>
        <OptionSheetItem selected={courseId === null} onSelect={() => onCourseChange(null)}>
          {t('allCourses')}
        </OptionSheetItem>
        {courses.length > 0 ? <OptionSheetSeparator /> : null}
        {courses.map((course) => (
          <OptionSheetItem key={course.id} selected={course.id === courseId} onSelect={() => onCourseChange(course.id)}>
            {course.title}
          </OptionSheetItem>
        ))}
        <OptionSheetCancel />
      </OptionSheetContent>
    </OptionSheet>
  );
}

const styles = StyleSheet.create({
  trigger: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs - 2, minHeight: 32, flexShrink: 1 },
  label: { flexShrink: 1 }
});
