import { db } from '@db/drizzle';
import { TNewGroup, TNewGroupmember } from '@db/types';
import * as schema from '@db/schema';

export async function createGroup(values: TNewGroup) {
  try {
    return await db.insert(schema.group).values(values).returning();
  } catch (error) {
    throw new Error(`Failed to create group: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function addGroupMember(values: TNewGroupmember) {
  try {
    return await db.insert(schema.groupmember).values(values).returning();
  } catch (error) {
    throw new Error(`Failed to add group member: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
