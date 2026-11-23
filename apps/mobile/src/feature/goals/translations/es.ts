import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const es: TranslatedMessages<typeof en> = {
  streakDays: { one: 'Racha de {count} día', other: 'Racha de {count} días' },
  noStreak: 'Aún no tienes racha',
  noStreakDescription: 'Termina una lección, entrega un ejercicio o asiste a una clase en directo para empezar una.',
  activeToday: 'Hoy ya has aprendido.',
  notActiveToday: 'Aprende hoy para mantener tu racha.',
  bestStreak: { one: 'Mejor: {count} día', other: 'Mejor: {count} días' },
  weekendNote: 'Los fines de semana no rompen la racha.',
  dayActive: '{day}, con actividad',
  dayInactive: '{day}, sin actividad',
  weeklyTitle: 'Meta semanal de lecciones',
  weeklyProgress: '{completed} de {target} lecciones esta semana',
  weeklyReached: 'Has alcanzado tu meta esta semana.',
  targetLabel: { one: '{count} lección por semana', other: '{count} lecciones por semana' },
  lowerTarget: 'Reducir la meta semanal',
  raiseTarget: 'Aumentar la meta semanal',
  goalNotSaved: 'No se guardó tu meta semanal',
  milestonesTitle: 'Hitos',
  milestoneName: { one: 'Racha de {count} día', other: 'Racha de {count} días' },
  milestoneAchieved: 'Conseguido',
  milestoneRemaining: { one: 'Falta {count} día', other: 'Faltan {count} días' },
  streakUnit: { one: 'día seguido', other: 'días seguidos' },
  weeklyRemaining: {
    one: 'Te falta {count} lección para lograrla.',
    other: 'Te faltan {count} lecciones para lograrla.'
  },
  ofTarget: 'de {target}',
  nextMilestoneTitle: 'Próximo hito',
  milestoneProgress: { one: '{current} de {count} día', other: '{current} de {count} días' },
  allMilestonesEarned: 'Has alcanzado todos los hitos.',
  loadError: 'Tus metas no se cargaron',
  welcomeTitle: { one: 'Racha de {count} día', other: 'Racha de {count} días' },
  welcomeDescription: 'Aprende algo hoy para mantenerla.',
  welcomeDescriptionActive: 'Hoy ya has aprendido.',
  welcomeResume: 'Seguir donde lo dejaste',
  welcomeExplore: 'Explorar cursos nuevos',
  welcomeDismiss: 'Cerrar'
};
