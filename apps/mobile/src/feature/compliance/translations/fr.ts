import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const fr: TranslatedMessages<typeof en> = {
  screenTitle: 'Conformité',
  standingOverdue: 'En retard',
  standingInGracePeriod: 'En période de grâce',
  standingDueSoon: 'Échéance proche',
  standingOpen: 'Échéance non atteinte',
  standingUnscheduled: 'Aucune échéance définie',
  standingCompliant: 'Conforme',
  standingWaived: 'Dispensé',
  statusOverdueByDays: { one: 'En retard de {count} jour', other: 'En retard de {count} jours' },
  statusGraceEndsToday: 'En période de grâce, se termine aujourd’hui',
  statusGraceDaysLeft: {
    one: 'En période de grâce, {count} jour restant',
    other: 'En période de grâce, {count} jours restants'
  },
  statusDueToday: 'Échéance aujourd’hui',
  statusDueInDays: { one: 'Échéance dans {count} jour', other: 'Échéance dans {count} jours' },
  statusExpiresToday: 'Expire aujourd’hui',
  statusExpiresInDays: { one: 'Expire dans {count} jour', other: 'Expire dans {count} jours' },
  statusInProgress: 'En cours',
  statusNotStarted: 'Non commencé',
  detailDeadline: 'Échéance : {date}',
  detailGracePeriodEnds: 'Fin de la période de grâce le {date}',
  detailGracePeriodEnded: 'Période de grâce terminée le {date}',
  detailValidUntil: 'Valable jusqu’au {date}',
  detailWaiverEnds: 'Fin de la dispense le {date}',
  detailLastCompleted: 'Dernière réalisation le {date}',
  detailRenewsEvery: { one: 'Renouvellement tous les {count} mois', other: 'Renouvellement tous les {count} mois' },
  summaryOutOf: { one: '{count} exigence', other: '{count} exigences' },
  summaryOverdue: { one: '{count} sur {total} est en retard.', other: '{count} sur {total} sont en retard.' },
  summaryInGracePeriod: {
    one: '{count} sur {total} a dépassé l’échéance et est en période de grâce.',
    other: '{count} sur {total} ont dépassé l’échéance et sont en période de grâce.'
  },
  summaryDueSoon: {
    one: '{count} sur {total} arrive bientôt à échéance.',
    other: '{count} sur {total} arrivent bientôt à échéance.'
  },
  summaryCompliantWithToDo: {
    one: 'Rien n’est en retard ni à échéance proche. {count} exigence reste à accomplir.',
    other: 'Rien n’est en retard ni à échéance proche. {count} exigences restent à accomplir.'
  },
  summaryCompliantOne: 'Votre exigence est à jour.',
  summaryCompliantAll: { one: 'Les {count} exigences sont à jour.', other: 'Les {count} exigences sont à jour.' },
  summaryNone: 'Votre organisation ne vous a attribué aucune formation obligatoire.',
  loadError: 'Votre statut de conformité n’a pas pu être chargé',
  emptyTitle: 'Aucune exigence de conformité',
  sectionNeedsAttention: 'Action requise',
  sectionToDo: 'À faire',
  certificates: 'Certificats',
  progressComplete: '{percent} terminé',
  countdownLeft: { one: 'jour restant', other: 'jours restants' },
  countdownUntilRenewal: { one: 'jour avant renouvellement', other: 'jours avant renouvellement' },
  countdownLeftLabel: { one: '{count} jour restant', other: '{count} jours restants' },
  countdownUntilRenewalLabel: {
    one: '{count} jour avant le renouvellement',
    other: '{count} jours avant le renouvellement'
  },
  openCourse: 'Ouvrir le cours',
  resumeCourse: 'Reprendre le cours',
  startCourse: 'Commencer le cours',
  proof: 'Justificatif',
  proofLabel: 'Certificat pour {course}',
  standingOnTrack: 'Dans les temps',
  nextDeadline: 'Prochaine échéance'
};
