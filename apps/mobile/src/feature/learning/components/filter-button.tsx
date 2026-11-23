import { SlidersHorizontalIcon } from 'phosphor-react-native/src/icons/SlidersHorizontal';

import { HeaderIconButton } from '@/feature/common/components/header-icon-button';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { learningCatalog } from '@/feature/learning/translations/catalog';

/** The sliders button in the top bar that opens the filter sheet; its label says how many filters are on. */
export function FilterButton({ count, onPress }: { count: number; onPress: () => void }) {
  const t = useTranslations(learningCatalog);

  return (
    <HeaderIconButton
      icon={SlidersHorizontalIcon}
      accessibilityLabel={count > 0 ? t('filtersOn', { count }) : t('filters')}
      weight={count > 0 ? 'fill' : 'regular'}
      onPress={onPress}
    />
  );
}
