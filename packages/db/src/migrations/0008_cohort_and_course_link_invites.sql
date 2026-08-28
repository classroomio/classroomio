CREATE TYPE "public"."COURSE_INVITE_TYPE" AS ENUM('EMAIL', 'LINK');--> statement-breakpoint
CREATE TABLE "cohort_invite" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cohort_id" uuid NOT NULL,
	"role_id" integer NOT NULL,
	"token" text NOT NULL,
	"token_hash" text NOT NULL,
	"created_by_profile_id" uuid NOT NULL,
	"revoked_by_profile_id" uuid,
	"revoked_at" timestamp with time zone,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"join_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "cohort_invite_token_hash_key" UNIQUE("token_hash"),
	CONSTRAINT "cohort_invite_cohort_id_unique" UNIQUE("cohort_id")
);
--> statement-breakpoint
ALTER TABLE "course_invite" ADD COLUMN "type" "COURSE_INVITE_TYPE" DEFAULT 'EMAIL' NOT NULL;--> statement-breakpoint
ALTER TABLE "course_invite" ADD COLUMN "token" text;--> statement-breakpoint
ALTER TABLE "cohort_invite" ADD CONSTRAINT "cohort_invite_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohort"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_invite" ADD CONSTRAINT "cohort_invite_created_by_profile_id_fkey" FOREIGN KEY ("created_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_invite" ADD CONSTRAINT "cohort_invite_revoked_by_profile_id_fkey" FOREIGN KEY ("revoked_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_invite" ADD CONSTRAINT "cohort_invite_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "course_invite_one_link_per_course" ON "course_invite" USING btree ("course_id") WHERE "course_invite"."type" = 'LINK';