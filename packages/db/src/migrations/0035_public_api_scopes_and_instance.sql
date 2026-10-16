CREATE TABLE "instance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"singleton" boolean DEFAULT true NOT NULL,
	"first_reported_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "instance_singleton_key" UNIQUE("singleton"),
	CONSTRAINT "instance_singleton_check" CHECK ("instance"."singleton")
);
--> statement-breakpoint
--> Give existing MCP keys the submission, learner, audience and team scopes that new MCP keys get by default.
--> Only keys holding the full previous default set are touched, so a key created
--> with a narrower custom scope list is not widened. Only missing scopes are appended.
UPDATE "organization_api_key"
SET "scopes" = "scopes" || (
  SELECT jsonb_agg(scope)
  FROM jsonb_array_elements_text('["course:submission:read", "course:submission:write", "course:learner:write", "audience:read", "audience:write", "team:read", "team:write"]'::jsonb) AS scope
  WHERE NOT "organization_api_key"."scopes" ? scope
)
WHERE "type" = 'mcp'
  AND "scopes" @> '["course_import:draft:create", "course_import:draft:read", "course_import:draft:update", "course_import:draft:publish", "course:read", "course:write", "course:tag:write", "course:exercise:read", "course:exercise:write", "cohort:read", "cohort:write", "course:member:read", "course:member:write", "course:certificate:read", "course:certificate:write", "analytics:read", "media:write"]'::jsonb
  AND NOT "scopes" @> '["course:submission:read", "course:submission:write", "course:learner:write", "audience:read", "audience:write", "team:read", "team:write"]'::jsonb;
