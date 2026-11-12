--> Deactivate was retired. Archived members keep blocked access and release their seat.
--> The `DEACTIVATED` enum values stay in the types: Postgres cannot drop an enum value, and old audit rows use them.
INSERT INTO "organization_member_audit" ("organization_id", "member_id", "profile_id", "target_email", "event_type", "reason")
SELECT "organization_id", "id", "profile_id", "email", 'ARCHIVED', 'Deactivate was retired; archived to keep access blocked'
FROM "organizationmember"
WHERE "status" = 'DEACTIVATED';--> statement-breakpoint
UPDATE "organizationmember"
SET "status" = 'ARCHIVED', "status_changed_at" = now(), "status_changed_by" = NULL
WHERE "status" = 'DEACTIVATED';
