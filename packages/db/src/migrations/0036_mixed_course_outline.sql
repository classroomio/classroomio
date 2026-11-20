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
--> statement-breakpoint
-- Mirrors slugifyTitle + resolveSlugCollision in packages/utils/src/validation/shared/slug.ts so backfilled slugs match app-generated ones.
DO $$
DECLARE
  item record;
  base_slug text;
  candidate text;
  suffix text;
  counter integer;
BEGIN
  CREATE TEMP TABLE taken_item_slug ON COMMIT DROP AS
    SELECT course_id, slug FROM lesson WHERE slug IS NOT NULL
    UNION
    SELECT course_id, slug FROM exercise WHERE slug IS NOT NULL;
  CREATE INDEX ON taken_item_slug (course_id, slug);

  FOR item IN
    SELECT 'lesson' AS kind, id, course_id, title, created_at FROM lesson WHERE slug IS NULL
    UNION ALL
    SELECT 'exercise' AS kind, id, course_id, title, created_at FROM exercise WHERE slug IS NULL
    ORDER BY course_id, created_at, id
  LOOP
    base_slug := rtrim(
      left(
        btrim(
          regexp_replace(
            lower(regexp_replace(normalize(coalesce(item.title, ''), NFKD), '[̀-ͯ]', '', 'g')),
            '[^a-z0-9]+', '-', 'g'
          ),
          '-'
        ),
        80
      ),
      '-'
    );
    IF base_slug = '' THEN
      base_slug := 'untitled';
    END IF;

    candidate := base_slug;
    counter := 2;
    WHILE EXISTS (
      SELECT 1 FROM taken_item_slug
      WHERE course_id IS NOT DISTINCT FROM item.course_id AND slug = candidate
    ) LOOP
      suffix := '-' || counter;
      candidate := rtrim(left(base_slug, 80 - length(suffix)), '-');
      IF candidate = '' THEN
        candidate := 'untitled';
      END IF;
      candidate := candidate || suffix;
      counter := counter + 1;
    END LOOP;

    INSERT INTO taken_item_slug (course_id, slug) VALUES (item.course_id, candidate);
    IF item.kind = 'lesson' THEN
      UPDATE lesson SET slug = candidate WHERE id = item.id;
    ELSE
      UPDATE exercise SET slug = candidate WHERE id = item.id;
    END IF;
  END LOOP;
END $$;
--> statement-breakpoint
ALTER TABLE "lesson" ALTER COLUMN "slug" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "exercise" ALTER COLUMN "slug" SET NOT NULL;
