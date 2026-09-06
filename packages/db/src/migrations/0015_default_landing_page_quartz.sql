--> Move organisations off the old `minimal` default onto `quartz`.
--> Only rows that actually stored a theme are touched: organisations that never
--> saved landing-page settings have `{}` (or no `theme` key) and resolve the new
--> default in code, so they need no write here.
UPDATE "organization"
SET "landingpage" = jsonb_set("landingpage", '{theme}', '"quartz"', true)
WHERE "landingpage" ->> 'theme' = 'minimal';
