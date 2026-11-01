export type DemoVideo = { link: string; title: string };

export type DemoDocument = { name: string; link: string; type: string; size: number };

/**
 * Creative Commons talks from the Internet Archive. Each one answers parallel byte-range
 * requests from the iOS player with 206; items that intermittently return 500 are left out.
 */
export const VIDEOS = {
  cssBoxModel: {
    link: 'https://archive.org/download/Untitled_20130516_0136/Untitled.mp4',
    title: 'HTML and CSS: margin vs padding'
  },
  jupyterTeaching: {
    link: 'https://archive.org/download/Europython_2017_eOVikM1z/2017_07_10_Jupyter_notebooks_for_teaching_and_learning.mp4',
    title: 'Jupyter notebooks for teaching and learning'
  },
  pythonAutoreloader: {
    link: 'https://archive.org/download/Europython_2019_voDAMGda/2019_07_10_Writing_a_Python_autoreloader.mp4',
    title: 'Writing a Python autoreloader'
  },
  decisionScience: {
    link: 'https://archive.org/download/Europython_2020_koY0LSi2/2020_07_23_Decision_Science_with_Probabilistic_Programming.mp4',
    title: 'Decision science with probabilistic programming'
  },
  thinkingInPython: {
    link: 'https://archive.org/download/Europython_2019_xY5k0Avz/2019_07_11_How_Thinking_in_Python_Made_Me_a_Better_Software_Engineer.mp4',
    title: 'How thinking in Python made me a better software engineer'
  },
  pythonFunctions: {
    link: 'https://archive.org/download/Europython_2018_7JQqn6CM/2018_07_26_More_Than_You_Ever_Wanted_To_Know_About_Python_Functions.ia.mp4',
    title: 'More than you ever wanted to know about Python functions'
  },
  everydayLeadership: {
    link: 'https://archive.org/download/DrewDudley_2011X/DrewDudley_2011X.mp4',
    title: 'Everyday leadership'
  },
  physicsOfMarketing: {
    link: 'https://archive.org/download/DanCobley_2010G/DanCobley_2010G.mp4',
    title: 'What physics taught me about marketing'
  },
  feedbackThatHelps: {
    link: 'https://archive.org/download/BillGates_2013S/BillGates_2013S.mp4',
    title: 'Why feedback needs a system'
  },
  techManagement: {
    link: 'https://archive.org/download/osconeu2015-crash-course-in-tech-management/025_a_crash_course_in_tech_management_vm_brasseur_vmbrasseur.mp4',
    title: 'A crash course in tech management'
  },
  designThinkingPanel: {
    link: 'https://archive.org/download/drupalconchi_day2_design_thinking/DesignThinkingPanel_512kb.mp4',
    title: 'Design thinking panel'
  },
  successionPlanning: {
    link: 'https://archive.org/download/fosdem2018-successionplanning/02-fosdem2018-successionplanning-practice02.mp4',
    title: 'Passing the baton: succession planning'
  },
  timeManagement: {
    link: 'https://archive.org/download/GabrielRobins_TimeManagement_byRandyPausch/TimeManagementbyRandyPausch_512kb.mp4',
    title: 'Time management with Randy Pausch'
  },
  transformMarketing: {
    link: 'https://archive.org/download/InboundMarketing-2TransformYourMarketingSethGodinIMS08714/InboundMarketing-2TransformYourMarketingSethGodinIMS08714_512kb.mp4',
    title: 'Transform your marketing with Seth Godin'
  },
  mobileAccessibility: {
    link: 'https://archive.org/download/a11ynyc0724/a11ynyc0724.mp4',
    title: 'Mobile accessibility tools: camera switches and more'
  },
  interfaceTherapy: {
    link: 'https://archive.org/download/drupalconchi_day3_interface_therapy/interfacetherapy_512kb.mp4',
    title: 'Interface therapy: emotional design'
  },
  webTypography: {
    link: 'https://archive.org/download/DrupalconDc2009-TypographyAndLayoutOnTheWeb/DrupalConDC2009-TypographyAndLayoutontheWeb_500kbps.mp4',
    title: 'Typography and layout on the web'
  },
  learnableUx: {
    link: 'https://archive.org/download/wikimania2013-MakeyouruserexperienceeasytolearnMatthewFlaschen/wikimania2013-MakeyouruserexperienceeasytolearnMatthewFlaschen.mp4',
    title: 'Make your user experience easy to learn'
  },
  fullStackReact: {
    link: 'https://archive.org/download/Europython_2017_IG04kzp7/2017_07_10_Building_a_full_stack_web_application_with_Python_NPM_Webpack_and_React.mp4',
    title: 'Building a full-stack web app with Python and React'
  },
  webSockets: {
    link: 'https://archive.org/download/Europython_2018_Yu0kOK94/2018_07_26_Python_and_Web_Sockets.ia.mp4',
    title: 'Real-time apps with WebSockets'
  },
  djangoTesting: {
    link: 'https://archive.org/download/Europython_2020_XmERDgac/2020_07_23_Django_Testing_on_Steroid_pytest_and_Hypothesis.mp4',
    title: 'Django testing with pytest and Hypothesis'
  },
  systemTesting: {
    link: 'https://archive.org/download/Europython_2018_HWZ9IN08/2018_07_27_System_testing_with_Pytest_Docker_and_Flask.ia.mp4',
    title: 'System testing with pytest, Docker and Flask'
  },
  advancedPytest: {
    link: 'https://archive.org/download/Europython_2019_IPpDc65g/2019_07_11_Advanced_pytest.mp4',
    title: 'Advanced pytest'
  },
  dockerBuilds: {
    link: 'https://archive.org/download/Europython_2019_SDaByu6h/2019_07_12_Optimizing_Docker_builds_for_Python_applications.mp4',
    title: 'Optimizing Docker builds for Python applications'
  },
  deploymentFriendly: {
    link: 'https://archive.org/download/Europython_2018_ANO29bsw/2018_07_26_How_to_Write_Deployment_friendly_Applications.ia.mp4',
    title: 'How to write deployment-friendly applications'
  },
  pandasFly: {
    link: 'https://archive.org/download/Europython_2020_T7NdhzBb/2020_07_24_Making_Pandas_Fly.mp4',
    title: 'Making pandas fly'
  },
  pandasIndexes: {
    link: 'https://archive.org/download/Europython_2017_tk2AcmEM/2017_07_12_Neat_Analytics_with_Pandas_Indexes.mp4',
    title: 'Neat analytics with pandas indexes'
  },
  naiveBayes: {
    link: 'https://archive.org/download/Europython_2018_Qwdr9ETH/2018_07_26_Building_a_Naive_Bayes_Text_Classifier_with_scikit_learn.ia.mp4',
    title: 'Building a Naive Bayes text classifier with scikit-learn'
  },
  whenToUseMl: {
    link: 'https://archive.org/download/Europython_2018_9WqfXOkG/2018_07_26_When_to_use_Machine_Learning_Tips_Tricks_and_Warnings.ia.mp4',
    title: 'When to use machine learning'
  },
  vizDebugging: {
    link: 'https://archive.org/download/Europython_2018_FY2Xkfch/2018_07_26_Debugging_Your_Code_with_Data_Visualization.ia.mp4',
    title: 'Debugging your code with data visualization'
  },
  dataEthics: {
    link: 'https://archive.org/download/Europython_2018_1SclTQeo/2018_07_27_Trust_me_Im_a_Data_Scientist_ethics_for_builders_of_data_based_applications.ia.mp4',
    title: 'Ethics for builders of data-based applications'
  },
  securityBootcamp: {
    link: 'https://archive.org/download/Europython_2017_HquA52hg/2017_07_11_CyberSecuritybootcamp.mp4',
    title: 'Cybersecurity bootcamp'
  },
  deceptiveSecurity: {
    link: 'https://archive.org/download/Europython_2020_pFaQBnev/2020_07_24_Deceptive_Security_using_Python.mp4',
    title: 'Deceptive security: honeypots and canaries'
  },
  startupAdvice: {
    link: 'https://archive.org/download/Europython_2018_6KZr8cIy/2018_07_26_How_to_Ignore_Most_Startup_Advice_and_Build_a_Decent_Software_Business.ia.mp4',
    title: 'How to ignore most startup advice and build a decent software business'
  },
  fastProductDevelopment: {
    link: 'https://archive.org/download/Europython_2017_7cmLnsFt/2017_07_13_Fast_product_development_using_Django_Rest_Framework_lessonslearned.mp4',
    title: 'Fast product development: lessons learned'
  },
  cleanAbstractions: {
    link: 'https://archive.org/download/Europython_2020_jxq7QIPb/2020_07_24_Writing_Clean_Abstractions.mp4',
    title: 'Writing clean abstractions'
  },
  pythonicRefactoring: {
    link: 'https://archive.org/download/Europython_2017_3rHoMgIw/2017_07_14_Pythonic_Refactoring_Protecting_Your_Users_From_Change.mp4',
    title: 'Pythonic refactoring: protecting your users from change'
  },
  asyncioInPractice: {
    link: 'https://archive.org/download/Europython_2018_1suxMSHU/2018_07_26_asyncio_in_Practice_We_Did_It_Wrong.ia.mp4',
    title: 'asyncio in practice: we did it wrong'
  },
  debuggingPractices: {
    link: 'https://archive.org/download/Europython_2017_Xf0YUFMI/2017_07_10_Best_Practices_for_Debugging.mp4',
    title: 'Best practices for debugging'
  },
  exceptionalExceptions: {
    link: 'https://archive.org/download/Europython_2019_oWnBfVYL/2019_07_11_Exceptional_Exceptions.mp4',
    title: 'Exceptional exceptions'
  },
  canWeDeployYet: {
    link: 'https://archive.org/download/Europython_2020_LGqP7ubE/2020_07_24_Can_we_deploy_yet.mp4',
    title: 'Can we deploy yet? Release pipelines that earn trust'
  },
  remoteTeaching: {
    link: 'https://archive.org/download/Europython_2020_2A85jfJW/2020_07_24_Python_Emergency_Remote_Teaching.mp4',
    title: 'Lessons from emergency remote teaching'
  }
} satisfies Record<string, DemoVideo>;

