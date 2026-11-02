import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const it: TranslatedMessages<typeof en> = {
  screenTitle: 'Conformità',
  standingOverdue: 'In ritardo',
  standingInGracePeriod: 'In periodo di tolleranza',
  standingDueSoon: 'Scadenza vicina',
  standingOpen: 'Non ancora in scadenza',
  standingUnscheduled: 'Nessuna scadenza impostata',
  standingCompliant: 'Conforme',
  standingWaived: 'Esentato',
  statusOverdueByDays: { one: 'In ritardo di {count} giorno', other: 'In ritardo di {count} giorni' },
  statusGraceEndsToday: 'In periodo di tolleranza, termina oggi',
  statusGraceDaysLeft: {
    one: 'In periodo di tolleranza, manca {count} giorno',
    other: 'In periodo di tolleranza, mancano {count} giorni'
  },
  statusDueToday: 'Da completare oggi',
  statusDueInDays: { one: 'Da completare entro {count} giorno', other: 'Da completare entro {count} giorni' },
  statusExpiresToday: 'Scade oggi',
  statusExpiresInDays: { one: 'Scade tra {count} giorno', other: 'Scade tra {count} giorni' },
  statusInProgress: 'In corso',
  statusNotStarted: 'Non iniziato',
  detailDeadline: 'Scadenza: {date}',
  detailGracePeriodEnds: 'Il periodo di tolleranza termina il {date}',
  detailGracePeriodEnded: 'Il periodo di tolleranza è terminato il {date}',
  detailValidUntil: 'Valido fino al {date}',
  detailWaiverEnds: 'L’esenzione termina il {date}',
  detailLastCompleted: 'Ultimo completamento il {date}',
  detailRenewsEvery: { one: 'Si rinnova ogni mese', other: 'Si rinnova ogni {count} mesi' },
  summaryOutOf: { one: '{count} requisito', other: '{count} requisiti' },
  summaryOverdue: { one: '{count} di {total} è in ritardo.', other: '{count} di {total} sono in ritardo.' },
  summaryInGracePeriod: {
    one: '{count} di {total} ha superato la scadenza ed è nel periodo di tolleranza.',
    other: '{count} di {total} hanno superato la scadenza e sono nel periodo di tolleranza.'
  },
  summaryDueSoon: {
    one: '{count} di {total} ha la scadenza vicina.',
    other: '{count} di {total} hanno la scadenza vicina.'
  },
  summaryCompliantWithToDo: {
    one: 'Nulla è in ritardo o con scadenza vicina. Resta da completare {count} requisito.',
    other: 'Nulla è in ritardo o con scadenza vicina. Restano da completare {count} requisiti.'
  },
  summaryCompliantOne: 'Il tuo requisito è in regola.',
  summaryCompliantAll: { other: 'Tutti i {count} requisiti sono in regola.' },
  summaryNone: 'La tua organizzazione non ti ha assegnato alcuna formazione obbligatoria.',
  alertOverdueTitle: { one: '{count} requisito in ritardo', other: '{count} requisiti in ritardo' },
  alertInGracePeriodTitle: {
    one: '{count} requisito in periodo di tolleranza',
    other: '{count} requisiti in periodo di tolleranza'
  },
  alertDueSoonTitle: { one: '{count} requisito con scadenza vicina', other: '{count} requisiti con scadenza vicina' },
  alertWasDue: {
    one: 'La scadenza di {course} era {count} giorno fa.',
    other: 'La scadenza di {course} era {count} giorni fa.'
  },
  alertGraceLeft: { one: 'Resta {count} giorno di tolleranza.', other: 'Restano {count} giorni di tolleranza.' },
  alertDueToday: '{course} va completato oggi.',
  alertDueInDays: {
    one: '{course} va completato entro {count} giorno.',
    other: '{course} va completato entro {count} giorni.'
  },
  alertDueSoon: '{course} va completato a breve.',
  alertExpiresToday: '{course} scade oggi.',
  alertExpiresInDays: { one: '{course} scade tra {count} giorno.', other: '{course} scade tra {count} giorni.' },
  alertExpiresSoon: '{course} scade a breve.',
  alertHint: 'Apre la conformità',
  loadError: 'Il tuo stato di conformità non è stato caricato',
  emptyTitle: 'Nessun requisito di conformità',
  sectionNeedsAttention: 'Richiede attenzione',
  sectionToDo: 'Da fare',
  certificates: 'Certificati',
  progressComplete: '{percent} completato',
  countdownLeft: { one: 'giorno rimasto', other: 'giorni rimasti' },
  countdownUntilRenewal: { one: 'giorno al rinnovo', other: 'giorni al rinnovo' },
  countdownLeftLabel: { one: '{count} giorno rimasto', other: '{count} giorni rimasti' },
  countdownUntilRenewalLabel: { one: '{count} giorno al rinnovo', other: '{count} giorni al rinnovo' },
  openCourse: 'Apri corso',
  resumeCourse: 'Riprendi corso',
  startCourse: 'Inizia corso',
  proof: 'Attestato',
  proofLabel: 'Certificato per {course}',
  standingOnTrack: 'In regola',
  nextDeadline: 'Prossima scadenza'
};
