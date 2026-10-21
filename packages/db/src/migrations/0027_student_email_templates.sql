CREATE TABLE "organization_student_email_template" (
	"organization_id" uuid NOT NULL,
	"email_id" varchar NOT NULL,
	"subject" text,
	"locale" "LOCALE" NOT NULL,
	"content" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_student_email_template_organization_id_email_id_locale_pk" PRIMARY KEY("organization_id", "email_id", "locale")
);
--> statement-breakpoint
ALTER TABLE "organization_student_email_template" ADD CONSTRAINT "organization_student_email_template_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;