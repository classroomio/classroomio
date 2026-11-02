import { BellSlashIcon } from 'phosphor-react-native/src/icons/BellSlash';

import {
  Item,
  ItemActions,
  ItemChevron,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle
} from '@/feature/common/components/item';
import { IconTile } from '@/feature/common/components/icon-tile';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { requestPushPermission, usePushPermission } from '@/feature/notifications/helpers/push-permission-store';
import { notificationsCatalog } from '@/feature/notifications/translations/catalog';

/** Explains that push is off on this device and turns it on, or opens Settings once the system no longer asks. */
export function PushStatusBanner({ pushAvailable }: { pushAvailable: boolean }) {
  const t = useTranslations(notificationsCatalog);
  const { colors } = useTheme();
  const permission = usePushPermission();
  if (!pushAvailable || permission === 'granted' || permission === 'unavailable') return null;

  const denied = permission === 'denied';

  return (
    <ItemGroup>
      <Item
        accessibilityHint={denied ? t('pushOffDeniedHint') : t('pushOffHint')}
        onPress={() => void requestPushPermission()}
      >
        <ItemMedia>
          <IconTile icon={BellSlashIcon} tone="danger" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle numberOfLines={1}>{t('pushOffTitle')}</ItemTitle>
          <ItemDescription numberOfLines={3}>
            {denied ? t('pushOffDeniedDescription') : t('pushOffDescription')}
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <ItemChevron />
        </ItemActions>
      </Item>
    </ItemGroup>
  );
}
