CREATE TYPE "public"."DEVICE_PLATFORM" AS ENUM('ios', 'android');
--> statement-breakpoint
CREATE TYPE "public"."PUSH_PROVIDER" AS ENUM('expo');
--> statement-breakpoint
CREATE TABLE "device_token" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"platform" "DEVICE_PLATFORM" NOT NULL,
	"provider" "PUSH_PROVIDER" DEFAULT 'expo' NOT NULL,
	"app_version" varchar(32),
	"device_name" varchar(120),
	"locale" varchar(35),
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"disabled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "device_token_token_key" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"type" varchar(64) NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"entity_id" varchar(64) NOT NULL,
	"course_id" uuid,
	"actor_profile_id" uuid,
	"dedupe_key" varchar(255),
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preference" (
	"profile_id" uuid NOT NULL,
	"category" varchar(64) NOT NULL,
	"push" boolean DEFAULT true NOT NULL,
	"in_app" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preference_pkey" PRIMARY KEY("profile_id","category")
);
--> statement-breakpoint
CREATE TABLE "profile_quiet_hours" (
	"profile_id" uuid PRIMARY KEY NOT NULL,
	"start_minute" integer NOT NULL,
	"end_minute" integer NOT NULL,
	"timezone" varchar(64) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "device_token" ADD CONSTRAINT "device_token_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_actor_profile_id_profile_id_fk" FOREIGN KEY ("actor_profile_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "notification_preference" ADD CONSTRAINT "notification_preference_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "profile_quiet_hours" ADD CONSTRAINT "profile_quiet_hours_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_device_token_profile" ON "device_token" USING btree ("profile_id");
--> statement-breakpoint
CREATE INDEX "idx_device_token_profile_disabled" ON "device_token" USING btree ("profile_id","disabled_at");
--> statement-breakpoint
CREATE INDEX "idx_notification_profile_org_created" ON "notification" USING btree ("profile_id","organization_id","created_at");
--> statement-breakpoint
CREATE INDEX "idx_notification_profile_unread" ON "notification" USING btree ("profile_id","organization_id") WHERE "notification"."read_at" IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "notification_profile_dedupe_key_unique" ON "notification" USING btree ("profile_id","dedupe_key") WHERE "notification"."dedupe_key" IS NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "public"."ATTENDANCE_STATUS" AS ENUM('present', 'absent', 'late');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "group_attendance" ADD COLUMN IF NOT EXISTS "status" "ATTENDANCE_STATUS" DEFAULT 'absent' NOT NULL;
--> statement-breakpoint
ALTER TABLE "group_attendance" ADD COLUMN IF NOT EXISTS "checked_in_at" timestamp with time zone;
--> statement-breakpoint
UPDATE "group_attendance" SET "status" = 'present' WHERE "is_present" = true AND "status" = 'absent';
--> statement-breakpoint
ALTER TABLE "community_question" ADD COLUMN IF NOT EXISTS "is_hidden" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "community_question" ADD COLUMN IF NOT EXISTS "accepted_answer_id" uuid;
--> statement-breakpoint
ALTER TABLE "community_answer" ADD COLUMN IF NOT EXISTS "is_hidden" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "community_question" ADD CONSTRAINT "community_question_accepted_answer_id_community_answer_id_fk" FOREIGN KEY ("accepted_answer_id") REFERENCES "public"."community_answer"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "community_question_subscription" (
	"question_id" bigint NOT NULL,
	"profile_id" uuid NOT NULL,
	"is_following" boolean DEFAULT false NOT NULL,
	"last_read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "community_question_subscription_pkey" PRIMARY KEY("question_id","profile_id")
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "community_question_subscription" ADD CONSTRAINT "community_question_subscription_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."community_question"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "community_question_subscription" ADD CONSTRAINT "community_question_subscription_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_community_question_subscription_profile" ON "community_question_subscription" USING btree ("profile_id");
--> statement-breakpoint
INSERT INTO "community_question_subscription" ("question_id", "profile_id", "is_following", "last_read_at")
SELECT DISTINCT ON (participant.question_id, participant.profile_id) participant.question_id, participant.profile_id, true, now()
FROM (
	SELECT "id" AS question_id, "author_profile_id" AS profile_id FROM "community_question" WHERE "author_profile_id" IS NOT NULL
	UNION
	SELECT "question_id", "author_profile_id" FROM "community_answer" WHERE "question_id" IS NOT NULL AND "author_profile_id" IS NOT NULL
) AS participant
INNER JOIN "profile" ON "profile"."id" = participant.profile_id
ON CONFLICT DO NOTHING;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lesson_check_in_code" (
	"lesson_id" uuid PRIMARY KEY NOT NULL,
	"code" varchar(16) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_by_profile_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "lesson_check_in_code" ADD CONSTRAINT "lesson_check_in_code_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "lesson_check_in_code" ADD CONSTRAINT "lesson_check_in_code_created_by_profile_id_fkey" FOREIGN KEY ("created_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
