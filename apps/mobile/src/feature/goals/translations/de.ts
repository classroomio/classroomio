import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const de: TranslatedMessages<typeof en> = {
  streakDays: { one: '{count} Tag in Folge', other: '{count} Tage in Folge' },
  noStreak: 'Noch keine Serie',
  noStreakDescription:
    'Schließen Sie eine Lektion ab, reichen Sie eine Übung ein oder nehmen Sie an einer Live-Sitzung teil, um eine zu beginnen.',
  activeToday: 'Sie haben heute gelernt.',
  notActiveToday: 'Lernen Sie heute, um Ihre Serie zu halten.',
  bestStreak: { one: 'Bestwert: {count} Tag', other: 'Bestwert: {count} Tage' },
  weekendNote: 'Wochenenden unterbrechen keine Serie.',
  dayActive: '{day}, gelernt',
  dayInactive: '{day}, nicht gelernt',
  weeklyTitle: 'Wöchentliches Lektionsziel',
  weeklyProgress: '{completed} von {target} Lektionen diese Woche',
  weeklyReached: 'Sie haben Ihr Ziel diese Woche erreicht.',
  targetLabel: { one: '{count} Lektion pro Woche', other: '{count} Lektionen pro Woche' },
  lowerTarget: 'Wochenziel senken',
  raiseTarget: 'Wochenziel erhöhen',
  goalNotSaved: 'Ihr Wochenziel wurde nicht gespeichert',
  milestonesTitle: 'Meilensteine',
  milestoneName: { one: '{count} Tag in Folge', other: '{count} Tage in Folge' },
  milestoneAchieved: 'Erreicht',
  milestoneRemaining: { one: 'Noch {count} Tag', other: 'Noch {count} Tage' },
  streakUnit: { one: 'Tag in Folge', other: 'Tage in Folge' },
  weeklyRemaining: { one: 'Noch {count} Lektion bis zum Ziel.', other: 'Noch {count} Lektionen bis zum Ziel.' },
  ofTarget: 'von {target}',
  nextMilestoneTitle: 'Nächster Meilenstein',
  milestoneProgress: { one: '{current} von {count} Tag', other: '{current} von {count} Tagen' },
  allMilestonesEarned: 'Du hast alle Meilensteine erreicht.',
  loadError: 'Ihre Ziele wurden nicht geladen',
  welcomeTitle: { one: '{count} Tag in Folge', other: '{count} Tage in Folge' },
  welcomeDescription: 'Lernen Sie heute etwas, um sie fortzusetzen.',
  welcomeDescriptionActive: 'Sie haben heute bereits gelernt.',
  welcomeResume: 'Dort weitermachen, wo Sie aufgehört haben',
  welcomeExplore: 'Neue Kurse entdecken',
  welcomeDismiss: 'Schließen'
};
