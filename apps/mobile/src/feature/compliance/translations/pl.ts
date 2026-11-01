import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const pl: TranslatedMessages<typeof en> = {
  screenTitle: 'Zgodność',
  standingOverdue: 'Po terminie',
  standingInGracePeriod: 'W okresie karencji',
  standingDueSoon: 'Termin wkrótce',
  standingOpen: 'Przed terminem',
  standingUnscheduled: 'Brak terminu',
  standingCompliant: 'Spełnione',
  standingWaived: 'Zwolniono',
  statusOverdueByDays: {
    one: '{count} dzień po terminie',
    few: '{count} dni po terminie',
    many: '{count} dni po terminie',
    other: '{count} dnia po terminie'
  },
  statusGraceEndsToday: 'W okresie karencji, kończy się dziś',
  statusGraceDaysLeft: {
    one: 'W okresie karencji, został {count} dzień',
    few: 'W okresie karencji, zostały {count} dni',
    many: 'W okresie karencji, zostało {count} dni',
    other: 'W okresie karencji, zostało {count} dnia'
  },
  statusDueToday: 'Termin mija dziś',
  statusDueInDays: {
    one: 'Termin za {count} dzień',
    few: 'Termin za {count} dni',
    many: 'Termin za {count} dni',
    other: 'Termin za {count} dnia'
  },
  statusExpiresToday: 'Wygasa dziś',
  statusExpiresInDays: {
    one: 'Wygasa za {count} dzień',
    few: 'Wygasa za {count} dni',
    many: 'Wygasa za {count} dni',
    other: 'Wygasa za {count} dnia'
  },
  statusInProgress: 'W toku',
  statusNotStarted: 'Nierozpoczęte',
  detailDeadline: 'Termin: {date}',
  detailGracePeriodEnds: 'Okres karencji kończy się {date}',
  detailGracePeriodEnded: 'Okres karencji zakończył się {date}',
  detailValidUntil: 'Ważne do {date}',
  detailWaiverEnds: 'Zwolnienie kończy się {date}',
  detailLastCompleted: 'Ostatnio ukończono {date}',
  detailRenewsEvery: {
    one: 'Odnawiane co miesiąc',
    few: 'Odnawiane co {count} miesiące',
    many: 'Odnawiane co {count} miesięcy',
    other: 'Odnawiane co {count} miesiąca'
  },
  countOverdue: {
    one: '{count} po terminie',
    few: '{count} po terminie',
    many: '{count} po terminie',
    other: '{count} po terminie'
  },
  countInGracePeriod: {
    one: '{count} w okresie karencji',
    few: '{count} w okresie karencji',
    many: '{count} w okresie karencji',
    other: '{count} w okresie karencji'
  },
  countDueSoon: {
    one: '{count} z bliskim terminem',
    few: '{count} z bliskim terminem',
    many: '{count} z bliskim terminem',
    other: '{count} z bliskim terminem'
  },
  countToDo: {
    one: '{count} do zrobienia',
    few: '{count} do zrobienia',
    many: '{count} do zrobienia',
    other: '{count} do zrobienia'
  },
  countCompliant: {
    one: '{count} spełnione',
    few: '{count} spełnione',
    many: '{count} spełnionych',
    other: '{count} spełnionego'
  },
  countWaived: {
    one: '{count} ze zwolnieniem',
    few: '{count} ze zwolnieniem',
    many: '{count} ze zwolnieniem',
    other: '{count} ze zwolnieniem'
  },
  summaryOutOf: {
    one: '{count} wymagania',
    few: '{count} wymagań',
    many: '{count} wymagań',
    other: '{count} wymagania'
  },
  summaryOverdue: {
    one: '{count} z {total} jest po terminie.',
    few: '{count} z {total} są po terminie.',
    many: '{count} z {total} jest po terminie.',
    other: '{count} z {total} jest po terminie.'
  },
  summaryInGracePeriod: {
    one: '{count} z {total} przekroczyło termin i jest w okresie karencji.',
    few: '{count} z {total} przekroczyły termin i są w okresie karencji.',
    many: '{count} z {total} przekroczyło termin i jest w okresie karencji.',
    other: '{count} z {total} przekroczyło termin i jest w okresie karencji.'
  },
  summaryDueSoon: {
    one: '{count} z {total} ma wkrótce termin.',
    few: '{count} z {total} mają wkrótce termin.',
    many: '{count} z {total} ma wkrótce termin.',
    other: '{count} z {total} ma wkrótce termin.'
  },
  summaryCompliantWithToDo: {
    one: 'Nic nie jest po terminie ani nie ma bliskiego terminu. Pozostało {count} wymaganie do spełnienia.',
    few: 'Nic nie jest po terminie ani nie ma bliskiego terminu. Pozostały {count} wymagania do spełnienia.',
    many: 'Nic nie jest po terminie ani nie ma bliskiego terminu. Pozostało {count} wymagań do spełnienia.',
    other: 'Nic nie jest po terminie ani nie ma bliskiego terminu. Pozostało {count} wymagania do spełnienia.'
  },
  summaryCompliantOne: 'Twoje wymaganie jest spełnione.',
  summaryCompliantAll: {
    few: 'Wszystkie {count} wymagania są spełnione.',
    many: 'Wszystkich {count} wymagań jest spełnionych.',
    other: 'Wszystkie {count} wymagania są spełnione.'
  },
  summaryNone: 'Twoja organizacja nie przypisała Ci żadnych obowiązkowych szkoleń.',
  alertOverdueTitle: {
    one: '{count} wymaganie po terminie',
    few: '{count} wymagania po terminie',
    many: '{count} wymagań po terminie',
    other: '{count} wymagania po terminie'
  },
  alertInGracePeriodTitle: {
    one: '{count} wymaganie w okresie karencji',
    few: '{count} wymagania w okresie karencji',
    many: '{count} wymagań w okresie karencji',
    other: '{count} wymagania w okresie karencji'
  },
  alertDueSoonTitle: {
    one: '{count} wymaganie z bliskim terminem',
    few: '{count} wymagania z bliskim terminem',
    many: '{count} wymagań z bliskim terminem',
    other: '{count} wymagania z bliskim terminem'
  },
  alertWasDue: {
    one: 'Termin dla kursu {course} minął {count} dzień temu.',
    few: 'Termin dla kursu {course} minął {count} dni temu.',
    many: 'Termin dla kursu {course} minął {count} dni temu.',
    other: 'Termin dla kursu {course} minął {count} dnia temu.'
  },
  alertGraceLeft: {
    one: 'Pozostał {count} dzień karencji.',
    few: 'Pozostały {count} dni karencji.',
    many: 'Pozostało {count} dni karencji.',
    other: 'Pozostało {count} dnia karencji.'
  },
  alertDueToday: 'Termin dla kursu {course} mija dziś.',
  alertDueInDays: {
    one: 'Termin dla kursu {course} mija za {count} dzień.',
    few: 'Termin dla kursu {course} mija za {count} dni.',
    many: 'Termin dla kursu {course} mija za {count} dni.',
    other: 'Termin dla kursu {course} mija za {count} dnia.'
  },
  alertDueSoon: 'Termin dla kursu {course} wkrótce mija.',
  alertExpiresToday: 'Ważność kursu {course} wygasa dziś.',
  alertExpiresInDays: {
    one: 'Ważność kursu {course} wygasa za {count} dzień.',
    few: 'Ważność kursu {course} wygasa za {count} dni.',
    many: 'Ważność kursu {course} wygasa za {count} dni.',
    other: 'Ważność kursu {course} wygasa za {count} dnia.'
  },
  alertExpiresSoon: 'Ważność kursu {course} wkrótce wygasa.',
  alertHint: 'Otwiera zgodność',
  loadError: 'Nie udało się wczytać statusu zgodności',
  emptyTitle: 'Brak wymagań dotyczących zgodności',
  sectionNeedsAttention: 'Wymaga uwagi',
  sectionToDo: 'Do zrobienia',
  certificates: 'Certyfikaty',
  progressComplete: 'Ukończono {percent}',
  countdownLeft: { one: 'dzień pozostał', few: 'dni pozostały', many: 'dni pozostało', other: 'dnia pozostało' },
  countdownUntilRenewal: {
    one: 'dzień do odnowienia',
    few: 'dni do odnowienia',
    many: 'dni do odnowienia',
    other: 'dnia do odnowienia'
  },
  countdownLeftLabel: {
    one: 'Pozostał {count} dzień',
    few: 'Pozostały {count} dni',
    many: 'Pozostało {count} dni',
    other: 'Pozostało {count} dnia'
  },
  countdownUntilRenewalLabel: {
    one: '{count} dzień do odnowienia',
    few: '{count} dni do odnowienia',
    many: '{count} dni do odnowienia',
    other: '{count} dnia do odnowienia'
  },
  openCourse: 'Otwórz kurs',
  resumeCourse: 'Wznów kurs',
  startCourse: 'Rozpocznij kurs',
  proof: 'Potwierdzenie',
  proofLabel: 'Certyfikat za kurs {course}'
};
