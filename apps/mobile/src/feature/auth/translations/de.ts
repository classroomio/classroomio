import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const de: TranslatedMessages<typeof en> = {
  signInTitle: 'Anmelden',
  signInSubtitle: 'Verwenden Sie das Konto, mit dem Ihre Organisation Sie eingeladen hat.',
  or: 'oder',
  changeServer: 'Ändern',
  emailLabel: 'E-Mail',
  emailPlaceholder: 'name@firma.de',
  passwordLabel: 'Passwort',
  forgotPassword: 'Passwort vergessen?',
  passwordPlaceholder: 'Ihr Passwort',
  signInFailed: 'Die Anmeldung ist fehlgeschlagen. Prüfen Sie Ihre E-Mail-Adresse und Ihr Passwort.',
  continueWithProvider: 'Weiter mit {provider}',
  googleSignInFailedTitle: 'Anmeldung mit Google nicht abgeschlossen',
  googleSignInFailedDescription: 'Versuchen Sie es erneut oder melden Sie sich mit E-Mail-Adresse und Passwort an.',
  signInWithSso: 'Mit SSO anmelden',
  tooManyAttempts: 'Zu viele Versuche. Warten Sie eine Minute und versuchen Sie es dann erneut.',
  ssoRequiredTitle: 'Ihre Organisation verlangt Single Sign-on',
  ssoRequiredDescription: 'Konten unter {domain} melden sich über {provider} an, nicht mit einem Passwort.',
  yourIdentityProvider: 'Ihren Identitätsanbieter',
  ssoSubtitle:
    'Verwenden Sie Ihre geschäftliche E-Mail-Adresse. Nutzt Ihre Organisation Single Sign-on, melden Sie sich mit Ihrem Firmenkonto an.',
  workEmailLabel: 'Geschäftliche E-Mail',
  workEmailInvalid: 'Geben Sie Ihre vollständige geschäftliche E-Mail-Adresse ein.',
  ssoNotSetUp:
    'Single Sign-on ist für {domain} nicht eingerichtet. Melden Sie sich mit Ihrem Passwort an oder erkundigen Sie sich bei Ihrer Administration, wie die Anmeldung in Ihrer Organisation funktioniert.',
  ssoBrowserNote: 'Der Identitätsanbieter Ihrer Organisation öffnet sich im Browser.',
  ssoDidNotFinish: 'Die Anmeldung mit {provider} wurde nicht abgeschlossen. Versuchen Sie es erneut.',
  singleSignOn: 'Single Sign-on',
  ssoCouldNotStart: 'Single Sign-on konnte nicht gestartet werden. Versuchen Sie es erneut.',
  resetTitle: 'Passwort zurücksetzen',
  resetEmailInvalid: 'Geben Sie die E-Mail-Adresse ein, mit der Sie sich anmelden.',
  resetDescription:
    'Wir senden Ihnen per E-Mail einen Link, mit dem Sie im Browser ein neues Passwort festlegen können.',
  sendResetLink: 'Link zum Zurücksetzen senden',
  checkEmailTitle: 'Prüfen Sie Ihre E-Mails',
  checkEmailDescription:
    'Wenn {email} ein ClassroomIO-Konto hat, ist ein Link zum Zurücksetzen unterwegs. Öffnen Sie ihn, legen Sie ein neues Passwort fest und melden Sie sich anschließend hier damit an.',
  backToSignIn: 'Zurück zur Anmeldung',
  useDifferentEmail: 'Andere E-Mail-Adresse verwenden',
  resetEmailFailed: 'Die E-Mail zum Zurücksetzen konnte nicht gesendet werden. Versuchen Sie es erneut.',
  invalidEmail: 'Geben Sie eine gültige E-Mail-Adresse ein.',
  invalidCredentials: 'Die E-Mail-Adresse oder das Passwort ist falsch.',
  emailNotVerified:
    'Bestätigen Sie Ihre E-Mail-Adresse, bevor Sie sich anmelden. Den Link finden Sie in Ihrem Posteingang.'
};
