import { StyleSheet, View } from 'react-native';

import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { formatPrice } from '@/feature/explore/helpers/format-price';
import { exploreCatalog } from '@/feature/explore/translations/catalog';
import type { ExploreCourse } from '@/feature/explore/types/explore';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

type ExploreCoursePriceProps = { course: Pick<ExploreCourse, 'price' | 'cost' | 'currency' | 'hasDiscount'> };

/** The price a paid course is listed at, with the undiscounted price struck through when a discount applies. */
export function ExploreCoursePrice({ course }: ExploreCoursePriceProps) {
  const t = useTranslations(exploreCatalog);
  const locale = useLocale();
  const price = formatPrice(course.price, course.currency, locale);
  const original = formatPrice(course.cost, course.currency, locale);

  return (
    <View style={styles.row}>
      <Text variant="heading">{price}</Text>
      {course.hasDiscount ? (
        <Text
          variant="caption"
          tone="muted"
          style={styles.struck}
          accessibilityLabel={t('originalPrice', { price: original })}
        >
          {original}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', gap: SPACING.xs },
  struck: { textDecorationLine: 'line-through' }
});
