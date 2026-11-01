import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/feature/common/components/avatar';
import { Icon } from '@/feature/common/components/icon';
import { IconTile } from '@/feature/common/components/icon-tile';
import { RADII } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import type { NotificationCategoryDisplay } from '@/feature/notifications/constants/notifications';
import type { NotificationItem } from '@/feature/notifications/types/notifications';

const BADGE_RATIO = 0.48;

type NotificationMediaProps = {
  item: Pick<NotificationItem, 'id' | 'actorName' | 'actorAvatarUrl' | 'courseImage' | 'courseTitle'>;
  display: Pick<NotificationCategoryDisplay, 'icon' | 'tone'>;
  size: number;
};

/**
 * Who or what a notification is about: the person who acted, else the course artwork, else the category icon.
 * Over a person or course, a small badge carries the category icon.
 */
export function NotificationMedia({ item, display, size }: NotificationMediaProps) {
  const { colors } = useTheme();
  const badge = Math.round(size * BADGE_RATIO);
  const badgeColors = {
    neutral: { background: colors.mutedStrong, glyph: colors.ink },
    primary: { background: colors.primary, glyph: colors.onPrimary },
    success: { background: colors.success, glyph: colors.onSolid },
    warning: { background: colors.warning, glyph: colors.onSolid },
    danger: { background: colors.danger, glyph: colors.onSolid }
  }[display.tone];

  let media;
  if (item.actorName) {
    media = <Avatar name={item.actorName} uri={item.actorAvatarUrl} size={size} />;
  } else if (item.courseImage) {
    media = (
      <Image
        source={{ uri: item.courseImage }}
        recyclingKey={item.id}
        contentFit="cover"
        transition={120}
        accessibilityIgnoresInvertColors
        style={[
          styles.artwork,
          { width: size, height: size, backgroundColor: colors.muted, borderColor: colors.border }
        ]}
      />
    );
  } else {
    return <IconTile icon={display.icon} tone={display.tone} size={size} />;
  }

  return (
    <View style={{ width: size, height: size }}>
      {media}
      <View
        style={[
          styles.badge,
          { width: badge, height: badge, borderRadius: badge / 2, right: -badge / 4, bottom: -badge / 4 },
          { backgroundColor: badgeColors.background, borderColor: colors.surface }
        ]}
      >
        <Icon icon={display.icon} size={Math.round(badge * 0.58)} color={badgeColors.glyph} weight="fill" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  artwork: { borderRadius: RADII.md, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth },
  badge: { position: 'absolute', alignItems: 'center', justifyContent: 'center', borderWidth: 2 }
});
