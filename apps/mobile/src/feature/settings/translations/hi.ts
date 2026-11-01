import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const hi: TranslatedMessages<typeof en> = {
  account: 'खाता',
  name: 'नाम',
  notSet: 'सेट नहीं है',
  email: 'ईमेल',
  notifications: 'सूचनाएं',
  notificationsDescription: 'पुश, ऐप में, ईमेल और शांत समय',
  security: 'सुरक्षा',
  theme: 'थीम',
  themeSystem: 'सिस्टम',
  themeLight: 'लाइट',
  themeDark: 'डार्क',
  language: 'भाषा',
  languageSystem: 'सिस्टम',
  languageSystemDescription: 'आपके डिवाइस की भाषा के अनुसार',
  languageNotSaved: 'भाषा आपके खाते में सेव नहीं हुई',
  about: 'जानकारी',
  version: 'वर्शन',
  versionUnknown: 'अज्ञात',
  server: 'सर्वर',
  serverDescription: 'किसी दूसरे सर्वर से कनेक्ट करने के लिए साइन आउट करें।'
};
