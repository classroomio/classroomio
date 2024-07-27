CREATE TABLE IF NOT EXISTS "public"."pathway" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" character varying NOT NULL,
    "description" character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "group_id" "uuid",
    "is_template" boolean DEFAULT true,
    "logo" "text" DEFAULT ''::"text" NOT NULL,
    "slug" character varying,
    "landingpage" "jsonb" DEFAULT '{"goals": "", "description": "", "requirements": ""}'::"jsonb" NOT NULL,
    "settings" "jsonb" DEFAULT '{"is_certificate_downloadable": false, "certificate_theme": "", "requirements": ""}'::"jsonb" NOT NULL,
    "cost" bigint DEFAULT '0'::bigint,
    "currency" character varying DEFAULT 'NGN'::character varying NOT NULL,
    "banner_image" "text",
    "is_published" boolean DEFAULT false,
    "status" "text" DEFAULT 'ACTIVE'::"text" NOT NULL
);
ALTER TABLE "public"."pathway" OWNER TO "postgres";
ALTER TABLE ONLY "public"."pathway"
    ADD CONSTRAINT "pathway_pkey" PRIMARY KEY ("id");
    
GRANT ALL ON TABLE "public"."pathway" TO "anon";
GRANT ALL ON TABLE "public"."pathway" TO "authenticated";
GRANT ALL ON TABLE "public"."pathway" TO "service_role";


CREATE TABLE IF NOT EXISTS "public"."pathway_course" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "order" bigint,
    "pathway_id" "uuid",
    "course_id" "uuid"
);
ALTER TABLE "public"."pathway_course" OWNER TO "postgres";
ALTER TABLE ONLY "public"."pathway_course"
    ADD CONSTRAINT "pathway_course_pkey" PRIMARY KEY ("id");

GRANT ALL ON TABLE "public"."pathway_course" TO "anon";
GRANT ALL ON TABLE "public"."pathway_course" TO "authenticated";
GRANT ALL ON TABLE "public"."pathway_course" TO "service_role";

ALTER TABLE ONLY "public"."pathway_course"
    ADD CONSTRAINT "pathway_course_pathway_id_fkey" FOREIGN KEY ("pathway_id") REFERENCES "public"."pathway"("id");

ALTER TABLE ONLY "public"."pathway_course"
    ADD CONSTRAINT "pathway_course_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id");



alter table "public"."pathway" add constraint "public_pathway_group_id_fkey" FOREIGN KEY (group_id) REFERENCES "group"(id) not valid;

alter table "public"."pathway" validate constraint "public_pathway_group_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_pathways(org_id_arg uuid, profile_id_arg uuid)
 RETURNS TABLE(id uuid, org_id uuid, title character varying, slug character varying, description character varying, logo text, banner_image text, cost bigint, currency character varying, is_published boolean, total_course bigint, total_students bigint, member_profile_id uuid)
 LANGUAGE plpgsql
AS $function$

BEGIN
  Return query
  select pathway.id, organization.id AS org_id, pathway.title, pathway.slug, pathway.description, pathway.logo, pathway.banner_image, pathway.cost, pathway.currency, pathway.is_published, (select COUNT(*) from pathway_course as pc where pc.pathway_id = pathway.id) AS total_courses, (select COUNT(*) from groupmember as gm where gm.group_id = pathway.group_id AND gm.role_id = 3) as total_students, (select groupmember.profile_id from groupmember where groupmember.group_id = "group".id and groupmember.profile_id =  profile_id_arg) as member_profile_id
  from pathway
  join "group" on "group".id = pathway.group_id
  join organization on organization.id = "group".organization_id
  where pathway.status = 'ACTIVE' AND organization.id = org_id_arg
  -- GROUP BY pathway.id, groupmember.profile_id
  ORDER BY pathway.created_at DESC;
END;
$function$
;