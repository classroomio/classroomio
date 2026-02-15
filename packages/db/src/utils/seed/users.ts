import { db, user } from '@db/drizzle';

type TUserSeedData = {
  id: string;
  email: string;
  name?: string | null;
  emailVerified?: boolean;
  profile_fullname?: string | null;
};

const resolveDisplayName = (seedUser: TUserSeedData) => {
  if (seedUser.name && seedUser.name.trim().length > 0) {
    return seedUser.name;
  }

  if (seedUser.profile_fullname && seedUser.profile_fullname.trim().length > 0) {
    return seedUser.profile_fullname;
  }

  return seedUser.email.split('@')[0];
};

export async function seedUsers({ usersData }: { usersData: TUserSeedData[] }) {
  const existingUsers = await db.select().from(user);
  const existingUserIds = existingUsers.map((u) => u.id);

  const usersToInsert = usersData
    .map((userData) => ({
      id: userData.id,
      name: resolveDisplayName(userData),
      email: userData.email,
      emailVerified: userData.emailVerified ?? false,
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
