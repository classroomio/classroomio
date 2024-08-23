 /** DROP POLICY IF EXISTS "Enable access to all users" ON "public"."course";
DROP POLICY IF EXISTS "User must be an org member to DELETE" ON "public"."course";
DROP POLICY IF EXISTS "User must be an org member to INSERT" ON "public"."course";
DROP POLICY IF EXISTS "User must be an org member to UPDATE" ON "public"."course";

ALTER TABLE "public" . "group" 
ADD CONSTRAINT "fk_course" FOREIGN KEY (course_id) REFERENCES "public"."course"(id);
**/