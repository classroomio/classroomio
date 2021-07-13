import { STATUS } from "../../utils/constants/answers";
import { QUESTION_TYPE } from "../../components/Question/constants";

const ROLE = {
  ADMIN: 0,
  TUTOR: 1,
  STUDENT: 2,
};

const tutors = [
  {
    id: 1,
    text: "Sergey Semko",
  },
  {
    id: 3,
    text: "Jonathan Nelson",
  },
  {
    id: 4,
    text: "Sasha Pokidin",
  },
  {
    id: 5,
    text: "Natasha Rudenko",
  },
  {
    id: 6,
    text: "Yulia Marushko",
  },
];

const people = [
  {
    name: "Alexander Pokidin",
    title: "Senior Software Engineer",
    avatar: "https://i.pravatar.cc/150?img=1",
    role: ROLE.TUTOR,
    telegramLink: "https://t.me/seed_of_abraham",
    mailLink: "mailto:irb.ossystem@gmail.com",
  },
  {
    name: "Andrey Filatov",
    title: "Fullstack Software Engineer",
    avatar: "https://i.pravatar.cc/150?img=2",
    role: ROLE.TUTOR,
    telegramLink: "https://t.me/seed_of_abraham",
    mailLink: "mailto:irb.ossystem@gmail.com",
  },
  {
    name: "Sergey Semko",
    title: "Senior Software Engineer",
    avatar: "https://i.pravatar.cc/150?img=3",
    role: ROLE.TUTOR,
    telegramLink: "https://t.me/seed_of_abraham",
    mailLink: "mailto:irb.ossystem@gmail.com",
  },
  {
    name: "Natalia Fedii",
    title: "Project Manager",
    avatar: "https://i.pravatar.cc/150?img=4",
    role: ROLE.TUTOR,
    telegramLink: "https://t.me/seed_of_abraham",
    mailLink: "mailto:irb.ossystem@gmail.com",
  },
];

const courses = [
  {
    id: 1,
    title: "React.js Fundamentals",
    status: "",
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
    title: "Вступительное слово. Софт скилы",
    to: "/courses/1/lessons/1",
    tutor: {
      userId: 1,
      avatar: "https://picsum.photos/32/32/?random",
      name: "Sergey Semko",
    },
    resources: [
      {
        label: "lesson",
        value: 1,
      },
      {
        label: "quiz",
        value: 1,
      },
      {
        label: "home task",
        value: 2,
      },
    ],
    date: new Date(),
    isComplete: true,
  },
  {
    id: 2,
    course_id: 1,
    title: "Введение в ReactJS",
    to: "/courses/1/lessons/2",
    tutor: {
      userId: 1,
      avatar: "https://picsum.photos/32/32/?random",
      name: "Sergey Semko",
    },
    resources: [
      {
        label: "lesson",
        value: 1,
      },
      {
        label: "quiz",
        value: 1,
      },
      {
        label: "home task",
        value: 2,
      },
    ],
    date: new Date(),
    isComplete: false,
  },
  {
    id: 3,
    course_id: 1,
    title: "Компоненты",
    to: "/courses/1/lessons/3",
    tutor: {
      userId: 1,
      avatar: "https://picsum.photos/32/32/?random",
      name: "Sergey Semko",
    },
    resources: [
      {
        label: "lesson",
        value: 1,
      },
      {
        label: "quiz",
        value: 1,
      },
      {
        label: "home task",
        value: 2,
      },
    ],
    date: new Date(),
    isComplete: false,
  },
  {
    id: 4,
    course_id: 1,
    title: "Состояние компонентов и пропсы",
    to: "/courses/1/lessons/4",
    tutor: {
      userId: 1,
      avatar: "https://picsum.photos/32/32/?random",
      name: "Sergey Semko",
    },
    resources: [
      {
        label: "lesson",
        value: 1,
      },
      {
        label: "quiz",
        value: 1,
      },
      {
        label: "home task",
        value: 2,
      },
    ],
    date: new Date(),
    isComplete: false,
  },
  {
    id: 5,
    course_id: 1,
    title: "Жизненный цикл",
    to: "/courses/1/lessons/5",
    tutor: {
      userId: 1,
      avatar: "https://picsum.photos/32/32/?random",
      name: "Sergey Semko",
    },
    resources: [
      {
        label: "lesson",
        value: 1,
      },
      {
        label: "quiz",
        value: 1,
      },
      {
        label: "home task",
        value: 2,
      },
    ],
    date: new Date(),
    isComplete: false,
  },
];

// id, lesson_id
const exercises = [
  {
    id: 1,
    lesson_id: 1,
    title: "Home task 1",
    description:
      "You will be to answer 10 questions, it isn't timed so you can take your time to answer. You can also continue from where you left off, you don't need to worry cause everything is automatically syncronized in the cloud.",
    questions: [
      {
        id: "react-founder",
        type: QUESTION_TYPE.CHECKBOX,
        title: "Who is the creator of React.js",
        options: [
          {
            id: "1",
            value: "Dan Abrahmov",
          },
          {
            id: "2",
            value: "Google",
          },
          {
            id: "3",
            value: "Facebook",
          },
          {
            id: "4",
            value: "Traversy Media",
          },
        ],
        answers: ["3"],
      },
      {
        id: "vue-founder",
        type: QUESTION_TYPE.CHECKBOX,
        title: "Who is the creator of Vue.js",
        code: `const name = 'Josh Perez';\nconst element = <h1>Hello, {name}</h1>;\n\nReactDOM.render(\n 
      element,\,
      document.getElementById('root')
    )
        `,
        options: [
          {
            id: "1",
            value: "Evan Vue",
          },
          {
            id: "2",
            value: "Mark Zukerberg",
          },
          {
            id: "3",
            value: "Prince Charles",
          },
          {
            id: "4",
            value: "Bill Gates",
          },
        ],
        answers: ["3"],
      },
      {
        id: "svelte-founder",
        type: QUESTION_TYPE.RADIO,
        title: "Who is the creator of Svelte.js",
        options: [
          {
            id: "1",
            value: "Hillary Svelte",
          },
          {
            id: "2",
            value: "Mircosoft",
          },
          {
            id: "3",
            value: "Elevate",
          },
          {
            id: "4",
            value: "Coding Train",
          },
        ],
        answers: ["2"],
      },
      {
        id: "angular-founder",
        type: QUESTION_TYPE.TEXTAREA,
        title: "Who is the creator of Angular.js",
        value: "",
      },
    ],
  },
];

const answers = [
  {
    lesson_id: 1,
    exercise_id: 1,
    answers: {},
    scores: {},
    currentQuestionIndex: 0,
    isFinished: false,
    progressValue: 100,
    status: STATUS.PENDING,
  },
];

const lessonLookup = new Map();
lessons.forEach((lesson) => {
  lessonLookup.set(`${lesson.id}`, JSON.stringify(lesson));
});

export function getCourse(id) {
  return {
    id,
    name: "React.js",
    people,
    roles: ROLE,
    lessons: getLessons(id),
  };
}

export function getLessons(courseId) {
  return lessons.filter((lesson) => lesson.course_id === courseId);
}

export function getLesson(id) {
  return lookup.get(id);
}

export function getExercises(lessonId) {
  return exercises.filter((exercise) => exercise.lesson_id === lessonId);
}

export function getExercise(exerciseId) {
  return {
    exercise: exercises.find((exercise) => exercise.id === exerciseId),
    answers: answers.find((answer) => answer.exercise_id === exerciseId),
  };
}
