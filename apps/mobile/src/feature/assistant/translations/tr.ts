import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const tr: TranslatedMessages<typeof en> = {
  title: 'Yapay zekâya sor',
  description: 'Kurslarınız ve hedefleriniz hakkında',
  emptyTitle: 'Öğreniminiz hakkında sorun',
  emptyDescription: 'Kurslarınızı, sıradaki teslimleri veya haftalık hedefinize nasıl ulaşacağınızı sorun.',
  placeholder: 'Bir soru sorun',
  inputLabel: 'Asistana soru',
  send: 'Gönder',
  stop: 'Yanıtı durdur',
  stopped: 'Yanıt durdu. Devam etmek için yeniden sorun.',
  requestFailed: 'Asistan yanıt vermedi',
  capReachedTitle: 'Bu ay soru hakkınız kalmadı',
  capReachedDescription: 'Her öğrencinin kaç soru sorabileceğini kuruluşunuz belirler.',
  poolExhaustedTitle: 'Asistan kullanılamıyor',
  poolExhaustedDescription: 'Kuruluşunuz bu ayki yapay zekâ kotasını kullandı.',
  disabledTitle: 'Asistan kapalı',
  disabledDescription: 'Kuruluşunuz yapay zekâ eğitmenini açmadı.',
  notConfiguredTitle: 'Asistan kullanılamıyor',
  notConfiguredDescription: 'Bu sunucuda yapay zekâ sağlayıcısı ayarlanmamış.',
  noCoursesTitle: 'Önce bir kursa katılın',
  noCoursesDescription: 'Asistan kayıtlı olduğunuz kurslarla ilgili soruları yanıtlar.'
};
