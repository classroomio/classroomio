import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const tr: TranslatedMessages<typeof en> = {
  signInTitle: 'Giriş yap',
  signInSubtitle: 'Kuruluşunuzun sizi davet ettiği hesabı kullanın.',
  or: 'veya',
  changeServer: 'Değiştir',
  emailLabel: 'E-posta',
  emailPlaceholder: 'siz@sirket.com',
  passwordLabel: 'Şifre',
  forgotPassword: 'Şifrenizi mi unuttunuz?',
  passwordPlaceholder: 'Şifreniz',
  signInFailed: 'Giriş yapılamadı. E-posta adresinizi ve şifrenizi kontrol edin.',
  continueWithProvider: '{provider} ile devam et',
  googleSignInFailedTitle: 'Google ile giriş tamamlanmadı',
  googleSignInFailedDescription: 'Tekrar deneyin veya e-posta adresiniz ve şifrenizle giriş yapın.',
  signInWithSso: 'SSO ile giriş yap',
  tooManyAttempts: 'Çok fazla deneme yapıldı. Bir dakika bekleyip tekrar deneyin.',
  ssoRequiredTitle: 'Kuruluşunuz çoklu oturum açma gerektiriyor',
  ssoRequiredDescription: '{domain} hesapları şifreyle değil, {provider} üzerinden giriş yapar.',
  yourIdentityProvider: 'kimlik sağlayıcınız',
  ssoSubtitle: 'İş e-postanızı kullanın. Kuruluşunuzda çoklu oturum açma varsa şirket hesabınızla giriş yaparsınız.',
  workEmailLabel: 'İş e-postası',
  workEmailInvalid: 'İş e-posta adresinizin tamamını girin.',
  ssoNotSetUp:
    '{domain} için çoklu oturum açma ayarlanmamış. Şifrenizle giriş yapın veya kuruluşunuzun nasıl giriş yaptığını yöneticinize sorun.',
  ssoBrowserNote: 'Kuruluşunuzun kimlik sağlayıcısı tarayıcıda açılır.',
  ssoDidNotFinish: '{provider} ile giriş tamamlanmadı. Tekrar deneyin.',
  singleSignOn: 'çoklu oturum açma',
  ssoCouldNotStart: 'Çoklu oturum açma başlatılamadı. Tekrar deneyin.',
  resetTitle: 'Şifrenizi sıfırlayın',
  resetEmailInvalid: 'Giriş yaptığınız e-posta adresini girin.',
  resetDescription: 'Tarayıcınızda yeni şifre belirlemeniz için size e-postayla bir bağlantı göndeririz.',
  sendResetLink: 'Sıfırlama bağlantısı gönder',
  checkEmailTitle: 'E-postanızı kontrol edin',
  checkEmailDescription:
    '{email} adresinin bir ClassroomIO hesabı varsa sıfırlama bağlantısı yolda. Bağlantıyı açın, yeni bir şifre seçin ve ardından bu şifreyle burada giriş yapın.',
  backToSignIn: 'Girişe dön',
  useDifferentEmail: 'Farklı bir e-posta kullan',
  resetEmailFailed: 'Sıfırlama e-postası gönderilemedi. Tekrar deneyin.',
  invalidEmail: 'Geçerli bir e-posta adresi girin.',
  invalidCredentials: 'E-posta adresi veya şifre yanlış.',
  emailNotVerified: 'Giriş yapmadan önce e-posta adresinizi doğrulayın. Bağlantı gelen kutunuzda.'
};
