import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const it: TranslatedMessages<typeof en> = {
  screenTitle: 'Fai il check-in',
  checkIn: 'Fai il check-in',
  checkingIn: 'Check-in in corso',
  checkedInTitle: 'Check-in effettuato',
  checkedInLateTitle: 'Check-in effettuato in ritardo',
  checkedInAt: 'Check-in alle {time}',
  openLesson: 'Apri lezione',
  scanAgain: 'Scansiona di nuovo',
  scanTitle: 'Scansiona il codice di check-in',
  scanDescription: 'Inquadra il codice QR mostrato dal tuo tutor.',
  viewfinderA11y: 'Inquadratura della fotocamera per scansionare il codice QR di check-in',
  typeCodeTitle: 'Oppure digita il codice',
  codeLabel: 'Codice di check-in',
  codeDescription: '6 lettere e numeri, mostrati sotto il codice QR.',
  typeCodeFromLesson: 'Per digitare un codice, apri la lezione della sessione e scegli Fai il check-in.',
  cameraTitle: 'Consenti l’accesso alla fotocamera',
  cameraExplanation: 'La fotocamera legge il codice QR di check-in. Non vengono scattate foto né registrazioni.',
  cameraBlocked:
    'L’accesso alla fotocamera è disattivato per ClassroomIO. Attivalo in Impostazioni oppure digita il codice.',
  allowCamera: 'Consenti fotocamera',
  openSettings: 'Apri Impostazioni',
  notCheckInCode: 'Questo codice QR non è un codice di check-in di ClassroomIO.',
  errorInvalidTitle: 'Il codice non ha funzionato',
  errorInvalid:
    'Verifica il codice con il tuo tutor. Un codice smette di funzionare quando il tutor ne crea uno nuovo.',
  errorExpiredTitle: 'Questo codice è scaduto',
  errorExpired: 'Chiedi al tuo tutor di mostrare un nuovo codice.',
  errorNotEnrolledTitle: 'Non sei un partecipante di questo corso',
  errorNotEnrolled: 'Solo i partecipanti iscritti al corso possono fare il check-in.',
  errorNotFoundTitle: 'Sessione non trovata',
  errorNotFound:
    'La sessione non appartiene alla tua organizzazione attuale. Cambia organizzazione in Profilo e scansiona di nuovo.',
  errorRateLimitedTitle: 'Troppi tentativi',
  errorRateLimited: 'Attendi qualche minuto e riprova.',
  errorGenericTitle: 'Il check-in non è andato a buon fine',
  errorLinkTitle: 'Questo link non è un codice di check-in',
  errorLink: 'Scansiona il codice QR mostrato dal tutor oppure digita il codice dalla lezione.'
};
