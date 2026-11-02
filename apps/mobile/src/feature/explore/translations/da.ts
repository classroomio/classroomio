import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const da: TranslatedMessages<typeof en> = {
  screenTitle: 'Udforsk',
  entryTitle: 'Udforsk kurser',
  entryDescription: 'Kurser, du kan tilmelde dig',
  searchCourses: 'Søg i kurser',
  emptyTitle: 'Ingen andre kurser',
  emptyDescription: 'Din organisation har ikke andre kurser åbne for dig.',
  searchNoResultsTitle: 'Ingen matchende kurser',
  searchNoResultsDescription: 'Ingen kursustitel indeholder “{query}”.',
  loadError: 'Kurserne blev ikke indlæst',
  courseLoadError: 'Kurset blev ikke indlæst',
  about: 'Om kurset',
  goals: 'Det lærer du',
  requirements: 'Forudsætninger',
  enroll: 'Tilmeld',
  goToCourse: 'Gå til kurset',
  enrolledToast: 'Du er tilmeldt {title}',
  enrollFailed: 'Du blev ikke tilmeldt',
  enrollFull: 'Kurset tager ikke imod nye deltagere lige nu. Kontakt din organisation.',
  enrollMembersOnly: 'Kun medlemmer af organisationen kan tilmelde sig. Bed en administrator om en invitation.',
  enrollUnavailable: 'Kurset kan ikke tilmeldes i appen.',
  paidNotAvailable: 'Kurset kan ikke tilmeldes i appen.',
  inviteOnly: 'Din organisation tilmelder deltagere til dette kursus.',
  originalPrice: 'Oprindelig pris {price}'
};
