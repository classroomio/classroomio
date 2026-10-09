CREATE TABLE "cohort_course_staff_grant" (
	"cohort_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cohort_course_staff_grant_pkey" PRIMARY KEY("cohort_id","course_id","profile_id")
);
--> statement-breakpoint
CREATE TABLE "cohort_granted_group_member" (
	"group_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cohort_granted_group_member_pkey" PRIMARY KEY("group_id","profile_id")
);
--> statement-breakpoint
ALTER TABLE "cohort_course_staff_grant" ADD CONSTRAINT "cohort_course_staff_grant_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohort"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_course_staff_grant" ADD CONSTRAINT "cohort_course_staff_grant_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_course_staff_grant" ADD CONSTRAINT "cohort_course_staff_grant_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_granted_group_member" ADD CONSTRAINT "cohort_granted_group_member_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_granted_group_member" ADD CONSTRAINT "cohort_granted_group_member_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cohort_course_staff_grant_course_profile" ON "cohort_course_staff_grant" USING btree ("course_id","profile_id");
