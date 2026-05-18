import 'dotenv/config';

import { seedAccount } from '@db/utils/seed/account';
import { seedCompliance } from '@db/utils/seed/compliance';
import { MVC_SECTION_ID, PANDAS_SECTION_ID, REACT_SECTION_ID, seedCourseSections } from '@db/utils/seed/courseSection';
import { seedCourses } from '@db/utils/seed/course';
import { seedExercise } from '@db/utils/seed/exercise';
import { seedExerciseTemplates } from '@db/utils/seed/exerciseTemplate';
import { seedGroup } from '@db/utils/seed/group';
import { seedGroupmembers } from '@db/utils/seed/groupmember';
import { type LessonTemplate, seedLessons } from '@db/utils/seed/lesson';
import { seedOrganization } from '@db/utils/seed/organization';
import { seedOrganizationMember } from '@db/utils/seed/organizationmember';
import { seedEarlyAdopterOrganizationPlan, seedEnterpriseOrganizationPlan } from '@db/utils/seed/organizationPlan';
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
const ENTERPRISE_ORG_ID = '2b8f4a1c-6d3e-4b2a-9f7e-1c4d8a6e9b0f';
const ENTERPRISE_ADMIN_USER_ID = '3c9052de-7e4f-4c3a-8d8e-2d5e9b7f1a3c';
const ENTERPRISE_STUDENT_USER_ID = '4da163ef-8050-4d4b-9c9f-3e6fac802b4d';
const EARLY_ADOPTER_ORG_ID = '5c7d4b2e-8f5a-4c3b-ae8f-2d6e9c1b0f5a';
const EARLY_ADOPTER_ADMIN_USER_ID = '6e0163ff-9161-4d4b-be9f-3e7fbd913c5e';
const EARLY_ADOPTER_STUDENT_USER_ID = '7fb274aa-a272-4e5c-cf0a-4f8cce024d6f';
const EARLY_ADOPTER_GROUP_ID = '8ac385bb-b383-4f6d-d01b-5a9ddf135e7a';

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
  --organization-plan         Seed enterprise + early adopter plans
  --groups                    Seed groups
  --group-members             Seed group members
  --courses                  Seed courses
  --sections                 Seed course sections
  --lessons                  Seed lessons
  --exercises                Seed exercises
  --questions                Seed questions
  --templates                Seed exercise templates
  --compliance               Seed compliance demo data (coursera-test org)
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
    await seedOrganization({
      testOrgId: TEST_ORG_ID,
      enterpriseOrgId: ENTERPRISE_ORG_ID,
      earlyAdopterOrgId: EARLY_ADOPTER_ORG_ID
    });
  },
  'organization-members': async () => {
    console.log('📝 Seeding organization members...');
    await seedOrganizationMember({
      testOrgId: TEST_ORG_ID,
      adminUserId: ADMIN_USER_ID,
      studentUserId: STUDENT_USER_ID,
      enterpriseOrgId: ENTERPRISE_ORG_ID,
      enterpriseAdminUserId: ENTERPRISE_ADMIN_USER_ID,
      enterpriseStudentUserId: ENTERPRISE_STUDENT_USER_ID,
      earlyAdopterOrgId: EARLY_ADOPTER_ORG_ID,
      earlyAdopterAdminUserId: EARLY_ADOPTER_ADMIN_USER_ID,
      earlyAdopterStudentUserId: EARLY_ADOPTER_STUDENT_USER_ID
    });
  },
  'organization-plan': async () => {
    console.log('📝 Seeding enterprise organization plan...');
    await seedEnterpriseOrganizationPlan({ enterpriseOrgId: ENTERPRISE_ORG_ID });
    console.log('📝 Seeding early adopter organization plan...');
    await seedEarlyAdopterOrganizationPlan({ earlyAdopterOrgId: EARLY_ADOPTER_ORG_ID });
  },
  groups: async () => {
    console.log('📝 Seeding groups...');
    await seedGroup({
      mvcGroupId: MVC_GROUP_ID,
      reactGroupId: REACT_GROUP_ID,
      pandasGroupId: PANDAS_GROUP_ID,
      testOrgId: TEST_ORG_ID,
      earlyAdopterGroupId: EARLY_ADOPTER_GROUP_ID,
      earlyAdopterOrgId: EARLY_ADOPTER_ORG_ID
    });
  },
  'group-members': async () => {
    console.log('📝 Seeding group members...');
    await seedGroupmembers({
      mvcGroupId: MVC_GROUP_ID,
      reactGroupId: REACT_GROUP_ID,
      pandasGroupId: PANDAS_GROUP_ID,
      adminUserId: ADMIN_USER_ID,
      studentUserId: STUDENT_USER_ID,
      earlyAdopterGroupId: EARLY_ADOPTER_GROUP_ID,
      earlyAdopterAdminUserId: EARLY_ADOPTER_ADMIN_USER_ID,
      earlyAdopterStudentUserId: EARLY_ADOPTER_STUDENT_USER_ID
    });
  },
  courses: async () => {
    console.log('📝 Seeding courses...');
    await seedCourses({
      mvcGroupId: MVC_GROUP_ID,
      reactGroupId: REACT_GROUP_ID,
      pandasGroupId: PANDAS_GROUP_ID,
      earlyAdopterGroupId: EARLY_ADOPTER_GROUP_ID
    });
  },
  sections: async () => {
    console.log('📝 Seeding course sections...');
    await seedCourseSections({
      mvcCourseId: MVC_COURSE_ID,
      reactCourseId: REACT_COURSE_ID,
      pandasCourseId: PANDAS_COURSE_ID
    });
  },
  lessons: async () => {
    console.log('📝 Seeding lessons...');
    const lessonParams: LessonTemplate = {
      mvcCourseId: MVC_COURSE_ID,
      adminUserId: ADMIN_USER_ID,
      reactCourseId: REACT_COURSE_ID,
      pandasCourseId: PANDAS_COURSE_ID,
      mvcSectionId: MVC_SECTION_ID,
      reactSectionId: REACT_SECTION_ID,
      pandasSectionId: PANDAS_SECTION_ID
    };
    await seedLessons(lessonParams);
  },
  exercises: async () => {
    console.log('📝 Seeding exercises...');
    await seedExercise({
      mvcSectionId: MVC_SECTION_ID,
      reactSectionId: REACT_SECTION_ID,
      pandasSectionId: PANDAS_SECTION_ID
    });
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
  },
  compliance: async () => {
    console.log('📝 Seeding compliance demo data (coursera-test)...');
    await seedCompliance({ enterpriseOrgId: ENTERPRISE_ORG_ID });
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
      await seedFunctions['organization-plan']();
      await seedFunctions.groups();
      await seedFunctions['group-members']();
      await seedFunctions.courses();
      await seedFunctions.sections();
      await seedFunctions.lessons();
      await seedFunctions.exercises();
      await seedFunctions.questions();
      await seedFunctions.templates();
      await seedFunctions.compliance();
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
        'organization-plan',
        'groups',
        'group-members',
        'courses',
        'sections',
        'lessons',
        'exercises',
        'questions',
        'templates',
        'compliance'
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
