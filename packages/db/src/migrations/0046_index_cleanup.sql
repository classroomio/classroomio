DROP INDEX IF EXISTS "idx_assets_organization_id";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_organizationmember_profile_id";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_organizationmember_organization_id";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_analytics_login_events_user_id";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_profile_id";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_organization_auth_policy_org_id";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_option_on_question_id" ON "option" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lesson_language_on_lesson_id_locale" ON "lesson_language" USING btree ("lesson_id","locale");
