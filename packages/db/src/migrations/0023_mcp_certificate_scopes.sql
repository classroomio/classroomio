--> Give existing MCP keys the certificate scopes that new MCP keys get by default.
--> Only keys holding the full previous default set are touched, so a key created
--> with a narrower custom scope list is not widened.
UPDATE "organization_api_key"
SET "scopes" = "scopes" || '["course:certificate:read", "course:certificate:write"]'::jsonb
WHERE "type" = 'mcp'
  AND "scopes" @> '["course_import:draft:create", "course_import:draft:read", "course_import:draft:update", "course_import:draft:publish", "course:read", "course:write", "course:tag:write", "course:exercise:read", "course:exercise:write"]'::jsonb
  AND NOT "scopes" @> '["course:certificate:read"]'::jsonb;
