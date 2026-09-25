UPDATE "organization_api_key"
SET "scopes" = "scopes" || '["course:certificate:read"]'::jsonb
WHERE "type" = 'mcp' AND NOT ("scopes" @> '["course:certificate:read"]'::jsonb);
--> statement-breakpoint
UPDATE "organization_api_key"
SET "scopes" = "scopes" || '["course:certificate:write"]'::jsonb
WHERE "type" = 'mcp' AND NOT ("scopes" @> '["course:certificate:write"]'::jsonb);
