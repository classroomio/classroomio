ALTER TABLE "lesson" ADD COLUMN "slides" jsonb DEFAULT '[]'::jsonb;
--> statement-breakpoint
UPDATE "lesson"
SET "slides" = jsonb_build_array(
  jsonb_build_object(
    'id', 'legacy-slide-url',
    'src', trim("slide_url"),
    'platform', CASE
      WHEN "slide_url" ILIKE '%docs.google.com%' THEN 'google-slides'
      WHEN "slide_url" ILIKE '%canva.com%' THEN 'canva'
      WHEN "slide_url" ILIKE '%onedrive.live.com%'
        OR "slide_url" ILIKE '%officeapps.live.com%'
        OR "slide_url" ILIKE '%1drv.ms%'
        OR "slide_url" ILIKE '%sharepoint.com%' THEN 'powerpoint'
      WHEN "slide_url" ILIKE '%icloud.com%' THEN 'keynote'
      WHEN "slide_url" ILIKE '%figma.com%' THEN 'figma'
      WHEN "slide_url" ILIKE '%prezi.com%' THEN 'prezi'
      WHEN "slide_url" ILIKE '%pitch.com%' THEN 'pitch'
      WHEN "slide_url" ILIKE '%gamma.app%' THEN 'gamma'
      WHEN "slide_url" ILIKE '%slideshare.net%' THEN 'slideshare'
      WHEN "slide_url" ILIKE '%beautiful.ai%' THEN 'beautiful'
      ELSE 'google-slides'
    END
  )
)
WHERE "slide_url" IS NOT NULL
  AND length(trim("slide_url")) > 0
  AND (
    "slide_url" ILIKE '%docs.google.com%'
    OR "slide_url" ILIKE '%canva.com%'
    OR "slide_url" ILIKE '%onedrive.live.com%'
    OR "slide_url" ILIKE '%officeapps.live.com%'
    OR "slide_url" ILIKE '%1drv.ms%'
    OR "slide_url" ILIKE '%sharepoint.com%'
    OR "slide_url" ILIKE '%icloud.com%'
    OR "slide_url" ILIKE '%figma.com%'
    OR "slide_url" ILIKE '%prezi.com%'
    OR "slide_url" ILIKE '%pitch.com%'
    OR "slide_url" ILIKE '%gamma.app%'
    OR "slide_url" ILIKE '%slideshare.net%'
    OR "slide_url" ILIKE '%beautiful.ai%'
  );
