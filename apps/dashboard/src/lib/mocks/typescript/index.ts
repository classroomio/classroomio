import tsSimpleTypes from './001_ts_simpleTypes';
import tsSpecialTypes from './002_ts_specialTypes';
import tsArrays from './003_ts_arrays';
import tsTuples from './004_ts_tuples';
import tsObjectTypes from './005_ts_objectTypes';
import tsEnums from './006_ts_enums';
import tsInterfaces from './007_ts_interfaces';
import tsUnionTypes from './008_ts_unionTypes';
import tsFunctions from './009_ts_functions';
import tsCasting from './010_ts_casting';
import tsClasses from './011_ts_classes';
import tsBasicGenerics from './012_ts_basicGenerics';
import tsUtilityTypes from './013_ts_utilityTypes';
import tsKeyOf from './014_ts_keyOf';
import tsNull from './015_ts_null';
import tsDefinitelyTyped from './016_ts_definitelyTyped';

export const TS_IDS: { [key: string]: string } = {
  TS_SIMPLETYPES: 'TS_SIMPLETYPES',
  TS_SPECIALTYPES: 'TS_SPECIALTYPES',
  TS_ARRAYS: 'TS_ARRAYS',
  TS_TUPLES: 'TS_TUPLES',
  TS_OBJECTTYPES: 'TS_OBJECTTYPES',
  TS_ENUMS: 'TS_ENUMS',
  TS_INTERFACES: 'TS_INTERFACES',
  TS_UNIONTYPES: 'TS_UNIONTYPES',
  TS_FUNCTIONS: 'TS_FUNCTIONS',
  TS_CASTING: 'TS_CASTING',
  TS_CLASSES: 'TS_CLASSES',
  TS_BASICGENERICS: 'TS_BASICGENERICS',
  TS_UTILITYTYPES: 'TS_UTILITYTYPES',
  TS_KEYOF: 'TS_KEYOF',
  TS_NULL: 'TS_NULL',
  TS_DEFINITELYTYPED: 'TS_DEFINITELYTYPED'
};

export const TS_TEMPLATES = {
  [TS_IDS.TS_SIMPLETYPES]: tsSimpleTypes,
  [TS_IDS.TS_SPECIALTYPES]: tsSpecialTypes,
  [TS_IDS.TS_ARRAYS]: tsArrays,
  [TS_IDS.TS_TUPLES]: tsTuples,
  [TS_IDS.TS_OBJECTTYPES]: tsObjectTypes,
  [TS_IDS.TS_ENUMS]: tsEnums,
  [TS_IDS.TS_INTERFACES]: tsInterfaces,
  [TS_IDS.TS_UNIONTYPES]: tsUnionTypes,
  [TS_IDS.TS_FUNCTIONS]: tsFunctions,
  [TS_IDS.TS_CASTING]: tsCasting,
  [TS_IDS.TS_CLASSES]: tsClasses,
  [TS_IDS.TS_BASICGENERICS]: tsBasicGenerics,
  [TS_IDS.TS_UTILITYTYPES]: tsUtilityTypes,
  [TS_IDS.TS_KEYOF]: tsKeyOf,
  [TS_IDS.TS_NULL]: tsNull,
  [TS_IDS.TS_DEFINITELYTYPED]: tsDefinitelyTyped
};
