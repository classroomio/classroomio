import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const ru: TranslatedMessages<typeof en> = {
  exerciseFallbackTitle: 'Упражнение',
  loadErrorTitle: 'Не удалось загрузить упражнение',
  connectionRequiredTitle: 'Нужно подключение',
  connectionRequiredWithDraft:
    'Упражнения загружаются и отправляются онлайн. Ваши ответы сохранены на этом устройстве и вернутся, когда подключение восстановится.',
  connectionRequiredDescription:
    'Упражнения загружаются и отправляются онлайн. Подключитесь к Wi-Fi или мобильной сети, чтобы открыть это упражнение.',

  questionCount: {
    one: '{count} вопрос',
    few: '{count} вопроса',
    many: '{count} вопросов',
    other: '{count} вопроса'
  },
  points: { one: '{points} балл', few: '{points} балла', many: '{points} баллов', other: '{points} балла' },
  dueOn: 'Срок: {date}',
  wasDueOn: 'Срок истёк: {date}',
  multipleAttempts: 'Можно проходить несколько раз',
  singleAttempt: 'Одна попытка',
  passMark: 'Проходной балл {percent}',
  introSavingNote:
    'Ответы сохраняются на этом устройстве по ходу работы, поэтому можно выйти и продолжить позже. Для отправки нужно подключение к интернету.',
  noQuestionsYet: 'Вопросов пока нет',
  startExercise: 'Начать упражнение',

  questionsNeedAttention: {
    one: '{count} вопрос требует внимания',
    few: '{count} вопроса требуют внимания',
    many: '{count} вопросов требуют внимания',
    other: '{count} вопроса требуют внимания'
  },
  answerAtLeastOne: 'Чтобы отправить, ответьте хотя бы на один вопрос',
  submitFailed: 'Ответы не отправлены',
  offlineBlocker: 'Нет подключения. Ответы сохранены на этом устройстве. Подключитесь, чтобы отправить их.',
  uploadBlocker: 'Перед отправкой дождитесь окончания загрузки файлов.',
  submitAnswers: 'Отправить ответы',
  nextQuestion: 'Следующий вопрос',
  confirmSubmitTitle: 'Отправить ответы?',
  confirmSubmitMultiple: 'Преподаватель увидит эту попытку. После этого упражнение можно пройти снова.',
  confirmSubmitSingle: 'В этом упражнении одна попытка. После отправки изменить ответы будет нельзя.',
  submit: 'Отправить',
  saved: 'Сохранено',
  savedAccessibilityLabel: 'Ответы сохранены на этом устройстве',
  progressAccessibilityLabel: 'Вопрос {current} из {total}, отвечено: {answered}',

  questionPosition: 'Вопрос {number} из {total}',
  optional: 'Необязательный',
  questionImage: 'Изображение к вопросу',
  typeRadio: 'Один вариант',
  typeCheckbox: 'Несколько вариантов',
  typeTextarea: 'Развёрнутый ответ',
  typeTrueFalse: 'Верно или неверно',
  typeShortAnswer: 'Краткий ответ',
  typeNumeric: 'Число',
  typeFillBlank: 'Заполните пропуски',
  typeFileUpload: 'Загрузка файла',
  typeMatching: 'Сопоставление',
  typeOrdering: 'Порядок',
  typeHotspot: 'Область на изображении',
  typeLink: 'Ссылки',
  typeWordBank: 'Банк слов',
  typeStar: 'Оценка звёздами',
  typeVideoRecording: 'Видеозапись',
  typeThumbs: 'Палец вверх или вниз',

  problemRequired: 'Чтобы отправить, ответьте на этот вопрос.',
  problemMinCharacters: {
    one: 'Напишите не менее {count} символа.',
    few: 'Напишите не менее {count} символов.',
    many: 'Напишите не менее {count} символов.',
    other: 'Напишите не менее {count} символа.'
  },
  problemMaxCharacters: {
    one: 'Используйте не более {count} символа.',
    few: 'Используйте не более {count} символов.',
    many: 'Используйте не более {count} символов.',
    other: 'Используйте не более {count} символа.'
  },
  problemLinkFormat: 'Каждая ссылка должна начинаться с http:// или https://.',

  yourAnswer: 'Ваш ответ',
  shortAnswerPlaceholder: 'Введите ответ',
  paragraphPlaceholder: 'Напишите ответ',
  characterCount: {
    one: '{count} символ',
    few: '{count} символа',
    many: '{count} символов',
    other: '{count} символа'
  },
  characterRange: 'нужно от {min} до {max}',
  characterMinimum: 'не менее {min}',
  characterOfMaximum: {
    one: '{current} из {count} символа',
    few: '{current} из {count} символов',
    many: '{current} из {count} символов',
    other: '{current} из {count} символа'
  },
  numberPlaceholder: 'Введите число',
  numberInvalid: 'Введите число, например 42 или 3,5.',
  blankLabel: 'Пропуск {number}',
  blankPlaceholder: 'Ответ для пропуска {number}',
  singleBlankPlaceholder: 'Заполните пропуск',
  linkLabel: 'Ссылка {number}',
  removeLink: 'Удалить ссылку {number}',
  linkInvalid: 'Ссылка должна начинаться с http:// или https://.',
  addLink: 'Добавить ещё ссылку',
  trueLabel: 'Верно',
  falseLabel: 'Неверно',
  yes: 'Да',
  no: 'Нет',
  starRatingLabel: {
    one: '{rating} из {count} звезды',
    few: '{rating} из {count} звёзд',
    many: '{rating} из {count} звёзд',
    other: '{rating} из {count} звезды'
  },
  starPrompt: 'Нажмите на звезду, чтобы оценить',

  unsupportedTitle: 'Ответьте на этот вопрос в браузере',
  unsupportedReason: 'Приложение пока не поддерживает этот тип вопроса.',
  unsupportedInstruction: 'Откройте упражнение в веб-версии, ответьте там и отправьте всё упражнение целиком.',
  openInBrowser: 'Открыть в браузере',
  matchingNoPairs: 'В этом вопросе на сопоставление нет пар.',
  orderingTooFew: 'В этом вопросе на порядок меньше двух элементов.',
  hotspotNoImage: 'В этом вопросе с областями нет изображения.',
  wordBankNoBlanks: 'В этом банке слов нет пропусков.',

  orderSaved: 'Порядок сохранён. Перетащите снова, чтобы изменить его.',
  arrangeHint: 'Удерживайте строку и перетащите её или используйте стрелки.',
  useTheseMatches: 'Принять сопоставление',
  useThisOrder: 'Принять порядок',
  matchedWith: '{item}, сопоставлено с {target}',
  sortablePosition: '{label}, позиция {position} из {total}',
  sortableHint: 'Удерживайте и перетащите, чтобы изменить порядок',
  moveUp: 'Переместить вверх',
  moveDown: 'Переместить вниз',

  hotspotAccessibilityLabel: {
    one: 'Изображение с областями. Отмечена {count} точка.',
    few: 'Изображение с областями. Отмечены {count} точки.',
    many: 'Изображение с областями. Отмечено {count} точек.',
    other: 'Изображение с областями. Отмечено {count} точки.'
  },
  hotspotAccessibilityHint:
    'Нажмите на изображение, чтобы отметить точку. Нажмите на отмеченную точку, чтобы удалить её.',
  hotspotPrompt: 'Нажмите на место изображения, где находится ответ.',
  hotspotRemoveHint: 'Нажмите на метку, чтобы удалить её.',
  clear: 'Очистить',

  blankFilled: 'Пропуск {number}, {word}. Нажмите, чтобы очистить.',
  blankEmpty: 'Пропуск {number}, пусто',
  wordBank: 'Банк слов',
  wordPlaced: '{word}, вставлено',
  wordBankHint:
    'Нажмите на слово, чтобы вставить его в следующий пустой пропуск. Нажмите на заполненный пропуск, чтобы очистить его.',

  fileTypeNotAccepted: 'Этот тип файла не принимается',
  acceptedTypes: 'Допустимые форматы: {types}.',
  fileTooLarge: 'Файл слишком большой',
  fileSizeLimit: 'Ограничение — {size} МБ.',
  cameraAccessOff: 'Доступ к камере выключен',
  cameraAccessOffDescription: 'Включите его в Настройках, чтобы сделать фото.',
  replaceFileHint: 'Другой выбранный файл заменит этот.',
  maxFileSize: 'До {size} МБ.',
  uploadFailed: 'Не удалось загрузить.',
  uploading: 'Загрузка',
  uploaded: 'Загружено',
  cancelUpload: 'Отменить загрузку',
  retryUpload: 'Загрузить снова',
  discard: 'Удалить',
  removeFile: 'Удалить файл',
  sourceFiles: 'Файлы',
  sourcePhotos: 'Фото',
  sourceCamera: 'Камера',
  sizeBytes: { one: '{size} байт', few: '{size} байта', many: '{size} байт', other: '{size} байта' },
  sizeKilobytes: '{size} КБ',
  sizeMegabytes: '{size} МБ',
  sizeGigabytes: '{size} ГБ',

  videoAnswer: 'Видеоответ',
  removeVideo: 'Удалить видео',
  recordAgain: 'Записать заново',
  newRecordingReplaces: 'Новая запись заменит эту.',
  recordVideo: 'Записать видео',
  recordVideoHint:
    'Запишите до {duration} с камерой и микрофоном. Перед загрузкой запись можно посмотреть и переснять.',
  permissionTitle: 'Разрешите доступ к камере и микрофону',
  permissionBlocked:
    'Доступ к камере или микрофону для ClassroomIO выключен. Включите оба в Настройках, чтобы записать ответ.',
  permissionExplanation: 'Для видеоответа нужны камера и микрофон. Запись начнётся только после нажатия кнопки записи.',
  openSettings: 'Открыть Настройки',
  allowAccess: 'Разрешить доступ',
  recordingTooShort: {
    one: 'Запишите не менее {count} секунды.',
    few: 'Запишите не менее {count} секунд.',
    many: 'Запишите не менее {count} секунд.',
    other: 'Запишите не менее {count} секунды.'
  },
  recordingInProgress: 'Идёт запись. Нажмите, чтобы остановить.',
  recordingReady: 'До {duration}. Нажмите, чтобы начать запись.',
  startRecording: 'Начать запись',
  stopRecording: 'Остановить запись',
  switchCamera: 'Сменить камеру',
  retake: 'Переснять',
  useVideo: 'Использовать видео',

  outcomeAwaitingGrade: 'Ожидает оценки',
  outcomeGraded: 'Оценено',
  outcomePassed: 'Пройдено',
  outcomeFailed: 'Не пройдено',
  scoreOfTotal: {
    one: '{score} из {total} балла',
    few: '{score} из {total} баллов',
    many: '{score} из {total} баллов',
    other: '{score} из {total} балла'
  },
  passMarkInline: 'проходной балл {percent}',
  awaitingGradeDescription: 'Преподаватель ещё не оценил эту попытку. Результат появится здесь после оценки.',
  attemptSubmitted: 'Попытка {number} · отправлено {date}',
  tutorFeedback: 'Отзыв преподавателя',
  questionBreakdown: 'Результаты по вопросам',
  pointsNotGraded: {
    one: '{points} балл, ещё не оценено',
    few: '{points} балла, ещё не оценено',
    many: '{points} баллов, ещё не оценено',
    other: '{points} балла, ещё не оценено'
  },
  previousAttempt: 'Предыдущая попытка',
  nextAttempt: 'Следующая попытка',
  attemptPosition: 'Попытка {current} из {total}',
  retakeExercise: 'Пройти заново',
  backToCourse: 'Вернуться к курсу',

  noAnswer: 'Нет ответа',
  selectedOption: 'Выбранный вариант',
  thumbsUp: 'Палец вверх',
  thumbsDown: 'Палец вниз',
  starCount: { one: '{count} звезда', few: '{count} звезды', many: '{count} звёзд', other: '{count} звезды' },
  uploadedFile: 'Загруженный файл',
  videoSummary: 'Видео, {duration}',
  hotspotSummary: {
    one: 'Отмечена {count} точка',
    few: 'Отмечены {count} точки',
    many: 'Отмечено {count} точек',
    other: 'Отмечено {count} точки'
  }
};
