import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const pt: TranslatedMessages<typeof en> = {
  pathLabel: 'Trilha de aprendizagem',
  courseCount: { one: '{count} curso', other: '{count} cursos' },
  coursesComplete: '{completed} de {total} cursos concluídos',
  pathCompleted: 'Trilha concluída',
  percentComplete: '{percent} concluído',
  stateCompleted: 'Concluído',
  stateInProgress: 'Em andamento',
  stateNotStarted: 'Não iniciado',
  stateLocked: 'Bloqueado',
  finishToUnlock: 'Conclua {course} para desbloquear',
  inOrder: 'Os cursos são desbloqueados em ordem.',
  anyOrder: 'Faça os cursos em qualquer ordem.',
  courses: 'Cursos',
  join: 'Entrar na trilha',
  joined: 'Você entrou em {name}',
  joinFailed: 'Você não foi adicionado a esta trilha',
  start: 'Começar',
  nextUp: 'Próximo: {title}',
  notJoinableInApp: 'Não é possível entrar nesta trilha pelo app.',
  loadError: 'A trilha de aprendizagem não carregou',
  emptyTitle: 'Nenhuma trilha ainda',
  emptyDescription: 'As trilhas em que você entrar aparecem aqui com seu progresso em cada curso.',
  suggested: 'Trilhas sugeridas'
};
