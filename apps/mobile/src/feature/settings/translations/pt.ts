import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const pt: TranslatedMessages<typeof en> = {
  account: 'Conta',
  name: 'Nome',
  notSet: 'Não definido',
  email: 'E-mail',
  notifications: 'Notificações',
  notificationsDescription: 'Push, no app, e-mail e horário silencioso',
  security: 'Segurança',
  theme: 'Tema',
  themeSystem: 'Sistema',
  themeLight: 'Claro',
  themeDark: 'Escuro',
  language: 'Idioma',
  languageSystem: 'Sistema',
  languageSystemDescription: 'Igual ao idioma do dispositivo',
  languageNotSaved: 'Idioma não salvo na sua conta',
  about: 'Sobre',
  version: 'Versão',
  versionUnknown: 'Desconhecida',
  server: 'Servidor',
  serverDescription: 'Saia para se conectar a outro servidor.'
};
