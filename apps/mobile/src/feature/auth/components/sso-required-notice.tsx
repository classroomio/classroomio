import { ShieldCheckIcon } from 'phosphor-react-native/src/icons/ShieldCheck';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/feature/common/components/icon';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { authCatalog } from '@/feature/auth/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

type SsoRequiredNoticeProps = { domain: string; providerName: string | null };

export function SsoRequiredNotice({ domain, providerName }: SsoRequiredNoticeProps) {
  const { colors } = useTheme();
  const t = useTranslations(authCatalog);

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.notice, { backgroundColor: colors.primaryTint, borderColor: colors.border }]}
    >
      <Icon icon={ShieldCheckIcon} size={18} tone="primary" />
      <View style={styles.copy}>
        <Text variant="captionStrong">{t('ssoRequiredTitle')}</Text>
        <Text variant="caption" tone="muted">
          {t('ssoRequiredDescription', { domain, provider: providerName || t('yourIdentityProvider') })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.md,
    borderCurve: 'continuous'
  },
  copy: { flex: 1, gap: 2 }
});
