import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const hi: TranslatedMessages<typeof en> = {
  pathLabel: 'लर्निंग पाथ',
  courseCount: { one: '{count} कोर्स', other: '{count} कोर्स' },
  coursesComplete: '{total} में से {completed} कोर्स पूरे',
  pathCompleted: 'पाथ पूरा हुआ',
  percentComplete: '{percent} पूरा',
  stateCompleted: 'पूरा हुआ',
  stateInProgress: 'जारी है',
  stateNotStarted: 'शुरू नहीं हुआ',
  stateLocked: 'लॉक है',
  finishToUnlock: 'अनलॉक करने के लिए {course} पूरा करें',
  inOrder: 'कोर्स क्रम से अनलॉक होते हैं।',
  anyOrder: 'कोर्स किसी भी क्रम में करें।',
  courses: 'कोर्स',
  join: 'पाथ में शामिल हों',
  joined: 'आप {name} में शामिल हो गए',
  joinFailed: 'आपको इस पाथ में नहीं जोड़ा गया',
  start: 'शुरू करें',
  nextUp: 'अगला: {title}',
  notJoinableInApp: 'इस पाथ में ऐप से शामिल नहीं हुआ जा सकता।',
  loadError: 'यह लर्निंग पाथ लोड नहीं हुआ',
  emptyTitle: 'अभी कोई लर्निंग पाथ नहीं',
  emptyDescription: 'आप जिन पाथ में शामिल होते हैं, वे हर कोर्स की प्रगति के साथ यहां दिखते हैं।',
  suggested: 'सुझाए गए पाथ'
};
