import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const hi: TranslatedMessages<typeof en> = {
  roleAdmin: 'एडमिन',
  roleTutor: 'ट्यूटर',
  roleStudent: 'छात्र',
  roleMember: 'सदस्य',
  loadError: 'आपके संगठन लोड नहीं हुए',
  noOrgTitle: 'अभी कोई संगठन नहीं',
  noOrgDescription:
    'यह खाता किसी संगठन का सदस्य नहीं है। अपने ट्रेनिंग एडमिन से आमंत्रण भेजने को कहें, फिर दोबारा साइन इन करें।',
  chooseTitle: 'संगठन चुनें',
  chooseDescription: 'आप बाद में अपनी प्रोफ़ाइल से संगठन बदल सकते हैं।'
};
