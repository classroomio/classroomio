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
  serverDescription: 'Saia para se conectar a outro servidor.',
  appearance: 'Aparência',
  general: 'Geral',
  videoAndDownloads: 'Vídeo e downloads',
  videoQuality: 'Qualidade de streaming',
  videoQualityAuto: 'Automática',
  videoQualityAutoDescription: 'A melhor qualidade que sua conexão permite',
  videoQualityStandard: 'Até 720p',
  videoQualityStandardDescription: 'Usa menos dados móveis',
  videoQualityDataSaver: 'Economia de dados',
  videoQualityDataSaverDescription: 'Até 480p, usa o mínimo de dados móveis',
  videoQualityFooter:
    'Define a resolução máxima dos vídeos transmitidos pela sua organização. Aulas baixadas e vídeos do YouTube ou Vimeo não são afetados.',
  downloads: 'Downloads'
};
