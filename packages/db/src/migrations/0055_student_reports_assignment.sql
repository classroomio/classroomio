CREATE TABLE "exercise_assignment" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "exercise_id" uuid NOT NULL,
  "group_member_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT "exercise_assignment_exercise_member_key" UNIQUE("exercise_id","group_member_id")
);--> statement-breakpoint
CREATE TABLE "student_report" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "token_hash" varchar NOT NULL,
  "organization_id" uuid NOT NULL,
  "course_id" uuid NOT NULL,
  "profile_id" uuid NOT NULL,
  "created_by" uuid,
  "period_start" timestamp with time zone NOT NULL,
  "period_end" timestamp with time zone NOT NULL,
  "teacher_comment" text,
  "parent_email" varchar,
  "expires_at" timestamp with time zone NOT NULL,
  "revoked_at" timestamp with time zone,
  "last_viewed_at" timestamp with time zone,
  "view_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT "student_report_token_hash_key" UNIQUE("token_hash")
);--> statement-breakpoint
ALTER TABLE "exercise_assignment" ADD CONSTRAINT "exercise_assignment_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_assignment" ADD CONSTRAINT "exercise_assignment_group_member_id_fkey" FOREIGN KEY ("group_member_id") REFERENCES "public"."groupmember"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_report" ADD CONSTRAINT "student_report_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_report" ADD CONSTRAINT "student_report_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_report" ADD CONSTRAINT "student_report_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_report" ADD CONSTRAINT "student_report_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_exercise_assignment_group_member_id" ON "exercise_assignment" USING btree ("group_member_id");--> statement-breakpoint
CREATE INDEX "idx_student_report_course_profile" ON "student_report" USING btree ("course_id","profile_id");
