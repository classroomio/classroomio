const lessons = [{}];

const lookup = new Map();
lessons.forEach((lesson) => {
  lookup.set(`${lesson.id}`, JSON.stringify(lesson));
});

export function getLessons() {
  return lessons;
}

export function getLecture(id) {
  return lookup.get(id);
}
