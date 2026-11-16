ALTER TABLE "block_locale_history" ADD COLUMN "client_name" varchar(120);--> statement-breakpoint
ALTER TABLE "lesson_revision" ADD COLUMN "client_name" varchar(120);--> statement-breakpoint
DROP VIEW "public"."block_versions";--> statement-breakpoint
CREATE VIEW "public"."block_versions" AS (SELECT bh.id, lag(bh.new_content) OVER (PARTITION BY bh.block_locale_id ORDER BY bh."timestamp", bh.id) AS old_content, bh.new_content, bh.kind, bh.label, bh.session_started_at, bh."timestamp", bh.edit_count, bh.is_sealed, bh.author_id, p.fullname AS author_name, p.avatar_url AS author_avatar_url, bl.locale, bl.block_id, bh.source, bh.client_name, bh.change_set_id FROM block_locale_history bh JOIN block_locale bl ON bl.id = bh.block_locale_id LEFT JOIN profile p ON p.id = bh.author_id);
