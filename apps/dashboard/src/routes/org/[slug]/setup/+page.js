export const load = ({ params = { slug: '' } }) => {
  const data = [
    {
      title: 'Create Course',
      desc: 'create a course that you will share with your students',
      isCompleted: false,
      buttonLabel: 'Create Course'
    },
    {
      title: 'Upload a profile picture and update username',
      desc: 'personalize and a human touch making interactions more personal and memorable',
      isCompleted: false,
      buttonLabel: 'Update Profile'
    },
    {
      title: 'Update organisation profile picture',
      desc: 'Establish a professional and recognizable identity for your organization',
      isCompleted: false,
      buttonLabel: 'Update Org Profile'
    },
    {
      title: 'Create a lesson',
      desc: 'Break your course into lesson that your students can easily understand',
      isCompleted: false,
      buttonLabel: 'Create lesson'
    },
    {
      title: 'Create an exercise',
      desc: 'Test your students allow them to demonstarte their understanding of the subject matter',
      isCompleted: false,
      buttonLabel: 'Create Assignment'
    },
    {
      title: 'Publish a course',
      desc: 'Make your course public and purchaseable ',
      isCompleted: false,
      buttonLabel: 'Publish course'
    }
  ];

  return {
    orgSiteName: params.slug,
    setup: data
  };
};
