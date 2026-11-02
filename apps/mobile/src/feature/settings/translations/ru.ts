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
  serverDescription: 'Чтобы подключиться к другому серверу, выйдите из аккаунта.',
  appearance: 'Оформление',
  general: 'Общие',
  videoAndDownloads: 'Видео и загрузки',
  videoQuality: 'Качество трансляции',
  videoQualityAuto: 'Автоматически',
  videoQualityAutoDescription: 'Лучшее качество, которое позволяет подключение',
  videoQualityStandard: 'До 720p',
  videoQualityStandardDescription: 'Расходует меньше мобильного трафика',
  videoQualityDataSaver: 'Экономия трафика',
  videoQualityDataSaverDescription: 'До 480p, расходует меньше всего мобильного трафика',
  videoQualityFooter:
    'Задаёт максимальное разрешение видео, которые транслирует ваша организация. Не влияет на загруженные уроки и видео с YouTube или Vimeo.',
  downloads: 'Загрузки'
};
