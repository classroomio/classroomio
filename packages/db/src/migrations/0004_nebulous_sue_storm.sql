CREATE TYPE "public"."note_visibility" AS ENUM('private', 'team', 'public');--> statement-breakpoint
ALTER TABLE "org_note" ADD COLUMN "visibility" "note_visibility" DEFAULT 'private' NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_org_note_visibility" ON "org_note" USING btree ("organization_id","visibility");