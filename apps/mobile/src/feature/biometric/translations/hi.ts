import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const hi: TranslatedMessages<typeof en> = {
  methodFingerprint: 'फ़िंगरप्रिंट',
  methodFaceUnlock: 'फ़ेस अनलॉक',
  methodBiometrics: 'बायोमेट्रिक्स',
  lockDuration: { other: '{count} मिनट' },
  settingDescription: 'ऐप खोलने पर और बैकग्राउंड में {duration} के बाद पूछता है।',
  settingSetUp: 'इसे यहां इस्तेमाल करने के लिए डिवाइस की सेटिंग्स में {method} सेट अप करें।',
  settingUnsupported: 'यह डिवाइस बायोमेट्रिक अनलॉक सपोर्ट नहीं करता।',
  turnOnPrompt: '{method} से अनलॉक चालू करें',
  stillOff: '{method} से अनलॉक अभी भी बंद है',
  unlockWith: '{method} से अनलॉक करें',
  offerTitle: '{method} से अनलॉक करें?',
  offerDescription:
    'ऐप खोलने पर और {duration} बाद लौटने पर ClassroomIO {method} मांगेगा। दोनों स्थितियों में आप साइन इन रहेंगे। आप इसे सेटिंग्स में बदल सकते हैं।',
  notNow: 'अभी नहीं',
  turnOn: 'चालू करें',
  isOn: '{method} से अनलॉक चालू है',
  isOnDescription: 'आप इसे सेटिंग्स में बंद कर सकते हैं।',
  isOff: '{method} से अनलॉक बंद है',
  unlockPrompt: 'ClassroomIO अनलॉक करें',
  lockedTitle: 'ClassroomIO लॉक है',
  lockedDescription: 'जारी रखने के लिए {method} इस्तेमाल करें।',
  lockedDescriptionWithEmail: '{email} के रूप में साइन इन है। जारी रखने के लिए {method} इस्तेमाल करें।',
  errorLockout: 'बहुत ज़्यादा कोशिशों के बाद {method} लॉक हो गया है। अपने डिवाइस का पासकोड इस्तेमाल करें।',
  errorNotSetUp: 'इस डिवाइस पर {method} सेट अप नहीं है।',
  errorNotRecognized: '{method} आपको पहचान नहीं सका। फिर से कोशिश करें।'
};
