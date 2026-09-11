ALTER TABLE "profile" ADD COLUMN "welcome_email_pending" boolean DEFAULT false NOT NULL;
ALTER TABLE "profile" ADD COLUMN "welcome_email_sent_at" timestamp with time zone;
