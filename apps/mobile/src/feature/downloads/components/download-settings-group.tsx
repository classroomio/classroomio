import { ShieldCheckIcon } from 'phosphor-react-native/src/icons/ShieldCheck';
import { WifiHighIcon } from 'phosphor-react-native/src/icons/WifiHigh';

import { IconTile } from '@/feature/common/components/icon-tile';
import { useAuth } from '@/feature/auth/components/auth-provider';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle
} from '@/feature/common/components/item';
import { Switch } from '@/feature/common/components/switch';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { pumpDownloads } from '@/feature/downloads/helpers/download-manager';
import { updateDownloadSettings, useDownloadSettings } from '@/feature/downloads/helpers/download-settings';
import { resetAutoDownloadBaseline } from '@/feature/downloads/helpers/use-auto-download';
import { downloadsCatalog } from '@/feature/downloads/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';

export function DownloadSettingsGroup() {
  const t = useTranslations(downloadsCatalog);
  const { colors } = useTheme();
  const settings = useDownloadSettings();
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return (
    <ItemGroup>
      <Item>
        <ItemMedia>
          <IconTile icon={WifiHighIcon} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{t('wifiOnly')}</ItemTitle>
          <ItemDescription>{t('wifiOnlyDescription')}</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Switch
            accessibilityLabel={t('wifiOnly')}
            value={settings.wifiOnly}
            onValueChange={(wifiOnly) => {
              updateDownloadSettings({ wifiOnly });
              void pumpDownloads();
            }}
          />
        </ItemActions>
      </Item>
      <Item>
        <ItemMedia>
          <IconTile icon={ShieldCheckIcon} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{t('autoDownload')}</ItemTitle>
          <ItemDescription numberOfLines={3}>{t('autoDownloadDescription')}</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Switch
            accessibilityLabel={t('autoDownload')}
            value={settings.autoDownloadRequired}
            onValueChange={(autoDownloadRequired) => {
              if (autoDownloadRequired && userId && orgId) resetAutoDownloadBaseline(userId, orgId);
              updateDownloadSettings({ autoDownloadRequired });
            }}
          />
        </ItemActions>
      </Item>
    </ItemGroup>
  );
}
