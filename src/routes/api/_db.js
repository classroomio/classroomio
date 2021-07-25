import { STATUS } from '../../utils/constants/answers';
import { QUESTION_TYPE } from '../../components/Question/constants';

const ROLE = {
  ADMIN: 0,
  TUTOR: 1,
  STUDENT: 2,
};

const tutors = [
  {
    id: 1,
    text: 'Sergey Semko',
  },
  {
    id: 3,
    text: 'Jonathan Nelson',
  },
  {
    id: 4,
    text: 'Sasha Pokidin',
  },
  {
    id: 5,
    text: 'Natasha Rudenko',
  },
  {
    id: 6,
    text: 'Yulia Marushko',
  },
];

const people = [
  {
    name: 'Alexander Pokidin',
    title: 'Senior Software Engineer',
    avatar: 'https://i.pravatar.cc/150?img=1',
    role: ROLE.TUTOR,
    telegramLink: 'https://t.me/seed_of_abraham',
    mailLink: 'mailto:irb.ossystem@gmail.com',
  },
  {
    name: 'Andrey Filatov',
    title: 'Fullstack Software Engineer',
    avatar: 'https://i.pravatar.cc/150?img=2',
    role: ROLE.TUTOR,
    telegramLink: 'https://t.me/seed_of_abraham',
    mailLink: 'mailto:irb.ossystem@gmail.com',
  },
  {
    name: 'Sergey Semko',
    title: 'Senior Software Engineer',
    avatar: 'https://i.pravatar.cc/150?img=3',
    role: ROLE.TUTOR,
    telegramLink: 'https://t.me/seed_of_abraham',
    mailLink: 'mailto:irb.ossystem@gmail.com',
  },
  {
    name: 'Natalia Fedii',
    title: 'Project Manager',
    avatar: 'https://i.pravatar.cc/150?img=4',
    role: ROLE.TUTOR,
    telegramLink: 'https://t.me/seed_of_abraham',
    mailLink: 'mailto:irb.ossystem@gmail.com',
  },
];

const courses = [
  {
    id: 1,
    title: 'React.js Fundamentals',
    status: '',
  },
];

// many to many: id, tutor_id, course_id
const course_tutors = [
  {
    id: 1,
    tutor_id: 1,
    course_id: 1,
  },
];

// id, course_id
const lessons = [
  {
    id: 1,
    course_id: 1,
    title: 'Introduction to soft skills',
    to: '/courses/1/lessons/1',
    tutor: {
      userId: 1,
      avatar: 'https://picsum.photos/32/32/?random',
      name: 'Sergey Semko',
    },
    resources: [
      {
        label: 'lesson',
        value: 1,
      },
      {
        label: 'quiz',
        value: 1,
      },
      {
        label: 'home task',
        value: 2,
      },
    ],
    date: new Date(),
    isComplete: true,
  },
  {
    id: 2,
    course_id: 1,
    title: 'Introduction to ReactJS',
    to: '/courses/1/lessons/2',
    tutor: {
      userId: 1,
      avatar: 'https://picsum.photos/32/32/?random',
      name: 'Sergey Semko',
    },
    resources: [
      {
        label: 'lesson',
        value: 1,
      },
      {
        label: 'quiz',
        value: 1,
      },
      {
        label: 'home task',
        value: 2,
      },
    ],
    date: new Date(),
    isComplete: false,
  },
  {
    id: 3,
    course_id: 1,
    title: 'Components - Functional and Class',
    to: '/courses/1/lessons/3',
    tutor: {
      userId: 1,
      avatar: 'https://picsum.photos/32/32/?random',
      name: 'Sergey Semko',
    },
    resources: [
      {
        label: 'lesson',
        value: 1,
      },
      {
        label: 'quiz',
        value: 1,
      },
      {
        label: 'home task',
        value: 2,
      },
    ],
    date: new Date(),
    isComplete: false,
  },
  {
    id: 4,
    course_id: 1,
    title: 'State and Props in components',
    to: '/courses/1/lessons/4',
    tutor: {
      userId: 1,
      avatar: 'https://picsum.photos/32/32/?random',
      name: 'Sergey Semko',
    },
    resources: [
      {
        label: 'lesson',
        value: 1,
      },
      {
        label: 'quiz',
        value: 1,
      },
      {
        label: 'home task',
        value: 2,
      },
    ],
    date: new Date(),
    isComplete: false,
  },
  {
    id: 5,
    course_id: 1,
    title: 'Life cycle methods',
    to: '/courses/1/lessons/5',
    tutor: {
      userId: 1,
      avatar: 'https://picsum.photos/32/32/?random',
      name: 'Sergey Semko',
    },
    resources: [
      {
        label: 'lesson',
        value: 1,
      },
      {
        label: 'quiz',
        value: 1,
      },
      {
        label: 'home task',
        value: 2,
      },
    ],
    date: new Date(),
    isComplete: false,
  },
];

