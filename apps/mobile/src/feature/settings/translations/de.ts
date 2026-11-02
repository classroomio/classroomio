import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const de: TranslatedMessages<typeof en> = {
  account: 'Konto',
  name: 'Name',
  notSet: 'Nicht festgelegt',
  email: 'E-Mail',
  notifications: 'Benachrichtigungen',
  notificationsDescription: 'Push, in der App, E-Mail und Ruhezeiten',
  security: 'Sicherheit',
  theme: 'Design',
  themeSystem: 'System',
  themeLight: 'Hell',
  themeDark: 'Dunkel',
  language: 'Sprache',
  languageSystem: 'System',
  languageSystemDescription: 'Entspricht der Sprache Ihres Geräts',
  languageNotSaved: 'Die Sprache wurde nicht in Ihrem Konto gespeichert',
  about: 'Info',
  version: 'Version',
  versionUnknown: 'Unbekannt',
  server: 'Server',
  serverDescription: 'Melden Sie sich ab, um eine Verbindung zu einem anderen Server herzustellen.',
  appearance: 'Darstellung',
  general: 'Allgemein',
  videoAndDownloads: 'Video und Downloads',
  videoQuality: 'Streaming-Qualität',
  videoQualityAuto: 'Automatisch',
  videoQualityAutoDescription: 'Die beste Qualität, die Ihre Verbindung zulässt',
  videoQualityStandard: 'Bis zu 720p',
  videoQualityStandardDescription: 'Verbraucht weniger mobile Daten',
  videoQualityDataSaver: 'Datensparmodus',
  videoQualityDataSaverDescription: 'Bis zu 480p, verbraucht die wenigsten mobilen Daten',
  videoQualityFooter:
    'Legt die höchste Auflösung für Videos fest, die Ihre Organisation streamt. Heruntergeladene Lektionen und Videos von YouTube oder Vimeo sind nicht betroffen.',
  downloads: 'Downloads'
};
