export default [
  {
    lessonType: '1-9 leture',
    lessonHall: '402F',
    subject: 'Mathematics',
    tutorOne: 'Peter Pitrovich',
    tutorTwo: 'Pragma James',
  },
  {
    lessonType: '1-9 Pra.',
    lessonHall: '202F',
    subject: 'Physics',
    tutorOne: 'Anicimov',
    tutorTwo: '',
  },
  {
    lessonType: '1-9 leture',
    lessonHall: '301F',
    subject: 'Algorithm',
    tutorOne: 'Babilunga Sharon',
    tutorTwo: 'Alex Jonard',
  },
  {
    lessonType: '1-9 leture',
    lessonHall: '222F',
    subject: 'Computer Aided system',
    tutorOne: 'Godovichecko Heroku',
    tutorTwo: '',
  },
  ...Array(4 * 4)
    .fill(0)
    .map((a, i) => ({
      lessonType: '1-9 leture',
      lessonHall: '222F',
      subject: 'Computer Aided system',
      tutorOne: 'Godovichecko Heroku',
      tutorTwo: '',
    })),
];
