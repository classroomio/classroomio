import { writable } from 'svelte/store';

export const lessons = writable([
  {
    title: 'Вступительное слово. Софт скилы',
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
    title: 'Введение в ReactJS',
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
    title: 'Компоненты',
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
    title: 'Состояние компонентов и пропсы',
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
    title: 'Жизненный цикл',
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
]);

export const tutors = writable([
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
]);

export function handleAddLesson() {
  const resources = [
    {
      label: 'lesson',
      value: 0,
    },
    {
      label: 'quiz',
      value: 0,
    },
    {
      label: 'home task',
      value: 0,
    },
  ];

  lessons.update((_lessons) => {
    return [
      ..._lessons,
      {
        title: 'Untitled lesson',
        to: '/courses/1/lessons/' + (_lessons.length + 1),
        resources,
        tutor: {
          userId: 1,
          avatar: 'https://picsum.photos/32/32/?random',
          name: '',
        },
        date: new Date(),
      },
    ];
  });
}
