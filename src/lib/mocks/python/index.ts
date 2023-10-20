import pythonSyntax from './001_python_syntax';
import pythonComments from './002_python_comments';
import pythonVariables from './003_python_variables';
import pythonDataTypes from './004_python_dataTypes';
import pythonNumbers from './005_python_numbers'; 
import pythonCasting from './006_python_casting';
import pythonStrings from './007_python_strings';
import pythonBooleans from './008_python_booleans';
import pythonOperators from './009_python_operators';
import pythonLists from './010_python_lists';
import pythonTuples from './011_python_tuples';
import pythonSets from './012_python_sets';
import pythonDictionaries from './013_python_dictionaries';
import pythonConditionals from './014_python_conditionals';
import pythonWhileLoops from './015_python_whileLoops';
import pythonForLoops from './016_python_forLoops';
import pythonFunctions from './017_python_functions';
import pythonLambda from './018_python_lambda';
import pythonArrays from './019_python_arrays';
import pythonClasses from './020_python_classes';

export const PYTHON_IDS: { [key: string]: string } = {
  PYTHON_SYNTAX: 'PYTHON_SYNTAX',
  PYTHON_COMMENTS: 'PYTHON_COMMENTS',
  PYTHON_VARIABLES: 'PYTHON_VARIABLES',
  PYTHON_DATATYPES: 'PYTHON_DATATYPES',
  PYTHON_NUMBERS: 'PYTHON_NUMBERS',
  PYTHON_CASTING: 'PYTHON_CASTING',
  PYTHON_STRINGS: 'PYTHON_STRINGS',
  PYTHON_BOOLEANS: 'PYTHON_BOOLEANS',
  PYTHON_OPERATORS: 'PYTHON_OPERATORS',
  PYTHON_LISTS: 'PYTHON_LISTS',
  PYTHON_TUPLES: 'PYTHON_TUPLES',
  PYTHON_SETS: 'PYTHON_SETS',
  PYTHON_DICTIONARIES: 'PYTHON_DICTIONARIES',
  PYTHON_CONDITIONALS: 'PYTHON_CONDITIONALS',
  PYTHON_WHILELOOPS: 'PYTHON_WHILELOOPS',
  PYTHON_FORLOOPS: 'PYTHON_FORLOOPS',
  PYTHON_FUNCTIONS: 'PYTHON_FUNCTIONS',
  PYTHON_LAMBDA: 'PYTHON_LAMBDA',
  PYTHON_ARRAYS: 'PYTHON_ARRAYS',
  PYTHON_CLASSES: 'PYTHON_CLASSES'
};

export const PYTHON_TEMPLATES = {
  [PYTHON_IDS.PYTHON_SYNTAX]: pythonSyntax,
  [PYTHON_IDS.PYTHON_COMMENTS]: pythonComments,
  [PYTHON_IDS.PYTHON_VARIABLES]: pythonVariables,
  [PYTHON_IDS.PYTHON_DATATYPES]: pythonDataTypes,
  [PYTHON_IDS.PYTHON_NUMBERS]: pythonNumbers,
  [PYTHON_IDS.PYTHON_CASTING]: pythonCasting,
  [PYTHON_IDS.PYTHON_STRINGS]: pythonStrings,
  [PYTHON_IDS.PYTHON_BOOLEANS]: pythonBooleans,
  [PYTHON_IDS.PYTHON_OPERATORS]: pythonOperators,
  [PYTHON_IDS.PYTHON_LISTS]: pythonLists,
  [PYTHON_IDS.PYTHON_TUPLES]: pythonTuples,
  [PYTHON_IDS.PYTHON_SETS]: pythonSets,
  [PYTHON_IDS.PYTHON_DICTIONARIES]: pythonDictionaries,
  [PYTHON_IDS.PYTHON_CONDITIONALS]: pythonConditionals,
  [PYTHON_IDS.PYTHON_WHILELOOPS]: pythonWhileLoops,
  [PYTHON_IDS.PYTHON_FORLOOPS]: pythonForLoops,
  [PYTHON_IDS.PYTHON_FUNCTIONS]: pythonFunctions,
  [PYTHON_IDS.PYTHON_LAMBDA]: pythonLambda,
  [PYTHON_IDS.PYTHON_ARRAYS]: pythonArrays,
  [PYTHON_IDS.PYTHON_CLASSES]: pythonClasses,
};
