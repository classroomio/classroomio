--> Convert certificate final-exercise gates into passed exercise completion rules.
WITH final_exercises AS (
	SELECT
		c."id" AS course_id,
		(c."certificate" ->> 'requiredExerciseId')::uuid AS exercise_id,
		COALESCE(
			(c."certificate" ->> 'exerciseMinScorePercent')::integer,
			CASE WHEN c."type"::text = 'COMPLIANCE' THEN (c."compliance" ->> 'passingScore')::integer END,
			100
		) AS pass_threshold
	FROM "course" c
	WHERE c."certificate" ? 'requiredExerciseId'
		AND c."certificate" ->> 'requiredExerciseId' IS NOT NULL
)
UPDATE "exercise" e
SET
	"completion_policy" = 'passed',
	"pass_threshold" = LEAST(100, GREATEST(0,
		CASE
			WHEN e."completion_policy" = 'passed'
				THEN GREATEST(f.pass_threshold, COALESCE(e."pass_threshold", 100))
			ELSE f.pass_threshold
		END
	)),
	"allow_multiple_attempts" = true,
	"updated_at" = now()
FROM final_exercises f
WHERE e."id" = f.exercise_id
	AND e."course_id" = f.course_id;--> statement-breakpoint

--> Drop the obsolete certificate keys now that the exercise rules carry the requirement.
UPDATE "course"
SET "certificate" = "certificate" - 'requiredExerciseId' - 'exerciseMinScorePercent'
WHERE "certificate" ?| ARRAY['requiredExerciseId', 'exerciseMinScorePercent'];--> statement-breakpoint

--> The final-exercise sync setting no longer exists, so its per-course markers are dead rows.
DELETE FROM "course_template_setting_sync"
WHERE "setting_key" = 'finalExercise';--> statement-breakpoint

--> The compliance passing score only fed the removed final-exercise fallback.
UPDATE "course"
SET "compliance" = "compliance" - 'passingScore'
WHERE "compliance" ? 'passingScore';
