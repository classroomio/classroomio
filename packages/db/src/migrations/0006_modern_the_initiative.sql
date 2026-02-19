CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"kind" varchar DEFAULT 'video' NOT NULL,
	"provider" varchar DEFAULT 'upload' NOT NULL,
	"storage_provider" varchar DEFAULT 's3' NOT NULL,
	"storage_key" text,
	"source_url" text,
	"mime_type" text,
	"byte_size" bigint,
	"checksum" text,
	"title" text,
	"description" text,
	"thumbnail_url" text,
	"duration_seconds" integer,
	"aspect_ratio" text,
	"is_external" boolean DEFAULT false NOT NULL,
	"status" varchar DEFAULT 'active' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_by_profile_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "assets_org_provider_storage_key_unique" UNIQUE("organization_id","provider","storage_key")
);
--> statement-breakpoint
CREATE TABLE "asset_usages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"target_type" varchar NOT NULL,
	"target_id" text NOT NULL,
	"slot_type" varchar DEFAULT 'lesson_video' NOT NULL,
	"slot_key" text,
	"position" integer,
	"created_by_profile_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "asset_usages_asset_target_slot_unique" UNIQUE("asset_id","target_type","target_id","slot_type","slot_key","position")
);
--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_created_by_profile_id_fkey" FOREIGN KEY ("created_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_usages" ADD CONSTRAINT "asset_usages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_usages" ADD CONSTRAINT "asset_usages_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_usages" ADD CONSTRAINT "asset_usages_created_by_profile_id_fkey" FOREIGN KEY ("created_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "idx_assets_organization_id" ON "assets" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_assets_organization_status" ON "assets" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_assets_organization_kind_status" ON "assets" USING btree ("organization_id","kind","status");--> statement-breakpoint
CREATE INDEX "idx_assets_organization_created_at" ON "assets" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_assets_organization_byte_size" ON "assets" USING btree ("organization_id","byte_size");--> statement-breakpoint
CREATE INDEX "idx_asset_usages_org_id" ON "asset_usages" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_asset_usages_asset_id" ON "asset_usages" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "idx_asset_usages_target" ON "asset_usages" USING btree ("target_type","target_id");