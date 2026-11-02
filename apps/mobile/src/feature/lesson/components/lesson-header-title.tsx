import { StyleSheet, View } from 'react-native';

import { Text } from '@/feature/common/components/text';

export function LessonHeaderTitle({ position, title }: { position: string | null; title: string }) {
  return (
    <View
      style={styles.title}
      accessible
      accessibilityRole="header"
      accessibilityLabel={[title, position].filter(Boolean).join(', ')}
    >
      {position ? (
        <Text variant="micro" tone="muted" numberOfLines={1}>
          {position}
        </Text>
      ) : null}
      <Text variant="subheading" numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { alignItems: 'center', maxWidth: 240 }
});
