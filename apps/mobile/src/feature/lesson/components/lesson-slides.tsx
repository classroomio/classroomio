import { ArrowsOutIcon } from 'phosphor-react-native/src/icons/ArrowsOut';
import { StyleSheet, View } from 'react-native';

import { BrandMarkIcon } from '@/feature/brand/components/brand-mark-icon';
import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { SPACING } from '@/feature/common/constants/layout';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { SLIDE_PLATFORMS } from '@/feature/lesson/constants/media-providers';
import { useOpenLink } from '@/feature/lesson/helpers/open-external';
import { lessonCatalog } from '@/feature/lesson/translations/catalog';
import type { SlideDeck } from '@/feature/lesson/types/lesson';

import { EmbedFrame } from './embed-frame';

function OpenDeckButton({ deck }: { deck: SlideDeck }) {
  const t = useTranslations(lessonCatalog);
  const { openExternal } = useOpenLink();
  const brand = deck.platform ? SLIDE_PLATFORMS[deck.platform] : null;

  return (
    <Button size="sm" variant="ghost" onPress={() => openExternal(deck.src)} style={styles.open}>
      {brand?.mark ? <BrandMarkIcon name={brand.mark} size={16} /> : <ButtonIcon icon={ArrowsOutIcon} />}
      <ButtonText>{brand ? t('openIn', { name: brand.name }) : t('openFullScreen')}</ButtonText>
    </Button>
  );
}

export function LessonSlides({ decks }: { decks: SlideDeck[] }) {
  const t = useTranslations(lessonCatalog);

  return (
    <View style={styles.list}>
      {decks.map((deck, index) => (
        <View key={deck.id} style={styles.deck}>
          <EmbedFrame
            uri={deck.src}
            title={decks.length > 1 ? t('slidesNumbered', { number: index + 1 }) : t('slides')}
            aspectRatio={16 / 10}
          />
          <OpenDeckButton deck={deck} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: SPACING.lg },
  deck: { gap: SPACING.xxs },
  open: { alignSelf: 'flex-start' }
});
