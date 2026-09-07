--> Learner lifecycle foundation: member status, activity tracking, audit trail.
--> Backs the "who isn't using the platform, and who should we remove?" loop.

CREATE TYPE "ORGANIZATION_MEMBER_STATUS" AS ENUM ('ACTIVE', 'DEACTIVATED', 'ARCHIVED');

CREATE TYPE "ORGANIZATION_MEMBER_EVENT_TYPE" AS ENUM (
  'DEACTIVATED',
  'REACTIVATED',
  'ARCHIVED',
  'UNARCHIVED',
  'REMOVED'
);

--> `status` is orthogonal to `verified`: verified means "invite accepted",
--> status means "allowed in". Existing rows are all ACTIVE by definition.
ALTER TABLE "organizationmember"
  ADD COLUMN "status" "ORGANIZATION_MEMBER_STATUS" DEFAULT 'ACTIVE' NOT NULL,
  ADD COLUMN "status_changed_at" timestamptz,
  ADD COLUMN "status_changed_by" uuid,
  ADD COLUMN "last_active_at" timestamptz;

ALTER TABLE "organizationmember"
  ADD CONSTRAINT "organizationmember_status_changed_by_fkey"
  FOREIGN KEY ("status_changed_by") REFERENCES "profile"("id") ON DELETE SET NULL;

--> Serves the audience list's default filter (org + student role + ACTIVE) and
--> `countActiveStudents`, which now excludes ARCHIVED.
CREATE INDEX "idx_orgmember_org_role_status"
  ON "organizationmember" ("organization_id", "role_id", "status");

--> Serves "inactive for N days" filtering and sorting by last activity.
CREATE INDEX "idx_orgmember_org_last_active"
  ON "organizationmember" ("organization_id", "last_active_at");

--> Last login stays a lateral MAX(logged_in_at) per user; this makes it cheap.
CREATE INDEX "idx_analytics_login_events_user_logged_in"
  ON "analytics_login_events" ("user_id", "logged_in_at" DESC);

--> Lifecycle history. `member_id` and `profile_id` are recorded values rather
--> than live references and carry no foreign key on purpose: the most important
--> rows here describe members that no longer exist, and a cascade would delete
--> exactly the evidence the table is for. `target_email` is the durable
--> human-readable identity for those rows.
CREATE TABLE "organization_member_audit" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  "organization_id" uuid NOT NULL,
  "member_id" bigint,
  "profile_id" uuid,
  "target_email" varchar,
  "event_type" "ORGANIZATION_MEMBER_EVENT_TYPE" NOT NULL,
  "actor_profile_id" uuid,
  "reason" text,
  --> The filter the action was launched from, when it came from one, so a bulk
  --> change is replayable six months later. Empty for per-row actions.
  "filter_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE "organization_member_audit"
  ADD CONSTRAINT "organization_member_audit_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;

ALTER TABLE "organization_member_audit"
  ADD CONSTRAINT "organization_member_audit_actor_profile_id_fkey"
  FOREIGN KEY ("actor_profile_id") REFERENCES "profile"("id") ON DELETE SET NULL;

CREATE INDEX "idx_organization_member_audit_org_id" ON "organization_member_audit" ("organization_id");
CREATE INDEX "idx_organization_member_audit_member_id" ON "organization_member_audit" ("member_id");
CREATE INDEX "idx_organization_member_audit_profile_id" ON "organization_member_audit" ("profile_id");
CREATE INDEX "idx_organization_member_audit_event_type" ON "organization_member_audit" ("event_type");
CREATE INDEX "idx_organization_member_audit_created_at" ON "organization_member_audit" ("created_at");

--> Backfill `last_active_at` from the two signals the nightly reconcile also
--> uses, so the column is useful the moment it ships rather than after 24h.
--> Page events are already org-scoped; lesson completions reach the org through
--> lesson -> course -> group.
WITH page_activity AS (
  SELECT "org_id", "user_id", MAX("occurred_at") AS "last_at"
  FROM "analytics_page_event"
  WHERE "org_id" IS NOT NULL AND "user_id" IS NOT NULL
  GROUP BY "org_id", "user_id"
),
lesson_activity AS (
  SELECT "g"."organization_id" AS "org_id", "lc"."profile_id" AS "user_id", MAX("lc"."updated_at") AS "last_at"
  FROM "lesson_completion" "lc"
  JOIN "lesson" "l" ON "l"."id" = "lc"."lesson_id"
  JOIN "course" "c" ON "c"."id" = "l"."course_id"
  JOIN "group" "g" ON "g"."id" = "c"."group_id"
  WHERE "lc"."profile_id" IS NOT NULL
    AND "g"."organization_id" IS NOT NULL
    AND "lc"."updated_at" IS NOT NULL
  GROUP BY "g"."organization_id", "lc"."profile_id"
),
combined AS (
  SELECT "org_id", "user_id", MAX("last_at") AS "last_at"
  FROM (
    SELECT * FROM "page_activity"
    UNION ALL
    SELECT * FROM "lesson_activity"
  ) "signals"
  GROUP BY "org_id", "user_id"
)
UPDATE "organizationmember" "om"
SET "last_active_at" = "combined"."last_at"
FROM "combined"
WHERE "om"."organization_id" = "combined"."org_id"
  AND "om"."profile_id" = "combined"."user_id";
