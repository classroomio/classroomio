alter table "public"."organization_plan" add column "provider" text default 'lmz'::text;

alter table "public"."organization_plan" add column "subscription_id" text;

CREATE UNIQUE INDEX organization_plan_subscription_id_key ON public.organization_plan USING btree (subscription_id);

alter table "public"."organization_plan" add constraint "organization_plan_subscription_id_key" UNIQUE using index "organization_plan_subscription_id_key";