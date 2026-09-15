--> Enforce required, non-null order values for course content.
--> Only rows with a NULL order are backfilled (deterministically, after the
--> highest non-null order of their parent group). Existing non-null orders are
--> left untouched so a sequence a user deliberately configured is preserved.

ALTER TABLE "course_section" ALTER COLUMN "order" DROP DEFAULT;

UPDATE "course_section" AS section
SET "order" = COALESCE(
    (
      SELECT MAX(sibling."order")
      FROM "course_section" AS sibling
      WHERE sibling."course_id" = section."course_id"
        AND sibling."order" IS NOT NULL
    ),
    0
  ) + (
    SELECT COUNT(*)
    FROM "course_section" AS sibling
    WHERE sibling."course_id" = section."course_id"
      AND sibling."order" IS NULL
      AND sibling."id" <= section."id"
  )
WHERE section."order" IS NULL;

ALTER TABLE "course_section" ALTER COLUMN "order" SET NOT NULL;

UPDATE "lesson" AS lesson
SET "order" = COALESCE(
    (
      SELECT MAX(sibling."order")
      FROM "lesson" AS sibling
      WHERE sibling."section_id" IS NOT DISTINCT FROM lesson."section_id"
        AND sibling."order" IS NOT NULL
    ),
    0
  ) + (
    SELECT COUNT(*)
    FROM "lesson" AS sibling
    WHERE sibling."section_id" IS NOT DISTINCT FROM lesson."section_id"
      AND sibling."order" IS NULL
      AND sibling."id" <= lesson."id"
  )
WHERE lesson."order" IS NULL;

ALTER TABLE "lesson" ALTER COLUMN "order" SET NOT NULL;

UPDATE "exercise" AS exercise
SET "order" = COALESCE(
    (
      SELECT MAX(sibling."order")
      FROM "exercise" AS sibling
      WHERE sibling."lesson_id" IS NOT DISTINCT FROM exercise."lesson_id"
        AND sibling."section_id" IS NOT DISTINCT FROM exercise."section_id"
        AND sibling."order" IS NOT NULL
    ),
    0
  ) + (
    SELECT COUNT(*)
    FROM "exercise" AS sibling
    WHERE sibling."lesson_id" IS NOT DISTINCT FROM exercise."lesson_id"
      AND sibling."section_id" IS NOT DISTINCT FROM exercise."section_id"
      AND sibling."order" IS NULL
      AND sibling."id" <= exercise."id"
  )
WHERE exercise."order" IS NULL;

ALTER TABLE "exercise" ALTER COLUMN "order" SET NOT NULL;
