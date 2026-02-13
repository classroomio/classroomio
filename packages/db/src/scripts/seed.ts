import 'dotenv/config';

import { seedAccount } from '@db/utils/seed/account';
import { seedCourses } from '@db/utils/seed/course';
import { seedExercise } from '@db/utils/seed/exercise';
import { seedExerciseTemplates } from '@db/utils/seed/exerciseTemplate';
import { seedGroup } from '@db/utils/seed/group';
import { seedGroupmembers } from '@db/utils/seed/groupmember';
import { seedLessons } from '@db/utils/seed/lesson';
import { seedOrganization } from '@db/utils/seed/organization';
import { seedOrganizationMember } from '@db/utils/seed/organizationmember';
import { seedProfile } from '@db/utils/seed/profile';
import { seedQuestionTypes } from '@db/utils/seed/questionType';
import { seedQuestions } from '@db/utils/seed/question';
import { seedRoles } from '@db/utils/seed/role';
import { seedSubmissions } from '@db/utils/seed/submission';
import { seedUsers } from '@db/utils/seed/users';
import usersData from '../../users.json';

// Constants for IDs used across multiple seed functions
const TEST_ORG_ID = '1a1dcddd-1abc-4f72-b644-0bd18191a289';
const ADMIN_USER_ID = '7ac00503-8519-43c8-a5ea-b79aeca900b1';
const MVC_GROUP_ID = 'c6b022fd-fff3-4f09-8960-c9cb06819761';
const REACT_GROUP_ID = '04a250f1-bcb9-4e0d-a3d4-a01096e7a105';
const PANDAS_GROUP_ID = '0789ced2-b8f3-472c-97ff-bdde1e80dddf';
const MVC_COURSE_ID = '98e6e798-f0bd-4f9d-a6f5-ce0816a4f97e';
const REACT_COURSE_ID = '16e3bc8d-5d1b-4708-988e-93abae288ccf';
const PANDAS_COURSE_ID = 'f0a85d18-aff4-412f-b8e6-3b34ef098dce';
const STUDENT_USER_ID = '0c256e75-aa40-4f62-8d30-0217ca1c60d9';

// Parse command line arguments
function parseFlags(): Set<string> {
  const args = process.argv.slice(2);
  const flags = new Set<string>();

  for (const arg of args) {
    if (arg.startsWith('--')) {
      flags.add(arg.slice(2));
    } else if (arg.startsWith('-')) {
      flags.add(arg.slice(1));
    }
  }

  return flags;
}

// Show help message
function showHelp() {
  console.log(`
🌱 Database Seeding CLI

Usage: pnpm seed [flags]

Flags:
  --all, -a                    Run all seed functions (default if no flags provided)
  --roles                      Seed roles
  --submissions                Seed submission statuses
  --question-types             Seed question types
  --users                     Seed users
  --profiles                  Seed profiles
  --accounts                  Seed accounts
  --organizations             Seed organizations
  --organization-members      Seed organization members
  --groups                    Seed groups
  --group-members             Seed group members
  --courses                  Seed courses
  --lessons                  Seed lessons
  --exercises                Seed exercises
  --questions                Seed questions
  --templates                Seed exercise templates
  --help, -h                  Show this help message

Examples:
  pnpm seed --users --profiles
  pnpm seed --all
  pnpm seed --roles --submissions --question-types
`);
}

