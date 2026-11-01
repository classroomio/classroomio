import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const ru: TranslatedMessages<typeof en> = {
  account: 'Аккаунт',
  name: 'Имя',
  notSet: 'Не указано',
  email: 'Эл. почта',
  notifications: 'Уведомления',
  notificationsDescription: 'Push, в приложении, эл. почта и тихие часы',
  security: 'Безопасность',
  theme: 'Тема',
  themeSystem: 'Системная',
  themeLight: 'Светлая',
  themeDark: 'Тёмная',
  language: 'Язык',
  languageSystem: 'Системный',
  languageSystemDescription: 'Как на устройстве',
  languageNotSaved: 'Язык не сохранён в аккаунте',
  about: 'О приложении',
  version: 'Версия',
  versionUnknown: 'Неизвестна',
  server: 'Сервер',
  serverDescription: 'Чтобы подключиться к другому серверу, выйдите из аккаунта.'
};
