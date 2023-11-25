import phpSyntax from './001_php_syntax';
import phpComments from './002_php_comments';
import phpVariables from './003_php_variables';
import phpEcho from './004_php_echo';
import phpDataTypes from './005_php_dataTypes';
import phpString from './006_php_string';
import phpNumbers from './007_php_numbers';
import phpMath from './008_php_math';
import phpConstants from './009_php_constants';
import phpOperators from './010_php_operators';
import phpConditionals from './011_php_conditionals';
import phpSwitch from './012_php_switch';
import phpLoops from './013_php_loops';
import phpFunctions from './014_php_functions';
import phpArrays from './015_php_arrays';
import phpSuperglobal from './016_php_superGlobal';
import phpRegex from './017_php_regex';
import phpForms from './018_php_forms';
import phpFormValidation from './019_php_formValidation';
import phpFormRequired from './020_php_formRequired';

export const PHP_IDS: { [key: string]: string } = {
  PHP_SYNTAX: 'PHP_SYNTAX',
  PHP_COMMENTS: 'PHP_COMMENTS',
  PHP_VARIABLES: 'PHP_VARIABLES',
  PHP_ECHO: 'PHP_ECHO',
  PHP_DATATYPES: 'PHP_DATATYPES',
  PHP_STRING: 'PHP_STRING',
  PHP_NUMBERS: 'PHP_NUMBERS',
  PHP_MATH: 'PHP_MATH',
  PHP_CONSTANTS: 'PHP_CONSTANTS',
  PHP_OPERATORS: 'PHP_OPERATORS',
  PHP_CONDITIONALS: 'PHP_CONDITIONALS',
  PHP_SWITCH: 'PHP_SWITCH',
  PHP_LOOPS: 'PHP_LOOPS',
  PHP_FUNCTIONS: 'PHP_FUNCTIONS',
  PHP_ARRAYS: 'PHP_ARRAYS',
  PHP_SUPERGLOBAL: 'PHP_SUPERGLOBAL',
  PHP_REGEX: 'PHP_REGEX',
  PHP_FORMS: 'PHP_FORMS',
  PHP_FORMVALIDATION: 'PHP_FORMVALIDATION',
  PHP_FORMREQUIRED: 'PHP_FORMREQUIRED'
};

export const PHP_TEMPLATES = {
  [PHP_IDS.PHP_SYNTAX]: phpSyntax,
  [PHP_IDS.PHP_COMMENTS]: phpComments,
  [PHP_IDS.PHP_VARIABLES]: phpVariables,
  [PHP_IDS.PHP_ECHO]: phpEcho,
  [PHP_IDS.PHP_DATATYPES]: phpDataTypes,
  [PHP_IDS.PHP_STRING]: phpString,
  [PHP_IDS.PHP_NUMBERS]: phpNumbers,
  [PHP_IDS.PHP_MATH]: phpMath,
  [PHP_IDS.PHP_CONSTANTS]: phpConstants,
  [PHP_IDS.PHP_OPERATORS]: phpOperators,
  [PHP_IDS.PHP_CONDITIONALS]: phpConditionals,
  [PHP_IDS.PHP_SWITCH]: phpSwitch,
  [PHP_IDS.PHP_LOOPS]: phpLoops,
  [PHP_IDS.PHP_FUNCTIONS]: phpFunctions,
  [PHP_IDS.PHP_ARRAYS]: phpArrays,
  [PHP_IDS.PHP_SUPERGLOBAL]: phpSuperglobal,
  [PHP_IDS.PHP_REGEX]: phpRegex,
  [PHP_IDS.PHP_FORMS]: phpForms,
  [PHP_IDS.PHP_FORMVALIDATION]: phpFormValidation,
  [PHP_IDS.PHP_FORMREQUIRED]: phpFormRequired
};
