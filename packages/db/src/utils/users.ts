import { db, user } from '@db/drizzle';

export async function seedUsers({ usersData }: { usersData: any[] }) {
  const existingUsers = await db.select().from(user);
  const existingUserIds = existingUsers.map((u) => u.id);

  const usersToInsert = usersData
    .map((userData: any) => ({
      id: userData.id,
      name: userData.profile_fullname,
      email: userData.email,
      emailVerified: !!userData.email_confirmed_at,
      image: null,
      role: null,
      banned: false,
      isAnonymous: false
    }))
    .filter((u: any) => !existingUserIds.includes(u.id));

  if (usersToInsert.length > 0) {
    await db.insert(user).values(usersToInsert);
    console.log(`   ✓ Inserted ${usersToInsert.length} user(s)`);
  } else {
    console.log('   ✓ Users already exist, skipping');
  }
}
