import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const pt: TranslatedMessages<typeof en> = {
  streakDays: { one: 'Sequência de {count} dia', other: 'Sequência de {count} dias' },
  noStreak: 'Nenhuma sequência ainda',
  noStreakDescription: 'Conclua uma aula, envie um exercício ou participe de uma aula ao vivo para começar uma.',
  activeToday: 'Você estudou hoje.',
  notActiveToday: 'Estude hoje para manter sua sequência.',
  bestStreak: { one: 'Melhor: {count} dia', other: 'Melhor: {count} dias' },
  weekendNote: 'Fins de semana nunca quebram a sequência.',
  dayActive: '{day}, estudou',
  dayInactive: '{day}, sem estudo',
  weeklyTitle: 'Meta semanal de aulas',
  weeklyProgress: '{completed} de {target} aulas nesta semana',
  weeklyReached: 'Você atingiu sua meta nesta semana.',
  targetLabel: { one: '{count} aula por semana', other: '{count} aulas por semana' },
  lowerTarget: 'Diminuir a meta semanal',
  raiseTarget: 'Aumentar a meta semanal',
  goalNotSaved: 'Sua meta semanal não foi salva',
  milestonesTitle: 'Marcos',
  milestoneName: { one: 'Sequência de {count} dia', other: 'Sequência de {count} dias' },
  milestoneAchieved: 'Alcançado',
  milestoneRemaining: { one: 'Falta {count} dia', other: 'Faltam {count} dias' },
  streakUnit: { one: 'dia seguido', other: 'dias seguidos' },
  weeklyRemaining: { one: 'Falta {count} aula para chegar lá.', other: 'Faltam {count} aulas para chegar lá.' },
  ofTarget: 'de {target}',
  nextMilestoneTitle: 'Próximo marco',
  milestoneProgress: { one: '{current} de {count} dia', other: '{current} de {count} dias' },
  allMilestonesEarned: 'Você alcançou todos os marcos.',
  loadError: 'Suas metas não carregaram',
  welcomeTitle: { one: 'Sequência de {count} dia', other: 'Sequência de {count} dias' },
  welcomeDescription: 'Estude algo hoje para mantê-la.',
  welcomeDescriptionActive: 'Você já estudou hoje.',
  welcomeResume: 'Continuar de onde parou',
  welcomeExplore: 'Explorar novos cursos',
  welcomeDismiss: 'Fechar'
};
