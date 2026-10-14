-- Guarded: 0000 declares these, but databases adopted before migrations never ran it, and ON CONFLICT fails without them.

DELETE FROM "analytics_login_events"
WHERE "id" IN (
  SELECT "id" FROM (
    SELECT "id", row_number() OVER (
      PARTITION BY "user_id", "logged_in_date" ORDER BY "logged_in_at" DESC NULLS LAST, "id"
    ) AS "duplicate_rank"
    FROM "analytics_login_events"
  ) AS "ranked"
  WHERE "duplicate_rank" > 1
);--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'analytics_login_events_user_id_date_unique') THEN
    ALTER TABLE "analytics_login_events" ADD CONSTRAINT "analytics_login_events_user_id_date_unique" UNIQUE("user_id","logged_in_date");
  END IF;
END $$;--> statement-breakpoint

DELETE FROM "analytics_org_daily"
WHERE "id" IN (
  SELECT "id" FROM (
    SELECT "id", row_number() OVER (
      PARTITION BY "org_id", "date" ORDER BY "updated_at" DESC, "id"
    ) AS "duplicate_rank"
    FROM "analytics_org_daily"
  ) AS "ranked"
  WHERE "duplicate_rank" > 1
);--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'analytics_org_daily_org_date_unique') THEN
    ALTER TABLE "analytics_org_daily" ADD CONSTRAINT "analytics_org_daily_org_date_unique" UNIQUE("org_id","date");
  END IF;
END $$;--> statement-breakpoint

DELETE FROM "analytics_country_daily"
WHERE "id" IN (
  SELECT "id" FROM (
    SELECT "id", row_number() OVER (
      PARTITION BY "org_id", "date", "country" ORDER BY "updated_at" DESC, "id"
    ) AS "duplicate_rank"
    FROM "analytics_country_daily"
  ) AS "ranked"
  WHERE "duplicate_rank" > 1
);--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'analytics_country_daily_org_date_country_unique') THEN
    ALTER TABLE "analytics_country_daily" ADD CONSTRAINT "analytics_country_daily_org_date_country_unique" UNIQUE("org_id","date","country");
  END IF;
END $$;--> statement-breakpoint

DELETE FROM "ai_tutor_message_count"
WHERE "id" IN (
  SELECT "id" FROM (
    SELECT "id", row_number() OVER (
      PARTITION BY "org_id", "user_id", "period_start" ORDER BY "message_count" DESC, "id"
    ) AS "duplicate_rank"
    FROM "ai_tutor_message_count"
  ) AS "ranked"
  WHERE "duplicate_rank" > 1
);--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_tutor_message_count_org_user_period_key') THEN
    ALTER TABLE "ai_tutor_message_count" ADD CONSTRAINT "ai_tutor_message_count_org_user_period_key" UNIQUE("org_id","user_id","period_start");
  END IF;
END $$;--> statement-breakpoint

DELETE FROM "course_completion_notification_event"
WHERE "id" IN (
  SELECT "id" FROM (
    SELECT "id", row_number() OVER (
      PARTITION BY "course_completion_record_id", "channel", "event_type" ORDER BY "sent_at", "id"
    ) AS "duplicate_rank"
    FROM "course_completion_notification_event"
  ) AS "ranked"
  WHERE "duplicate_rank" > 1
);--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'course_completion_notification_event_record_channel_type_key') THEN
    ALTER TABLE "course_completion_notification_event" ADD CONSTRAINT "course_completion_notification_event_record_channel_type_key" UNIQUE("course_completion_record_id","channel","event_type");
  END IF;
END $$;--> statement-breakpoint

INSERT INTO "analytics_login_events" ("user_id", "logged_in_at", "logged_in_date")
SELECT "user_id", MAX("seen_at") AT TIME ZONE 'UTC', "seen_at"::date
FROM (
  SELECT "user_id", "created_at" AS "seen_at" FROM "session" WHERE "impersonated_by" IS NULL
  UNION ALL
  SELECT "user_id", "updated_at" AS "seen_at" FROM "session" WHERE "impersonated_by" IS NULL
) AS "session_activity"
WHERE "seen_at" IS NOT NULL
GROUP BY "user_id", "seen_at"::date
ON CONFLICT ("user_id", "logged_in_date") DO NOTHING;
