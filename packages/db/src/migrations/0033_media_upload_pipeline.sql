--> Give existing MCP keys the media scope that new MCP keys get by default, so an
--> MCP key can reach the public API's asset upload route.
--> Only keys holding the full previous default set are touched, so a key created
--> with a narrower custom scope list is not widened.
UPDATE "organization_api_key"
SET "scopes" = "scopes" || '["media:write"]'::jsonb
WHERE "type" = 'mcp'
  AND "scopes" @> '["course_import:draft:create", "course_import:draft:read", "course_import:draft:update", "course_import:draft:publish", "course:read", "course:write", "course:tag:write", "course:exercise:read", "course:exercise:write", "cohort:read", "cohort:write", "course:member:read", "course:member:write", "course:certificate:read", "course:certificate:write", "analytics:read"]'::jsonb
  AND NOT "scopes" @> '["media:write"]'::jsonb;
