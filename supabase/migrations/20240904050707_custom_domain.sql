alter table "public"."organization" add column "customCode" text;

alter table "public"."organization" add column "customDomain" text;

alter table "public"."organization" add column "favicon" text;

alter table "public"."organization" add column "isCustomDomainVerified" boolean default false;

CREATE UNIQUE INDEX "organization_customDomain_key" ON public.organization USING btree ("customDomain");

alter table "public"."organization" add constraint "organization_customDomain_key" UNIQUE using index "organization_customDomain_key";
