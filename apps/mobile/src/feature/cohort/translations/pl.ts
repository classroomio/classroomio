import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const pl: TranslatedMessages<typeof en> = {
  cohorts: 'Kohorty',
  cohortCount: { one: '{count} kohorta', few: '{count} kohorty', many: '{count} kohort', other: '{count} kohorty' },
  courseCount: { one: '{count} kurs', few: '{count} kursy', many: '{count} kursów', other: '{count} kursu' },
  learnerCount: {
    one: '{count} uczestnik',
    few: '{count} uczestników',
    many: '{count} uczestników',
    other: '{count} uczestnika'
  },
  peopleCount: { one: '{count} osoba', few: '{count} osoby', many: '{count} osób', other: '{count} osoby' },
  cohortsLoadError: 'Nie udało się wczytać Twoich kohort',
  cohortLoadError: 'Nie udało się wczytać kohorty',
  noCohortsTitle: 'Brak kohort',
  noCohortsDescription: 'Nie należysz do żadnej kohorty w tej organizacji.',
  goals: 'Cele',
  goalProgress: 'Ukończono {completed} z {required}',
  goalDue: 'Termin {date}, {relative}',
  goalNotStarted: 'Nie rozpoczęto',
  goalInProgress: 'W toku',
  goalCompleted: 'Ukończono',
  goalAtRisk: 'Zagrożony',
  goalOverdue: 'Po terminie',
  goalWaived: 'Zwolniono',
  courses: 'Kursy',
  announcements: 'Ogłoszenia',
  announcement: 'Ogłoszenie',
  seeAll: 'Zobacz wszystkie',
  noAnnouncementsTitle: 'Brak ogłoszeń',
  noAnnouncementsDescription: 'Zespół kohorty nie opublikował jeszcze żadnych ogłoszeń.',
  announcementsLoadError: 'Nie udało się wczytać ogłoszeń',
  cohortTeam: 'Zespół kohorty',
  formerMember: 'Były członek',
  announcementBy: 'Ogłoszenie od {author}',
  pinned: 'Przypięte',
  commentCount: {
    one: '{count} komentarz',
    few: '{count} komentarze',
    many: '{count} komentarzy',
    other: '{count} komentarza'
  },
  comments: 'Komentarze',
  noCommentsYet: 'Brak komentarzy.',
  commentsLoadError: 'Nie udało się wczytać komentarzy',
  writeComment: 'Napisz komentarz',
  commentInputLabel: 'Komentarz',
  postComment: 'Opublikuj komentarz',
  commentFailed: 'Nie opublikowano komentarza',
  commentOfflineTitle: 'Jesteś offline',
  commentOfflineDescription: 'Połącz się z internetem, aby komentować.',
  reactionFailed: 'Nie zapisano reakcji',
  announcementMissing: 'To ogłoszenie nie jest już dostępne'
};
