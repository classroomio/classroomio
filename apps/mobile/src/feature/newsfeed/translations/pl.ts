import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const pl: TranslatedMessages<typeof en> = {
  screenTitleNewsfeed: 'Aktualności',
  screenTitlePost: 'Post',
  turnedOffTitle: 'Aktualności są wyłączone',
  turnedOffDescription: 'Twoja organizacja wyłączyła aktualności kursów dla uczestników.',
  offlineFeed: 'To posty zapisane podczas ostatniej wizyty. Reakcje i komentarze wymagają połączenia.',
  refreshFailed: 'Nie udało się odświeżyć postów',
  loadFailed: 'Nie udało się wczytać aktualności',
  emptyTitle: 'Brak postów',
  emptyDescription: 'Ogłoszenia i nowości od zespołu kursu pojawiają się w aktualnościach.',
  courseTeam: 'Zespół kursu',
  postBy: 'Post od {author}',
  postByCourseTeam: 'Post od zespołu kursu',
  pinned: 'Przypięty',
  pinnedPost: 'Przypięty post',
  commentCount: {
    one: '{count} komentarz',
    few: '{count} komentarze',
    many: '{count} komentarzy',
    other: '{count} komentarza'
  },
  noCommentsYet: 'Brak komentarzy',
  reactionClap: 'Brawa',
  reactionSmile: 'Uśmiech',
  reactionThumbsUp: 'Kciuk w górę',
  reactionThumbsDown: 'Kciuk w dół',
  reactionLabel: '{reaction}, {count}',
  reactionLabelMine: '{reaction}, {count}, Twoja reakcja',
  addReaction: 'Dodaj reakcję',
  reactToPost: 'Zareaguj na ten post',
  reactionFailed: 'Nie udało się zapisać reakcji',
  formerMember: 'Były członek',
  replyingTo: 'Odpowiedź dla: {name}',
  reply: 'Odpowiedz',
  showReplies: {
    one: 'Pokaż {count} odpowiedź',
    few: 'Pokaż {count} odpowiedzi',
    many: 'Pokaż {count} odpowiedzi',
    other: 'Pokaż {count} odpowiedzi'
  },
  hideRepliesLabel: {
    one: 'Ukryj {count} odpowiedź',
    few: 'Ukryj {count} odpowiedzi',
    many: 'Ukryj {count} odpowiedzi',
    other: 'Ukryj {count} odpowiedzi'
  },
  hideReplies: 'Ukryj odpowiedzi',
  showMoreReplies: {
    one: 'Pokaż jeszcze {count} odpowiedź',
    few: 'Pokaż jeszcze {count} odpowiedzi',
    many: 'Pokaż jeszcze {count} odpowiedzi',
    other: 'Pokaż jeszcze {count} odpowiedzi'
  },
  commentActions: 'Działania dotyczące komentarza',
  postLoadFailed: 'Nie udało się wczytać tego posta',
  backToNewsfeed: 'Wróć do aktualności',
  showOlderComments: 'Pokaż starsze komentarze',
  commentsLoadFailed: 'Nie udało się wczytać komentarzy',
  commentOfflineTitle: 'Komentowanie wymaga połączenia',
  commentOfflineDescription:
    'Możesz czytać ten post i komentarze. Połącz się ponownie, aby skomentować lub odpowiedzieć.',
  replyTargetFallback: 'ten komentarz',
  editingComment: 'Edytujesz swój komentarz',
  writeReply: 'Napisz odpowiedź',
  writeComment: 'Napisz komentarz',
  commentInputLabel: 'Komentarz',
  editCommentInputLabel: 'Edytuj komentarz',
  postComment: 'Opublikuj komentarz',
  saveComment: 'Zapisz komentarz',
  editComment: 'Edytuj komentarz',
  deleteComment: 'Usuń komentarz',
  deleteCommentTitle: 'Usunąć ten komentarz?',
  deleteCommentDescription: 'Komentarz zostanie usunięty dla wszystkich.',
  deleteCommentWithReplies: {
    one: 'Komentarz i jego odpowiedź zostaną usunięte dla wszystkich.',
    few: 'Komentarz i jego {count} odpowiedzi zostaną usunięte dla wszystkich.',
    many: 'Komentarz i jego {count} odpowiedzi zostaną usunięte dla wszystkich.',
    other: 'Komentarz i jego {count} odpowiedzi zostaną usunięte dla wszystkich.'
  },
  commentFailed: 'Nie udało się opublikować komentarza',
  changesNotSaved: 'Nie udało się zapisać zmian',
  commentDeleted: 'Komentarz usunięty',
  commentDeleteFailed: 'Nie udało się usunąć komentarza'
};
