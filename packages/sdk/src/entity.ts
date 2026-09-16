import type {
  EntityDefinition,
  EntityFieldDefinition,
  EntityFieldType,
  EntityQuery,
  EntityRecord,
  EntityRecordFilter,
  EntityRepository,
  EntitySchema,
  EntityStorageAdapter,
  EntityUpsertQuery,
  NewEntityRecord
} from './types';

const VALID_FIELD_TYPES: Set<EntityFieldType> = new Set(['text', 'int', 'float', 'boolean', 'timestamp', 'json']);

const ENTITY_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;
const definedEntities = new WeakSet<object>();

/**
 * Declares a plugin-owned custom entity with relational scoping and schema definitions.
 *
 * Requirements:
 * - Entity name must be alphanumeric with dashes/underscores.
 * - Scope MUST include 'org' for strict multi-tenant isolation.
 * - Field types must be one of: text, int, float, boolean, timestamp, json.
 */
export function defineEntity<TFields extends Record<string, EntityFieldDefinition>>(
  name: string,
  schema: EntitySchema<TFields>
): EntityDefinition<TFields> {
  if (!name || typeof name !== 'string' || !ENTITY_NAME_REGEX.test(name.trim())) {
    throw new Error(`Invalid entity name "${name}": must be a non-empty alphanumeric string.`);
  }

  if (!schema || !Array.isArray(schema.scope) || !schema.scope.includes('org')) {
    throw new Error(`Entity "${name}" scope must include "org" for multi-tenant isolation.`);
  }

  if (!schema.fields || typeof schema.fields !== 'object') {
    throw new Error(`Entity "${name}" must declare a valid fields object.`);
  }

  for (const [fieldName, fieldDef] of Object.entries(schema.fields)) {
    if (!fieldDef || !VALID_FIELD_TYPES.has(fieldDef.type)) {
      throw new Error(`Invalid field type "${(fieldDef as any)?.type}" for field "${fieldName}" in entity "${name}".`);
    }
  }

  const definition = {
    name,
    schema
  };

  definedEntities.add(definition);

  return definition;
}

/** @internal Used by definePlugin to reject entity objects that bypass defineEntity(). */
export function isDefinedEntity(definition: unknown): definition is EntityDefinition {
  return typeof definition === 'object' && definition !== null && definedEntities.has(definition);
}

/**
 * Creates an in-memory storage adapter for unit testing and local development.
 */
export function createInMemoryEntityAdapter(): EntityStorageAdapter {
  const records: EntityRecord[] = [];
  let counter = 1;

  function matches(record: EntityRecord, query: EntityQuery): boolean {
    return (
      record.pluginName === query.pluginName &&
      record.entityName === query.entityName &&
      record.orgId === query.orgId &&
      (query.userId === undefined || record.userId === query.userId) &&
      (query.courseId === undefined || record.courseId === query.courseId) &&
      (query.lessonId === undefined || record.lessonId === query.lessonId)
    );
  }

  return {
    async findOne(query: EntityQuery): Promise<EntityRecord | null> {
      const match = records.find((r) => matches(r, query));
      return match ? JSON.parse(JSON.stringify(match)) : null;
    },

    async findMany(query: EntityQuery): Promise<EntityRecord[]> {
      const matchesList = records.filter((r) => matches(r, query));
      return JSON.parse(JSON.stringify(matchesList));
    },

    async insert(
      newRec: NewEntityRecord & { pluginName: string; entityName: string; orgId: string }
    ): Promise<EntityRecord> {
      const record: EntityRecord = {
        id: `rec-${counter++}`,
        pluginName: newRec.pluginName,
        entityName: newRec.entityName,
        orgId: newRec.orgId,
        userId: newRec.userId ?? null,
        courseId: newRec.courseId ?? null,
        lessonId: newRec.lessonId ?? null,
        data: { ...newRec.data },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      records.push(record);
      return JSON.parse(JSON.stringify(record));
    },

    async update(query: EntityQuery, data: { data: Record<string, any> }): Promise<EntityRecord | null> {
      const index = records.findIndex((r) => matches(r, query));

      if (index === -1) {
        return null;
      }

      records[index].data = { ...records[index].data, ...data.data };
      records[index].updatedAt = new Date().toISOString();
      return JSON.parse(JSON.stringify(records[index]));
    },

    async delete(query: EntityQuery): Promise<boolean> {
      const initialLength = records.length;
      for (let i = records.length - 1; i >= 0; i--) {
        if (matches(records[i], query)) {
          records.splice(i, 1);
        }
      }
      return records.length < initialLength;
    },

    async upsert(query: EntityUpsertQuery): Promise<EntityRecord> {
      const existing = records.find((record) => matches(record, query.where));
      if (existing) {
        existing.data = { ...existing.data, ...query.update.data };
        existing.updatedAt = new Date().toISOString();
        return JSON.parse(JSON.stringify(existing));
      }

      const record: EntityRecord = {
        id: `rec-${counter++}`,
        pluginName: query.create.pluginName,
        entityName: query.create.entityName,
        orgId: query.create.orgId,
        userId: query.create.userId ?? null,
        courseId: query.create.courseId ?? null,
        lessonId: query.create.lessonId ?? null,
        data: { ...query.create.data },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      records.push(record);
      return JSON.parse(JSON.stringify(record));
    }
  };
}

/**
 * Creates an entity repository bound to a plugin, tenant organization, and storage adapter.
 * Automatically scopes all queries by pluginName and orgId (enforcing data:own and multi-tenancy).
 */
export function createEntityRepository<TData extends Record<string, any> = Record<string, any>>(
  definition: EntityDefinition,
  adapter: EntityStorageAdapter,
  context: { pluginId: string; orgId: string }
): EntityRepository<TData> {
  if (!context.pluginId) {
    throw new Error('Entity repository requires a valid pluginId.');
  }

  if (!context.orgId) {
    throw new Error('Entity repository requires a valid orgId.');
  }

  const baseContext = {
    pluginName: context.pluginId,
    entityName: definition.name,
    orgId: context.orgId
  };

  return {
    async findOne(filter: EntityRecordFilter = {}): Promise<EntityRecord<TData> | null> {
      return adapter.findOne({ ...filter, ...baseContext }) as Promise<EntityRecord<TData> | null>;
    },

    async findMany(filter: EntityRecordFilter = {}): Promise<EntityRecord<TData>[]> {
      return adapter.findMany({ ...filter, ...baseContext }) as Promise<EntityRecord<TData>[]>;
    },

    async insert(record: NewEntityRecord<TData>): Promise<EntityRecord<TData>> {
      return adapter.insert({
        ...record,
        ...baseContext
      }) as Promise<EntityRecord<TData>>;
    },

    async update(where: EntityRecordFilter, data: { data: Partial<TData> }): Promise<EntityRecord<TData> | null> {
      return adapter.update({ ...where, ...baseContext }, data) as Promise<EntityRecord<TData> | null>;
    },

    async delete(where: EntityRecordFilter): Promise<boolean> {
      return adapter.delete({ ...where, ...baseContext });
    },

    async upsert(query: {
      where: EntityRecordFilter;
      create: NewEntityRecord<TData>;
      update: { data: Partial<TData> };
    }): Promise<EntityRecord<TData>> {
      return adapter.upsert({
        where: { ...query.where, ...baseContext },
        create: {
          ...query.create,
          ...baseContext
        },
        update: query.update
      }) as Promise<EntityRecord<TData>>;
    }
  };
}
