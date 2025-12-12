import 'dotenv/config';

import usersData from '../../users.json';
import { seedTemplates } from '@db/utils/seed/template';
import { seedQuestions } from '@db/utils/seed/question';
import { seedLessons } from '@db/utils/seed/lesson';
import { seedExercise } from '@db/utils/seed/exercise';
import { seedCourses } from '@db/utils/seed/course';
import { seedGroupmembers } from '@db/utils/seed/groupmember';
import { seedOrganizationMember } from '@db/utils/seed/organizationmember';
import { seedGroup } from '@db/utils/seed/group';
import { seedOrganization } from '@db/utils/seed/organization';
import { seedAccount } from '@db/utils/seed/account';
import { seedProfile } from '@db/utils/seed/profile';
import { seedUsers } from '@db/utils/seed/users';
import { seedTypes } from '@db/utils/seed/questionType';
import { seedSubmissions } from '@db/utils/seed/submission';
import { seedRoles } from '@db/utils/seed/role';

async function seed() {
  try {
    console.log('🌱 Starting seed...');

    // Seed roles
    console.log('📝 Seeding roles...');
    await seedRoles();

    // Seed submission statuses
    console.log('📝 Seeding submission statuses...');
    await seedSubmissions();

    // Seed question types
    console.log('📝 Seeding question types...');
    await seedTypes();

    // Seed users (must be before profiles due to foreign key constraint)
    console.log('📝 Seeding users...');
    // @ts-expect-error missing properties
    await seedUsers({ usersData });

    // Seed profiles
    console.log('📝 Seeding profiles...');
    // @ts-expect-error missing properties
    await seedProfile({ usersData });

    // Seed accounts (must be after users due to foreign key constraint)
    console.log('📝 Seeding accounts...');
    // @ts-expect-error missing properties
    await seedAccount({ usersData });

    // Seed organizations
    console.log('📝 Seeding organizations...');
    const testOrgId = '1a1dcddd-1abc-4f72-b644-0bd18191a289';
    await seedOrganization({ testOrgId });

    // Seed organization members
    console.log('📝 Seeding organization members...');
    const adminUserId = '7ac00503-8519-43c8-a5ea-b79aeca900b1';
    await seedOrganizationMember({ testOrgId, adminUserId });

    // Seed groups
    console.log('📝 Seeding groups...');
    const mvcGroupId = 'c6b022fd-fff3-4f09-8960-c9cb06819761';
    const reactGroupId = '04a250f1-bcb9-4e0d-a3d4-a01096e7a105';
    const pandasGroupId = '0789ced2-b8f3-472c-97ff-bdde1e80dddf';
    await seedGroup({ mvcGroupId, reactGroupId, pandasGroupId, testOrgId });

    // Seed group members
    console.log('📝 Seeding group members...');
    await seedGroupmembers({
      mvcGroupId,
      reactGroupId,
      pandasGroupId,
      adminUserId,
      studentUserId: '0c256e75-aa40-4f62-8d30-0217ca1c60d9'
    });

    // Seed courses
    console.log('📝 Seeding courses...');
    const mvcCourseId = '98e6e798-f0bd-4f9d-a6f5-ce0816a4f97e';
    const reactCourseId = '16e3bc8d-5d1b-4708-988e-93abae288ccf';
    const pandasCourseId = 'f0a85d18-aff4-412f-b8e6-3b34ef098dce';

    await seedCourses({ mvcGroupId, reactGroupId, pandasGroupId });

    // Seed lessons
    console.log('📝 Seeding lessons...');
    await seedLessons({
      mvcCourseId,
      adminUserId,
      reactCourseId,
      pandasCourseId
    });

    // Seed exercises
    console.log('📝 Seeding exercises...');
    await seedExercise();

    // Seed questions
    console.log('📝 Seeding questions...');
    // sequence fix for id error
    // await db.execute(
    //   sql`SELECT setval(pg_get_serial_sequence('question', 'id'), COALESCE(MAX(id), 1), true) FROM question;`
    // );
    await seedQuestions();

    // Seed templates
    console.log('📝 Seeding templates...');
    await seedTemplates();

    console.log('✅ Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
