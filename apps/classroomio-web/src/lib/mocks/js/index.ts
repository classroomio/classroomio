import jsStatement from './001_js_statements';
import jsSyntax from './002_js_syntax';
import jsComment from './003_js_comments';
import jsVariables from './004_js_variables';
import jsLet from './005_js_let';
import jsConst from './006_js_const';
import jsOperator from './007_js_operators';
import jsArithmetic from './008_js_arithmetic';
import jsAssignment from './009_js_assignment';
import jsDataTypes from './010_js_dataTypes';
import jsFunctions from './011_js_functions';
import jsObjects from './012_js_objects';
import jsEvents from './013_js_events';
import jsStrings from './014_js_strings';
import jsStringMethods from './015_js_stringMethods';
import jsStringSearch from './016_stringSearch';
import jsStringTemplates from './017_js_stringTemplates';
import jsNumbers from './018_js_numbers';
import jsBigInt from './019_js_bigInt';
import jsNumberMethods from './020_js_numberMethods';

export const JS_IDS: { [key: string]: string } = {
  JS_OUTPUT: 'JS_OUTPUT',
  JS_SYNTAX: 'JS_SYNTAX',
  JS_COMMENT: 'JS_COMMENT',
  JS_VARIABLES: 'JS_VARIABLES',
  JS_LET: 'JS_LET',
  JS_CONST: 'JS_CONST',
  JS_OPERATOR: 'JS_OPERATOR',
  JS_ARITHMETIC: 'JS_ARITHMETIC',
  JS_ASSIGNMENT: 'JS_ASSIGNMENT',
  JS_DATATYPES: 'JS_DATATYPES',
  JS_FUNCTIONS: 'JS_FUNCTIONS',
  JS_OBJECTS: 'JS_OBJECTS',
  JS_EVENTS: 'JS_EVENTS',
  JS_STRINGS: 'JS_STRINGS',
  JS_STRINGMETHODS: 'JS_STRINGMETHODS',
  JS_STRINGSEARCH: 'JS_STRINGSEARCH',
  JS_STRINGTEMPLATES: 'JS_STRINGTEMPLATES',
  JS_NUMBERS: 'JS_NUMBERS',
  JS_BIGINT: 'JS_BIGINT',
  JS_NUMBERMETHODS: 'JS_NUMBERMETHODS'
};

export const JS_TEMPLATES = {
  [JS_IDS.JS_OUTPUT]: jsStatement,
  [JS_IDS.JS_SYNTAX]: jsSyntax,
  [JS_IDS.JS_COMMENT]: jsComment,
  [JS_IDS.JS_VARIABLES]: jsVariables,
  [JS_IDS.JS_LET]: jsLet,
  [JS_IDS.JS_CONST]: jsConst,
  [JS_IDS.JS_OPERATOR]: jsOperator,
  [JS_IDS.JS_ARITHMETIC]: jsArithmetic,
  [JS_IDS.JS_ASSIGNMENT]: jsAssignment,
  [JS_IDS.JS_DATATYPES]: jsDataTypes,
  [JS_IDS.JS_FUNCTIONS]: jsFunctions,
  [JS_IDS.JS_OBJECTS]: jsObjects,
  [JS_IDS.JS_EVENTS]: jsEvents,
  [JS_IDS.JS_STRINGS]: jsStrings,
  [JS_IDS.JS_STRINGMETHODS]: jsStringMethods,
  [JS_IDS.JS_STRINGSEARCH]: jsStringSearch,
  [JS_IDS.JS_STRINGTEMPLATES]: jsStringTemplates,
  [JS_IDS.JS_NUMBERS]: jsNumbers,
  [JS_IDS.JS_BIGINT]: jsBigInt,
  [JS_IDS.JS_NUMBERMETHODS]: jsNumberMethods
};
