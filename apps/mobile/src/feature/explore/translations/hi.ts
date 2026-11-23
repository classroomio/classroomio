import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const hi: TranslatedMessages<typeof en> = {
  emptyTitle: 'कोई अन्य कोर्स नहीं',
  emptyDescription: 'आपके संगठन में आपके लिए कोई अन्य कोर्स उपलब्ध नहीं है।',
  loadError: 'कोर्स लोड नहीं हुए',
  courseLoadError: 'यह कोर्स लोड नहीं हुआ',
  about: 'इस कोर्स के बारे में',
  goals: 'आप क्या सीखेंगे',
  requirements: 'आवश्यकताएँ',
  enroll: 'नामांकन करें',
  goToCourse: 'कोर्स पर जाएँ',
  enrolledToast: 'आपका {title} में नामांकन हो गया है',
  enrollFailed: 'नामांकन नहीं हुआ',
  enrollFull: 'यह कोर्स अभी नए शिक्षार्थी नहीं ले रहा है। अपने संगठन से संपर्क करें।',
  enrollMembersOnly: 'केवल इस संगठन के सदस्य नामांकन कर सकते हैं। किसी एडमिन से आमंत्रण माँगें।',
  enrollUnavailable: 'इस कोर्स में ऐप से नामांकन नहीं किया जा सकता।',
  paidNotAvailable: 'इस कोर्स में ऐप से नामांकन नहीं किया जा सकता।',
  inviteOnly: 'इस कोर्स में आपका संगठन शिक्षार्थियों का नामांकन करता है।',
  originalPrice: 'मूल कीमत {price}',
  pathsTitle: 'लर्निंग पाथ',
  coursesTitle: 'कोर्स',
  searchCatalog: 'पाथ और कोर्स खोजें'
};
