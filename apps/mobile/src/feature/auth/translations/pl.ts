import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const pl: TranslatedMessages<typeof en> = {
  signInTitle: 'Zaloguj się',
  signInSubtitle: 'Użyj konta, na które zaprosiła Cię Twoja organizacja.',
  or: 'lub',
  changeServer: 'Zmień',
  emailLabel: 'E-mail',
  emailPlaceholder: 'ty@firma.pl',
  passwordLabel: 'Hasło',
  forgotPassword: 'Nie pamiętasz hasła?',
  passwordPlaceholder: 'Twoje hasło',
  signInFailed: 'Nie udało się zalogować. Sprawdź adres e-mail i hasło.',
  continueWithProvider: 'Kontynuuj przez {provider}',
  googleSignInFailedTitle: 'Logowanie przez Google nie zostało ukończone',
  googleSignInFailedDescription: 'Spróbuj ponownie lub zaloguj się adresem e-mail i hasłem.',
  signInWithSso: 'Zaloguj się przez SSO',
  tooManyAttempts: 'Zbyt wiele prób. Odczekaj minutę i spróbuj ponownie.',
  ssoRequiredTitle: 'Twoja organizacja wymaga logowania jednokrotnego',
  ssoRequiredDescription: 'Konta w domenie {domain} logują się przez {provider}, a nie hasłem.',
  yourIdentityProvider: 'Twojego dostawcę tożsamości',
  ssoSubtitle:
    'Użyj służbowego adresu e-mail. Jeśli Twoja organizacja ma logowanie jednokrotne, zalogujesz się kontem firmowym.',
  workEmailLabel: 'Służbowy e-mail',
  workEmailInvalid: 'Wpisz pełny służbowy adres e-mail.',
  ssoNotSetUp:
    'Logowanie jednokrotne nie jest skonfigurowane dla {domain}. Zaloguj się hasłem lub zapytaj administratora, jak loguje się Twoja organizacja.',
  ssoBrowserNote: 'Dostawca tożsamości Twojej organizacji otworzy się w przeglądarce.',
  ssoDidNotFinish: 'Logowanie przez {provider} nie zostało ukończone. Spróbuj ponownie.',
  singleSignOn: 'logowanie jednokrotne',
  ssoCouldNotStart: 'Nie udało się uruchomić logowania jednokrotnego. Spróbuj ponownie.',
  resetTitle: 'Zresetuj hasło',
  resetEmailInvalid: 'Wpisz adres e-mail, którego używasz do logowania.',
  resetDescription: 'Wyślemy Ci e-mailem link do ustawienia nowego hasła w przeglądarce.',
  sendResetLink: 'Wyślij link',
  checkEmailTitle: 'Sprawdź pocztę',
  checkEmailDescription:
    'Jeśli {email} ma konto ClassroomIO, link do resetowania jest już w drodze. Otwórz go, ustaw nowe hasło i zaloguj się nim tutaj.',
  backToSignIn: 'Wróć do logowania',
  useDifferentEmail: 'Użyj innego adresu e-mail',
  resetEmailFailed: 'Nie udało się wysłać wiadomości do resetowania hasła. Spróbuj ponownie.',
  invalidEmail: 'Wpisz prawidłowy adres e-mail.',
  invalidCredentials: 'Adres e-mail lub hasło są nieprawidłowe.',
  emailNotVerified: 'Zweryfikuj adres e-mail przed zalogowaniem. Link jest w Twojej skrzynce odbiorczej.',
  nameLabel: 'Imię i nazwisko',
  namePlaceholder: 'Twoje imię',
  newPasswordPlaceholder: 'Utwórz hasło',
  passwordHint: {
    one: 'Co najmniej {count} znak.',
    few: 'Co najmniej {count} znaki.',
    many: 'Co najmniej {count} znaków.',
    other: 'Co najmniej {count} znaku.'
  },
  passwordTooShort: {
    one: 'Użyj co najmniej {count} znaku.',
    few: 'Użyj co najmniej {count} znaków.',
    many: 'Użyj co najmniej {count} znaków.',
    other: 'Użyj co najmniej {count} znaku.'
  },
  createAccount: 'Utwórz konto',
  signUpFailed: 'Nie udało się utworzyć konta. Spróbuj ponownie.',
  accountExists: 'Konto z tym adresem e-mail już istnieje. Zaloguj się.',
  haveInviteLink: 'Masz link z zaproszeniem?',
  joinAction: 'Dołącz',
  joinTitle: 'Dołącz przez link z zaproszeniem',
  joinDescription: 'Wklej link z zaproszeniem otrzymany e-mailem lub od zespołu kursu.',
  inviteLinkLabel: 'Link z zaproszeniem',
  inviteLinkPlaceholder: 'https://…/invite/…',
  inviteLinkHint: 'Na następnym ekranie możesz utworzyć konto.',
  inviteLinkInvalid: 'To nie jest link z zaproszeniem do ClassroomIO. Skopiuj cały link i spróbuj ponownie.'
};
