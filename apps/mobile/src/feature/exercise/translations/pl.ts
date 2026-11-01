import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const pl: TranslatedMessages<typeof en> = {
  exerciseFallbackTitle: 'Ćwiczenie',
  loadErrorTitle: 'Nie udało się wczytać ćwiczenia',
  connectionRequiredTitle: 'Wymagane połączenie',
  connectionRequiredWithDraft:
    'Ćwiczenia wczytują się i są przesyłane online. Udzielone już odpowiedzi są zapisane na tym urządzeniu i wrócą po ponownym połączeniu.',
  connectionRequiredDescription:
    'Ćwiczenia wczytują się i są przesyłane online. Połącz się z Wi-Fi lub danymi komórkowymi, aby otworzyć to ćwiczenie.',

  questionCount: {
    one: '{count} pytanie',
    few: '{count} pytania',
    many: '{count} pytań',
    other: '{count} pytania'
  },
  points: { one: '{points} punkt', few: '{points} punkty', many: '{points} punktów', other: '{points} punktu' },
  dueOn: 'Termin: {date}',
  wasDueOn: 'Termin minął: {date}',
  multipleAttempts: 'Możesz podejść więcej niż raz',
  singleAttempt: 'Jedna próba',
  passMark: 'Próg zaliczenia {percent}',
  introSavingNote:
    'Odpowiedzi zapisują się na tym urządzeniu na bieżąco, więc możesz przerwać i wrócić później. Przesłanie wymaga połączenia z internetem.',
  noQuestionsYet: 'Brak pytań',
  startExercise: 'Rozpocznij ćwiczenie',

  questionsNeedAttention: {
    one: '{count} pytanie wymaga uwagi',
    few: '{count} pytania wymagają uwagi',
    many: '{count} pytań wymaga uwagi',
    other: '{count} pytania wymaga uwagi'
  },
  answerAtLeastOne: 'Odpowiedz na co najmniej jedno pytanie, aby przesłać',
  submitFailed: 'Nie przesłano odpowiedzi',
  offlineBlocker: 'Jesteś offline. Odpowiedzi są zapisane na tym urządzeniu. Połącz się ponownie, aby je przesłać.',
  uploadBlocker: 'Zaczekaj na zakończenie przesyłania plików, zanim prześlesz odpowiedzi.',
  submitAnswers: 'Prześlij odpowiedzi',
  nextQuestion: 'Następne pytanie',
  previousQuestion: 'Poprzednie pytanie',
  confirmSubmitTitle: 'Przesłać odpowiedzi?',
  confirmSubmitMultiple: 'Prowadzący zobaczy tę próbę. Później możesz podejść do ćwiczenia ponownie.',
  confirmSubmitSingle: 'To ćwiczenie pozwala na jedną próbę. Po przesłaniu nie można zmienić odpowiedzi.',
  confirmAnsweredCount: {
    one: 'Odpowiedziano na {answered} z {count} pytania.',
    few: 'Odpowiedziano na {answered} z {count} pytań.',
    many: 'Odpowiedziano na {answered} z {count} pytań.',
    other: 'Odpowiedziano na {answered} z {count} pytania.'
  },
  submit: 'Prześlij',
  saved: 'Zapisano',
  savedAccessibilityLabel: 'Odpowiedzi zapisane na tym urządzeniu',
  progressAccessibilityLabel: 'Pytanie {current} z {total}, udzielone odpowiedzi: {answered}',

  questionPosition: 'Pytanie {number} z {total}',
  optional: 'Opcjonalne',
  questionImage: 'Obraz do pytania',
  typeRadio: 'Jednokrotny wybór',
  typeCheckbox: 'Wielokrotny wybór',
  typeTextarea: 'Dłuższa odpowiedź',
  typeTrueFalse: 'Prawda czy fałsz',
  typeShortAnswer: 'Krótka odpowiedź',
  typeNumeric: 'Liczba',
  typeFillBlank: 'Uzupełnij luki',
  typeFileUpload: 'Przesłanie pliku',
  typeMatching: 'Dopasowanie',
  typeOrdering: 'Kolejność',
  typeHotspot: 'Obszar na obrazie',
  typeLink: 'Linki',
  typeWordBank: 'Bank słów',
  typeStar: 'Ocena w gwiazdkach',
  typeVideoRecording: 'Nagranie wideo',
  typeThumbs: 'Kciuk w górę lub w dół',

  problemRequired: 'Odpowiedz na to pytanie, aby przesłać.',
  problemMinCharacters: {
    one: 'Napisz co najmniej {count} znak.',
    few: 'Napisz co najmniej {count} znaki.',
    many: 'Napisz co najmniej {count} znaków.',
    other: 'Napisz co najmniej {count} znaku.'
  },
  problemMaxCharacters: {
    one: 'Użyj maksymalnie {count} znak.',
    few: 'Użyj maksymalnie {count} znaki.',
    many: 'Użyj maksymalnie {count} znaków.',
    other: 'Użyj maksymalnie {count} znaku.'
  },
  problemLinkFormat: 'Każdy link musi zaczynać się od http:// lub https://.',

  yourAnswer: 'Twoja odpowiedź',
  shortAnswerPlaceholder: 'Wpisz odpowiedź',
  paragraphPlaceholder: 'Napisz odpowiedź',
  characterCount: { one: '{count} znak', few: '{count} znaki', many: '{count} znaków', other: '{count} znaku' },
  characterRange: 'wymagane od {min} do {max}',
  characterMinimum: 'co najmniej {min}',
  characterOfMaximum: {
    one: '{current} z {count} znaku',
    few: '{current} z {count} znaków',
    many: '{current} z {count} znaków',
    other: '{current} z {count} znaku'
  },
  numberPlaceholder: 'Wpisz liczbę',
  numberInvalid: 'Wpisz liczbę, na przykład 42 lub 3,5.',
  blankLabel: 'Luka {number}',
  blankPlaceholder: 'Odpowiedź do luki {number}',
  singleBlankPlaceholder: 'Uzupełnij lukę',
  linkLabel: 'Link {number}',
  removeLink: 'Usuń link {number}',
  linkInvalid: 'Link musi zaczynać się od http:// lub https://.',
  addLink: 'Dodaj kolejny link',
  trueLabel: 'Prawda',
  falseLabel: 'Fałsz',
  yes: 'Tak',
  no: 'Nie',
  starRatingLabel: {
    one: '{rating} z {count} gwiazdki',
    few: '{rating} z {count} gwiazdek',
    many: '{rating} z {count} gwiazdek',
    other: '{rating} z {count} gwiazdki'
  },
  starPrompt: 'Dotknij gwiazdki, aby ocenić',

  unsupportedTitle: 'Odpowiedz na to pytanie w przeglądarce',
  unsupportedReason: 'Aplikacja nie obsługuje jeszcze tego typu pytania.',
  unsupportedInstruction: 'Otwórz ćwiczenie w przeglądarce, aby odpowiedzieć, i tam prześlij całe ćwiczenie.',
  openInBrowser: 'Otwórz w przeglądarce',
  matchingNoPairs: 'To pytanie z dopasowaniem nie ma par.',
  orderingTooFew: 'To pytanie o kolejność ma mniej niż dwa elementy.',
  hotspotNoImage: 'To pytanie z obszarem nie ma obrazu.',
  wordBankNoBlanks: 'Ten bank słów nie ma luk do uzupełnienia.',

  orderSaved: 'Kolejność zapisana. Przeciągnij ponownie, aby ją zmienić.',
  arrangeHint: 'Przytrzymaj wiersz i przeciągnij go lub użyj strzałek.',
  useTheseMatches: 'Zatwierdź dopasowania',
  useThisOrder: 'Zatwierdź kolejność',
  matchedWith: '{item}, dopasowane do: {target}',
  sortablePosition: '{label}, pozycja {position} z {total}',
  sortableHint: 'Przytrzymaj i przeciągnij, aby zmienić kolejność',
  moveUp: 'Przenieś wyżej',
  moveDown: 'Przenieś niżej',

  hotspotAccessibilityLabel: {
    one: 'Obraz z obszarami. Zaznaczono {count} punkt.',
    few: 'Obraz z obszarami. Zaznaczono {count} punkty.',
    many: 'Obraz z obszarami. Zaznaczono {count} punktów.',
    other: 'Obraz z obszarami. Zaznaczono {count} punktu.'
  },
  hotspotAccessibilityHint: 'Dotknij obrazu, aby zaznaczyć punkt. Dotknij zaznaczonego punktu, aby go usunąć.',
  hotspotPrompt: 'Dotknij miejsca na obrazie, w którym jest odpowiedź.',
  hotspotRemoveHint: 'Dotknij znacznika, aby go usunąć.',
  clear: 'Wyczyść',

  blankFilled: 'Luka {number}, {word}. Dotknij, aby wyczyścić.',
  blankEmpty: 'Luka {number}, pusta',
  wordBank: 'Bank słów',
  wordPlaced: '{word}, wstawione',
  wordBankHint: 'Dotknij słowa, aby wstawić je w następną pustą lukę. Dotknij wypełnionej luki, aby ją wyczyścić.',

  fileTypeNotAccepted: 'Ten typ pliku nie jest akceptowany',
  acceptedTypes: 'Akceptowane: {types}.',
  fileTooLarge: 'Ten plik jest za duży',
  fileSizeLimit: 'Limit to {size} MB.',
  cameraAccessOff: 'Dostęp do aparatu jest wyłączony',
  cameraAccessOffDescription: 'Włącz go w Ustawieniach, aby zrobić zdjęcie.',
  replaceFileHint: 'Wybranie innego pliku zastąpi ten.',
  maxFileSize: 'Do {size} MB.',
  uploadFailed: 'Nie udało się przesłać.',
  uploading: 'Przesyłanie',
  uploaded: 'Przesłano',
  cancelUpload: 'Anuluj przesyłanie',
  retryUpload: 'Prześlij ponownie',
  discard: 'Odrzuć',
  removeFile: 'Usuń plik',
  sourceFiles: 'Pliki',
  sourcePhotos: 'Zdjęcia',
  sourceCamera: 'Aparat',
  sizeBytes: { one: '{size} bajt', few: '{size} bajty', many: '{size} bajtów', other: '{size} bajta' },
  sizeKilobytes: '{size} KB',
  sizeMegabytes: '{size} MB',
  sizeGigabytes: '{size} GB',

  videoAnswer: 'Odpowiedź wideo',
  removeVideo: 'Usuń wideo',
  recordAgain: 'Nagraj ponownie',
  newRecordingReplaces: 'Nowe nagranie zastąpi to.',
  recordVideo: 'Nagraj wideo',
  recordVideoHint:
    'Nagraj do {duration} aparatem i mikrofonem. Przed przesłaniem możesz obejrzeć nagranie i nagrać je ponownie.',
  permissionTitle: 'Zezwól na dostęp do aparatu i mikrofonu',
  permissionBlocked:
    'Dostęp do aparatu lub mikrofonu jest wyłączony dla ClassroomIO. Włącz oba w Ustawieniach, aby nagrać odpowiedź.',
  permissionExplanation:
    'Nagranie odpowiedzi wideo wymaga aparatu i mikrofonu. Nic nie jest nagrywane, dopóki nie naciśniesz przycisku nagrywania.',
  openSettings: 'Otwórz Ustawienia',
  allowAccess: 'Zezwól na dostęp',
  recordingTooShort: {
    one: 'Nagraj co najmniej {count} sekundę.',
    few: 'Nagraj co najmniej {count} sekundy.',
    many: 'Nagraj co najmniej {count} sekund.',
    other: 'Nagraj co najmniej {count} sekundy.'
  },
  recordingInProgress: 'Nagrywanie. Dotknij, aby zatrzymać.',
  recordingReady: 'Do {duration}. Dotknij, aby rozpocząć nagrywanie.',
  startRecording: 'Rozpocznij nagrywanie',
  stopRecording: 'Zatrzymaj nagrywanie',
  switchCamera: 'Przełącz aparat',
  retake: 'Nagraj ponownie',
  useVideo: 'Użyj wideo',

  outcomeAwaitingGrade: 'Oczekuje na ocenę',
  outcomeGraded: 'Ocenione',
  outcomePassed: 'Zaliczone',
  outcomeFailed: 'Niezaliczone',
  failedRetakeHint: 'Sprawdź wyniki według pytań, a potem podejdź ponownie w dogodnym momencie.',
  failedReviewHint: 'Wyniki według pytań pokazują, gdzie stracono punkty.',
  scoreOfTotal: {
    one: '{score} z {total} punktu',
    few: '{score} z {total} punktów',
    many: '{score} z {total} punktów',
    other: '{score} z {total} punktu'
  },
  passMarkInline: 'próg zaliczenia {percent}',
  awaitingGradeDescription: 'Prowadzący nie ocenił jeszcze tej próby. Wynik pojawi się tutaj po wystawieniu oceny.',
  attemptSubmitted: 'Próba {number} · przesłano {date}',
  tutorFeedback: 'Opinia prowadzącego',
  questionBreakdown: 'Wyniki według pytań',
  pointsNotGraded: {
    one: '{points} punkt, jeszcze bez oceny',
    few: '{points} punkty, jeszcze bez oceny',
    many: '{points} punktów, jeszcze bez oceny',
    other: '{points} punktu, jeszcze bez oceny'
  },
  previousAttempt: 'Poprzednia próba',
  nextAttempt: 'Następna próba',
  attemptPosition: 'Próba {current} z {total}',
  retakeExercise: 'Podejdź ponownie',
  backToCourse: 'Wróć do kursu',

  noAnswer: 'Brak odpowiedzi',
  selectedOption: 'Wybrana opcja',
  thumbsUp: 'Kciuk w górę',
  thumbsDown: 'Kciuk w dół',
  starCount: {
    one: '{count} gwiazdka',
    few: '{count} gwiazdki',
    many: '{count} gwiazdek',
    other: '{count} gwiazdki'
  },
  uploadedFile: 'Przesłany plik',
  videoSummary: 'Wideo, {duration}',
  hotspotSummary: {
    one: 'Zaznaczono {count} punkt',
    few: 'Zaznaczono {count} punkty',
    many: 'Zaznaczono {count} punktów',
    other: 'Zaznaczono {count} punktu'
  }
};
