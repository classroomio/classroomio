import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const de: TranslatedMessages<typeof en> = {
  exerciseFallbackTitle: 'Übung',
  loadErrorTitle: 'Diese Übung wurde nicht geladen',
  connectionRequiredTitle: 'Verbindung erforderlich',
  connectionRequiredWithDraft:
    'Übungen werden online geladen und eingereicht. Ihre bisherigen Antworten sind auf diesem Gerät gespeichert und erscheinen wieder, sobald Sie online sind.',
  connectionRequiredDescription:
    'Übungen werden online geladen und eingereicht. Stellen Sie eine Verbindung über WLAN oder mobile Daten her, um diese Übung zu öffnen.',

  questionCount: { one: '{count} Frage', other: '{count} Fragen' },
  points: { one: '{points} Punkt', other: '{points} Punkte' },
  dueOn: 'Fällig am {date}',
  wasDueOn: 'War fällig am {date}',
  multipleAttempts: 'Mehrere Versuche möglich',
  singleAttempt: 'Ein Versuch',
  passMark: 'Bestehensgrenze {percent}',
  introSavingNote:
    'Ihre Antworten werden laufend auf diesem Gerät gespeichert, sodass Sie später weitermachen können. Zum Einreichen benötigen Sie eine Internetverbindung.',
  noQuestionsYet: 'Noch keine Fragen',
  startExercise: 'Übung starten',

  questionsNeedAttention: {
    one: '{count} Frage muss noch bearbeitet werden',
    other: '{count} Fragen müssen noch bearbeitet werden'
  },
  answerAtLeastOne: 'Beantworten Sie mindestens eine Frage, um die Übung einzureichen',
  submitFailed: 'Ihre Antworten wurden nicht eingereicht',
  offlineBlocker:
    'Sie sind offline. Ihre Antworten sind auf diesem Gerät gespeichert. Stellen Sie eine Verbindung her, um sie einzureichen.',
  uploadBlocker: 'Warten Sie, bis alle Uploads abgeschlossen sind, bevor Sie einreichen.',
  submitAnswers: 'Antworten einreichen',
  nextQuestion: 'Nächste Frage',
  confirmSubmitTitle: 'Antworten einreichen?',
  confirmSubmitMultiple: 'Ihr Tutor sieht diesen Versuch. Sie können die Übung danach erneut bearbeiten.',
  confirmSubmitSingle:
    'Diese Übung erlaubt einen Versuch. Nach dem Einreichen können Sie Ihre Antworten nicht mehr ändern.',
  confirmAnsweredCount: {
    one: 'Sie haben {answered} von {count} Frage beantwortet.',
    other: 'Sie haben {answered} von {count} Fragen beantwortet.'
  },
  submit: 'Einreichen',
  saved: 'Gespeichert',
  savedAccessibilityLabel: 'Antworten auf diesem Gerät gespeichert',
  progressAccessibilityLabel: 'Frage {current} von {total}, {answered} beantwortet',

  questionPosition: 'Frage {number} von {total}',
  optional: 'Optional',
  questionImage: 'Bild zur Frage',
  typeRadio: 'Einfachauswahl',
  typeCheckbox: 'Mehrfachauswahl',
  typeTextarea: 'Freitext',
  typeTrueFalse: 'Richtig oder falsch',
  typeShortAnswer: 'Kurzantwort',
  typeNumeric: 'Zahl',
  typeFillBlank: 'Lückentext',
  typeFileUpload: 'Datei-Upload',
  typeMatching: 'Zuordnung',
  typeOrdering: 'Reihenfolge',
  typeHotspot: 'Hotspot',
  typeLink: 'Links',
  typeWordBank: 'Wortbank',
  typeStar: 'Sternebewertung',
  typeVideoRecording: 'Videoaufnahme',
  typeThumbs: 'Daumen hoch oder runter',

  problemRequired: 'Beantworten Sie diese Frage, um die Übung einzureichen.',
  problemMinCharacters: {
    one: 'Schreiben Sie mindestens {count} Zeichen.',
    other: 'Schreiben Sie mindestens {count} Zeichen.'
  },
  problemMaxCharacters: {
    one: 'Verwenden Sie höchstens {count} Zeichen.',
    other: 'Verwenden Sie höchstens {count} Zeichen.'
  },
  problemLinkFormat: 'Jeder Link muss mit http:// oder https:// beginnen.',

  yourAnswer: 'Ihre Antwort',
  shortAnswerPlaceholder: 'Antwort eingeben',
  paragraphPlaceholder: 'Antwort schreiben',
  characterCount: { one: '{count} Zeichen', other: '{count} Zeichen' },
  characterRange: '{min} bis {max} erforderlich',
  characterMinimum: 'mindestens {min}',
  characterOfMaximum: { one: '{current} von {count} Zeichen', other: '{current} von {count} Zeichen' },
  numberPlaceholder: 'Zahl eingeben',
  numberInvalid: 'Geben Sie eine Zahl ein, zum Beispiel 42 oder 3,5.',
  blankLabel: 'Lücke {number}',
  blankPlaceholder: 'Antwort für Lücke {number}',
  singleBlankPlaceholder: 'Lücke ausfüllen',
  linkLabel: 'Link {number}',
  removeLink: 'Link {number} entfernen',
  linkInvalid: 'Der Link muss mit http:// oder https:// beginnen.',
  addLink: 'Weiteren Link hinzufügen',
  trueLabel: 'Richtig',
  falseLabel: 'Falsch',
  yes: 'Ja',
  no: 'Nein',
  starRatingLabel: { one: '{rating} von {count} Stern', other: '{rating} von {count} Sternen' },
  starPrompt: 'Tippen Sie auf einen Stern, um zu bewerten',

  unsupportedTitle: 'Beantworten Sie diese Frage im Browser',
  unsupportedReason: 'Die App kann diesen Fragetyp noch nicht anzeigen.',
  unsupportedInstruction:
    'Öffnen Sie die Übung im Web, um sie zu beantworten, und reichen Sie dort die gesamte Übung ein.',
  openInBrowser: 'Im Browser öffnen',
  matchingNoPairs: 'Diese Zuordnungsfrage hat keine Paare.',
  orderingTooFew: 'Diese Reihenfolgefrage hat weniger als zwei Elemente.',
  hotspotNoImage: 'Diese Hotspot-Frage hat kein Bild.',
  wordBankNoBlanks: 'Diese Wortbank hat keine Lücken.',

  orderSaved: 'Reihenfolge gespeichert. Ziehen Sie erneut, um sie zu ändern.',
  arrangeHint: 'Halten Sie eine Zeile gedrückt und ziehen Sie sie, oder nutzen Sie die Pfeile.',
  useTheseMatches: 'Zuordnung übernehmen',
  useThisOrder: 'Reihenfolge übernehmen',
  matchedWith: '{item}, zugeordnet zu {target}',
  sortablePosition: '{label}, Position {position} von {total}',
  sortableHint: 'Gedrückt halten und ziehen, um die Reihenfolge zu ändern',
  moveUp: 'Nach oben',
  moveDown: 'Nach unten',

  hotspotAccessibilityLabel: {
    one: 'Hotspot-Bild. {count} Punkt markiert.',
    other: 'Hotspot-Bild. {count} Punkte markiert.'
  },
  hotspotAccessibilityHint:
    'Tippen Sie auf das Bild, um einen Punkt zu markieren. Tippen Sie auf einen markierten Punkt, um ihn zu entfernen.',
  hotspotPrompt: 'Tippen Sie auf die Stelle im Bild, an der sich die Antwort befindet.',
  hotspotRemoveHint: 'Tippen Sie auf eine Markierung, um sie zu entfernen.',
  clear: 'Zurücksetzen',

  blankFilled: 'Lücke {number}, {word}. Zum Leeren tippen.',
  blankEmpty: 'Lücke {number}, leer',
  wordBank: 'Wortbank',
  wordPlaced: '{word}, eingesetzt',
  wordBankHint:
    'Tippen Sie auf ein Wort, um es in die nächste leere Lücke einzusetzen. Tippen Sie auf eine gefüllte Lücke, um sie zu leeren.',

  fileTypeNotAccepted: 'Dieser Dateityp wird nicht akzeptiert',
  acceptedTypes: 'Erlaubt: {types}.',
  fileTooLarge: 'Diese Datei ist zu groß',
  fileSizeLimit: 'Die Grenze liegt bei {size} MB.',
  cameraAccessOff: 'Kamerazugriff ist deaktiviert',
  cameraAccessOffDescription: 'Aktivieren Sie den Zugriff in den Einstellungen, um ein Foto aufzunehmen.',
  replaceFileHint: 'Eine andere Datei ersetzt diese.',
  maxFileSize: 'Bis zu {size} MB.',
  uploadFailed: 'Upload fehlgeschlagen.',
  uploading: 'Wird hochgeladen',
  uploaded: 'Hochgeladen',
  cancelUpload: 'Upload abbrechen',
  retryUpload: 'Upload wiederholen',
  discard: 'Verwerfen',
  removeFile: 'Datei entfernen',
  sourceFiles: 'Dateien',
  sourcePhotos: 'Fotos',
  sourceCamera: 'Kamera',
  sizeBytes: { one: '{size} Byte', other: '{size} Byte' },
  sizeKilobytes: '{size} KB',
  sizeMegabytes: '{size} MB',
  sizeGigabytes: '{size} GB',

  videoAnswer: 'Videoantwort',
  removeVideo: 'Video entfernen',
  recordAgain: 'Neu aufnehmen',
  newRecordingReplaces: 'Eine neue Aufnahme ersetzt diese.',
  recordVideo: 'Video aufnehmen',
  recordVideoHint:
    'Nehmen Sie bis zu {duration} mit Kamera und Mikrofon auf. Sie können die Aufnahme ansehen und wiederholen, bevor sie hochgeladen wird.',
  permissionTitle: 'Kamera und Mikrofon erlauben',
  permissionBlocked:
    'Der Zugriff auf Kamera oder Mikrofon ist für ClassroomIO deaktiviert. Aktivieren Sie beides in den Einstellungen, um Ihre Antwort aufzunehmen.',
  permissionExplanation:
    'Für eine Videoantwort werden Kamera und Mikrofon benötigt. Die Aufnahme beginnt erst, wenn Sie auf Aufnahme tippen.',
  openSettings: 'Einstellungen öffnen',
  allowAccess: 'Zugriff erlauben',
  recordingTooShort: {
    one: 'Nehmen Sie mindestens {count} Sekunde auf.',
    other: 'Nehmen Sie mindestens {count} Sekunden auf.'
  },
  recordingInProgress: 'Aufnahme läuft. Zum Beenden tippen.',
  recordingReady: 'Bis zu {duration}. Zum Aufnehmen tippen.',
  startRecording: 'Aufnahme starten',
  stopRecording: 'Aufnahme beenden',
  switchCamera: 'Kamera wechseln',
  retake: 'Wiederholen',
  useVideo: 'Video verwenden',

  outcomeAwaitingGrade: 'Bewertung ausstehend',
  outcomeGraded: 'Bewertet',
  outcomePassed: 'Bestanden',
  outcomeFailed: 'Nicht bestanden',
  failedRetakeHint: 'Sehen Sie sich das Ergebnis nach Fragen an und wiederholen Sie die Übung, wenn Sie bereit sind.',
  failedReviewHint: 'Das Ergebnis nach Fragen zeigt, wo Sie Punkte verloren haben.',
  scoreOfTotal: { one: '{score} von {total} Punkt', other: '{score} von {total} Punkten' },
  passMarkInline: 'Bestehensgrenze {percent}',
  awaitingGradeDescription:
    'Ihr Tutor hat diesen Versuch noch nicht bewertet. Ihr Ergebnis wird angezeigt, sobald der Versuch bewertet ist.',
  attemptSubmitted: 'Versuch {number} · eingereicht am {date}',
  tutorFeedback: 'Feedback vom Tutor',
  questionBreakdown: 'Ergebnis nach Fragen',
  pointsNotGraded: { one: '{points} Punkt, noch nicht bewertet', other: '{points} Punkte, noch nicht bewertet' },
  previousAttempt: 'Vorheriger Versuch',
  nextAttempt: 'Nächster Versuch',
  attemptPosition: 'Versuch {current} von {total}',
  retakeExercise: 'Übung wiederholen',
  backToCourse: 'Zurück zum Kurs',

  noAnswer: 'Keine Antwort',
  selectedOption: 'Ausgewählte Option',
  thumbsUp: 'Daumen hoch',
  thumbsDown: 'Daumen runter',
  starCount: { one: '{count} Stern', other: '{count} Sterne' },
  uploadedFile: 'Hochgeladene Datei',
  videoSummary: 'Video, {duration}',
  hotspotSummary: { one: '{count} Punkt markiert', other: '{count} Punkte markiert' }
};
