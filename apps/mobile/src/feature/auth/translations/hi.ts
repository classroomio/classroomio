import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const hi: TranslatedMessages<typeof en> = {
  signInTitle: 'साइन इन करें',
  signInSubtitle: 'वह खाता इस्तेमाल करें जिससे आपके संगठन ने आपको आमंत्रित किया था।',
  or: 'या',
  changeServer: 'बदलें',
  emailLabel: 'ईमेल',
  emailPlaceholder: 'you@company.com',
  passwordLabel: 'पासवर्ड',
  forgotPassword: 'पासवर्ड भूल गए?',
  passwordPlaceholder: 'आपका पासवर्ड',
  signInFailed: 'हम आपको साइन इन नहीं कर सके। अपना ईमेल और पासवर्ड जांचें।',
  continueWithProvider: '{provider} के साथ जारी रखें',
  googleSignInFailedTitle: 'Google से साइन इन पूरा नहीं हुआ',
  googleSignInFailedDescription: 'फिर से कोशिश करें, या अपने ईमेल और पासवर्ड से साइन इन करें।',
  signInWithSso: 'SSO से साइन इन करें',
  tooManyAttempts: 'बहुत ज़्यादा कोशिशें हुईं। एक मिनट रुककर फिर से कोशिश करें।',
  ssoRequiredTitle: 'आपके संगठन में सिंगल साइन-ऑन ज़रूरी है',
  ssoRequiredDescription: '{domain} वाले खाते पासवर्ड से नहीं, {provider} के ज़रिए साइन इन करते हैं।',
  yourIdentityProvider: 'आपके पहचान प्रदाता',
  ssoSubtitle:
    'अपना ऑफ़िस ईमेल इस्तेमाल करें। अगर आपके संगठन में सिंगल साइन-ऑन है, तो आप अपने कंपनी खाते से साइन इन करते हैं।',
  workEmailLabel: 'ऑफ़िस ईमेल',
  workEmailInvalid: 'अपना पूरा ऑफ़िस ईमेल पता डालें।',
  ssoNotSetUp:
    '{domain} के लिए सिंगल साइन-ऑन सेट नहीं है। अपने पासवर्ड से साइन इन करें, या अपने एडमिनिस्ट्रेटर से पूछें कि आपका संगठन कैसे साइन इन करता है।',
  ssoBrowserNote: 'आपके संगठन का पहचान प्रदाता ब्राउज़र में खुलता है।',
  ssoDidNotFinish: '{provider} से साइन इन पूरा नहीं हुआ। फिर से कोशिश करें।',
  singleSignOn: 'सिंगल साइन-ऑन',
  ssoCouldNotStart: 'सिंगल साइन-ऑन शुरू नहीं हो सका। फिर से कोशिश करें।',
  resetTitle: 'अपना पासवर्ड रीसेट करें',
  resetEmailInvalid: 'वह ईमेल पता डालें जिससे आप साइन इन करते हैं।',
  resetDescription: 'हम आपको एक लिंक ईमेल करते हैं जिससे आप ब्राउज़र में नया पासवर्ड सेट कर सकते हैं।',
  sendResetLink: 'रीसेट लिंक भेजें',
  checkEmailTitle: 'अपना ईमेल देखें',
  checkEmailDescription:
    'अगर {email} का ClassroomIO खाता है, तो रीसेट लिंक भेज दिया गया है। उसे खोलें, नया पासवर्ड चुनें और फिर उससे यहां साइन इन करें।',
  backToSignIn: 'साइन इन पर वापस जाएं',
  useDifferentEmail: 'दूसरा ईमेल इस्तेमाल करें',
  resetEmailFailed: 'हम रीसेट ईमेल नहीं भेज सके। फिर से कोशिश करें।',
  invalidEmail: 'मान्य ईमेल पता दर्ज करें।',
  invalidCredentials: 'ईमेल या पासवर्ड गलत है।',
  emailNotVerified: 'साइन इन करने से पहले अपना ईमेल पता सत्यापित करें। लिंक आपके इनबॉक्स में है।'
};
