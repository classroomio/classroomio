import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const tr: TranslatedMessages<typeof en> = {
  screenTitle: 'Uyumluluk',
  standingOverdue: 'Gecikmiş',
  standingInGracePeriod: 'Ek sürede',
  standingDueSoon: 'Son tarih yaklaşıyor',
  standingOpen: 'Son tarihi gelmedi',
  standingUnscheduled: 'Son tarih belirlenmedi',
  standingCompliant: 'Uyumlu',
  standingWaived: 'Muaf',
  statusOverdueByDays: { one: '{count} gün gecikmiş', other: '{count} gün gecikmiş' },
  statusGraceEndsToday: 'Ek sürede, bugün bitiyor',
  statusGraceDaysLeft: { one: 'Ek sürede, {count} gün kaldı', other: 'Ek sürede, {count} gün kaldı' },
  statusDueToday: 'Son tarih bugün',
  statusDueInDays: { one: 'Son tarih {count} gün sonra', other: 'Son tarih {count} gün sonra' },
  statusExpiresToday: 'Bugün sona eriyor',
  statusExpiresInDays: { one: '{count} gün sonra sona eriyor', other: '{count} gün sonra sona eriyor' },
  statusInProgress: 'Devam ediyor',
  statusNotStarted: 'Başlanmadı',
  detailDeadline: 'Son tarih: {date}',
  detailGracePeriodEnds: 'Ek süre bitişi: {date}',
  detailGracePeriodEnded: 'Ek süre bitti: {date}',
  detailValidUntil: 'Geçerlilik bitişi: {date}',
  detailWaiverEnds: 'Muafiyet bitişi: {date}',
  detailLastCompleted: 'Son tamamlama: {date}',
  detailRenewsEvery: { one: 'Her ay yenilenir', other: '{count} ayda bir yenilenir' },
  countOverdue: { other: '{count} gecikmiş' },
  countInGracePeriod: { other: '{count} ek sürede' },
  countDueSoon: { other: '{count} son tarihi yaklaşan' },
  countToDo: { other: '{count} yapılacak' },
  countCompliant: { other: '{count} uyumlu' },
  countWaived: { other: '{count} muaf' },
  summaryOutOf: { one: '{count} gereksinimden', other: '{count} gereksinimden' },
  summaryOverdue: { one: '{total} {count} tanesi gecikmiş.', other: '{total} {count} tanesi gecikmiş.' },
  summaryInGracePeriod: {
    one: '{total} {count} tanesinin son tarihi geçti ve ek sürede.',
    other: '{total} {count} tanesinin son tarihi geçti ve ek sürede.'
  },
  summaryDueSoon: {
    one: '{total} {count} tanesinin son tarihi yaklaşıyor.',
    other: '{total} {count} tanesinin son tarihi yaklaşıyor.'
  },
  summaryCompliantWithToDo: {
    one: 'Gecikmiş veya son tarihi yaklaşan gereksinim yok. Tamamlanacak {count} gereksinim kaldı.',
    other: 'Gecikmiş veya son tarihi yaklaşan gereksinim yok. Tamamlanacak {count} gereksinim kaldı.'
  },
  summaryCompliantOne: 'Gereksiniminiz karşılanmış durumda.',
  summaryCompliantAll: { other: '{count} gereksinimin tümü karşılanmış durumda.' },
  summaryNone: 'Kuruluşunuz size zorunlu eğitim atamadı.',
  alertOverdueTitle: { one: '{count} gereksinim gecikmiş', other: '{count} gereksinim gecikmiş' },
  alertInGracePeriodTitle: { one: '{count} gereksinim ek sürede', other: '{count} gereksinim ek sürede' },
  alertDueSoonTitle: {
    one: '{count} gereksinimin son tarihi yaklaşıyor',
    other: '{count} gereksinimin son tarihi yaklaşıyor'
  },
  alertWasDue: {
    one: '{course} için son tarih {count} gün önceydi.',
    other: '{course} için son tarih {count} gün önceydi.'
  },
  alertGraceLeft: { one: '{count} gün ek süre kaldı.', other: '{count} gün ek süre kaldı.' },
  alertDueToday: '{course} için son tarih bugün.',
  alertDueInDays: {
    one: '{course} için son tarih {count} gün sonra.',
    other: '{course} için son tarih {count} gün sonra.'
  },
  alertDueSoon: '{course} için son tarih yaklaşıyor.',
  alertExpiresToday: '{course} geçerliliği bugün sona eriyor.',
  alertExpiresInDays: {
    one: '{course} geçerliliği {count} gün sonra sona eriyor.',
    other: '{course} geçerliliği {count} gün sonra sona eriyor.'
  },
  alertExpiresSoon: '{course} geçerliliği yakında sona eriyor.',
  alertHint: 'Uyumluluğu açar',
  loadError: 'Uyumluluk durumunuz yüklenemedi',
  emptyTitle: 'Uyumluluk gereksinimi yok',
  sectionNeedsAttention: 'İlgilenmeniz gerekenler',
  sectionToDo: 'Yapılacaklar',
  certificates: 'Sertifikalar',
  progressComplete: '{percent} tamamlandı',
  countdownLeft: { one: 'gün kaldı', other: 'gün kaldı' },
  countdownUntilRenewal: { one: 'gün sonra yenileme', other: 'gün sonra yenileme' },
  countdownLeftLabel: { one: '{count} gün kaldı', other: '{count} gün kaldı' },
  countdownUntilRenewalLabel: { one: 'Yenilemeye {count} gün kaldı', other: 'Yenilemeye {count} gün kaldı' },
  openCourse: 'Kursu aç',
  resumeCourse: 'Kursa devam et',
  startCourse: 'Kursa başla',
  proof: 'Belge',
  proofLabel: '{course} sertifikası'
};
