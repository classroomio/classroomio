import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const da: TranslatedMessages<typeof en> = {
  account: 'Konto',
  name: 'Navn',
  notSet: 'Ikke angivet',
  email: 'E-mail',
  notifications: 'Notifikationer',
  notificationsDescription: 'Push, i appen, e-mail og stille timer',
  security: 'Sikkerhed',
  theme: 'Tema',
  themeSystem: 'System',
  themeLight: 'Lyst',
  themeDark: 'Mørkt',
  language: 'Sprog',
  languageSystem: 'System',
  languageSystemDescription: 'Følger enhedens sprog',
  languageNotSaved: 'Sproget blev ikke gemt på din konto',
  about: 'Om',
  version: 'Version',
  versionUnknown: 'Ukendt',
  server: 'Server',
  serverDescription: 'Log ud for at oprette forbindelse til en anden server.',
  appearance: 'Udseende',
  general: 'Generelt',
  videoAndDownloads: 'Video og downloads',
  videoQuality: 'Streamingkvalitet',
  videoQualityAuto: 'Automatisk',
  videoQualityAutoDescription: 'Den bedste kvalitet, din forbindelse tillader',
  videoQualityStandard: 'Op til 720p',
  videoQualityStandardDescription: 'Bruger færre mobildata',
  videoQualityDataSaver: 'Datasparer',
  videoQualityDataSaverDescription: 'Op til 480p, bruger færrest mobildata',
  videoQualityFooter:
    'Angiver den højeste opløsning for videoer, som din organisation streamer. Downloadede lektioner og videoer fra YouTube eller Vimeo påvirkes ikke.',
  downloads: 'Downloads'
};
