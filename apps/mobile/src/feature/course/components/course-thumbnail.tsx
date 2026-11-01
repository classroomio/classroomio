import { BookOpenIcon } from 'phosphor-react-native/src/icons/BookOpen';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/feature/common/components/icon';
import { RADII } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';

type CourseThumbnailProps = { uri?: string | null; size?: number; recyclingKey?: string };

export function CourseThumbnail({ uri, size = 52, recyclingKey }: CourseThumbnailProps) {
  const { colors } = useTheme();
  const frame = { width: size, height: size, backgroundColor: colors.muted, borderColor: colors.border };

  if (!uri) {
    return (
      <View style={[styles.frame, styles.placeholder, frame]}>
        <Icon icon={BookOpenIcon} size={size * 0.4} tone="muted" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      recyclingKey={recyclingKey}
      contentFit="cover"
      transition={120}
      style={[styles.frame, frame]}
      accessibilityIgnoresInvertColors
    />
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: RADII.md, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth * 2 },
  placeholder: { alignItems: 'center', justifyContent: 'center' }
});
