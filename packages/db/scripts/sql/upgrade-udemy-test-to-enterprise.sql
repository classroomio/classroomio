-- Replace 'udemy-test' with the siteName of the org.

WITH target_org AS (
  SELECT COALESCE(parent_organization_id, id) AS id
  FROM organization
  WHERE "siteName" = 'udemy-test'
),
deactivated_plans AS (
  UPDATE organization_plan
  SET
    is_active = false,
    deactivated_at = now(),
    updated_at = now()
  WHERE org_id = (SELECT id FROM target_org)
    AND is_active IS TRUE
    AND subscription_id IS DISTINCT FROM 'manual-enterprise:udemy-test'
)
INSERT INTO organization_plan (
  org_id,
  plan_name,
  is_active,
  triggered_by,
  provider,
  subscription_id
)
SELECT
  target_org.id,
  'ENTERPRISE',
  true,
  (
    SELECT id
    FROM organizationmember
    WHERE organization_id = target_org.id
      AND role_id = 1
    ORDER BY verified DESC, id
    LIMIT 1
  ),
  'manual',
  'manual-enterprise:udemy-test'
FROM target_org
ON CONFLICT (subscription_id) DO UPDATE
SET
  org_id = EXCLUDED.org_id,
  plan_name = 'ENTERPRISE',
  is_active = true,
  activated_at = now(),
  deactivated_at = NULL,
  updated_at = now(),
  triggered_by = EXCLUDED.triggered_by,
  provider = 'manual'
RETURNING *;
