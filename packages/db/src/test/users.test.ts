import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getProfileById } from '../queries/auth/profile';
import * as schemas from '../schema';
import { testDb } from './setup';

let testUser: any;
let testUserProfile: any;

describe('User Queries', () => {
    beforeAll(async () => {
        const [user] = await testDb
            .insert(schemas.user)
            .values({
                email: 'test@example.com',
                name: 'Test User',
            })
            .returning();

        const [profile] = await testDb.insert(schemas.profile).values({
            id: user.id,
            fullname: 'Test User',
            username: 'testuser',
            email: user.email,
        }).returning();

        testUser = user;
        testUserProfile = profile
    });

    afterAll(async () => {
        if (testUserProfile?.id) {
            await testDb
                .delete(schemas.profile)
                .where(eq(schemas.profile.id, testUserProfile.id));
            if (testUser?.id) {
                await testDb
                    .delete(schemas.user)
                    .where(eq(schemas.user.id, testUser.id));
            }
        }
    });

    // Rewrite the queries
    it('should get user by id', async () => {
        const [user] = await testDb.select().from(schemas.user).where(eq(schemas.user.id, testUser.id)).limit(1);
        expect(user.id).toBe(testUser.id)
    });

    // Modify the query functions to accept an optional db variable
    it('should get user profile by id', async () => {
        const user = await getProfileById(testUser.id, testDb);
        expect(user).toMatchObject({
            id: testUser.id,
            email: testUserProfile.email,
            username: testUserProfile.username,
            fullname: testUserProfile.fullname
        });
    });
});
