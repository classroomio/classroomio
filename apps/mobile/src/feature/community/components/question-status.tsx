import { StyleSheet, View } from 'react-native';

import { Icon, type AppIcon } from '@/feature/common/components/icon';
import { Text, type TextTone } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';

type QuestionStatusProps = { icon: AppIcon; tone: TextTone; children: string };

/** A short state such as "Accepted answer" or "Hidden from learners", set as an icon and plain text. */
export function QuestionStatus({ icon, tone, children }: QuestionStatusProps) {
  return (
    <View style={styles.status}>
      <Icon icon={icon} size={15} tone={tone} weight="fill" />
      <Text variant="captionStrong" tone={tone} numberOfLines={1} style={styles.label}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  status: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xxs + 2, minWidth: 0 },
  label: { flexShrink: 1 }
});
