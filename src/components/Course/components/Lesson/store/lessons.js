import { writable } from "svelte/store";

export const lessons = writable([]);

export const tutors = writable([
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
]);

export function handleAddLesson() {
  const resources = [
    {
      label: "lesson",
      value: 0,
    },
    {
      label: "quiz",
      value: 0,
    },
    {
      label: "home task",
      value: 0,
    },
  ];

  lessons.update((_lessons) => {
    return [
      ..._lessons,
      {
        title: "Untitled lesson",
        to: "/courses/1/lessons/" + (_lessons.length + 1),
        resources,
        tutor: {
          userId: 1,
          avatar: "https://picsum.photos/32/32/?random",
          name: "",
        },
        date: new Date(),
      },
    ];
  });
}
