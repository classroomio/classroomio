CREATE TABLE "note_tag_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tag_id" uuid NOT NULL,
	"note_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "note_tag_assignment_tag_note_key" UNIQUE("tag_id","note_id")
);
--> statement-breakpoint
ALTER TABLE "note_tag_assignment" ADD CONSTRAINT "note_tag_assignment_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_tag_assignment" ADD CONSTRAINT "note_tag_assignment_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "public"."org_note"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_note_tag_assignment_tag_id" ON "note_tag_assignment" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "idx_note_tag_assignment_note_id" ON "note_tag_assignment" USING btree ("note_id");