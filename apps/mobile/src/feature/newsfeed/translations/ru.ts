import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const ru: TranslatedMessages<typeof en> = {
  screenTitleNewsfeed: 'Лента новостей',
  screenTitlePost: 'Публикация',
  turnedOffTitle: 'Лента новостей отключена',
  turnedOffDescription: 'Ваша организация отключила ленты новостей курсов для учащихся.',
  offlineFeed: 'Это публикации, сохранённые при последнем посещении. Для реакций и комментариев нужно подключение.',
  refreshFailed: 'Не удалось обновить публикации',
  loadFailed: 'Не удалось загрузить ленту новостей',
  emptyTitle: 'Публикаций пока нет',
  emptyDescription: 'Объявления и новости от команды курса публикуются в ленте новостей.',
  courseTeam: 'Команда курса',
  postBy: 'Публикация: {author}',
  postByCourseTeam: 'Публикация команды курса',
  pinned: 'Закреплено',
  pinnedPost: 'Закреплённая публикация',
  commentCount: {
    one: '{count} комментарий',
    few: '{count} комментария',
    many: '{count} комментариев',
    other: '{count} комментария'
  },
  noCommentsYet: 'Комментариев пока нет',
  reactionClap: 'Аплодисменты',
  reactionSmile: 'Улыбка',
  reactionThumbsUp: 'Палец вверх',
  reactionThumbsDown: 'Палец вниз',
  reactionLabel: '{reaction}, {count}',
  reactionLabelMine: '{reaction}, {count}, ваша реакция',
  addReaction: 'Добавить реакцию',
  reactToPost: 'Реакция на публикацию',
  reactionFailed: 'Не удалось сохранить реакцию',
  formerMember: 'Бывший участник',
  replyingTo: 'Ответ для {name}',
  reply: 'Ответить',
  showReplies: {
    one: 'Показать {count} ответ',
    few: 'Показать {count} ответа',
    many: 'Показать {count} ответов',
    other: 'Показать {count} ответа'
  },
  hideRepliesLabel: {
    one: 'Скрыть {count} ответ',
    few: 'Скрыть {count} ответа',
    many: 'Скрыть {count} ответов',
    other: 'Скрыть {count} ответа'
  },
  hideReplies: 'Скрыть ответы',
  showMoreReplies: {
    one: 'Показать ещё {count} ответ',
    few: 'Показать ещё {count} ответа',
    many: 'Показать ещё {count} ответов',
    other: 'Показать ещё {count} ответа'
  },
  commentActions: 'Действия с комментарием',
  postLoadFailed: 'Не удалось загрузить публикацию',
  backToNewsfeed: 'Вернуться в ленту новостей',
  showOlderComments: 'Показать более ранние комментарии',
  commentsLoadFailed: 'Не удалось загрузить комментарии',
  commentOfflineTitle: 'Для комментариев нужно подключение',
  commentOfflineDescription:
    'Вы можете читать публикацию и комментарии к ней. Подключитесь к сети, чтобы комментировать или отвечать.',
  replyTargetFallback: 'этот комментарий',
  editingComment: 'Редактирование комментария',
  writeReply: 'Напишите ответ',
  writeComment: 'Напишите комментарий',
  commentInputLabel: 'Комментарий',
  editCommentInputLabel: 'Изменить комментарий',
  postComment: 'Отправить комментарий',
  saveComment: 'Сохранить комментарий',
  editComment: 'Изменить комментарий',
  deleteComment: 'Удалить комментарий',
  deleteCommentTitle: 'Удалить этот комментарий?',
  deleteCommentDescription: 'Комментарий будет удалён для всех.',
  deleteCommentWithReplies: {
    one: 'Комментарий и {count} ответ на него будут удалены для всех.',
    few: 'Комментарий и {count} ответа на него будут удалены для всех.',
    many: 'Комментарий и {count} ответов на него будут удалены для всех.',
    other: 'Комментарий и {count} ответа на него будут удалены для всех.'
  },
  commentFailed: 'Не удалось отправить комментарий',
  changesNotSaved: 'Не удалось сохранить изменения',
  commentDeleted: 'Комментарий удалён',
  commentDeleteFailed: 'Не удалось удалить комментарий'
};