const lessonData = [
  {
    lesson_id: 1,
    materials: {
      note: `# Introduction\n\nWelcome to this course, we are glad you made it here\n\n## What you'l learn\n\n1. Build powerful, fast, user-friendly and reactive web apps.\n2. Provide amazing user experiences by leveraging the power of JavaScript with ease.\n3. Apply for high-paid jobs or work as a freelancer in one the most-demanded sectors you can find in web dev right now.\n4. Learn all about React Hooks and React Components.`,
      slide:
        'https://docs.google.com/presentation/d/e/2PACX-1vS7mulzY5v1X_D0Gz68M2sggq2zjHCuoyY5JI07hcsOA4svDV5rxhLD9V3ckO_Rz7TK1YniQJtu0CXM/embed?start=false&loop=false&delayms=3000',
      video: 'https://www.youtube.com/embed/luM5uobewhA',
    },
    exercises: [
      {
        id: 1,
        title: 'Practice Exercise',
      },
      {
        id: 2,
        title: 'Home task',
      },
    ],
  },
];

// id, lesson_id
const lesson_exercise = [
  {
    id: 1,
    lesson_id: 1,
    title: 'Home task 1',
    description:
      "You will be to answer 10 questions, it isn't timed so you can take your time to answer. You can also continue from where you left off, you don't need to worry cause everything is automatically syncronized in the cloud.",
    questions: [
      {
        id: 'react-founder',
        type: QUESTION_TYPE.CHECKBOX,
        title: 'Who is the creator of React.js',
        options: [
          {
            id: '1',
            value: 'Dan Abrahmov',
          },
          {
            id: '2',
            value: 'Google',
          },
          {
            id: '3',
            value: 'Facebook',
          },
          {
            id: '4',
            value: 'Traversy Media',
          },
        ],
        answers: ['3'],
      },
      {
        id: 'vue-founder',
        type: QUESTION_TYPE.CHECKBOX,
        title: 'Who is the creator of Vue.js',
        code: `const name = 'Josh Perez';\nconst element = <h1>Hello, {name}</h1>;\n\nReactDOM.render(\n 
      element,\,
      document.getElementById('root')
    )
        `,
        options: [
          {
            id: '1',
            value: 'Evan Vue',
          },
          {
            id: '2',
            value: 'Mark Zukerberg',
          },
          {
            id: '3',
            value: 'Prince Charles',
          },
          {
            id: '4',
            value: 'Bill Gates',
          },
        ],
        answers: ['3'],
      },
      {
        id: 'svelte-founder',
        type: QUESTION_TYPE.RADIO,
        title: 'Who is the creator of Svelte.js',
        options: [
          {
            id: '1',
            value: 'Hillary Svelte',
          },
          {
            id: '2',
            value: 'Mircosoft',
          },
          {
            id: '3',
            value: 'Elevate',
          },
          {
            id: '4',
            value: 'Coding Train',
          },
        ],
        answers: ['2'],
      },
      {
        id: 'angular-founder',
        type: QUESTION_TYPE.TEXTAREA,
        title: 'Who is the creator of Angular.js',
        value: '',
      },
    ],
  },
];

const exercise_answers = [
  {
    lesson_id: 1,
    exercise_id: 1,
    taken_by: {},
    answers: {},
    scores: {},
    currentQuestionIndex: 0,
    isFinished: false,
    progressValue: 100,
    status: STATUS.PENDING,
  },
];

// const lessonLookup = new Map();
// lessons.forEach((lesson) => {
//   lessonLookup.set(`${lesson.id}`, JSON.stringify(lesson));
// });

export function getCourse(id) {
  return {
    id,
    name: 'React.js',
    people,
    roles: ROLE,
    lessons: getLessons(id),
  };
}

export function getLessons(courseId) {
  return lessons.filter((lesson) => lesson.course_id === courseId);
}

export function getLesson(id) {
  return (
    lessonData.find((lesson) => lesson.lesson_id === id) || {
      lesson_id: null,
      materials: {
        note: '',
        slide: '',
        video: '',
      },
      exercises: getExercises(id),
    }
  );
}

export function getExercises(lessonId) {
  return lesson_exercise.filter((exercise) => exercise.lesson_id === lessonId);
}

export function getExercise(exerciseId) {
  return {
    data: lesson_exercise.find((exercise) => exercise.id === exerciseId),
    answers: exercise_answers.find(
      (answer) => answer.exercise_id === exerciseId
    ),
  };
}
