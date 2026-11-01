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
  serverDescription: 'Esci per connetterti a un altro server.'
};
