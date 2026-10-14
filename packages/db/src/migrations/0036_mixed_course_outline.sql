WITH root_entries AS (
  SELECT id, course_id, 'SECTION' AS kind, "order" FROM course_section
  UNION ALL
  SELECT id, course_id, 'LESSON' AS kind, "order" FROM lesson WHERE section_id IS NULL
  UNION ALL
  SELECT exercise.id, COALESCE(exercise.course_id, lesson.course_id), 'EXERCISE' AS kind, exercise."order"
  FROM exercise LEFT JOIN lesson ON lesson.id = exercise.lesson_id
  WHERE exercise.section_id IS NULL AND lesson.section_id IS NULL
), ranked AS (
  SELECT root_entries.*,
    ROW_NUMBER() OVER (
      PARTITION BY root_entries.course_id
      ORDER BY CASE WHEN COALESCE((course.metadata->>'isContentGroupingEnabled')::boolean, true)
        AND kind = 'SECTION' THEN 0 ELSE 1 END, root_entries."order", CASE kind WHEN 'SECTION' THEN 0 WHEN 'LESSON' THEN 1 ELSE 2 END, root_entries.id
    ) AS position
  FROM root_entries JOIN course ON course.id = root_entries.course_id
  WHERE COALESCE((course.metadata->>'isContentGroupingEnabled')::boolean, true)
), updated_sections AS (
  UPDATE course_section SET "order" = ranked.position FROM ranked
  WHERE ranked.kind = 'SECTION' AND course_section.id = ranked.id
), updated_lessons AS (
  UPDATE lesson SET "order" = ranked.position FROM ranked
  WHERE ranked.kind = 'LESSON' AND lesson.id = ranked.id
)
UPDATE exercise SET "order" = ranked.position FROM ranked
WHERE ranked.kind = 'EXERCISE' AND exercise.id = ranked.id;
