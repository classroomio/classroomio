interface Tool {
  src: string;
  title: string;
  subText: string;
  slug: string;
  show: boolean;
  showFeature: boolean;
}

export const tools: Tool[] = [
  {
    src: '/free-tools/progress-report.svg',
    title: 'Progress Report',
    subText: 'Generate cool reports & monitor progress in real-time. Share reports with your network for collaborative learning',
    slug: "progress-report",
    show: true,
    showFeature: true
  },
  {
    src: '/free-tools/name-picker.svg',
    title: 'Random Name Picker',
    subText: 'Effortlessly choose names for class participation or group activities',
    slug: 'name-picker',
    show: true,
    showFeature: false
  },
  {
    src: '/free-tools/activity-stopwatch.svg',
    title: 'Activity Timer',
    subText: 'Stay on track and enhance productivity with our customizable timer for timed tasks, quizzes, and study sessions',
    slug: "activity-timer",
    show: true,
    showFeature: true
  },
  {
    src: '/free-tools/tic-tac.svg',
    title: 'Tic tac toe game',
    subText: "More than just a game; it's an educational tool that teaches pattern recognition, and decision-making.",
    slug: 'tic-tac-toe',
    show: true,
    showFeature: true
  },
  {
    src: '/free-tools/question-of-the-day.svg',
    title: 'Question of the day',
    subText: "Find thought-provoking 'Question of the Day' to spark discussions and promote critical thinking",
    slug: 'question-of-the-day',
    show: false,
    showFeature: false
  },
  {
    src: '/free-tools/waec.svg',
    title: 'WAEC Practice tool',
    subText: 'Ace your WAEC exams with comprehensive study materials, past questions',
    slug: 'waec',
    show: false,
    showFeature: false
  },
  {
    src: '/free-tools/jamb.svg',
    title: 'JAMB Practice tool',
    subText: 'Prepare for JAMB with past questions and instant feedback for effective exam readiness',
    slug: 'jamb',
    show: false,
    showFeature: false
  }
];