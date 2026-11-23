import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const tr: TranslatedMessages<typeof en> = {
  emptyTitle: 'Başka kurs yok',
  emptyDescription: 'Kuruluşunuzun size açık başka kursu yok.',
  loadError: 'Kurslar yüklenemedi',
  courseLoadError: 'Bu kurs yüklenemedi',
  about: 'Bu kurs hakkında',
  goals: 'Neler öğreneceksiniz',
  requirements: 'Gereksinimler',
  enroll: 'Kaydol',
  goToCourse: 'Kursa git',
  enrolledToast: '{title} kursuna kaydoldunuz',
  enrollFailed: 'Kayıt tamamlanmadı',
  enrollFull: 'Bu kurs şu anda yeni öğrenci kabul etmiyor. Kuruluşunuzla iletişime geçin.',
  enrollMembersOnly: 'Yalnızca bu kuruluşun üyeleri kaydolabilir. Bir yöneticiden davet isteyin.',
  enrollUnavailable: 'Bu kursa uygulamadan kaydolunamaz.',
  paidNotAvailable: 'Bu kursa uygulamadan kaydolunamaz.',
  inviteOnly: 'Bu kursa öğrencileri kuruluşunuz kaydeder.',
  originalPrice: 'Orijinal fiyat {price}',
  pathsTitle: 'Öğrenme yolları',
  coursesTitle: 'Kurslar',
  searchCatalog: 'Yol ve kurs arayın'
};
