ALTER TABLE "organization" ADD COLUMN "student_home_path" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "student_home_course_id" uuid;--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_student_home_course_id_fkey" FOREIGN KEY ("student_home_course_id") REFERENCES "public"."course"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_student_home_single_destination" CHECK ("student_home_path" IS NULL OR "student_home_course_id" IS NULL);
