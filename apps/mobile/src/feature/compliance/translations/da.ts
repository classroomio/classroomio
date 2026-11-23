import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const da: TranslatedMessages<typeof en> = {
  screenTitle: 'Overholdelse',
  standingOverdue: 'Overskredet',
  standingInGracePeriod: 'I henstandsperiode',
  standingDueSoon: 'Frist snart',
  standingOpen: 'Fristen er ikke nået',
  standingUnscheduled: 'Ingen frist angivet',
  standingCompliant: 'Overholdt',
  standingWaived: 'Fritaget',
  statusOverdueByDays: { one: 'Overskredet med {count} dag', other: 'Overskredet med {count} dage' },
  statusGraceEndsToday: 'I henstandsperiode, slutter i dag',
  statusGraceDaysLeft: {
    one: 'I henstandsperiode, {count} dag tilbage',
    other: 'I henstandsperiode, {count} dage tilbage'
  },
  statusDueToday: 'Frist i dag',
  statusDueInDays: { one: 'Frist om {count} dag', other: 'Frist om {count} dage' },
  statusExpiresToday: 'Udløber i dag',
  statusExpiresInDays: { one: 'Udløber om {count} dag', other: 'Udløber om {count} dage' },
  statusInProgress: 'I gang',
  statusNotStarted: 'Ikke startet',
  detailDeadline: 'Frist {date}',
  detailGracePeriodEnds: 'Henstandsperioden slutter {date}',
  detailGracePeriodEnded: 'Henstandsperioden sluttede {date}',
  detailValidUntil: 'Gyldig til {date}',
  detailWaiverEnds: 'Fritagelsen slutter {date}',
  detailLastCompleted: 'Senest gennemført {date}',
  detailRenewsEvery: { one: 'Fornyes hver måned', other: 'Fornyes hver {count}. måned' },
  summaryOutOf: { one: '{count} krav', other: '{count} krav' },
  summaryOverdue: { one: '{count} af {total} er overskredet.', other: '{count} af {total} er overskredet.' },
  summaryInGracePeriod: {
    one: '{count} af {total} har overskredet fristen og er i henstandsperioden.',
    other: '{count} af {total} har overskredet fristen og er i henstandsperioden.'
  },
  summaryDueSoon: { one: '{count} af {total} har frist snart.', other: '{count} af {total} har frist snart.' },
  summaryCompliantWithToDo: {
    one: 'Intet er overskredet eller har frist snart. {count} krav mangler stadig.',
    other: 'Intet er overskredet eller har frist snart. {count} krav mangler stadig.'
  },
  summaryCompliantOne: 'Dit krav er opfyldt.',
  summaryCompliantAll: { other: 'Alle {count} krav er opfyldt.' },
  summaryNone: 'Din organisation har ikke tildelt dig nogen obligatorisk træning.',
  loadError: 'Din overholdelsesstatus blev ikke indlæst',
  emptyTitle: 'Ingen overholdelseskrav',
  sectionNeedsAttention: 'Kræver handling',
  sectionToDo: 'Mangler',
  certificates: 'Certifikater',
  progressComplete: '{percent} gennemført',
  countdownLeft: { one: 'dag tilbage', other: 'dage tilbage' },
  countdownUntilRenewal: { one: 'dag til fornyelse', other: 'dage til fornyelse' },
  countdownLeftLabel: { one: '{count} dag tilbage', other: '{count} dage tilbage' },
  countdownUntilRenewalLabel: { one: '{count} dag til fornyelse', other: '{count} dage til fornyelse' },
  openCourse: 'Åbn kursus',
  resumeCourse: 'Fortsæt kursus',
  startCourse: 'Start kursus',
  proof: 'Bevis',
  proofLabel: 'Certifikat for {course}',
  standingOnTrack: 'På rette spor',
  nextDeadline: 'Næste frist'
};
