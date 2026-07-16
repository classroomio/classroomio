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
ALTER TABLE "organizationmember_email_notifications" ADD CONSTRAINT "organizationmember_email_notifications_organization_member_id_fkey" FOREIGN KEY ("organization_member_id") REFERENCES "public"."organizationmember"("id") ON DELETE cascade ON UPDATE no action;