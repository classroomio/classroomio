CREATE TYPE "public"."INVITE_LINK_RESOURCE_TYPE" AS ENUM('COURSE', 'COHORT');--> statement-breakpoint
CREATE TABLE "invite_link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"resource_type" "INVITE_LINK_RESOURCE_TYPE" NOT NULL,
	"course_id" uuid,
	"cohort_id" uuid,
	"role_id" bigint NOT NULL,
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
	CONSTRAINT "invite_link_token_hash_key" UNIQUE("token_hash"),
	CONSTRAINT "invite_link_course_id_role_id_unique" UNIQUE("course_id","role_id"),
	CONSTRAINT "invite_link_cohort_id_role_id_unique" UNIQUE("cohort_id","role_id"),
	CONSTRAINT "invite_link_resource_target_check" CHECK ((
        ("invite_link"."resource_type" = 'COURSE' AND "invite_link"."course_id" IS NOT NULL AND "invite_link"."cohort_id" IS NULL)
        OR ("invite_link"."resource_type" = 'COHORT' AND "invite_link"."cohort_id" IS NOT NULL AND "invite_link"."course_id" IS NULL)
      ))
);
--> statement-breakpoint
ALTER TABLE "invite_link" ADD CONSTRAINT "invite_link_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_link" ADD CONSTRAINT "invite_link_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_link" ADD CONSTRAINT "invite_link_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohort"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_link" ADD CONSTRAINT "invite_link_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_invite_link_organization_id" ON "invite_link" USING btree ("organization_id");