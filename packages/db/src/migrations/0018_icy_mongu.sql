CREATE TABLE "personal_learning_conversation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"organization_id" uuid,
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"offer_id" uuid,
	"offer_payload" jsonb,
	"offer_status" varchar(16) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "personal_learning_conversation_offer_id_unique" UNIQUE("offer_id")
);
--> statement-breakpoint
CREATE TABLE "personal_learning_journey" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"organization_id" uuid,
	"course_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"goal" text NOT NULL,
	"language" varchar(16) NOT NULL,
	"target_study_days" integer NOT NULL,
	"daily_minutes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "personal_learning_journey_course_id_unique" UNIQUE("course_id"),
	CONSTRAINT "personal_learning_journey_conversation_id_unique" UNIQUE("conversation_id"),
	CONSTRAINT "personal_learning_journey_target_study_days_check" CHECK ("personal_learning_journey"."target_study_days" in (1, 7, 30)),
	CONSTRAINT "personal_learning_journey_daily_minutes_check" CHECK ("personal_learning_journey"."daily_minutes" in (30, 60, 120))
);
--> statement-breakpoint
CREATE TABLE "personal_learning_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journey_id" uuid NOT NULL,
	"session_index" integer NOT NULL,
	"lesson_id" uuid,
	"status" varchar(16) DEFAULT 'queued' NOT NULL,
	"source_manifest" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"generation_meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"failure_code" varchar(64),
	"attempt" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "personal_learning_session_journey_index_unique" UNIQUE("journey_id","session_index"),
	CONSTRAINT "personal_learning_session_index_check" CHECK ("personal_learning_session"."session_index" > 0),
	CONSTRAINT "personal_learning_session_attempt_check" CHECK ("personal_learning_session"."attempt" >= 0)
);
--> statement-breakpoint
ALTER TABLE "personal_learning_conversation" ADD CONSTRAINT "personal_learning_conversation_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "personal_learning_conversation" ADD CONSTRAINT "personal_learning_conversation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "personal_learning_journey" ADD CONSTRAINT "personal_learning_journey_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "personal_learning_journey" ADD CONSTRAINT "personal_learning_journey_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "personal_learning_journey" ADD CONSTRAINT "personal_learning_journey_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "personal_learning_journey" ADD CONSTRAINT "personal_learning_journey_conversation_id_personal_learning_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."personal_learning_conversation"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "personal_learning_session" ADD CONSTRAINT "personal_learning_session_journey_id_personal_learning_journey_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."personal_learning_journey"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "personal_learning_session" ADD CONSTRAINT "personal_learning_session_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "personal_learning_conversation_owner_idx" ON "personal_learning_conversation" USING btree ("owner_user_id");
--> statement-breakpoint
CREATE INDEX "personal_learning_journey_owner_idx" ON "personal_learning_journey" USING btree ("owner_user_id");
--> statement-breakpoint
CREATE INDEX "personal_learning_session_status_idx" ON "personal_learning_session" USING btree ("status");
