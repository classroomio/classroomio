import { ArrowUpRight, PlayCircle } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { BrandMarkIcon } from '@/feature/brand/components/brand-mark-icon';
import { Icon } from '@/feature/common/components/icon';
import { Text } from '@/feature/common/components/text';
import { HIT_SLOP, SPACING } from '@/feature/common/constants/layout';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { EMBED_PROVIDERS } from '@/feature/lesson/constants/media-providers';
import { useOpenLink } from '@/feature/lesson/helpers/open-external';
import { lessonCatalog } from '@/feature/lesson/translations/catalog';
import type { EmbedProvider } from '@/feature/lesson/types/lesson';

type EmbedSourceProps = { provider: EmbedProvider; link: string };

export function EmbedSource({ provider, link }: EmbedSourceProps) {
  const t = useTranslations(lessonCatalog);
  const { openExternal } = useOpenLink();
  const brand = EMBED_PROVIDERS[provider];
  const openLabel = t('openIn', { name: brand.name });

  return (
    <View style={styles.row}>
      <View style={styles.source}>
        {brand.mark ? <BrandMarkIcon name={brand.mark} size={16} /> : <Icon icon={PlayCircle} size={16} tone="muted" />}
        <Text variant="caption" tone="muted">
          {brand.name}
        </Text>
      </View>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={openLabel}
        hitSlop={HIT_SLOP}
        onPress={() => openExternal(link)}
        style={styles.open}
      >
        <Text variant="captionStrong" tone="primary">
          {openLabel}
        </Text>
        <Icon icon={ArrowUpRight} size={15} tone="primary" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm },
  source: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  open: { flexDirection: 'row', alignItems: 'center', gap: 2 }
});
