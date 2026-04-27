CREATE TABLE IF NOT EXISTS "ai_chat_document" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"asset_id" uuid,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"text" text NOT NULL,
	"word_count" integer DEFAULT 0 NOT NULL,
	"page_count" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_chat_document" ADD CONSTRAINT "ai_chat_document_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_chat_conversation"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_chat_document_conversation" ON "ai_chat_document" ("conversation_id");
