import { WifiSlashIcon } from 'phosphor-react-native/src/icons/WifiSlash';

import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import { Banner, BannerContent, BannerDescription, BannerIcon, BannerTitle } from './banner';

export function OfflineNotice({ title, description }: { title?: string; description?: string }) {
  const t = useTranslations(commonCatalog);

  return (
    <Banner tone="neutral">
      <BannerIcon icon={WifiSlashIcon} />
      <BannerContent>
        <BannerTitle>{title ?? t('offlineTitle')}</BannerTitle>
        <BannerDescription>{description ?? t('offlineDescription')}</BannerDescription>
      </BannerContent>
    </Banner>
  );
}
