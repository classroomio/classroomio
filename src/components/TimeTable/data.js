export default [
    {
      lessonType: '1-9 leture',
      lectureHall: '402F',
      subject: 'Mathematics',
      lecturerOne: 'Peter Pitrovich',
      lecturerTwo: 'Pragma James',
    },
    {
      lessonType: '1-9 Pra.',
      lectureHall: '202F',
      subject: 'Physics',
      lecturerOne: 'Anicimov',
      lecturerTwo: '',
    },
    {
      lessonType: '1-9 leture',
      lectureHall: '301F',
      subject: 'Algorithm',
      lecturerOne: 'Babilunga Sharon',
      lecturerTwo: 'Alex Jonard',
    },
    {
      lessonType: '1-9 leture',
      lectureHall: '222F',
      subject: 'Computer Aided system',
      lecturerOne: 'Godovichecko Heroku',
      lecturerTwo: '',
      
    },
    ...Array(4 * 4).fill(0).map((a, i) => ({
      lessonType: '1-9 leture',
      lectureHall: '222F',
      subject: 'Computer Aided system',
      lecturerOne: 'Godovichecko Heroku',
      lecturerTwo: '',
    }))
  ];