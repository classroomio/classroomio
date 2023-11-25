import vueDirectives from './001_vue_directives';
import vueVBind from './002_vue_vBind';
import vueVIf from './003_vue_vIf';
import vueVShow from './004_vue_vShow';
import vueVFor from './005_vue_vFor';
import vueEvents from './006_vue-vEvents';
import vueVOn from './007_vue_vOn';
import vueMethods from './008_vue_methods';
import vueEventModifiers from './009_vue_eventModifiers';
import vueForms from './010_vue_forms';
import vueVModel from './011_vue_vModel';
import vueCssBinding from './012_vue_cssBinding';
import vueComputedProperties from './013_vue_computedProperties';
import vueWatchers from './014_vue_watchers';
import vueTemplates from './015_vue_templates';
import vueComponents from './016_vue_components';
import vueProps from './017_vue_props';
import vueVForComp from './018_vue_vForComp';
import vueEmit from './019_vue_emit';
import vueFallThroughAttribute from './020_vue_fallThroughAttribute';

export const VUE_IDS: { [key: string]: string } = {
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

export const VUE_TEMPLATES = {
  [VUE_IDS.VUE_DIRECTIVES]: vueDirectives,
  [VUE_IDS.VUE_VBIND]: vueVBind,
  [VUE_IDS.VUE_VIF]: vueVIf,
  [VUE_IDS.VUE_VSHOW]: vueVShow,
  [VUE_IDS.VUE_VFOR]: vueVFor,
  [VUE_IDS.VUE_VEVENTS]: vueEvents,
  [VUE_IDS.VUE_VON]: vueVOn,
  [VUE_IDS.VUE_METHODS]: vueMethods,
  [VUE_IDS.VUE_EVENTMODIFIERS]: vueEventModifiers,
  [VUE_IDS.VUE_FORMS]: vueForms,
  [VUE_IDS.VUE_VMODEL]: vueVModel,
  [VUE_IDS.VUE_CSSBINDING]: vueCssBinding,
  [VUE_IDS.VUE_COMPUTEDPROPERTIES]: vueComputedProperties,
  [VUE_IDS.VUE_WATCHERS]: vueWatchers,
  [VUE_IDS.VUE_TEMPLATES]: vueTemplates,
  [VUE_IDS.VUE_COMPONENTS]: vueComponents,
  [VUE_IDS.VUE_PROPS]: vueProps,
  [VUE_IDS.VUE_VFORCOMP]: vueVForComp,
  [VUE_IDS.VUE_EMIT]: vueEmit,
  [VUE_IDS.VUE_FALLTHROUGHATTRIBUTE]: vueFallThroughAttribute
};
