export const REACTJS_IDS: { [key: string]: string } = {
  REACT_ES6: 'REACT_ES6',
  REACT_ES6ARROWFUNCTION: 'REACT_ES6ARROWFUNCTION',
  REACT_ES6VARIABLES: 'REACT_ES6VARIABLES',
  REACT_ES6ARRAYMETHODS: 'REACT_ES6ARRAYMETHODS',
  REACT_ES6DESTRUCTURING: 'REACT_ES6DESTRUCTURING',
  REACT_ES6SPREADOPERATOR: 'REACT_ES6SPREADOPERATOR',
  REACT_ES6MODULES: 'REACT_ES6MODULES',
  REACT_ES6TENARYOPERATOR: 'REACT_ES6TENARYOPERATOR',
  REACT_JSX: 'REACT_JSX',
  REACT_COMPONENTS: 'REACT_COMPONENTS',
  REACT_CLASSCOMPONENTS: 'REACT_CLASSCOMPONENTS',
  REACT_PROPS: 'REACT_PROPS',
  REACT_EVENTS: 'REACT_EVENTS',
  REACT_CONDITIONALS: 'REACT_CONDITIONALS',
  REACT_LISTS: 'REACT_LISTS',
  REACT_FORMS: 'REACT_FORMS',
  REACT_ROUTER: 'REACT_ROUTER',
  REACT_MEMO: 'REACT_MEMO',
  REACT_CSSSTYLING: 'REACT_CSSSTYLING',
  REACT_SASSSTYLING: 'REACT_SASSSTYLING',
  REACT_IMPORTEXPORT: 'REACT_IMPORTEXPORT',
  REACT_EXTRACTSTATELOGIC: 'REACT_EXTRACTSTATELOGIC',
  REACT_SHARINGSTATE: 'REACT_SHARINGSTATE',
  REACT_UPDATINGOBJECTS: 'REACT_UPDATINGOBJECTS',
  REACT_UPDATINGARRAYS: 'REACT_UPDATINGARRAYS',
  REACT_USESTATE: 'REACT_USESTATE',
  REACT_USEEFFECT: 'REACT_USEEFFECT',
  REACT_USECONTEXT: 'REACT_USECONTEXT',
  REACT_USEREF: 'REACT_USEREF',
  REACT_USEREDUCER: 'REACT_USEREDUCER',
  REACT_USECALLBACK: 'REACT_USECALLBACK',
  REACT_CUSTOMHOOKS: 'REACT_CUSTOMHOOKS',
  REACT_USEMEMO: 'REACT_USEMEMO'
};

export const REACTJS_TEMPLATES = {
  [REACTJS_IDS.REACT_ES6]: async () => (await import('./001_react_es6')).default,
  [REACTJS_IDS.REACT_ES6ARROWFUNCTION]: async () =>
    (await import('./002_react_es6ArrowFunctions')).default,
  [REACTJS_IDS.REACT_ES6VARIABLES]: async () => (await import('./003_react_es6Variables')).default,
  [REACTJS_IDS.REACT_ES6ARRAYMETHODS]: async () =>
    (await import('./004_react_es6ArrayMethods')).default,
  [REACTJS_IDS.REACT_ES6DESTRUCTURING]: async () =>
    (await import('./005_react_es6Destructuring')).default,
  [REACTJS_IDS.REACT_ES6SPREADOPERATOR]: async () =>
    (await import('./006_react_es6SpreadOperator')).default,
  [REACTJS_IDS.REACT_ES6MODULES]: async () => (await import('./007_react_es6Modules')).default,
  [REACTJS_IDS.REACT_ES6TENARYOPERATOR]: async () =>
    (await import('./008_react_es6TenaryOperator')).default,
  [REACTJS_IDS.REACT_JSX]: async () => (await import('./009_react_jsx')).default,
  [REACTJS_IDS.REACT_COMPONENTS]: async () => (await import('./010_react_components')).default,
  [REACTJS_IDS.REACT_CLASSCOMPONENTS]: async () =>
    (await import('./011_react_classComponents')).default,
  [REACTJS_IDS.REACT_PROPS]: async () => (await import('./012_react_props')).default,
  [REACTJS_IDS.REACT_EVENTS]: async () => (await import('./013_react_events')).default,
  [REACTJS_IDS.REACT_CONDITIONALS]: async () => (await import('./014_react_conditionals')).default,
  [REACTJS_IDS.REACT_LISTS]: async () => (await import('./015_react_lists')).default,
  [REACTJS_IDS.REACT_FORMS]: async () => (await import('./016_react_forms')).default,
  [REACTJS_IDS.REACT_ROUTER]: async () => (await import('./017_react_router')).default,
  [REACTJS_IDS.REACT_MEMO]: async () => (await import('./018_react_memo')).default,
  [REACTJS_IDS.REACT_CSSSTYLING]: async () => (await import('./019_react_cssStyling')).default,
  [REACTJS_IDS.REACT_SASSSTYLING]: async () => (await import('./020_react_sassStyling')).default,
  [REACTJS_IDS.REACT_IMPORTEXPORT]: async () =>
    (await import('./021_react_importingAndExporting')).default,
  [REACTJS_IDS.REACT_EXTRACTSTATELOGIC]: async () =>
    (await import('./022_react_extractingStateLogic')).default,
  [REACTJS_IDS.REACT_SHARINGSTATE]: async () => (await import('./023_react_sharingState')).default,
  [REACTJS_IDS.REACT_UPDATINGOBJECTS]: async () =>
    (await import('./024_react_updatingObjects')).default,
  [REACTJS_IDS.REACT_UPDATINGARRAYS]: async () =>
    (await import('./025_react_updatingArrays')).default,
  [REACTJS_IDS.REACT_USESTATE]: async () => (await import('./026_react_useState')).default,
  [REACTJS_IDS.REACT_USEEFFECT]: async () => (await import('./028_react_useEffect')).default,
  [REACTJS_IDS.REACT_USECONTEXT]: async () => (await import('./027_react_useContext')).default,
  [REACTJS_IDS.REACT_USEREF]: async () => (await import('./030_react_useRef')).default,
  [REACTJS_IDS.REACT_USEREDUCER]: async () => (await import('./029_react_useReducer')).default,
  [REACTJS_IDS.REACT_USECALLBACK]: async () => (await import('./031_react_useCallBack')).default,
  [REACTJS_IDS.REACT_CUSTOMHOOKS]: async () => (await import('./032_react_customHooks')).default,
  [REACTJS_IDS.REACT_USEMEMO]: async () => (await import('./033_react_useMemo')).default
};
