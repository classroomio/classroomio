import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const ru: TranslatedMessages<typeof en> = {
  signInTitle: 'Вход',
  signInSubtitle: 'Используйте аккаунт, на который вас пригласила организация.',
  or: 'или',
  changeServer: 'Изменить',
  emailLabel: 'Эл. почта',
  emailPlaceholder: 'you@company.com',
  passwordLabel: 'Пароль',
  forgotPassword: 'Забыли пароль?',
  passwordPlaceholder: 'Ваш пароль',
  signInFailed: 'Не удалось войти. Проверьте адрес эл. почты и пароль.',
  continueWithProvider: 'Продолжить через {provider}',
  googleSignInFailedTitle: 'Вход через Google не завершён',
  googleSignInFailedDescription: 'Попробуйте ещё раз или войдите по адресу эл. почты и паролю.',
  signInWithSso: 'Войти через SSO',
  tooManyAttempts: 'Слишком много попыток. Подождите минуту и попробуйте ещё раз.',
  ssoRequiredTitle: 'В вашей организации нужен единый вход',
  ssoRequiredDescription: 'Аккаунты на {domain} входят через {provider}, а не по паролю.',
  yourIdentityProvider: 'вашего поставщика удостоверений',
  ssoSubtitle:
    'Укажите рабочий адрес эл. почты. Если в организации настроен единый вход, вы войдёте с корпоративным аккаунтом.',
  workEmailLabel: 'Рабочая эл. почта',
  workEmailInvalid: 'Введите полный рабочий адрес эл. почты.',
  ssoNotSetUp:
    'Единый вход для {domain} не настроен. Войдите по паролю или узнайте у администратора, как входят в вашей организации.',
  ssoBrowserNote: 'Страница поставщика удостоверений вашей организации откроется в браузере.',
  ssoDidNotFinish: 'Вход через {provider} не завершён. Попробуйте ещё раз.',
  singleSignOn: 'единый вход',
  ssoCouldNotStart: 'Не удалось начать единый вход. Попробуйте ещё раз.',
  resetTitle: 'Сброс пароля',
  resetEmailInvalid: 'Введите адрес эл. почты, с которым вы входите.',
  resetDescription: 'Мы пришлём ссылку, по которой можно задать новый пароль в браузере.',
  sendResetLink: 'Отправить ссылку',
  checkEmailTitle: 'Проверьте почту',
  checkEmailDescription:
    'Если у {email} есть аккаунт ClassroomIO, ссылка для сброса уже отправлена. Откройте её, задайте новый пароль и войдите с ним здесь.',
  backToSignIn: 'Вернуться ко входу',
  useDifferentEmail: 'Указать другой адрес',
  resetEmailFailed: 'Не удалось отправить письмо для сброса пароля. Попробуйте ещё раз.',
  invalidEmail: 'Введите действительный адрес эл. почты.',
  invalidCredentials: 'Неверный адрес эл. почты или пароль.',
  emailNotVerified: 'Подтвердите адрес эл. почты перед входом. Ссылка пришла вам на почту.',
  nameLabel: 'Полное имя',
  namePlaceholder: 'Ваше имя',
  newPasswordPlaceholder: 'Придумайте пароль',
  passwordHint: {
    one: 'Не менее {count} символа.',
    few: 'Не менее {count} символов.',
    many: 'Не менее {count} символов.',
    other: 'Не менее {count} символа.'
  },
  passwordTooShort: {
    one: 'Используйте не менее {count} символа.',
    few: 'Используйте не менее {count} символов.',
    many: 'Используйте не менее {count} символов.',
    other: 'Используйте не менее {count} символа.'
  },
  createAccount: 'Создать аккаунт',
  signUpFailed: 'Не удалось создать аккаунт. Попробуйте ещё раз.',
  accountExists: 'Аккаунт с этим адресом уже существует. Войдите в него.',
  haveInviteLink: 'Есть ссылка-приглашение?',
  joinAction: 'Присоединиться',
  joinTitle: 'Присоединиться по ссылке-приглашению',
  joinDescription: 'Вставьте ссылку-приглашение из письма или от команды курса.',
  inviteLinkLabel: 'Ссылка-приглашение',
  inviteLinkPlaceholder: 'https://…/invite/…',
  inviteLinkHint: 'На следующем экране можно создать аккаунт.',
  inviteLinkInvalid: 'Это не ссылка-приглашение ClassroomIO. Скопируйте ссылку целиком и попробуйте снова.'
};
