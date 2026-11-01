import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const pl: TranslatedMessages<typeof en> = {
  screenTitle: 'Odkrywaj',
  entryTitle: 'Odkrywaj kursy',
  entryDescription: 'Kursy, na które możesz się zapisać',
  searchCourses: 'Szukaj kursów',
  emptyTitle: 'Brak innych kursów',
  emptyDescription: 'Twoja organizacja nie udostępnia Ci innych kursów.',
  searchNoResultsTitle: 'Brak pasujących kursów',
  searchNoResultsDescription: 'Żaden tytuł kursu nie zawiera „{query}”.',
  loadError: 'Nie udało się wczytać kursów',
  courseLoadError: 'Nie udało się wczytać kursu',
  about: 'O kursie',
  goals: 'Czego się nauczysz',
  requirements: 'Wymagania',
  enroll: 'Zapisz się',
  goToCourse: 'Przejdź do kursu',
  enrolledToast: 'Zapisano Cię na kurs {title}',
  enrollFailed: 'Nie udało się zapisać na kurs',
  enrollFull: 'Ten kurs nie przyjmuje obecnie nowych uczestników. Skontaktuj się ze swoją organizacją.',
  enrollMembersOnly: 'Zapisać się mogą tylko członkowie tej organizacji. Poproś administratora o zaproszenie.',
  enrollUnavailable: 'Na ten kurs nie można zapisać się w aplikacji.',
  paidNotAvailable: 'Na ten kurs nie można zapisać się w aplikacji.',
  inviteOnly: 'Twoja organizacja zapisuje uczestników na ten kurs.',
  originalPrice: 'Cena pierwotna {price}'
};
