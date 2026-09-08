-- Guarded: these exist in schema.ts but not in databases adopted before migrations.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'program_course_program_id_course_id_unique') THEN
    ALTER TABLE "program_course" ADD CONSTRAINT "program_course_program_id_course_id_unique" UNIQUE("program_id","course_id");
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'program_member_program_id_profile_id_unique') THEN
    ALTER TABLE "program_member" ADD CONSTRAINT "program_member_program_id_profile_id_unique" UNIQUE("program_id","profile_id");
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'widget_version_widget_version_key') THEN
    ALTER TABLE "widget_version" ADD CONSTRAINT "widget_version_widget_version_key" UNIQUE("widget_id","version");
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'widget_course_widget_course_key') THEN
    ALTER TABLE "widget_course" ADD CONSTRAINT "widget_course_widget_course_key" UNIQUE("widget_id","course_id");
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_entries') THEN
    ALTER TABLE "groupmember" ADD CONSTRAINT "unique_entries" UNIQUE("group_id","profile_id","email");
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_group_email') THEN
    ALTER TABLE "groupmember" ADD CONSTRAINT "unique_group_email" UNIQUE("group_id","email");
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'asset_usages_asset_target_slot_unique') THEN
    ALTER TABLE "asset_usages" ADD CONSTRAINT "asset_usages_asset_target_slot_unique" UNIQUE("asset_id","target_type","target_id","slot_type","slot_key");
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'course_completion_record_course_profile_cycle_key') THEN
    ALTER TABLE "course_completion_record" ADD CONSTRAINT "course_completion_record_course_profile_cycle_key" UNIQUE("course_id","profile_id","cycle_number");
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tag_assignment_tag_course_key') THEN
    ALTER TABLE "tag_assignment" ADD CONSTRAINT "tag_assignment_tag_course_key" UNIQUE("tag_id","course_id");
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lesson_video_progress_lesson_profile_asset_unique') THEN
    ALTER TABLE "lesson_video_progress" ADD CONSTRAINT "lesson_video_progress_lesson_profile_asset_unique" UNIQUE("lesson_id","profile_id","asset_id");
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cohort_goal_assignment_goal_id_cohort_member_id_unique') THEN
    ALTER TABLE "cohort_goal_assignment" ADD CONSTRAINT "cohort_goal_assignment_goal_id_cohort_member_id_unique" UNIQUE("goal_id","cohort_member_id");
  END IF;
END $$;
