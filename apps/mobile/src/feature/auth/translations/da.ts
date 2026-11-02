import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const da: TranslatedMessages<typeof en> = {
  signInTitle: 'Log ind',
  signInSubtitle: 'Brug den konto, din organisation inviterede dig med.',
  or: 'eller',
  changeServer: 'Skift',
  emailLabel: 'E-mail',
  emailPlaceholder: 'dig@firma.dk',
  passwordLabel: 'Adgangskode',
  forgotPassword: 'Glemt adgangskode?',
  passwordPlaceholder: 'Din adgangskode',
  signInFailed: 'Vi kunne ikke logge dig ind. Tjek din e-mail og adgangskode.',
  continueWithProvider: 'Fortsæt med {provider}',
  googleSignInFailedTitle: 'Login med Google blev ikke fuldført',
  googleSignInFailedDescription: 'Prøv igen, eller log ind med din e-mail og adgangskode.',
  signInWithSso: 'Log ind med SSO',
  tooManyAttempts: 'For mange forsøg. Vent et minut, og prøv igen.',
  ssoRequiredTitle: 'Din organisation kræver single sign-on',
  ssoRequiredDescription: 'Konti på {domain} logger ind via {provider}, ikke med en adgangskode.',
  yourIdentityProvider: 'din identitetsudbyder',
  ssoSubtitle:
    'Brug din arbejdsmail. Hvis din organisation har single sign-on, logger du ind med din virksomhedskonto.',
  workEmailLabel: 'Arbejdsmail',
  workEmailInvalid: 'Indtast hele din arbejdsmailadresse.',
  ssoNotSetUp:
    'Single sign-on er ikke sat op for {domain}. Log ind med din adgangskode, eller spørg din administrator, hvordan din organisation logger ind.',
  ssoBrowserNote: 'Din organisations identitetsudbyder åbner i browseren.',
  ssoDidNotFinish: 'Login med {provider} blev ikke fuldført. Prøv igen.',
  singleSignOn: 'single sign-on',
  ssoCouldNotStart: 'Single sign-on kunne ikke starte. Prøv igen.',
  resetTitle: 'Nulstil din adgangskode',
  resetEmailInvalid: 'Indtast den e-mailadresse, du logger ind med.',
  resetDescription: 'Vi sender dig et link på e-mail, så du kan vælge en ny adgangskode i din browser.',
  sendResetLink: 'Send nulstillingslink',
  checkEmailTitle: 'Tjek din e-mail',
  checkEmailDescription:
    'Hvis {email} har en ClassroomIO-konto, er et nulstillingslink på vej. Åbn det, vælg en ny adgangskode, og log derefter ind med den her.',
  backToSignIn: 'Tilbage til login',
  useDifferentEmail: 'Brug en anden e-mail',
  resetEmailFailed: 'Vi kunne ikke sende nulstillingsmailen. Prøv igen.',
  invalidEmail: 'Indtast en gyldig e-mailadresse.',
  invalidCredentials: 'E-mailen eller adgangskoden er forkert.',
  emailNotVerified: 'Bekræft din e-mailadresse, før du logger ind. Linket er i din indbakke.'
};