// Seed function map
const seedFunctions = {
  roles: async () => {
    console.log('📝 Seeding roles...');
    await seedRoles();
  },
  submissions: async () => {
    console.log('📝 Seeding submission statuses...');
    await seedSubmissions();
  },
  'question-types': async () => {
    console.log('📝 Seeding question types...');
    await seedQuestionTypes();
  },
  users: async () => {
    console.log('📝 Seeding users...');
    await seedUsers({ usersData });
  },
  profiles: async () => {
    console.log('📝 Seeding profiles...');
    await seedProfile({ usersData });
  },
  accounts: async () => {
    console.log('📝 Seeding accounts...');
    // @ts-expect-error missing properties
    await seedAccount({ usersData });
  },
  organizations: async () => {
    console.log('📝 Seeding organizations...');
    await seedOrganization({ testOrgId: TEST_ORG_ID });
  },
  'organization-members': async () => {
    console.log('📝 Seeding organization members...');
    await seedOrganizationMember({ testOrgId: TEST_ORG_ID, adminUserId: ADMIN_USER_ID });
  },
  groups: async () => {
    console.log('📝 Seeding groups...');
    await seedGroup({
      mvcGroupId: MVC_GROUP_ID,
      reactGroupId: REACT_GROUP_ID,
      pandasGroupId: PANDAS_GROUP_ID,
      testOrgId: TEST_ORG_ID
    });
  },
  'group-members': async () => {
    console.log('📝 Seeding group members...');
    await seedGroupmembers({
      mvcGroupId: MVC_GROUP_ID,
      reactGroupId: REACT_GROUP_ID,
      pandasGroupId: PANDAS_GROUP_ID,
      adminUserId: ADMIN_USER_ID,
      studentUserId: STUDENT_USER_ID
    });
  },
  courses: async () => {
    console.log('📝 Seeding courses...');
    await seedCourses({ mvcGroupId: MVC_GROUP_ID, reactGroupId: REACT_GROUP_ID, pandasGroupId: PANDAS_GROUP_ID });
  },
  lessons: async () => {
    console.log('📝 Seeding lessons...');
    await seedLessons({
      mvcCourseId: MVC_COURSE_ID,
      adminUserId: ADMIN_USER_ID,
      reactCourseId: REACT_COURSE_ID,
      pandasCourseId: PANDAS_COURSE_ID
    });
  },
  exercises: async () => {
    console.log('📝 Seeding exercises...');
    await seedExercise();
  },
  questions: async () => {
    console.log('📝 Seeding questions...');
    // sequence fix for id error
    // await db.execute(
    //   sql`SELECT setval(pg_get_serial_sequence('question', 'id'), COALESCE(MAX(id), 1), true) FROM question;`
    // );
    await seedQuestions();
  },
  templates: async () => {
    console.log('📝 Seeding exercise templates...');
    await seedExerciseTemplates();
  }
};

async function seed() {
  try {
    const flags = parseFlags();

    // Show help if requested
    if (flags.has('help') || flags.has('h')) {
      showHelp();
      process.exit(0);
    }

    console.log('🌱 Starting seed...');

    // If --all flag or no flags provided, run all seeds
    const runAll = flags.size === 0 || flags.has('all') || flags.has('a');

    if (runAll) {
      // Run all seeds in order
      await seedFunctions.roles();
      await seedFunctions.submissions();
      await seedFunctions['question-types']();
      await seedFunctions.users();
      await seedFunctions.profiles();
      await seedFunctions.accounts();
      await seedFunctions.organizations();
      await seedFunctions['organization-members']();
      await seedFunctions.groups();
      await seedFunctions['group-members']();
      await seedFunctions.courses();
      await seedFunctions.lessons();
      await seedFunctions.exercises();
      await seedFunctions.questions();
      await seedFunctions.templates();
    } else {
      // Run only specified seed functions
      // Order matters for dependencies, so we maintain the original order
      const orderedSeeds = [
        'roles',
        'submissions',
        'question-types',
        'users',
        'profiles',
        'accounts',
        'organizations',
        'organization-members',
        'groups',
        'group-members',
        'courses',
        'lessons',
        'exercises',
        'questions',
        'templates'
      ];

      for (const seedName of orderedSeeds) {
        if (flags.has(seedName)) {
          const seedFn = seedFunctions[seedName as keyof typeof seedFunctions];
          if (seedFn) {
            await seedFn();
          }
        }
      }
    }

    console.log('✅ Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
