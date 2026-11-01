import {} from 'lucide-react-native';

import { Button, ButtonText } from '@/feature/common/components/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyIllustration,
  EmptyTitle
} from '@/feature/common/components/empty';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { exerciseCatalog } from '@/feature/exercise/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

type ConnectionRequiredProps = { hasDraft: boolean; onRetry: () => void };

export function ConnectionRequired({ hasDraft, onRetry }: ConnectionRequiredProps) {
  const t = useTranslations(exerciseCatalog);
  const tc = useTranslations(commonCatalog);

  return (
    <Empty>
      <EmptyIllustration name="offline" />
      <EmptyTitle>{t('connectionRequiredTitle')}</EmptyTitle>
      <EmptyDescription>
        {t(hasDraft ? 'connectionRequiredWithDraft' : 'connectionRequiredDescription')}
      </EmptyDescription>
      <EmptyContent>
        <Button variant="outline" onPress={onRetry}>
          <ButtonText>{tc('retry')}</ButtonText>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
