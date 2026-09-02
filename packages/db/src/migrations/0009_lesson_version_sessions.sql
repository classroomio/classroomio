CREATE TYPE "public"."LESSON_VERSION_KIND" AS ENUM('auto', 'manual', 'publish');--> statement-breakpoint

ALTER TABLE "lesson_language_history" ADD COLUMN "kind" "LESSON_VERSION_KIND" DEFAULT 'auto' NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson_language_history" ADD COLUMN "label" text;--> statement-breakpoint
ALTER TABLE "lesson_language_history" ADD COLUMN "author_id" uuid;--> statement-breakpoint
ALTER TABLE "lesson_language_history" ADD COLUMN "session_started_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson_language_history" ADD COLUMN "edit_count" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson_language_history" ADD COLUMN "is_sealed" boolean DEFAULT false NOT NULL;--> statement-breakpoint

-- Existing rows are one-save-per-row snapshots, so their session begins and ends
-- at the same instant. Seal them: they predate coalescing and must never be
-- extended by a later autosave.
UPDATE "lesson_language_history" SET "session_started_at" = "timestamp", "is_sealed" = true;--> statement-breakpoint

ALTER TABLE "lesson_language_history" ADD CONSTRAINT "lesson_language_history_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lesson_language_history_language_timestamp_idx" ON "lesson_language_history" USING btree ("lesson_language_id","timestamp" DESC NULLS LAST);--> statement-breakpoint

-- `old_content` duplicated the whole document on every write: the previous
-- snapshot's `new_content` is already the old content. Drop the column and let
-- the view derive it with a window function. The view has to go first because
-- it selects the column being dropped.
DROP VIEW IF EXISTS "public"."lesson_versions";--> statement-breakpoint
ALTER TABLE "lesson_language_history" DROP COLUMN "old_content";--> statement-breakpoint

CREATE VIEW "public"."lesson_versions" AS (SELECT llh.id, lag(llh.new_content) OVER (PARTITION BY llh.lesson_language_id ORDER BY llh."timestamp", llh.id) AS old_content, llh.new_content, llh.kind, llh.label, llh.session_started_at, llh."timestamp", llh.edit_count, llh.is_sealed, llh.author_id, p.fullname AS author_name, p.avatar_url AS author_avatar_url, ll.locale, ll.lesson_id FROM lesson_language_history llh JOIN lesson_language ll ON ll.id = llh.lesson_language_id LEFT JOIN profile p ON p.id = llh.author_id);
