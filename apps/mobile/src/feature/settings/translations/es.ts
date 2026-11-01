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
  serverDescription: 'Cierra sesión para conectarte a otro servidor.'
};
