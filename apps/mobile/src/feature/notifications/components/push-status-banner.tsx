import { BellOff } from 'lucide-react-native';

import {
  Banner,
  BannerChevron,
  BannerContent,
  BannerDescription,
  BannerIcon,
  BannerTitle
} from '@/feature/common/components/banner';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { requestPushPermission, usePushPermission } from '@/feature/notifications/helpers/push-permission-store';
import { notificationsCatalog } from '@/feature/notifications/translations/catalog';

/** Explains that push is off on this device and turns it on, or opens Settings once the system no longer asks. */
export function PushStatusBanner({ pushAvailable }: { pushAvailable: boolean }) {
  const t = useTranslations(notificationsCatalog);
  const permission = usePushPermission();
  if (!pushAvailable || permission === 'granted' || permission === 'unavailable') return null;

  const denied = permission === 'denied';

  return (
    <Banner
      tone="neutral"
      accessibilityHint={denied ? t('pushOffDeniedHint') : t('pushOffHint')}
      onPress={() => void requestPushPermission()}
    >
      <BannerIcon icon={BellOff} />
      <BannerContent>
        <BannerTitle>{t('pushOffTitle')}</BannerTitle>
        <BannerDescription>{denied ? t('pushOffDeniedDescription') : t('pushOffDescription')}</BannerDescription>
      </BannerContent>
      <BannerChevron />
    </Banner>
  );
}
