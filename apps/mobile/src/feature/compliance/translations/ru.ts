import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const ru: TranslatedMessages<typeof en> = {
  screenTitle: 'Соответствие',
  standingOverdue: 'Просрочено',
  standingInGracePeriod: 'В льготном периоде',
  standingDueSoon: 'Скоро срок',
  standingOpen: 'Срок ещё не наступил',
  standingUnscheduled: 'Срок не задан',
  standingCompliant: 'Соответствует',
  standingWaived: 'Освобождено',
  statusOverdueByDays: {
    one: 'Просрочено на {count} день',
    few: 'Просрочено на {count} дня',
    many: 'Просрочено на {count} дней',
    other: 'Просрочено на {count} дня'
  },
  statusGraceEndsToday: 'Льготный период, заканчивается сегодня',
  statusGraceDaysLeft: {
    one: 'Льготный период, остался {count} день',
    few: 'Льготный период, осталось {count} дня',
    many: 'Льготный период, осталось {count} дней',
    other: 'Льготный период, осталось {count} дня'
  },
  statusDueToday: 'Срок сегодня',
  statusDueInDays: {
    one: 'Срок через {count} день',
    few: 'Срок через {count} дня',
    many: 'Срок через {count} дней',
    other: 'Срок через {count} дня'
  },
  statusExpiresToday: 'Истекает сегодня',
  statusExpiresInDays: {
    one: 'Истекает через {count} день',
    few: 'Истекает через {count} дня',
    many: 'Истекает через {count} дней',
    other: 'Истекает через {count} дня'
  },
  statusInProgress: 'В процессе',
  statusNotStarted: 'Не начато',
  detailDeadline: 'Срок: {date}',
  detailGracePeriodEnds: 'Льготный период заканчивается {date}',
  detailGracePeriodEnded: 'Льготный период закончился {date}',
  detailValidUntil: 'Действует до {date}',
  detailWaiverEnds: 'Освобождение действует до {date}',
  detailLastCompleted: 'Последнее прохождение: {date}',
  detailRenewsEvery: {
    one: 'Продлевается раз в {count} месяц',
    few: 'Продлевается раз в {count} месяца',
    many: 'Продлевается раз в {count} месяцев',
    other: 'Продлевается раз в {count} месяца'
  },
  summaryOutOf: {
    one: '{count} требования',
    few: '{count} требований',
    many: '{count} требований',
    other: '{count} требования'
  },
  summaryOverdue: {
    one: '{count} из {total} просрочено.',
    few: '{count} из {total} просрочены.',
    many: '{count} из {total} просрочено.',
    other: '{count} из {total} просрочено.'
  },
  summaryInGracePeriod: {
    one: '{count} из {total} просрочено и находится в льготном периоде.',
    few: '{count} из {total} просрочены и находятся в льготном периоде.',
    many: '{count} из {total} просрочено и находится в льготном периоде.',
    other: '{count} из {total} просрочено и находится в льготном периоде.'
  },
  summaryDueSoon: {
    one: 'У {count} из {total} скоро наступает срок.',
    few: 'У {count} из {total} скоро наступает срок.',
    many: 'У {count} из {total} скоро наступает срок.',
    other: 'У {count} из {total} скоро наступает срок.'
  },
  summaryCompliantWithToDo: {
    one: 'Просроченных требований и требований со скорым сроком нет. Осталось выполнить {count} требование.',
    few: 'Просроченных требований и требований со скорым сроком нет. Осталось выполнить {count} требования.',
    many: 'Просроченных требований и требований со скорым сроком нет. Осталось выполнить {count} требований.',
    other: 'Просроченных требований и требований со скорым сроком нет. Осталось выполнить {count} требования.'
  },
  summaryCompliantOne: 'Ваше требование выполнено.',
  summaryCompliantAll: {
    one: 'Все {count} требование выполнены.',
    few: 'Все {count} требования выполнены.',
    many: 'Все {count} требований выполнены.',
    other: 'Все {count} требования выполнены.'
  },
  summaryNone: 'Ваша организация не назначила вам обязательного обучения.',
  alertOverdueTitle: {
    one: '{count} требование просрочено',
    few: '{count} требования просрочены',
    many: '{count} требований просрочено',
    other: '{count} требования просрочено'
  },
  alertInGracePeriodTitle: {
    one: '{count} требование в льготном периоде',
    few: '{count} требования в льготном периоде',
    many: '{count} требований в льготном периоде',
    other: '{count} требования в льготном периоде'
  },
  alertDueSoonTitle: {
    one: 'Скоро срок: {count} требование',
    few: 'Скоро срок: {count} требования',
    many: 'Скоро срок: {count} требований',
    other: 'Скоро срок: {count} требования'
  },
  alertWasDue: {
    one: 'Срок по курсу «{course}» истёк {count} день назад.',
    few: 'Срок по курсу «{course}» истёк {count} дня назад.',
    many: 'Срок по курсу «{course}» истёк {count} дней назад.',
    other: 'Срок по курсу «{course}» истёк {count} дня назад.'
  },
  alertGraceLeft: {
    one: 'До конца льготного периода {count} день.',
    few: 'До конца льготного периода {count} дня.',
    many: 'До конца льготного периода {count} дней.',
    other: 'До конца льготного периода {count} дня.'
  },
  alertDueToday: 'Срок по курсу «{course}» — сегодня.',
  alertDueInDays: {
    one: 'Срок по курсу «{course}» — через {count} день.',
    few: 'Срок по курсу «{course}» — через {count} дня.',
    many: 'Срок по курсу «{course}» — через {count} дней.',
    other: 'Срок по курсу «{course}» — через {count} дня.'
  },
  alertDueSoon: 'Срок по курсу «{course}» скоро наступит.',
  alertExpiresToday: 'Срок действия по курсу «{course}» истекает сегодня.',
  alertExpiresInDays: {
    one: 'Срок действия по курсу «{course}» истекает через {count} день.',
    few: 'Срок действия по курсу «{course}» истекает через {count} дня.',
    many: 'Срок действия по курсу «{course}» истекает через {count} дней.',
    other: 'Срок действия по курсу «{course}» истекает через {count} дня.'
  },
  alertExpiresSoon: 'Срок действия по курсу «{course}» скоро истекает.',
  alertHint: 'Открывает раздел соответствия',
  loadError: 'Не удалось загрузить статус соответствия',
  emptyTitle: 'Нет обязательных требований',
  sectionNeedsAttention: 'Требует внимания',
  sectionToDo: 'К выполнению',
  certificates: 'Сертификаты',
  progressComplete: 'Выполнено {percent}',
  countdownLeft: { one: 'день остался', few: 'дня осталось', many: 'дней осталось', other: 'дня осталось' },
  countdownUntilRenewal: {
    one: 'день до продления',
    few: 'дня до продления',
    many: 'дней до продления',
    other: 'дня до продления'
  },
  countdownLeftLabel: {
    one: 'Остался {count} день',
    few: 'Осталось {count} дня',
    many: 'Осталось {count} дней',
    other: 'Осталось {count} дня'
  },
  countdownUntilRenewalLabel: {
    one: '{count} день до продления',
    few: '{count} дня до продления',
    many: '{count} дней до продления',
    other: '{count} дня до продления'
  },
  openCourse: 'Открыть курс',
  resumeCourse: 'Продолжить курс',
  startCourse: 'Начать курс',
  proof: 'Подтверждение',
  proofLabel: 'Сертификат по курсу «{course}»',
  standingOnTrack: 'Всё по плану',
  nextDeadline: 'Ближайший срок'
};
