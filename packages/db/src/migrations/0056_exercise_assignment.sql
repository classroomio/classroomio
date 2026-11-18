CREATE TABLE "exercise_assignment" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "exercise_id" uuid NOT NULL,
  "group_member_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT "exercise_assignment_exercise_member_key" UNIQUE("exercise_id","group_member_id")
);--> statement-breakpoint
ALTER TABLE "exercise_assignment" ADD CONSTRAINT "exercise_assignment_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_assignment" ADD CONSTRAINT "exercise_assignment_group_member_id_fkey" FOREIGN KEY ("group_member_id") REFERENCES "public"."groupmember"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_exercise_assignment_group_member_id" ON "exercise_assignment" USING btree ("group_member_id");
