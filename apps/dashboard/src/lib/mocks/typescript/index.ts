export const TYPESCRIPT_IDS: { [key: string]: string } = {
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

export const TYPESCRIPT_TEMPLATES = {
  [TYPESCRIPT_IDS.TS_SIMPLETYPES]: async () => (await import('./001_ts_simpleTypes')).default,
  [TYPESCRIPT_IDS.TS_SPECIALTYPES]: async () => (await import('./002_ts_specialTypes')).default,
  [TYPESCRIPT_IDS.TS_ARRAYS]: async () => (await import('./003_ts_arrays')).default,
  [TYPESCRIPT_IDS.TS_TUPLES]: async () => (await import('./004_ts_tuples')).default,
  [TYPESCRIPT_IDS.TS_OBJECTTYPES]: async () => (await import('./005_ts_objectTypes')).default,
  [TYPESCRIPT_IDS.TS_ENUMS]: async () => (await import('./006_ts_enums')).default,
  [TYPESCRIPT_IDS.TS_INTERFACES]: async () => (await import('./007_ts_interfaces')).default,
  [TYPESCRIPT_IDS.TS_UNIONTYPES]: async () => (await import('./008_ts_unionTypes')).default,
  [TYPESCRIPT_IDS.TS_FUNCTIONS]: async () => (await import('./009_ts_functions')).default,
  [TYPESCRIPT_IDS.TS_CASTING]: async () => (await import('./010_ts_casting')).default,
  [TYPESCRIPT_IDS.TS_CLASSES]: async () => (await import('./011_ts_classes')).default,
  [TYPESCRIPT_IDS.TS_BASICGENERICS]: async () => (await import('./012_ts_basicGenerics')).default,
  [TYPESCRIPT_IDS.TS_UTILITYTYPES]: async () => (await import('./013_ts_utilityTypes')).default,
  [TYPESCRIPT_IDS.TS_KEYOF]: async () => (await import('./014_ts_keyOf')).default,
  [TYPESCRIPT_IDS.TS_NULL]: async () => (await import('./015_ts_null')).default,
  [TYPESCRIPT_IDS.TS_DEFINITELYTYPED]: async () =>
    (await import('./016_ts_definitelyTyped')).default
};
