import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const pl: TranslatedMessages<typeof en> = {
  streakDays: {
    one: 'Seria: {count} dzień',
    few: 'Seria: {count} dni',
    many: 'Seria: {count} dni',
    other: 'Seria: {count} dnia'
  },
  noStreak: 'Brak serii',
  noStreakDescription: 'Ukończ lekcję, prześlij ćwiczenie lub weź udział w zajęciach na żywo, aby ją rozpocząć.',
  activeToday: 'Dziś już się uczyłeś.',
  notActiveToday: 'Ucz się dziś, aby utrzymać serię.',
  bestStreak: {
    one: 'Rekord: {count} dzień',
    few: 'Rekord: {count} dni',
    many: 'Rekord: {count} dni',
    other: 'Rekord: {count} dnia'
  },
  weekendNote: 'Weekendy nie przerywają serii.',
  dayActive: '{day}, nauka',
  dayInactive: '{day}, bez nauki',
  weeklyTitle: 'Tygodniowy cel lekcji',
  weeklyProgress: '{completed} z {target} lekcji w tym tygodniu',
  weeklyReached: 'W tym tygodniu cel został osiągnięty.',
  targetLabel: {
    one: '{count} lekcja w tygodniu',
    few: '{count} lekcje w tygodniu',
    many: '{count} lekcji w tygodniu',
    other: '{count} lekcji w tygodniu'
  },
  lowerTarget: 'Obniż cel tygodniowy',
  raiseTarget: 'Podnieś cel tygodniowy',
  goalNotSaved: 'Nie zapisano celu tygodniowego',
  milestonesTitle: 'Kamienie milowe',
  milestoneName: {
    one: 'Seria {count} dnia',
    few: 'Seria {count} dni',
    many: 'Seria {count} dni',
    other: 'Seria {count} dnia'
  },
  milestoneAchieved: 'Osiągnięto',
  milestoneRemaining: {
    one: 'Został {count} dzień',
    few: 'Zostały {count} dni',
    many: 'Zostało {count} dni',
    other: 'Zostało {count} dnia'
  },
  streakUnit: { one: 'dzień z rzędu', few: 'dni z rzędu', many: 'dni z rzędu', other: 'dnia z rzędu' },
  weeklyRemaining: {
    one: 'Jeszcze {count} lekcja do celu.',
    few: 'Jeszcze {count} lekcje do celu.',
    many: 'Jeszcze {count} lekcji do celu.',
    other: 'Jeszcze {count} lekcji do celu.'
  },
  ofTarget: 'z {target}',
  nextMilestoneTitle: 'Następny kamień milowy',
  milestoneProgress: {
    one: '{current} z {count} dnia',
    few: '{current} z {count} dni',
    many: '{current} z {count} dni',
    other: '{current} z {count} dni'
  },
  allMilestonesEarned: 'Masz już wszystkie kamienie milowe.',
  loadError: 'Nie wczytano celów',
  welcomeTitle: {
    one: 'Seria: {count} dzień',
    few: 'Seria: {count} dni',
    many: 'Seria: {count} dni',
    other: 'Seria: {count} dnia'
  },
  welcomeDescription: 'Naucz się dziś czegoś, aby ją kontynuować.',
  welcomeDescriptionActive: 'Dziś już się uczyłeś.',
  welcomeResume: 'Kontynuuj od miejsca, w którym skończyłeś',
  welcomeExplore: 'Odkryj nowe kursy',
  welcomeDismiss: 'Zamknij'
};
