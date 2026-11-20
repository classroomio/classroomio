import { computeSkillMastery, type SkillMastery } from '@cio/question-types/skill-mastery';
import {
  getCourseTaggedSkills,
  getExerciseQuestionSkills,
  getSkillAttemptsForCourse,
  type SkillAttemptRow
} from '@cio/db/queries/skill';
import { getProfileNamesByIds } from '@cio/db/queries/auth';
import { assertExerciseBelongsToCourse } from '@api/services/v1/courses/exercises';

type SkillRef = { id: string; code: string; name: string };

function masteryBySkill(attempts: SkillAttemptRow[]): Map<string, SkillMastery> {
  const attemptsBySkill = new Map<string, SkillAttemptRow[]>();

  for (const attempt of attempts) {
    attemptsBySkill.set(attempt.skillId, [...(attemptsBySkill.get(attempt.skillId) ?? []), attempt]);
  }

  return new Map([...attemptsBySkill].map(([skillId, rows]) => [skillId, computeSkillMastery(rows)]));
}

/** Mastery of every skill tagged in the course for one student; skills without attempts are not started. */
export async function getStudentSkillMastery(courseId: string, profileId: string) {
  const [skills, attempts] = await Promise.all([
    getCourseTaggedSkills(courseId),
    getSkillAttemptsForCourse(courseId, { profileIds: [profileId] })
  ]);
  const mastery = masteryBySkill(attempts);

  return skills.map((skill) => ({
    skillId: skill.id,
    code: skill.code,
    name: skill.name,
    ...(mastery.get(skill.id) ?? computeSkillMastery([]))
  }));
}

/**
 * Mastery per student for the skills tagged on one exercise, counted over each student's attempts across the course,
 * plus how many students sit at each level for every skill. `includeNames` adds each student's name for the dashboard;
 * the public API leaves it out.
 */
export async function getExerciseSkillMastery(
  courseId: string,
  exerciseId: string,
  options: { includeNames?: boolean } = {}
) {
  await assertExerciseBelongsToCourse(courseId, exerciseId);

  const tagged = await getExerciseQuestionSkills(exerciseId);
  const skills: SkillRef[] = [...new Map(tagged.map((row) => [row.skillId, row])).values()].map((row) => ({
    id: row.skillId,
    code: row.code,
    name: row.name
  }));
  const attempts = skills.length
    ? await getSkillAttemptsForCourse(courseId, { skillIds: skills.map((skill) => skill.id) })
    : [];

  const attemptsByStudent = new Map<string, SkillAttemptRow[]>();
  for (const attempt of attempts) {
    attemptsByStudent.set(attempt.profileId, [...(attemptsByStudent.get(attempt.profileId) ?? []), attempt]);
  }

  const names = options.includeNames
    ? await getProfileNamesByIds([...attemptsByStudent.keys()])
    : new Map<string, string>();
  const students = [...attemptsByStudent].map(([profileId, rows]) => ({
    profileId,
    ...(options.includeNames ? { name: names.get(profileId) ?? '' } : {}),
    mastery: Object.fromEntries(masteryBySkill(rows))
  }));

  const summary = skills.map((skill) => {
    const levels = { not_started: 0, learning: 0, proficient: 0, mastered: 0 };
    for (const student of students) {
      const mastery = student.mastery[skill.id];
      if (mastery) levels[mastery.level] += 1;
    }

    return { skillId: skill.id, levels };
  });

  return { skills, students, summary };
}
