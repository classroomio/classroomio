import { ClockIcon } from 'phosphor-react-native/src/icons/Clock';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Card } from '@/feature/common/components/card';
import { Icon } from '@/feature/common/components/icon';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { DURATION, EASE_OUT } from '@/feature/common/constants/motion';
import { FONT_FAMILY } from '@/feature/common/constants/typography';
import { QR_COLORS } from '@/feature/check-in/constants/qr';
import { groupCheckInCode } from '@/feature/check-in/helpers/check-in-code';
import { countdownOf } from '@/feature/check-in/helpers/check-in-window';
import { useNow } from '@/feature/check-in/helpers/use-now';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { teachCatalog } from '@/feature/teach/translations/catalog';

const QR_SIZE = 208;
const QR_QUIET_ZONE = 12;

/** The card a tutor holds up or projects: QR code, readable code and time left. */
export function CheckInCodeCard({ children }: { children: ReactNode }) {
  return <Card style={styles.card}>{children}</Card>;
}

export function CheckInQr({ payload, label, dimmed = false }: { payload: string; label: string; dimmed?: boolean }) {
  return (
    <Animated.View
      key={payload}
      entering={FadeIn.duration(DURATION.base).easing(EASE_OUT)}
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={[styles.qr, dimmed && styles.dimmed]}
    >
      <QRCode
        value={payload}
        size={QR_SIZE}
        color={QR_COLORS.modules}
        backgroundColor={QR_COLORS.field}
        quietZone={QR_QUIET_ZONE}
        ecl="M"
      />
    </Animated.View>
  );
}

export function CheckInCodeText({ code, dimmed = false }: { code: string; dimmed?: boolean }) {
  const t = useTranslations(teachCatalog);

  return (
    <Text
      accessibilityLabel={t('codeA11y', { code: code.split('').join(' ') })}
      tone={dimmed ? 'subtle' : 'ink'}
      style={styles.code}
      adjustsFontSizeToFit
      numberOfLines={1}
    >
      {groupCheckInCode(code)}
    </Text>
  );
}

export function CheckInCountdown({ expiresAt }: { expiresAt: string }) {
  const t = useTranslations(teachCatalog);
  const now = useNow(1000);
  const countdown = countdownOf(expiresAt, now);

  return (
    <View style={styles.countdown} accessibilityLiveRegion="none">
      <Icon icon={ClockIcon} size={15} tone={countdown ? 'muted' : 'danger'} />
      <Text variant="captionStrong" tone={countdown ? 'muted' : 'danger'} style={styles.tabular}>
        {countdown ? t('expiresIn', { time: countdown.label }) : t('codeExpired')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.xl, paddingHorizontal: SPACING.lg },
  qr: {
    padding: SPACING.xxs,
    backgroundColor: QR_COLORS.field,
    borderRadius: RADII.lg,
    borderCurve: 'continuous',
    overflow: 'hidden'
  },
  dimmed: { opacity: 0.25 },
  code: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 46,
    lineHeight: 54,
    letterSpacing: 3,
    fontVariant: ['tabular-nums']
  },
  countdown: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xxs },
  tabular: { fontVariant: ['tabular-nums'] }
});
