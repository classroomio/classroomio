import reactEs6 from './001_react_es6';
import reactEs6ArrowFunction from './002_react_es6ArrowFunctions';
import reactEs6Variables from './003_react_es6Variables';
import reactEs6ArrayMethods from './004_react_es6ArrayMethods';
import reactEs6Destructuring from './005_react_es6Destructuring';
import reactEs6SpreadOperator from './006_react_es6SpreadOperator';
import reactEs6Modules from './007_react_es6Modules';
import reactEs6TenaryOperator from './008_react_es6TenaryOperator';
import reactJsx from './009_react_jsx';
import reactComponents from './010_react_components';
import reactClassComponents from './011_react_classComponents';
import reactProps from './012_react_props';
import reactEvents from './013_react_events';
import reactConditionals from './014_react_conditionals';
import reactLists from './015_react_lists';
import reactForms from './016_react_forms';
import reactRouter from './017_react_router';
import reactMemo from './018_react_memo';
import reactCssStyling from './019_react_cssStyling';
import reactSassStyling from './020_react_sassStyling';
import reactImportExport from './021_react_importingAndExporting';
import reactExtractingStateLogic from './022_react_extractingStateLogic';
import reactSharingState from './023_react_sharingState';
import reactUpdatingObjects from './024_react_updatingObjects';
import reactUpdatingArrays from './025_react_updatingArrays';
import reactUseState from './026_react_useState';
import reactUseContext from './027_react_useContext';
import reactUseEffect from './028_react_useEffect';
import reactUseReducer from './029_react_useReducer';
import reactUseRef from './030_react_useRef';
import reactUseCallback from './031_react_useCallBack';
import reactCustomHooks from './032_react_customHooks';
import reactUseMemo from './033_react_useMemo';


export const REACT_IDS: { [key: string]: string } = {
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
  REACT_USEMEMO: 'REACT_USEMEMO',
};

export const REACT_TEMPLATES = {
  [REACT_IDS.REACT_ES6]: reactEs6,
  [REACT_IDS.REACT_ES6ARROWFUNCTION]: reactEs6ArrowFunction,
  [REACT_IDS.REACT_ES6VARIABLES]: reactEs6Variables,
  [REACT_IDS.REACT_ES6ARRAYMETHODS]: reactEs6ArrayMethods,
  [REACT_IDS.REACT_ES6DESTRUCTURING]: reactEs6Destructuring,
  [REACT_IDS.REACT_ES6SPREADOPERATOR]: reactEs6SpreadOperator,
  [REACT_IDS.REACT_ES6MODULES]: reactEs6Modules,
  [REACT_IDS.REACT_ES6TENARYOPERATOR]: reactEs6TenaryOperator,
  [REACT_IDS.REACT_JSX]: reactJsx,
  [REACT_IDS.REACT_COMPONENTS]: reactComponents,
  [REACT_IDS.REACT_CLASSCOMPONENTS]: reactClassComponents,
  [REACT_IDS.REACT_PROPS]: reactProps,
  [REACT_IDS.REACT_EVENTS]: reactEvents,
  [REACT_IDS.REACT_CONDITIONALS]: reactConditionals,
  [REACT_IDS.REACT_LISTS]: reactLists,
  [REACT_IDS.REACT_FORMS]: reactForms,
  [REACT_IDS.REACT_ROUTER]: reactRouter,
  [REACT_IDS.REACT_MEMO]: reactMemo,
  [REACT_IDS.REACT_CSSSTYLING]: reactCssStyling,
  [REACT_IDS.REACT_SASSSTYLING]: reactSassStyling,
  [REACT_IDS.REACT_IMPORTEXPORT]: reactImportExport,
  [REACT_IDS.REACT_EXTRACTSTATELOGIC]: reactExtractingStateLogic,
  [REACT_IDS.REACT_SHARINGSTATE]: reactSharingState,
  [REACT_IDS.REACT_UPDATINGOBJECTS]: reactUpdatingObjects,
  [REACT_IDS.REACT_UPDATINGARRAYS]: reactUpdatingArrays,
  [REACT_IDS.REACT_USESTATE]: reactUseState,
  [REACT_IDS.REACT_USEEFFECT]: reactUseEffect,
  [REACT_IDS.REACT_USECONTEXT]: reactUseContext,
  [REACT_IDS.REACT_USEREF]: reactUseRef,
  [REACT_IDS.REACT_USEREDUCER]: reactUseReducer,
  [REACT_IDS.REACT_USECALLBACK]: reactUseCallback,
  [REACT_IDS.REACT_CUSTOMHOOKS]: reactCustomHooks,
  [REACT_IDS.REACT_USEMEMO]: reactUseMemo,
};
