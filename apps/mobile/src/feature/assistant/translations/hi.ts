import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const hi: TranslatedMessages<typeof en> = {
  title: 'AI से पूछें',
  description: 'आपके कोर्स और लक्ष्यों के बारे में',
  emptyTitle: 'अपनी पढ़ाई के बारे में पूछें',
  emptyDescription: 'अपने कोर्स, अगली समय-सीमा या साप्ताहिक लक्ष्य पूरा करने के बारे में पूछें।',
  placeholder: 'सवाल पूछें',
  inputLabel: 'सहायक के लिए सवाल',
  send: 'भेजें',
  stop: 'जवाब रोकें',
  stopped: 'जवाब रुक गया। जारी रखने के लिए फिर से पूछें।',
  requestFailed: 'सहायक ने जवाब नहीं दिया',
  capReachedTitle: 'इस महीने कोई सवाल नहीं बचा',
  capReachedDescription: 'आपका संगठन तय करता है कि हर शिक्षार्थी कितने सवाल पूछ सकता है।',
  poolExhaustedTitle: 'सहायक उपलब्ध नहीं है',
  poolExhaustedDescription: 'आपके संगठन ने इस महीने का AI कोटा इस्तेमाल कर लिया है।',
  disabledTitle: 'सहायक बंद है',
  disabledDescription: 'आपके संगठन ने AI ट्यूटर चालू नहीं किया है।',
  notConfiguredTitle: 'सहायक उपलब्ध नहीं है',
  notConfiguredDescription: 'इस सर्वर पर कोई AI प्रदाता सेट नहीं है।',
  noCoursesTitle: 'पहले किसी कोर्स में शामिल हों',
  noCoursesDescription: 'सहायक उन कोर्स के बारे में जवाब देता है जिनमें आप नामांकित हैं।'
};
