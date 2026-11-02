import { BookOpenIcon } from 'phosphor-react-native/src/icons/BookOpen';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/feature/common/components/icon';
import { RADII } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';

type CourseThumbnailProps = {
  uri?: string | null;
  /** Width in points; the height follows `aspectRatio`. */
  size?: number;
  aspectRatio?: number;
  recyclingKey?: string;
};

export function CourseThumbnail({ uri, size = 52, aspectRatio = 1, recyclingKey }: CourseThumbnailProps) {
  const { colors } = useTheme();
  const height = Math.round(size / aspectRatio);
  const frame = {
    width: size,
    height,
    borderRadius: aspectRatio === 1 ? RADII.md : RADII.lg,
    backgroundColor: colors.muted,
    borderColor: colors.border
  };

  if (!uri) {
    return (
      <View style={[styles.frame, styles.placeholder, frame]}>
        <Icon icon={BookOpenIcon} size={Math.min(size, height) * 0.4} tone="subtle" />
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
  frame: { borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth },
  placeholder: { alignItems: 'center', justifyContent: 'center' }
});
