import type { ActivityTypeDefinition } from './types';

const definedActivityTypes = new WeakSet<object>();

/**
 * Declares a pluggable lesson activity type with student, instructor, and authoring renderers.
 */
export function defineActivityType(definition: ActivityTypeDefinition): ActivityTypeDefinition {
  if (!definition || typeof definition !== 'object') {
    throw new Error('Activity type definition must be an object.');
  }

  if (!definition.key || typeof definition.key !== 'string') {
    throw new Error('Activity type definition requires a valid string "key".');
  }

  if (!definition.label || typeof definition.label !== 'string') {
    throw new Error('Activity type definition requires a valid string "label".');
  }

  if (!definition.renderers || typeof definition.renderers !== 'object') {
    throw new Error('Activity type definition requires a "renderers" object.');
  }

  if (typeof definition.renderers.edit !== 'function') {
    throw new Error('Activity type renderers must define a dynamic import loader at "renderers.edit".');
  }

  if (typeof definition.renderers.take !== 'function') {
    throw new Error('Activity type renderers must define a dynamic import loader at "renderers.take".');
  }

  if (typeof definition.renderers.review !== 'function') {
    throw new Error('Activity type renderers must define a dynamic import loader at "renderers.review".');
  }

  definedActivityTypes.add(definition);

  return definition;
}

/** @internal Used by definePlugin to reject activity objects that bypass defineActivityType(). */
export function isDefinedActivityType(definition: unknown): definition is ActivityTypeDefinition {
  return typeof definition === 'object' && definition !== null && definedActivityTypes.has(definition);
}
