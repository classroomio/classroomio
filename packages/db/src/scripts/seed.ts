import 'dotenv/config';

import {
  account,
  course,
  db,
  exercise,
  group,
  groupmember,
  lesson,
  option,
  organization,
  organizationmember,
  profile,
  question,
  questionType,
  role,
  submissionstatus,
  user
} from '../drizzle';
import { eq, or } from 'drizzle-orm';

import usersData from '../../users.json';

async function seed() {
  try {
    console.log('🌱 Starting seed...');

    // Seed roles
    console.log('📝 Seeding roles...');
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

    // Seed submission statuses
    console.log('📝 Seeding submission statuses...');
    const existingStatuses = await db.select().from(submissionstatus);
    const statusLabels = existingStatuses.map((s) => s.label);

    const statusesToInsert = [
      {
        label: 'Submitted'
      },
      {
        label: 'In Progress'
      },
      {
        label: 'Graded'
      }
    ].filter((s) => !statusLabels.includes(s.label));

    if (statusesToInsert.length > 0) {
      await db.insert(submissionstatus).values(statusesToInsert);
      console.log(`   ✓ Inserted ${statusesToInsert.length} submission status(es)`);
    } else {
      console.log('   ✓ Submission statuses already exist, skipping');
    }

    // Seed question types
    console.log('📝 Seeding question types...');
    const existingQuestionTypes = await db.select().from(questionType);
    const questionTypeNames = existingQuestionTypes.map((q) => q.typename);

    const questionTypesToInsert = [
      {
        label: 'Single answer',
        typename: 'RADIO',
        createdAt: '2021-08-07 18:49:46.246529+00',
        updatedAt: '2021-08-15 00:57:08.12069+00'
      },
      {
        label: 'Multiple answers',
        typename: 'CHECKBOX',
        createdAt: '2021-08-07 18:49:46.246529+00',
        updatedAt: '2021-08-15 00:57:27.935478+00'
      },
      {
        label: 'Paragraph',
        typename: 'TEXTAREA',
        createdAt: '2021-08-07 18:49:46.246529+00',
        updatedAt: '2021-08-15 00:57:38.634665+00'
      }
    ].filter((q) => !questionTypeNames.includes(q.typename));

    if (questionTypesToInsert.length > 0) {
      await db.insert(questionType).values(questionTypesToInsert);
      console.log(`   ✓ Inserted ${questionTypesToInsert.length} question type(s)`);
    } else {
      console.log('   ✓ Question types already exist, skipping');
    }

    // Seed users (must be before profiles due to foreign key constraint)
    console.log('📝 Seeding users...');
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

    // Seed profiles
    console.log('📝 Seeding profiles...');
    const existingProfiles = await db.select().from(profile);
    const existingProfileIds = existingProfiles.map((p) => p.id);

    const profilesToInsert = usersData
      .map((user: any) => ({
        id: user.id,
        fullname: user.profile_fullname,
        username: `${user.email.split('@')[0]}${Date.now()}`,
        email: user.email,
        avatarUrl: 'https://pgrest.classroomio.com/storage/v1/object/public/avatars/avatar.png',
        canAddCourse: true,
        isEmailVerified: true
      }))
      .filter((p: any) => !existingProfileIds.includes(p.id));

    if (profilesToInsert.length > 0) {
      await db.insert(profile).values(profilesToInsert);
      console.log(`   ✓ Inserted ${profilesToInsert.length} profile(s)`);
    } else {
      console.log('   ✓ Profiles already exist, skipping');
    }

    // Seed accounts (must be after users due to foreign key constraint)
    console.log('📝 Seeding accounts...');
    const existingAccounts = await db.select().from(account);
    const existingAccountKeys = existingAccounts.map((a) => `${a.userId}-${a.providerId}`);

    const accountsToInsert: any[] = [];
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

    // Seed organizations
    console.log('📝 Seeding organizations...');
    const existingOrgs = await db.select().from(organization);
    const existingOrgIds = existingOrgs.map((o) => o.id);

    const testOrgId = '1a1dcddd-1abc-4f72-b644-0bd18191a289';
    const organizationsToInsert = [
      {
        id: testOrgId,
        name: 'Udemy Test',
        siteName: 'udemy-test',
        settings: {},
        landingpage: {},
        theme: '',
        customization: {
          apps: { poll: true, comments: true },
          course: { grading: true, newsfeed: true },
          dashboard: { exercise: true, community: true, bannerText: '', bannerImage: '' }
        }
      }
    ].filter((o) => !existingOrgIds.includes(o.id));

    if (organizationsToInsert.length > 0) {
      await db.insert(organization).values(organizationsToInsert);
      console.log(`   ✓ Inserted ${organizationsToInsert.length} organization(s)`);
    } else {
      console.log('   ✓ Organizations already exist, skipping');
    }

    // Seed organization members
    console.log('📝 Seeding organization members...');
    const existingOrgMembers = await db.select().from(organizationmember);
    const existingOrgMemberKeys = existingOrgMembers.map((om) => `${om.organizationId}-${om.profileId}`);

    const adminUserId = '7ac00503-8519-43c8-a5ea-b79aeca900b1';
    const studentUserId = '0c256e75-aa40-4f62-8d30-0217ca1c60d9';

    const orgMembersToInsert = [
      {
        organizationId: testOrgId,
        roleId: 1, // ADMIN
        profileId: adminUserId,
        verified: false
      },
      {
        organizationId: testOrgId,
        roleId: 3, // STUDENT
        profileId: studentUserId,
        verified: false
      }
    ].filter((om) => !existingOrgMemberKeys.includes(`${om.organizationId}-${om.profileId}`));

    if (orgMembersToInsert.length > 0) {
      await db.insert(organizationmember).values(orgMembersToInsert);
      console.log(`   ✓ Inserted ${orgMembersToInsert.length} organization member(s)`);
    } else {
      console.log('   ✓ Organization members already exist, skipping');
    }

    // Seed groups
    console.log('📝 Seeding groups...');
    const existingGroups = await db.select().from(group);
    const existingGroupIds = existingGroups.map((g) => g.id);

    const mvcGroupId = 'c6b022fd-fff3-4f09-8960-c9cb06819761';
    const reactGroupId = '04a250f1-bcb9-4e0d-a3d4-a01096e7a105';
    const pandasGroupId = '0789ced2-b8f3-472c-97ff-bdde1e80dddf';

    const groupsToInsert = [
      {
        id: mvcGroupId,
        name: 'Getting started with MVC',
        description:
          "Embark on a comprehensive journey into the world of Model-View-Controller (MVC) architecture with our course, 'Getting Started with MVC.' Designed for beginners and aspiring developers, this course provides a solid foundation for understanding the principles and practices behind MVC, a widely adopted design pattern in software development.",
        organizationId: testOrgId
      },
      {
        id: reactGroupId,
        name: 'Modern Web Development with React',
        description:
          "By the end of this course, you'll be equipped to build interactive and responsive web applications, making you a proficient React developer ready for the demands of today's web development landscape.",
        organizationId: testOrgId
      },
      {
        id: pandasGroupId,
        name: 'Data Science with Python and Pandas',
        description:
          'Unlock the power of data with our "Data Science with Python and Pandas" course. Dive into Python programming fundamentals and then journey into the world of Pandas for efficient data manipulation and analysis.',
        organizationId: testOrgId
      }
    ].filter((g) => !existingGroupIds.includes(g.id));

    if (groupsToInsert.length > 0) {
      await db.insert(group).values(groupsToInsert);
      console.log(`   ✓ Inserted ${groupsToInsert.length} group(s)`);
    } else {
      console.log('   ✓ Groups already exist, skipping');
    }

    // Seed group members
    console.log('📝 Seeding group members...');
    const existingGroupMembers = await db.select().from(groupmember);
    const existingGroupMemberKeys = existingGroupMembers.map((gm) => `${gm.groupId}-${gm.profileId || gm.email}`);

    const groupMembersToInsert = [
      {
        groupId: mvcGroupId,
        roleId: 2, // TUTOR
        profileId: adminUserId,
        email: 'admin@test.com'
      },
      {
        groupId: reactGroupId,
        roleId: 2, // TUTOR
        profileId: adminUserId,
        email: 'admin@test.com'
      },
      {
        groupId: pandasGroupId,
        roleId: 2, // TUTOR
        profileId: adminUserId,
        email: 'admin@test.com'
      },
      {
        groupId: pandasGroupId,
        roleId: 3, // STUDENT
        profileId: studentUserId
      }
    ].filter((gm) => !existingGroupMemberKeys.includes(`${gm.groupId}-${gm.profileId || gm.email}`));

    if (groupMembersToInsert.length > 0) {
      await db.insert(groupmember).values(groupMembersToInsert);
      console.log(`   ✓ Inserted ${groupMembersToInsert.length} group member(s)`);
    } else {
      console.log('   ✓ Group members already exist, skipping');
    }

    // Seed courses
    console.log('📝 Seeding courses...');
    const existingCourses = await db.select().from(course);
    const existingCourseIds = existingCourses.map((c) => c.id);

    const mvcCourseId = '98e6e798-f0bd-4f9d-a6f5-ce0816a4f97e';
    const reactCourseId = '16e3bc8d-5d1b-4708-988e-93abae288ccf';
    const pandasCourseId = 'f0a85d18-aff4-412f-b8e6-3b34ef098dce';

    const coursesToInsert = [
      {
        id: mvcCourseId,
        title: 'Getting started with MVC',
        description:
          "Embark on a comprehensive journey into the world of Model-View-Controller (MVC) architecture with our course, 'Getting Started with MVC.' Designed for beginners and aspiring developers, this course provides a solid foundation for understanding the principles and practices behind MVC, a widely adopted design pattern in software development.",
        overview:
          '<p>"Getting Started with MVC. is designed for beginners and aspiring developers, this course provides a solid foundation for understanding the principles and practices behind MVC, a widely adopted design pattern in software development.</p>',
        groupId: mvcGroupId,
        isTemplate: true,
        logo: '',
        slug: 'getting-started-with-mvc',
        metadata: {
          goals: '',
          grading: false,
          description: '',
          requirements: '',
          lessonDownload: false,
          allowNewStudent: true,
          lessonTabsOrder: [
            { id: 1, name: 'Note' },
            { id: 2, name: 'Slide' },
            { id: 3, name: 'Video' }
          ]
        },
        cost: 0,
        currency: 'NGN',
        isPublished: true,
        isCertificateDownloadable: false,
        status: 'ACTIVE'
      },
      {
        id: reactCourseId,
        title: 'Modern Web Development with React',
        description:
          "By the end of this course, you'll be equipped to build interactive and responsive web applications, making you a proficient React developer ready for the demands of today's web development landscape.",
        overview: 'Welcome to this amazing course 🚀 ',
        groupId: reactGroupId,
        isTemplate: true,
        logo: 'https://images.unsplash.com/photo-1565843708714-52ecf69ab81f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1MTE1NTV8MHwxfHNlYXJjaHwxOHx8cmVhY3QlMjBkZXZ8ZW58MHx8fHwxNzA3Nzk5NDMyfDA&ixlib=rb-4.0.3&q=80&w=1080',
        slug: 'modern-web-development',
        metadata: {
          goals: '',
          grading: true,
          description: '',
          requirements: '',
          lessonDownload: false,
          allowNewStudent: true,
          lessonTabsOrder: [
            { id: 1, name: 'Note' },
            { id: 2, name: 'Slide' },
            { id: 3, name: 'Video' }
          ]
        },
        cost: 0,
        currency: 'NGN',
        isPublished: true,
        isCertificateDownloadable: false,
        status: 'ACTIVE'
      },
      {
        id: pandasCourseId,
        title: 'Data Science with Python and Pandas',
        description:
          'Unlock the power of data with our "Data Science with Python and Pandas" course. Dive into Python programming fundamentals and then journey into the world of Pandas for efficient data manipulation and analysis. Learn essential data cleaning and preprocessing techniques before venturing into statistical analysis using Pandas. Cap off your exploration with data visualization using Matplotlib and Seaborn.',
        overview: 'Welcome to this amazing course 🚀 ',
        groupId: pandasGroupId,
        isTemplate: true,
        logo: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1MTE1NTV8MHwxfHNlYXJjaHwxOHx8ZGF0YSUyMHNjaWVuY2V8ZW58MHx8fHwxNzA3Nzk5MzMwfDA&ixlib=rb-4.0.3&q=80&w=1080',
        slug: 'data-science-with-python-and-pandas-1702919269375',
        metadata: {
          goals: '',
          grading: true,
          description: '',
          requirements: '',
          lessonDownload: true,
          allowNewStudent: true,
          lessonTabsOrder: [
            { id: 1, name: 'Note' },
            { id: 2, name: 'Slide' },
            { id: 3, name: 'Video' }
          ]
        },
        cost: 0,
        currency: 'NGN',
        isPublished: true,
        isCertificateDownloadable: false,
        status: 'ACTIVE'
      }
    ].filter((c) => !existingCourseIds.includes(c.id));

    if (coursesToInsert.length > 0) {
      await db.insert(course).values(coursesToInsert);
      console.log(`   ✓ Inserted ${coursesToInsert.length} course(s)`);
    } else {
      console.log('   ✓ Courses already exist, skipping');
    }

    // Seed lessons
    console.log('📝 Seeding lessons...');
    const existingLessons = await db.select().from(lesson);
    const existingLessonIds = existingLessons.map((l) => l.id);

    const lessonsToInsert = [
      // MVC Course lessons
      {
        id: '5c75f4f1-c222-44a9-a8c6-81773ea33872',
        courseId: mvcCourseId,
        title: 'Lesson 1: Introduction to MVC Architecture',
        teacherId: adminUserId,
        videos: [{ link: 'https://youtu.be/pXLWqkA87e4?si=rUHaBMnuFgAMjm2T', type: 'youtube', metadata: {} }],
        isUnlocked: false
      },
      {
        id: 'a99e65b7-1394-4751-ad8d-a5fb670ccb9e',
        courseId: mvcCourseId,
        title: 'Anatomy of MVC Components',
        teacherId: adminUserId,
        videos: [{ link: 'https://youtu.be/4Qfk8MhtZJU?si=VZ7cF-pjvm_RmFMp', type: 'youtube', metadata: {} }],
        isUnlocked: false
      },
      {
        id: '266b3daa-1eb2-401e-9510-1819952b44b7',
        courseId: mvcCourseId,
        title: 'Building Your First MVC Application',
        teacherId: adminUserId,
        videos: [{ link: 'https://www.youtube.com/watch?v=EMwu8F0dCXE', type: 'youtube', metadata: {} }],
        isUnlocked: false
      },
      // React Course lessons
      {
        id: '6f2d8142-0903-425c-8534-f5105b624752',
        courseId: reactCourseId,
        title: 'Introduction to React: Understanding the Basics',
        teacherId: adminUserId,
        videos: [{ link: 'https://www.youtube.com/watch?v=H-PkPKF2Tfk', type: 'youtube', metadata: {} }],
        isUnlocked: false
      },
      {
        id: '0a39ab2f-9451-4a90-902c-3030bf965637',
        courseId: reactCourseId,
        title: 'Components and Props: Building Reusable UI Elements',
        teacherId: adminUserId,
        videos: [{ link: 'https://www.youtube.com/watch?v=H-PkPKF2Tfk', type: 'youtube', metadata: {} }],
        isUnlocked: false
      },
      {
        id: '80b79665-733b-41bf-9853-34fd8ab50496',
        courseId: reactCourseId,
        title: 'State and Lifecycle: Managing Data in React Applications',
        teacherId: adminUserId,
        videos: [{ link: 'https://www.youtube.com/watch?v=DveeFlWzWzc', type: 'youtube', metadata: {} }],
        isUnlocked: false
      },
      // Pandas Course lessons
      {
        id: '5e5c8221-4c11-4c40-8664-11743bb79579',
        courseId: pandasCourseId,
        title: 'Python Essentials: An Introduction to Data Science',
        teacherId: adminUserId,
        videos: [{ link: 'https://www.youtube.com/watch?v=T5pRlIbr6gg&vl=en', type: 'youtube', metadata: {} }],
        isUnlocked: true
      },
      {
        id: '829da386-8ccd-4c81-b2fb-b9891102c83c',
        courseId: pandasCourseId,
        title: 'Delving into Data Analysis with Pandas',
        teacherId: adminUserId,
        videos: [{ link: 'https://www.youtube.com/watch?v=T5pRlIbr6gg&vl=en', type: 'youtube', metadata: {} }],
        isUnlocked: true
      },
      {
        id: '05f03084-3ff1-49e3-aa2a-7a13840cc4b1',
        courseId: pandasCourseId,
        title: 'Data Cleaning and Preprocessing Techniques',
        teacherId: adminUserId,
        videos: [{ link: 'https://www.youtube.com/watch?v=LI7s_lyooO8', type: 'youtube', metadata: {} }],
        isUnlocked: true
      }
    ].filter((l) => !existingLessonIds.includes(l.id));

    if (lessonsToInsert.length > 0) {
      await db.insert(lesson).values(lessonsToInsert);
      console.log(`   ✓ Inserted ${lessonsToInsert.length} lesson(s)`);
    } else {
      console.log('   ✓ Lessons already exist, skipping');
    }

    // Seed exercises
    console.log('📝 Seeding exercises...');
    const existingExercises = await db.select().from(exercise);
    const existingExerciseIds = existingExercises.map((e) => e.id);

    const exercisesToInsert = [
      {
        id: 'e2ea9fb8-6448-4f6c-a1d5-02c2b12cf862',
        title: 'MVC essentials quiz',
        description: "<p>This exercise tests your knowledge of what we've covered in the first lesson.</p>",
        lessonId: '5c75f4f1-c222-44a9-a8c6-81773ea33872'
      },
      {
        id: '8b6084b0-a936-411d-9408-a1289aeed068',
        title: 'MVC Components quiz',
        lessonId: 'a99e65b7-1394-4751-ad8d-a5fb670ccb9e'
      },
      {
        id: '43f43374-7df0-4e02-b839-56403f71473a',
        title: 'NodeJS MVC Quiz',
        lessonId: '266b3daa-1eb2-401e-9510-1819952b44b7'
      },
      {
        id: 'e78bfd24-8ac3-43e9-a117-a2f9d00f74b1',
        title: 'Introduction To React: Quiz',
        lessonId: '6f2d8142-0903-425c-8534-f5105b624752'
      },
      {
        id: '43ead5d7-af88-47cf-8f86-99124f5eb0cd',
        title: 'Components And Props Quiz',
        lessonId: '0a39ab2f-9451-4a90-902c-3030bf965637'
      },
      {
        id: 'b0770deb-a8a0-4efe-9d28-8bf1298c04b2',
        title: 'React State And Lifecycle Quiz',
        lessonId: '80b79665-733b-41bf-9853-34fd8ab50496'
      },
      {
        id: '6f1063ed-3791-43fe-81e9-ad3b007834fa',
        title: 'Introduction to Python - Quiz',
        lessonId: '5e5c8221-4c11-4c40-8664-11743bb79579',
        dueBy: '2023-12-21T18:21:00.000Z'
      },
      {
        id: 'bd6e81c7-3d28-4037-acf0-a3028c583771',
        title: 'Delving Into Data Analysis With Pandas - Quiz',
        lessonId: '829da386-8ccd-4c81-b2fb-b9891102c83c'
      },
      {
        id: 'd8cd1cf7-1951-46b3-ad1c-41e415185bc1',
        title: 'Data Cleaning And Preprocessing Techniques - Quiz',
        lessonId: '05f03084-3ff1-49e3-aa2a-7a13840cc4b1'
      }
    ].filter((e) => !existingExerciseIds.includes(e.id));

    if (exercisesToInsert.length > 0) {
      await db.insert(exercise).values(exercisesToInsert);
      console.log(`   ✓ Inserted ${exercisesToInsert.length} exercise(s)`);
    } else {
      console.log('   ✓ Exercises already exist, skipping');
    }

    // Seed questions
    console.log('📝 Seeding questions...');

    const existingQuestions = await db
      .select()
      .from(question)
      .where(
        or(
          eq(question.exerciseId, 'e2ea9fb8-6448-4f6c-a1d5-02c2b12cf862'),
          eq(question.exerciseId, 'e78bfd24-8ac3-43e9-a117-a2f9d00f74b1'),
          eq(question.exerciseId, 'bd6e81c7-3d28-4037-acf0-a3028c583771'),
          eq(question.exerciseId, 'd8cd1cf7-1951-46b3-ad1c-41e415185bc1')
        )
      );
    const existingQuestionExerciseIds = existingQuestions.map((q) => q.exerciseId);

    const questionsToInsert = [
      {
        questionTypeId: 2, // CHECKBOX
        title: 'What does MVC stand for',
        exerciseId: 'e2ea9fb8-6448-4f6c-a1d5-02c2b12cf862',
        points: 0,
        order: 0
      },
      {
        questionTypeId: 2, // CHECKBOX
        title:
          "What is the purpose of the virtual DOM in React, and how does it contribute to the framework's performance optimization?",
        exerciseId: 'e78bfd24-8ac3-43e9-a117-a2f9d00f74b1',
        points: 10,
        order: 0
      },
      {
        questionTypeId: 2, // CHECKBOX
        title: 'When working with Pandas, what function is used to drop missing values from a DataFrame?',
        exerciseId: 'bd6e81c7-3d28-4037-acf0-a3028c583771',
        points: 20,
        order: 0
      },
      {
        questionTypeId: 2, // CHECKBOX
        title: 'What is the primary purpose of data cleaning in the context of data preprocessing?',
        exerciseId: 'd8cd1cf7-1951-46b3-ad1c-41e415185bc1',
        points: 0,
        order: 0
      }
    ].filter((q) => !existingQuestionExerciseIds.includes(q.exerciseId));

    let insertedQuestions: any[] = [];
    if (questionsToInsert.length > 0) {
      const result = await db.insert(question).values(questionsToInsert).returning();
      insertedQuestions = result;
      console.log(`   ✓ Inserted ${questionsToInsert.length} question(s)`);
    } else {
      console.log('   ✓ Questions already exist, skipping');
      insertedQuestions = existingQuestions;
    }

    // Seed options for questions
    console.log('📝 Seeding question options...');
    const questionIds = insertedQuestions.map((q) => q.id);

    // Check if options already exist for these questions
    let existingOptions: any[] = [];
    if (questionIds.length > 0) {
      const conditions = questionIds.map((id) => eq(option.questionId, id));
      existingOptions = await db
        .select()
        .from(option)
        .where(or(...conditions));
    }
    const existingOptionQuestionIds = new Set(existingOptions.map((o) => o.questionId));

    // Get question IDs from inserted or existing questions
    const mvcQuestion = insertedQuestions.find((q) => q.exerciseId === 'e2ea9fb8-6448-4f6c-a1d5-02c2b12cf862');
    const reactQuestion = insertedQuestions.find((q) => q.exerciseId === 'e78bfd24-8ac3-43e9-a117-a2f9d00f74b1');
    const pandasQuestion1 = insertedQuestions.find((q) => q.exerciseId === 'bd6e81c7-3d28-4037-acf0-a3028c583771');
    const pandasQuestion2 = insertedQuestions.find((q) => q.exerciseId === 'd8cd1cf7-1951-46b3-ad1c-41e415185bc1');

    const optionsToInsert = [
      // MVC question options
      ...(mvcQuestion
        ? [
            {
              label: 'Modulus, View, Calculus',
              isCorrect: false,
              questionId: mvcQuestion.id
            },
            {
              label: 'Mode, Vue, Controller',
              isCorrect: false,
              questionId: mvcQuestion.id
            },
            {
              label: 'Model, View, Controller',
              isCorrect: true,
              questionId: mvcQuestion.id
            }
          ]
        : []),
      // React question options
      ...(reactQuestion
        ? [
            {
              label: 'It stores React components in a centralized virtual memory.',
              isCorrect: false,
              questionId: reactQuestion.id
            },
            {
              label: 'It facilitates direct communication between the browser and the server.',
              isCorrect: false,
              questionId: reactQuestion.id
            },
            {
              label:
                'It is an in-memory representation of the actual DOM, allowing React to efficiently update and render UI changes.',
              isCorrect: true,
              questionId: reactQuestion.id
            },
            {
              label: 'It handles encryption and decryption for secure data transmission.',
              isCorrect: false,
              questionId: reactQuestion.id
            }
          ]
        : []),
      // Pandas question 1 options
      ...(pandasQuestion1
        ? [
            {
              label: 'drop_null()',
              isCorrect: false,
              questionId: pandasQuestion1.id
            },
            {
              label: 'remove_missing()',
              isCorrect: false,
              questionId: pandasQuestion1.id
            },
            {
              label: 'dropna()',
              isCorrect: true,
              questionId: pandasQuestion1.id
            },
            {
              label: 'clean_data()',
              isCorrect: false,
              questionId: pandasQuestion1.id
            }
          ]
        : []),
      // Pandas question 2 options
      ...(pandasQuestion2
        ? [
            {
              label: 'To increase the size of the dataset',
              isCorrect: false,
              questionId: pandasQuestion2.id
            },
            {
              label: 'To introduce noise and variability',
              isCorrect: false,
              questionId: pandasQuestion2.id
            },
            {
              label: 'To remove errors and inconsistencies',
              isCorrect: true,
              questionId: pandasQuestion2.id
            },
            {
              label: 'To speed up the data processing time',
              isCorrect: false,
              questionId: pandasQuestion2.id
            }
          ]
        : [])
    ].filter((o) => !existingOptionQuestionIds.has(o.questionId));

    if (optionsToInsert.length > 0) {
      await db.insert(option).values(optionsToInsert);
      console.log(`   ✓ Inserted ${optionsToInsert.length} option(s)`);
    } else {
      console.log('   ✓ Options already exist, skipping');
    }

    console.log('✅ Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
