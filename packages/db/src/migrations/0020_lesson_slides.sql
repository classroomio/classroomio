ALTER TABLE "lesson" ADD COLUMN "slides" jsonb DEFAULT '[]'::jsonb;
--> statement-breakpoint
WITH slide_backfill AS (
  SELECT
    "id",
    trim("slide_url") AS raw_url,
    lower(
      regexp_replace(
        regexp_replace(trim("slide_url"), '^https?://([^/]+).*$', '\1'),
        '^www\.',
        ''
      )
    ) AS host
  FROM "lesson"
  WHERE "slide_url" IS NOT NULL
    AND length(trim("slide_url")) > 0
),
normalized AS (
  SELECT
    slide_backfill."id",
    slide_backfill.raw_url,
    slide_backfill.host,
    CASE
      WHEN slide_backfill.host = 'canva.com' OR slide_backfill.host LIKE '%.canva.com' THEN
        CASE
          WHEN regexp_replace(
            regexp_replace(slide_backfill.raw_url, '/(edit|watch)(/|$)', '/view', 'gi'),
            '/view/?$',
            '/view',
            'i'
          ) ~ '[?&]embed(?:[=&]|$)' THEN
            regexp_replace(
              regexp_replace(slide_backfill.raw_url, '/(edit|watch)(/|$)', '/view', 'gi'),
              '/view/?$',
              '/view',
              'i'
            )
          WHEN regexp_replace(
            regexp_replace(slide_backfill.raw_url, '/(edit|watch)(/|$)', '/view', 'gi'),
            '/view/?$',
            '/view',
            'i'
          ) LIKE '%?%' THEN
            regexp_replace(
              regexp_replace(slide_backfill.raw_url, '/(edit|watch)(/|$)', '/view', 'gi'),
              '/view/?$',
              '/view',
              'i'
            ) || '&embed'
          ELSE
            regexp_replace(
              regexp_replace(slide_backfill.raw_url, '/(edit|watch)(/|$)', '/view', 'gi'),
              '/view/?$',
              '/view',
              'i'
            ) || '?embed'
        END
      ELSE slide_backfill.raw_url
    END AS normalized_src,
    CASE
      WHEN slide_backfill.host = 'docs.google.com' THEN 'google-slides'
      WHEN slide_backfill.host = 'canva.com' OR slide_backfill.host LIKE '%.canva.com' THEN 'canva'
      WHEN slide_backfill.host = 'onedrive.live.com' OR slide_backfill.host LIKE '%.onedrive.live.com'
        OR slide_backfill.host = 'officeapps.live.com' OR slide_backfill.host LIKE '%.officeapps.live.com'
        OR slide_backfill.host = '1drv.ms'
        OR slide_backfill.host = 'sharepoint.com' OR slide_backfill.host LIKE '%.sharepoint.com' THEN 'powerpoint'
      WHEN slide_backfill.host = 'icloud.com' OR slide_backfill.host LIKE '%.icloud.com' THEN 'keynote'
      WHEN slide_backfill.host = 'figma.com' OR slide_backfill.host LIKE '%.figma.com'
        OR slide_backfill.host = 'embed.figma.com' THEN 'figma'
      WHEN slide_backfill.host = 'prezi.com' OR slide_backfill.host LIKE '%.prezi.com' THEN 'prezi'
      WHEN slide_backfill.host = 'pitch.com' OR slide_backfill.host LIKE '%.pitch.com' THEN 'pitch'
      WHEN slide_backfill.host = 'gamma.app' OR slide_backfill.host LIKE '%.gamma.app' THEN 'gamma'
      WHEN slide_backfill.host = 'slideshare.net' OR slide_backfill.host LIKE '%.slideshare.net' THEN 'slideshare'
      WHEN slide_backfill.host = 'beautiful.ai' OR slide_backfill.host LIKE '%.beautiful.ai' THEN 'beautiful'
      ELSE NULL
    END AS platform
  FROM slide_backfill
)
UPDATE "lesson"
SET "slides" = jsonb_build_array(
  jsonb_build_object(
    'id', 'legacy-slide-url',
    'src', normalized.normalized_src,
    'platform', normalized.platform
  )
)
FROM normalized
WHERE "lesson"."id" = normalized."id"
  AND normalized.platform IS NOT NULL;
