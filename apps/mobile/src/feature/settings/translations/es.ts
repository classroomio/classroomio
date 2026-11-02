import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const es: TranslatedMessages<typeof en> = {
  account: 'Cuenta',
  name: 'Nombre',
  notSet: 'Sin definir',
  email: 'Correo electrónico',
  notifications: 'Notificaciones',
  notificationsDescription: 'Push, en la app, correo y horas de silencio',
  security: 'Seguridad',
  theme: 'Tema',
  themeSystem: 'Sistema',
  themeLight: 'Claro',
  themeDark: 'Oscuro',
  language: 'Idioma',
  languageSystem: 'Sistema',
  languageSystemDescription: 'Igual que el idioma del dispositivo',
  languageNotSaved: 'El idioma no se guardó en tu cuenta',
  about: 'Acerca de',
  version: 'Versión',
  versionUnknown: 'Desconocida',
  server: 'Servidor',
  serverDescription: 'Cierra sesión para conectarte a otro servidor.',
  appearance: 'Apariencia',
  general: 'General',
  videoAndDownloads: 'Vídeo y descargas',
  videoQuality: 'Calidad de streaming',
  videoQualityAuto: 'Automática',
  videoQualityAutoDescription: 'La mejor calidad que permite tu conexión',
  videoQualityStandard: 'Hasta 720p',
  videoQualityStandardDescription: 'Usa menos datos móviles',
  videoQualityDataSaver: 'Ahorro de datos',
  videoQualityDataSaverDescription: 'Hasta 480p, usa la menor cantidad de datos móviles',
  videoQualityFooter:
    'Define la resolución máxima de los vídeos que transmite tu organización. No afecta a las lecciones descargadas ni a los vídeos de YouTube o Vimeo.',
  downloads: 'Descargas'
};
