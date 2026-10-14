CREATE TABLE "instance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"singleton" boolean DEFAULT true NOT NULL,
	"first_reported_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "instance_singleton_key" UNIQUE("singleton"),
	CONSTRAINT "instance_singleton_check" CHECK ("instance"."singleton")
);
