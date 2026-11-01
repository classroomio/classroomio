import { ExportIcon } from 'phosphor-react-native/src/icons/Export';
import { FileTextIcon } from 'phosphor-react-native/src/icons/FileText';
import type { File } from 'expo-file-system';
import { Pressable, StyleSheet } from 'react-native';

import { Icon } from '@/feature/common/components/icon';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle
} from '@/feature/common/components/item';
import { Spinner } from '@/feature/common/components/spinner';
import { HIT_SLOP } from '@/feature/common/constants/layout';
import { formatBytes } from '@/feature/downloads/helpers/format-bytes';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useOpenDocument } from '@/feature/lesson/helpers/open-document';
import { lessonCatalog } from '@/feature/lesson/translations/catalog';
import type { LessonDocument } from '@/feature/lesson/types/lesson';

function kindLabel(document: LessonDocument, fallback: string) {
  const extension = document.name.split('.').pop();
  if (extension && extension !== document.name && extension.length <= 5) return extension.toUpperCase();

  return document.type?.split('/').pop()?.toUpperCase() ?? fallback;
}

type LessonDocumentsProps = { documents: LessonDocument[]; localFiles?: ReadonlyMap<string, File> };

export function LessonDocuments({ documents, localFiles }: LessonDocumentsProps) {
  const t = useTranslations(lessonCatalog);
  const locale = useLocale();
  const { open, share, openingKey } = useOpenDocument(localFiles);

  return (
    <ItemGroup>
      {documents.map((document) => {
        const key = document.key || document.link;
        const opening = openingKey === key;
        const detail = [kindLabel(document, t('fileKind')), document.size ? formatBytes(document.size, locale) : null]
          .filter(Boolean)
          .join(' · ');

        return (
          <Item
            key={key}
            onPress={() => open(document)}
            accessibilityLabel={`${document.name}, ${detail}`}
            accessibilityHint={t('opensDocument')}
          >
            <ItemMedia variant="tile">
              <Icon icon={FileTextIcon} size={19} tone="ink" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle numberOfLines={1}>{document.name}</ItemTitle>
              <ItemDescription numberOfLines={1}>{detail}</ItemDescription>
            </ItemContent>
            <ItemActions>
              {opening ? (
                <Spinner />
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('shareDocument', { name: document.name })}
                  hitSlop={HIT_SLOP}
                  onPress={() => share(document)}
                  style={styles.share}
                >
                  <Icon icon={ExportIcon} size={18} tone="muted" />
                </Pressable>
              )}
            </ItemActions>
          </Item>
        );
      })}
    </ItemGroup>
  );
}

const styles = StyleSheet.create({
  share: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }
});
