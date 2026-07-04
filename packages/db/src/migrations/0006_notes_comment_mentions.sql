CREATE TABLE "org_note_comment_mention" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "org_note_comment_mention" ADD CONSTRAINT "org_note_comment_mention_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."org_note_comment"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "org_note_comment_mention" ADD CONSTRAINT "org_note_comment_mention_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_org_note_comment_mention_comment_id" ON "org_note_comment_mention" USING btree ("comment_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_org_note_comment_mention_unique" ON "org_note_comment_mention" USING btree ("comment_id","profile_id");
