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
  serverDescription: 'किसी दूसरे सर्वर से कनेक्ट करने के लिए साइन आउट करें।',
  appearance: 'रूप',
  general: 'सामान्य',
  videoAndDownloads: 'वीडियो और डाउनलोड',
  videoQuality: 'स्ट्रीमिंग गुणवत्ता',
  videoQualityAuto: 'स्वचालित',
  videoQualityAutoDescription: 'आपका कनेक्शन जितनी अनुमति देता है, उतनी सबसे अच्छी गुणवत्ता',
  videoQualityStandard: '720p तक',
  videoQualityStandardDescription: 'कम मोबाइल डेटा का उपयोग करता है',
  videoQualityDataSaver: 'डेटा सेवर',
  videoQualityDataSaverDescription: '480p तक, सबसे कम मोबाइल डेटा का उपयोग करता है',
  videoQualityFooter:
    'आपके संगठन द्वारा स्ट्रीम किए जाने वाले वीडियो का अधिकतम रेज़ोल्यूशन तय करता है। डाउनलोड किए गए पाठ और YouTube या Vimeo के वीडियो इससे प्रभावित नहीं होते।',
  downloads: 'डाउनलोड'
};
