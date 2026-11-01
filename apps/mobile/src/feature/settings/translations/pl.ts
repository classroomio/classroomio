import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const pl: TranslatedMessages<typeof en> = {
  account: 'Konto',
  name: 'Imię i nazwisko',
  notSet: 'Nie ustawiono',
  email: 'E-mail',
  notifications: 'Powiadomienia',
  notificationsDescription: 'Push, w aplikacji, e-mail i godziny ciszy',
  security: 'Bezpieczeństwo',
  theme: 'Motyw',
  themeSystem: 'Systemowy',
  themeLight: 'Jasny',
  themeDark: 'Ciemny',
  language: 'Język',
  languageSystem: 'Systemowy',
  languageSystemDescription: 'Taki jak język urządzenia',
  languageNotSaved: 'Nie zapisano języka na koncie',
  about: 'Informacje',
  version: 'Wersja',
  versionUnknown: 'Nieznana',
  server: 'Serwer',
  serverDescription: 'Wyloguj się, aby połączyć się z innym serwerem.'
};
