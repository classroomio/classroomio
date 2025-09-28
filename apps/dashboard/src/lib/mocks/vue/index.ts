export const VUEJS_IDS: { [key: string]: string } = {
  VUE_DIRECTIVES: 'VUE_DIRECTIVES',
  VUE_VBIND: 'VUE_VBIND',
  VUE_VIF: 'VUE_VIF',
  VUE_VSHOW: 'VUE_VSHOW',
  VUE_VFOR: 'VUE_VFOR',
  VUE_VEVENTS: 'VUE_VEVENTS',
  VUE_VON: 'VUE_VON',
  VUE_METHODS: 'VUE_METHODS',
  VUE_EVENTMODIFIERS: 'VUE_EVENTMODIFIERS',
  VUE_FORMS: 'VUE_FORMS',
  VUE_VMODEL: 'VUE_VMODEL',
  VUE_CSSBINDING: 'VUE_CSSBINDING',
  VUE_COMPUTEDPROPERTIES: 'VUE_COMPUTEDPROPERTIES',
  VUE_WATCHERS: 'VUE_WATCHERS',
  VUE_TEMPLATES: 'VUE_TEMPLATES',
  VUE_COMPONENTS: 'VUE_COMPONENTS',
  VUE_PROPS: 'VUE_PROPS',
  VUE_VFORCOMP: 'VUE_VFORCOMP',
  VUE_EMIT: 'VUE_EMIT',
  VUE_FALLTHROUGHATTRIBUTE: 'VUE_FALLTHROUGHATTRIBUTE'
};

export const VUEJS_TEMPLATES = {
  [VUEJS_IDS.VUE_DIRECTIVES]: async () => (await import('./001_vue_directives')).default,
  [VUEJS_IDS.VUE_VBIND]: async () => (await import('./002_vue_vBind')).default,
  [VUEJS_IDS.VUE_VIF]: async () => (await import('./003_vue_vIf')).default,
  [VUEJS_IDS.VUE_VSHOW]: async () => (await import('./004_vue_vShow')).default,
  [VUEJS_IDS.VUE_VFOR]: async () => (await import('./005_vue_vFor')).default,
  [VUEJS_IDS.VUE_VEVENTS]: async () => (await import('./006_vue-vEvents')).default,
  [VUEJS_IDS.VUE_VON]: async () => (await import('./007_vue_vOn')).default,
  [VUEJS_IDS.VUE_METHODS]: async () => (await import('./008_vue_methods')).default,
  [VUEJS_IDS.VUE_EVENTMODIFIERS]: async () => (await import('./009_vue_eventModifiers')).default,
  [VUEJS_IDS.VUE_FORMS]: async () => (await import('./010_vue_forms')).default,
  [VUEJS_IDS.VUE_VMODEL]: async () => (await import('./011_vue_vModel')).default,
  [VUEJS_IDS.VUE_CSSBINDING]: async () => (await import('./012_vue_cssBinding')).default,
  [VUEJS_IDS.VUE_COMPUTEDPROPERTIES]: async () =>
    (await import('./013_vue_computedProperties')).default,
  [VUEJS_IDS.VUE_WATCHERS]: async () => (await import('./014_vue_watchers')).default,
  [VUEJS_IDS.VUE_TEMPLATES]: async () => (await import('./015_vue_templates')).default,
  [VUEJS_IDS.VUE_COMPONENTS]: async () => (await import('./016_vue_components')).default,
  [VUEJS_IDS.VUE_PROPS]: async () => (await import('./017_vue_props')).default,
  [VUEJS_IDS.VUE_VFORCOMP]: async () => (await import('./018_vue_vForComp')).default,
  [VUEJS_IDS.VUE_EMIT]: async () => (await import('./019_vue_emit')).default,
  [VUEJS_IDS.VUE_FALLTHROUGHATTRIBUTE]: async () =>
    (await import('./020_vue_fallThroughAttribute')).default
};
