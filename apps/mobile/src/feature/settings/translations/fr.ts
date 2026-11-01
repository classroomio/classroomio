import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const fr: TranslatedMessages<typeof en> = {
  account: 'Compte',
  name: 'Nom',
  notSet: 'Non défini',
  email: 'E-mail',
  notifications: 'Notifications',
  notificationsDescription: "Push, dans l'app, e-mail et heures calmes",
  security: 'Sécurité',
  theme: 'Thème',
  themeSystem: 'Système',
  themeLight: 'Clair',
  themeDark: 'Sombre',
  language: 'Langue',
  languageSystem: 'Système',
  languageSystemDescription: "Identique à la langue de l'appareil",
  languageNotSaved: 'Langue non enregistrée dans votre compte',
  about: 'À propos',
  version: 'Version',
  versionUnknown: 'Inconnue',
  server: 'Serveur',
  serverDescription: 'Déconnectez-vous pour vous connecter à un autre serveur.'
};
