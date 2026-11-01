import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const es: TranslatedMessages<typeof en> = {
  screenTitle: 'Cumplimiento',
  standingOverdue: 'Vencido',
  standingInGracePeriod: 'En periodo de gracia',
  standingDueSoon: 'Vence pronto',
  standingOpen: 'Aún no vence',
  standingUnscheduled: 'Sin fecha límite',
  standingCompliant: 'Cumple',
  standingWaived: 'Eximido',
  statusOverdueByDays: { one: 'Vencido hace {count} día', other: 'Vencido hace {count} días' },
  statusGraceEndsToday: 'En periodo de gracia, termina hoy',
  statusGraceDaysLeft: {
    one: 'En periodo de gracia, queda {count} día',
    other: 'En periodo de gracia, quedan {count} días'
  },
  statusDueToday: 'Vence hoy',
  statusDueInDays: { one: 'Vence en {count} día', other: 'Vence en {count} días' },
  statusExpiresToday: 'Caduca hoy',
  statusExpiresInDays: { one: 'Caduca en {count} día', other: 'Caduca en {count} días' },
  statusInProgress: 'En curso',
  statusNotStarted: 'Sin empezar',
  detailDeadline: 'Fecha límite: {date}',
  detailGracePeriodEnds: 'El periodo de gracia termina el {date}',
  detailGracePeriodEnded: 'El periodo de gracia terminó el {date}',
  detailValidUntil: 'Válido hasta el {date}',
  detailWaiverEnds: 'La exención termina el {date}',
  detailLastCompleted: 'Completado por última vez el {date}',
  detailRenewsEvery: { one: 'Se renueva cada mes', other: 'Se renueva cada {count} meses' },
  summaryOutOf: { one: '{count} requisito', other: '{count} requisitos' },
  summaryOverdue: { one: '{count} de {total} está vencido.', other: '{count} de {total} están vencidos.' },
  summaryInGracePeriod: {
    one: '{count} de {total} superó la fecha límite y está en periodo de gracia.',
    other: '{count} de {total} superaron la fecha límite y están en periodo de gracia.'
  },
  summaryDueSoon: { one: '{count} de {total} vence pronto.', other: '{count} de {total} vencen pronto.' },
  summaryCompliantWithToDo: {
    one: 'Nada está vencido ni vence pronto. Queda {count} requisito por completar.',
    other: 'Nada está vencido ni vence pronto. Quedan {count} requisitos por completar.'
  },
  summaryCompliantOne: 'Tu requisito está al día.',
  summaryCompliantAll: { other: 'Los {count} requisitos están al día.' },
  summaryNone: 'Tu organización no te ha asignado ninguna formación obligatoria.',
  alertOverdueTitle: { one: '{count} requisito vencido', other: '{count} requisitos vencidos' },
  alertInGracePeriodTitle: {
    one: '{count} requisito en periodo de gracia',
    other: '{count} requisitos en periodo de gracia'
  },
  alertDueSoonTitle: { one: '{count} requisito vence pronto', other: '{count} requisitos vencen pronto' },
  alertWasDue: { one: '{course} venció hace {count} día.', other: '{course} venció hace {count} días.' },
  alertGraceLeft: {
    one: 'Queda {count} día de periodo de gracia.',
    other: 'Quedan {count} días de periodo de gracia.'
  },
  alertDueToday: '{course} vence hoy.',
  alertDueInDays: { one: '{course} vence en {count} día.', other: '{course} vence en {count} días.' },
  alertDueSoon: '{course} vence pronto.',
  alertExpiresToday: '{course} caduca hoy.',
  alertExpiresInDays: { one: '{course} caduca en {count} día.', other: '{course} caduca en {count} días.' },
  alertExpiresSoon: '{course} caduca pronto.',
  alertHint: 'Abre cumplimiento',
  loadError: 'Tu estado de cumplimiento no se cargó',
  emptyTitle: 'No hay requisitos de cumplimiento',
  sectionNeedsAttention: 'Requiere atención',
  sectionToDo: 'Pendientes',
  certificates: 'Certificados',
  progressComplete: '{percent} completado',
  countdownLeft: { one: 'día restante', other: 'días restantes' },
  countdownUntilRenewal: { one: 'día para la renovación', other: 'días para la renovación' },
  countdownLeftLabel: { one: 'Queda {count} día', other: 'Quedan {count} días' },
  countdownUntilRenewalLabel: { one: '{count} día para la renovación', other: '{count} días para la renovación' },
  openCourse: 'Abrir curso',
  resumeCourse: 'Continuar curso',
  startCourse: 'Empezar curso',
  proof: 'Comprobante',
  proofLabel: 'Certificado de {course}',
  standingOnTrack: 'Al día',
  nextDeadline: 'Próxima fecha límite'
};
