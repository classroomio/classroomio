CREATE TABLE "organizationmember_email_notifications" (
	"organization_member_id" bigint PRIMARY KEY NOT NULL,
	"new_student" boolean DEFAULT true NOT NULL,
	"new_submission" boolean DEFAULT true NOT NULL,
	"grading_result" boolean DEFAULT true NOT NULL,
	"newsfeed" boolean DEFAULT true NOT NULL,
	"quiz_assigned" boolean DEFAULT true NOT NULL,
	"cohort_reminder" boolean DEFAULT true NOT NULL,
	"session" boolean DEFAULT true NOT NULL,
	"course_completion" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organizationmember_email_notifications" ADD CONSTRAINT "organizationmember_email_notifications_organization_member_id_fkey" FOREIGN KEY ("organization_member_id") REFERENCES "public"."organizationmember"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "organizationmember_email_notifications" (
	"organization_member_id",
	"new_student",
	"new_submission",
	"grading_result",
	"newsfeed",
	"quiz_assigned",
	"cohort_reminder",
	"session",
	"course_completion"
)
SELECT
	om.id,
	COALESCE((p.settings->'emailNotifications'->>'newStudent')::boolean, true),
	COALESCE((p.settings->'emailNotifications'->>'newSubmission')::boolean, true),
	COALESCE((p.settings->'emailNotifications'->>'gradingResult')::boolean, true),
	COALESCE((p.settings->'emailNotifications'->>'newsfeed')::boolean, true),
	COALESCE((p.settings->'emailNotifications'->>'quizAssigned')::boolean, true),
	COALESCE((p.settings->'emailNotifications'->>'cohortReminder')::boolean, true),
	COALESCE((p.settings->'emailNotifications'->>'session')::boolean, true),
	COALESCE((p.settings->'emailNotifications'->>'courseCompletion')::boolean, true)
FROM "organizationmember" om
INNER JOIN "profile" p ON p.id = om.profile_id
WHERE p.settings ? 'emailNotifications'
ON CONFLICT ("organization_member_id") DO NOTHING;--> statement-breakpoint
UPDATE "profile"
SET settings = settings - 'emailNotifications'
WHERE settings ? 'emailNotifications';