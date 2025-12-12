import { account, db } from '@db/drizzle';
import { TAccount } from '@db/types';

interface TUserSeedData extends TAccount {
  encrypted_password?: string;
  identities?: Array<{
    provider: string;
    identity_data?: {
      sub?: string;
    };
  }>;
}

export async function seedAccount({ usersData }: { usersData: TUserSeedData[] }) {
  const existingAccounts = await db.select().from(account);
  const existingAccountKeys = existingAccounts.map((a) => `${a.userId}-${a.providerId}`);

  const accountsToInsert = [];
  for (const userData of usersData) {
    // Process identities to create accounts for all users in usersData
    // (whether they were just inserted or already existed)

    // Process identities to create accounts
    if (userData.identities && Array.isArray(userData.identities)) {
      for (const identity of userData.identities) {
        const accountKey = `${userData.id}-${identity.provider === 'email' ? 'credential' : identity.provider}`;

        if (existingAccountKeys.includes(accountKey)) {
          continue;
        }

        if (identity.provider === 'email') {
          // Create credential account for email provider
          accountsToInsert.push({
            userId: userData.id,
            providerId: 'credential',
            accountId: userData.id,
            password: userData.encrypted_password
          });
        } else {
          // For social providers, use the sub from identity_data
          accountsToInsert.push({
            userId: userData.id,
            providerId: identity.provider,
            accountId: identity.identity_data?.sub || userData.id
          });
        }
      }
    } else {
      // Fallback: if no identities array, create credential account from email
      const accountKey = `${userData.id}-credential`;
      if (!existingAccountKeys.includes(accountKey)) {
        accountsToInsert.push({
          userId: userData.id,
          providerId: 'credential',
          accountId: userData.id,
          password: userData.encrypted_password
        });
      }
    }
  }

  if (accountsToInsert.length > 0) {
    await db.insert(account).values(accountsToInsert);
    console.log(`   ✓ Inserted ${accountsToInsert.length} account(s)`);
  } else {
    console.log('   ✓ Accounts already exist, skipping');
  }
}
