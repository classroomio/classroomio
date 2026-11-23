import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const es: TranslatedMessages<typeof en> = {
  pathLabel: 'Ruta de aprendizaje',
  courseCount: { one: '{count} curso', other: '{count} cursos' },
  coursesComplete: '{completed} de {total} cursos completados',
  pathCompleted: 'Ruta completada',
  percentComplete: '{percent} completado',
  stateCompleted: 'Completado',
  stateInProgress: 'En curso',
  stateNotStarted: 'Sin empezar',
  stateLocked: 'Bloqueado',
  finishToUnlock: 'Termina {course} para desbloquearlo',
  inOrder: 'Los cursos se desbloquean en orden.',
  anyOrder: 'Haz los cursos en el orden que quieras.',
  courses: 'Cursos',
  join: 'Unirse a la ruta',
  joined: 'Te uniste a {name}',
  joinFailed: 'No se te añadió a esta ruta',
  start: 'Empezar',
  nextUp: 'Siguiente: {title}',
  notJoinableInApp: 'No puedes unirte a esta ruta desde la app.',
  loadError: 'La ruta de aprendizaje no se cargó',
  emptyTitle: 'Aún no hay rutas',
  emptyDescription: 'Las rutas a las que te unas aparecen aquí con tu progreso en cada curso.',
  suggested: 'Rutas sugeridas'
};
