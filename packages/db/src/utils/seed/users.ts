import { db, user } from '@db/drizzle';
import { TUser } from '@db/types';

export async function seedUsers({ usersData }: { usersData: TUser[] }) {
  const existingUsers = await db.select().from(user);
  const existingUserIds = existingUsers.map((u) => u.id);

  const usersToInsert = usersData
    .map((userData) => ({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      emailVerified: userData.emailVerified,
      image: null,
      role: null,
      banned: false,
      isAnonymous: false
    }))
    .filter((u) => !existingUserIds.includes(u.id));

  if (usersToInsert.length > 0) {
    await db.insert(user).values(usersToInsert);
    console.log(`   ✓ Inserted ${usersToInsert.length} user(s)`);
  } else {
    console.log('   ✓ Users already exist, skipping');
  }
}
