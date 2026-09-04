ALTER TABLE "course_section" ALTER COLUMN "order" SET DEFAULT '1';--> statement-breakpoint
ALTER TABLE "course_section" ALTER COLUMN "order" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "exercise" ALTER COLUMN "order" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson" ALTER COLUMN "order" SET NOT NULL;