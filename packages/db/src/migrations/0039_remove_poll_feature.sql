ALTER TABLE "organization" ALTER COLUMN "customization" SET DEFAULT '{"apps":{"comments":true},"course":{"grading":true,"newsfeed":true},"dashboard":{"exercise":true,"community":true,"bannerText":"","bannerImage":""}}'::json;--> statement-breakpoint
UPDATE "organization" SET "customization" = ("customization"::jsonb #- '{apps,poll}')::json WHERE "customization"::jsonb #> '{apps,poll}' IS NOT NULL;--> statement-breakpoint
DROP TABLE IF EXISTS "apps_poll_submission";--> statement-breakpoint
DROP TABLE IF EXISTS "apps_poll_option";--> statement-breakpoint
DROP TABLE IF EXISTS "apps_poll";
