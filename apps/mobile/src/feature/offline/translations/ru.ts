import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const ru: TranslatedMessages<typeof en> = {
  offline: 'Офлайн',
  youAreOffline: 'Нет подключения к сети',
  syncsOnReconnect: 'Прогресс синхронизируется после подключения',
  changesWaiting: {
    one: '{count} изменение ожидает синхронизации',
    few: '{count} изменения ожидают синхронизации',
    many: '{count} изменений ожидают синхронизации',
    other: '{count} изменения ожидают синхронизации'
  },
  changesWaitingSentence: {
    one: '{count} изменение ожидает синхронизации.',
    few: '{count} изменения ожидают синхронизации.',
    many: '{count} изменений ожидают синхронизации.',
    other: '{count} изменения ожидают синхронизации.'
  },
  changesWillSync: {
    one: '{count} изменение синхронизируется после подключения.',
    few: '{count} изменения синхронизируются после подключения.',
    many: '{count} изменений синхронизируются после подключения.',
    other: '{count} изменения синхронизируются после подключения.'
  },
  allSynced: 'Всё, что записано на этом устройстве, синхронизировано.',
  synced: 'Синхронизировано',
  syncing: 'Синхронизация',
  waitingToSync: 'Ожидает синхронизации',
  retryingAttempt: 'Автоматический повтор · попытка {attempt}',
  notAccepted: 'Не принято',
  notAcceptedReason: 'Не принято: {reason}',
  lessonCompleted: 'Урок завершён',
  videoProgressAt: 'Прогресс видео: {position}',
  videoProgress: 'Прогресс видео',
  updateCount: {
    one: '{count} обновление',
    few: '{count} обновления',
    many: '{count} обновлений',
    other: '{count} обновления'
  },
  retry: 'Повторить',
  syncTitle: 'Синхронизация',
  syncNow: 'Синхронизировать',
  signInToSave: 'Войдите снова, чтобы сохранить прогресс.'
};
