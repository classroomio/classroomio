import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const pt: TranslatedMessages<typeof en> = {
  screenTitle: 'Conformidade',
  standingOverdue: 'Atrasado',
  standingInGracePeriod: 'Em período de carência',
  standingDueSoon: 'Prazo próximo',
  standingOpen: 'Ainda no prazo',
  standingUnscheduled: 'Sem prazo definido',
  standingCompliant: 'Em conformidade',
  standingWaived: 'Dispensado',
  statusOverdueByDays: { one: 'Atrasado há {count} dia', other: 'Atrasado há {count} dias' },
  statusGraceEndsToday: 'Em período de carência, termina hoje',
  statusGraceDaysLeft: {
    one: 'Em período de carência, resta {count} dia',
    other: 'Em período de carência, restam {count} dias'
  },
  statusDueToday: 'Prazo termina hoje',
  statusDueInDays: { one: 'Prazo termina em {count} dia', other: 'Prazo termina em {count} dias' },
  statusExpiresToday: 'Expira hoje',
  statusExpiresInDays: { one: 'Expira em {count} dia', other: 'Expira em {count} dias' },
  statusInProgress: 'Em andamento',
  statusNotStarted: 'Não iniciado',
  detailDeadline: 'Prazo: {date}',
  detailGracePeriodEnds: 'O período de carência termina em {date}',
  detailGracePeriodEnded: 'O período de carência terminou em {date}',
  detailValidUntil: 'Válido até {date}',
  detailWaiverEnds: 'A dispensa termina em {date}',
  detailLastCompleted: 'Concluído pela última vez em {date}',
  detailRenewsEvery: { one: 'Renova a cada {count} mês', other: 'Renova a cada {count} meses' },
  countOverdue: { one: '{count} atrasado', other: '{count} atrasados' },
  countInGracePeriod: { one: '{count} em período de carência', other: '{count} em período de carência' },
  countDueSoon: { one: '{count} com prazo próximo', other: '{count} com prazo próximo' },
  countToDo: { one: '{count} pendente', other: '{count} pendentes' },
  countCompliant: { one: '{count} em conformidade', other: '{count} em conformidade' },
  countWaived: { one: '{count} dispensado', other: '{count} dispensados' },
  summaryOutOf: { one: '{count} requisito', other: '{count} requisitos' },
  summaryOverdue: { one: '{count} de {total} está atrasado.', other: '{count} de {total} estão atrasados.' },
  summaryInGracePeriod: {
    one: '{count} de {total} passou do prazo e está em período de carência.',
    other: '{count} de {total} passaram do prazo e estão em período de carência.'
  },
  summaryDueSoon: {
    one: '{count} de {total} está com prazo próximo.',
    other: '{count} de {total} estão com prazo próximo.'
  },
  summaryCompliantWithToDo: {
    one: 'Nada está atrasado ou com prazo próximo. Falta concluir {count} requisito.',
    other: 'Nada está atrasado ou com prazo próximo. Faltam concluir {count} requisitos.'
  },
  summaryCompliantOne: 'Seu requisito está em dia.',
  summaryCompliantAll: { other: 'Todos os {count} requisitos estão em dia.' },
  summaryNone: 'Sua organização não atribuiu nenhum treinamento obrigatório a você.',
  alertOverdueTitle: { one: '{count} requisito atrasado', other: '{count} requisitos atrasados' },
  alertInGracePeriodTitle: {
    one: '{count} requisito em período de carência',
    other: '{count} requisitos em período de carência'
  },
  alertDueSoonTitle: { one: '{count} requisito com prazo próximo', other: '{count} requisitos com prazo próximo' },
  alertWasDue: {
    one: 'O prazo de {course} terminou há {count} dia.',
    other: 'O prazo de {course} terminou há {count} dias.'
  },
  alertGraceLeft: { one: 'Resta {count} dia de carência.', other: 'Restam {count} dias de carência.' },
  alertDueToday: 'O prazo de {course} termina hoje.',
  alertDueInDays: {
    one: 'O prazo de {course} termina em {count} dia.',
    other: 'O prazo de {course} termina em {count} dias.'
  },
  alertDueSoon: 'O prazo de {course} está próximo.',
  alertExpiresToday: '{course} expira hoje.',
  alertExpiresInDays: { one: '{course} expira em {count} dia.', other: '{course} expira em {count} dias.' },
  alertExpiresSoon: '{course} expira em breve.',
  alertHint: 'Abre a conformidade',
  loadError: 'Seu status de conformidade não foi carregado',
  emptyTitle: 'Nenhum requisito de conformidade',
  sectionNeedsAttention: 'Requer atenção',
  sectionToDo: 'Pendentes',
  certificates: 'Certificados',
  progressComplete: '{percent} concluído',
  countdownLeft: { one: 'dia restante', other: 'dias restantes' },
  countdownUntilRenewal: { one: 'dia até a renovação', other: 'dias até a renovação' },
  countdownLeftLabel: { one: '{count} dia restante', other: '{count} dias restantes' },
  countdownUntilRenewalLabel: { one: '{count} dia até a renovação', other: '{count} dias até a renovação' },
  openCourse: 'Abrir curso',
  resumeCourse: 'Continuar curso',
  startCourse: 'Iniciar curso',
  proof: 'Comprovante',
  proofLabel: 'Certificado de {course}'
};