export const YOUTUBE_VIDEOS = {
  softwareArchitecture: {
    link: 'https://youtu.be/pXLWqkA87e4',
    title: 'Explaining architecture in software'
  },
  mvcIntroduction: {
    link: 'https://youtu.be/4Qfk8MhtZJU',
    title: 'MVC: an introduction to the pattern'
  },
  reactIn100Seconds: {
    link: 'https://www.youtube.com/watch?v=Tn6-PIqc4UM',
    title: 'React in 100 seconds'
  },
  pandasTutorial: {
    link: 'https://www.youtube.com/watch?v=vmEHCJofslg',
    title: 'Complete pandas tutorial'
  },
  machineLearningForEverybody: {
    link: 'https://www.youtube.com/watch?v=i_LwzRVP7bg',
    title: 'Machine learning for everybody'
  },
  sqlForBeginners: {
    link: 'https://www.youtube.com/watch?v=7S_tz1z_5bA',
    title: 'SQL for beginners'
  },
  htmlCrashCourse: {
    link: 'https://www.youtube.com/watch?v=qz0aGYrrlhU',
    title: 'HTML crash course'
  },
  typescriptTutorial: {
    link: 'https://www.youtube.com/watch?v=30LWjhZzg50',
    title: 'Learn TypeScript'
  },
  dataCleaning: {
    link: 'https://www.youtube.com/watch?v=LI7s_lyooO8',
    title: 'Data cleaning techniques'
  },
  whatIsAi: {
    link: 'https://www.youtube.com/watch?v=2ePf9rue1Ao',
    title: 'What is artificial intelligence?'
  }
} satisfies Record<string, DemoVideo>;

