import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const it: TranslatedMessages<typeof en> = {
  account: 'Account',
  name: 'Nome',
  notSet: 'Non impostato',
  email: 'Email',
  notifications: 'Notifiche',
  notificationsDescription: 'Push, in-app, email e ore di silenzio',
  security: 'Sicurezza',
  theme: 'Tema',
  themeSystem: 'Sistema',
  themeLight: 'Chiaro',
  themeDark: 'Scuro',
  language: 'Lingua',
  languageSystem: 'Sistema',
  languageSystemDescription: 'Uguale alla lingua del dispositivo',
  languageNotSaved: 'Lingua non salvata nel tuo account',
  about: 'Informazioni',
  version: 'Versione',
  versionUnknown: 'Sconosciuta',
  server: 'Server',
  serverDescription: 'Esci per connetterti a un altro server.',
  appearance: 'Aspetto',
  general: 'Generali',
  videoAndDownloads: 'Video e download',
  videoQuality: 'Qualità dello streaming',
  videoQualityAuto: 'Automatica',
  videoQualityAutoDescription: 'La qualità migliore consentita dalla tua connessione',
  videoQualityStandard: 'Fino a 720p',
  videoQualityStandardDescription: 'Usa meno dati mobili',
  videoQualityDataSaver: 'Risparmio dati',
  videoQualityDataSaverDescription: 'Fino a 480p, usa meno dati mobili possibile',
  videoQualityFooter:
    'Imposta la risoluzione massima dei video trasmessi dalla tua organizzazione. Le lezioni scaricate e i video di YouTube o Vimeo non sono interessati.',
  downloads: 'Download'
};
