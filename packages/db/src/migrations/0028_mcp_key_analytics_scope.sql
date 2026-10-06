--> Give existing MCP keys the analytics:read scope that new MCP keys get by default.
--> Only keys holding the full previous default set are touched, so a key created
--> with a narrower custom scope list is not widened.
UPDATE "organization_api_key"
SET "scopes" = "scopes" || '["analytics:read"]'::jsonb
WHERE "type" = 'mcp'
  AND "scopes" @> '["course_import:draft:create", "course_import:draft:read", "course_import:draft:update", "course_import:draft:publish", "course:read", "course:write", "course:tag:write", "course:exercise:read", "course:exercise:write", "cohort:read", "cohort:write"]'::jsonb
  AND NOT "scopes" @> '["analytics:read"]'::jsonb;