export const DOCUMENTS = {
  pandasCheatSheet: {
    name: 'Pandas cheat sheet.pdf',
    link: 'https://pandas.pydata.org/Pandas_Cheat_Sheet.pdf',
    type: 'application/pdf',
    size: 398312
  },
  matplotlibCheatSheets: {
    name: 'Matplotlib cheat sheets.pdf',
    link: 'https://matplotlib.org/cheatsheets/cheatsheets.pdf',
    type: 'application/pdf',
    size: 2924945
  },
  nistDigitalIdentity: {
    name: 'NIST SP 800-63B Digital Identity Guidelines.pdf',
    link: 'https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-63b.pdf',
    type: 'application/pdf',
    size: 1480377
  },
  owaspTopTen: {
    name: 'OWASP Top 10.pdf',
    link: 'https://owasp.org/www-pdf-archive/OWASP_Top_10-2017_%28en%29.pdf.pdf',
    type: 'application/pdf',
    size: 1787737
  },
  pytestDocs: {
    name: 'pytest documentation.pdf',
    link: 'https://media.readthedocs.org/pdf/pytest/latest/pytest.pdf',
    type: 'application/pdf',
    size: 2325462
  }
} satisfies Record<string, DemoDocument>;

function unsplash(photoId: string) {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1200&q=70`;
}

export const COURSE_IMAGES = {
  mvc: unsplash('1555066931-4365d14bab8c'),
  productFundamentals: unsplash('1531482615713-2afd69097998'),
  pythonEngineering: unsplash('1526379095098-d400fd0bf935'),
  pytest: unsplash('1515879218367-8466d910aaa4'),
  docker: unsplash('1542831371-29b0f74f9713'),
  machineLearning: unsplash('1551288049-bebda4e38f71'),
  uxDesign: unsplash('1561070791-2526d30994b5'),
  productManagement: unsplash('1552664730-d307ca884978'),
  leadership: unsplash('1522071820081-009f0129c71c'),
  marketing: unsplash('1557804506-669a67965ba0'),
  productivity: unsplash('1434030216411-0b793f4b4173'),
  securityAwareness: unsplash('1563986768609-322da13575f3'),
  privacy: unsplash('1450101499163-c8848c66ca85'),
  codeOfConduct: unsplash('1589829545856-d10d557cf95f'),
  incidentResponse: unsplash('1550751827-4bd374c3f58b'),
  secureCoding: unsplash('1461749280684-dccba630e2f6'),
  managerEssentials: unsplash('1517245386807-bb43f82c33c4'),
  brandDesign: unsplash('1581291518857-4e27b48ff24e'),
  contentMarketing: unsplash('1533750349088-cd871a92f312'),
  founderFinance: unsplash('1454165804606-c3d57bc86b40'),
  dataCohort: unsplash('1460925895917-afdab827c52f'),
  leadershipCohort: unsplash('1600880292203-757bb62b4baf')
};
