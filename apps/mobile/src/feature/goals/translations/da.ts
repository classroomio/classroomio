import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const da: TranslatedMessages<typeof en> = {
  streakDays: { one: '{count} dags stime', other: '{count} dages stime' },
  noStreak: 'Ingen stime endnu',
  noStreakDescription: 'Gennemfør en lektion, aflever en opgave eller deltag i en liveundervisning for at starte en.',
  activeToday: 'Du har lært i dag.',
  notActiveToday: 'Lær noget i dag for at holde din stime.',
  bestStreak: { one: 'Bedste: {count} dag', other: 'Bedste: {count} dage' },
  weekendNote: 'Weekender bryder aldrig en stime.',
  dayActive: '{day}, lært',
  dayInactive: '{day}, ingen læring',
  weeklyTitle: 'Ugentligt lektionsmål',
  weeklyProgress: '{completed} af {target} lektioner i denne uge',
  weeklyReached: 'Du har nået dit mål i denne uge.',
  targetLabel: { one: '{count} lektion om ugen', other: '{count} lektioner om ugen' },
  lowerTarget: 'Sænk ugentligt mål',
  raiseTarget: 'Hæv ugentligt mål',
  goalNotSaved: 'Dit ugentlige mål blev ikke gemt',
  milestonesTitle: 'Milepæle',
  milestoneName: { one: '{count} dags stime', other: '{count} dages stime' },
  milestoneAchieved: 'Opnået',
  milestoneRemaining: { one: '{count} dag tilbage', other: '{count} dage tilbage' },
  streakUnit: { one: 'dag i træk', other: 'dage i træk' },
  weeklyRemaining: { one: '{count} lektion mere for at nå det.', other: '{count} lektioner mere for at nå det.' },
  ofTarget: 'af {target}',
  nextMilestoneTitle: 'Næste milepæl',
  milestoneProgress: { one: '{current} af {count} dag', other: '{current} af {count} dage' },
  allMilestonesEarned: 'Du har nået alle milepæle.',
  loadError: 'Dine mål blev ikke indlæst',
  welcomeTitle: { one: '{count} dags stime', other: '{count} dages stime' },
  welcomeDescription: 'Lær noget i dag for at holde den i gang.',
  welcomeDescriptionActive: 'Du har allerede lært i dag.',
  welcomeResume: 'Fortsæt hvor du slap',
  welcomeExplore: 'Udforsk nye kurser',
  welcomeDismiss: 'Luk'
};
