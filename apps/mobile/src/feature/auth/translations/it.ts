import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const it: TranslatedMessages<typeof en> = {
  signInTitle: 'Accedi',
  signInSubtitle: "Usa l'account con cui la tua organizzazione ti ha invitato.",
  or: 'oppure',
  changeServer: 'Cambia',
  emailLabel: 'Email',
  emailPlaceholder: 'tu@azienda.it',
  passwordLabel: 'Password',
  forgotPassword: 'Password dimenticata?',
  passwordPlaceholder: 'La tua password',
  signInFailed: 'Non è stato possibile accedere. Controlla email e password.',
  continueWithProvider: 'Continua con {provider}',
  googleSignInFailedTitle: 'Accesso con Google non completato',
  googleSignInFailedDescription: 'Riprova oppure accedi con email e password.',
  signInWithSso: 'Accedi con SSO',
  tooManyAttempts: 'Troppi tentativi. Attendi un minuto e riprova.',
  ssoRequiredTitle: 'La tua organizzazione richiede il single sign-on',
  ssoRequiredDescription: 'Gli account di {domain} accedono tramite {provider}, non con una password.',
  yourIdentityProvider: 'il tuo provider di identità',
  ssoSubtitle:
    "Usa la tua email di lavoro. Se la tua organizzazione ha il single sign-on, accedi con l'account aziendale.",
  workEmailLabel: 'Email di lavoro',
  workEmailInvalid: "Inserisci l'indirizzo email di lavoro completo.",
  ssoNotSetUp:
    "Il single sign-on non è configurato per {domain}. Accedi con la password o chiedi all'amministratore come accede la tua organizzazione.",
  ssoBrowserNote: 'Il provider di identità della tua organizzazione si apre nel browser.',
  ssoDidNotFinish: 'Accesso con {provider} non completato. Riprova.',
  singleSignOn: 'single sign-on',
  ssoCouldNotStart: 'Impossibile avviare il single sign-on. Riprova.',
  resetTitle: 'Reimposta la password',
  resetEmailInvalid: "Inserisci l'indirizzo email con cui accedi.",
  resetDescription: 'Ti inviamo via email un link per impostare una nuova password nel browser.',
  sendResetLink: 'Invia link di reimpostazione',
  checkEmailTitle: 'Controlla la tua email',
  checkEmailDescription:
    'Se {email} ha un account ClassroomIO, riceverà un link di reimpostazione. Aprilo, scegli una nuova password e poi accedi qui con quella.',
  backToSignIn: "Torna all'accesso",
  useDifferentEmail: "Usa un'altra email",
  resetEmailFailed: "Impossibile inviare l'email di reimpostazione. Riprova.",
  invalidEmail: 'Inserisci un indirizzo email valido.',
  invalidCredentials: 'L’email o la password non sono corrette.',
  emailNotVerified: 'Verifica il tuo indirizzo email prima di accedere. Il link è nella tua casella di posta.'
};
