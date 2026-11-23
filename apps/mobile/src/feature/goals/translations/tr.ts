import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const tr: TranslatedMessages<typeof en> = {
  streakDays: { one: '{count} günlük seri', other: '{count} günlük seri' },
  noStreak: 'Henüz seri yok',
  noStreakDescription: 'Başlatmak için bir dersi bitirin, bir alıştırma gönderin veya canlı derse katılın.',
  activeToday: 'Bugün öğrendiniz.',
  notActiveToday: 'Serinizi korumak için bugün öğrenin.',
  bestStreak: { one: 'En iyi: {count} gün', other: 'En iyi: {count} gün' },
  weekendNote: 'Hafta sonları seriyi bozmaz.',
  dayActive: '{day}, öğrenildi',
  dayInactive: '{day}, öğrenilmedi',
  weeklyTitle: 'Haftalık ders hedefi',
  weeklyProgress: 'Bu hafta {target} dersten {completed} tanesi',
  weeklyReached: 'Bu haftaki hedefinize ulaştınız.',
  targetLabel: { one: 'Haftada {count} ders', other: 'Haftada {count} ders' },
  lowerTarget: 'Haftalık hedefi düşür',
  raiseTarget: 'Haftalık hedefi yükselt',
  goalNotSaved: 'Haftalık hedefiniz kaydedilmedi',
  milestonesTitle: 'Kilometre taşları',
  milestoneName: { one: '{count} günlük seri', other: '{count} günlük seri' },
  milestoneAchieved: 'Ulaşıldı',
  milestoneRemaining: { one: '{count} gün kaldı', other: '{count} gün kaldı' },
  streakUnit: { one: 'günlük seri', other: 'günlük seri' },
  weeklyRemaining: { one: 'Hedefe {count} ders kaldı.', other: 'Hedefe {count} ders kaldı.' },
  ofTarget: 'hedef {target}',
  nextMilestoneTitle: 'Sıradaki kilometre taşı',
  milestoneProgress: { one: '{count} günün {current} günü', other: '{count} günün {current} günü' },
  allMilestonesEarned: 'Tüm kilometre taşlarını kazandınız.',
  loadError: 'Hedefleriniz yüklenmedi',
  welcomeTitle: { one: '{count} günlük seri', other: '{count} günlük seri' },
  welcomeDescription: 'Devam ettirmek için bugün bir şey öğrenin.',
  welcomeDescriptionActive: 'Bugün zaten öğrendiniz.',
  welcomeResume: 'Kaldığınız yerden devam edin',
  welcomeExplore: 'Yeni kursları keşfedin',
  welcomeDismiss: 'Kapat'
};
