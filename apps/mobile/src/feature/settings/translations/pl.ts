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
  serverDescription: 'Wyloguj się, aby połączyć się z innym serwerem.',
  appearance: 'Wygląd',
  general: 'Ogólne',
  videoAndDownloads: 'Wideo i pobrane',
  videoQuality: 'Jakość strumieniowania',
  videoQualityAuto: 'Automatyczna',
  videoQualityAutoDescription: 'Najlepsza jakość, na jaką pozwala połączenie',
  videoQualityStandard: 'Do 720p',
  videoQualityStandardDescription: 'Zużywa mniej danych komórkowych',
  videoQualityDataSaver: 'Oszczędzanie danych',
  videoQualityDataSaverDescription: 'Do 480p, zużywa najmniej danych komórkowych',
  videoQualityFooter:
    'Ustawia najwyższą rozdzielczość filmów strumieniowanych przez Twoją organizację. Nie dotyczy pobranych lekcji ani filmów z YouTube lub Vimeo.',
  downloads: 'Pobrane'
};
