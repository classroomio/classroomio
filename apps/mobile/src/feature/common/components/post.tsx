import { DotsThreeIcon } from 'phosphor-react-native/src/icons/DotsThree';
import { createContext, use, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { HIT_SLOP, RADII, SPACING } from '@/feature/common/constants/layout';
import { tapHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import { Avatar } from './avatar';
import { HtmlContent } from './html-content';
import { Icon, type AppIcon } from './icon';
import { PressableScale } from './pressable-scale';
import { Text } from './text';

type PostDensity = 'regular' | 'compact';

const PostContext = createContext<{ density: PostDensity }>({ density: 'regular' });

const AVATAR_SIZE: Record<PostDensity, number> = { regular: 36, compact: 28 };

type PostProps = {
  /** `card` sits on a surface with a hairline border; `plain` is flush with the screen. */
  variant?: 'card' | 'plain';
  density?: PostDensity;
  onPress?: PressableProps['onPress'];
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

export function Post({
  variant = 'card',
  density = 'regular',
  onPress,
  accessibilityLabel,
  style,
  children
}: PostProps) {
  const { colors, elevation } = useTheme();
  const surface =
    variant === 'card'
      ? [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, elevation.raised]
      : null;

  return (
    <PostContext value={{ density }}>
      {onPress ? (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          scaleTo={0.985}
          onPress={(event) => {
            tapHaptic();
            onPress(event);
          }}
          style={[styles.post, surface, style]}
        >
          {children}
        </PressableScale>
      ) : (
        <View accessibilityLabel={accessibilityLabel} style={[styles.post, surface, style]}>
          {children}
        </View>
      )}
    </PostContext>
  );
}

export function PostHeader({ children }: { children: ReactNode }) {
  return <View style={styles.header}>{children}</View>;
}

export function PostAvatar({ name, uri }: { name: string; uri?: string | null }) {
  const { density } = use(PostContext);

  return <Avatar name={name} uri={uri} size={AVATAR_SIZE[density]} />;
}

export function PostAuthor({ children }: { children: ReactNode }) {
  return <View style={styles.author}>{children}</View>;
}

export function PostAuthorName({ children }: { children: ReactNode }) {
  const { density } = use(PostContext);

  return (
    <Text variant={density === 'compact' ? 'captionStrong' : 'label'} numberOfLines={1}>
      {children}
    </Text>
  );
}

export function PostMeta({ children }: { children: ReactNode }) {
  return (
    <Text variant="caption" tone="muted" numberOfLines={1}>
      {children}
    </Text>
  );
}

export function PostHeaderAction({ children }: { children: ReactNode }) {
  return <View style={styles.headerAction}>{children}</View>;
}

export function PostTitle({ children, numberOfLines }: { children: ReactNode; numberOfLines?: number }) {
  const { density } = use(PostContext);

  return (
    <Text
      variant={density === 'compact' ? 'subheading' : 'heading'}
      accessibilityRole="header"
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
}

type PostBodyProps = { html: string | null | undefined; preserveLineBreaks?: boolean };

export function PostBody({ html, preserveLineBreaks }: PostBodyProps) {
  const { density } = use(PostContext);

  return (
    <HtmlContent
      html={html}
      size={density === 'compact' ? 'compact' : 'body'}
      preserveLineBreaks={preserveLineBreaks}
    />
  );
}

export function PostActions({ children }: { children: ReactNode }) {
  return <View style={styles.actions}>{children}</View>;
}

type PostActionProps = {
  icon?: AppIcon;
  active?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  children?: ReactNode;
};

export function PostAction({
  icon,
  active = false,
  disabled = false,
  onPress,
  accessibilityLabel,
  children
}: PostActionProps) {
  const { colors } = useTheme();
  const tone = active ? 'primary' : 'muted';
  const content = (
    <>
      {icon ? <Icon icon={icon} size={17} tone={tone} weight={active ? 'fill' : 'regular'} /> : null}
      {children !== undefined ? (
        <Text variant="captionStrong" tone={tone}>
          {children}
        </Text>
      ) : null}
    </>
  );

  if (!onPress) {
    return (
      <View accessibilityLabel={accessibilityLabel} style={styles.action}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active, disabled }}
      hitSlop={HIT_SLOP}
      disabled={disabled}
      onPress={() => {
        tapHaptic();
        onPress();
      }}
      style={({ pressed }) => [
        styles.action,
        styles.pressableAction,
        active && { backgroundColor: colors.primaryTint },
        pressed && !active && { backgroundColor: colors.muted },
        disabled && !active && styles.disabled
      ]}
    >
      {content}
    </Pressable>
  );
}

export function PostMenuButton({ onPress, accessibilityLabel }: { onPress: () => void; accessibilityLabel?: string }) {
  const t = useTranslations(commonCatalog);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? t('moreActions')}
      hitSlop={HIT_SLOP}
      onPress={onPress}
      style={styles.menu}
    >
      <Icon icon={DotsThreeIcon} size={18} tone="muted" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  post: { gap: SPACING.sm },
  card: {
    padding: SPACING.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.xl,
    borderCurve: 'continuous'
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  author: { flex: 1, minWidth: 0 },
  headerAction: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  actions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, flexWrap: 'wrap' },
  action: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xxs + 2, minHeight: 32 },
  pressableAction: { paddingHorizontal: SPACING.xs, borderRadius: RADII.input, borderCurve: 'continuous' },
  menu: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.45 }
});
