import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const tr: TranslatedMessages<typeof en> = {
  offline: 'Çevrimdışı',
  youAreOffline: 'Çevrimdışısınız',
  syncsOnReconnect: 'İlerleme, yeniden bağlandığınızda eşitlenir',
  changesWaiting: { one: '{count} değişiklik eşitlenmeyi bekliyor', other: '{count} değişiklik eşitlenmeyi bekliyor' },
  changesWaitingSentence: {
    one: '{count} değişiklik eşitlenmeyi bekliyor.',
    other: '{count} değişiklik eşitlenmeyi bekliyor.'
  },
  changesWillSync: {
    one: '{count} değişiklik, yeniden bağlandığınızda eşitlenecek.',
    other: '{count} değişiklik, yeniden bağlandığınızda eşitlenecek.'
  },
  allSynced: 'Bu cihazda kaydedilen her şey eşitlendi.',
  synced: 'Eşitlendi',
  syncing: 'Eşitleniyor',
  waitingToSync: 'Eşitlenmeyi bekliyor',
  retryingAttempt: 'Otomatik olarak yeniden deneniyor · {attempt}. deneme',
  notAccepted: 'Kabul edilmedi',
  notAcceptedReason: 'Kabul edilmedi: {reason}',
  lessonCompleted: 'Ders tamamlandı',
  videoProgressAt: 'Video ilerlemesi: {position}',
  videoProgress: 'Video ilerlemesi',
  updateCount: { one: '{count} güncelleme', other: '{count} güncelleme' },
  retry: 'Yeniden dene',
  syncTitle: 'Eşitleme',
  syncNow: 'Şimdi eşitle',
  signInToSave: 'İlerlemenizi kaydetmek için yeniden oturum açın.'
};
