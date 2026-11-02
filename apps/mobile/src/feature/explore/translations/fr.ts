import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const fr: TranslatedMessages<typeof en> = {
  screenTitle: 'Explorer',
  entryTitle: 'Explorer les cours',
  entryDescription: 'Les cours auxquels vous pouvez vous inscrire',
  searchCourses: 'Rechercher des cours',
  emptyTitle: 'Aucun autre cours',
  emptyDescription: 'Votre organisation ne vous propose aucun autre cours.',
  searchNoResultsTitle: 'Aucun cours correspondant',
  searchNoResultsDescription: 'Aucun titre de cours ne contient « {query} ».',
  loadError: 'Les cours n’ont pas pu être chargés',
  courseLoadError: 'Ce cours n’a pas pu être chargé',
  about: 'À propos de ce cours',
  goals: 'Ce que vous allez apprendre',
  requirements: 'Prérequis',
  enroll: 'S’inscrire',
  goToCourse: 'Aller au cours',
  enrolledToast: 'Vous êtes inscrit à {title}',
  enrollFailed: 'L’inscription n’a pas abouti',
  enrollFull: 'Ce cours n’accepte pas de nouveaux apprenants pour le moment. Contactez votre organisation.',
  enrollMembersOnly:
    'Seuls les membres de cette organisation peuvent s’inscrire. Demandez une invitation à un administrateur.',
  enrollUnavailable: 'L’inscription à ce cours n’est pas possible dans l’application.',
  paidNotAvailable: 'L’inscription à ce cours n’est pas possible dans l’application.',
  inviteOnly: 'Votre organisation inscrit les apprenants à ce cours.',
  originalPrice: 'Prix d’origine {price}'
};
