CREATE INDEX "idx_course_group_id" ON "course" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_group_organization_id" ON "group" USING btree ("organization_id");