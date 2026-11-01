import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { RADII } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';

import { Text } from './text';

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '';

  return `${first}${last}`.toUpperCase();
}

type AvatarProps = {
  name: string;
  uri?: string | null;
  size?: number;
  shape?: 'circle' | 'square';
};

export function Avatar({ name, uri, size = 40, shape = 'circle' }: AvatarProps) {
  const { colors } = useTheme();
  const radius = shape === 'circle' ? RADII.pill : RADII.md;
  const frame = { width: size, height: size, borderRadius: radius };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[frame, { backgroundColor: colors.sand }]}
        contentFit="cover"
        transition={120}
        accessibilityLabel={name}
      />
    );
  }

  return (
    <View accessibilityLabel={name} style={[styles.fallback, frame, { backgroundColor: colors.primaryTint }]}>
      <Text variant="captionStrong" tone="primary" style={{ fontSize: size * 0.36, lineHeight: size * 0.44 }}>
        {initialsOf(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center', borderCurve: 'continuous' }
});
