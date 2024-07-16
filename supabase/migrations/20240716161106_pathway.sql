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

CREATE TABLE IF NOT EXISTS "public"."pathway_course" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "order" bigint,
    "pathway_id" "uuid",
    "course_id" "uuid"
);

ALTER TABLE ONLY "public"."pathway_course"
    ADD CONSTRAINT "pathway_course_pathway_id_fkey" FOREIGN KEY ("pathway_id") REFERENCES "public"."pathway"("id");

ALTER TABLE ONLY "public"."pathway_course"
    ADD CONSTRAINT "pathway_course_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id");
