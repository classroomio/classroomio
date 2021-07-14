import { getCourse, getExercise, getLesson } from './_db';

function writeJsonHead(res, statusCode) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
  });
}

export function get(req, res, next) {
  const { id, lessonId, exerciseId } = req.query;

  const result = {
    ...getCourse(parseInt(id, 2)),
  };

  if (lessonId) {
    result.lesson = getLesson(parseInt(lessonId, 2));
  }

  if (exerciseId) {
    result.exercise = getExercise(parseInt(exerciseId, 2));
  }

  writeJsonHead(res, 200);

  return res.end(JSON.stringify(result));
}
