import { course, db } from '@db/drizzle';

interface SeedCourse {
  mvcGroupId: string;
  reactGroupId: string;
  pandasGroupId: string;
}

export async function seedCourses({ mvcGroupId, reactGroupId, pandasGroupId }: SeedCourse) {
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
}
