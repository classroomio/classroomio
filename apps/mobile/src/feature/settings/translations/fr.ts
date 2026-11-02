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
  serverDescription: 'Déconnectez-vous pour vous connecter à un autre serveur.',
  appearance: 'Apparence',
  general: 'Général',
  videoAndDownloads: 'Vidéo et téléchargements',
  videoQuality: 'Qualité de streaming',
  videoQualityAuto: 'Automatique',
  videoQualityAutoDescription: 'La meilleure qualité permise par votre connexion',
  videoQualityStandard: "Jusqu'à 720p",
  videoQualityStandardDescription: 'Utilise moins de données mobiles',
  videoQualityDataSaver: 'Économie de données',
  videoQualityDataSaverDescription: "Jusqu'à 480p, utilise le moins de données mobiles",
  videoQualityFooter:
    'Définit la résolution maximale des vidéos diffusées par votre organisation. Les leçons téléchargées et les vidéos YouTube ou Vimeo ne sont pas concernées.',
  downloads: 'Téléchargements'
};
