import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';

const DOT = 6;

type PagedCarouselProps<Item> = {
  items: Item[];
  itemWidth: number;
  keyOf: (item: Item) => string;
  renderItem: (item: Item) => ReactNode;
  gap?: number;
};

/** A horizontal row that snaps item by item, bleeding to the screen edges, with a dot per item under it. */
export function PagedCarousel<Item>({
  items,
  itemWidth,
  keyOf,
  renderItem,
  gap = SPACING.sm
}: PagedCarouselProps<Item>) {
  const { colors } = useTheme();
  const [index, setIndex] = useState(0);
  const interval = itemWidth + gap;

  const onSettle = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const atEnd = contentOffset.x + layoutMeasurement.width >= contentSize.width - SPACING.xs;
    setIndex(atEnd ? items.length - 1 : Math.max(0, Math.round(contentOffset.x / interval)));
  };

  return (
    <View style={styles.root}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={interval}
        snapToAlignment="start"
        decelerationRate="fast"
        onMomentumScrollEnd={onSettle}
        style={styles.bleed}
        contentContainerStyle={[styles.content, { gap }]}
      >
        {items.map((item) => (
          <View key={keyOf(item)} style={{ width: itemWidth }}>
            {renderItem(item)}
          </View>
        ))}
      </ScrollView>
      {items.length > 1 ? (
        <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {items.map((item, dotIndex) => (
            <View
              key={keyOf(item)}
              style={[styles.dot, { backgroundColor: dotIndex === index ? colors.primary : colors.mutedStrong }]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: SPACING.sm },
  bleed: { marginHorizontal: -GUTTER },
  content: { paddingHorizontal: GUTTER, paddingVertical: SPACING.xxs },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.xs },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2 }
});
