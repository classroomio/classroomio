--> Give existing MCP keys the cohort scopes that new MCP keys get by default, and drop public_api:*
--> from them, so an MCP key only reaches the cohort routes of the public API.
--> Only keys holding the full previous default set are touched, so a key created
--> with a narrower custom scope list is not widened.
UPDATE "organization_api_key"
SET "scopes" = ("scopes" - 'public_api:*') || '["cohort:read", "cohort:write"]'::jsonb
WHERE "type" = 'mcp'
  AND "scopes" @> '["course_import:draft:create", "course_import:draft:read", "course_import:draft:update", "course_import:draft:publish", "course:read", "course:write", "course:tag:write", "course:exercise:read", "course:exercise:write"]'::jsonb
  AND NOT "scopes" @> '["cohort:read"]'::jsonb;
