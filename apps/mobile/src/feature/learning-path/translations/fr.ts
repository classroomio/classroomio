import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const fr: TranslatedMessages<typeof en> = {
  pathLabel: 'Parcours',
  courseCount: { one: '{count} cours', other: '{count} cours' },
  coursesComplete: '{completed} cours terminés sur {total}',
  pathCompleted: 'Parcours terminé',
  percentComplete: '{percent} terminé',
  stateCompleted: 'Terminé',
  stateInProgress: 'En cours',
  stateNotStarted: 'Pas commencé',
  stateLocked: 'Verrouillé',
  finishToUnlock: 'Terminez {course} pour le déverrouiller',
  inOrder: 'Les cours se déverrouillent dans l’ordre.',
  anyOrder: 'Suivez les cours dans l’ordre de votre choix.',
  courses: 'Cours',
  join: 'Rejoindre le parcours',
  joined: 'Vous avez rejoint {name}',
  joinFailed: 'Vous n’avez pas été ajouté à ce parcours',
  start: 'Commencer',
  nextUp: 'Ensuite : {title}',
  notJoinableInApp: 'Ce parcours ne peut pas être rejoint dans l’application.',
  loadError: 'Le parcours ne s’est pas chargé',
  emptyTitle: 'Aucun parcours pour l’instant',
  emptyDescription: 'Les parcours que vous rejoignez sont listés ici avec votre progression dans chaque cours.',
  suggested: 'Parcours suggérés'
};
