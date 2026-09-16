import type {
  EntityQuery,
  EntityRecord,
  EntityStorageAdapter,
  EntityUpsertQuery,
  NewEntityRecord,
  PluginDefinition
} from '@cio/sdk';
import { createEntityRepository } from '@cio/sdk';
import { completeLessonService } from '@api/services/lesson/complete-lesson';
import {
  deletePluginRecord,
  findOnePluginRecord,
  findPluginRecords,
  insertPluginRecord,
  updatePluginRecord,
  upsertPluginRecord
} from '@cio/db/queries/plugins';

/**
 * Production storage adapter backed by Drizzle plugin_entity_records queries.
 */
export function createDrizzleEntityAdapter(): EntityStorageAdapter {
  return {
    async findOne(query: EntityQuery): Promise<EntityRecord | null> {
      const rec = await findOnePluginRecord(query.pluginName, query.entityName, query.orgId, {
        userId: query.userId,
        courseId: query.courseId,
        lessonId: query.lessonId
      });
      return (rec as unknown as EntityRecord) ?? null;
    },

    async findMany(query: EntityQuery): Promise<EntityRecord[]> {
      const recs = await findPluginRecords(query.pluginName, query.entityName, query.orgId, {
        userId: query.userId,
        courseId: query.courseId,
        lessonId: query.lessonId
      });
      return recs as unknown as EntityRecord[];
    },

    async insert(
      record: NewEntityRecord & { pluginName: string; entityName: string; orgId: string }
    ): Promise<EntityRecord> {
      const rec = await insertPluginRecord({
        pluginName: record.pluginName,
        entityName: record.entityName,
        orgId: record.orgId,
        userId: record.userId,
        courseId: record.courseId,
        lessonId: record.lessonId,
        data: record.data
      });
      return rec as unknown as EntityRecord;
    },

    async update(query: EntityQuery, data: { data: Record<string, any> }): Promise<EntityRecord | null> {
      const rec = await updatePluginRecord(
        query.pluginName,
        query.entityName,
        query.orgId,
        {
          userId: query.userId,
          courseId: query.courseId,
          lessonId: query.lessonId
        },
        data.data
      );
      return (rec as unknown as EntityRecord) ?? null;
    },

    async delete(query: EntityQuery): Promise<boolean> {
      return deletePluginRecord(query.pluginName, query.entityName, query.orgId, {
        userId: query.userId,
        courseId: query.courseId,
        lessonId: query.lessonId
      });
    },

    async upsert(query: EntityUpsertQuery): Promise<EntityRecord> {
      const rec = await upsertPluginRecord({
        pluginName: query.create.pluginName,
        entityName: query.create.entityName,
        orgId: query.create.orgId,
        userId: query.create.userId,
        courseId: query.create.courseId,
        lessonId: query.create.lessonId,
        createData: query.create.data,
        updateData: query.update.data
      });
      return rec as unknown as EntityRecord;
    }
  };
}

export interface WriteBackContextOptions {
  plugin: PluginDefinition;
  userId: string;
  orgId: string;
  courseId?: string;
  adapter?: EntityStorageAdapter;
}

export interface WriteBackContext {
  completion: {
    mark: (lessonId: string) => Promise<any>;
  };
  data: Record<string, any>;
}

/**
 * Creates an activity write-back execution context injecting completion, gradebook,
 * and typed entity repositories scoped to the tenant organization and plugin name.
 */
export function createWriteBackContext(options: WriteBackContextOptions): WriteBackContext {
  if (!options.userId) {
    throw new Error('WriteBackContext requires a valid userId.');
  }
  if (!options.orgId) {
    throw new Error('WriteBackContext requires a valid orgId.');
  }

  const adapter = options.adapter ?? createDrizzleEntityAdapter();
  const entityRepos: Record<string, any> = {};

  if (options.plugin.entities) {
    for (const entityDef of options.plugin.entities) {
      entityRepos[entityDef.name] = createEntityRepository(entityDef, adapter, {
        pluginId: options.plugin.id,
        orgId: options.orgId
      });
    }
  }

  return {
    completion: {
      mark: async (lessonId: string) => {
        return completeLessonService({
          userId: options.userId,
          lessonId,
          orgId: options.orgId
        });
      }
    },
    data: entityRepos
  };
}
