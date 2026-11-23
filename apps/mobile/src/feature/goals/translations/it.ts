import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const it: TranslatedMessages<typeof en> = {
  streakDays: { one: 'Serie di {count} giorno', other: 'Serie di {count} giorni' },
  noStreak: 'Ancora nessuna serie',
  noStreakDescription:
    'Completa una lezione, consegna un esercizio o partecipa a una lezione dal vivo per iniziarne una.',
  activeToday: 'Oggi hai studiato.',
  notActiveToday: 'Studia oggi per mantenere la serie.',
  bestStreak: { one: 'Record: {count} giorno', other: 'Record: {count} giorni' },
  weekendNote: 'I fine settimana non interrompono la serie.',
  dayActive: '{day}, attivo',
  dayInactive: '{day}, nessuna attività',
  weeklyTitle: 'Obiettivo settimanale di lezioni',
  weeklyProgress: '{completed} di {target} lezioni questa settimana',
  weeklyReached: 'Hai raggiunto l’obiettivo di questa settimana.',
  targetLabel: { one: '{count} lezione a settimana', other: '{count} lezioni a settimana' },
  lowerTarget: 'Riduci l’obiettivo settimanale',
  raiseTarget: 'Aumenta l’obiettivo settimanale',
  goalNotSaved: 'L’obiettivo settimanale non è stato salvato',
  milestonesTitle: 'Traguardi',
  milestoneName: { one: 'Serie di {count} giorno', other: 'Serie di {count} giorni' },
  milestoneAchieved: 'Raggiunto',
  milestoneRemaining: { one: 'Manca {count} giorno', other: 'Mancano {count} giorni' },
  streakUnit: { one: 'giorno di fila', other: 'giorni di fila' },
  weeklyRemaining: {
    one: 'Ancora {count} lezione per raggiungerlo.',
    other: 'Ancora {count} lezioni per raggiungerlo.'
  },
  ofTarget: 'su {target}',
  nextMilestoneTitle: 'Prossimo traguardo',
  milestoneProgress: { one: '{current} di {count} giorno', other: '{current} di {count} giorni' },
  allMilestonesEarned: 'Hai raggiunto tutti i traguardi.',
  loadError: 'I tuoi obiettivi non sono stati caricati',
  welcomeTitle: { one: 'Serie di {count} giorno', other: 'Serie di {count} giorni' },
  welcomeDescription: 'Studia qualcosa oggi per continuarla.',
  welcomeDescriptionActive: 'Oggi hai già studiato.',
  welcomeResume: 'Riprendi da dove avevi lasciato',
  welcomeExplore: 'Esplora nuovi corsi',
  welcomeDismiss: 'Chiudi'
};
