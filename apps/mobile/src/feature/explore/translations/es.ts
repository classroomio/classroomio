import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const es: TranslatedMessages<typeof en> = {
  screenTitle: 'Explorar',
  entryTitle: 'Explorar cursos',
  entryDescription: 'Cursos en los que puedes inscribirte',
  searchCourses: 'Buscar cursos',
  emptyTitle: 'No hay más cursos',
  emptyDescription: 'Tu organización no tiene más cursos disponibles para ti.',
  searchNoResultsTitle: 'Ningún curso coincide',
  searchNoResultsDescription: 'Ningún título de curso contiene «{query}».',
  loadError: 'Los cursos no se cargaron',
  courseLoadError: 'Este curso no se cargó',
  about: 'Acerca de este curso',
  goals: 'Lo que aprenderás',
  requirements: 'Requisitos',
  enroll: 'Inscribirme',
  goToCourse: 'Ir al curso',
  enrolledToast: 'Te inscribiste en {title}',
  enrollFailed: 'No se completó la inscripción',
  enrollFull: 'Este curso no admite nuevos estudiantes en este momento. Contacta con tu organización.',
  enrollMembersOnly:
    'Solo los miembros de esta organización pueden inscribirse. Pide una invitación a un administrador.',
  enrollUnavailable: 'Este curso no admite inscripciones desde la app.',
  paidNotAvailable: 'Este curso no está disponible para inscribirse en la app.',
  inviteOnly: 'Tu organización inscribe a los estudiantes en este curso.',
  originalPrice: 'Precio original {price}'
};
