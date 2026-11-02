import { BellIcon } from 'phosphor-react-native/src/icons/Bell';
import { DownloadSimpleIcon } from 'phosphor-react-native/src/icons/DownloadSimple';
import { HardDrivesIcon } from 'phosphor-react-native/src/icons/HardDrives';
import { InfoIcon } from 'phosphor-react-native/src/icons/Info';
import { router, Stack } from 'expo-router';

import { useAccountQuery } from '@/feature/account/api/account';
import { ChangePasswordItem } from '@/feature/account/components/change-password-item';
import { IconTile } from '@/feature/common/components/icon-tile';
import { BiometricLockSetting } from '@/feature/biometric/components/biometric-lock-setting';
import { Avatar } from '@/feature/common/components/avatar';
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
import { ScreenScrollView, ScreenSection, ScreenSectionHeader } from '@/feature/common/components/screen';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useDownloadedBytes } from '@/feature/downloads/helpers/download-store';
import { formatBytes } from '@/feature/downloads/helpers/format-bytes';
import { downloadsCatalog } from '@/feature/downloads/translations/catalog';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useServer } from '@/feature/server/components/server-provider';
import { LanguageSetting } from '@/feature/settings/components/language-setting';
import { SettingValue } from '@/feature/settings/components/setting-value';
import { ThemePreferencePicker } from '@/feature/settings/components/theme-preference-picker';
import { VideoQualitySetting } from '@/feature/settings/components/video-quality-setting';
import { installedAppVersion } from '@/feature/settings/helpers/app-version';
import { settingsCatalog } from '@/feature/settings/translations/catalog';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const account = useAccountQuery();
  const { serverUrl, isCustom } = useServer();
  const downloadedBytes = useDownloadedBytes();
  const locale = useLocale();
  const profile = account.data?.profile;
  const t = useTranslations(settingsCatalog);
  const td = useTranslations(downloadsCatalog);
  const name = profile?.fullname || t('notSet');

  return (
    <>
      <Stack.Screen options={{ headerLargeTitleEnabled: true }} />
      <ScreenScrollView>
        <ItemGroup>
          <Item
            onPress={() => router.push('/profile/edit-name')}
            accessibilityLabel={`${t('name')}, ${name}`}
            accessibilityHint={profile?.email ?? undefined}
          >
            <ItemMedia>
              <Avatar name={profile?.fullname || profile?.email || ''} uri={profile?.avatarUrl} size={48} />
            </ItemMedia>
            <ItemContent>
              <ItemTitle numberOfLines={1}>{name}</ItemTitle>
              <ItemDescription numberOfLines={1}>{profile?.email ?? ''}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <ItemChevron />
            </ItemActions>
          </Item>
          {profile?.email ? <ChangePasswordItem email={profile.email} /> : null}
        </ItemGroup>

        <ScreenSection>
          <ScreenSectionHeader title={t('appearance')} />
          <ItemGroup>
            <ThemePreferencePicker />
          </ItemGroup>
        </ScreenSection>

        <ScreenSection>
          <ScreenSectionHeader title={t('general')} />
          <ItemGroup>
            <LanguageSetting />
            <Item onPress={() => router.push('/notifications/preferences')}>
              <ItemMedia>
                <IconTile icon={BellIcon} />
              </ItemMedia>
              <ItemContent>
                <ItemTitle numberOfLines={1}>{t('notifications')}</ItemTitle>
                <ItemDescription numberOfLines={1}>{t('notificationsDescription')}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <ItemChevron />
              </ItemActions>
            </Item>
          </ItemGroup>
        </ScreenSection>

        <ScreenSection>
          <ScreenSectionHeader title={t('security')} />
          <ItemGroup>
            <BiometricLockSetting />
          </ItemGroup>
        </ScreenSection>

        <ScreenSection>
          <ScreenSectionHeader title={t('videoAndDownloads')} />
          <ItemGroup>
            <VideoQualitySetting />
            <Item onPress={() => router.push('/profile/downloads')}>
              <ItemMedia>
                <IconTile icon={DownloadSimpleIcon} />
              </ItemMedia>
              <ItemContent>
                <ItemTitle numberOfLines={1}>{t('downloads')}</ItemTitle>
              </ItemContent>
              <ItemActions>
                {downloadedBytes > 0 ? (
                  <SettingValue>{td('usedSize', { size: formatBytes(downloadedBytes, locale) })}</SettingValue>
                ) : null}
                <ItemChevron />
              </ItemActions>
            </Item>
          </ItemGroup>
        </ScreenSection>

        <ScreenSection>
          <ScreenSectionHeader title={t('about')} />
          <ItemGroup>
            <Item>
              <ItemMedia>
                <IconTile icon={InfoIcon} />
              </ItemMedia>
              <ItemContent>
                <ItemTitle numberOfLines={1}>{t('version')}</ItemTitle>
              </ItemContent>
              <ItemActions>
                <SettingValue>{installedAppVersion() ?? t('versionUnknown')}</SettingValue>
              </ItemActions>
            </Item>
            {isCustom ? (
              <Item>
                <ItemMedia>
                  <IconTile icon={HardDrivesIcon} />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle numberOfLines={1}>{t('server')}</ItemTitle>
                  <ItemDescription numberOfLines={1}>{new URL(serverUrl).host}</ItemDescription>
                  <ItemDescription>{t('serverDescription')}</ItemDescription>
                </ItemContent>
              </Item>
            ) : null}
          </ItemGroup>
        </ScreenSection>
      </ScreenScrollView>
    </>
  );
}
