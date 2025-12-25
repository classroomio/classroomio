import { db, role } from '@db/drizzle';

export async function seedRoles() {
  const existingRoles = await db.select().from(role);
  const existingRoleIds = existingRoles.map((r) => r.id);

  const rolesToInsert = [
    {
      id: 1,
      type: 'ADMIN',
      description: 'The main controller'
    },
    {
      id: 2,
      type: 'TUTOR',
      description: 'Can make changes to content, courses, but cant control passwords and cant add other tutors'
    },
    {
      id: 3,
      type: 'STUDENT',
      description: 'A student role, can interact with application but cant make changes'
    }
  ].filter((r) => !existingRoleIds.includes(r.id));

  if (rolesToInsert.length > 0) {
    await db.insert(role).values(rolesToInsert);
    console.log(`   ✓ Inserted ${rolesToInsert.length} role(s)`);
  } else {
    console.log('   ✓ Roles already exist, skipping');
  }
}
